'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LeaveSessionResponse } from '@/app/sessions/[sessionId]/types';

interface LeaveSessionDialogProps {
  sessionId: string;
  onSuccess: (response: LeaveSessionResponse) => void;
  onError: (message: string) => void;
}

export function LeaveSessionDialog({
  sessionId,
  onSuccess,
  onError,
}: LeaveSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleLeave() {
    setIsSubmitting(true);
    setLocalError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const body = (await response.json()) as LeaveSessionResponse | { error?: string };

      if (!response.ok) {
        const message = 'error' in body && body.error ? body.error : 'Failed to leave session';
        setLocalError(message);
        onError(message);
        return;
      }

      setOpen(false);
      onError('');
      onSuccess(body as LeaveSessionResponse);
    } catch {
      const message = 'Failed to leave session';
      setLocalError(message);
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="rounded-full px-4 text-[12.5px] font-semibold shadow-[var(--shadow-lg)]"
        >
          Leave Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[460px] rounded-2xl border-border bg-card p-6 shadow-[var(--shadow-xl)]">
        <DialogHeader className="gap-3 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/15 bg-destructive/10 text-destructive">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M10 7H6.8C5.8 7 5 7.8 5 8.8v6.4C5 16.2 5.8 17 6.8 17H10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M14 8l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 12h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <DialogTitle
              className="text-[20px] text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Leave collaboration session?
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              You&apos;ll leave the current session and return to the dashboard. Real-time rejoin
              is not implemented yet in this mocked flow.
            </DialogDescription>
          </div>
        </DialogHeader>

        {localError ? (
          <Alert variant="destructive" className="border-destructive/20">
            <AlertDescription className="text-[12px]">{localError}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="rounded-full text-[12.5px]"
          >
            Stay Here
          </Button>
          <Button
            variant="destructive"
            onClick={handleLeave}
            disabled={isSubmitting}
            className="rounded-full text-[12.5px]"
          >
            {isSubmitting ? 'Leaving...' : 'Confirm Leave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
