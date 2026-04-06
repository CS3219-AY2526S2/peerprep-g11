import { renderHook, waitFor } from "@testing-library/react";

import { Role } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import * as mockAuthModule from "@/test-utils/mock-auth";
import * as mockNextNavigationModule from "@/test-utils/next-navigation";
import {
  mockReplace,
  resetNextNavigationMocks,
} from "@/test-utils/next-navigation";
import {
  resetMockAuth,
  setMockAuthState,
} from "@/test-utils/mock-auth";

jest.mock("next/navigation", () => mockNextNavigationModule);
jest.mock("@/contexts/AuthContext", () => mockAuthModule);

describe("useRequireAuth", () => {
  beforeEach(() => {
    resetNextNavigationMocks();
    resetMockAuth();
  });

  it("does nothing while auth is still loading", () => {
    setMockAuthState({ isLoading: true, user: null, isAuthenticated: false });

    renderHook(() => useRequireAuth());

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to login", async () => {
    setMockAuthState({ user: null, isAuthenticated: false });

    renderHook(() => useRequireAuth());

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login")
    );
  });

  it("redirects users without the required role", async () => {
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

    renderHook(() => useRequireAuth(Role.ADMIN));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/permission-denied")
    );
  });

  it("leaves valid users on the current page", async () => {
    setMockAuthState({
      user: {
        id: "user-1",
        username: "Ada",
        email: "ada@example.com",
        role: Role.ADMIN,
        skipOnboarding: false,
      },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useRequireAuth(Role.ADMIN));

    await waitFor(() =>
      expect(result.current.user?.username).toBe("Ada")
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
