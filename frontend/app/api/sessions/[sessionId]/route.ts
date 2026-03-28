import { NextRequest, NextResponse } from "next/server";
import type { SessionDetails, SessionLanguage } from "@/app/sessions/[sessionId]/types";
import * as jwt from "jsonwebtoken";

const COLLAB_SERVICE_URL = process.env.COLLAB_SERVICE_URL ?? "http://localhost:4003";
const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? "http://localhost:8000";
const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  // 1. verify user identity from JWT cookie
  let userId: string;
  try {
    const token = _request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    userId = decoded.id as string;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. fetch session from collab service
  const sessionRes = await fetch(`${COLLAB_SERVICE_URL}/sessions/${sessionId}`);
  if (!sessionRes.ok) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const session = await sessionRes.json();

  // 3. room auth — is this user actually a participant?
  const isParticipant = session.participants.some(
    (p: { id: string }) => p.id === userId,
  );
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. fetch starterCode from question service
  //    starterCode belongs to the question, not the session.
  //    we inject it here so the frontend SessionDetails type stays satisfied
  //    until the question service exposes starterCode natively.
  let starterCode: Record<SessionLanguage, string> = {
    javascript: "",
    python: "",
    java: "",
  };
  try {
    const questionRes = await fetch(`${QUESTION_SERVICE_URL}/questions/${session.questionId}`);
    if (questionRes.ok) {
      const question = await questionRes.json();
      // use question.starterCode if the question service provides it,
      // otherwise fall back to empty strings — frontend will show a blank editor
      if (question.starterCode) {
        starterCode = question.starterCode;
      }
    }
  } catch {
    // non-fatal — fall back to empty starter code
  }

  // 5. mark which participant is the current user (computed, not stored in DB)
  const participants = session.participants.map(
    (p: { id: string; username: string }) => ({
      ...p,
      isCurrentUser: p.id === userId,
      presence: p.presence ?? "connected",
    }),
  );

  // 6. mint short-lived ticket now that both checks passed
  const ticket = jwt.sign({ userId, roomId: sessionId }, JWT_SECRET, {
    expiresIn: "30s",
  });

  // 7. return combined response — session + starterCode + ticket
  const response: SessionDetails & { ticket: string } = {
    ...session,
    participants,
    starterCode,
    ticket,
  };

  return NextResponse.json(response);
}
