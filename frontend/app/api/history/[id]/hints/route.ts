import { proxyAssistantStream } from '@/lib/assistant-stream-proxy';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { id } = await params;
    return proxyAssistantStream({
      request,
      path: '/assistant/hints',
      body: {
        ...(typeof body === 'object' && body !== null ? body : {}),
        sessionId: id,
      },
      unavailableMessage: 'AI hints service unavailable',
    });
  } catch {
    return NextResponse.json(
      { error: 'AI hints service unavailable' },
      { status: 503 }
    );
  }
}
