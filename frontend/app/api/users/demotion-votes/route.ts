import { fetchWithAuth, forwardAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

export async function GET(request: NextRequest) {
  try {
    const res = await fetchWithAuth(`${USER_SERVICE_URL}/users/demotion-votes`, {
      headers: { ...forwardAuthHeaders(request) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'User service unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetchWithAuth(`${USER_SERVICE_URL}/users/demotion-votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...forwardAuthHeaders(request) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'User service unavailable' }, { status: 503 });
  }
}
