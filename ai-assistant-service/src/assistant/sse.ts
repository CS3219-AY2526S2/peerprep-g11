import type { Response } from 'express';

export type AssistantFeature = 'explain' | 'hints' | 'translate';
export type AssistantFinishReason = 'stop' | 'length' | 'refusal';

export class SseWriter {
  constructor(private readonly res: Response) {}

  open() {
    this.res.status(200);
    this.res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    this.res.setHeader('Cache-Control', 'no-cache, no-transform');
    this.res.setHeader('Connection', 'keep-alive');
    this.res.setHeader('X-Accel-Buffering', 'no');
    this.res.flushHeaders?.();
  }

  write(event: 'meta' | 'chunk' | 'done' | 'error', payload: unknown) {
    this.res.write(`event: ${event}\n`);
    this.res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  close() {
    this.res.end();
  }
}

function hasUnclosedCodeFence(value: string): boolean {
  const fenceMatches = value.match(/```/g);
  return Boolean(fenceMatches && fenceMatches.length % 2 === 1);
}

export function extractReleasableChunks(buffer: string): {
  chunks: string[];
  remaining: string;
} {
  const chunks: string[] = [];
  let remaining = buffer;

  while (remaining.length > 0) {
    const firstFenceIndex = remaining.indexOf('```');
    const paragraphBreakIndex = remaining.indexOf('\n\n');

    if (
      paragraphBreakIndex !== -1 &&
      (firstFenceIndex === -1 || paragraphBreakIndex < firstFenceIndex)
    ) {
      const endIndex = paragraphBreakIndex + 2;
      chunks.push(remaining.slice(0, endIndex));
      remaining = remaining.slice(endIndex);
      continue;
    }

    if (firstFenceIndex !== -1) {
      const closingFenceIndex = remaining.indexOf('```', firstFenceIndex + 3);
      if (closingFenceIndex === -1) {
        break;
      }

      const trailingParagraphBreak = remaining.indexOf('\n\n', closingFenceIndex + 3);
      const endIndex =
        trailingParagraphBreak === -1 ? closingFenceIndex + 3 : trailingParagraphBreak + 2;
      chunks.push(remaining.slice(0, endIndex));
      remaining = remaining.slice(endIndex);
      continue;
    }

    if (!hasUnclosedCodeFence(remaining) && remaining.length >= 240) {
      const splitIndex = remaining.lastIndexOf('\n', 220);
      if (splitIndex > 0) {
        chunks.push(remaining.slice(0, splitIndex + 1));
        remaining = remaining.slice(splitIndex + 1);
        continue;
      }
    }

    break;
  }

  return { chunks, remaining };
}
