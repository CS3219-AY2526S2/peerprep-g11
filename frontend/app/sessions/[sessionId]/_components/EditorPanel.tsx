'use client';

import dynamic from 'next/dynamic';
import type { editor } from 'monaco-editor';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { SessionLanguage } from '@/app/sessions/[sessionId]/types';
import { PROGRAMMING_LANGUAGE_LABELS } from '@/lib/programming-languages';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="px-0 pb-0">
      <Skeleton className="h-[640px] w-full rounded-none" />
    </div>
  ),
});

interface EditorPanelProps {
  sessionId: string;
  selectedLanguage: SessionLanguage;
  allowedLanguages: SessionLanguage[];
  value: string;
  onLanguageChange: (language: SessionLanguage) => void;
  onChange: (value: string) => void;
}

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

export function EditorPanel({
  sessionId,
  selectedLanguage,
  allowedLanguages,
  value,
  onLanguageChange,
  onChange,
}: EditorPanelProps) {
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    automaticLayout: true,
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    lineHeight: 22,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    roundedSelection: true,
    padding: { top: 24, bottom: 10 },
    tabSize: 2,
    smoothScrolling: true,
    overviewRulerBorder: false,
    fixedOverflowWidgets: true,
  };

  return (
    <Card className="gap-0 overflow-hidden rounded-b-none border-border bg-card shadow-[var(--shadow-xl)]">
      <CardHeader className="gap-2 border-b border-border/80">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <CardTitle
              className="text-[24px] leading-tight text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Shared Editor
            </CardTitle>
            <Badge
              variant="outline"
              className="rounded-full border-border bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground"
            >
              Session {sessionId}
            </Badge>
          </div>

          <div className="min-w-[170px]">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Language
            </p>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => onLanguageChange(value as SessionLanguage)}
            >
              <SelectTrigger className="w-full rounded-full border-border bg-secondary/60 text-[12.5px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {allowedLanguages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {PROGRAMMING_LANGUAGE_LABELS[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-hidden rounded-b-none bg-secondary/10 px-0 pb-0 pt-0">
        <MonacoEditor
          height="640px"
          language={selectedLanguage}
          value={value}
          beforeMount={handleEditorWillMount}
          onMount={(monacoEditor, monaco) => {
            monaco.editor.setTheme('peerprep-light');
            monacoEditor.focus();
          }}
          onChange={(nextValue) => onChange(nextValue ?? '')}
          options={editorOptions}
        />
      </CardContent>
    </Card>
  );
}
