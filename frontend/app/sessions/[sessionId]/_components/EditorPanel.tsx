'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { editor } from 'monaco-editor';
import { CheckIcon, ChevronDownIcon, SparklesIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { SessionLanguage } from '@/app/sessions/[sessionId]/types';
import { PROGRAMMING_LANGUAGE_LABELS } from '@/lib/programming-languages';
import * as Y from "yjs";

type MonacoInstance = typeof import('monaco-editor');

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
  ticket: string | null;           // short-lived JWT from BFF — passed as WS query param
  selectedLanguage: SessionLanguage;
  allowedLanguages: SessionLanguage[];
  value: string;
  onLanguageChange: (language: SessionLanguage) => void;
  onChange: (value: string) => void;
  onExplainCode: (selectedCode: string) => void;
  walkthroughShowExplainDemo?: boolean;
}

interface WidgetPosition {
  visible: boolean;
  top: number;
  left: number;
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
  ticket,
  selectedLanguage,
  allowedLanguages,
  value,
  onLanguageChange,
  onChange,
  onExplainCode,
  walkthroughShowExplainDemo = false,
}: EditorPanelProps) {

  const onExplainCodeRef = useRef(onExplainCode);
  useEffect(() => {
    onExplainCodeRef.current = onExplainCode;
  }, [onExplainCode]);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);
  const [widgetPos, setWidgetPos] = useState<WidgetPosition>({
    visible: false,
    top: 0,
    left: 0,
  });

  const [isEditorReady, setEditorReady] = useState(false);

  // refs to hold Yjs objects so we can destroy them on unmount
  const yjsProviderRef = useRef<import('y-websocket').WebsocketProvider | null>(null);
  const yjsDocRef = useRef<Y.Doc | null>(null);

  // initialise Yjs once the monaco editor is mounted AND the ticket is available
  useEffect(() => {
    if (!isEditorReady || !ticket) return;

    let cancelled = false;

    async function initYjs(): Promise<void> {
      try {
        const { WebsocketProvider } = await import('y-websocket');
        const { MonacoBinding } = await import('y-monaco');

        if (cancelled) return; // component unmounted before async import finished

        const COLLAB_SERVICE_URL = process.env.NEXT_PUBLIC_COLLAB_SERVICE_WS_URL
          ?? `${location.protocol === 'http:' ? 'ws:' : 'wss:'}//localhost:1234`;

        const yDocument = new Y.Doc();
        yjsDocRef.current = yDocument;

        const provider = new WebsocketProvider(
          COLLAB_SERVICE_URL,
          sessionId,          // used as the Yjs room name — matches sessionId on the server
          yDocument,
          { params: { ticket: ticket! } }, // ticket appended as ?ticket=<value> on the WS URL
        );
        yjsProviderRef.current = provider;

        provider.on('status', (event: { status: string }) => {
          console.log(`[Yjs] WebSocket status: ${event.status}`);
        });

        const type = yDocument.getText('monaco');

        new MonacoBinding(
          type,
          editorRef.current!.getModel()!,
          new Set([editorRef.current!]),
          provider.awareness,
        );

      } catch (error) {
        console.error('[Yjs] Error during initialisation:', error);
      }
    }

    initYjs();

    // cleanup: destroy provider and doc when component unmounts or ticket/sessionId changes
    return () => {
      cancelled = true;
      yjsProviderRef.current?.destroy();
      yjsDocRef.current?.destroy();
      yjsProviderRef.current = null;
      yjsDocRef.current = null;
    };
  }, [isEditorReady, ticket, sessionId]);
  const getSelectedText = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return '';
    const selection = ed.getSelection();
    if (!selection) return '';
    const model = ed.getModel();
    if (!model) return '';
    return model.getValueInRange(selection).trim();
  }, []);

  const updateWidgetPosition = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) {
      setWidgetPos({ visible: false, top: 0, left: 0 });
      return;
    }

    const selection = ed.getSelection();
    if (!selection || selection.isEmpty()) {
      setWidgetPos({ visible: false, top: 0, left: 0 });
      return;
    }

    const model = ed.getModel();
    if (!model) {
      setWidgetPos({ visible: false, top: 0, left: 0 });
      return;
    }

    const selected = model.getValueInRange(selection).trim();
    if (!selected) {
      setWidgetPos({ visible: false, top: 0, left: 0 });
      return;
    }

    // Position at the end of the selection
    const endPos = selection.getEndPosition();
    const coords = ed.getScrolledVisiblePosition(endPos);
    if (!coords) {
      setWidgetPos({ visible: false, top: 0, left: 0 });
      return;
    }

    setWidgetPos({
      visible: true,
      top: coords.top - 32,
      left: coords.left + 16,
    });
  }, []);

  function handleExplainClick() {
    const selected = getSelectedText();
    if (selected) {
      onExplainCodeRef.current(selected);
    }
  }

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

  const clearWalkthroughSelection = useCallback(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) {
      setWidgetPos({ visible: false, top: 0, left: 0 });
      return;
    }

    ed.setSelection(new monaco.Selection(1, 1, 1, 1));
    setWidgetPos({ visible: false, top: 0, left: 0 });
  }, []);

  const applyWalkthroughSelection = useCallback(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    const model = ed?.getModel();

    if (!ed || !monaco || !model) {
      return;
    }

    const modelValue = model.getValue();
    const firstNonWhitespace = modelValue.search(/\S/);
    const lastNonWhitespace = modelValue.trimEnd().length;

    if (firstNonWhitespace === -1 || lastNonWhitespace <= firstNonWhitespace) {
      clearWalkthroughSelection();
      return;
    }

    const startPosition = model.getPositionAt(firstNonWhitespace);
    const endPosition = model.getPositionAt(lastNonWhitespace);
    const selection = new monaco.Selection(
      startPosition.lineNumber,
      startPosition.column,
      endPosition.lineNumber,
      endPosition.column
    );

    ed.setSelection(selection);
    ed.revealRangeInCenter(selection);
    updateWidgetPosition();
  }, [clearWalkthroughSelection, updateWidgetPosition]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (walkthroughShowExplainDemo) {
        applyWalkthroughSelection();
        return;
      }

      clearWalkthroughSelection();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [applyWalkthroughSelection, clearWalkthroughSelection, walkthroughShowExplainDemo]);

  useEffect(() => {
    if (walkthroughShowExplainDemo) {
      const frame = window.requestAnimationFrame(() => {
        applyWalkthroughSelection();
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [applyWalkthroughSelection, selectedLanguage, value, walkthroughShowExplainDemo]);

  return (
    <Card data-nextstep="editor-panel" className="gap-0 overflow-hidden rounded-b-none border-border bg-card shadow-[var(--shadow-xl)]">
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

          <div data-nextstep="language-selector" className="min-w-[170px]">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Language
            </p>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-full border bg-secondary/60 px-3 py-2 text-[12.5px] shadow-xs transition-all duration-200 ease-out outline-none hover:border-ring/30 hover:bg-muted/50 focus-visible:ring-[3px]"
                  aria-label="Select programming language"
                >
                  <span>{PROGRAMMING_LANGUAGE_LABELS[selectedLanguage]}</span>
                  <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-[1.1rem] border-border bg-popover p-2 shadow-[var(--shadow-xl)]"
              >
                {allowedLanguages.map((language) => {
                  const isSelected = language === selectedLanguage;

                  return (
                    <DropdownMenuItem
                      key={language}
                      onSelect={() => onLanguageChange(language)}
                      className={`rounded-xl px-4 py-3 text-[12.5px] font-medium ${isSelected
                        ? 'bg-accent text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                        : 'cursor-pointer focus:bg-accent-soft focus:text-foreground'
                        }`}
                    >
                      <span className="flex min-w-0 flex-1 items-center">
                        {PROGRAMMING_LANGUAGE_LABELS[language]}
                      </span>
                      {isSelected ? <CheckIcon className="ml-auto size-4 text-current" /> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative overflow-hidden rounded-b-none bg-secondary/10 px-0 pb-0 pt-0">
        <MonacoEditor
          height="640px"
          language={selectedLanguage}
          value={value}
          beforeMount={handleEditorWillMount}
          onMount={(monacoEditor, monaco) => {
            monaco.editor.setTheme('peerprep-light');
            monacoEditor.focus();
            editorRef.current = monacoEditor;
            monacoRef.current = monaco;

            setEditorReady(true);
            monacoEditor.addAction({
              id: 'peerprep.explainCode',
              label: 'PeerPrep AI: Explain Code',
              contextMenuGroupId: 'navigation',
              contextMenuOrder: 0,
              precondition: 'editorHasSelection',
              run: () => {
                const selection = monacoEditor.getSelection();
                if (!selection) return;
                const model = monacoEditor.getModel();
                if (!model) return;
                const selected = model.getValueInRange(selection).trim();
                if (selected) {
                  onExplainCodeRef.current(selected);
                }
              },
            });

            monacoEditor.onDidChangeCursorSelection(() => {
              updateWidgetPosition();
            });

            monacoEditor.onDidScrollChange(() => {
              updateWidgetPosition();
            });

            if (walkthroughShowExplainDemo) {
              applyWalkthroughSelection();
            }
          }}
          onChange={(nextValue) => onChange(nextValue ?? '')}
          options={editorOptions}
        />

        {widgetPos.visible && (
          <button
            type="button"
            className="peerprep-explain-widget"
            disabled={walkthroughShowExplainDemo}
            aria-disabled={walkthroughShowExplainDemo}
            style={{
              position: 'absolute',
              top: widgetPos.top,
              left: widgetPos.left,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (walkthroughShowExplainDemo) {
                return;
              }
              handleExplainClick();
            }}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>Explain</span>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
