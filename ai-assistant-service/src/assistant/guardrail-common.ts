const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bAIza[0-9A-Za-z\-_]{20,}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}\b/,
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
];

function normalizeCodeBlock(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function normalizeCodeLine(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function extractCodeBlocks(markdown: string): string[] {
  return Array.from(markdown.matchAll(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g)).map(
    (match) => match[1]
  );
}

function buildAllowedCodeLineSet(codeSources: string[]): Set<string> {
  return new Set(
    codeSources
      .flatMap((source) => source.split('\n'))
      .map(normalizeCodeLine)
      .filter(Boolean)
  );
}

export function matchesAnyPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

export function containsSecrets(value: string): boolean {
  return matchesAnyPattern(value, SECRET_PATTERNS);
}

export function containsNovelCodeBlock(markdown: string, codeSources: string[]): boolean {
  const allowedCode = codeSources.map(normalizeCodeBlock);
  const allowedLines = buildAllowedCodeLineSet(codeSources);

  return extractCodeBlocks(markdown).some((block) => {
    const normalizedBlock = normalizeCodeBlock(block);

    if (normalizedBlock.length < 40) {
      return false;
    }

    if (allowedCode.some((source) => source.includes(normalizedBlock))) {
      return false;
    }

    const normalizedLines = block
      .split('\n')
      .map(normalizeCodeLine)
      .filter(Boolean);

    if (normalizedLines.length === 0) {
      return false;
    }

    const matchingLineCount = normalizedLines.filter((line) => allowedLines.has(line)).length;
    const overlapRatio = matchingLineCount / normalizedLines.length;

    return overlapRatio < 0.75;
  });
}
