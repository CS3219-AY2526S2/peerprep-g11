import { fireEvent, render, screen } from "@testing-library/react";

import ProfilePage from "@/app/profile/page";
import { Role } from "@/lib/auth";
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

jest.mock("@/contexts/AuthContext", () =>
  jest.requireActual("@/test-utils/mock-auth")
);
jest.mock("@/components/ui/navBar", () => ({
  NavBar: () => <div data-testid="navbar" />,
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    resetMockAuth();
    resetFetchMock();
    setMockAuthState({
      user: {
        id: "user-1",
        username: "Ada",
        email: "ada@example.com",
        role: Role.USER,
        skipOnboarding: false,
      },
      isAuthenticated: true,
    });
  });

  it("renders the current user information", () => {
    render(<ProfilePage />);

    expect(screen.getByDisplayValue("ada@example.com")).toBeDisabled();
    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
  });

  it("blocks invalid form submission", () => {
    render(<ProfilePage />);

    fireEvent.change(screen.getByDisplayValue("Ada"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByText("* Username is required")).toBeInTheDocument();
  });

  it("shows success and refreshes auth after saving", async () => {
    queueJsonResponse({ ok: true });

    const { container } = render(<ProfilePage />);

    fireEvent.change(screen.getByDisplayValue("Ada"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByPlaceholderText("Leave blank to keep current password"), {
      target: { value: "ValidPass123" },
    });
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    fireEvent.change(passwordInputs[1] as HTMLInputElement, {
      target: { value: "ValidPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Profile updated successfully.")
    ).toBeInTheDocument();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an API error message on failure", async () => {
    queueJsonResponse({ error: "Update failed." }, { status: 400 });

    const { container } = render(<ProfilePage />);

    fireEvent.change(screen.getByPlaceholderText("Leave blank to keep current password"), {
      target: { value: "ValidPass123" },
    });
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    fireEvent.change(passwordInputs[1] as HTMLInputElement, {
      target: { value: "ValidPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Update failed.")).toBeInTheDocument();
  });

  it("shows a network error when saving throws", async () => {
    queueFetchReject();

    const { container } = render(<ProfilePage />);

    fireEvent.change(screen.getByPlaceholderText("Leave blank to keep current password"), {
      target: { value: "ValidPass123" },
    });
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    fireEvent.change(passwordInputs[1] as HTMLInputElement, {
      target: { value: "ValidPass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Network error. Please try again later.")
    ).toBeInTheDocument();
  });
});
