import { ReadableStream } from "node:stream/web";
import { TextEncoder } from "node:util";

import { readSseStream } from "@/lib/sse";

function createStream(...chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });
}

describe("readSseStream", () => {
  it("parses default message events", async () => {
    const events: Array<{ event: string; data: unknown }> = [];

    await readSseStream(createStream('data: {"answer":1}\n\n'), (event) => {
      events.push(event);
    });

    expect(events).toEqual([{ event: "message", data: { answer: 1 } }]);
  });

  it("parses named events with multiline data", async () => {
    const events: Array<{ event: string; data: unknown }> = [];

    await readSseStream(
      createStream('event: update\ndata: {"first":1,\ndata: "second":2}\n\n'),
      (event) => {
        events.push(event);
      }
    );

    expect(events).toEqual([
      { event: "update", data: { first: 1, second: 2 } },
    ]);
  });

  it("ignores comments and blocks without data", async () => {
    const events: Array<{ event: string; data: unknown }> = [];

    await readSseStream(
      createStream(": keepalive\n\nevent: noop\n\n", 'data: {"ok":true}\n\n'),
      (event) => {
        events.push(event);
      }
    );

    expect(events).toEqual([{ event: "message", data: { ok: true } }]);
  });

  it("parses a trailing event split across chunks", async () => {
    const events: Array<{ event: string; data: unknown }> = [];

    await readSseStream(
      createStream('event: final\ndata: {"message"', ': "done"}'),
      (event) => {
        events.push(event);
      }
    );

    expect(events).toEqual([
      { event: "final", data: { message: "done" } },
    ]);
  });
});
