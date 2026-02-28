import { fetchWithAuth, forwardAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

/**
 * GET /api/users
 * Returns all users. Admin only — the user service enforces this via the JWT.
 */
export async function GET(request: NextRequest) {
  try {
    const res = await fetchWithAuth(`${USER_SERVICE_URL}/users`, {
      headers: {
        ...forwardAuthHeaders(request)
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'User service unavailable' }, { status: 503 });
  }
}