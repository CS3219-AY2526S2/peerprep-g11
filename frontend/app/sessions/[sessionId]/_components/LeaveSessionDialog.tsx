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
  peerLeft: boolean;
  onSuccess: (response: LeaveSessionResponse) => void;
  onError: (message: string) => void;
}

export function LeaveSessionDialog({
  sessionId,
  peerLeft,
  onSuccess,
  onError,
}: LeaveSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleLeaveImmediate() {
    onError('');
    onSuccess({ sessionId, status: 'left', redirectTo: '/dashboard' });
  }

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

      try {
        await fetch(`/api/matches/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (endError) {
        console.warn('Failed to end match session:', endError);
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

  const leaveButton = (
    <Button
      data-nextstep="leave-session-btn"
      variant="ghost"
      onClick={peerLeft ? handleLeaveImmediate : undefined}
      className="scroll-mt-8 gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive lg:scroll-mt-10"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" className="shrink-0">
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
      Leave
    </Button>
  );

  if (peerLeft) {
    return leaveButton;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {leaveButton}
      </DialogTrigger>
      <DialogContent className="max-w-[400px] rounded-2xl border-border bg-card p-6 shadow-[var(--shadow-xl)]">
        <DialogHeader>
          <DialogTitle
            className="text-[18px] text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Leave this session?
          </DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed text-muted-foreground">
            Leaving will end the collaboration for both participants. Your progress will be saved to your attempt history.
          </DialogDescription>
        </DialogHeader>

        {localError ? (
          <Alert variant="destructive" className="border-destructive/20">
            <AlertDescription className="text-[12px]">{localError}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter className="mt-1 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="rounded-lg text-[12.5px]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLeave}
            disabled={isSubmitting}
            className="rounded-lg text-[12.5px]"
          >
            {isSubmitting ? 'Leaving\u2026' : 'Leave Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
