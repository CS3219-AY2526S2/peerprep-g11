import "dotenv/config";
import { connectDB } from "./app/config/db.ts";

const PORT = process.env.PORT || 4001;
import { setupWSConnection } from "@y/websocket-server/utils";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import app from "./app/app.ts";

async function main() {
  await connectDB();

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  // auth gate — runs during HTTP upgrade, before WebSocket is accepted
  httpServer.on("upgrade", (req, socket, head) => {
    console.log("Upgrade request received:");
    const url = new URL(req.url!, "http://localhost");
    const ticket = url.searchParams.get("ticket");
    try {
      //verify the short term ticket from frontend BFF
      const payload = jwt.verify(ticket!, process.env.JWT_SECRET!) as {
        userId: string;
        roomId: string;
      };
      console.log("ticket verified");
      (req as any).user = payload;
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });

  // Yjs handler — all the sync/awareness protocol is inside setupWSConnection
  wss.on("connection", (ws, req) => {
    setupWSConnection(ws, req);
  });

  httpServer.listen(PORT);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
