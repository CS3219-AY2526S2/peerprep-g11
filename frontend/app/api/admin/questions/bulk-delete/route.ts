import { NextRequest, NextResponse } from 'next/server';
import { getCurrentServerUser } from '@/lib/server-auth';
import { Role, forwardAuthHeaders } from '@/lib/auth';
import type { BulkDeleteQuestionsRequest, BulkDeleteQuestionsResponse } from '@/app/questions/types';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

function getErrorMessage(payload: unknown): { message: string; missingSlugs?: string[] } {
  if (!payload || typeof payload !== 'object') {
    return { message: 'Failed to delete questions' };
  }

  if ('detail' in payload && payload.detail && typeof payload.detail === 'object') {
    const detail = payload.detail as { message?: string; missingSlugs?: string[] };
    return {
      message: detail.message ?? 'Failed to delete questions',
      missingSlugs: detail.missingSlugs,
    };
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return { message: payload.error };
  }

  return { message: 'Failed to delete questions' };
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const user = await getCurrentServerUser(token);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: BulkDeleteQuestionsRequest;

  try {
    body = (await request.json()) as BulkDeleteQuestionsRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!Array.isArray(body.slugs) || body.slugs.length === 0) {
    return NextResponse.json({ error: 'Please select at least one question' }, { status: 400 });
  }

  try {
    const response = await fetch(`${QUESTION_SERVICE_URL}/questions/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(request),
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = getErrorMessage(payload);
      return NextResponse.json(
        {
          error: error.message,
          missingSlugs: error.missingSlugs,
        } satisfies Partial<BulkDeleteQuestionsResponse>,
        { status: response.status }
      );
    }

    return NextResponse.json(payload as BulkDeleteQuestionsResponse, {
      status: response.status,
    });
  } catch {
    return NextResponse.json({ error: 'Question service unavailable' }, { status: 503 });
  }
}
