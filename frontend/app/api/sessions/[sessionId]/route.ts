// TODO: Replace this mock implementation with an actual collaboration service
// session lookup when the backend session flow is available.

import { NextRequest, NextResponse } from "next/server";
import type { SessionDetails } from "@/app/sessions/[sessionId]/types";
import { PROGRAMMING_LANGUAGES } from "@/lib/programming-languages";
import { forwardAuthHeaders } from "@/lib/auth";
import * as jwt from "jsonwebtoken";

const COLLAB_SERVICE_URL =
  process.env.COLLAB_SERVICE_URL ?? "http://localhost:1234";
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  //check User Identity with JWT
  let decoded;
  try {
    const token = _request.cookies.get("token")?.get("value"); // Ensure cookies are included
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  // 2. fetch session from collab service — this also proves the session exists
  const sessionRes = await fetch(`${COLLAB_SERVICE_URL}/sessions/${sessionId}`);
  if (!sessionRes.ok) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const session: SessionDetails = await sessionRes.json();

  const userId = decoded.id;
  // 3. room auth — is this user actually a participant?
  const isParticipant = session.participants.some(
    (p: { id: string }) => p.id === userId,
  );
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. mint short-lived ticket now that both checks passed
  const ticket = jwt.sign({ userId, sessionId }, JWT_SECRET, {
    expiresIn: "30s",
  });

  // 5. return session details AND ticket together
  return NextResponse.json({ ...session, ticket });
}
