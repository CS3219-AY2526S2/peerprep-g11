import { NextRequest, NextResponse } from 'next/server';
import type { PaginatedResponse } from '@/lib/types';
import type { Question } from '@/app/questions/types';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

interface QuestionServiceResponse {
  _id: string;
  title: string;
  description: string;
  topics: string[];
  difficulty: string;
  status: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
}

function mapQuestion(raw: QuestionServiceResponse): Question {
  return {
    id: raw._id,
    title: raw.title,
    description: raw.description,
    topics: raw.topics,
    difficulty: raw.difficulty as Question['difficulty'],
    status: (raw.status as Question['status']) ?? 'Pending',
    examples: raw.examples,
    constraints: raw.constraints,
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

    const res = await fetch(`${QUESTION_SERVICE_URL}/questions/all`);
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

    if (topic) {
      filtered = filtered.filter((item) =>
        item.topics.some((t) => t.toLowerCase() === topic.toLowerCase())
      );
    }

    if (difficulty) {
      filtered = filtered.filter(
        (item) => item.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    const response: PaginatedResponse<Question> = {
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

/** Return the list of available topics for filter dropdowns */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'topics') {
      const res = await fetch(`${QUESTION_SERVICE_URL}/questions/all`);
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Question service unavailable' },
          { status: res.status }
        );
      }

      const rawQuestions: QuestionServiceResponse[] = await res.json();
      const topics = Array.from(
        new Set(rawQuestions.flatMap((q) => q.topics))
      ).sort();

      return NextResponse.json({ topics });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: 'Question service unavailable' },
      { status: 503 }
    );
  }
}
