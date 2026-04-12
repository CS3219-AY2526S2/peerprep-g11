'use client';

import { Button } from '@/components/ui/button';
import type { MatchingPreferences } from '@/app/matching/types';
import { PROGRAMMING_LANGUAGE_LABELS } from '@/lib/programming-languages';

interface MatchFoundCardProps {
    preferences: MatchingPreferences;
    partnerId?: string;
    partnerName?: string;
    onCancel: () => void;
    isCancelling?: boolean;
    onEnterSession: () => void;
}

export function MatchFoundCard({ preferences, partnerName, onCancel, isCancelling, onEnterSession }: MatchFoundCardProps) {
    return (
        <div className="flex flex-col items-center gap-6 animate-fade-in-up">
            {/* Success icon */}
            <div className="relative flex items-center justify-center w-20 h-20">
                <span
                    className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping"
                    style={{ animationDuration: '2.5s', animationIterationCount: '3' }}
                />
                <div className="relative w-14 h-14 rounded-full bg-accent/8 grid place-items-center">
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
                    className="text-[22px] font-bold text-foreground tracking-tight"
                    style={{ fontFamily: 'var(--font-serif)' }}
                >
                    Match found!
                </h1>
                {partnerName && (
                    <p className="text-[12.5px] text-muted-foreground mt-1.5">
                        You&apos;ve been paired with{' '}
                        <span className="font-semibold text-foreground">{partnerName}</span>
                    </p>
                )}
            </div>

            {/* Preference pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/8 text-accent text-[11.5px] font-semibold">
                    {preferences.topic}
                </span>
                <span className="text-muted-foreground/30 text-[10px] select-none">&middot;</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/8 text-accent text-[11.5px] font-semibold">
                    {preferences.difficulty}
                </span>
                <span className="text-muted-foreground/30 text-[10px] select-none">&middot;</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/8 text-accent text-[11.5px] font-semibold">
                    {PROGRAMMING_LANGUAGE_LABELS[preferences.language]}
                </span>
            </div>

            <div className="w-[280px] space-y-2">
                <Button
                    onClick={onEnterSession}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] shadow-sm text-[13px] font-semibold rounded-lg h-10 transition-all duration-150 cursor-pointer"
                >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" className="mr-1.5">
                        <path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Enter Session
                </Button>
                <Button
                    onClick={onCancel}
                    disabled={isCancelling}
                    variant="ghost"
                    className="w-full text-[12.5px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-lg transition-all duration-150 active:scale-[0.97] cursor-pointer"
                >
                    {isCancelling ? 'Cancelling\u2026' : 'Cancel'}
                </Button>
            </div>
        </div>
    );
}
