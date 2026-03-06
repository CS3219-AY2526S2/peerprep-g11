'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionCard } from '@/app/questions/_components/QuestionCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Question } from '@/app/questions/types';

export default function QuestionDetailsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const params = useParams<{ questionId: string }>();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestion() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/questions/${params.questionId}`);
        if (res.status === 404) {
          setError('Question not found');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch question');
        const data: Question = await res.json();
        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    if (params.questionId) {
      fetchQuestion();
    }
  }, [params.questionId]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-14 w-full" />
        <div className="px-10 py-8 max-w-[1100px] mx-auto">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72 mb-6" />
          <Skeleton className="h-96 max-w-[920px]" />
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
              Question Details
            </h1>
            <p className="text-[12.5px] text-muted-foreground">
              Review the prompt, examples, and constraints before pairing up.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4 max-w-[920px]">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[13px] text-destructive mb-4">{error}</p>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href="/questions">Back to Questions</Link>
            </Button>
          </div>
        ) : question ? (
          <QuestionCard question={question} />
        ) : null}
      </div>
    </div>
  );
}
