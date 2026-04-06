'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { CardComponentProps } from 'nextstepjs';
import { NextStepProvider, NextStep, useNextStep } from 'nextstepjs';
import { useAuth } from '@/contexts/AuthContext';
import { sessionTourSteps, SESSION_TOUR_ID } from './sessionTourSteps';
import { TourCard } from './TourCard';

function TourScrollSync() {
  const { isNextStepVisible } = useNextStep();

  useEffect(() => {
    if (!isNextStepVisible) return;

    let rafId = 0;

    const recalc = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    };

    window.addEventListener('scroll', recalc, { passive: true });
    document.addEventListener('scroll', recalc, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', recalc);
      document.removeEventListener('scroll', recalc, { capture: true } as EventListenerOptions);
      cancelAnimationFrame(rafId);
    };
  }, [isNextStepVisible]);

  return null;
}

const skippedUserIds = new Set<string>();

function hasSkippedOnboardingInMemory(userId: string | undefined): boolean {
  return Boolean(userId && skippedUserIds.has(userId));
}

function markSkippedOnboardingInMemory(userId: string | undefined) {
  if (userId) {
    skippedUserIds.add(userId);
  }
}

/**
 * Auto-starts the session tour on first visit (when not skipped).
 * Polls for the first tour target element before triggering, ensuring
 * the DOM is ready.
 */
function TourAutoStarter({
  isSkipped,
  isAuthLoading,
}: {
  isSkipped: boolean;
  isAuthLoading: boolean;
}) {
  const { startNextStep } = useNextStep();
  const hasStarted = useRef(false);

  const tryStart = useCallback(() => {
    if (hasStarted.current || isSkipped || isAuthLoading) return;

    // Wait until the first tour target is in the DOM
    const firstTarget = document.querySelector('[data-nextstep="question-panel"]');
    if (!firstTarget) return;

    hasStarted.current = true;
    startNextStep(SESSION_TOUR_ID);
  }, [isAuthLoading, isSkipped, startNextStep]);

  useEffect(() => {
    if (isSkipped || isAuthLoading || hasStarted.current) return;

    // Try immediately, then retry with increasing delays
    const timers = [
      setTimeout(tryStart, 100),
      setTimeout(tryStart, 500),
      setTimeout(tryStart, 1200),
      setTimeout(tryStart, 2500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isAuthLoading, isSkipped, tryStart]);

  return null;
}

interface SessionOnboardingTourProps {
  children: React.ReactNode;
  onStepChange?: (stepIndex: number | null) => void;
  isNextDisabled?: boolean;
  nextDisabledMessage?: string | null;
}

export function SessionOnboardingTour({
  children,
  onStepChange,
  isNextDisabled = false,
  nextDisabledMessage = null,
}: SessionOnboardingTourProps) {
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const isSkipped = (user?.skipOnboarding ?? false) || hasSkippedOnboardingInMemory(userId);
  const skippedRef = useRef(isSkipped);

  useEffect(() => {
    skippedRef.current = isSkipped;
  }, [isSkipped]);

  const handleDontShowAgain = useCallback(
    async (closeTour: () => void) => {
      closeTour();
      onStepChange?.(null);

      if (skippedRef.current) {
        return;
      }

      try {
        const res = await fetch('/api/users/onboarding-preference', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ skip_onboarding: 1 }),
        });

        if (!res.ok) {
          console.error('Failed to persist onboarding preference');
          return;
        }

        markSkippedOnboardingInMemory(userId);
        skippedRef.current = true;
      } catch (error) {
        console.error('Failed to persist onboarding preference', error);
      }
    },
    [onStepChange, userId]
  );
  const WrappedTourCard = useCallback(
    (props: CardComponentProps) => (
      <TourCard
        {...props}
        isNextDisabled={isNextDisabled}
        nextDisabledMessage={nextDisabledMessage}
        onDontShowAgain={handleDontShowAgain}
        showDontShowAgain={!skippedRef.current}
      />
    ),
    [handleDontShowAgain, isNextDisabled, nextDisabledMessage]
  );
  const handleTourStart = useCallback(
    (tourName: string | null) => {
      if (tourName === SESSION_TOUR_ID) {
        onStepChange?.(0);
      }
    },
    [onStepChange]
  );
  const handleTourStepChange = useCallback(
    (step: number, tourName: string | null) => {
      if (tourName === SESSION_TOUR_ID) {
        onStepChange?.(step);
      }
    },
    [onStepChange]
  );
  const handleTourComplete = useCallback(() => {
    onStepChange?.(null);
  }, [onStepChange]);
  const handleTourSkip = useCallback(() => {
    onStepChange?.(null);
  }, [onStepChange]);

  return (
    <NextStepProvider>
      <NextStep
        steps={sessionTourSteps}
        cardComponent={WrappedTourCard}
        shadowRgb="0, 0, 0"
        shadowOpacity="0.35"
        displayArrow
        scrollToTop={false}
        onStart={handleTourStart}
        onStepChange={handleTourStepChange}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      >
        <TourAutoStarter isSkipped={isSkipped} isAuthLoading={isLoading} />
        <TourScrollSync />
        {children}
      </NextStep>
    </NextStepProvider>
  );
}

export { SESSION_TOUR_ID };
