import express from "express";
import type { Request, Response } from "express";
import { Formatter } from "./formatters";
import { BlackFormatter } from "./formatters/black";
import { PrettierFormatter } from "./formatters/prettier";
import { GoogleJavaFormatter } from "./formatters/google-java-format";

const app = express();
app.use(express.json());

// Registry of adapters
const formatters: Record<string, Formatter> = {
  python: new BlackFormatter(),
  javascript: new PrettierFormatter("babel"),
  typescript: new PrettierFormatter("typescript"),
  css: new PrettierFormatter("css"),
  html: new PrettierFormatter("html"),
  json: new PrettierFormatter("json"),
  java: new GoogleJavaFormatter(),
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/format", async (req: Request, res: Response) => {
  const { code, language } = req.body ?? {};

  if (typeof code !== "string" || !code.trim()) {
    res.status(400).json({ error: "Missing code" });
    return;
  }

  const formatter = formatters[language];

  if (!formatter) {
    res
      .status(400)
      .json({ error: `Formatting not supported for language: ${language}` });
    return;
  }

  try {
    const formatted = await formatter.format(code);
    res.json({ formatted });
  } catch (err: any) {
    if (err.killed) {
      res.status(408).json({ error: "Formatting timed out" });
    } else {
      res.status(422).json({
        error: err.stderr?.trim() || err.message || "Could not format code",
      });
    }
  }
});

export default app;
