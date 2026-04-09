'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <div className="grid h-[calc(100vh-8rem)] place-items-center px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center animate-fade-in-up">
        <div className="relative mb-8">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-destructive/[0.07]">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-destructive/[0.09]">
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                className="text-destructive/80"
              >
                <path
                  d="M12 8v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-destructive/70">
          Session Error
        </p>

        <h1
          className="mb-3 text-[1.65rem] font-semibold leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {title}
        </h1>

        <p className="mb-8 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          {message}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {onRetry ? (
            <Button
              onClick={onRetry}
              className="text-[12.5px] font-semibold px-5"
            >
              Retry
            </Button>
          ) : null}
          <Button
            asChild
            variant="outline"
            className="text-[12.5px] font-semibold px-5"
          >
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        <div className="mb-4 h-px w-10 bg-border" />

        <p className="font-mono text-[10.5px] tracking-wide text-muted-foreground/60">
          ERR_SESSION_LOAD_FAILED
        </p>
      </div>
    </div>
  );
}
