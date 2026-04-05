'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { NavBar } from '@/components/ui/navBar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { PROGRAMMING_LANGUAGE_LABELS, type ProgrammingLanguage } from '@/lib/programming-languages';
import type { HistoryDetail } from '@/app/history/types';
import type { Difficulty } from '@/lib/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full rounded-lg" />,
});

function handleEditorWillMount(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('peerprep-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7B746C' },
      { token: 'keyword', foreground: '2E4E66' },
      { token: 'string', foreground: '3A7664' },
      { token: 'number', foreground: 'A1621A' },
    ],
    colors: {
      'editor.background': '#FBF8F4',
      'editor.foreground': '#2E3137',
      'editor.lineHighlightBackground': '#F3EEE7',
      'editorLineNumber.foreground': '#A29A92',
      'editorLineNumber.activeForeground': '#4B4A48',
      'editor.selectionBackground': '#D9ECE6',
      'editor.inactiveSelectionBackground': '#E7F3EF',
      'editorCursor.foreground': '#2F6F53',
      'editorIndentGuide.background1': '#E8E0D6',
      'editorIndentGuide.activeBackground1': '#CCC0B3',
      'editorWidget.background': '#FFFFFF',
      'editorWidget.border': '#E6DFD6',
    },
  });
}

const difficultyConfig: Record<Difficulty, string> = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-red-50 text-red-700 border-red-200',
};

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function monacoLanguage(lang: string): string {
  const map: Record<string, string> = {
    python: 'python',
    java: 'java',
    javascript: 'javascript',
    typescript: 'typescript',
    cpp: 'cpp',
    c: 'c',
  };
  return map[lang.toLowerCase()] ?? lang.toLowerCase();
}

export default function HistoryDetailPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [entry, setEntry] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    async function fetchEntry() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/history/${params.id}`);
        if (res.status === 404) {
          setError('History entry not found');
          return;
        }
        if (!res.ok) throw new Error('Failed to load history entry');
        const data: HistoryDetail = await res.json();
        setEntry(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchEntry();
  }, [params.id]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-14 w-full" />
        <div className="px-10 py-8 max-w-[1200px] mx-auto">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar activePage="dashboard" />
        <div className="px-8 pt-20 pb-12 max-w-[1200px] mx-auto">
          <div className="mb-6 animate-fade-in-up">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-7 w-80 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-border shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-0">
                <Skeleton className="h-[480px] w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar activePage="dashboard" />
        <div className="px-8 pt-20 pb-12 max-w-[960px] mx-auto">
          <div className="text-center py-16 animate-fade-in-up">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" className="text-muted-foreground/40 mx-auto mb-3">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[14px] text-foreground font-medium mb-1">
              {error ?? 'Entry not found'}
            </p>
            <p className="text-[12px] text-muted-foreground mb-5">
              This history entry may have been removed or is unavailable.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg transition-all duration-200 hover:bg-secondary active:scale-[0.97] cursor-pointer"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const question = entry.question;
  const descriptionParagraphs = question.description
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  const langLabel =
    PROGRAMMING_LANGUAGE_LABELS[entry.language as ProgrammingLanguage] ?? entry.language;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <NavBar activePage="dashboard" />

      <div className="px-8 pt-26 pb-16 max-w-[1200px] mx-auto">
        <div className="mb-6 animate-fade-in-up">
          <h1
            className="text-[22px] font-bold text-foreground mb-1"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Session {entry.session_id}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={`rounded-full text-[11px] font-semibold px-2.5 py-0.5 ${difficultyConfig[question.difficulty]}`}
            >
              {question.difficulty}
            </Badge>
            {question.topics.map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="rounded-full text-[11px] font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
              >
                {topic}
              </Badge>
            ))}
            <Separator orientation="vertical" className="h-4 mx-1" />
            <span className="text-[11.5px] text-muted-foreground flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="text-accent shrink-0">
                <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="11" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2.5 13c.4-2 2-3 4-3s3.5 1 3.9 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              with <span className="font-medium text-foreground">{entry.partner_username ?? entry.partner_id}</span>
            </span>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <span className="text-[11.5px] text-muted-foreground flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" className="text-muted-foreground shrink-0">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {formatTimestamp(entry.timestamp)}
            </span>
            <Separator orientation="vertical" className="h-4 mx-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            <Card className="border-border shadow-sm transition-shadow duration-300 hover:shadow-md h-full py-0 gap-0">
              <CardContent className="p-6">
                <h2
                  className="text-[16px] font-bold text-foreground mb-4"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {question.title}
                </h2>
                {descriptionParagraphs.length > 0 ? (
                  <div className="text-[13px] leading-relaxed text-foreground space-y-3">
                    {descriptionParagraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground italic">
                    No description available.
                  </p>
                )}

                {question.constraints.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-[12px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                      Constraints
                    </h3>
                    <ul className="list-disc list-inside text-[13px] text-muted-foreground space-y-1.5">
                      {question.constraints.map((c, i) => (
                        <li
                          key={i}
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.examples.map((example, i) => (
                  <div
                    key={i}
                    className="mt-5 bg-secondary border border-border rounded-xl p-4
                      transition-all duration-200 hover:border-accent/20
                      animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <h4 className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                      Example {question.examples.length > 1 ? i + 1 : 'Input / Output'}
                    </h4>
                    <pre
                      className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {`Input: ${example.input}\nOutput: ${example.output}`}
                      {example.explanation ? `\nExplanation: ${example.explanation}` : ''}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '160ms' }}
          >
            <Card className="border-border shadow-sm transition-shadow duration-300 hover:shadow-md overflow-hidden h-full flex flex-col bg-[#FBF8F4] py-2 gap-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="text-accent">
                    <path d="M5 12l-3-4 3-4M11 4l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[12px] font-semibold text-foreground">
                    Your Solution
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" className="shrink-0">
                      <path d="M5 12l-3-4 3-4M11 4l3 4-3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {langLabel}
                  </span>
                  {entry.code && (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(entry.code);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                          >
                            {copied ? (
                              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="text-emerald-600">
                                <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                                <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.3" />
                              </svg>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {copied ? 'Copied!' : 'Copy code'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <CardContent className="p-0 flex-1 min-h-0">
                {entry.code ? (
                  <MonacoEditor
                    height="480px"
                    language={monacoLanguage(entry.language)}
                    value={entry.code}
                    theme="peerprep-light"
                    beforeMount={handleEditorWillMount}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)',
                      lineNumbers: 'on',
                      renderLineHighlight: 'none',
                      folding: true,
                      wordWrap: 'on',
                      padding: { top: 12, bottom: 12 },
                      scrollbar: {
                        verticalScrollbarSize: 6,
                        horizontalScrollbarSize: 6,
                      },
                      domReadOnly: true,
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[480px] text-center px-6">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" className="text-muted-foreground/30 mb-2">
                      <path d="M8 17l-5-5 5-5M16 7l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[12.5px] text-muted-foreground">No code was saved for this session.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <Link
            href="/dashboard"
            className="group/back inline-flex items-center gap-1.5 text-[12.5px] font-medium
              text-muted-foreground no-underline
              transition-colors duration-200 hover:text-foreground cursor-pointer"
          >
            <svg
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              className="transition-transform duration-200 group-hover/back:-translate-x-0.5"
            >
              <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
