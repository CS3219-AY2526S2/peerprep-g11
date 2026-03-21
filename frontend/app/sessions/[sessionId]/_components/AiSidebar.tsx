'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PanelLeftCloseIcon,
  SparklesIcon,
  LightbulbIcon,
  SendIcon,
  Trash2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { RichMarkdown } from './RichMarkdown';
import type { AiTab, ExplainEntry, HintMessage } from '@/app/sessions/[sessionId]/types';

function BouncingDots() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-[7px] w-[7px] rounded-full bg-accent/70"
          style={{ animation: `bounce-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        className="text-accent"
      >
        <rect x="3" y="8" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="9" cy="14" r="1.5" fill="currentColor" />
        <circle cx="15" cy="14" r="1.5" fill="currentColor" />
        <path d="M9.5 17.5C10 18.5 14 18.5 14.5 17.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M12 4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="3" r="1.5" fill="currentColor" />
        <path d="M1 13v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M23 13v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AiTab;
  onTabChange: (tab: AiTab) => void;
  explanations: ExplainEntry[];
  activeExplainIndex: number;
  onActiveExplainIndexChange: (index: number) => void;
  hintMessages: HintMessage[];
  isHintStreaming: boolean;
  onSendHint: (message: string) => void;
  onClearHints: () => void;
  walkthroughForceOpen?: boolean;
  walkthroughForcedTab?: AiTab | null;
  onWalkthroughTabClick?: (tab: AiTab) => void;
  walkthroughDisableTransition?: boolean;
}

const TABS: { id: AiTab; label: string; icon: typeof SparklesIcon }[] = [
  { id: 'hints', label: 'Hints', icon: LightbulbIcon },
  { id: 'explain', label: 'Explain', icon: SparklesIcon },
];

export function AiSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  explanations,
  activeExplainIndex,
  onActiveExplainIndexChange,
  hintMessages,
  isHintStreaming,
  onSendHint,
  onClearHints,
  walkthroughForceOpen = false,
  walkthroughForcedTab = null,
  onWalkthroughTabClick,
  walkthroughDisableTransition = false,
}: AiSidebarProps) {
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const explainScrollRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const effectiveIsOpen = isOpen || walkthroughForceOpen;
  const effectiveActiveTab = walkthroughForcedTab ?? activeTab;

  const totalExplanations = explanations.length;
  const viewIndex =
    totalExplanations === 0
      ? 0
      : Math.min(Math.max(activeExplainIndex, 0), totalExplanations - 1);

  // Scroll to top of explain panel when viewIndex changes
  useEffect(() => {
    explainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewIndex]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [hintMessages]);

  useEffect(() => {
    function notifyLayoutChanged() {
      window.dispatchEvent(new Event('resize'));
    }

    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) {
      return;
    }

    if (walkthroughDisableTransition) {
      const frameId = window.requestAnimationFrame(() => {
        notifyLayoutChanged();
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName === 'width') {
        notifyLayoutChanged();
      }
    };

    sidebarElement.addEventListener('transitionend', handleTransitionEnd);
    const timeoutId = window.setTimeout(notifyLayoutChanged, 320);

    return () => {
      sidebarElement.removeEventListener('transitionend', handleTransitionEnd);
      window.clearTimeout(timeoutId);
    };
  }, [effectiveIsOpen, walkthroughDisableTransition]);

  function handleSendMessage() {
    const text = chatInput.trim();
    if (!text || isHintStreaming) return;

    onSendHint(text);
    setChatInput('');

    if (inputRef.current) {
      inputRef.current.style.height = '18px';
    }
  }

  function handleClearChat() {
    if (isHintStreaming) {
      return;
    }

    onClearHints();
    setChatInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  const hasMessages = hintMessages.length > 0;
  const currentExplanation = explanations[viewIndex] ?? null;

  return (
    <aside
      ref={sidebarRef}
      data-nextstep="ai-sidebar"
      className={`sticky top-0 z-20 h-screen shrink-0 overflow-hidden border-r border-border bg-card ${
        walkthroughDisableTransition ? '' : 'transition-[width] duration-300 ease-out'
      }`}
      style={{ width: effectiveIsOpen ? 440 : 0 }}
    >
      <div
        className={`flex h-full w-[440px] flex-col overflow-hidden ${
          walkthroughDisableTransition ? '' : 'transition-opacity duration-200'
        } ${effectiveIsOpen ? 'opacity-100 delay-100' : 'opacity-0'
          }`}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/12">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent"
              >
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                <path d="M5.6 5.6l2.85 2.85M15.55 15.55l2.85 2.85M5.6 18.4l2.85-2.85M15.55 8.45l2.85-2.85" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-foreground">
              AI Assistant
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Assistant"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all duration-150 ease-out hover:bg-muted/60 hover:text-foreground active:scale-95"
          >
            <PanelLeftCloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div data-nextstep="ai-sidebar-tabs" className="flex border-b border-border/60">
          {TABS.map((tab) => {
            const isActive = effectiveActiveTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                data-nextstep={`ai-tab-${tab.id}`}
                onClick={() => {
                  onWalkthroughTabClick?.(tab.id);
                  onTabChange(tab.id);
                }}
                className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition-all duration-150 ease-out active:scale-[0.98] ${isActive
                  ? 'text-accent'
                  : 'text-muted-foreground hover:bg-accent/8 hover:text-accent'
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 overflow-hidden" style={{ display: 'grid' }}>
          {/* Explain tab panel */}
          <div
            className="flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              gridArea: '1 / 1',
              opacity: effectiveActiveTab === 'explain' ? 1 : 0,
              transform:
                effectiveActiveTab === 'explain' ? 'translateX(0)' : 'translateX(40%)',
              pointerEvents: effectiveActiveTab === 'explain' ? 'auto' : 'none',
            }}
          >
            {totalExplanations === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="space-y-4">
                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
                    <div className="absolute inset-0 rounded-xl bg-accent/8" />
                    <div className="absolute inset-1 rounded-[10px] bg-accent/5" />
                    <SparklesIcon className="relative h-5 w-5 text-accent" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[13px] font-medium text-foreground">Explain Code</p>
                    <p className="mx-auto max-w-[240px] text-[11.5px] leading-relaxed text-muted-foreground">
                      Select code in the editor, right-click, and choose{' '}
                      <span className="font-semibold text-accent">&quot;Explain Code&quot;</span>{' '}
                      to get an AI-generated explanation.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {totalExplanations > 1 && (
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onActiveExplainIndexChange(Math.max(0, viewIndex - 1))}
                      disabled={viewIndex === 0}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all duration-150 ease-out hover:bg-muted/60 hover:text-foreground active:scale-95 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:active:scale-100"
                      aria-label="Previous explanation"
                    >
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {viewIndex + 1} / {totalExplanations}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onActiveExplainIndexChange(
                          Math.min(totalExplanations - 1, viewIndex + 1)
                        )
                      }
                      disabled={viewIndex === totalExplanations - 1}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all duration-150 ease-out hover:bg-muted/60 hover:text-foreground active:scale-95 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:active:scale-100"
                      aria-label="Next explanation"
                    >
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div ref={explainScrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                  {currentExplanation && (
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Selected Code
                        </p>
                        <div className="overflow-hidden rounded-lg border border-border">
                          <div className="flex items-center border-b border-border bg-secondary/40 px-3 py-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {currentExplanation.language}
                            </span>
                          </div>
                          <pre className="overflow-x-auto bg-secondary/15 px-4 py-3 text-[12px] leading-5">
                            <code style={{ fontFamily: 'var(--font-mono)' }}>
                              {currentExplanation.selectedCode}
                            </code>
                          </pre>
                        </div>
                      </div>

                      <div className="h-px bg-border/60" />

                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Explanation
                        </p>
                        {currentExplanation.response === null ? (
                          <div className="flex flex-col items-center gap-3 py-8">
                            <LoaderCircleIcon className="h-5 w-5 animate-spin text-accent" />
                            <p className="text-[11.5px] text-muted-foreground">
                              Analyzing your code…
                            </p>
                          </div>
                        ) : (
                          <div>
                            <RichMarkdown
                              content={currentExplanation.response}
                              className="grid gap-3"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Hints tab panel */}
          <div
            className="flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              gridArea: '1 / 1',
              opacity: effectiveActiveTab === 'hints' ? 1 : 0,
              transform:
                effectiveActiveTab === 'hints' ? 'translateX(0)' : 'translateX(-40%)',
              pointerEvents: effectiveActiveTab === 'hints' ? 'auto' : 'none',
            }}
          >
            <div className="flex flex-1 flex-col overflow-y-auto">
              {!hasMessages ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <div className="space-y-4">
                    <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
                      <div className="absolute inset-0 rounded-xl bg-accent/8" />
                      <div className="absolute inset-1 rounded-[10px] bg-accent/5" />
                      <LightbulbIcon className="relative h-5 w-5 text-accent" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[13px] font-medium text-foreground">Get a Hint</p>
                      <p className="mx-auto max-w-[240px] text-[11.5px] leading-relaxed text-muted-foreground">
                        Ask the AI for guidance on your current problem without revealing the full solution.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                      {['Give me a hint', 'Explain the problem', 'Suggest an approach'].map((shortcut) => (
                        <button
                          key={shortcut}
                          type="button"
                          onClick={() => {
                            setChatInput(shortcut);
                            inputRef.current?.focus();
                          }}
                          disabled={isHintStreaming}
                          className="cursor-pointer rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all duration-150 ease-out hover:border-accent/20 hover:bg-accent/8 hover:text-accent active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-secondary/40 disabled:hover:text-muted-foreground disabled:active:scale-100"
                        >
                          {shortcut}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 px-4 py-3 pb-8">
                  {hintMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start items-end gap-2'}`}
                    >
                      {msg.role === 'AI' && <BotAvatar />}
                      <div
                        className={`rounded-xl px-3 py-2 text-[12px] leading-relaxed ${msg.role === 'USER'
                          ? 'max-w-[85%] bg-accent/12 text-foreground'
                          : 'max-w-[calc(85%-32px)] border border-border/60 bg-secondary/30 text-foreground'
                          }`}
                      >
                        {msg.role === 'AI' && (
                          <p className="mb-1 text-[10px] font-medium text-accent">PeerPrep AI</p>
                        )}
                        {msg.role === 'AI' ? (
                          msg.content ? (
                            <RichMarkdown content={msg.content} className="grid gap-2" />
                          ) : (
                            <BouncingDots />
                          )
                        ) : (
                          msg.content.split('\n').map((line, i) => (
                            <span key={i}>
                              {i > 0 && <br />}
                              {line}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="relative px-3 py-2.5">
              {hasMessages && (
                <div
                  className="pointer-events-none absolute left-0 right-4 bottom-full h-16"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, oklch(1.0 0 0))',
                  }}
                />
              )}
              {hasMessages && (
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    disabled={isHintStreaming}
                    className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground transition-all duration-150 ease-out hover:bg-destructive/10 hover:text-destructive active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:active:scale-100"
                  >
                    <Trash2Icon className="h-3 w-3" />
                    Clear
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 transition-colors duration-150 focus-within:border-accent/30">
                <textarea
                  ref={inputRef}
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    e.target.style.height = 'auto';
                    const lineHeight = 18;
                    const maxHeight = lineHeight * 6;
                    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for a hint..."
                  rows={1}
                  className="h-[18px] max-h-[108px] flex-1 resize-none bg-transparent text-[12px] leading-[18px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isHintStreaming}
                  className={`mb-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ease-out ${chatInput.trim() && !isHintStreaming
                    ? 'cursor-pointer bg-accent text-white hover:bg-accent/80 hover:scale-110 hover:shadow-md active:scale-95'
                    : 'text-muted-foreground/30'
                    }`}
                >
                  {isHintStreaming ? (
                    <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SendIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-1 pb-3">
          <p className="text-[10px] text-destructive/70">
            AI-generated content, verify before using.
          </p>
        </div>
      </div>
    </aside>
  );
}
