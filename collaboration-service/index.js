import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import ShareDB from "sharedb";
import WebSocketJSONStream from "@teamwork/websocket-json-stream";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const backend = new ShareDB();
wss.on("connection", (webSocket) => {
  const stream = new WebSocketJSONStream(webSocket);
  backend.listen(stream);
});

server.listen(8080);
