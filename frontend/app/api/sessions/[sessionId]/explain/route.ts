import { proxyAssistantStream } from '@/lib/assistant-stream-proxy';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { sessionId } = await params;
    return proxyAssistantStream({
      request,
      path: '/assistant/explain',
      body: {
        ...(typeof body === 'object' && body !== null ? body : {}),
        sessionId,
      },
      unavailableMessage: 'AI explain service unavailable',
    });
  } catch {
    return NextResponse.json(
      { error: 'AI explain service unavailable' },
      { status: 503 }
    );
  }
}
