import { NextResponse } from 'next/server';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

interface TopicsResponse {
  topics: string[];
  topicDifficulties?: Record<string, string[]>;
}

export async function GET() {
  try {
    const res = await fetch(`${QUESTION_SERVICE_URL}/questions/topics`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Question service unavailable' },
        { status: res.status }
      );
    }

    const data: TopicsResponse = await res.json();
    return NextResponse.json({
      topics: data.topics ?? [],
      topicDifficulties: data.topicDifficulties ?? {},
    });
  } catch {
    return NextResponse.json(
      { error: 'Question service unavailable' },
      { status: 503 }
    );
  }
}
