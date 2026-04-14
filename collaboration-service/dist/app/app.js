"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const Session_1 = require("./model/Session");
const endSession_1 = require("./services/endSession");
/**
 * createApp — Express application factory.
 *
 * Accepts the shared cleanupTimers Map so the DELETE handler can cancel any
 * pending zombie-cleanup timer when a user explicitly ends a session.
 */
function createApp(cleanupTimers) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    // GET /sessions/:sessionId
    // Returns session information as JSON given the sessionId in the URL.
    // Called by the BFF (frontend/app/api/sessions/[sessionId]/route.ts) after
    // it has already verified the user's JWT and checked room membership.
    // This endpoint does NOT re-check auth — it trusts the BFF.
    app.get("/sessions/:sessionId", async (req, res) => {
        try {
            const session = await Session_1.Session.findOne({
                sessionId: req.params.sessionId,
            }).lean();
            if (!session) {
                res.status(404).json({ error: "Session not found" });
                return;
            }
            res.json(session);
        }
        catch (err) {
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
    app.delete("/sessions/:sessionId", async (req, res) => {
        try {
            const deleted = await (0, endSession_1.endSession)(req.params.sessionId, cleanupTimers);
            if (!deleted) {
                res.status(404).json({ error: "Session not found" });
                return;
            }
            res.json({ message: "Session deleted", sessionId: req.params.sessionId });
        }
        catch (err) {
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
    app.post("/matched", async (req, res) => {
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
            const existing = await Session_1.Session.findOne({ sessionId });
            if (existing) {
                res.status(409).json({ error: "Session already exists" });
                return;
            }
            const session = await Session_1.Session.create({
                sessionId,
                questionId,
                selectedLanguage,
                participants,
            });
            res
                .status(201)
                .json({ message: "Session created", sessionId: session.sessionId });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    return app;
}
