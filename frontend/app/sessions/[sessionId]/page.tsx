'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NavBar } from '@/components/ui/navBar';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { SessionPageSkeleton } from '@/app/sessions/[sessionId]/_components/SessionPageSkeleton';
import { SessionErrorState } from '@/app/sessions/[sessionId]/_components/SessionErrorState';
import { SessionHeader } from '@/app/sessions/[sessionId]/_components/SessionHeader';
import { QuestionPanel } from '@/app/sessions/[sessionId]/_components/QuestionPanel';
import { EditorPanel } from '@/app/sessions/[sessionId]/_components/EditorPanel';
import type { Question } from '@/app/questions/types';
import type {
  LeaveSessionResponse,
  SessionDetails,
  SessionLanguage,
} from '@/app/sessions/[sessionId]/types';

const EMPTY_DRAFTS: Record<SessionLanguage, string> = {
  javascript: '',
  python: '',
  java: '',
};

function applyCurrentUserToSession(session: SessionDetails, username: string) {
  return {
    ...session,
    participants: session.participants.map((participant) =>
      participant.isCurrentUser
        ? {
          ...participant,
          username,
        }
        : participant
    ),
  };
}

export default function SessionPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SessionLanguage>('python');
  const [codeByLanguage, setCodeByLanguage] =
    useState<Record<SessionLanguage, string>>(EMPTY_DRAFTS);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const loadSessionPage = useCallback(async (sessionId: string) => {
    setLoadingSession(true);
    setLoadingQuestion(true);
    setError(null);
    setLeaveError(null);

    try {
      const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
      const sessionBody = (await sessionResponse.json()) as SessionDetails | { error?: string };

      if (!sessionResponse.ok) {
        const message =
          'error' in sessionBody && sessionBody.error
            ? sessionBody.error
            : 'Unable to load session details';
        setError(message);
        setSession(null);
        setQuestion(null);
        return;
      }

      const sessionData = applyCurrentUserToSession(
        sessionBody as SessionDetails,
        user?.username ?? 'You'
      );
      setSession(sessionData);
      setSelectedLanguage(sessionData.selectedLanguage);
      setCodeByLanguage({
        javascript: sessionData.starterCode.javascript,
        python: sessionData.starterCode.python,
        java: sessionData.starterCode.java,
      });
      setLoadingSession(false);

      const questionResponse = await fetch(`/api/questions/${sessionData.questionId}`);
      const questionBody = (await questionResponse.json()) as Question | { error?: string };

      if (!questionResponse.ok) {
        const message =
          'error' in questionBody && questionBody.error
            ? questionBody.error
            : 'Unable to load question details';
        setError(message);
        setQuestion(null);
        return;
      }

      setQuestion(questionBody as Question);
    } catch {
      setError('Unable to load this collaboration session right now');
      setSession(null);
      setQuestion(null);
    } finally {
      setLoadingSession(false);
      setLoadingQuestion(false);
    }
  }, [user?.username]);

  useEffect(() => {
    if (!params.sessionId || authLoading || !user) {
      return;
    }

    void loadSessionPage(params.sessionId);
  }, [authLoading, loadSessionPage, params.sessionId, user]);

  function handleRetry() {
    if (!params.sessionId || authLoading || !user) {
      return;
    }

    setSession(null);
    setQuestion(null);
    setCodeByLanguage(EMPTY_DRAFTS);
    setSelectedLanguage('python');
    setLoadingSession(true);
    setLoadingQuestion(true);
    setError(null);
    setLeaveError(null);

    void loadSessionPage(params.sessionId);
  }

  function handleLanguageChange(language: SessionLanguage) {
    setSelectedLanguage(language);
  }

  function handleEditorChange(nextValue: string) {
    setCodeByLanguage((current) => ({
      ...current,
      [selectedLanguage]: nextValue,
    }));
  }

  function handleLeaveSuccess(response: LeaveSessionResponse) {
    startTransition(() => {
      router.push(response.redirectTo);
    });
  }

  if (authLoading || !user) {
    return <SessionPageSkeleton />;
  }

  const isLoading = loadingSession || loadingQuestion;

  if (isLoading) {
    return <SessionPageSkeleton />;
  }

  if (error || !session || !question) {
    const notFound =
      error === 'Session not found' || error === 'Question not found';

    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <div className="mx-auto max-w-[1680px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <SessionErrorState
            title={notFound ? 'Session unavailable' : 'Unable to open session'}
            message={
              notFound
                ? 'This mocked session could not be found. Try returning to the dashboard and starting again.'
                : error ?? 'Something went wrong while loading the collaboration session.'
            }
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <div className="mx-auto max-w-[1680px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <SessionHeader
          sessionId={session.sessionId}
          participants={session.participants}
          leaveError={leaveError}
          onLeaveSuccess={handleLeaveSuccess}
          onLeaveError={setLeaveError}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] xl:gap-6">
          <QuestionPanel question={question} />
          <EditorPanel
            sessionId={session.sessionId}
            selectedLanguage={selectedLanguage}
            allowedLanguages={session.allowedLanguages}
            value={codeByLanguage[selectedLanguage]}
            onLanguageChange={handleLanguageChange}
            onChange={handleEditorChange}
          />
        </div>
      </div>
    </div>
  );
}
