import { NextRequest, NextResponse } from 'next/server';
import { getCurrentServerUser } from '@/lib/server-auth';
import { Role, forwardAuthHeaders } from '@/lib/auth';
import type { QuestionUpsertPayload, QuestionUpsertResponse } from '@/app/questions/types';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== 'object') {
    return fallbackMessage;
  }

  if ('detail' in payload) {
    const detail = payload.detail;
    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      const firstIssue = detail.find(
        (item): item is { msg?: string } => Boolean(item && typeof item === 'object')
      );

      if (firstIssue?.msg) {
        return firstIssue.msg;
      }
    }

    if (detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string') {
      return detail.message;
    }
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  return fallbackMessage;
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
        { error: getErrorMessage(payload, 'Failed to delete question') },
        { status: response.status }
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Question service unavailable' }, { status: 503 });
  }
}

function normalizeQuestionPayload(payload: QuestionUpsertPayload): QuestionUpsertPayload {
  return {
    title: payload.title.trim(),
    description: payload.description.trim(),
    difficulty: payload.difficulty,
    topics: payload.topics.map((topic) => topic.trim()).filter(Boolean),
    constraints: payload.constraints.map((constraint) => constraint.trim()).filter(Boolean),
    examples: payload.examples
      .map((example) => ({
        input: example.input.trim(),
        output: example.output.trim(),
        explanation: example.explanation?.trim() || undefined,
      }))
      .filter((example) => example.input || example.output || example.explanation),
  };
}

function isValidPayload(payload: QuestionUpsertPayload) {
  return Boolean(
    payload.title &&
      payload.description &&
      payload.topics.length > 0 &&
      payload.constraints.length > 0 &&
      payload.examples.length > 0 &&
      payload.examples.every((example) => example.input && example.output)
  );
}

export async function PUT(
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

  let body: QuestionUpsertPayload;

  try {
    body = (await request.json()) as QuestionUpsertPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const payload = normalizeQuestionPayload(body);

  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'Please complete all required question fields' }, { status: 400 });
  }

  try {
    const response = await fetch(`${QUESTION_SERVICE_URL}/questions/${questionSlug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(request),
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: getErrorMessage(result, 'Failed to save question') },
        { status: response.status }
      );
    }

    return NextResponse.json(result as QuestionUpsertResponse, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Question service unavailable' }, { status: 503 });
  }
}
