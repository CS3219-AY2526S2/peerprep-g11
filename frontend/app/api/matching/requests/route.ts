import { NextResponse } from "next/server";

function notImplemented(method: string) {
  return NextResponse.json({ message: "Not Implemented", method, endpoint: "/api/matching/requests" }, { status: 501 });
}

export async function POST() {
  return notImplemented("POST");
}

