import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import LoginPage from "@/app/login/page";
import * as mockAuthModule from "@/test-utils/mock-auth";
import * as mockNextNavigationModule from "@/test-utils/next-navigation";
import {
  mockPush,
  resetNextNavigationMocks,
} from "@/test-utils/next-navigation";
import {
  mockRefresh,
  resetMockAuth,
  setMockAuthState,
} from "@/test-utils/mock-auth";
import {
  queueFetchReject,
  queueJsonResponse,
  resetFetchMock,
} from "@/test-utils/fetch";

jest.mock("next/navigation", () => mockNextNavigationModule);
jest.mock("@/contexts/AuthContext", () => mockAuthModule);

describe("LoginPage", () => {
  beforeEach(() => {
    resetNextNavigationMocks();
    resetMockAuth();
    resetFetchMock();
    setMockAuthState({ user: null, isAuthenticated: false });
  });

  it("shows required field validation and blocks submit", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByText("* Email is required")).toBeInTheDocument();
    expect(screen.getByText("* Password is required")).toBeInTheDocument();
  });

  it("refreshes auth and redirects on successful login", async () => {
    queueJsonResponse({ ok: true });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows an API error message on failed login", async () => {
    queueJsonResponse({ error: "Invalid credentials" }, { status: 401 });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Invalid credentials")
    ).toBeInTheDocument();
  });

  it("shows a network error message when the request throws", async () => {
    queueFetchReject();

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Network error. Please try again later.")
    ).toBeInTheDocument();
  });
});
