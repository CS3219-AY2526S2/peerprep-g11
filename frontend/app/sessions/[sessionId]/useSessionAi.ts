'use client';

import { useCallback, useState } from 'react';
import type { Question } from '@/app/questions/types';
import { readSseStream, type ParsedSseEvent } from '@/lib/sse';
import type {
  AiStreamChunkEvent,
  AiStreamDoneEvent,
  AiStreamErrorEvent,
  AiStreamFinishReason,
  AiStreamMetaEvent,
  AiTab,
  ExplainEntry,
  HintMessage,
  SessionLanguage,
  TranslateEntry,
} from '@/app/sessions/[sessionId]/types';

const HINT_REQUEST_MAX_MESSAGES = 12;
const HINT_REQUEST_MAX_TRANSCRIPT_CHARS = 6000;
const HINT_REFUSAL_MESSAGE =
  "I can help with hints, debugging, or a high-level approach, but I can't provide the full answer or unrelated help.";
const HINT_FAILURE_MESSAGE = 'Failed to reach the AI service. Please try again.';
const EXPLAIN_FAILURE_MESSAGE = 'Failed to reach the AI service. Please try again.';
const TRANSLATE_FAILURE_MESSAGE = 'Failed to reach the AI service. Please try again.';

interface SessionAiCodeContext {
  sessionId?: string;
  question: Question | null;
  selectedLanguage: SessionLanguage;
  codeByLanguage: Record<SessionLanguage, string>;
}

interface HintRequestMessage {
  id: string;
  role: HintMessage['role'];
  content: string;
  createdAt: string;
}

interface AssistantStreamResult {
  finishReason: AiStreamFinishReason | null;
  streamErrorMessage: string | null;
}

function createClientId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildHintRequestMessages(messages: HintMessage[]): HintRequestMessage[] {
  const selected: HintRequestMessage[] = [];
  let totalChars = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const content = message.content.trim();

    if (!content) {
      continue;
    }

    const nextSize = totalChars + content.length;
    if (
      selected.length >= HINT_REQUEST_MAX_MESSAGES ||
      (selected.length > 0 && nextSize > HINT_REQUEST_MAX_TRANSCRIPT_CHARS)
    ) {
      break;
    }

    selected.push({
      id: message.id,
      role: message.role,
      content,
      createdAt: message.createdAt,
    });
    totalChars = nextSize;
  }

  return selected.reverse();
}

async function streamAssistantResponse(
  endpoint: string,
  body: unknown,
  onEvent: (event: ParsedSseEvent) => void
): Promise<AssistantStreamResult> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Unable to reach the AI service.');
  }

  if (!res.body) {
    throw new Error('The AI service did not return a stream.');
  }

  let finishReason: AiStreamFinishReason | null = null;
  let streamErrorMessage: string | null = null;

  await readSseStream(res.body, (event) => {
    if (event.event === 'error') {
      const data = event.data as AiStreamErrorEvent;
      streamErrorMessage = data.message;
    }

    if (event.event === 'done') {
      const data = event.data as AiStreamDoneEvent;
      finishReason = data.finishReason;
    }

    onEvent(event);
  });

  return { finishReason, streamErrorMessage };
}

export function useSessionAi({
  sessionId,
  question,
  selectedLanguage,
  codeByLanguage,
}: SessionAiCodeContext) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState<AiTab>('hints');
  const [explanations, setExplanations] = useState<ExplainEntry[]>([]);
  const [activeExplainIndex, setActiveExplainIndex] = useState(0);
  const [hintMessages, setHintMessages] = useState<HintMessage[]>([]);
  const [isHintStreaming, setIsHintStreaming] = useState(false);
  const [translations, setTranslations] = useState<TranslateEntry[]>([]);
  const [activeTranslateIndex, setActiveTranslateIndex] = useState(0);
  const [isTranslateStreaming, setIsTranslateStreaming] = useState(false);

  const handleExplainCode = useCallback(
    async (selectedCode: string) => {
      if (!sessionId) {
        return;
      }

      const entryId = createClientId('explain');
      const nextExplainIndex = explanations.length;
      const newEntry: ExplainEntry = {
        id: entryId,
        selectedCode,
        language: selectedLanguage,
        response: null,
        createdAt: new Date().toISOString(),
      };

      setExplanations((prev) => [...prev, newEntry]);
      setActiveExplainIndex(nextExplainIndex);
      setSidebarOpen(true);
      setActiveAiTab('explain');

      try {
        const { finishReason, streamErrorMessage } = await streamAssistantResponse(
          `/api/sessions/${sessionId}/explain`,
          {
            questionDescription: question?.description ?? '',
            questionExamples: question?.examples ?? [],
            questionConstraints: question?.constraints ?? [],
            language: selectedLanguage,
            fullCode: codeByLanguage[selectedLanguage],
            selectedCode,
          },
          (event) => {
            if (event.event === 'chunk') {
              const data = event.data as AiStreamChunkEvent;
              setExplanations((prev) =>
                prev.map((entry) =>
                  entry.id === entryId
                    ? {
                        ...entry,
                        response: `${entry.response ?? ''}${data.delta}`,
                      }
                    : entry
                )
              );
            }
          }
        );

        if (streamErrorMessage) {
          const fallbackMessage =
            finishReason === 'refusal'
              ? streamErrorMessage
              : EXPLAIN_FAILURE_MESSAGE;

          setExplanations((prev) =>
            prev.map((entry) =>
              entry.id === entryId
                ? {
                    ...entry,
                    response:
                      entry.response && entry.response.trim().length > 0
                        ? entry.response
                        : fallbackMessage,
                  }
                : entry
            )
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : EXPLAIN_FAILURE_MESSAGE;

        setExplanations((prev) =>
          prev.map((entry) =>
            entry.id === entryId ? { ...entry, response: message } : entry
          )
        );
      }
    },
    [codeByLanguage, explanations.length, question, selectedLanguage, sessionId]
  );

  const handleSendHint = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text || !sessionId || !question || isHintStreaming) {
        return;
      }

      const userMessage: HintMessage = {
        id: createClientId('hint-user'),
        role: 'USER',
        content: text,
        createdAt: new Date().toISOString(),
        status: 'complete',
      };

      const assistantMessageId = createClientId('hint-ai');
      const assistantMessage: HintMessage = {
        id: assistantMessageId,
        role: 'AI',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      };

      const nextVisibleMessages = [...hintMessages, userMessage];

      setHintMessages([...nextVisibleMessages, assistantMessage]);
      setSidebarOpen(true);
      setActiveAiTab('hints');
      setIsHintStreaming(true);

      try {
        const requestMessages = buildHintRequestMessages(nextVisibleMessages);
        const { finishReason, streamErrorMessage } = await streamAssistantResponse(
          `/api/sessions/${sessionId}/hints`,
          {
            questionDescription: question.description,
            questionExamples: question.examples,
            questionConstraints: question.constraints,
            language: selectedLanguage,
            fullCode: codeByLanguage[selectedLanguage],
            messages: requestMessages,
          },
          (event) => {
            if (event.event === 'meta') {
              const data = event.data as AiStreamMetaEvent;
              setHintMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        requestId: data.requestId,
                      }
                    : message
                )
              );
            }

            if (event.event === 'chunk') {
              const data = event.data as AiStreamChunkEvent;
              setHintMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        content: `${message.content}${data.delta}`,
                        status: 'streaming',
                      }
                    : message
                )
              );
            }
          }
        );

        setHintMessages((prev) =>
          prev.map((message) => {
            if (message.id !== assistantMessageId) {
              return message;
            }

            if (finishReason === 'refusal') {
              return {
                ...message,
                content: HINT_REFUSAL_MESSAGE,
                status: 'error',
                finishReason,
              };
            }

            if (streamErrorMessage) {
              return {
                ...message,
                content:
                  message.content.trim().length > 0
                    ? message.content
                    : HINT_FAILURE_MESSAGE,
                status: 'error',
                finishReason: finishReason ?? undefined,
              };
            }

            return {
              ...message,
              content:
                message.content.trim().length > 0
                  ? message.content
                  : HINT_REFUSAL_MESSAGE,
              status: 'complete',
              finishReason: finishReason ?? undefined,
            };
          })
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : HINT_FAILURE_MESSAGE;

        setHintMessages((prev) =>
          prev.map((entry) =>
            entry.id === assistantMessageId
              ? {
                  ...entry,
                  content: message,
                  status: 'error',
                }
              : entry
          )
        );
      } finally {
        setIsHintStreaming(false);
      }
    },
    [codeByLanguage, hintMessages, isHintStreaming, question, selectedLanguage, sessionId]
  );

  const handleTranslateCode = useCallback(
    async (targetLanguage: string) => {
      const currentCode = codeByLanguage[selectedLanguage];
      if (!sessionId || !currentCode || isTranslateStreaming) {
        return;
      }

      const cachedIndex = translations.findIndex(
        (t) =>
          t.targetLanguage === targetLanguage &&
          t.sourceLanguage === selectedLanguage &&
          t.originalCode === currentCode &&
          t.translatedCode !== null
      );

      if (cachedIndex !== -1) {
        setActiveTranslateIndex(cachedIndex);
        setSidebarOpen(true);
        setActiveAiTab('translate');
        return;
      }

      const entryId = createClientId('translate');
      const nextTranslateIndex = translations.length;
      const newEntry: TranslateEntry = {
        id: entryId,
        sourceLanguage: selectedLanguage,
        targetLanguage,
        originalCode: currentCode,
        translatedCode: null,
        createdAt: new Date().toISOString(),
      };

      setTranslations((prev) => [...prev, newEntry]);
      setActiveTranslateIndex(nextTranslateIndex);
      setSidebarOpen(true);
      setActiveAiTab('translate');
      setIsTranslateStreaming(true);

      try {
        const { finishReason, streamErrorMessage } = await streamAssistantResponse(
          `/api/sessions/${sessionId}/translate`,
          {
            questionDescription: question?.description ?? '',
            questionExamples: question?.examples ?? [],
            questionConstraints: question?.constraints ?? [],
            language: selectedLanguage,
            targetLanguage,
            fullCode: currentCode,
          },
          (event) => {
            if (event.event === 'chunk') {
              const data = event.data as AiStreamChunkEvent;
              setTranslations((prev) =>
                prev.map((entry) =>
                  entry.id === entryId
                    ? {
                        ...entry,
                        translatedCode: `${entry.translatedCode ?? ''}${data.delta}`,
                      }
                    : entry
                )
              );
            }
          }
        );

        if (streamErrorMessage) {
          const fallbackMessage =
            finishReason === 'refusal'
              ? streamErrorMessage
              : TRANSLATE_FAILURE_MESSAGE;

          setTranslations((prev) =>
            prev.map((entry) =>
              entry.id === entryId
                ? {
                    ...entry,
                    translatedCode:
                      entry.translatedCode && entry.translatedCode.trim().length > 0
                        ? entry.translatedCode
                        : fallbackMessage,
                  }
                : entry
            )
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : TRANSLATE_FAILURE_MESSAGE;

        setTranslations((prev) =>
          prev.map((entry) =>
            entry.id === entryId ? { ...entry, translatedCode: message } : entry
          )
        );
      } finally {
        setIsTranslateStreaming(false);
      }
    },
    [codeByLanguage, translations, question, selectedLanguage, sessionId, isTranslateStreaming]
  );

  const handleClearHints = useCallback(() => {
    if (isHintStreaming) {
      return;
    }

    setHintMessages([]);
  }, [isHintStreaming]);

  return {
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
  };
}
