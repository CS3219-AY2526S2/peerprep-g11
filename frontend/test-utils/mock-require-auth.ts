import type { AuthUser } from "@/contexts/AuthContext";

let mockUser: AuthUser | null = null;
let mockIsLoading = false;

export function useRequireAuth() {
  return {
    user: mockUser,
    isLoading: mockIsLoading,
  };
}

export function setMockRequireAuthState({
  user = null,
  isLoading = false,
}: {
  user?: AuthUser | null;
  isLoading?: boolean;
}) {
  mockUser = user;
  mockIsLoading = isLoading;
}

export function resetMockRequireAuth() {
  mockUser = null;
  mockIsLoading = false;
}
