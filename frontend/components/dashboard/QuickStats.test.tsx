import { render, screen } from "@testing-library/react";

import { QuickStats } from "@/components/dashboard/QuickStats";

describe("QuickStats", () => {
  it("renders the fixed dashboard stats", () => {
    render(<QuickStats />);

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("Questions")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Streak")).toBeInTheDocument();
    expect(screen.getByText("28m")).toBeInTheDocument();
    expect(screen.getByText("Avg")).toBeInTheDocument();
  });
});
