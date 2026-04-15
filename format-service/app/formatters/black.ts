import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

import { Formatter } from "./index";

export class BlackFormatter implements Formatter {
  async format(code: string): Promise<string> {
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
}
