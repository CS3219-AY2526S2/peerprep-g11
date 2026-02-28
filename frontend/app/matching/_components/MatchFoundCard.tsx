'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PreferenceSummaryBadge } from './PreferenceSummaryBadge';
import type { MatchingPreferences } from '@/app/matching/types';

interface MatchFoundCardProps {
    preferences: MatchingPreferences;
    partnerName?: string;
    matchId?: string;
}

export function MatchFoundCard({ preferences, partnerName, matchId }: MatchFoundCardProps) {
    return (
        <Card className="w-[420px] shadow-[var(--shadow-xl)] border-border p-6 flex flex-col items-center gap-5">
            {/* Animated success icon with expanding rings */}
            <div className="relative flex items-center justify-center w-20 h-20">
                <span className="absolute inset-0 rounded-full bg-accent/10 animate-ping" style={{ animationDuration: '2.5s', animationIterationCount: '3' }} />
                <div className="relative w-14 h-14 rounded-full bg-accent/15 border-2 border-accent/40 grid place-items-center">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" className="text-accent">
                        <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>

            <div className="text-center">
                <h1
                    className="text-[20px] font-bold text-foreground"
                    style={{ fontFamily: 'var(--font-serif)' }}
                >
                    Match found!
                </h1>
                {partnerName && (
                    <p className="text-[12.5px] text-muted-foreground mt-1">
                        You&apos;ve been paired with{' '}
                        <span className="font-semibold text-foreground">{partnerName}</span>
                    </p>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
                <PreferenceSummaryBadge label="Topic" value={preferences.topic} />
                <PreferenceSummaryBadge label="Difficulty" value={preferences.difficulty} />
                <PreferenceSummaryBadge label="Language" value={preferences.language} />
            </div>

            <Button
                asChild
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow)] text-[13px] font-semibold rounded-lg"
            >
                {/* TODO: Replace with actual session URL using matchId */}
                <a href={matchId ? `/sessions/${matchId}` : '/sessions'}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" className="mr-2">
                        <path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Enter Session
                </a>
            </Button>
        </Card>
    );
}
