import type { Request, Response } from 'express';
import { buildExplainPrompt } from './explain.prompt';
import { explainRequestSchema } from './explain.schema';
import {
  getExplainInputViolation,
  validateExplainChunk,
  validateFinalExplainResponse,
} from './guardrails';
import { getExplainModel } from './provider';
import { assistantConfig } from './config';
import { streamAssistantResponse } from './stream-assistant-response';

export async function handleExplainRequest(req: Request, res: Response) {
  await streamAssistantResponse({
    req,
    res,
    feature: 'explain',
    requestSchema: explainRequestSchema,
    buildPrompt: buildExplainPrompt,
    getInputViolation: getExplainInputViolation,
    validateChunk: validateExplainChunk,
    validateFinalResponse: validateFinalExplainResponse,
    getModel: getExplainModel,
    modelName: assistantConfig.explainModel,
    invalidRequestMessage: 'Invalid explain request',
    unavailableMessage: 'AI explain service unavailable',
  });
}
