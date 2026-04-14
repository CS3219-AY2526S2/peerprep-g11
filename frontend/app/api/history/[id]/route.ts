import { NextRequest, NextResponse } from 'next/server';
import { forwardAuthHeaders } from '@/lib/auth';
import { normalizeProgrammingLanguage } from '@/lib/programming-languages';

const QUESTION_SERVICE_URL =
  process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authHeaders = forwardAuthHeaders(request);
    const res = await fetch(`${QUESTION_SERVICE_URL}/history/${id}`, {
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'History entry not found' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const normalizedLanguage =
      typeof data === 'object' && data !== null && 'language' in data
        ? normalizeProgrammingLanguage(
            typeof data.language === 'string' ? data.language : null
          )
        : null;

    return NextResponse.json(
      normalizedLanguage
        ? {
            ...data,
            language: normalizedLanguage,
          }
        : data
    );
  } catch {
    return NextResponse.json(
      { error: 'History service unavailable' },
      { status: 503 }
    );
  }
}
