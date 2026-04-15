'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/ui/navBar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/app/questions/_components/PaginationControls';
import type { HistoryListItem, HistoryListResponse } from '@/app/history/types';

const PAGE_SIZE = 5;

const actionCards = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" className="text-accent">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Browse Questions',
    desc: 'Explore curated technical interview prompts across categories, difficulty levels, and company focus areas.',
    features: ['Filter by topic & difficulty', 'Company-style focus areas', 'Detailed solution breakdowns'],
    action: 'Explore questions',
    href: '/questions',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" className="text-accent">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.5 19c.6-2.7 3-4 5.5-4s4.8 1.3 5.4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Start Matching',
    desc: 'Jump into a peer session in minutes and solve live interview questions together in a shared editor.',
    features: ['Real-time collaborative editor', 'Choose your language & topic', 'Instant peer matching'],
    action: 'Find a match',
    href: '/matching',
  },
];

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const [history, setHistory] = useState<HistoryListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;
    async function fetchHistory() {
      setHistoryLoading(true);
      try {
        const params = new URLSearchParams({
          user_id: currentUserId,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        const res = await fetch(`/api/history?${params.toString()}`);
        if (res.ok) {
          const data: HistoryListResponse = await res.json();
          setHistory(data.data);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        } else {
          setHistory([]);
          setTotal(0);
          setTotalPages(0);
        }
      } catch {
        setHistory([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setHistoryLoading(false);
      }
    }
    void fetchHistory();
  }, [page, userId]);

  useEffect(() => {
    setPage(1);
  }, [userId]);

  if (isLoading || !user) return <Skeleton />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar activePage="dashboard" />

      <div className="px-8 pt-22 pb-12 max-w-[960px] mx-auto">
        <div className="flex items-end justify-between mb-5 animate-fade-in-up">
          <div>
            <h1
              className="text-[22px] font-semibold text-foreground mb-0.5"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Welcome back, {user.username}!
            </h1>
            <p className="text-[12.5px] text-muted-foreground">What would you like to do today?</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {actionCards.map(({ icon, title, desc, features, action, href }, i) => (
            <Card
              key={title}
              className="group flex flex-col
                border-border shadow-sm
                transition-all duration-300 ease-out
                hover:-translate-y-[3px] hover:shadow-xl
                hover:ring-2 hover:ring-accent/10 hover:border-accent/20
                active:scale-[0.98] active:shadow-md
                animate-fade-in-up px-2"
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <CardHeader className="pb-1.5 pt-5 px-5">
                <div className="w-9 h-9 rounded-lg bg-accent-soft grid place-items-center mb-1.5 transition-transform duration-250 group-hover:scale-110">
                  {icon}
                </div>
                <CardTitle
                  className="text-[15px] font-semibold"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 px-5 pb-2">
                <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">{desc}</p>
                <ul className="space-y-1.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[11.5px] text-foreground/70">
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" className="text-accent shrink-0">
                        <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-5 pb-5 pt-2">
                <Link
                  href={href}
                  className="group/btn relative inline-flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full
                    bg-accent text-white text-[12.5px] font-medium
                    shadow-[0_2px_12px_-3px_oklch(0.50_0.08_180_/_0.4)]
                    hover:shadow-[0_4px_20px_-4px_oklch(0.50_0.08_180_/_0.5)]
                    hover:brightness-110 hover:scale-[1.01]
                    transition-all duration-300 ease-out
                    overflow-hidden no-underline"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                  <span className="relative z-10">{action}</span>
                  <span className="relative z-10 w-6 h-6 rounded-full bg-white/20 grid place-items-center transition-all duration-200 group-hover/btn:bg-white/30 group-hover/btn:scale-110">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <p className="text-[13px] font-semibold text-foreground mb-2.5">Question History</p>
          <Card className="border-border shadow-sm overflow-hidden py-2">
            <CardContent className="px-3 pt-1 pb-1 grid gap-1">
              {historyLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg bg-secondary/30"
                  >
                    <div className="min-w-0 pl-2 space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-3/5" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                    <Skeleton className="h-3.5 w-14 rounded-full" />
                  </div>
                ))
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" className="text-muted-foreground/40 mb-2">
                    <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <p className="text-[12.5px] text-muted-foreground">No question history yet.</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">Complete a session to see it here.</p>
                </div>
              ) : (
                history.map((item, i) => (
                  <Link
                    key={item._id}
                    href={`/history/${item._id}`}
                    className="group/row relative flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg
                      bg-secondary/30 border border-transparent
                      transition-all duration-200 ease-out
                      hover:bg-secondary hover:border-border
                      no-underline cursor-pointer
                      animate-fade-in-up"
                    style={{ animationDelay: `${350 + i * 60}ms` }}
                  >
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-full bg-accent transition-all duration-200 group-hover/row:h-6" />

                    <div className="min-w-0 pl-2">
                      <p className="text-[12.5px] font-semibold text-foreground truncate">
                        {item.question.title}
                        <span className="text-muted-foreground font-normal">
                          {' '}· {item.question.topics?.[0] ?? 'General'}
                        </span>
                      </p>
                      <p className="text-[11px] mt-0.5 text-muted-foreground">
                        with {item.partner_username ?? item.partner_id} · {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10.5px] font-medium whitespace-nowrap ${
                        item.question.difficulty === 'Hard'
                          ? 'text-red-400/80'
                          : item.question.difficulty === 'Medium'
                            ? 'text-amber-400/80'
                            : 'text-emerald-400/80'
                      }`}>
                        {item.question.difficulty}
                      </span>
                      <svg
                        viewBox="0 0 16 16"
                        width="14"
                        height="14"
                        fill="none"
                        className="text-muted-foreground/0 transition-all duration-200 group-hover/row:text-muted-foreground"
                      >
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
          {!historyLoading && history.length > 0 ? (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              itemLabel="history entries"
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
