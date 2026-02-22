import { NextResponse } from "next/server";

function notImplemented(method: string) {
  return NextResponse.json({ message: "Not Implemented", method, endpoint: "/api/matching/requests/:requestId" }, { status: 501 });
}

export async function GET() {
  return notImplemented("GET");
}

export async function DELETE() {
  return notImplemented("DELETE");
}

