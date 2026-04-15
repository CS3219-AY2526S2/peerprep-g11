import { fireEvent, render, screen } from "@testing-library/react";

import { DifficultyBadge } from "@/app/questions/_components/DifficultyBadge";
import { PaginationControls } from "@/app/questions/_components/PaginationControls";
import { QuestionCard } from "@/app/questions/_components/QuestionCard";
import { QuestionTable } from "@/app/questions/_components/QuestionTable";
import { StatusPill } from "@/app/questions/_components/StatusPill";
import { TopicBadge } from "@/app/questions/_components/TopicBadge";
import type { Question, QuestionListElement } from "@/app/questions/types";

const sampleQuestion: Question = {
  id: "q-1",
  title: "Two Sum",
  description: "Find two values.\n\nReturn their indices.",
  topics: ["Arrays", "Hash Map"],
  difficulty: "Easy",
  status: "Pending",
  constraints: ["2 <= nums.length", "One valid answer exists"],
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "2 + 7 = 9",
    },
  ],
};

const listQuestion: QuestionListElement = {
  id: "q-1",
  title: "Two Sum",
  slug: "two-sum",
  topics: ["Arrays", "Hash Map"],
  difficulty: "Easy",
  status: "Completed",
};

describe("question display components", () => {
  it("renders difficulty, topic, and status badges", () => {
    render(
      <div>
        <DifficultyBadge difficulty="Hard" />
        <TopicBadge topic="Graphs" />
        <StatusPill status="In Review" />
      </div>
    );

    expect(screen.getByText("Hard")).toBeInTheDocument();
    expect(screen.getByText("Graphs")).toBeInTheDocument();
    expect(screen.getByText("In Review")).toBeInTheDocument();
  });

  it("hides pagination when there is only one page", () => {
    const { container } = render(
      <PaginationControls
        page={1}
        totalPages={1}
        total={1}
        pageSize={10}
        onPageChange={jest.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the current range and fires page changes within bounds", () => {
    const onPageChange = jest.fn();

    render(
      <PaginationControls
        page={2}
        totalPages={3}
        total={25}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    expect(
      screen.getByText("Showing 11–20 of 25 questions")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it("supports custom pagination labels", () => {
    render(
      <PaginationControls
        page={1}
        totalPages={2}
        total={12}
        pageSize={5}
        itemLabel="history entries"
        onPageChange={jest.fn()}
      />
    );

    expect(
      screen.getByText("Showing 1–5 of 12 history entries")
    ).toBeInTheDocument();
  });

  it("renders an empty state when there are no questions", () => {
    render(<QuestionTable questions={[]} />);

    expect(
      screen.getByText("No questions found. Try adjusting your filters.")
    ).toBeInTheDocument();
  });

  it("renders question rows when data is available", () => {
    render(<QuestionTable questions={[listQuestion]} />);

    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("Arrays, Hash Map")).toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view/i })).toHaveAttribute(
      "href",
      "/questions/two-sum"
    );
  });

  it("renders question details, examples, and the back link", () => {
    render(<QuestionCard question={sampleQuestion} />);

    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("Find two values.")).toBeInTheDocument();
    expect(screen.getByText("Return their indices.")).toBeInTheDocument();
    expect(screen.getByText("Constraints")).toBeInTheDocument();
    expect(screen.getByText("2 <= nums.length")).toBeInTheDocument();
    expect(screen.getByText("Example Input / Output")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to questions/i })).toHaveAttribute(
      "href",
      "/questions"
    );
  });

  it("can hide the back link", () => {
    render(<QuestionCard question={sampleQuestion} showBackLink={false} />);

    expect(
      screen.queryByRole("link", { name: /back to questions/i })
    ).not.toBeInTheDocument();
  });
});
