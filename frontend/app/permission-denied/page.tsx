'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function PermissionDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-10 py-12 grid place-items-center min-h-[calc(100vh-57px)]">
        <Card className="w-[520px] max-w-full border-destructive/30 bg-destructive/5 shadow-[0_12px_26px_rgba(201,74,74,0.12)]">
          <CardHeader>
            {/* Icon */}
            <div className="w-[52px] h-[52px] rounded-2xl bg-destructive/10 border border-destructive/25 grid place-items-center mb-3">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" className="text-destructive">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10V7.6C8 5.6 9.8 4 12 4s4 1.6 4 3.6V10" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="15" r="1.5" fill="currentColor" />
              </svg>
            </div>

            <p className="text-[11.5px] font-semibold text-destructive tracking-wide uppercase">
              Access Restricted
            </p>
            <CardTitle
              className="text-xl text-destructive mt-1"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Permission Denied
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-[12.5px] text-muted-foreground leading-relaxed">
              You don&apos;t have access to view this page. This area is limited to users with the
              required role or session permissions. If you believe this is a mistake, contact your
              administrator or return to a page you can access.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                onClick={() => router.push('/dashboard')}
                className="shadow-[0_10px_18px_rgba(201,74,74,0.28)] text-[12.5px] font-semibold"
              >
                Return Home
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/questions')}
                className="border-destructive/30 text-foreground hover:bg-destructive/5 text-[12.5px] font-semibold"
              >
                Browse Questions
              </Button>
            </div>
            <p className="text-[11px] text-destructive/70 font-mono">
              Error 403 · Permission check failed
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}