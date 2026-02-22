import { NextResponse } from "next/server";

function notImplemented(method: string) {
  return NextResponse.json({ message: "Not Implemented", method, endpoint: "/api/questions/:questionId" }, { status: 501 });
}

export async function GET() {
  return notImplemented("GET");
}

