import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import FAQPage from "@/app/faq/page";
import { Role } from "@/lib/auth";
import {
  resetMockRequireAuth,
  setMockRequireAuthState,
} from "@/test-utils/mock-require-auth";
import {
  queueJsonResponse,
  resetFetchMock,
} from "@/test-utils/fetch";

jest.mock("@/hooks/useRequireAuth", () =>
  jest.requireActual("@/test-utils/mock-require-auth")
);
jest.mock("@/components/ui/navBar", () => ({
  NavBar: () => <div data-testid="navbar" />,
}));
jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

describe("FAQPage", () => {
  beforeEach(() => {
    resetMockRequireAuth();
    resetFetchMock();
  });

  it("shows the auth loading shell when no user is available", () => {
    setMockRequireAuthState({ user: null, isLoading: false });

    render(<FAQPage />);

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("hides the admin request section for admins", () => {
    setMockRequireAuthState({
      user: {
        id: "admin-1",
        username: "Admin",
        email: "admin@example.com",
        role: Role.ADMIN,
        skipOnboarding: false,
      },
    });

    render(<FAQPage />);

    expect(
      screen.queryByText("Request Admin Access")
    ).not.toBeInTheDocument();
  });

  it("shows a pending request state for non-admin users", async () => {
    setMockRequireAuthState({
      user: {
        id: "user-1",
        username: "Ada",
        email: "ada@example.com",
        role: Role.USER,
        skipOnboarding: false,
      },
    });
    queueJsonResponse({ hasPending: true });

    render(<FAQPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Request Pending" })
      ).toBeDisabled()
    );
  });

  it("shows a success alert after submitting an admin request", async () => {
    setMockRequireAuthState({
      user: {
        id: "user-1",
        username: "Ada",
        email: "ada@example.com",
        role: Role.USER,
        skipOnboarding: false,
      },
    });
    queueJsonResponse({ hasPending: false });
    queueJsonResponse({}, { status: 201 });

    render(<FAQPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Request Admin Access" })
      ).toBeEnabled()
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Request Admin Access" })
    );

    expect(
      await screen.findByText(
        "Your request has been submitted. An admin will review it shortly."
      )
    ).toBeInTheDocument();
  });

  it("shows a duplicate-request message when the request already exists", async () => {
    setMockRequireAuthState({
      user: {
        id: "user-1",
        username: "Ada",
        email: "ada@example.com",
        role: Role.USER,
        skipOnboarding: false,
      },
    });
    queueJsonResponse({ hasPending: false });
    queueJsonResponse({}, { status: 409 });

    render(<FAQPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Request Admin Access" })
      ).toBeEnabled()
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Request Admin Access" })
    );

    expect(
      await screen.findByText(
        "You already have a pending request. Please wait for an admin to review it."
      )
    ).toBeInTheDocument();
  });

  it("shows a generic error when submission fails", async () => {
    setMockRequireAuthState({
      user: {
        id: "user-1",
        username: "Ada",
        email: "ada@example.com",
        role: Role.USER,
        skipOnboarding: false,
      },
    });
    queueJsonResponse({ hasPending: false });
    queueJsonResponse({}, { status: 500 });

    render(<FAQPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Request Admin Access" })
      ).toBeEnabled()
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Request Admin Access" })
    );

    expect(
      await screen.findByText("Failed to submit request. Please try again later.")
    ).toBeInTheDocument();
  });
});
