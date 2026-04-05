'use client';

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
  onLeaveSuccess: (response: LeaveSessionResponse) => void;
  onLeaveError: (message: string) => void;
}

export function SessionHeader({
  sessionId,
  participants,
  leaveError,
  onLeaveSuccess,
  onLeaveError,
}: SessionHeaderProps) {
  const { startNextStep } = useNextStep();

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
            onSuccess={onLeaveSuccess}
            onError={onLeaveError}
          />
        </div>
      </div>

      {leaveError ? (
        <Alert variant="destructive" className="border-destructive/20 bg-card">
          <AlertDescription className="text-[12px]">{leaveError}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

