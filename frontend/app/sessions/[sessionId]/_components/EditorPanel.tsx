"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import { SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionLanguage } from "@/app/sessions/[sessionId]/types";
import { PROGRAMMING_LANGUAGE_LABELS } from "@/lib/programming-languages";
import * as Y from "yjs";

type MonacoInstance = typeof import("monaco-editor");

type WebsocketProvider = import("y-websocket").WebsocketProvider;

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
  selectedLanguage: SessionLanguage;
  value: string;
  onChange: (value: string) => void;
  onExplainCode: (selectedCode: string) => void;
  walkthroughShowExplainDemo?: boolean;
  yDocument: Y.Doc | null;
  provider: WebsocketProvider | null;
}

interface WidgetPosition {
  visible: boolean;
  top: number;
  left: number;
}

function handleEditorWillMount(monaco: typeof import("monaco-editor")) {
  monaco.editor.defineTheme("peerprep-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7B746C" },
      { token: "keyword", foreground: "2E4E66" },
      { token: "string", foreground: "3A7664" },
      { token: "number", foreground: "A1621A" },
    ],
    colors: {
      "editor.background": "#FBF8F4",
      "editor.foreground": "#2E3137",
      "editor.lineHighlightBackground": "#F3EEE7",
      "editorLineNumber.foreground": "#A29A92",
      "editorLineNumber.activeForeground": "#4B4A48",
      "editor.selectionBackground": "#D9ECE6",
      "editor.inactiveSelectionBackground": "#E7F3EF",
      "editorCursor.foreground": "#C26B2D",
      "editorIndentGuide.background1": "#E8E0D6",
      "editorIndentGuide.activeBackground1": "#CCC0B3",
      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#E6DFD6",
    },
  });
}

export function EditorPanel({
  sessionId,
  selectedLanguage,
  value,
  onChange,
  onExplainCode,
  walkthroughShowExplainDemo = false,
  yDocument,
  provider,
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

  useEffect(() => {
    if (!isEditorReady || !provider || !yDocument || !editorRef.current) {
      return;
    }

    let cancelled = false;
    let binding: { destroy?: () => void } | null = null;

    async function initYjsBinding(): Promise<void> {
      try {
        const { MonacoBinding } = await import("y-monaco");

        if (cancelled || !editorRef.current) {
          return;
        }

        const type = yDocument!.getText("monaco");

        binding = new MonacoBinding(
          type,
          editorRef.current.getModel()!,
          new Set([editorRef.current]),
          provider!.awareness,
        );
      } catch (error) {
        console.error("[Yjs] Error during editor binding:", error);
      }
    }

    void initYjsBinding();

    return () => {
      cancelled = true;
      binding?.destroy?.();
    };
  }, [isEditorReady, provider, yDocument]);

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

          <div className="space-y-1 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Language
            </p>
            <p className="text-base font-semibold text-foreground">
              {PROGRAMMING_LANGUAGE_LABELS[selectedLanguage]}
            </p>
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
    </Card>
  );
}
