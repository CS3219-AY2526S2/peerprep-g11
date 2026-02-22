import { NextResponse } from "next/server";

function notImplemented(method: string) {
  return NextResponse.json({ message: "Not Implemented", method, endpoint: "/api/users/me" }, { status: 501 });
}

export async function GET() {
  return notImplemented("GET");
}

export async function PATCH() {
  return notImplemented("PATCH");
}

