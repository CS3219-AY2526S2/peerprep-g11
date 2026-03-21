export interface ParsedSseEvent<T = unknown> {
  event: string;
  data: T;
}

function parseEventBlock<T>(rawBlock: string): ParsedSseEvent<T> | null {
  const lines = rawBlock.split('\n');
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue;
    }

    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return {
    event: eventName,
    data: JSON.parse(dataLines.join('\n')) as T,
  };
}

export async function readSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ParsedSseEvent) => void
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      let boundaryIndex = buffer.indexOf('\n\n');
      while (boundaryIndex !== -1) {
        const rawBlock = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + 2);

        const parsed = parseEventBlock(rawBlock);
        if (parsed) {
          onEvent(parsed);
        }

        boundaryIndex = buffer.indexOf('\n\n');
      }
    }

    const trailing = buffer + decoder.decode();
    if (trailing.trim()) {
      const parsed = parseEventBlock(trailing);
      if (parsed) {
        onEvent(parsed);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
