'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PreferenceSummaryBadge } from './PreferenceSummaryBadge';
import type { MatchingPreferences } from '@/app/matching/types';

interface TimedOutCardProps {
    preferences: MatchingPreferences;
    onRetry: () => void;
    onBack: () => void;
}

export function TimedOutCard({ preferences, onRetry, onBack }: TimedOutCardProps) {
    return (
        <Card className="w-[380px] shadow-[var(--shadow)] border-border p-5 flex flex-col gap-3.5">
            {/* Timeout icon */}
            <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 grid place-items-center">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" className="text-destructive">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            <h1
                className="text-[20px] font-bold text-center text-foreground"
                style={{ fontFamily: 'var(--font-serif)' }}
            >
                No match found
            </h1>
            <p className="text-[12.5px] text-muted-foreground text-center -mt-1.5">
                We couldn&apos;t find a peer with matching preferences within the time limit. You can try again or adjust your preferences.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-1">
                <PreferenceSummaryBadge label="Topic" value={preferences.topic} />
                <PreferenceSummaryBadge label="Difficulty" value={preferences.difficulty} />
                <PreferenceSummaryBadge label="Language" value={preferences.language} />
            </div>

            <div className="grid gap-2 mt-1">
                <Button
                    onClick={onRetry}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow)] text-[12.5px] font-semibold rounded-lg"
                >
                    Try Again
                </Button>
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="w-full text-[12.5px] text-accent font-semibold hover:bg-secondary"
                >
                    Change Preferences
                </Button>
            </div>
        </Card>
    );
}
