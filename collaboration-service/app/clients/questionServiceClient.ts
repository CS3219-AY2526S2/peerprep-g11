/**
 * Thin HTTP client for the Question Service.
 *
 * POST /history/insert
 *   Records a completed coding attempt so users can review their session history.
 *   Called by endSession() when a collaboration session ends (explicit leave or zombie cleanup).
 */

export interface InsertHistoryPayload {
  session_id: string;
  user_ids: [string, string];
  user_names: [string, string];
  /** question slug — note: collaboration-service stores this as `questionId` */
  slug: string;
  /** e.g. "Python", "Java", "JavaScript" */
  language: string;
  /** full source code from the shared editor */
  code: string;
}

export async function insertHistory(payload: InsertHistoryPayload): Promise<void> {
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
    throw new Error(
      `Question service returned ${res.status} for POST /history/insert: ${text}`
    );
  }
}
