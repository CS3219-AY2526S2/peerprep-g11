import { fetchWithAuth, forwardAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const MATCHING_SERVICE_URL =
  process.env.MATCHING_SERVICE_URL ?? 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId' },
        { status: 400 }
      );
    }

    await fetchWithAuth(
      `${MATCHING_SERVICE_URL}/matching/requests/${requestId}`,
      {
        method: 'DELETE',
        headers: {
          ...forwardAuthHeaders(request),
        },
      }
    );

    return NextResponse.json({ requestId, status: 'cancelled' });
  } catch (err) {
    console.error('Beacon cancel match error:', err);
    return NextResponse.json(
      { error: 'Failed to cancel match request' },
      { status: 500 }
    );
  }
}
