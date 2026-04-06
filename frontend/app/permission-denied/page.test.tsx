import { fireEvent, render, screen } from "@testing-library/react";

import PermissionDeniedPage from "@/app/permission-denied/page";
import * as mockNextNavigationModule from "@/test-utils/next-navigation";
import {
  mockPush,
  resetNextNavigationMocks,
} from "@/test-utils/next-navigation";

jest.mock("next/navigation", () => mockNextNavigationModule);

describe("PermissionDeniedPage", () => {
  beforeEach(() => {
    resetNextNavigationMocks();
  });

  it("routes both call-to-action buttons correctly", () => {
    render(<PermissionDeniedPage />);

    fireEvent.click(screen.getByRole("button", { name: "Return Home" }));
    fireEvent.click(screen.getByRole("button", { name: "Browse Questions" }));

    expect(mockPush).toHaveBeenNthCalledWith(1, "/dashboard");
    expect(mockPush).toHaveBeenNthCalledWith(2, "/questions");
  });
});
