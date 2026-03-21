'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAvatarColor } from '@/lib/avatar';
import type { SessionParticipant } from '@/app/sessions/[sessionId]/types';

interface ParticipantsCardProps {
  participants: SessionParticipant[];
}

function initial(name: string) {
  return (name[0] ?? '?').toUpperCase();
}

export function ParticipantsCard({ participants }: ParticipantsCardProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <div data-nextstep="participants-card" className="flex items-center gap-1.5">
        {participants.map((p) => {
          const connected = p.presence === 'connected';
          const bg = getAvatarColor(p.username);
          const label = p.isCurrentUser ? 'You' : p.username;

          return (
            <Tooltip key={p.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full outline-none transition-transform duration-200 hover:scale-110 focus-visible:scale-110"
                  style={{ backgroundColor: bg }}
                  aria-label={`${label} — ${connected ? 'Connected' : 'Disconnected'}`}
                >
                  <span className="text-[13px] font-semibold leading-none text-white">
                    {initial(p.username)}
                  </span>

                  {/* status dot */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-card ${
                      connected ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                  >
                    {connected && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    )}
                  </span>
                </button>
              </TooltipTrigger>

              <TooltipContent side="bottom" sideOffset={6}>
                <p className="text-[11px] font-semibold leading-tight">
                  {label}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] opacity-80">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      connected ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {connected ? 'Connected' : 'Disconnected'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
