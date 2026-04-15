import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting Tailwind classes", () => {
    const result = cn("px-2 py-1", "px-4");

    expect(result).toContain("px-4");
    expect(result).toContain("py-1");
    expect(result).not.toContain("px-2");
  });

  it("preserves non-conflicting class names", () => {
    expect(cn("text-sm", { block: true, hidden: false }, "font-medium")).toBe(
      "text-sm block font-medium"
    );
  });
});
