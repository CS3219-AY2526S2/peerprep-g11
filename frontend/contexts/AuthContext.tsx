'use client';

import { Role } from '@/lib/auth';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  skipOnboarding: boolean;
}

interface RawAuthUser {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  role?: Role;
  skip_onboarding?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthUser(data: RawAuthUser): AuthUser | null {
  const userId = data.id ?? data._id;

  if (!userId || !data.username || !data.email || !data.role) {
    return null;
  }

  return {
    id: userId,
    username: data.username,
    email: data.email,
    role: data.role,
    skipOnboarding: data.skip_onboarding === 1,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the current user from the cookie-backed session.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', {
        // credentials: 'include' is implied for same-origin, but explicit for clarity
        credentials: 'include',
      });
      if (res.ok) {
        const data = (await res.json()) as RawAuthUser;
        setUser(mapAuthUser(data));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
    }
  }, []);

  // Load auth state once on mount.
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
