'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { MatchingPreferencesForm } from '@/app/matching/_components/MatchingPreferencesForm';
import { HowMatchingWorks } from '@/app/matching/_components/HowMatchingWorks';
import { WaitingCard } from '@/app/matching/_components/WaitingCard';
import { MatchFoundCard } from '@/app/matching/_components/MatchFoundCard';
import { TimedOutCard } from '@/app/matching/_components/TimedOutCard';
import type { MatchingPreferences, MatchRequest } from '@/app/matching/types';

type MatchingState = 'preferences' | 'searching' | 'matched' | 'timed_out';

export default function MatchingPage() {
    const { user, isLoading } = useRequireAuth();

    const [state, setState] = useState<MatchingState>('preferences');
    const [preferences, setPreferences] = useState<MatchingPreferences | null>(null);
    const [matchRequest, setMatchRequest] = useState<MatchRequest | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── Cleanup timers ───
    const stopTimers = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stopTimers();
    }, [stopTimers]);

    const handleStartMatching = async (prefs: MatchingPreferences) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/matching/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs),
            });
            if (!res.ok) throw new Error('Failed to start matching');

            const data: MatchRequest = await res.json();
            setPreferences(prefs);
            setMatchRequest(data);
            setElapsedSeconds(0);
            setState('searching');

            // Start elapsed timer
            timerRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);

            // Start polling for match status
            pollingRef.current = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/matching/requests/${data.requestId}`);
                    if (!statusRes.ok) return;
                    const statusData: MatchRequest = await statusRes.json();

                    if (statusData.status === 'matched') {
                        stopTimers();
                        setMatchRequest(statusData);
                        setState('matched');
                    } else if (statusData.status === 'timed_out') {
                        stopTimers();
                        setMatchRequest(statusData);
                        setState('timed_out');
                    }
                } catch {
                    // Silently retry on next poll
                }
            }, 2000);
        } catch (error) {
            console.error('Error starting matching:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!matchRequest) return;
        setIsCancelling(true);
        try {
            await fetch(`/api/matching/requests/${matchRequest.requestId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Error cancelling match:', error);
        } finally {
            stopTimers();
            setIsCancelling(false);
            setMatchRequest(null);
            setElapsedSeconds(0);
            setState('preferences');
        }
    };

    const handleRetry = () => {
        if (preferences) {
            handleStartMatching(preferences);
        }
    };

    const handleBackToPreferences = () => {
        stopTimers();
        setMatchRequest(null);
        setElapsedSeconds(0);
        setState('preferences');
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <NavBar activePage="matching" />
                <div className="px-10 py-8 pb-16 max-w-[1100px] mx-auto">
                    <Skeleton className="h-6 w-52 mb-2" />
                    <Skeleton className="h-4 w-[420px] mb-1" />
                    <Skeleton className="h-4 w-[360px] mb-6" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                        <Skeleton className="h-[340px] w-full max-w-[520px] rounded-xl" />
                        <Skeleton className="h-[180px] w-full max-w-[360px] rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <NavBar activePage="matching" />

            {state === 'preferences' && (
                <div className="px-10 py-8 pb-16 max-w-[1100px] mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1
                            className="text-[20px] font-bold text-foreground mb-2"
                            style={{ fontFamily: 'var(--font-serif)' }}
                        >
                            Matching Preferences
                        </h1>
                        <p className="text-[12.5px] text-muted-foreground max-w-[520px] leading-relaxed">
                            Choose the topic, difficulty, and language you want to practice. We&apos;ll look for a
                            peer with the same preferences and start a collaborative session as soon as a match is
                            found.
                        </p>
                    </div>

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                        <MatchingPreferencesForm
                            onSubmit={handleStartMatching}
                            isSubmitting={isSubmitting}
                        />
                        <HowMatchingWorks />
                    </div>
                </div>
            )}

            {state === 'searching' && preferences && (
                <div className="min-h-[calc(100vh-56px)] grid place-items-center">
                    <WaitingCard
                        preferences={preferences}
                        elapsedSeconds={elapsedSeconds}
                        onCancel={handleCancel}
                        isCancelling={isCancelling}
                    />
                </div>
            )}

            {state === 'matched' && preferences && (
                <div className="min-h-[calc(100vh-56px)] grid place-items-center">
                    <MatchFoundCard
                        preferences={preferences}
                        partnerName={matchRequest?.partnerName}
                        matchId={matchRequest?.matchId}
                    />
                </div>
            )}

            {state === 'timed_out' && preferences && (
                <div className="min-h-[calc(100vh-56px)] grid place-items-center">
                    <TimedOutCard
                        preferences={preferences}
                        onRetry={handleRetry}
                        onBack={handleBackToPreferences}
                    />
                </div>
            )}
        </div>
    );
}
