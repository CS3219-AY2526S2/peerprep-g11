"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import { InfoIcon, SparklesIcon, WandSparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionLanguage } from "@/app/sessions/[sessionId]/types";
import { PROGRAMMING_LANGUAGE_LABELS } from "@/lib/programming-languages";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as Y from "yjs";

type MonacoInstance = typeof import("monaco-editor");

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="px-0 pb-0">
      <Skeleton className="h-[640px] w-full rounded-none" />
    </div>
  ),
});

interface EditorPanelProps {
  sessionId: string;
  ticket: string | null; // short-lived JWT from BFF — passed as WS query param
  selectedLanguage: SessionLanguage;
  value: string;
  onChange: (value: string) => void;
  onExplainCode: (selectedCode: string) => void;
  walkthroughShowExplainDemo?: boolean;
}

interface WidgetPosition {
  visible: boolean;
  top: number;
  left: number;
}

const FORMATTING_RULES: Record<SessionLanguage, string[]> = {
  python: [
    "Formatted with Black (PEP 8 compliant)",
    "Consistent indentation (4 spaces)",
    "Line length (defaults to 88 characters)",
    "Trailing commas and whitespace cleanup",
    "Consistent string quoting",
  ],
  javascript: [
    "Consistent indentation (2 spaces)",
    "Semicolons auto-inserted",
    "Line length (defaults to 80 characters)",
    "Trailing commas, whitespace, blank lines",
    "Consistent string quoting",
  ],
  java: [
    "Formatted with google-java-format",
    "Consistent indentation and brace placement",
    "Proper spacing and line wrapping",
    "Import ordering and cleanup",
    "Google Java Style compliant",
  ],
};

function handleEditorWillMount(monaco: typeof import("monaco-editor")) {
  monaco.editor.defineTheme("peerprep-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7B746C" },
      { token: "keyword", foreground: "2E4E66" },
      { token: "string", foreground: "3A7664" },
      { token: "number", foreground: "A1621A" },
      { token: "delimiter", foreground: "8B5CF6" },
      { token: "operator", foreground: "8B5CF6" },
    ],
    colors: {
      "editor.background": "#FBF8F4",
      "editor.foreground": "#2E3137",
      "editor.lineHighlightBackground": "#F3EEE7",
      "editorLineNumber.foreground": "#A29A92",
      "editorLineNumber.activeForeground": "#4B4A48",
      "editor.selectionBackground": "#D9ECE6",
      "editor.inactiveSelectionBackground": "#E7F3EF",
      "editorCursor.foreground": "#2F6F53",
      "editorIndentGuide.background1": "#E8E0D6",
      "editorIndentGuide.activeBackground1": "#CCC0B3",
      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#E6DFD6",
    },
  });
}

export function EditorPanel({
  sessionId,
  ticket,
  selectedLanguage,
  value,
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
  const [isFormatting, setIsFormatting] = useState(false);

  async function handleFormatCode() {
    const ed = editorRef.current;
    if (!ed || isFormatting) return;

    const model = ed.getModel();
    if (!model) return;

    const code = model.getValue();
    if (!code.trim()) return;

    const langLabel = PROGRAMMING_LANGUAGE_LABELS[selectedLanguage];
    setIsFormatting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/format`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: selectedLanguage }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err.error ?? "Unexpected error from formatter";
        toast.error(`Failed to format ${langLabel}`, {
          description: detail,
          descriptionClassName: '!text-black'
        });
        return;
      }

      const formatted = (await res.json()).formatted;

      if (typeof formatted === "string") {
        const fullRange = model.getFullModelRange();
        ed.executeEdits("format-code", [
          { range: fullRange, text: formatted },
        ]);
        toast.success(`${langLabel} code formatted`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(`Failed to format ${langLabel}`, {
        description: message,
        descriptionClassName: '!text-black'
      });
    } finally {
      setIsFormatting(false);
    }
  }

  // refs to hold Yjs objects so we can destroy them on unmount
  const yjsProviderRef = useRef<import("y-websocket").WebsocketProvider | null>(
    null,
  );
  const yjsDocRef = useRef<Y.Doc | null>(null);

  // initialise Yjs once the monaco editor is mounted AND the ticket is available
  useEffect(() => {
    if (!isEditorReady || !ticket) return;

    let cancelled = false;

    async function initYjs(): Promise<void> {
      try {
        const { WebsocketProvider } = await import("y-websocket");
        const { MonacoBinding } = await import("y-monaco");

        if (cancelled) return; // component unmounted before async import finished

        const COLLAB_SERVICE_URL =
          process.env.NEXT_PUBLIC_COLLAB_SERVICE_WS_URL ??
          `${location.protocol === "http:" ? "ws:" : "wss:"}//localhost:1234`;

        const yDocument = new Y.Doc();
        yjsDocRef.current = yDocument;

        const provider = new WebsocketProvider(
          COLLAB_SERVICE_URL,
          sessionId, // used as the Yjs room name — matches sessionId on the server
          yDocument,
          { params: { ticket: ticket! } }, // ticket appended as ?ticket=<value> on the WS URL
        );
        yjsProviderRef.current = provider;

        provider.on("status", (event: { status: string }) => {
          console.log(`[Yjs] WebSocket status: ${event.status}`);
        });

        const type = yDocument.getText("monaco");

        new MonacoBinding(
          type,
          editorRef.current!.getModel()!,
          new Set([editorRef.current!]),
          provider.awareness,
        );
      } catch (error) {
        console.error("[Yjs] Error during initialisation:", error);
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
    if (!ed) return "";
    const selection = ed.getSelection();
    if (!selection) return "";
    const model = ed.getModel();
    if (!model) return "";
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
    fontFamily: "var(--font-mono)",
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
      endPosition.column,
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
  }, [
    applyWalkthroughSelection,
    clearWalkthroughSelection,
    walkthroughShowExplainDemo,
  ]);

  useEffect(() => {
    if (walkthroughShowExplainDemo) {
      const frame = window.requestAnimationFrame(() => {
        applyWalkthroughSelection();
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [
    applyWalkthroughSelection,
    selectedLanguage,
    value,
    walkthroughShowExplainDemo,
  ]);

  return (
    <Card
      data-nextstep="editor-panel"
      className="gap-0 overflow-hidden rounded-b-none border-border bg-card py-0 shadow-[var(--shadow-xl)]"
    >
      <CardHeader className="border-b border-border/80 py-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle
              className="text-[24px] leading-tight text-foreground"
              style={{ fontFamily: "var(--font-serif)" }}
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

          <div className="flex items-center gap-4">
            <div className="space-y-1 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Language
              </p>
              <p className="text-base font-semibold text-foreground">
                {PROGRAMMING_LANGUAGE_LABELS[selectedLanguage]}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent
        data-nextstep="editor-surface"
        className="relative overflow-hidden rounded-b-none bg-secondary/10 px-0 pb-0 pt-0"
      >
        <MonacoEditor
          height="640px"
          language={selectedLanguage}
          value={value}
          beforeMount={handleEditorWillMount}
          onMount={(monacoEditor, monaco) => {
            monaco.editor.setTheme("peerprep-light");
            monacoEditor.focus();
            editorRef.current = monacoEditor;
            monacoRef.current = monaco;

            setEditorReady(true);
            monacoEditor.addAction({
              id: "peerprep.explainCode",
              label: "PeerPrep AI: Explain Code",
              contextMenuGroupId: "navigation",
              contextMenuOrder: 0,
              precondition: "editorHasSelection",
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
          onChange={(nextValue) => onChange(nextValue ?? "")}
          options={editorOptions}
        />

        {widgetPos.visible && (
          <button
            type="button"
            className="peerprep-explain-widget"
            disabled={walkthroughShowExplainDemo}
            aria-disabled={walkthroughShowExplainDemo}
            style={{
              position: "absolute",
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

      <div className="flex items-center gap-3 border-t border-border/80 px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={isFormatting || !isEditorReady}
          onClick={handleFormatCode}
          className="gap-1.5"
        >
          <WandSparklesIcon className="h-3.5 w-3.5" />
          {isFormatting ? "Formatting\u2026" : "Format Code"}
        </Button>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                <InfoIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="mb-1.5 text-xs font-semibold">
                {PROGRAMMING_LANGUAGE_LABELS[selectedLanguage]} formatting rules
              </p>
              <ul className="space-y-0.5">
                {FORMATTING_RULES[selectedLanguage].map((rule) => (
                  <li key={rule} className="text-xs">
                    <span className="text-emerald-300">&#x2022;</span>{" "}
                    {rule}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  );
}
