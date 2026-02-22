import { NextResponse } from "next/server";

function notImplemented(method: string) {
  return NextResponse.json({ message: "Not Implemented", method, endpoint: "/api/sessions/:sessionId/leave" }, { status: 501 });
}

export async function POST() {
  return notImplemented("POST");
}

