import { NextRequest, NextResponse } from 'next/server';
import type { Question } from '@/app/questions/types';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;

    const res = await fetch(`${QUESTION_SERVICE_URL}/questions/${questionId}`);

    if (res.status === 404) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Question service unavailable' },
        { status: res.status }
      );
    }

    const raw = await res.json();
    const question: Question = {
      id: raw._id,
      title: raw.title,
      description: raw.description,
      topics: raw.topics,
      difficulty: raw.difficulty,
      status: raw.status ?? 'Pending',
      examples: raw.examples,
      constraints: raw.constraints,
    };

    return NextResponse.json(question);
  } catch {
    return NextResponse.json(
      { error: 'Question service unavailable' },
      { status: 503 }
    );
  }
}
