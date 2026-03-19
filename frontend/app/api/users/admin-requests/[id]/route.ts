import { fetchWithAuth, forwardAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const res = await fetchWithAuth(`${USER_SERVICE_URL}/users/admin-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(request),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'User service unavailable' }, { status: 503 });
  }
}
