'use client';

import { Button } from '@/components/ui/button';
import type { MatchingPreferences } from '@/app/matching/types';
import { PROGRAMMING_LANGUAGE_LABELS } from '@/lib/programming-languages';

interface TimedOutCardProps {
    preferences: MatchingPreferences;
    onRetry: () => void;
    onBack: () => void;
}

export function TimedOutCard({ preferences, onRetry, onBack }: TimedOutCardProps) {
    const language = PROGRAMMING_LANGUAGE_LABELS[preferences.language];

    return (
        <div className="flex flex-col items-center gap-6 animate-fade-in-up max-w-[360px] text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-destructive/8 grid place-items-center">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className="text-destructive/60">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M12 7v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="0.8" fill="currentColor" />
                </svg>
            </div>

            <div>
                <h1
                    className="text-[20px] font-bold text-foreground tracking-tight"
                    style={{ fontFamily: 'var(--font-serif)' }}
                >
                    No match found
                </h1>
                <p className="text-[12.5px] text-muted-foreground mt-2 leading-relaxed">
                    We couldn&apos;t find a peer for{' '}
                    <span className="font-semibold text-foreground">{preferences.topic}</span> at{' '}
                    <span className="font-semibold text-foreground">{preferences.difficulty}</span> in{' '}
                    <span className="font-semibold text-foreground">{language}</span>.
                </p>
            </div>

            <div className="w-full space-y-2">
                <Button
                    onClick={onRetry}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] text-[13px] font-semibold rounded-lg h-10 transition-all duration-150 cursor-pointer"
                >
                    Try Again
                </Button>
                <button
                    onClick={onBack}
                    type="button"
                    className="w-full text-[12px] text-muted-foreground font-medium hover:text-accent transition-colors duration-150 py-1.5 cursor-pointer select-none"
                >
                    Change Preferences
                </button>
            </div>
        </div>
    );
}
