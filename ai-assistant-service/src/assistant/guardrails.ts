import type { ExplainRequest } from './explain.schema';
import {
  containsNovelCodeBlock,
  containsSecrets,
  matchesAnyPattern,
} from './guardrail-common';

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
  /\bcomplete solution\b/i,
  /\bfull solution\b/i,
  /\bhere(?:'| i)s a solution\b/i,
];

export function getExplainInputViolation(request: ExplainRequest): string | null {
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
    return 'Explain is limited to explaining the selected code for the current problem.';
  }

  return null;
}

export function validateExplainChunk(
  chunk: string,
  request: ExplainRequest
): { ok: true; sanitized: string } | { ok: false; reason: string } {
  const sanitized = chunk.replace(/\u0000/g, '');

  if (matchesAnyPattern(sanitized, OUTPUT_REFUSAL_PATTERNS)) {
    return {
      ok: false,
      reason: 'The explanation was blocked because it tried to reveal restricted assistant details or provide a disallowed answer.',
    };
  }

  if (containsSecrets(sanitized)) {
    return {
      ok: false,
      reason: 'The explanation was blocked because it appeared to contain sensitive credentials or secrets.',
    };
  }

  if (containsNovelCodeBlock(sanitized, [request.selectedCode, request.fullCode])) {
    return {
      ok: false,
      reason: 'The explanation was blocked because it attempted to introduce new code instead of explaining the submitted snippet.',
    };
  }

  return { ok: true, sanitized };
}

export function validateFinalExplainResponse(
  response: string,
  request: ExplainRequest
): { ok: true } | { ok: false; reason: string } {
  if (!response.trim()) {
    return {
      ok: false,
      reason: 'The AI assistant could not produce a safe explanation for this selection.',
    };
  }

  const finalChunkResult = validateExplainChunk(response, request);
  if (!finalChunkResult.ok) {
    return finalChunkResult;
  }

  return { ok: true };
}
