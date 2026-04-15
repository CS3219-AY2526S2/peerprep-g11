import { NextRequest, NextResponse } from 'next/server';
import { getCurrentServerUser } from '@/lib/server-auth';
import { Role, forwardAuthHeaders } from '@/lib/auth';
import type {
  QuestionDuplicateCheckResponse,
  QuestionUpdatePayload,
  QuestionUpsertPayload,
  QuestionUpsertResponse,
} from '@/app/questions/types';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

interface QuestionServiceListItem {
  title?: string;
  slug?: string;
}

interface QuestionServiceListResponse {
  data?: QuestionServiceListItem[];
  totalPages?: number;
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeQuestionPayload(payload: QuestionUpsertPayload): QuestionUpsertPayload {
  return {
    title: normalizeText(payload.title),
    description: payload.description.trim(),
    difficulty: payload.difficulty,
    topics: payload.topics.map(normalizeText).filter(Boolean),
    constraints: payload.constraints.map(normalizeText).filter(Boolean),
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

async function authorizeAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const user = await getCurrentServerUser(token);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return 'Failed to save question';
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

  return 'Failed to save question';
}

export async function GET(request: NextRequest) {
  const authError = await authorizeAdmin(request);
  if (authError) {
    return authError;
  }

  const title = request.nextUrl.searchParams.get('title')?.trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const normalizedTitle = title.toLowerCase();
    let matched: QuestionServiceListItem | undefined;
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && !matched) {
      const params = new URLSearchParams({
        search: title,
        page: String(page),
        size: '100',
      });

      const response = await fetch(`${QUESTION_SERVICE_URL}/questions?${params.toString()}`, {
        headers: {
          ...forwardAuthHeaders(request),
        },
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => null)) as
        | QuestionServiceListResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        return NextResponse.json(
          { error: getErrorMessage(payload) },
          { status: response.status }
        );
      }

      const pageData = Array.isArray((payload as QuestionServiceListResponse | null)?.data)
        ? (payload as QuestionServiceListResponse).data ?? []
        : [];

      matched = pageData.find((question) => question.title?.trim().toLowerCase() === normalizedTitle);
      totalPages =
        typeof (payload as QuestionServiceListResponse | null)?.totalPages === 'number'
          ? Math.max(1, (payload as QuestionServiceListResponse).totalPages ?? 1)
          : 1;
      page += 1;
    }

    const body: QuestionDuplicateCheckResponse = matched?.title && matched.slug
      ? {
          exists: true,
          matchedQuestion: {
            title: matched.title,
            slug: matched.slug,
          },
        }
      : { exists: false };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: 'Question service unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await authorizeAdmin(request);
  if (authError) {
    return authError;
  }

  let body: QuestionUpsertPayload | QuestionUpdatePayload;

  try {
    body = (await request.json()) as QuestionUpsertPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { originalSlug: _originalSlug, ...upsertPayload } = body as QuestionUpsertPayload & {
    originalSlug?: string;
  };
  const payload = normalizeQuestionPayload(upsertPayload);

  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'Please complete all required question fields' }, { status: 400 });
  }

  try {
    const response = await fetch(`${QUESTION_SERVICE_URL}/questions/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(request),
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: getErrorMessage(result) },
        { status: response.status }
      );
    }

    return NextResponse.json(result as QuestionUpsertResponse, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Question service unavailable' }, { status: 503 });
  }
}
