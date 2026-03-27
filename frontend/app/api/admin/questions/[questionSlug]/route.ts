import { NextRequest, NextResponse } from 'next/server';
import { getCurrentServerUser } from '@/lib/server-auth';
import { Role, forwardAuthHeaders } from '@/lib/auth';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return 'Failed to delete question';
  }

  if ('detail' in payload) {
    const detail = payload.detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  return 'Failed to delete question';
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ questionSlug: string }> }
) {
  const token = request.cookies.get('token')?.value;
  const user = await getCurrentServerUser(token);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { questionSlug } = await context.params;

  if (!questionSlug) {
    return NextResponse.json({ error: 'Question slug is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${QUESTION_SERVICE_URL}/questions/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(request),
      },
      body: JSON.stringify({ slug: questionSlug }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: getErrorMessage(payload) },
        { status: response.status }
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Question service unavailable' }, { status: 503 });
  }
}
