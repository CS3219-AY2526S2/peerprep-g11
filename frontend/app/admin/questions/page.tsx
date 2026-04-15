'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuestionFilters } from '@/app/questions/_components/QuestionFilters';
import { PaginationControls } from '@/app/questions/_components/PaginationControls';
import { AdminQuestionTable } from './_components/AdminQuestionTable';
import { BulkDeleteQuestionsDialog } from './_components/BulkDeleteQuestionsDialog';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/auth';
import type { PaginatedResponse } from '@/lib/types';
import type {
  BulkDeleteQuestionsResponse,
  DeletedQuestionSummary,
  QuestionListElement,
} from '@/app/questions/types';

const PAGE_SIZE = 10;

export default function AdminQuestionsPage() {
  const { user, isLoading: authLoading } = useRequireAuth(Role.ADMIN);

  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);

  const [questions, setQuestions] = useState<QuestionListElement[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch('/api/questions/topics');

        if (res.ok) {
          const data = await res.json();
          setTopics(data.topics ?? []);
        }
      } catch {
      }
    }

    fetchTopics();
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (topic && topic !== 'all') params.set('topic', topic);
      if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch questions');

      const body: PaginatedResponse<QuestionListElement> = await res.json();
      setQuestions(body.data);
      setTotal(body.total);
      setTotalPages(body.totalPages);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [difficulty, page, search, topic]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const resetSelection = useCallback(() => {
    setIsEditMode(false);
    setSelectedSlugs([]);
    setIsDeleteDialogOpen(false);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    resetSelection();
  };

  const handleTopicChange = (value: string) => {
    setTopic(value);
    setPage(1);
    resetSelection();
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
    setPage(1);
    resetSelection();
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    resetSelection();
  };

  const handleToggleSelection = (slug: string, checked: boolean) => {
    setSelectedSlugs((current) => {
      if (checked) {
        return current.includes(slug) ? current : [...current, slug];
      }

      return current.filter((currentSlug) => currentSlug !== slug);
    });
  };

  const selectedQuestions = useMemo<DeletedQuestionSummary[]>(
    () =>
      questions
        .filter((question) => selectedSlugs.includes(question.slug))
        .map((question) => ({ slug: question.slug, title: question.title })),
    [questions, selectedSlugs]
  );

  async function handleConfirmDelete() {
    const response = await fetch('/api/admin/questions/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: selectedSlugs }),
    });

    const body = (await response.json().catch(() => null)) as BulkDeleteQuestionsResponse | null;

    if (!response.ok) {
      throw new Error(body?.error ?? 'Failed to delete questions');
    }

    const deletedCount = body?.deletedCount ?? selectedSlugs.length;
    const nextTotal = Math.max(0, total - deletedCount);
    const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
    const nextPage = page > nextTotalPages ? nextTotalPages : page;

    resetSelection();

    if (nextPage !== page) {
      setPage(nextPage);
    } else {
      await fetchQuestions();
    }

    toast.success(
      `${deletedCount} question${deletedCount === 1 ? '' : 's'} deleted successfully`
    );
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-14 w-full" />
        <div className="px-10 py-8 max-w-[1100px] mx-auto">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72 mb-6" />
          <div className="grid grid-cols-3 gap-3.5 mb-6">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const primaryActionLabel = 'Delete';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <NavBar mode="admin" activePage="admin-questions" />

      <div className="px-10 pt-20 py-8 pb-16 max-w-[1100px] mx-auto">
        <div className="flex items-start justify-between gap-5 mb-6 animate-fade-in-up">
          <div>
            <h1
              className="text-[20px] font-bold text-foreground mb-1.5"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Manage Questions
            </h1>
            <p className="text-[12.5px] text-muted-foreground">
              Search, review, and clean up the question bank from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <Button
                variant="outline"
                onClick={resetSelection}
                className="rounded-lg border-amber-200 bg-amber-50 text-[12.5px] font-semibold text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900"
              >
                Cancel
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                if (!isEditMode) {
                  setIsEditMode(true);
                  return;
                }

                if (selectedSlugs.length > 0) {
                  setIsDeleteDialogOpen(true);
                }
              }}
              disabled={isEditMode && selectedSlugs.length === 0}
              className="rounded-lg border border-rose-200 bg-rose-50 text-[12.5px] font-semibold text-rose-800 transition-colors hover:border-rose-300 hover:bg-rose-100 hover:text-rose-900"
            >
              {primaryActionLabel}
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-lg border-primary bg-primary text-[12.5px] font-semibold text-primary-foreground hover:border-primary hover:bg-primary/90 hover:text-primary-foreground"
            >
              <Link href="/admin/questions/add">Add Question</Link>
            </Button>
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <QuestionFilters
            search={search}
            topic={topic}
            difficulty={difficulty}
            topics={topics}
            onSearchChange={handleSearchChange}
            onTopicChange={handleTopicChange}
            onDifficultyChange={handleDifficultyChange}
          />
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-6 border-destructive/20">
            <AlertDescription className="text-[12.5px]">{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <AdminQuestionTable
              questions={questions}
              isEditMode={isEditMode}
              selectedSlugs={selectedSlugs}
              onToggleSelection={handleToggleSelection}
            />
            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <BulkDeleteQuestionsDialog
        open={isDeleteDialogOpen}
        questions={selectedQuestions}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
