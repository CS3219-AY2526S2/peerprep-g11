import { fetchWithAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const MATCHING_SERVICE_URL = process.env.MATCHING_SERVICE_URL ?? 'http://localhost:8080';

function notImplemented(method: string) {
  return NextResponse.json({ message: "Not Implemented", method, endpoint: "/api/matches/:matchId" }, { status: 501 });
}

export async function GET() {
  return notImplemented("GET");
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;

    const res = await fetchWithAuth(`${MATCHING_SERVICE_URL}/matches/${matchId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('cookie') ?? '',
        'Authorization': request.headers.get('Authorization') ?? '',
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 200) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    return new NextResponse(null, { status: res.status });
  } catch (err) {
    console.error("Gateway Error:", err);
    return NextResponse.json({ error: 'Matching service unavailable' }, { status: 503 });
  }
}

