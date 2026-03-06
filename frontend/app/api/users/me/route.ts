import { fetchWithAuth, forwardAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

/**
 * GET /api/users/me
 * Forwards the browser's HttpOnly JWT cookie to the users service to retrieve
 * the current user's profile. Returns 401 if not authenticated.
 */
export async function GET(request: NextRequest) {
  try {
    const res = await fetchWithAuth(`${USER_SERVICE_URL}/users/me`, {
      method: 'GET',
      headers: {
        ...forwardAuthHeaders(request)
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 });
  }
}