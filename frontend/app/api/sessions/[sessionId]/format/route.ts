import { NextRequest, NextResponse } from "next/server";

const FORMAT_SERVICE_URL =
  process.env.FORMAT_SERVICE_URL ?? "http://localhost:4003";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await params;

  let body: { code: string; language: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const res = await fetch(`${FORMAT_SERVICE_URL}/format`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: body.code,
        language: body.language ?? "python",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error ?? "Formatting failed" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Format service unavailable" },
      { status: 503 },
    );
  }
}
