'use client';

import { useEffect, useState } from 'react';
import { AdminUserTable } from './AdminUserTable';
import { NavBar } from '@/components/ui/navBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  _id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user, isLoading } = useRequireAuth('admin');

  const [users, setUsers] = useState<User[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  const getAllUsers = async () => {

    try {
      const res = await fetch('/api/users/all', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        setFetchError(true);;
        return [];
      }
    } catch {
      setFetchError(true);
    } finally {
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
  
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('A network error occurred.');
    }
  };

  useEffect(() => {
    // Don't fetch until auth is resolved
    if (isLoading || !user) return;

    getAllUsers()
      .then(setUsers)
      .catch(() => setFetchError(true))
      .finally(() => setUsersLoading(false));
  }, [isLoading, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <div className="px-10 py-8 pb-16 max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-[22px] font-semibold text-foreground mb-1"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Admin Dashboard
            </h1>
            <p className="text-[12.5px] text-muted-foreground">
              Logged in as{' '}
              <span className="font-semibold text-foreground">{user.email}</span>
            </p>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] bg-card border-border text-muted-foreground"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            {usersLoading ? '…' : `${users.length} user${users.length !== 1 ? 's' : ''} registered`}
          </Badge>
        </div>

        {/* Error state */}
        {fetchError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="text-[12.5px]">
              Failed to load users. The user service may be unavailable.
            </AlertDescription>
          </Alert>
        )}

        {/* Users table */}
        <Card className="border-border shadow-[var(--shadow)]">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-[15px] font-semibold"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AdminUserTable users={users} onDelete={deleteUser}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}