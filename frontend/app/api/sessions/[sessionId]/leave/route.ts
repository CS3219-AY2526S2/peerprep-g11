// TODO: Replace this mock implementation with a collaboration/matching service
// leave call when session lifecycle APIs are available.

import { NextResponse } from 'next/server';
import type { LeaveSessionResponse } from '@/app/sessions/[sessionId]/types';

const KNOWN_SESSION_IDS = new Set(['mock-match-001', 'mock-match-002']);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!KNOWN_SESSION_IDS.has(sessionId)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      sessionId,
      status: 'left',
      redirectTo: '/dashboard',
    } satisfies LeaveSessionResponse);
  } catch {
    return NextResponse.json(
      { error: 'Unable to leave session right now' },
      { status: 503 }
    );
  }
}
