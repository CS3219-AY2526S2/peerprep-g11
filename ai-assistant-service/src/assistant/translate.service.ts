import type { Request, Response } from 'express';
import { buildTranslatePrompt } from './translate.prompt';
import { translateRequestSchema } from './translate.schema';
import {
  getTranslateInputViolation,
  validateTranslateChunk,
  validateFinalTranslateResponse,
} from './translate.guardrails';
import { getTranslateModel } from './provider';
import { assistantConfig } from './config';
import { streamAssistantResponse } from './stream-assistant-response';

export async function handleTranslateRequest(req: Request, res: Response) {
  await streamAssistantResponse({
    req,
    res,
    feature: 'translate',
    requestSchema: translateRequestSchema,
    buildPrompt: buildTranslatePrompt,
    getInputViolation: getTranslateInputViolation,
    validateChunk: validateTranslateChunk,
    validateFinalResponse: validateFinalTranslateResponse,
    getModel: getTranslateModel,
    modelName: assistantConfig.translateModel,
    invalidRequestMessage: 'Invalid translate request',
    unavailableMessage: 'AI translate service unavailable',
  });
}
