'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function SessionErrorState({
  title,
  message,
  onRetry,
}: SessionErrorStateProps) {
  return (
    <Card className="mx-auto max-w-[560px] border-border bg-card shadow-[var(--shadow-xl)]">
      <CardHeader className="gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M12 8v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <CardTitle
            className="text-[22px] text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {title}
          </CardTitle>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{message}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-[12px] text-muted-foreground">
          The collaboration and question services are still mocked in this frontend flow.
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        {onRetry ? (
          <Button onClick={onRetry} className="rounded-full text-[12.5px]">
            Retry
          </Button>
        ) : null}
        <Button asChild variant="outline" className="rounded-full text-[12.5px]">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
