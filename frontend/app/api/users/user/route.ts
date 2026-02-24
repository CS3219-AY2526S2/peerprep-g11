import { NextRequest, NextResponse } from 'next/server';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

/**
 * DELETE /api/users/:id
 * Deletes a user by ID. Admin only — enforced by the user service.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${USER_SERVICE_URL}/users/${params.id}`, {
      method: 'DELETE',
      headers: {
        Cookie: request.headers.get('cookie') ?? '',
        Authorization: request.headers.get('Authorization') ?? '',
      },
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'User service unavailable' }, { status: 503 });
  }
}