import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { Session } from "./model/Session";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// GET /sessions/:sessionId
// Returns session information as JSON given the sessionId in the URL.
// Called by the BFF (frontend/app/api/sessions/[sessionId]/route.ts) after
// it has already verified the user's JWT and checked room membership.
// This endpoint does NOT re-check auth — it trusts the BFF.
app.get("/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId })
      .lean();  // .lean() returns a plain JS object instead of a Mongoose document,
                // which serialises cleanly to JSON

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /matched
// Called by the matching service when two users have been matched.
// Creates a new session document in the DB recording who is matched
// to whom and which question they will attempt.
// Expected request body:
// {
//   sessionId:        string,   // matchId from the matching service
//   questionId:       string,   // question assigned to this session
//   selectedLanguage: string,   // language preference chosen at match time
//   participants: [
//     { id: string, username: string },
//     { id: string, username: string }
//   ]
// }
app.post("/matched", async (req: Request, res: Response) => {
  try {
    const { sessionId, questionId, selectedLanguage, participants } = req.body;

    if (!sessionId || !questionId || !selectedLanguage || !participants) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (!Array.isArray(participants) || participants.length !== 2) {
      res.status(400).json({ error: "participants must be an array of exactly two users" });
      return;
    }

    // guard against duplicate calls — matching service may retry on failure
    const existing = await Session.findOne({ sessionId });
    if (existing) {
      res.status(409).json({ error: "Session already exists" });
      return;
    }

    const session = await Session.create({
      sessionId,
      questionId,
      selectedLanguage,
      participants,
    });

    res.status(201).json({ message: "Session created", sessionId: session.sessionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
