import {
  PROGRAMMING_LANGUAGES,
  PROGRAMMING_LANGUAGE_LABELS,
  coerceProgrammingLanguage,
  normalizeProgrammingLanguage,
} from "@/lib/programming-languages";

describe("programming languages", () => {
  it("defines a label for every supported language", () => {
    expect(PROGRAMMING_LANGUAGES).toEqual(["python", "java", "javascript"]);

    for (const language of PROGRAMMING_LANGUAGES) {
      expect(PROGRAMMING_LANGUAGE_LABELS[language]).toBeTruthy();
    }
  });

  it("normalizes common language variants into supported ids", () => {
    expect(normalizeProgrammingLanguage("Python")).toBe("python");
    expect(normalizeProgrammingLanguage("java")).toBe("java");
    expect(normalizeProgrammingLanguage("JavaScript")).toBe("javascript");
    expect(normalizeProgrammingLanguage("Javascript")).toBe("javascript");
    expect(normalizeProgrammingLanguage("java_script")).toBe("javascript");
    expect(normalizeProgrammingLanguage("js")).toBe("javascript");
    expect(normalizeProgrammingLanguage("ruby")).toBeNull();
  });

  it("coerces unknown values to a fallback language", () => {
    expect(coerceProgrammingLanguage("Javascript")).toBe("javascript");
    expect(coerceProgrammingLanguage("ruby")).toBe("python");
    expect(coerceProgrammingLanguage("ruby", "java")).toBe("java");
  });
});
