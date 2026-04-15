import { GoogleJavaFormatter } from "../google-java-format";
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

describe("GoogleJavaFormatter", () => {
  const formatter = new GoogleJavaFormatter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call java -jar to format", async () => {
    const inputCode = "class Test { public static void main(String[] args) {} }";
    const outputCode =
      "class Test {\n  public static void main(String[] args) {}\n}\n";

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
      "java",
      expect.arrayContaining(["-jar", expect.stringContaining(".jar")]),
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

  it("should handle java errors", async () => {
    (writeFile as jest.Mock).mockResolvedValue(undefined);
    (unlink as jest.Mock).mockResolvedValue(undefined);

    (execFile as unknown as jest.Mock).mockImplementation(
      (_cmd, _args, _opts, callback) => {
        callback(new Error("Java formatting failed"));
      },
    );

    await expect(formatter.format("class {")).rejects.toThrow(
      "Java formatting failed",
    );
    expect(unlink).toHaveBeenCalled();
  });
});
