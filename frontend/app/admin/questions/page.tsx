'use client';

import { useEffect } from 'react';
import { NavBar } from '@/components/ui/navBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function AdminDashboardPage() {
  const { user, isLoading } = useRequireAuth('admin');

  useEffect(() => {
    // Don't fetch until auth is resolved
    if (isLoading || !user) return;
  }, [isLoading, user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
        <Card className="border-border shadow-[var(--shadow)]">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-[15px] font-semibold"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
               Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
          </CardContent>
        </Card>
    </div>
  );
}