'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParticipantsCard } from './ParticipantsCard';
import { LeaveSessionDialog } from './LeaveSessionDialog';
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

        <div className="flex flex-col gap-2 xl:min-w-[360px] xl:flex-row xl:items-center xl:justify-end">
          <div className="xl:w-[280px]">
            <ParticipantsCard participants={participants} />
          </div>
          <div className="flex justify-end xl:items-center">
            <LeaveSessionDialog
              sessionId={sessionId}
              onSuccess={onLeaveSuccess}
              onError={onLeaveError}
            />
          </div>
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
