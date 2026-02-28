'use client';

import { useCallback, useEffect, useState } from 'react';
import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionFilters } from '@/app/questions/_components/QuestionFilters';
import { QuestionTable } from '@/app/questions/_components/QuestionTable';
import { PaginationControls } from '@/app/questions/_components/PaginationControls';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { PaginatedResponse } from '@/lib/types';
import type { Question } from '@/app/questions/types';

const PAGE_SIZE = 10;

export default function QuestionsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  // Filter state
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);

  // Data state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available topics for filter dropdown
  useEffect(() => {
    async function fetchTopics() {
      try {
        // TODO: Replace with GET /api/questions/topics when available
        const res = await fetch('/api/questions', { method: 'POST', body: JSON.stringify({ action: 'topics' }), headers: { 'Content-Type': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setTopics(data.topics ?? []);
        }
      } catch {
        // Non-critical — filter dropdown will be empty
      }
    }
    fetchTopics();
  }, []);

  // Fetch questions whenever filters or page change
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

      const body: PaginatedResponse<Question> = await res.json();
      setQuestions(body.data);
      setTotal(body.total);
      setTotalPages(body.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [search, topic, difficulty, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTopicChange = (value: string) => {
    setTopic(value);
    setPage(1);
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
    setPage(1);
  };

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar activePage="questions" />

      <div className="px-10 py-8 pb-16 max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-5 mb-6">
          <div>
            <h1
              className="text-[20px] font-bold text-foreground mb-1.5"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Browse Questions
            </h1>
            <p className="text-[12.5px] text-muted-foreground">
              Search across topics and difficulty levels to find the right practice prompt.
            </p>
          </div>
        </div>

        {/* Filters */}
        <QuestionFilters
          search={search}
          topic={topic}
          difficulty={difficulty}
          topics={topics}
          onSearchChange={handleSearchChange}
          onTopicChange={handleTopicChange}
          onDifficultyChange={handleDifficultyChange}
        />

        {/* Content */}
        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 text-center py-8">
            <p className="text-[13px] text-destructive mb-3">{error}</p>
            <button
              onClick={fetchQuestions}
              className="text-[12.5px] font-semibold text-accent hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <QuestionTable questions={questions} />
            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
