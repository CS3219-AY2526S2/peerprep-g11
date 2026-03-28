// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.post("/match", (req, res) => {
  console.log("Received matching request:", req.body);
  res.json({ message: "Match request received" });
});

app.listen(PORT, () => console.log(`Matching service running on port ${PORT}`));