import { fireEvent, render, screen } from "@testing-library/react";

import PermissionDeniedPage from "@/app/permission-denied/page";
import {
  mockPush,
  resetNextNavigationMocks,
} from "@/test-utils/next-navigation";

jest.mock("next/navigation", () =>
  jest.requireActual("@/test-utils/next-navigation")
);

describe("PermissionDeniedPage", () => {
  beforeEach(() => {
    resetNextNavigationMocks();
  });

  it("routes the Return Home button correctly", () => {
    render(<PermissionDeniedPage />);

    fireEvent.click(screen.getByRole("button", { name: "Return Home" }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});
