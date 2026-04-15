import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { Formatter } from "./index";

const GJF_JAR = process.env.GJF_JAR_PATH || "/opt/google-java-format.jar";

export class GoogleJavaFormatter implements Formatter {
  async format(code: string): Promise<string> {
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
}
