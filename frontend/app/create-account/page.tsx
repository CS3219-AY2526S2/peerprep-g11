'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateAccountPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordLengthValid = password.length >= 8;
  const passwordUppercaseValid = /[A-Z]/.test(password);
  const passwordsMatch = password === confirmPassword;

  const isFormValid =
    username.trim() !== '' &&
    emailValid &&
    passwordLengthValid &&
    passwordUppercaseValid &&
    passwordsMatch;

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
    if (!isFormValid) return;

    setIsLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (res.ok) {
        router.push('/login');
      } else {
        const data = await res.json();
        setApiError(data?.error || 'Registration failed. Please try again.');
      }
    } catch {
      setApiError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const CriterionRow = ({ met, label }: { met: boolean; label: string }) => (
    <span className={`flex items-center gap-1.5 text-[11px] ${met ? 'text-emerald-600' : 'text-muted-foreground'}`}>
      <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 shrink-0">
        {met ? (
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
      {label}
    </span>
  );

  return (
    <div className="min-h-screen grid place-items-center px-6 py-10 bg-background">
      <div className="w-full max-w-[380px] grid gap-6">
        <div className="text-center grid gap-1">
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Create your account
          </h1>
          <p className="text-[12.5px] text-muted-foreground">
            Join PeerPrep and start practicing today
          </p>
        </div>

        <Card className="shadow-[var(--shadow-lg)] border-border">
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="grid gap-4">
              {apiError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-[12px]">{apiError}</AlertDescription>
                </Alert>
              )}

              {/* Username */}
              <div className="grid gap-1.5">
                <Label htmlFor="username" className="text-[12.5px] font-semibold">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => handleBlur('username')}
                  placeholder="Choose a username"
                  className="h-9 text-[12.5px] border-input focus-visible:ring-ring"
                />
                {touched.username && username.trim() === '' && (
                  <p className="text-[11px] text-destructive">* Username is required</p>
                )}
              </div>

              {/* Email */}
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-[12.5px] font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  className="h-9 text-[12.5px] border-input focus-visible:ring-ring"
                />
                {touched.email && !emailValid && (
                  <p className="text-[11px] text-destructive">* Valid email is required</p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-[12.5px] font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Create a password"
                  className="h-9 text-[12.5px] border-input focus-visible:ring-ring"
                />
                {touched.password && (!passwordLengthValid || !passwordUppercaseValid) && (
                  <p className="text-[11px] text-destructive">* Password must meet all criteria</p>
                )}
                <div className="grid gap-1 mt-0.5 pl-0.5">
                  <CriterionRow met={passwordLengthValid} label="Minimum 8 characters" />
                  <CriterionRow met={passwordUppercaseValid} label="At least one uppercase letter" />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="grid gap-1.5">
                <Label htmlFor="confirmPassword" className="text-[12.5px] font-semibold">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Repeat your password"
                  className="h-9 text-[12.5px] border-input focus-visible:ring-ring"
                />
                {touched.confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-destructive">* Passwords must match</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 py-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow)] text-[12.5px] font-semibold"
              >
                {isLoading ? 'Creating account…' : 'Create Account'}
              </Button>
              <p className="text-center text-[11.5px] text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-accent font-semibold underline underline-offset-2">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}