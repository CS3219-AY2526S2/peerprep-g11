import {
  DEFAULT_ADMIN_QUESTION_FORM_VALUES,
  buildAdminQuestionFormValues,
  buildPreviewQuestion,
  canRenderQuestionPreview,
  normalizeAdminQuestionPayload,
  normalizeTopicValue,
} from "@/app/admin/questions/_components/question-form-utils";
import type { Question } from "@/app/questions/types";

describe("question form utils", () => {
  it("normalizes payload values and removes blank entries", () => {
    expect(
      normalizeAdminQuestionPayload({
        title: "  Two Sum  ",
        difficulty: "Easy",
        topics: [" Arrays ", " ", "Hash Map"],
        description: "  Solve it  ",
        constraints: [" n > 0 ", ""],
        examples: [
          { input: " 1 ", output: " 2 ", explanation: " because " },
          { input: " ", output: " ", explanation: "" },
        ],
      })
    ).toEqual({
      title: "Two Sum",
      difficulty: "Easy",
      topics: ["Arrays", "Hash Map"],
      description: "Solve it",
      constraints: ["n > 0"],
      examples: [
        { input: "1", output: "2", explanation: "because" },
      ],
    });
  });

  it("detects whether preview content is available", () => {
    expect(canRenderQuestionPreview(DEFAULT_ADMIN_QUESTION_FORM_VALUES)).toBe(
      false
    );
    expect(
      canRenderQuestionPreview({
        ...DEFAULT_ADMIN_QUESTION_FORM_VALUES,
        description: " Some content ",
      })
    ).toBe(true);
  });

  it("builds a preview question with fallback title", () => {
    expect(
      buildPreviewQuestion({
        ...DEFAULT_ADMIN_QUESTION_FORM_VALUES,
        topics: [" Arrays "],
        constraints: [" n > 0 "],
        examples: [{ input: " 1 ", output: " 2 ", explanation: " " }],
      })
    ).toEqual({
      id: "preview",
      title: "Untitled Question",
      description: "",
      topics: ["Arrays"],
      difficulty: "Easy",
      status: "Pending",
      constraints: ["n > 0"],
      examples: [{ input: "1", output: "2", explanation: undefined }],
    });
  });

  it("hydrates admin form values from a saved question", () => {
    const question: Question = {
      id: "q-1",
      title: "Two Sum",
      description: "Desc",
      topics: [],
      difficulty: "Medium",
      status: "Completed",
      constraints: [],
      examples: [],
    };

    expect(buildAdminQuestionFormValues(question)).toEqual({
      title: "Two Sum",
      difficulty: "Medium",
      topics: [],
      description: "Desc",
      constraints: [""],
      examples: [{ input: "", output: "", explanation: "" }],
    });
  });

  it("normalizes topic values for comparison", () => {
    expect(normalizeTopicValue("  Graphs  ")).toBe("graphs");
  });
});
