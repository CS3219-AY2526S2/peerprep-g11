"use strict";
/**
 * endSession — single source of truth for all collaboration-session teardown.
 *
 * Called from two places:
 *   1. The DELETE /sessions/:sessionId REST handler (explicit user leave).
 *   2. The zombie-cleanup timer in server.ts (all participants disconnected for too long).
 *
 * What it does, in order:
 *   a. Finds and deletes the session document from MongoDB.
 *   b. Extracts the final code from the in-memory Yjs document (if one exists).
 *   c. Destroys the Yjs document and removes it from the shared docs Map to free memory.
 *   d. Fires POST /history/insert to the question service  \  in parallel —
 *      and DELETE /matches/:sessionId to the matching service /  failures are logged but do
 *                                                               not affect the caller.
 *   e. Cancels any pending zombie-cleanup timer for this session (prevents double-execution).
 *
 * Returns the deleted session document, or null if the session was not found (already gone).
 * The caller decides what HTTP status to send back; this function never throws to the caller.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.endSession = endSession;
const utils_1 = require("@y/websocket-server/utils");
const Session_1 = require("../model/Session");
const questionServiceClient_1 = require("../clients/questionServiceClient");
const matchingServiceClient_1 = require("../clients/matchingServiceClient");
async function endSession(sessionId, cleanupTimers) {
    // ── 1. Cancel any pending zombie timer to prevent double-execution ────────
    const existing = cleanupTimers.get(sessionId);
    if (existing !== undefined) {
        clearTimeout(existing);
        cleanupTimers.delete(sessionId);
    }
    // ── 2. Fetch and delete the session from MongoDB ──────────────────────────
    const session = await Session_1.Session.findOneAndDelete({ sessionId }).lean();
    if (!session) {
        // Already deleted (race between REST call and zombie timer, or genuinely missing).
        return null;
    }
    // ── 3. Extract code from the Yjs document ────────────────────────────────
    // Use docs.get() (direct Map lookup) rather than getYDoc() which would
    // create an empty document if none exists.
    const doc = utils_1.docs.get(sessionId);
    const code = doc ? doc.getText("monaco").toString() : "";
    // ── 4. Destroy the Yjs document to free memory ───────────────────────────
    if (doc) {
        utils_1.docs.delete(sessionId);
        doc.destroy();
    }
    // ── 5. Notify downstream services in parallel ─────────────────────────────
    const [p0, p1] = session.participants;
    const historyPayload = {
        session_id: sessionId,
        user_ids: [p0.id, p1.id],
        user_names: [p0.username, p1.username],
        slug: session.questionId, // questionId IS the slug in our naming convention
        language: session.selectedLanguage,
        code: Buffer.from(code).toString("base64"),
    };
    const results = await Promise.allSettled([
        (0, questionServiceClient_1.insertHistory)(historyPayload),
        (0, matchingServiceClient_1.deleteMatch)(sessionId),
    ]);
    // Log failures but do NOT re-throw — the session is already deleted from our DB.
    for (const result of results) {
        if (result.status === "rejected") {
            console.error("[endSession] Downstream notification failed:", result.reason);
        }
    }
    return session;
}
