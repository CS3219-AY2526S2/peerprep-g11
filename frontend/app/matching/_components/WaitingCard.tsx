'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PreferenceSummaryBadge } from './PreferenceSummaryBadge';
import type { MatchingPreferences } from '@/app/matching/types';
import { PROGRAMMING_LANGUAGE_LABELS } from '@/lib/programming-languages';

interface WaitingCardProps {
    preferences: MatchingPreferences;
    elapsedSeconds: number;
    onCancel: () => void;
    isCancelling?: boolean;
}

function formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WaitingCard({ preferences, elapsedSeconds, onCancel, isCancelling }: WaitingCardProps) {
    return (
        <Card className="w-[420px] shadow-[var(--shadow-xl)] border-border p-6 flex flex-col items-center gap-5">
            {/* Animated pulse ring */}
            <div className="relative flex items-center justify-center w-20 h-20">
                <span className="absolute inset-0 rounded-full bg-accent/10 animate-ping" style={{ animationDuration: '2s' }} />
                <span className="absolute inset-2 rounded-full bg-accent/5 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
                <div className="relative w-14 h-14 rounded-full bg-accent/10 border-2 border-accent/30 grid place-items-center">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className="text-accent animate-pulse">
                        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            <div className="text-center">
                <h1
                    className="text-[20px] font-bold text-foreground"
                    style={{ fontFamily: 'var(--font-serif)' }}
                >
                    Searching for a peer&hellip;
                </h1>
                <p className="text-[12.5px] text-muted-foreground mt-1">
                    Your matching preferences
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
                <PreferenceSummaryBadge label="Topic" value={preferences.topic} />
                <PreferenceSummaryBadge label="Difficulty" value={preferences.difficulty} />
                <PreferenceSummaryBadge
                    label="Language"
                    value={PROGRAMMING_LANGUAGE_LABELS[preferences.language]}
                />
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" className="text-muted-foreground/70">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Elapsed: <span className="font-semibold text-foreground">{formatTime(elapsedSeconds)}</span></span>
            </div>

            <Button
                onClick={onCancel}
                disabled={isCancelling}
                variant="ghost"
                className="w-full text-[12.5px] font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
            >
                {isCancelling ? 'Cancelling\u2026' : 'Cancel Matching'}
            </Button>
        </Card>
    );
}
