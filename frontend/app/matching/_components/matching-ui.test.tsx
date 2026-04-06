import { fireEvent, render, screen } from "@testing-library/react";

import { HowMatchingWorks } from "@/app/matching/_components/HowMatchingWorks";
import { MatchFoundCard } from "@/app/matching/_components/MatchFoundCard";
import { PreferenceSummaryBadge } from "@/app/matching/_components/PreferenceSummaryBadge";
import { TimedOutCard } from "@/app/matching/_components/TimedOutCard";
import { WaitingCard } from "@/app/matching/_components/WaitingCard";
import type { MatchingPreferences } from "@/app/matching/types";

const preferences: MatchingPreferences = {
  topic: "Arrays",
  difficulty: "Medium",
  language: "python",
};

describe("matching display components", () => {
  it("renders a preference summary badge", () => {
    render(<PreferenceSummaryBadge label="Topic" value="Arrays" />);

    expect(screen.getByText("Topic")).toBeInTheDocument();
    expect(screen.getByText("Arrays")).toBeInTheDocument();
  });

  it("renders the matching explainer points", () => {
    render(<HowMatchingWorks />);

    expect(screen.getByText("How matching works")).toBeInTheDocument();
    expect(
      screen.getByText(/Your topic and difficulty must align/i)
    ).toBeInTheDocument();
  });

  it("renders the waiting state and cancel action", () => {
    const onCancel = jest.fn();

    render(
      <WaitingCard
        preferences={preferences}
        elapsedSeconds={65}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Searching for a peer…")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("01:05")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel matching/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders the timed out state and both actions", () => {
    const onRetry = jest.fn();
    const onBack = jest.fn();

    render(
      <TimedOutCard
        preferences={preferences}
        onRetry={onRetry}
        onBack={onBack}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /change preferences/i })
    );

    expect(onRetry).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it("renders the match found state with optional partner name", () => {
    const onCancel = jest.fn();
    const onEnterSession = jest.fn();

    render(
      <MatchFoundCard
        preferences={preferences}
        partnerName="Taylor"
        onCancel={onCancel}
        onEnterSession={onEnterSession}
      />
    );

    expect(screen.getByText("Match found!")).toBeInTheDocument();
    expect(screen.getByText("Taylor")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /enter session/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel matching/i }));

    expect(onEnterSession).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });
});
