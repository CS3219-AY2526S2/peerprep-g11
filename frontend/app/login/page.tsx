'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        await refresh();
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setApiError(data?.error || 'Login failed. Please try again.');
      }
    } catch {
      setApiError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-10 bg-background">
      <div className="w-full max-w-[360px] grid gap-6">
        <Card className="shadow-[var(--shadow-lg)] border-border">
          <h1
            className="text-2xl font-semibold text-foreground text-center"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Login
          </h1>
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="grid gap-4">
              {apiError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-[12px]">{apiError}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-[12.5px] font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  className="h-9 text-[12.5px] border-input focus-visible:ring-ring"
                />
                {touched.email && !email.trim() && (
                  <p className="text-[11px] text-destructive">* Email is required</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-[12.5px] font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  className="h-9 text-[12.5px] border-input focus-visible:ring-ring"
                />
                {touched.password && !password.trim() && (
                  <p className="text-[11px] text-destructive">* Password is required</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 py-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow)] text-[12.5px] font-semibold"
              >
                {isLoading ? 'Logging in…' : 'Login'}
              </Button>
              <p className="text-center text-[11.5px] text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-accent font-semibold underline underline-offset-2">
                  Create Account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}