function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const assistantConfig = {
  gatewayApiKey: process.env.AI_GATEWAY_API_KEY ?? '',
  explainModel: process.env.AI_EXPLAIN_MODEL ?? 'openai/gpt-5-mini',
  hintsModel: process.env.AI_HINTS_MODEL ?? process.env.AI_EXPLAIN_MODEL ?? 'openai/gpt-5-mini',
  maxInputChars: parsePositiveInt(process.env.AI_MAX_INPUT_CHARS, 20000),
  maxSelectedChars: parsePositiveInt(process.env.AI_MAX_SELECTED_CHARS, 4000),
  maxHintMessages: parsePositiveInt(process.env.AI_MAX_HINT_MESSAGES, 12),
  maxHintMessageChars: parsePositiveInt(process.env.AI_MAX_HINT_MESSAGE_CHARS, 2000),
  maxHintTranscriptChars: parsePositiveInt(process.env.AI_MAX_HINT_TRANSCRIPT_CHARS, 6000),
  maxOutputTokens: parsePositiveInt(process.env.AI_MAX_OUTPUT_TOKENS, 900),
  requestTimeoutMs: parsePositiveInt(process.env.AI_REQUEST_TIMEOUT_MS, 30000),
} as const;

export function ensureAssistantConfig(): string | null {
  if (!assistantConfig.gatewayApiKey) {
    return 'AI provider is not configured.';
  }

  return null;
}
