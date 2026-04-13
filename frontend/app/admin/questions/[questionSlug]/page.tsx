'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, FilePenLine, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  buildAdminQuestionFormValues,
  buildPreviewQuestion,
  canRenderQuestionPreview,
  normalizeAdminQuestionPayload,
} from '../_components/question-form-utils';
import { useFloatingPreviewLayout } from '../_components/useFloatingPreviewLayout';
import type {
  AdminQuestionFormValues,
  Question,
  QuestionUpsertResponse,
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

export default function AdminQuestionDetailsPage() {
  const { user, isLoading: authLoading } = useRequireAuth(Role.ADMIN);
  const params = useParams<{ questionSlug: string }>();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    desktopPreviewLayout,
    rowRef: previewRowRef,
    railRef: previewRailRef,
    cardRef: previewCardRef,
    railSpacerHeight,
    floatingPreviewTop,
  } = useFloatingPreviewLayout(isEditMode);

  const form = useForm<AdminQuestionFormValues>({
    resolver: zodResolver(adminQuestionSchema),
    defaultValues: {
      title: '',
      difficulty: 'Easy',
      topics: [],
      description: '',
      constraints: [''],
      examples: [{ input: '', output: '', explanation: '' }],
    },
    mode: 'onBlur',
  });

  const values = form.watch();
  const previewValues = useMemo(() => values, [values]);

  const fetchQuestion = useCallback(async () => {
    if (!params.questionSlug) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/${params.questionSlug}`, {
        cache: 'no-store',
      });

      if (response.status === 404) {
        setError('Question not found');
        setQuestion(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const payload: Question = await response.json();
      setQuestion(payload);
      form.reset(buildAdminQuestionFormValues(payload));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Something went wrong');
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, [form, params.questionSlug]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

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

  const pageDescription = useMemo(() => {
    if (isEditMode) {
      return 'Update the question content and save changes when you are ready.';
    }

    return 'Review the question, examples, and constraints before editing this entry.';
  }, [isEditMode]);

  function enterEditMode() {
    if (!question) {
      return;
    }

    form.reset(buildAdminQuestionFormValues(question));
    setSaveError(null);
    setIsEditMode(true);
  }

  function exitEditMode() {
    if (!question) {
      return;
    }

    form.reset(buildAdminQuestionFormValues(question));
    setSaveError(null);
    setIsEditMode(false);
    setIsDiscardDialogOpen(false);
  }

  function handleCancel() {
    if (form.formState.isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }

    exitEditMode();
  }

  async function handleSave(values: AdminQuestionFormValues) {
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = normalizeAdminQuestionPayload(values);
      const response = await fetch(`/api/admin/questions/${params.questionSlug}`, {
        method: 'PUT',
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

      await fetchQuestion();
      setIsEditMode(false);
      toast.success((result as QuestionUpsertResponse).message);
    } catch (saveIssue) {
      const message = saveIssue instanceof Error ? saveIssue.message : 'Failed to save question';
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!params.questionSlug) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/questions/${params.questionSlug}`, {
        method: 'DELETE',
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          result && typeof result.error === 'string' ? result.error : 'Failed to delete question'
        );
      }

      toast.success(result?.message ?? 'Question deleted');
      router.push('/admin/questions');
      router.refresh();
    } catch (deleteIssue) {
      const message =
        deleteIssue instanceof Error ? deleteIssue.message : 'Failed to delete question';
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-14 w-full" />
        <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-24 md:px-10">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="mb-6 h-4 w-72" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <NavBar mode="admin" activePage="admin-questions" />

      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent className="border-border bg-background p-6 sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-foreground">
              Discard changes?
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              You have unsaved edits on this question. Leaving edit mode now will discard them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscardDialogOpen(false)}
              className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={exitEditMode}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-border bg-background p-6 sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-foreground">
              Delete question?
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              This will permanently remove this question from the repository.
            </DialogDescription>
          </DialogHeader>
          {question ? (
            <div className="space-y-1 px-1 text-[12.5px] text-muted-foreground">
              <p className="text-[15px] font-medium text-foreground">{question.title}</p>
              <p>Slug: {params.questionSlug}</p>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteQuestion}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-24 md:px-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-[22px] font-semibold text-foreground">Question Details</h1>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{pageDescription}</p>
          </div>

          {!loading && !error ? (
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
              {isEditMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="admin-question-edit-form"
                    disabled={isSaving || !form.formState.isDirty}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={enterEditMode}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <FilePenLine className="size-4" />
                    Edit Question
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="border-destructive/20 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete question"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-lg border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-7 w-72" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="mt-6 h-28 w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-[13px] text-destructive">{error}</p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
            >
              <Link href="/admin/questions">Back to Questions</Link>
            </Button>
          </div>
        ) : question ? (
          isEditMode ? (
            <div className="space-y-5">
                {saveError ? (
                  <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                    <AlertTitle>Unable to save question</AlertTitle>
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="xl:hidden">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key="mobile-preview"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={previewTransition}
                      className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                      <div className="border-b border-border px-5 py-3">
                        <p className="text-[13px] font-medium text-foreground">
                          Question Preview
                        </p>
                      </div>
                      <div className="p-4">
                        <PreviewPanel values={previewValues} />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div ref={previewRowRef} className="flex flex-col gap-6 xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1 rounded-lg border border-border bg-card">
                    <Form {...form}>
                      <form
                        id="admin-question-edit-form"
                        onSubmit={form.handleSubmit(handleSave)}
                        className="px-5 py-5 md:px-6"
                      >
                        <AdminQuestionFormFields
                          form={form}
                          values={values}
                          availableTopics={availableTopics}
                          titleReadOnly
                          titleDescription="Question name is not editable."
                        />
                      </form>
                    </Form>
                  </div>

                  <AnimatePresence initial={false}>
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
                  </AnimatePresence>
                </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card">
              <QuestionCard question={question} showBackLink={false} bare />
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
