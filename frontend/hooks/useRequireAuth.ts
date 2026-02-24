'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Use in protected pages. Redirects to /login if the user is not authenticated.
 * Optionally restrict to a specific role (e.g. 'admin').
 *
 * @example
 * export default function DashboardPage() {
 *   const { user } = useRequireAuth();
 *   if (!user) return null; // still loading / redirecting
 *   ...
 * }
 */
export function useRequireAuth(requiredRole?: 'user' | 'admin') {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/permission-denied');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  return { user, isLoading };
}