'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { MatchingPreferencesForm } from '@/app/matching/_components/MatchingPreferencesForm';
import { HowMatchingWorks } from '@/app/matching/_components/HowMatchingWorks';
import { WaitingCard } from '@/app/matching/_components/WaitingCard';
import { TimedOutCard } from '@/app/matching/_components/TimedOutCard';
import type { MatchingPreferences, MatchRequest } from '@/app/matching/types';
import { useRouter } from 'next/navigation';

type MatchingState = 'preferences' | 'searching' | 'matched' |'timed_out';

export default function MatchingPage() {
    const { user, isLoading } = useRequireAuth();

    const [state, setState] = useState<MatchingState>('preferences');
    const [preferences, setPreferences] = useState<MatchingPreferences | null>(null);
    const [matchRequest, setMatchRequest] = useState<MatchRequest | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [matchingError, setMatchingError] = useState('');
    const [topics, setTopics] = useState<string[]>([]);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cancelledRef = useRef(false);
    const stateRef = useRef(state);
    const matchRequestRef = useRef(matchRequest);
    const router = useRouter();

    useEffect(() => {
        stateRef.current = state;
        matchRequestRef.current = matchRequest;
    });

    const fetchTopics = useCallback(async (signal?: AbortSignal) => {
        try {
            const res = await fetch('/api/questions/topics', { signal });
            if (!res.ok) {
                throw new Error('Failed to fetch topics');
            }

            const data: { topics?: string[] } = await res.json();
            setTopics(data.topics ?? []);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }

            setTopics([]);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        void fetchTopics(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchTopics]);

    // Clear both intervals whenever matching ends or the page unmounts.
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

    const cancelMatchRequest = useCallback(async (requestId: string) => {
        if (stateRef.current !== 'searching') return;
        if (cancelledRef.current) return;
        cancelledRef.current = true;
        try {
            await fetch(`/api/matching/requests/${requestId}`, {
                method: 'DELETE',
            });
        } catch {
            // Silently fail - user is leaving anyway
        }
    }, []);

    useEffect(() => {
        return () => {
            stopTimers();
            if (cancelledRef.current) return;
            const requestId = matchRequestRef.current?.requestId;
            if (!requestId) return;
            cancelMatchRequest(requestId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stopTimers]);

    useEffect(() => {
        if (state !== 'searching') return;
        if (!matchRequest?.requestId) return;

        const handleBeforeUnload = () => {
            if (cancelledRef.current) return;
            cancelledRef.current = true;
            const data = JSON.stringify({ requestId: matchRequest.requestId });
            navigator.sendBeacon('/api/matching/requests/cancel', data);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [state, matchRequest?.requestId]);

    const handleStartMatching = async (prefs: MatchingPreferences) => {
        cancelledRef.current = false;
        setIsSubmitting(true);
        setMatchingError('');
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
                        if (statusData.matchId) {
                            setState('matched');
                            router.push(`/sessions/${statusData.matchId}`);
                        }
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
            setMatchingError('Unable to start matching. Please check if you have started matching on another tab.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!matchRequest) return;
        cancelledRef.current = true;
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
        cancelledRef.current = true;
        stopTimers();
        setMatchRequest(null);
        setElapsedSeconds(0);
        setState('preferences');
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <NavBar activePage="matching" />
                <div className="px-10 pt-20 py-8 pb-16 max-w-[1100px] mx-auto">
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
                <div className="px-10 pt-20 py-8 pb-16 max-w-[1100px] mx-auto">
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                        <div>
                            {matchingError && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription className="text-[12px]">{matchingError}</AlertDescription>
                                </Alert>
                            )}
                            <MatchingPreferencesForm
                                topics={topics}
                                onSubmit={handleStartMatching}
                                isSubmitting={isSubmitting}
                            />
                        </div>
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
