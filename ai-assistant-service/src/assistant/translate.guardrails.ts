import type { TranslateRequest } from './translate.schema';
import { containsSecrets, matchesAnyPattern } from './guardrail-common';

const INPUT_REFUSAL_PATTERNS = [
  /ignore (all|any|the) (previous|prior|above) instructions/i,
  /reveal (the )?(system|developer|hidden) (prompt|instruction|message)/i,
  /show (the )?(system|developer|hidden) (prompt|instruction|message)/i,
  /\bfull solution\b/i,
  /\bcomplete solution\b/i,
  /\bsolve the problem\b/i,
  /\bwrite the answer\b/i,
  /\bexploit\b/i,
  /\billegal\b/i,
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
];

export function getTranslateInputViolation(request: TranslateRequest): string | null {
  const combinedContext = [
    request.questionDescription,
    request.questionConstraints.join('\n'),
    ...request.questionExamples.flatMap((example) => [
      example.input,
      example.output,
      example.explanation ?? '',
    ]),
  ].join('\n');

  if (matchesAnyPattern(combinedContext, INPUT_REFUSAL_PATTERNS)) {
    return 'Translate is limited to translating code between supported languages.';
  }

  return null;
}

export function validateTranslateChunk(
  chunk: string,
  _request: TranslateRequest
): { ok: true; sanitized: string } | { ok: false; reason: string } {
  const sanitized = chunk.replace(/\u0000/g, '');

  if (matchesAnyPattern(sanitized, OUTPUT_REFUSAL_PATTERNS)) {
    return {
      ok: false,
      reason: 'The translation was blocked because it tried to reveal restricted assistant details.',
    };
  }

  if (containsSecrets(sanitized)) {
    return {
      ok: false,
      reason: 'The translation was blocked because it appeared to contain sensitive credentials or secrets.',
    };
  }

  return { ok: true, sanitized };
}

export function validateFinalTranslateResponse(
  response: string,
  request: TranslateRequest
): { ok: true } | { ok: false; reason: string } {
  if (!response.trim()) {
    return {
      ok: false,
      reason: 'The AI assistant could not produce a safe translation for this code.',
    };
  }

  const finalChunkResult = validateTranslateChunk(response, request);
  if (!finalChunkResult.ok) {
    return finalChunkResult;
  }

  return { ok: true };
}
