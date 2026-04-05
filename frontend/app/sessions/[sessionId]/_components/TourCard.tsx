'use client';

import { useCallback } from 'react';
import type { CardComponentProps } from 'nextstepjs';
import { Button } from '@/components/ui/button';

/**
 * Custom tour tooltip card styled to match PeerPrep's design language.
 * - Warm card background, serif headings, rounded surfaces, themed shadows.
 * - "Don't show this again" only appears on the final step.
 */
interface TourCardProps extends CardComponentProps {
  isNextDisabled?: boolean;
  nextDisabledMessage?: string | null;
  onDontShowAgain?: (closeTour: () => void) => void | Promise<void>;
  showDontShowAgain?: boolean;
}

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
  isNextDisabled = false,
  nextDisabledMessage = null,
  onDontShowAgain,
  showDontShowAgain = true,
}: TourCardProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const handleDontShowAgain = useCallback(() => {
    if (onDontShowAgain) {
      void onDontShowAgain(() => {
        skipTour?.();
      });
      return;
    }

    skipTour?.();
  }, [onDontShowAgain, skipTour]);

  return (
    <div className="w-[300px] rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xl)]">
      <div className="mb-3 flex items-center gap-2.5">
        {step.icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center text-accent">
            {step.icon}
          </span>
        )}
        <h3
          className="text-[17px] font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {step.title}
        </h3>
      </div>

      <p className="mb-4 text-[12.5px] leading-relaxed text-muted-foreground">
        {step.content}
      </p>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {currentStep + 1} of {totalSteps}
        </span>

        <div className="flex items-center gap-2">
          {!isFirst && step.showControls && (
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              className="rounded-full px-3 text-[11.5px]"
            >
              Back
            </Button>
          )}

          {step.showControls && (
            <Button
              size="sm"
              onClick={nextStep}
              disabled={isNextDisabled}
              className="rounded-full px-4 text-[11.5px] shadow-[var(--shadow)]"
            >
              {isLast ? 'Got it' : 'Next'}
            </Button>
          )}
        </div>
      </div>

      {isNextDisabled && nextDisabledMessage ? (
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {nextDisabledMessage}
        </p>
      ) : null}

      {skipTour && isLast && showDontShowAgain && (
        <button
          onClick={handleDontShowAgain}
          className="mt-3 w-full cursor-pointer text-center text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Don&apos;t show this again
        </button>
      )}

      {arrow}
    </div>
  );
}
