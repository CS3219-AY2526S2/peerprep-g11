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
import { ChatWidget } from "@/app/sessions/[sessionId]/_components/ChatWidget";
import { SESSION_TOUR_STEP_INDEX } from "@/app/sessions/[sessionId]/_components/sessionTourSteps";
import { useSessionAi } from "@/app/sessions/[sessionId]/useSessionAi";
import * as Y from "yjs";

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
}

function createInitialWalkthroughState(): SessionWalkthroughState {
  return {
    activeStepIndex: null,
    isEditorExplainDemoActive: false,
    isAiSidebarForcedOpen: false,
    forcedAiTab: null,
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

function markPeerAsDisconnected(session: SessionDetails) {
  return {
    ...session,
    participants: session.participants.map((participant) =>
      participant.isCurrentUser
        ? participant
        : {
            ...participant,
            presence: "disconnected",
          },
    ),
  };
}

function useYjs({
  sessionId,
  ticket,
  currentUserId,
  currentUsername,
}: {
  sessionId?: string;
  ticket: string | null;
  currentUserId?: string;
  currentUsername?: string;
}): {
  yDocument: Y.Doc | null;
  provider: import("y-websocket").WebsocketProvider | null;
  connectedParticipantIds: string[];
} {
  const [provider, setProvider] = useState<
    import("y-websocket").WebsocketProvider | null
  >(null);
  const [yDocument, setYDocument] = useState<Y.Doc | null>(null);
  const [connectedParticipantIds, setConnectedParticipantIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (!sessionId || !ticket || !currentUserId || !currentUsername) {
      setProvider(null);
      setYDocument(null);
      setConnectedParticipantIds([]);
      return;
    }

    let cancelled = false;
    let createdProvider: import("y-websocket").WebsocketProvider | null = null;
    let createdDocument: Y.Doc | null = null;
    let removeAwarenessListener: (() => void) | null = null;

    async function initYjs() {
      try {
        const { WebsocketProvider } = await import("y-websocket");

        if (cancelled) {
          return;
        }

        const collabServiceUrl =
          process.env.NEXT_PUBLIC_COLLAB_SERVICE_WS_URL ??
          `${location.protocol === "http:" ? "ws:" : "wss:"}//localhost:1234`;

        createdDocument = new Y.Doc();
        createdProvider = new WebsocketProvider(
          collabServiceUrl,
          sessionId,
          createdDocument,
          { params: { ticket } },
        );

        createdProvider.on("status", (event: { status: string }) => {
          console.log(`[Yjs] WebSocket status: ${event.status}`);
        });

        createdProvider.awareness.setLocalStateField("user", {
          id: currentUserId,
          username: currentUsername,
        });

        const syncPresence = () => {
          if (!createdProvider) {
            return;
          }

          const participantIds = Array.from(
            createdProvider.awareness.getStates().values(),
          )
            .map((state) => state.user?.id)
            .filter((id): id is string => typeof id === "string");

          setConnectedParticipantIds(Array.from(new Set(participantIds)));
        };

        createdProvider.awareness.on("change", syncPresence);
        removeAwarenessListener = () => {
          createdProvider?.awareness.off("change", syncPresence);
        };

        syncPresence();

        if (cancelled) {
          removeAwarenessListener?.();
          createdProvider.destroy();
          createdDocument.destroy();
          return;
        }

        setYDocument(createdDocument);
        setProvider(createdProvider);
      } catch (error) {
        console.error("[Yjs] Error during initialisation:", error);
        setProvider(null);
        setYDocument(null);
        setConnectedParticipantIds([]);
      }
    }

    void initYjs();

    return () => {
      cancelled = true;
      removeAwarenessListener?.();
      createdProvider?.destroy();
      createdDocument?.destroy();
      setProvider(null);
      setYDocument(null);
      setConnectedParticipantIds([]);
    };
  }, [currentUserId, currentUsername, sessionId, ticket]);

  return { yDocument, provider, connectedParticipantIds };
}

export default function SessionPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const currentUsernameRef = useRef("You");
  const hasLoadedSessionSuccessfullyRef = useRef(false);
  const isSessionStatusCheckInFlightRef = useRef(false);

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [collabTicket, setCollabTicket] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peerLeft, setPeerLeft] = useState(false);
  const [codeByLanguage, setCodeByLanguage] =
    useState<Record<SessionLanguage, string>>(EMPTY_DRAFTS);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [walkthroughState, setWalkthroughState] =
    useState<SessionWalkthroughState>(createInitialWalkthroughState);

  const { yDocument, provider, connectedParticipantIds } = useYjs({
    sessionId: params.sessionId,
    ticket: collabTicket,
    currentUserId: user?.id,
    currentUsername: user?.username,
  });

  const handlePeerLeft = useCallback(() => {
    setPeerLeft(true);
    setLeaveError(null);
    setSession((currentSession) =>
      currentSession ? markPeerAsDisconnected(currentSession) : currentSession,
    );
  }, []);

  const loadSessionPage = useCallback(
    async (sessionId: string, currentUsername: string) => {
      setLoadingSession(true);
      setLoadingQuestion(true);
      setError(null);
      setPeerLeft(false);
      setLeaveError(null);
      hasLoadedSessionSuccessfullyRef.current = false;

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

        const rawSession = sessionBody as SessionDetails & { ticket?: string };
        if (rawSession.ticket) {
          setCollabTicket(rawSession.ticket);
        }
        const sessionData = applyCurrentUserToSession(
          rawSession,
          currentUsername,
        );
        setSession(sessionData);
        hasLoadedSessionSuccessfullyRef.current = true;
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
        hasLoadedSessionSuccessfullyRef.current = false;
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

  useEffect(() => {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const connectedParticipantIdSet = new Set(connectedParticipantIds);

      return {
        ...currentSession,
        participants: currentSession.participants.map((participant) => ({
          ...participant,
          presence:
            participant.isCurrentUser ||
            connectedParticipantIdSet.has(participant.id)
              ? "connected"
              : "disconnected",
        })),
      };
    });
  }, [connectedParticipantIds]);

  function handleRetry() {
    if (!params.sessionId || authLoading || !user) {
      return;
    }

    setSession(null);
    setQuestion(null);
    setCodeByLanguage(EMPTY_DRAFTS);
    setLoadingSession(true);
    setLoadingQuestion(true);
    setError(null);
    setPeerLeft(false);
    setLeaveError(null);
    hasLoadedSessionSuccessfullyRef.current = false;

    void loadSessionPage(params.sessionId, user.username);
  }

  const sessionLanguage = session?.selectedLanguage ?? "python";

  function handleEditorChange(nextValue: string) {
    setCodeByLanguage((current) => ({
      ...current,
      [sessionLanguage]: nextValue,
    }));
  }

  function handleLeaveSuccess(response: LeaveSessionResponse) {
    startTransition(() => {
      router.push(response.redirectTo);
    });
  }

  const checkSessionStillExists = useCallback(async () => {
    if (
      !params.sessionId ||
      !hasLoadedSessionSuccessfullyRef.current ||
      peerLeft ||
      isSessionStatusCheckInFlightRef.current
    ) {
      return;
    }

    isSessionStatusCheckInFlightRef.current = true;

    try {
      const response = await fetch(`/api/sessions/${params.sessionId}`);

      if (response.status === 404 && hasLoadedSessionSuccessfullyRef.current) {
        handlePeerLeft();
      }
    } catch {
      // Ignore transient polling failures and keep the current session view active.
    } finally {
      isSessionStatusCheckInFlightRef.current = false;
    }
  }, [handlePeerLeft, params.sessionId, peerLeft]);

  useEffect(() => {
    if (!session || !params.sessionId || peerLeft) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void checkSessionStillExists();
    }, 3000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkSessionStillExists();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkSessionStillExists, params.sessionId, peerLeft, session]);

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
        };
      }

      if (stepIndex === SESSION_TOUR_STEP_INDEX.AI_SIDEBAR) {
        return {
          activeStepIndex: stepIndex,
          isEditorExplainDemoActive: false,
          isAiSidebarForcedOpen: true,
          forcedAiTab:
            current.activeStepIndex === SESSION_TOUR_STEP_INDEX.AI_SIDEBAR
              ? current.forcedAiTab
              : "hints",
        };
      }

      return {
        activeStepIndex: stepIndex,
        isEditorExplainDemoActive: false,
        isAiSidebarForcedOpen: false,
        forcedAiTab: null,
      };
    });
  }, []);

  const handleWalkthroughTabClick = useCallback(() => {
    setWalkthroughState((current) => {
      if (current.activeStepIndex !== SESSION_TOUR_STEP_INDEX.AI_SIDEBAR) {
        return current;
      }

      return { ...current, forcedAiTab: null };
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
    translations,
    activeTranslateIndex,
    setActiveTranslateIndex,
    isTranslateStreaming,
    handleTranslateCode,
  } = useSessionAi({
    sessionId: params.sessionId,
    question,
    selectedLanguage: sessionLanguage,
    codeByLanguage,
  });

  const isAiSidebarVisible =
    sidebarOpen || walkthroughState.isAiSidebarForcedOpen;

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
                ? "This session could not be found. Try returning to the dashboard and starting again."
                : (error ??
                  "Something went wrong while loading the collaboration session.")
            }
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  const otherParticipantName =
    session.participants.find((participant) => !participant.isCurrentUser)
      ?.username ?? "Your peer";
  const peerLeftMessage = peerLeft
    ? `${otherParticipantName} has left the session. Any further edits will not be saved.`
    : null;

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
          translations={translations}
          activeTranslateIndex={activeTranslateIndex}
          onActiveTranslateIndexChange={setActiveTranslateIndex}
          isTranslateStreaming={isTranslateStreaming}
          onTranslateCode={handleTranslateCode}
          currentLanguage={sessionLanguage}
          hasCode={Boolean(codeByLanguage[sessionLanguage]?.trim())}
          translateEmptyLabel="Start writing your solution in the editor. Once you have code, you can translate it here."
          walkthroughForceOpen={walkthroughState.isAiSidebarForcedOpen}
          walkthroughForcedTab={walkthroughState.forcedAiTab}
          onWalkthroughTabClick={handleWalkthroughTabClick}
          walkthroughDisableTransition={
            walkthroughState.activeStepIndex !== null
          }
        />
        <div className="min-w-0 flex-1">
          <SessionOnboardingTour onStepChange={handleTourStepChange}>
            <div className="mx-auto max-w-[1680px] px-5 pt-8 pb-6 sm:px-8 lg:px-10 lg:pb-8">
              <SessionHeader
                sessionId={session.sessionId}
                participants={session.participants}
                leaveError={leaveError}
                peerLeftMessage={peerLeftMessage}
                onLeaveSuccess={handleLeaveSuccess}
                onLeaveError={setLeaveError}
              />

              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] xl:gap-6">
                <QuestionPanel question={question} />
                <EditorPanel
                  sessionId={session.sessionId}
                  selectedLanguage={sessionLanguage}
                  value={codeByLanguage[sessionLanguage]}
                  onChange={handleEditorChange}
                  onExplainCode={handleExplainCode}
                  walkthroughShowExplainDemo={
                    walkthroughState.isEditorExplainDemoActive
                  }
                  yDocument={yDocument}
                  provider={provider}
                />
              </div>
            </div>
          </SessionOnboardingTour>
        </div>
      </div>
      <ChatWidget
        participants={session.participants}
        sessionId={session.sessionId}
        ticket={collabTicket}
      />
    </div>
  );
}
