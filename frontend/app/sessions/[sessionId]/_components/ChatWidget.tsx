'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircleIcon, ChevronDownIcon, SendIcon } from 'lucide-react';
import type { SessionParticipant } from '@/app/sessions/[sessionId]/types';
import * as Y from 'yjs';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface ChatWidgetProps {
  participants: SessionParticipant[];
  sessionId: string;
  ticket: string | null;
}

export function ChatWidget({ participants, sessionId, ticket }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isOpenRef = useRef(isOpen);
  const hasCompletedInitialSyncRef = useRef(false);
  const lastReadMessageIdRef = useRef<string | null>(null);

  const yProviderRef = useRef<import('y-websocket').WebsocketProvider | null>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const yArrayRef = useRef<Y.Array<ChatMessage> | null>(null);
  const yMessagesRef = useRef<({ yMessages: Y.Array<ChatMessage>; syncMessages: () => void }) | null>(null);

  const currentUserId = participants.find((p) => p.isCurrentUser)?.id ?? '';
  const otherParticipantName = participants.find((p) => !p.isCurrentUser)?.username;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const getLastReadStorageKey = useCallback(() => {
    if (!currentUserId) return null;
    return `peerprep:chat:last-read:${sessionId}:${currentUserId}`;
  }, [currentUserId, sessionId]);

  const getLatestMessageId = useCallback((chatMessages: ChatMessage[]) => {
    return chatMessages.at(-1)?.id ?? '';
  }, []);

  const persistLastReadMessageId = useCallback(
    (messageId: string) => {
      const storageKey = getLastReadStorageKey();
      if (!storageKey) return;

      lastReadMessageIdRef.current = messageId;

      try {
        localStorage.setItem(storageKey, messageId);
      } catch (error) {
        console.error('[ChatYjs] Failed to persist last read message id:', error);
      }
    },
    [getLastReadStorageKey],
  );

  const getUnreadCountFromMessages = useCallback(
    (chatMessages: ChatMessage[], lastReadMessageId: string | null) => {
      if (lastReadMessageId === null) {
        return 0;
      }

      if (lastReadMessageId === '') {
        return chatMessages.filter((msg) => msg.sender !== currentUserId).length;
      }

      const lastReadIndex = chatMessages.findIndex((msg) => msg.id === lastReadMessageId);
      if (lastReadIndex === -1) {
        return 0;
      }

      return chatMessages.slice(lastReadIndex + 1).filter((msg) => msg.sender !== currentUserId).length;
    },
    [currentUserId],
  );

  const markAllAsRead = useCallback(
    (chatMessages: ChatMessage[]) => {
      persistLastReadMessageId(getLatestMessageId(chatMessages));
      setUnreadCount(0);
    },
    [getLatestMessageId, persistLastReadMessageId],
  );

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (!isOpen || !hasCompletedInitialSyncRef.current) return;
    markAllAsRead(messages);
  }, [isOpen, markAllAsRead, messages]);

  useEffect(() => {
    let cancelled = false;

    async function initYjs(): Promise<void> {
      try {
        const { WebsocketProvider } = await import('y-websocket');

        if (cancelled) return;

        const COLLAB_SERVICE_URL =
          process.env.NEXT_PUBLIC_COLLAB_SERVICE_WS_URL ??
          `${location.protocol === "http:" ? "ws:" : "wss:"}//localhost:1234`;

        const yDocument = new Y.Doc();
        yDocRef.current = yDocument;

        const provider = new WebsocketProvider(
          COLLAB_SERVICE_URL,
          `${sessionId}-chat`,
          yDocument,
          { params: { ticket: ticket! } },
        );
        yProviderRef.current = provider;

        provider.on('status', (event: { status: string }) => {
          console.log(`[ChatYjs] WebSocket status: ${event.status}`);
        });

        const yMessages = yDocument.getArray<ChatMessage>('messages');
        yArrayRef.current = yMessages;

        const syncMessages = () => {
          const newMessages = yMessages.toArray();
          setMessages(newMessages);

          if (!hasCompletedInitialSyncRef.current) {
            return;
          }

          if (isOpenRef.current) {
            markAllAsRead(newMessages);
            return;
          }

          setUnreadCount(getUnreadCountFromMessages(newMessages, lastReadMessageIdRef.current));
        };

        provider.on('sync', (isSynced: boolean) => {
          if (!isSynced || hasCompletedInitialSyncRef.current) return;

          const syncedMessages = yMessages.toArray();
          const storageKey = getLastReadStorageKey();
          let storedLastReadMessageId: string | null = null;

          if (storageKey) {
            try {
              storedLastReadMessageId = localStorage.getItem(storageKey);
            } catch (error) {
              console.error('[ChatYjs] Failed to read last read message id:', error);
            }
          }

          hasCompletedInitialSyncRef.current = true;
          setMessages(syncedMessages);

          if (storedLastReadMessageId === null) {
            markAllAsRead(syncedMessages);
            return;
          }

          lastReadMessageIdRef.current = storedLastReadMessageId;

          if (isOpenRef.current) {
            markAllAsRead(syncedMessages);
            return;
          }

          setUnreadCount(getUnreadCountFromMessages(syncedMessages, storedLastReadMessageId));
        });

        yMessages.observe(syncMessages);
        syncMessages();
        yMessagesRef.current = { yMessages, syncMessages };
      } catch (error) {
        console.error('[ChatYjs] Error during initialisation:', error);
      }
    }

    initYjs();

    return () => {
      cancelled = true;
      if (yMessagesRef.current) {
        const { yMessages, syncMessages } = yMessagesRef.current;
        yMessages.unobserve(syncMessages);
      }
      yProviderRef.current?.destroy();
      yDocRef.current?.destroy();
      yProviderRef.current = null;
      yDocRef.current = null;
      hasCompletedInitialSyncRef.current = false;
      lastReadMessageIdRef.current = null;
    };
  }, [
    currentUserId,
    getLastReadStorageKey,
    getUnreadCountFromMessages,
    markAllAsRead,
    sessionId,
    ticket,
  ]);

  function handleSend() {
    const text = inputValue.trim();
    if (!text || !yArrayRef.current || !currentUserId) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: currentUserId,
      text,
      timestamp: Date.now(),
    };
    yArrayRef.current.push([msg]);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = '20px';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            data-nextstep="chat-widget"
            initial={{ opacity: 0, scale: 0.4, x: 80, y: 120 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.4, x: 80, y: 120 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260, mass: 0.8 }}
            className="fixed bottom-6 right-6 z-50 flex h-[440px] w-[360px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
            style={{ transformOrigin: 'bottom right' }}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <MessageCircleIcon className="h-4 w-4 text-accent" />
                <span className="text-[13px] font-semibold text-foreground">
                  {otherParticipantName ? (
                    <>
                      Chat with <span className="text-accent">{otherParticipantName}</span>
                    </>
                  ) : (
                    'Chat'
                  )}
                </span>
              </div>
              <motion.button
                type="button"
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/60 hover:text-foreground"
                aria-label="Minimize chat"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
              {!hasMessages ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-[12px] text-muted-foreground/60">
                    Say hello to get started
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {messages.map((msg) => {
                    const isMe = msg.sender === currentUserId;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 text-[12.5px] leading-relaxed ${
                            isMe
                              ? 'rounded-2xl rounded-br-sm bg-accent-soft text-foreground'
                              : 'rounded-2xl rounded-bl-sm border border-border/60 bg-card text-foreground'
                          }`}
                        >
                          {msg.text.split('\n').map((line, i) => (
                            <span key={i}>
                              {i > 0 && <br />}
                              {line}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-border/60 px-3 py-2.5">
              <div className="flex items-center gap-2 px-1 py-1">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    const lineHeight = 20;
                    const maxHeight = lineHeight * 4;
                    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="h-[20px] max-h-[80px] flex-1 resize-none self-end bg-transparent text-[12.5px] leading-[20px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center self-end transition-colors duration-150 ease-out ${
                    inputValue.trim()
                      ? 'cursor-pointer text-accent hover:text-accent/70 active:scale-95'
                      : 'text-muted-foreground/30'
                  }`}
                  aria-label="Send message"
                >
                  <SendIcon className="h-[15px] w-[15px]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-fab"
            type="button"
            data-nextstep="chat-widget"
            onClick={() => {
              setIsOpen(true);
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors duration-150 hover:bg-secondary/60"
            aria-label="Open chat"
          >
            <MessageCircleIcon className="h-5 w-5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                  <span className="absolute inset-0 animate-ping rounded-full bg-destructive opacity-30" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
