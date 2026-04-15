import { BlackFormatter } from "../black";
import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";

jest.mock("child_process", () => ({
  execFile: jest.fn(),
}));

jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
}));

describe("BlackFormatter", () => {
  const formatter = new BlackFormatter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call black through python3", async () => {
    const inputCode = "def f(x): return x";
    const outputCode = "def f(x):\n    return x\n";

    (writeFile as jest.Mock).mockResolvedValue(undefined);
    (readFile as jest.Mock).mockResolvedValue(outputCode);
    (unlink as jest.Mock).mockResolvedValue(undefined);

    (execFile as unknown as jest.Mock).mockImplementation(
      (_cmd, _args, _opts, callback) => {
        callback(null, "", "");
      },
    );

    const formatted = await formatter.format(inputCode);

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("fmt-"),
      inputCode,
      "utf-8",
    );
    expect(execFile).toHaveBeenCalledWith(
      "python3",
      expect.arrayContaining(["-m", "black", "--quiet"]),
      expect.any(Object),
      expect.any(Function),
    );
    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining("fmt-"),
      "utf-8",
    );
    expect(unlink).toHaveBeenCalledWith(expect.stringContaining("fmt-"));
    expect(formatted).toBe(outputCode);
  });

  it("should handle black errors", async () => {
    (writeFile as jest.Mock).mockResolvedValue(undefined);
    (unlink as jest.Mock).mockResolvedValue(undefined);

    (execFile as unknown as jest.Mock).mockImplementation(
      (_cmd, _args, _opts, callback) => {
        callback(new Error("Formatting failed"));
      },
    );

    await expect(formatter.format("invalid code")).rejects.toThrow(
      "Formatting failed",
    );
    expect(unlink).toHaveBeenCalled();
  });
});
