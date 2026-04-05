import { NextRequest, NextResponse } from 'next/server';
import type { LeaveSessionResponse } from '@/app/sessions/[sessionId]/types';

const COLLAB_SERVICE_URL = process.env.COLLAB_SERVICE_URL ?? 'http://localhost:4003';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // call collab service to delete the session from the DB
    const deleteResponse = await fetch(
      `${COLLAB_SERVICE_URL}/sessions/${sessionId}`, // ← full path including sessionId
      { method: 'DELETE' }
    );

    if (deleteResponse.status === 404) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!deleteResponse.ok) {
      return NextResponse.json({ error: 'Failed to leave session' }, { status: 502 });
    }

    return NextResponse.json({
      sessionId,
      status: 'left',
      redirectTo: '/dashboard',
    } satisfies LeaveSessionResponse);
  } catch {
    // collab service unreachable
    return NextResponse.json({ error: 'Collaboration service unavailable' }, { status: 503 });
  }
}
