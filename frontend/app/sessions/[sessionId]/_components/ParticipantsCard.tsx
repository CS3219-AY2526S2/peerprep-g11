'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SessionParticipant } from '@/app/sessions/[sessionId]/types';

interface ParticipantsCardProps {
  participants: SessionParticipant[];
}

export function ParticipantsCard({ participants }: ParticipantsCardProps) {
  return (
    <Card className="min-w-0 gap-0 border-border bg-card py-0 shadow-[var(--shadow)]">
      <CardHeader className="px-3.5 pt-3.5 pb-2">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Participants
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 px-3.5 pb-3.5">
        {participants.map((participant) => {
          const isConnected = participant.presence === 'connected';

          return (
            <div
              key={participant.id}
              className="flex items-center justify-between gap-2 px-0 py-1"
            >
              <div className="min-w-0">
                <p className="truncate text-[11.5px] font-semibold text-foreground">
                  {participant.isCurrentUser ? 'You' : participant.username}
                </p>
                <p className="truncate text-[10px] leading-tight text-muted-foreground">
                  {participant.isCurrentUser ? participant.username : 'Peer collaborator'}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  isConnected
                    ? 'rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700'
                    : 'rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700'
                }
              >
                <span
                  className={
                    isConnected
                      ? 'mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500'
                      : 'mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500'
                  }
                />
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
