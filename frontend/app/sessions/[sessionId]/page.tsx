"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { SessionPageSkeleton } from "@/app/sessions/[sessionId]/_components/SessionPageSkeleton";
import { SessionErrorState } from "@/app/sessions/[sessionId]/_components/SessionErrorState";
import { SessionHeader } from "@/app/sessions/[sessionId]/_components/SessionHeader";
import { QuestionPanel } from "@/app/sessions/[sessionId]/_components/QuestionPanel";
import { EditorPanel } from "@/app/sessions/[sessionId]/_components/EditorPanel";
import { SessionOnboardingTour } from "@/app/sessions/[sessionId]/_components/SessionOnboardingTour";
import { AiSidebar } from "@/app/sessions/[sessionId]/_components/AiSidebar";
import { AiSidebarToggle } from "@/app/sessions/[sessionId]/_components/AiSidebarToggle";
import { SESSION_TOUR_STEP_INDEX } from "@/app/sessions/[sessionId]/_components/sessionTourSteps";
import { useSessionAi } from "@/app/sessions/[sessionId]/useSessionAi";
import type { Question } from "@/app/questions/types";
import type {
  AiTab,
  LeaveSessionResponse,
  SessionDetails,
  SessionLanguage,
} from "@/app/sessions/[sessionId]/types";

const EMPTY_DRAFTS: Record<SessionLanguage, string> = {
  javascript: "",
  python: "",
  java: "",
};

interface SessionWalkthroughState {
  activeStepIndex: number | null;
  isEditorExplainDemoActive: boolean;
  isAiSidebarForcedOpen: boolean;
  forcedAiTab: AiTab | null;
  stepFiveVisitedTabs: AiTab[];
  canAdvanceFromStepFive: boolean;
}

function createInitialWalkthroughState(): SessionWalkthroughState {
  return {
    activeStepIndex: null,
    isEditorExplainDemoActive: false,
    isAiSidebarForcedOpen: false,
    forcedAiTab: null,
    stepFiveVisitedTabs: [],
    canAdvanceFromStepFive: false,
  };
}

function applyCurrentUserToSession(session: SessionDetails, username: string) {
  return {
    ...session,
    participants: session.participants.map((participant) =>
      participant.isCurrentUser
        ? {
            ...participant,
            username,
          }
        : participant,
    ),
  };
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { user, isLoading: authLoading } = useRequireAuth();
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const currentUsernameRef = useRef("You");

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SessionLanguage>("python");
  const [codeByLanguage, setCodeByLanguage] =
    useState<Record<SessionLanguage, string>>(EMPTY_DRAFTS);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [walkthroughState, setWalkthroughState] =
    useState<SessionWalkthroughState>(createInitialWalkthroughState);

  const loadSessionPage = useCallback(
    async (sessionId: string, currentUsername: string) => {
      setLoadingSession(true);
      setLoadingQuestion(true);
      setError(null);
      setLeaveError(null);

      try {
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
        const sessionBody = (await sessionResponse.json()) as
          | SessionDetails
          | { error?: string };

        if (!sessionResponse.ok) {
          const message =
            "error" in sessionBody && sessionBody.error
              ? sessionBody.error
              : "Unable to load session details";
          setError(message);
          setSession(null);
          setQuestion(null);
          return;
        }

        const sessionData = applyCurrentUserToSession(
          sessionBody as SessionDetails,
          currentUsername,
        );
        setSession(sessionData);
        setSelectedLanguage(sessionData.selectedLanguage);
        setCodeByLanguage({
          javascript: sessionData.starterCode.javascript,
          python: sessionData.starterCode.python,
          java: sessionData.starterCode.java,
        });
        setLoadingSession(false);

        const questionResponse = await fetch(
          `/api/questions/${sessionData.questionId}`,
        );
        const questionBody = (await questionResponse.json()) as
          | Question
          | { error?: string };

        if (!questionResponse.ok) {
          const message =
            "error" in questionBody && questionBody.error
              ? questionBody.error
              : "Unable to load question details";
          setError(message);
          setQuestion(null);
          return;
        }

        setQuestion(questionBody as Question);
      } catch {
        setError("Unable to load this collaboration session right now");
        setSession(null);
        setQuestion(null);
      } finally {
        setLoadingSession(false);
        setLoadingQuestion(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (user?.username) {
      currentUsernameRef.current = user.username;
    }
  }, [user?.username]);

  useEffect(() => {
    if (!params.sessionId || authLoading || !user?.id) {
      return;
    }

    void loadSessionPage(params.sessionId, currentUsernameRef.current);
  }, [authLoading, loadSessionPage, params.sessionId, user?.id]);

  useEffect(() => {
    if (!user?.username) {
      return;
    }

    setSession((currentSession) =>
      currentSession
        ? applyCurrentUserToSession(currentSession, user.username)
        : currentSession,
    );
  }, [user?.username]);

  function handleRetry() {
    if (!params.sessionId || authLoading || !user) {
      return;
    }

    setSession(null);
    setQuestion(null);
    setCodeByLanguage(EMPTY_DRAFTS);
    setSelectedLanguage("python");
    setLoadingSession(true);
    setLoadingQuestion(true);
    setError(null);
    setLeaveError(null);

    void loadSessionPage(params.sessionId, user.username);
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

  const handleTourStepChange = useCallback((stepIndex: number | null) => {
    setWalkthroughState((current) => {
      if (stepIndex === null) {
        return createInitialWalkthroughState();
      }

      if (stepIndex === SESSION_TOUR_STEP_INDEX.EXPLAIN_DEMO) {
        return {
          activeStepIndex: stepIndex,
          isEditorExplainDemoActive: true,
          isAiSidebarForcedOpen: false,
          forcedAiTab: null,
          stepFiveVisitedTabs: [],
          canAdvanceFromStepFive: false,
        };
      }

      if (stepIndex === SESSION_TOUR_STEP_INDEX.AI_SIDEBAR) {
        const stayingOnSidebarStep =
          current.activeStepIndex === SESSION_TOUR_STEP_INDEX.AI_SIDEBAR;

        return {
          activeStepIndex: stepIndex,
          isEditorExplainDemoActive: false,
          isAiSidebarForcedOpen: true,
          forcedAiTab: stayingOnSidebarStep ? current.forcedAiTab : "hints",
          stepFiveVisitedTabs: stayingOnSidebarStep
            ? current.stepFiveVisitedTabs
            : [],
          canAdvanceFromStepFive: stayingOnSidebarStep
            ? current.canAdvanceFromStepFive
            : false,
        };
      }

      return {
        activeStepIndex: stepIndex,
        isEditorExplainDemoActive: false,
        isAiSidebarForcedOpen: false,
        forcedAiTab: null,
        stepFiveVisitedTabs: [],
        canAdvanceFromStepFive: false,
      };
    });
  }, []);

  const handleWalkthroughTabClick = useCallback((tab: AiTab) => {
    setWalkthroughState((current) => {
      if (current.activeStepIndex !== SESSION_TOUR_STEP_INDEX.AI_SIDEBAR) {
        return current;
      }

      const nextVisitedTabs = current.stepFiveVisitedTabs.includes(tab)
        ? current.stepFiveVisitedTabs
        : [...current.stepFiveVisitedTabs, tab];

      return {
        ...current,
        forcedAiTab: null,
        stepFiveVisitedTabs: nextVisitedTabs,
        canAdvanceFromStepFive: tab === "explain",
      };
    });
  }, []);

  const {
    sidebarOpen,
    setSidebarOpen,
    activeAiTab,
    setActiveAiTab,
    explanations,
    activeExplainIndex,
    setActiveExplainIndex,
    handleExplainCode,
    hintMessages,
    isHintStreaming,
    handleSendHint,
    handleClearHints,
  } = useSessionAi({
    sessionId: params.sessionId,
    question,
    selectedLanguage,
    codeByLanguage,
  });

  const isAiSidebarVisible =
    sidebarOpen || walkthroughState.isAiSidebarForcedOpen;
  const isStepFiveActive =
    walkthroughState.activeStepIndex === SESSION_TOUR_STEP_INDEX.AI_SIDEBAR;
  const nextDisabledMessage = isStepFiveActive
    ? "Click the Explain tab in the AI sidebar to continue the walkthrough."
    : null;

  if (authLoading || !user) {
    return <SessionPageSkeleton />;
  }

  const isLoading = loadingSession || loadingQuestion;

  if (isLoading) {
    return <SessionPageSkeleton />;
  }

  if (error || !session || !question) {
    const notFound =
      error === "Session not found" || error === "Question not found";

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-[1680px] px-5 pt-8 pb-6 sm:px-8 lg:px-10 lg:pb-8">
          <SessionErrorState
            title={notFound ? "Session unavailable" : "Unable to open session"}
            message={
              notFound
                ? "This mocked session could not be found. Try returning to the dashboard and starting again."
                : (error ??
                  "Something went wrong while loading the collaboration session.")
            }
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AiSidebarToggle
        onClick={() => setSidebarOpen(true)}
        visible={!isAiSidebarVisible}
      />
      <div className="flex min-h-screen">
        <AiSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeAiTab}
          onTabChange={setActiveAiTab}
          explanations={explanations}
          activeExplainIndex={activeExplainIndex}
          onActiveExplainIndexChange={setActiveExplainIndex}
          hintMessages={hintMessages}
          isHintStreaming={isHintStreaming}
          onSendHint={handleSendHint}
          onClearHints={handleClearHints}
          walkthroughForceOpen={walkthroughState.isAiSidebarForcedOpen}
          walkthroughForcedTab={walkthroughState.forcedAiTab}
          onWalkthroughTabClick={handleWalkthroughTabClick}
          walkthroughDisableTransition={
            walkthroughState.activeStepIndex !== null
          }
        />
        <div className="min-w-0 flex-1">
          <SessionOnboardingTour
            onStepChange={handleTourStepChange}
            isNextDisabled={
              isStepFiveActive && !walkthroughState.canAdvanceFromStepFive
            }
            nextDisabledMessage={nextDisabledMessage}
          >
            <div className="mx-auto max-w-[1680px] px-5 pt-8 pb-6 sm:px-8 lg:px-10 lg:pb-8">
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
                  onExplainCode={handleExplainCode}
                  walkthroughShowExplainDemo={
                    walkthroughState.isEditorExplainDemoActive
                  }
                />
              </div>
            </div>
          </SessionOnboardingTour>
        </div>
      </div>
    </div>
  );
}
