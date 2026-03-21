'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { CardComponentProps } from 'nextstepjs';
import { NextStepProvider, NextStep, useNextStep } from 'nextstepjs';
import { useTourPreference } from '@/hooks/useTourPreference';
import { sessionTourSteps, SESSION_TOUR_ID } from './sessionTourSteps';
import { TourCard } from './TourCard';

/**
 * Auto-starts the session tour on first visit (when not skipped).
 * Polls for the first tour target element before triggering, ensuring
 * the DOM is ready.
 */
function TourAutoStarter({ isSkipped }: { isSkipped: boolean }) {
  const { startNextStep } = useNextStep();
  const hasStarted = useRef(false);

  const tryStart = useCallback(() => {
    if (hasStarted.current || isSkipped) return;

    // Wait until the first tour target is in the DOM
    const firstTarget = document.querySelector('[data-nextstep="question-panel"]');
    if (!firstTarget) return;

    hasStarted.current = true;
    startNextStep(SESSION_TOUR_ID);
  }, [isSkipped, startNextStep]);

  useEffect(() => {
    if (isSkipped || hasStarted.current) return;

    // Try immediately, then retry with increasing delays
    const timers = [
      setTimeout(tryStart, 100),
      setTimeout(tryStart, 500),
      setTimeout(tryStart, 1200),
      setTimeout(tryStart, 2500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isSkipped, tryStart]);

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
  const { isSkipped, skip } = useTourPreference(SESSION_TOUR_ID);
  const WrappedTourCard = useCallback(
    (props: CardComponentProps) => (
      <TourCard
        {...props}
        isNextDisabled={isNextDisabled}
        nextDisabledMessage={nextDisabledMessage}
      />
    ),
    [isNextDisabled, nextDisabledMessage]
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
    skip();
  }, [onStepChange, skip]);
  const handleTourSkip = useCallback(() => {
    onStepChange?.(null);
    skip();
  }, [onStepChange, skip]);

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
        <TourAutoStarter isSkipped={isSkipped} />
        {children}
      </NextStep>
    </NextStepProvider>
  );
}

export { SESSION_TOUR_ID };
