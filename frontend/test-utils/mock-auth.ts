import type { AuthUser } from "@/contexts/AuthContext";

interface MockAuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const mockRefresh = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
const mockLogout = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);

let mockUser: AuthUser | null = null;
let mockIsLoading = false;
let mockIsAuthenticated = false;

export function useAuth(): MockAuthContextValue {
  return {
    user: mockUser,
    isLoading: mockIsLoading,
    isAuthenticated: mockIsAuthenticated,
    refresh: mockRefresh,
    logout: mockLogout,
  };
}

export function setMockAuthState({
  user = null,
  isLoading = false,
  isAuthenticated = user !== null,
}: {
  user?: AuthUser | null;
  isLoading?: boolean;
  isAuthenticated?: boolean;
}) {
  mockUser = user;
  mockIsLoading = isLoading;
  mockIsAuthenticated = isAuthenticated;
}

export function resetMockAuth() {
  mockRefresh.mockReset();
  mockRefresh.mockResolvedValue(undefined);
  mockLogout.mockReset();
  mockLogout.mockResolvedValue(undefined);
  mockUser = null;
  mockIsLoading = false;
  mockIsAuthenticated = false;
}

export { mockLogout, mockRefresh };
