import { fetchWithAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

/**
 * DELETE /api/users/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await context.params;

    const res = await fetchWithAuth(`${USER_SERVICE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('cookie') ?? '',
        'Authorization': request.headers.get('Authorization') ?? '',
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    return new NextResponse(null, { status: res.status });
  } catch (err) {
    console.error("Gateway Error:", err);
    return NextResponse.json({ error: 'User service unavailable' }, { status: 503 });
  }
}