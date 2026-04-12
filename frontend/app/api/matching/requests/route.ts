import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, forwardAuthHeaders } from '@/lib/auth';

const MATCHING_SERVICE_URL =
  process.env.MATCHING_SERVICE_URL ?? 'http://localhost:8080';

/**
 * Starts a matching session for the current user.
 * @returns Success message if successful, error message if unsuccessful
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty, language } = body;

    const res = await fetchWithAuth(`${MATCHING_SERVICE_URL}/matching/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(request),
      },
      body: JSON.stringify({ topic, difficulty, language }),
    });

    const text = await res.text();

    // Try parsing JSON, fallback to text
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json({ message: text }, { status: res.status });
    }
  } catch (err) {
    console.error('Match start error:', err);
    return NextResponse.json({ error: 'Matching service unavailable' }, { status: 503 });
  }
}