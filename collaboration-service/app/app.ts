import express from "express";
import type { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { Session } from "./model/Session";
import { endSession } from "./services/endSession";

/**
 * createApp — Express application factory.
 *
 * Accepts the shared cleanupTimers Map so the DELETE handler can cancel any
 * pending zombie-cleanup timer when a user explicitly ends a session.
 */
export function createApp(cleanupTimers: Map<string, NodeJS.Timeout>) {
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
      const session = await Session.findOne({
        sessionId: req.params.sessionId as string,
      }).lean();

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

  // DELETE /sessions/:sessionId
  // Called by the BFF when a user leaves a session.
  //
  // Beyond deleting the session from MongoDB this endpoint also:
  //   - Extracts the final code from the in-memory Yjs document
  //   - Destroys the Yjs document to free memory
  //   - Notifies the question service (POST /history/insert)
  //   - Notifies the matching service (DELETE /matches/:sessionId)
  //   - Cancels any pending zombie-cleanup timer for this session
  //
  // Either participant leaving is sufficient to end the session.
  app.delete("/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const deleted = await endSession(req.params.sessionId as string, cleanupTimers);

      if (!deleted) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      res.json({ message: "Session deleted", sessionId: req.params.sessionId as string });
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
  //   questionId:       string,   // question slug (called questionId here for historical reasons)
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
        res
          .status(400)
          .json({ error: "participants must be an array of exactly two users" });
        return;
      }

      // Guard against duplicate calls — matching service may retry on failure.
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

      res
        .status(201)
        .json({ message: "Session created", sessionId: session.sessionId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
}
