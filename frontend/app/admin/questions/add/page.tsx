'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { NavBar } from '@/components/ui/navBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { QuestionCard } from '@/app/questions/_components/QuestionCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/auth';
import { AdminQuestionFormFields } from '../_components/AdminQuestionFormFields';
import {
  adminQuestionSchema,
  buildPreviewQuestion,
  canRenderQuestionPreview,
  DEFAULT_ADMIN_QUESTION_FORM_VALUES,
  normalizeAdminQuestionPayload,
} from '../_components/question-form-utils';
import { useFloatingPreviewLayout } from '../_components/useFloatingPreviewLayout';
import type {
  AdminQuestionFormValues,
  QuestionUpsertResponse,
  QuestionDuplicateCheckResponse,
  QuestionUpsertPayload,
} from '@/app/questions/types';

const previewTransition = {
  duration: 0.34,
  ease: [0.16, 1, 0.3, 1] as const,
};

function PreviewPanel({ values }: { values: AdminQuestionFormValues }) {
  if (!canRenderQuestionPreview(values)) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-5 py-6">
        <p className="text-[13px] font-medium text-foreground">Preview will appear here.</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          Start typing any question content and the preview updates immediately.
        </p>
      </div>
    );
  }

  return <QuestionCard question={buildPreviewQuestion(values)} showBackLink={false} bare />;
}

export default function AddAdminQuestionPage() {
  const { user, isLoading } = useRequireAuth(Role.ADMIN);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<QuestionDuplicateCheckResponse | null>(null);
  const [duplicateCheckMessage, setDuplicateCheckMessage] = useState<string | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<QuestionUpsertPayload | null>(null);
  const [successResponse, setSuccessResponse] = useState<QuestionUpsertResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const {
    desktopPreviewLayout,
    rowRef: previewRowRef,
    railRef: previewRailRef,
    cardRef: previewCardRef,
    railSpacerHeight,
    floatingPreviewTop,
  } = useFloatingPreviewLayout(isPreviewOpen);

  const form = useForm<AdminQuestionFormValues>({
    resolver: zodResolver(adminQuestionSchema),
    defaultValues: DEFAULT_ADMIN_QUESTION_FORM_VALUES,
    mode: 'onBlur',
  });

  const values = form.watch();
  const previewValues = useMemo(() => values, [values]);

  useEffect(() => {
    setDuplicateInfo(null);
    setDuplicateCheckMessage(null);
  }, [values.title]);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const response = await fetch('/api/questions/topics', {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as { topics?: string[] } | null;
        setAvailableTopics(payload?.topics ?? []);
      } catch {
      }
    }

    fetchTopics();
  }, []);

  async function checkDuplicateTitle(title: string) {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setDuplicateInfo(null);
      setDuplicateCheckMessage(null);
      return { exists: false } satisfies QuestionDuplicateCheckResponse;
    }

    setIsCheckingDuplicate(true);
    setDuplicateCheckMessage(null);

    try {
      const response = await fetch(`/api/admin/questions?title=${encodeURIComponent(normalizedTitle)}`, {
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => null)) as
        | QuestionDuplicateCheckResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        const message =
          payload && 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : 'Unable to check for existing questions right now.';
        setDuplicateInfo(null);
        setDuplicateCheckMessage(message);
        return null;
      }

      const result = payload as QuestionDuplicateCheckResponse;
      setDuplicateInfo(result.exists ? result : null);
      return result;
    } catch {
      setDuplicateInfo(null);
      setDuplicateCheckMessage('Unable to check for existing questions right now.');
      return null;
    } finally {
      setIsCheckingDuplicate(false);
    }
  }

  async function submitQuestion(payload: QuestionUpsertPayload) {
    setIsSubmittingQuestion(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | QuestionUpsertResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          result && 'error' in result && typeof result.error === 'string'
            ? result.error
            : 'Failed to save question'
        );
      }

      setSuccessResponse(result as QuestionUpsertResponse);
      setPendingSubmission(null);
      setDuplicateInfo(null);
      setDuplicateCheckMessage(null);
      setIsDuplicateDialogOpen(false);
      toast.success((result as QuestionUpsertResponse).message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save question';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmittingQuestion(false);
    }
  }

  async function handleFormSubmit(values: AdminQuestionFormValues) {
    const payload = normalizeAdminQuestionPayload(values);
    const duplicateResult = await checkDuplicateTitle(payload.title);

    if (duplicateResult === null) {
      setSubmitError('Duplicate check failed. Try again in a moment.');
      return;
    }

    if (duplicateResult.exists) {
      setPendingSubmission(payload);
      setIsDuplicateDialogOpen(true);
      return;
    }

    await submitQuestion(payload);
  }

  function resetComposer() {
    form.reset(DEFAULT_ADMIN_QUESTION_FORM_VALUES);
    setSuccessResponse(null);
    setSubmitError(null);
    setDuplicateInfo(null);
    setDuplicateCheckMessage(null);
    setPendingSubmission(null);
    setIsDuplicateDialogOpen(false);
    setIsPreviewOpen(true);
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-14 w-full" />
        <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-24 md:px-10">
          <Skeleton className="mb-2 h-8 w-56" />
          <Skeleton className="mb-8 h-4 w-80" />
          <Skeleton className="mb-4 h-12 w-full" />
          <Skeleton className="h-[520px] w-full" />
        </div>
      </div>
    );
  }

  const previewToggleLabel = isPreviewOpen ? 'Hide Preview' : 'Show Preview';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <NavBar mode="admin" activePage="admin-questions" />

      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="border-border bg-background p-6 sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-foreground">
              Existing title found
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              A question with this title already exists. Submitting now will update that question
              through the question service upsert flow.
            </DialogDescription>
          </DialogHeader>

          {duplicateInfo?.matchedQuestion ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-[12.5px] text-muted-foreground">
              <p className="font-medium text-foreground">{duplicateInfo.matchedQuestion.title}</p>
              <p className="mt-1">Slug: {duplicateInfo.matchedQuestion.slug}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingSubmission(null);
                setIsDuplicateDialogOpen(false);
              }}
              className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
            >
              Review Title
            </Button>
            <Button
              type="button"
              onClick={() => pendingSubmission && submitQuestion(pendingSubmission)}
              disabled={!pendingSubmission || isSubmittingQuestion}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmittingQuestion ? 'Saving...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-24 md:px-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-[22px] font-semibold text-foreground">Add Question</h1>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Write the prompt once, preview it as admins will publish it, and send it to the
              question bank.
            </p>
          </div>

          {!successResponse ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                variant="outline"
                className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
              >
                <Link href="/admin/questions">
                  <ArrowLeft className="size-4" />
                  Back to Questions
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewOpen((current) => !current)}
                className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
              >
                {isPreviewOpen ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {previewToggleLabel}
              </Button>
              <Button
                type="submit"
                form="admin-question-form"
                disabled={isSubmittingQuestion}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmittingQuestion ? 'Saving...' : 'Submit Question'}
              </Button>
            </div>
          ) : null}
        </div>

        {successResponse ? (
          <div className="rounded-lg border border-border bg-card px-6 py-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
              <div className="space-y-2">
                <h2 className="text-[17px] font-semibold text-foreground">
                  {successResponse.message}
                </h2>
                <div className="space-y-1 text-[13px] text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Title:</span>{' '}
                    {successResponse.title}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Slug:</span>{' '}
                    {successResponse.slug}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button
                asChild
                variant="outline"
                className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
              >
                <Link href="/admin/questions">Return to Questions</Link>
              </Button>
              <Button
                type="button"
                onClick={resetComposer}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              >
                Create Another Question
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {submitError ? (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertCircle className="size-4" />
                <AlertTitle>Unable to submit question</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            {duplicateCheckMessage ? (
              <Alert className="border-border bg-card">
                <AlertCircle className="size-4" />
                <AlertTitle>Duplicate check unavailable</AlertTitle>
                <AlertDescription>{duplicateCheckMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="xl:hidden">
              <AnimatePresence initial={false}>
                {isPreviewOpen ? (
                  <motion.div
                    key="mobile-preview"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={previewTransition}
                    className="overflow-hidden rounded-lg border border-border bg-card"
                  >
                    <div className="border-b border-border px-5 py-3">
                      <p className="text-[13px] font-medium text-foreground">Question Preview</p>
                    </div>
                    <div className="p-4">
                      <PreviewPanel values={previewValues} />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div ref={previewRowRef} className="flex flex-col gap-6 xl:flex-row xl:items-start">
              <div className="min-w-0 flex-1 rounded-lg border border-border bg-card">
                <Form {...form}>
                  <form
                    id="admin-question-form"
                    onSubmit={form.handleSubmit(handleFormSubmit)}
                    className="px-5 py-5 md:px-6"
                  >
                    <AdminQuestionFormFields
                      form={form}
                      values={values}
                      availableTopics={availableTopics}
                      isCheckingDuplicate={isCheckingDuplicate}
                      onTitleBlur={checkDuplicateTitle}
                      metaAlert={
                        duplicateInfo?.matchedQuestion ? (
                          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                            <AlertCircle className="size-4" />
                            <AlertTitle>Matching title already exists</AlertTitle>
                            <AlertDescription className="text-amber-800">
                              Submitting this title will update{' '}
                              <span className="font-medium">
                                {duplicateInfo.matchedQuestion.title}
                              </span>{' '}
                              with slug{' '}
                              <span className="font-medium">
                                {duplicateInfo.matchedQuestion.slug}
                              </span>
                              .
                            </AlertDescription>
                          </Alert>
                        ) : null
                      }
                    />
                  </form>
                </Form>
              </div>

              <AnimatePresence initial={false}>
                {isPreviewOpen ? (
                  <motion.aside
                    key="desktop-preview"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '41%' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={previewTransition}
                    ref={previewRailRef}
                    className="relative hidden overflow-hidden xl:block xl:shrink-0 xl:self-start"
                    style={railSpacerHeight ? { height: railSpacerHeight } : undefined}
                  >
                    <div
                      ref={previewCardRef}
                      className="rounded-lg border border-border bg-card"
                      style={
                        desktopPreviewLayout.mode === 'fixed'
                          ? {
                              position: 'fixed',
                              top: floatingPreviewTop,
                              left: desktopPreviewLayout.left,
                              width: desktopPreviewLayout.width,
                            }
                          : desktopPreviewLayout.mode === 'absolute'
                            ? {
                                position: 'absolute',
                                top: desktopPreviewLayout.top,
                                left: 0,
                                right: 0,
                              }
                            : undefined
                      }
                    >
                      <div className="border-b border-border px-5 py-3">
                        <p className="text-[13px] font-medium text-foreground">
                          Question Preview
                        </p>
                      </div>
                      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4">
                        <PreviewPanel values={previewValues} />
                      </div>
                    </div>
                  </motion.aside>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
