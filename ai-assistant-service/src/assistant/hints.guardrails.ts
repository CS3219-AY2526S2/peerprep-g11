import type { HintsRequest } from './hints.schema';
import {
  containsNovelCodeBlock,
  containsSecrets,
  matchesAnyPattern,
} from './guardrail-common';

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all|any|the) (previous|prior|above) instructions/i,
  /reveal (the )?(system|developer|hidden) (prompt|instruction|message)/i,
  /show (the )?(system|developer|hidden) (prompt|instruction|message)/i,
  /tell me (the )?(system|developer|hidden) (prompt|instruction|message)/i,
];

const FULL_ANSWER_PATTERNS = [
  /\bfull solution\b/i,
  /\bcomplete solution\b/i,
  /\bfinal answer\b/i,
  /\bwrite (the )?(code|solution|answer)\b/i,
  /\bgive me (the )?(code|solution|answer)\b/i,
  /\bsolve (the problem|this|it)\b/i,
  /\bjust give me\b/i,
  /\bcopy[- ]paste\b/i,
];

const IRRELEVANT_PATTERNS = [
  /\bweather\b/i,
  /\bstock price\b/i,
  /\bmovie recommendation\b/i,
  /\brestaurant recommendation\b/i,
  /\btravel itinerary\b/i,
  /\bnews headlines\b/i,
  /\bessay\b/i,
  /\bacademic writing\b/i,
  /\bresearch paper\b/i,
  /\bliterature review\b/i,
  /\bterm paper\b/i,
  /\bthesis\b/i,
  /\bpoem\b/i,
  /\bstory\b/i,
  /\bblog post\b/i,
  /\bemail draft\b/i,
  /\bcover letter\b/i,
  /\bresume\b/i,
  /\b1000[- ]word\b/i,
];

const OUTPUT_REFUSAL_PATTERNS = [
  /system prompt/i,
  /developer message/i,
  /hidden instruction/i,
  /internal policy/i,
  /reasoning trace/i,
  /chain[- ]of[- ]thought/i,
  /vercel ai gateway/i,
  /openai\/gpt/i,
  /\bcomplete solution\b/i,
  /\bfull solution\b/i,
  /\bfinal answer\b/i,
  /\bcopy[- ]paste\b/i,
  /\bhere(?:'| i)s (?:the )?(?:solution|answer)\b/i,
];

export const HINT_REFUSAL_MESSAGE =
  'I am not allowed to give the full answer or help with unrelated requests. I can still help with hints, debugging, or a high-level approach.';

export function getHintsInputViolation(request: HintsRequest): string | null {
  const conversation = request.messages.map((message) => message.content).join('\n');
  const latestUserMessage = request.messages[request.messages.length - 1]?.content ?? '';
  const combined = `${latestUserMessage}\n${conversation}`;

  if (matchesAnyPattern(combined, PROMPT_INJECTION_PATTERNS)) {
    return HINT_REFUSAL_MESSAGE;
  }

  if (matchesAnyPattern(latestUserMessage, FULL_ANSWER_PATTERNS)) {
    return HINT_REFUSAL_MESSAGE;
  }

  if (matchesAnyPattern(latestUserMessage, IRRELEVANT_PATTERNS)) {
    return HINT_REFUSAL_MESSAGE;
  }

  return null;
}

export function validateHintsChunk(
  chunk: string,
  request: HintsRequest
): { ok: true; sanitized: string } | { ok: false; reason: string } {
  const sanitized = chunk.replace(/\u0000/g, '');

  if (matchesAnyPattern(sanitized, OUTPUT_REFUSAL_PATTERNS)) {
    return {
      ok: false,
      reason: HINT_REFUSAL_MESSAGE,
    };
  }

  if (containsSecrets(sanitized)) {
    return {
      ok: false,
      reason: 'The hint response was blocked because it appeared to contain sensitive credentials or secrets.',
    };
  }

  if (containsNovelCodeBlock(sanitized, [request.fullCode])) {
    return {
      ok: false,
      reason: HINT_REFUSAL_MESSAGE,
    };
  }

  return { ok: true, sanitized };
}

export function validateFinalHintsResponse(
  response: string,
  request: HintsRequest
): { ok: true } | { ok: false; reason: string } {
  if (!response.trim()) {
    return {
      ok: false,
      reason: HINT_REFUSAL_MESSAGE,
    };
  }

  const finalChunkResult = validateHintsChunk(response, request);
  if (!finalChunkResult.ok) {
    return finalChunkResult;
  }

  return { ok: true };
}
