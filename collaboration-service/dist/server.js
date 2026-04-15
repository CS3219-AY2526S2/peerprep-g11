"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = require("./app/config/db");
const utils_1 = require("@y/websocket-server/utils");
const ws_1 = require("ws");
const http_1 = require("http");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("./app/app");
const endSession_1 = require("./app/services/endSession");
const PORT = process.env.PORT || 1234;
/**
 * How long (ms) an empty room is kept alive before zombie cleanup fires.
 * Defaults to 30 minutes. Override via ZOMBIE_TIMEOUT_MS env var.
 */
const ZOMBIE_TIMEOUT_MS = parseInt(process.env.ZOMBIE_TIMEOUT_MS ?? "1800000", 10);
/**
 * Per-room debounce timers.
 * Key:   sessionId / docName (URL path, e.g. "abc-123")
 * Value: NodeJS.Timeout that will fire endSession() if no one reconnects in time.
 *
 * This Map is shared with the Express app so the DELETE handler can cancel a
 * timer when a user explicitly ends a session before the timeout fires.
 */
const cleanupTimers = new Map();
/** Derive the Yjs doc name from a WebSocket upgrade URL — mirrors setupWSConnection internals. */
function docNameFromUrl(url) {
    return (url ?? "").slice(1).split("?")[0];
}
async function main() {
    await (0, db_1.connectDB)();
    const httpServer = (0, http_1.createServer)((0, app_1.createApp)(cleanupTimers));
    const wss = new ws_1.WebSocketServer({ noServer: true });
    // ── Auth gate — runs during HTTP upgrade, before WebSocket is accepted ────
    httpServer.on("upgrade", (req, socket, head) => {
        const url = new URL(req.url, "http://localhost");
        const ticket = url.searchParams.get("ticket");
        try {
            const payload = jsonwebtoken_1.default.verify(ticket, process.env.JWT_SECRET);
            // Enforce that the room the ticket was issued for matches the URL path.
            const docName = docNameFromUrl(req.url);
            if (payload.roomId !== docName) {
                console.warn(`[WS] Ticket roomId "${payload.roomId}" does not match URL path "${docName}" — rejecting`);
                socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
                socket.destroy();
                return;
            }
            console.log(`[WS] Ticket verified for room "${docName}"`);
            req.user = payload;
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req);
            });
        }
        catch {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
        }
    });
    // ── Yjs handler + zombie-cleanup tracking ─────────────────────────────────
    wss.on("connection", (ws, req) => {
        const sessionId = docNameFromUrl(req.url);
        // Cancel any pending cleanup timer — this is a reconnect.
        const pendingTimer = cleanupTimers.get(sessionId);
        if (pendingTimer !== undefined) {
            clearTimeout(pendingTimer);
            cleanupTimers.delete(sessionId);
            console.log(`[zombie] Reconnect detected for "${sessionId}" — cleanup timer cancelled`);
        }
        // Hand off to Yjs: this registers the connection in doc.conns and sets up
        // all sync/awareness protocol handling.
        (0, utils_1.setupWSConnection)(ws, req);
        // When this specific connection closes, check if the room is now empty.
        // closeConn() (internal to @y/websocket-server) runs synchronously before
        // the 'close' event fires, so doc.conns is already updated by the time we
        // reach this callback.
        ws.on("close", () => {
            const doc = utils_1.docs.get(sessionId);
            // doc is undefined if it was already destroyed (e.g. by a concurrent REST delete).
            if (!doc || doc.conns.size === 0) {
                console.log(`[zombie] Room "${sessionId}" is empty — scheduling cleanup in ${ZOMBIE_TIMEOUT_MS}ms`);
                const timer = setTimeout(() => {
                    cleanupTimers.delete(sessionId);
                    console.log(`[zombie] Cleanup firing for abandoned room "${sessionId}"`);
                    (0, endSession_1.endSession)(sessionId, cleanupTimers).catch((err) => console.error(`[zombie] endSession failed for "${sessionId}":`, err));
                }, ZOMBIE_TIMEOUT_MS);
                cleanupTimers.set(sessionId, timer);
            }
        });
    });
    httpServer.listen(PORT, () => {
        console.log(`Collaboration service listening on port ${PORT}`);
    });
}
main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
