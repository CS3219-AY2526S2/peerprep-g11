'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DeletedQuestionSummary } from '@/app/questions/types';

interface BulkDeleteQuestionsDialogProps {
  open: boolean;
  questions: DeletedQuestionSummary[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function BulkDeleteQuestionsDialog({
  open,
  questions,
  onOpenChange,
  onConfirm,
}: BulkDeleteQuestionsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSubmitting(true);
    setLocalError(null);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to delete questions');
    } finally {
      setIsSubmitting(false);
    }
  }

  const questionCount = questions.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          setLocalError(null);
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-w-[520px] rounded-2xl border-border bg-card p-6 shadow-[var(--shadow-xl)]">
        <DialogHeader className="gap-3 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/15 bg-destructive/10 text-destructive">
            <Trash2 className="h-[18px] w-[18px]" />
          </div>
          <div>
            <DialogTitle
              className="text-[20px] text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Delete {questionCount} question{questionCount === 1 ? '' : 's'}?
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              This will permanently remove the selected questions from the question bank.
            </DialogDescription>
          </div>
        </DialogHeader>

        {localError ? (
          <Alert variant="destructive" className="border-destructive/20">
            <AlertDescription className="text-[12px]">{localError}</AlertDescription>
          </Alert>
        ) : null}

        <div>
          <p className="text-[12px] font-semibold text-foreground">
            Selected Questions ({questionCount})
          </p>
          <div className="mt-3 max-h-48 overflow-y-auto border-y border-border">
            {questions.map((question, index) => (
              <div
                key={question.slug}
                className="grid grid-cols-[28px_1fr] items-start gap-3 border-b border-border/80 py-3 text-[12.5px] text-foreground last:border-b-0"
              >
                <span className="pt-0.5 text-[11px] font-medium text-muted-foreground">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span className="leading-relaxed">{question.title}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-lg border-amber-200 bg-amber-50 text-[12.5px] text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-lg border-rose-200 bg-rose-50 text-[12.5px] text-rose-800 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-900"
          >
            {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
