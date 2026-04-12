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

    if (topic) upstreamParams.set('topic', topic);
    if (difficulty) upstreamParams.set('difficulty', difficulty);

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

    const rawQuestions: QuestionServiceResponse[] = await res.json();
    let filtered = rawQuestions.map(mapQuestion);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    const response: PaginatedResponse<QuestionListElement> = {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: 'Question service unavailable' },
      { status: 503 }
    );
  }
}
