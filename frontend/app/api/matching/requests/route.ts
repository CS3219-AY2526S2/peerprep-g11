import { NextRequest, NextResponse } from 'next/server';

// TODO: Replace mock data with real matching-service call

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty, language } = body;

    // TODO: Forward to matching microservice instead of returning mock data
    return NextResponse.json(
      {
        requestId: `mock-req-${Date.now()}`,
        status: 'pending',
        preferences: { topic, difficulty, language },
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to create match request' },
      { status: 500 }
    );
  }
}
