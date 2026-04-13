"use strict";
/**
 * Thin HTTP client for the Matching Service.
 *
 * DELETE /matches/:matchId
 *   Marks the match as ended in the matching service's MongoDB and Redis state.
 *   Called by endSession() when a collaboration session ends (explicit leave or zombie cleanup).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMatch = deleteMatch;
async function deleteMatch(matchId) {
    const base = process.env.MATCHING_SERVICE_URL;
    if (!base) {
        throw new Error("MATCHING_SERVICE_URL is not set");
    }
    const res = await fetch(`${base}/matches/${encodeURIComponent(matchId)}`, {
        method: "DELETE",
    });
    // 404 is acceptable — the match may have already been cleaned up on the matching side.
    if (!res.ok && res.status !== 404) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(`Matching service returned ${res.status} for DELETE /matches/${matchId}: ${text}`);
    }
}
