'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNextStep } from 'nextstepjs';
import { ParticipantsCard } from './ParticipantsCard';
import { LeaveSessionDialog } from './LeaveSessionDialog';
import { SESSION_TOUR_ID } from './sessionTourSteps';
import type {
  LeaveSessionResponse,
  SessionParticipant,
} from '@/app/sessions/[sessionId]/types';

interface SessionHeaderProps {
  sessionId: string;
  participants: SessionParticipant[];
  leaveError: string | null;
  peerLeftMessage?: string | null;
  onLeaveSuccess: (response: LeaveSessionResponse) => void;
  onLeaveError: (message: string) => void;
}

export function SessionHeader({
  sessionId,
  participants,
  leaveError,
  peerLeftMessage,
  onLeaveSuccess,
  onLeaveError,
}: SessionHeaderProps) {
  const { startNextStep } = useNextStep();
  const [peerBannerDismissed, setPeerBannerDismissed] = useState(false);

  const showPeerBanner = Boolean(peerLeftMessage) && !peerBannerDismissed;

  return (
    <div className="mb-6 grid gap-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[620px]">
          <h1
            className="text-[28px] font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Collaboration Session
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Work through the prompt together and keep your draft organized while the real-time
            collaboration service is still being integrated.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-[15px] border border-border bg-card px-4 py-2 shadow-[var(--shadow)]">
          <button
            type="button"
            onClick={() => startNextStep(SESSION_TOUR_ID)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-transparent bg-transparent px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-secondary/60 hover:text-accent"
            aria-label="Start onboarding tour"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" className="shrink-0">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Tour
          </button>
          <ParticipantsCard participants={participants} />
          <LeaveSessionDialog
            sessionId={sessionId}
            peerLeft={Boolean(peerLeftMessage)}
            onSuccess={onLeaveSuccess}
            onError={onLeaveError}
          />
        </div>
      </div>

      {showPeerBanner ? (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="shrink-0 text-destructive">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="15.5" r="0.75" fill="currentColor" />
          </svg>
          <p className="flex-1 text-[12.5px] leading-relaxed text-destructive">{peerLeftMessage}</p>
          <button
            type="button"
            onClick={() => setPeerBannerDismissed(true)}
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Dismiss notification"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}

      {leaveError ? (
        <Alert variant="destructive" className="border-destructive/20 bg-card">
          <AlertDescription className="text-[12px]">{leaveError}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
