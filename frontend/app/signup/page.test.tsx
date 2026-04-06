import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CreateAccountPage from "@/app/signup/page";
import * as mockNextNavigationModule from "@/test-utils/next-navigation";
import {
  mockPush,
  resetNextNavigationMocks,
} from "@/test-utils/next-navigation";
import {
  queueFetchReject,
  queueJsonResponse,
  resetFetchMock,
} from "@/test-utils/fetch";

jest.mock("next/navigation", () => mockNextNavigationModule);

describe("CreateAccountPage", () => {
  beforeEach(() => {
    resetNextNavigationMocks();
    resetFetchMock();
  });

  it("shows validation errors and blocks invalid submission", () => {
    render(<CreateAccountPage />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "lowercase" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "mismatch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(screen.getByText("* Valid email is required")).toBeInTheDocument();
    expect(
      screen.getByText("* Password must meet all criteria")
    ).toBeInTheDocument();
    expect(screen.getByText("* Passwords must match")).toBeInTheDocument();
  });

  it("redirects to login after successful registration", async () => {
    queueJsonResponse({ ok: true }, { status: 201 });

    render(<CreateAccountPage />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "ValidPass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "ValidPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("shows an API error message on failed registration", async () => {
    queueJsonResponse({ error: "Email already in use" }, { status: 409 });

    render(<CreateAccountPage />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "ValidPass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "ValidPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText("Email already in use")
    ).toBeInTheDocument();
  });

  it("shows a network error message when registration throws", async () => {
    queueFetchReject();

    render(<CreateAccountPage />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "ValidPass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "ValidPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText("Network error. Please try again later.")
    ).toBeInTheDocument();
  });
});
