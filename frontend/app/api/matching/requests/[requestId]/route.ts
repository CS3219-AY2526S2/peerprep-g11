import { fetchWithAuth, forwardAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const MATCHING_SERVICE_URL =
  process.env.MATCHING_SERVICE_URL ?? 'http://localhost:8080';

/**
 * Gets the current user's match status.
 * @returns Match data if successful, error message otherwise
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;

  try {
    const res = await fetchWithAuth(
      `${MATCHING_SERVICE_URL}/match/${requestId}`,
      {
        headers: {
          ...forwardAuthHeaders(request),
        },
      }
    );

    const text = await res.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json(
        { message: text },
        { status: res.status }
      );
    }
  } catch (err) {
    console.error('Fetch match status error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch match status' },
      { status: 503 }
    );
  }
}


/**
 * Cancels the current user's match.
 * @returns Success message if successful, error message if unsuccessful
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;

  try {
    await fetchWithAuth(
      `${MATCHING_SERVICE_URL}/match/${requestId}`,
      {
        method: 'DELETE',
        headers: {
          ...forwardAuthHeaders(request),
        },
      }
    );

    createdAtMap.delete(requestId);

    return NextResponse.json({ requestId, status: 'cancelled' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to cancel match request' },
      { status: 500 }
    );
  }
}
