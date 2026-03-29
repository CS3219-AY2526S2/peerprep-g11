import { NextRequest, NextResponse } from 'next/server';
import { forwardAuthHeaders } from '@/lib/auth';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

interface TopicsResponse {
  topics: string[];
  topicDifficulties?: Record<string, string[]>;
}

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${QUESTION_SERVICE_URL}/questions/topics`, {
      headers: {
        ...forwardAuthHeaders(request),
      },
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
