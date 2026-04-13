"use strict";
/**
 * Thin HTTP client for the Question Service.
 *
 * POST /history/insert
 *   Records a completed coding attempt so users can review their session history.
 *   Called by endSession() when a collaboration session ends (explicit leave or zombie cleanup).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertHistory = insertHistory;
async function insertHistory(payload) {
    const base = process.env.QUESTION_SERVICE_URL;
    if (!base) {
        throw new Error("QUESTION_SERVICE_URL is not set");
    }
    const res = await fetch(`${base}/history/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(`Question service returned ${res.status} for POST /history/insert: ${text}`);
    }
}
