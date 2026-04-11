import {
  PROGRAMMING_LANGUAGES,
  PROGRAMMING_LANGUAGE_LABELS,
} from "@/lib/programming-languages";

describe("programming languages", () => {
  it("defines a label for every supported language", () => {
    expect(PROGRAMMING_LANGUAGES).toEqual(["python", "java", "javascript"]);

    for (const language of PROGRAMMING_LANGUAGES) {
      expect(PROGRAMMING_LANGUAGE_LABELS[language]).toBeTruthy();
    }
  });
});
