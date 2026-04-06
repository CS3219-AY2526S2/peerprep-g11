import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Role } from "@/lib/auth";
import {
  fetchMock,
  queueJsonResponse,
  resetFetchMock,
} from "@/test-utils/fetch";

function AuthConsumer() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  return (
    <div>
      <p data-testid="loading">{String(isLoading)}</p>
      <p data-testid="authenticated">{String(isAuthenticated)}</p>
      <p data-testid="username">{user?.username ?? "none"}</p>
      <button onClick={() => void logout()}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("loads the current user on mount", async () => {
    queueJsonResponse({
      _id: "user-1",
      username: "Ada",
      email: "ada@example.com",
      role: Role.USER,
      skip_onboarding: 1,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("username")).toHaveTextContent("Ada")
    );
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
  });

  it("clears auth state for unauthenticated responses", async () => {
    queueJsonResponse({ error: "Unauthenticated" }, { status: 401 });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("username")).toHaveTextContent("none");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("clears auth state for malformed user payloads", async () => {
    queueJsonResponse({
      id: "user-1",
      username: "Ada",
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("username")).toHaveTextContent("none");
  });

  it("clears auth state after logout", async () => {
    queueJsonResponse({
      id: "user-1",
      username: "Ada",
      email: "ada@example.com",
      role: Role.USER,
      skip_onboarding: 0,
    });
    queueJsonResponse({ ok: true });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("username")).toHaveTextContent("Ada")
    );

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() =>
      expect(screen.getByTestId("username")).toHaveTextContent("none")
    );
    expect(fetchMock).toHaveBeenLastCalledWith("/api/users/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("throws when useAuth is used outside the provider", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    function OrphanConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<OrphanConsumer />)).toThrow(
      "useAuth must be used inside <AuthProvider>"
    );

    consoleErrorSpy.mockRestore();
  });
});
