import { NextRequest, NextResponse } from 'next/server';

// TODO: Replace mock data with real matching-service call

// Simple in-memory store to track mock request creation times (dev only)
const createdAtMap = new Map<string, number>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;

  try {
    // Track when we first saw this request
    if (!createdAtMap.has(requestId)) {
      const ts = parseInt(requestId.split('-').pop() ?? '0', 10) || Date.now();
      createdAtMap.set(requestId, ts);
    }

    const elapsed = (Date.now() - createdAtMap.get(requestId)!) / 1000;

    // TODO: Poll real matching microservice for status
    // Mock: transition to "matched" after ~10s
    const isMatched = elapsed >= 10;

    return NextResponse.json({
      requestId,
      status: isMatched ? 'matched' : 'pending',
      preferences: { topic: 'Arrays', difficulty: 'Easy', language: 'Python' },
      ...(isMatched && { matchId: 'mock-match-001', partnerName: 'Alex P.' }),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch match status' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;

  try {
    // TODO: Forward cancellation to matching microservice
    createdAtMap.delete(requestId);
    return NextResponse.json({ requestId, status: 'cancelled' });
  } catch {
    return NextResponse.json({ error: 'Failed to cancel match request' }, { status: 500 });
  }
}
