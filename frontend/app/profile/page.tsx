'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NavBar } from '@/components/ui/navBar';
import { 
    passwordLengthValid,
    passwordUppercaseValid,
    PasswordCriteria
} from '@/lib/passwordValidation'

export default function ProfilePage() {
  const { user, refresh } = useAuth(); 

  const [username, setUsername] = useState(user?.username ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [apiError, setApiError] = useState('');

  const passwordsMatch = password === confirmPassword;

  const isFormValid =
    username.trim() !== '' &&
    passwordLengthValid(password) &&
    passwordUppercaseValid(password) &&
    passwordsMatch;

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true, confirmPassword: true });
    if (!isFormValid) return;

    setIsLoading(true);
    setApiError('');
    setApiMessage('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          ...(password ? { password } : {}), // only send password if provided
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setApiMessage('Profile updated successfully.');
        setPassword('');
        setConfirmPassword('');
        refresh?.();
      } else {
        setApiError(data?.error || 'Update failed.');
      }
    } catch {
      setApiError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const CriterionRow = ({ met, label }: { met: boolean; label: string }) => (
    <span
      className={`flex items-center gap-1.5 text-[11px] ${
        met ? 'text-emerald-600' : 'text-muted-foreground'
      }`}
    >
      <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 shrink-0">
        {met ? (
          <path
            d="M3 8l3.5 3.5L13 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
      {label}
    </span>
  );

  return (
    <div>
        <NavBar/>
        <div className="min-h-screen grid place-items-start px-6 py-10 bg-background justify-center">
        <div className="w-full min-w-[420px] grid gap-6">
            <div className="grid gap-1">
            <h1
                className="text-2xl font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-serif)' }}
            >
                Profile Settings
            </h1>
            <p className="text-[12.5px] text-muted-foreground">
                Update your account information
            </p>
            </div>

            <Card className="shadow-[var(--shadow-lg)] border-border">
            <form onSubmit={handleSubmit} noValidate>
                <CardContent className="grid gap-4">

                {apiError && (
                    <Alert variant="destructive">
                    <AlertDescription className="text-[12px]">
                        {apiError}
                    </AlertDescription>
                    </Alert>
                )}

                {apiMessage && (
                    <Alert>
                    <AlertDescription className="text-[12px]">
                        {apiMessage}
                    </AlertDescription>
                    </Alert>
                )}

                {/* Email (read-only) */}
                <div className="grid gap-1.5">
                    <Label className="text-[12.5px] font-semibold">
                    Email
                    </Label>
                    <Input
                    value={user?.email ?? ''}
                    disabled
                    className="h-9 text-[12.5px]"
                    />
                </div>

                {/* Username */}
                <div className="grid gap-1.5">
                    <Label className="text-[12.5px] font-semibold">
                    Username
                    </Label>
                    <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => handleBlur('username')}
                    className="h-9 text-[12.5px]"
                    />
                    {touched.username && username.trim() === '' && (
                    <p className="text-[11px] text-destructive">
                        * Username is required
                    </p>
                    )}
                </div>

                {/* New Password */}
                <div className="grid gap-1.5">
                    <Label className="text-[12.5px] font-semibold">
                    New Password (optional)
                    </Label>
                    <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Leave blank to keep current password"
                    className="h-9 text-[12.5px]"
                    />

                    {touched.password &&
                    (!passwordLengthValid || !passwordUppercaseValid) && (
                        <p className="text-[11px] text-destructive">
                        * Password must meet all criteria
                        </p>
                    )}

                    {password.length > 0 && (
                    <div className="grid gap-1 mt-0.5 pl-0.5">
                        <PasswordCriteria password={password} />
                    </div>
                    )}
                </div>

                {/* Confirm Password */}
                {password.length > 0 && (
                    <div className="grid gap-1.5">
                    <Label className="text-[12.5px] font-semibold">
                        Confirm Password
                    </Label>
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        className="h-9 text-[12.5px]"
                    />
                    {touched.confirmPassword && !passwordsMatch && (
                        <p className="text-[11px] text-destructive">
                        * Passwords must match
                        </p>
                    )}
                    </div>
                )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2 py-6">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-9 text-[12.5px] font-semibold"
                >
                    {isLoading ? 'Saving changes…' : 'Save Changes'}
                </Button>
                </CardFooter>
            </form>
            </Card>
        </div>
        </div>
    </div>

  );
}