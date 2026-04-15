'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { MatchingPreferencesForm } from '@/app/matching/_components/MatchingPreferencesForm';
import { HowMatchingWorks } from '@/app/matching/_components/HowMatchingWorks';
import { WaitingCard } from '@/app/matching/_components/WaitingCard';
import { TimedOutCard } from '@/app/matching/_components/TimedOutCard';
import { MatchingErrorAlert } from '@/app/matching/_components/MatchingErrorAlert';
import type {
    AvailableMatchingTopicsResponse,
    MatchingPreferences,
    MatchRequest,
    TopicDifficulties,
} from '@/app/matching/types';
import { useRouter } from 'next/navigation';

type MatchingState = 'preferences' | 'searching' | 'matched' |'timed_out';

interface MatchingErrorState {
    message: string;
    matchId?: string;
}

export default function MatchingPage() {
    const { user, isLoading } = useRequireAuth();

    const [state, setState] = useState<MatchingState>('preferences');
    const [preferences, setPreferences] = useState<MatchingPreferences | null>(null);
    const [matchRequest, setMatchRequest] = useState<MatchRequest | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [matchingError, setMatchingError] = useState<MatchingErrorState | null>(null);
    const [topics, setTopics] = useState<string[]>([]);
    const [topicDifficulties, setTopicDifficulties] = useState<TopicDifficulties>({});

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

            const data: AvailableMatchingTopicsResponse = await res.json();
            setTopics(data.topics ?? []);
            setTopicDifficulties(data.topicDifficulties ?? {});
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }

            setTopics([]);
            setTopicDifficulties({});
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        void fetchTopics(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchTopics]);

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
        setMatchingError(null);
        try {
            const res = await fetch('/api/matching/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs),
            });

            const payload = (await res.json().catch(() => null)) as
                | { error?: string; message?: string; matchId?: string }
                | null;

            if (!res.ok) {
                setMatchingError({
                    message: payload?.message ?? payload?.error ?? 'Failed to start matching',
                    matchId: payload?.matchId,
                });
                return;
            }

            const data: MatchRequest = payload as MatchRequest;
            setPreferences(prefs);
            setMatchRequest(data);
            setElapsedSeconds(0);
            setState('searching');

            timerRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);

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
            setMatchingError({
                message: error instanceof Error
                    ? error.message
                    : 'Unable to start matching. Please check if you have started matching on another tab.',
            });
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
                <div className="px-10 pt-20 pb-16 max-w-[1080px] mx-auto">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-3.5 w-[320px] mb-7" />
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
                        <Skeleton className="h-[240px] w-full rounded-2xl" />
                        <Skeleton className="h-[240px] w-full rounded-2xl hidden lg:block" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <NavBar activePage="matching" />

            {state === 'preferences' && (
                <div className="px-10 pt-20 pb-16 max-w-[1080px] mx-auto">
                    <div className="mb-7">
                        <h1
                            className="text-[22px] font-bold text-foreground tracking-tight"
                            style={{ fontFamily: 'var(--font-serif)' }}
                        >
                            Find a Peer
                        </h1>
                        <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed max-w-[440px]">
                            Set your preferences below and we&apos;ll match you with someone ready to practice.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
                        <div className="w-full max-w-[480px]">
                            {matchingError && (
                                <MatchingErrorAlert
                                    message={matchingError.message}
                                    matchId={matchingError.matchId}
                                />
                            )}

                            <MatchingPreferencesForm
                                topics={topics}
                                topicDifficulties={topicDifficulties}
                                onSubmit={handleStartMatching}
                                isSubmitting={isSubmitting}
                            />
                        </div>

                        <HowMatchingWorks />
                    </div>
                </div>
            )}

            {(state === 'searching' || state === 'matched') && preferences && (
                <WaitingCard
                    preferences={preferences}
                    elapsedSeconds={elapsedSeconds}
                    onCancel={handleCancel}
                    isCancelling={isCancelling}
                    matched={state === 'matched'}
                    matchPartnerName={matchRequest?.partnerName}
                    onMatchAnimationDone={() => {
                        if (matchRequest?.matchId) {
                            router.push(`/sessions/${matchRequest.matchId}`);
                        }
                    }}
                />
            )}

            {state === 'timed_out' && preferences && (
                <div className="min-h-[calc(100vh-56px)] grid place-items-center">
                    <TimedOutCard
                        preferences={preferences}
                        onRetry={handleRetry}
                        onBack={handleBackToPreferences}
                        errorMessage={matchingError?.message}
                        isRetrying={isSubmitting}
                    />
                </div>
            )}
        </div>
    );
}
