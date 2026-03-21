import { NextRequest, NextResponse } from 'next/server';
import { forwardAuthHeaders } from '@/lib/auth';

const AI_ASSISTANT_SERVICE_URL =
  process.env.AI_ASSISTANT_SERVICE_URL ?? 'http://localhost:4002';

interface ProxyAssistantStreamOptions {
  request: NextRequest;
  path: string;
  body: unknown;
  unavailableMessage: string;
}

export async function proxyAssistantStream({
  request,
  path,
  body,
  unavailableMessage,
}: ProxyAssistantStreamOptions) {
  try {
    const upstreamResponse = await fetch(`${AI_ASSISTANT_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...forwardAuthHeaders(request),
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const contentType = upstreamResponse.headers.get('content-type') ?? '';
    if (!upstreamResponse.ok) {
      if (contentType.includes('application/json')) {
        const data = await upstreamResponse.json();
        return NextResponse.json(data, { status: upstreamResponse.status });
      }

      return NextResponse.json(
        { error: unavailableMessage },
        { status: upstreamResponse.status }
      );
    }

    if (!upstreamResponse.body) {
      return NextResponse.json({ error: unavailableMessage }, { status: 503 });
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': contentType || 'text/event-stream; charset=utf-8',
        'Cache-Control':
          upstreamResponse.headers.get('cache-control') ?? 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return NextResponse.json({ error: unavailableMessage }, { status: 503 });
  }
}
