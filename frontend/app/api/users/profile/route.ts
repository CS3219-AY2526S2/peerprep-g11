import { NextRequest, NextResponse } from 'next/server';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${USER_SERVICE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') ?? '',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'User service unavailable' }, { status: 503 });
  }
}