import { randomUUID } from 'crypto';
import { streamText } from 'ai';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { assistantConfig, ensureAssistantConfig } from './config';
import {
  extractReleasableChunks,
  SseWriter,
  type AssistantFeature,
  type AssistantFinishReason,
} from './sse';

type AssistantModel = Parameters<typeof streamText>[0]['model'];

interface StreamAssistantResponseOptions<TRequest> {
  req: Request;
  res: Response;
  feature: AssistantFeature;
  requestSchema: z.ZodSchema<TRequest>;
  buildPrompt: (request: TRequest) => { system: string; prompt: string };
  getInputViolation: (request: TRequest) => string | null;
  validateChunk: (
    chunk: string,
    request: TRequest
  ) => { ok: true; sanitized: string } | { ok: false; reason: string };
  validateFinalResponse: (
    response: string,
    request: TRequest
  ) => { ok: true } | { ok: false; reason: string };
  getModel: () => AssistantModel;
  modelName: string;
  invalidRequestMessage: string;
  unavailableMessage: string;
}

function createAbortController(req: Request, res: Response) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new Error(`AI ${req.path} request timed out`));
  }, assistantConfig.requestTimeoutMs);

  const abortFromRequestAbort = () => {
    controller.abort(new Error('Client disconnected'));
  };

  const abortFromResponseClose = () => {
    if (!res.writableEnded) {
      controller.abort(new Error('Client disconnected'));
    }
  };

  req.on('aborted', abortFromRequestAbort);
  res.on('close', abortFromResponseClose);

  return {
    controller,
    cleanup() {
      clearTimeout(timeout);
      req.off('aborted', abortFromRequestAbort);
      res.off('close', abortFromResponseClose);
    },
  };
}

function mapFinishReason(value: string | null | undefined): AssistantFinishReason {
  if (value === 'length') {
    return 'length';
  }

  return 'stop';
}

function logAssistantResult(payload: {
  feature: AssistantFeature;
  requestId: string;
  userId: string | undefined;
  model: string;
  finishReason: AssistantFinishReason;
  refusal: boolean;
  refusalReason?: string;
  usage?: unknown;
}) {
  console.info(`AI ${payload.feature} completed`, payload);
}

export async function streamAssistantResponse<TRequest>({
  req,
  res,
  feature,
  requestSchema,
  buildPrompt,
  getInputViolation,
  validateChunk,
  validateFinalResponse,
  getModel,
  modelName,
  invalidRequestMessage,
  unavailableMessage,
}: StreamAssistantResponseOptions<TRequest>) {
  const configError = ensureAssistantConfig();
  if (configError) {
    res.status(503).json({ error: configError });
    return;
  }

  const parsedBody = requestSchema.safeParse(req.body);
  if (!parsedBody.success) {
    const firstIssue = parsedBody.error.issues[0];
    res
      .status(400)
      .json({ error: firstIssue?.message ?? invalidRequestMessage });
    return;
  }

  const assistantRequest = parsedBody.data;
  const inputViolation = getInputViolation(assistantRequest);
  if (inputViolation) {
    res.status(422).json({ error: inputViolation });
    return;
  }

  const { system, prompt } = buildPrompt(assistantRequest);
  const sse = new SseWriter(res);
  const requestId = randomUUID();
  const { controller, cleanup } = createAbortController(req, res);

  sse.open();
  sse.write('meta', { requestId, feature });

  let accumulatedResponse = '';
  let bufferedText = '';
  let finishReason: AssistantFinishReason = 'stop';
  let refusal = false;
  let refusalReason: string | undefined;

  try {
    const result = streamText({
      model: getModel(),
      system,
      prompt,
      temperature: 0.2,
      maxOutputTokens: assistantConfig.maxOutputTokens,
      abortSignal: controller.signal,
    });

    for await (const delta of result.textStream) {
      bufferedText += delta;

      const releasable = extractReleasableChunks(bufferedText);
      bufferedText = releasable.remaining;

      for (const chunk of releasable.chunks) {
        const validation = validateChunk(chunk, assistantRequest);
        if (!validation.ok) {
          refusal = true;
          finishReason = 'refusal';
          refusalReason = validation.reason;
          sse.write('error', { message: validation.reason });
          sse.write('done', { finishReason });
          cleanup();
          sse.close();
          logAssistantResult({
            feature,
            requestId,
            userId: (req as { user?: { id?: string } }).user?.id,
            model: modelName,
            finishReason,
            refusal,
            refusalReason,
          });
          return;
        }

        accumulatedResponse += validation.sanitized;
        sse.write('chunk', { delta: validation.sanitized });
      }
    }

    if (bufferedText) {
      const validation = validateChunk(bufferedText, assistantRequest);
      if (!validation.ok) {
        refusal = true;
        finishReason = 'refusal';
        refusalReason = validation.reason;
        sse.write('error', { message: validation.reason });
        sse.write('done', { finishReason });
        cleanup();
        sse.close();
        logAssistantResult({
          feature,
          requestId,
          userId: (req as { user?: { id?: string } }).user?.id,
          model: modelName,
          finishReason,
          refusal,
          refusalReason,
        });
        return;
      }

      accumulatedResponse += validation.sanitized;
      sse.write('chunk', { delta: validation.sanitized });
    }

    const finalValidation = validateFinalResponse(accumulatedResponse, assistantRequest);
    if (!finalValidation.ok) {
      refusal = true;
      finishReason = 'refusal';
      refusalReason = finalValidation.reason;
      sse.write('error', { message: refusalReason });
      sse.write('done', { finishReason });
      cleanup();
      sse.close();
      logAssistantResult({
        feature,
        requestId,
        userId: (req as { user?: { id?: string } }).user?.id,
        model: modelName,
        finishReason,
        refusal,
        refusalReason,
      });
      return;
    }

    finishReason = mapFinishReason(await result.finishReason);
    let usage: unknown;
    try {
      usage = await result.totalUsage;
    } catch {
      usage = undefined;
    }

    sse.write('done', { finishReason });
    cleanup();
    sse.close();
    logAssistantResult({
      feature,
      requestId,
      userId: (req as { user?: { id?: string } }).user?.id,
      model: modelName,
      finishReason,
      refusal,
      refusalReason,
      usage,
    });
  } catch (error) {
    cleanup();

    if (!res.writableEnded) {
      const message =
        error instanceof Error && error.message === 'Client disconnected'
          ? 'Client disconnected'
          : unavailableMessage;
      sse.write('error', { message });
      sse.close();
    }
  }
}
