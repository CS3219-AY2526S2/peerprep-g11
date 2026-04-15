import type { Request, Response } from 'express';
import { assistantConfig } from './config';
import {
  getHintsInputViolation,
  validateFinalHintsResponse,
  validateHintsChunk,
} from './hints.guardrails';
import { buildHintsPrompt } from './hints.prompt';
import { hintsRequestSchema } from './hints.schema';
import { getHintsModel } from './provider';
import { streamAssistantResponse } from './stream-assistant-response';

export async function handleHintsRequest(req: Request, res: Response) {
  await streamAssistantResponse({
    req,
    res,
    feature: 'hints',
    requestSchema: hintsRequestSchema,
    buildPrompt: buildHintsPrompt,
    getInputViolation: getHintsInputViolation,
    validateChunk: validateHintsChunk,
    validateFinalResponse: validateFinalHintsResponse,
    getModel: getHintsModel,
    modelName: assistantConfig.hintsModel,
    invalidRequestMessage: 'Invalid hints request',
    unavailableMessage: 'AI hints service unavailable',
  });
}
