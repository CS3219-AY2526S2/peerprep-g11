import express from "express";
import type { Request, Response } from "express";
import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// POST /format
// Accepts { code: string, language: string }
// Returns { formatted: string }
app.post("/format", async (req: Request, res: Response) => {
  const { code, language } = req.body ?? {};

  if (typeof code !== "string" || !code.trim()) {
    res.status(400).json({ error: "Missing code" });
    return;
  }

  try {
    let formatted: string;

    switch (language) {
      case "python":
        formatted = await formatPython(code);
        break;
      case "javascript":
        formatted = await formatJavaScript(code);
        break;
      case "java":
        formatted = await formatJava(code);
        break;
      default:
        res
          .status(400)
          .json({ error: `Formatting not supported for language: ${language}` });
        return;
    }

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

// ---------------------------------------------------------------------------
// Python — black (subprocess)
// ---------------------------------------------------------------------------

async function formatPython(code: string): Promise<string> {
  const tmpPath = join(tmpdir(), `fmt-${randomUUID()}.py`);
  try {
    await writeFile(tmpPath, code, "utf-8");
    await new Promise<void>((resolve, reject) => {
      execFile(
        "python3",
        ["-m", "black", "--quiet", "--fast", "--preview", tmpPath],
        { timeout: 10_000 },
        (err) => (err ? reject(err) : resolve()),
      );
    });
    return await readFile(tmpPath, "utf-8");
  } finally {
    unlink(tmpPath).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// JavaScript — prettier (in-process)
// ---------------------------------------------------------------------------

async function formatJavaScript(code: string): Promise<string> {
  const prettier = await import("prettier");
  return prettier.format(code, {
    parser: "babel",
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "all",
    printWidth: 80,
  });
}

// ---------------------------------------------------------------------------
// Java — google-java-format (JAR subprocess)
// ---------------------------------------------------------------------------

const GJF_JAR =
  process.env.GJF_JAR_PATH || "/opt/google-java-format.jar";

async function formatJava(code: string): Promise<string> {
  const tmpPath = join(tmpdir(), `fmt-${randomUUID()}.java`);
  try {
    await writeFile(tmpPath, code, "utf-8");
    await new Promise<void>((resolve, reject) => {
      execFile(
        "java",
        ["-jar", GJF_JAR, "--replace", tmpPath],
        { timeout: 10_000 },
        (err) => (err ? reject(err) : resolve()),
      );
    });
    return await readFile(tmpPath, "utf-8");
  } finally {
    unlink(tmpPath).catch(() => {});
  }
}

export default app;
