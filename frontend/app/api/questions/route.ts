import { NextRequest, NextResponse } from 'next/server';
import type { Difficulty, PaginatedResponse } from '@/lib/types';
import type { QuestionListElement, QuestionStatus } from '@/app/questions/types';
import { forwardAuthHeaders } from '@/lib/auth';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

interface QuestionServiceResponse {
  _id: string;
  title: string;
  slug: string;
  topics: string[];
  difficulty: Difficulty;
  status: QuestionStatus;
}

interface QuestionServicePaginatedResponse {
  data: QuestionServiceResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function mapQuestion(raw: QuestionServiceResponse): QuestionListElement {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    topics: raw.topics,
    difficulty: raw.difficulty as QuestionListElement['difficulty'],
    status: (raw.status as QuestionListElement['status']),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') ?? '';
    const topic = searchParams.get('topic') ?? '';
    const difficulty = searchParams.get('difficulty') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10));
    const upstreamParams = new URLSearchParams();

    if (search) upstreamParams.set('search', search);
    if (topic) upstreamParams.set('topic', topic);
    if (difficulty) upstreamParams.set('difficulty', difficulty);
    upstreamParams.set('page', String(page));
    upstreamParams.set('size', String(pageSize));

    const queryString = upstreamParams.toString();
    const res = await fetch(
      `${QUESTION_SERVICE_URL}/questions${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          ...forwardAuthHeaders(request),
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Question service unavailable' },
        { status: res.status }
      );
    }

    const body: QuestionServicePaginatedResponse = await res.json();

    const response: PaginatedResponse<QuestionListElement> = {
      data: body.data.map(mapQuestion),
      total: body.total,
      page: body.page,
      pageSize: body.pageSize,
      totalPages: body.totalPages,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: 'Question service unavailable' },
      { status: 503 }
    );
  }
}
