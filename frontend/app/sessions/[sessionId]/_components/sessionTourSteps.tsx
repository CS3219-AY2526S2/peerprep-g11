import {
  ClipboardList,
  Code,
  Sparkles,
  PanelLeft,
  MessageCircle,
  LogOut,
} from "lucide-react";
import type { Tour } from "nextstepjs";

export const SESSION_TOUR_ID = "sessions";
export const SESSION_TOUR_STEP_INDEX = {
  QUESTION: 0,
  SHARED_EDITOR: 1,
  EXPLAIN_DEMO: 2,
  AI_SIDEBAR: 3,
  CHAT_WIDGET: 4,
  LEAVE_SESSION: 5,
} as const;

export const sessionTourSteps: Tour[] = [
  {
    tour: SESSION_TOUR_ID,
    steps: [
      {
        icon: <ClipboardList size={15} />,
        title: "Your Question",
        content:
          "This panel shows the question you and your peer will solve together. Read through the description, examples and constraints before you start coding.",
        selector: '[data-nextstep="question-panel"]',
        side: "right",
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <Code size={15} />,
        title: "Shared Editor",
        content:
          "This is your real-time collaborative code editor. Changes sync live between both participants, decide who starts first or take turns writing code.",
        selector: '[data-nextstep="editor-panel"]',
        side: "left",
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <Sparkles size={15} />,
        title: "Explain Selected Code",
        content:
          "The walkthrough highlights the starter code for you here. When you select code in the shared editor, the Explain action appears so you can ask AI to break it down.",
        selector: '[data-nextstep="editor-surface"]',
        side: "left",
        showControls: true,
        showSkip: false,
        disableInteraction: true,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <PanelLeft size={15} />,
        title: "AI Assistant Sidebar",
        content:
          "This is your AI assistant. Use the Hints tab to get guidance, or switch to Explain to break down selected code. Both are here whenever you need them.",
        selector: '[data-nextstep="ai-sidebar-tabs"]',
        side: "bottom-right",
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <MessageCircle size={15} />,
        title: "Session Chat",
        content:
          "Use the chat widget to coordinate with your peer without leaving the coding flow. Open it anytime to discuss approaches or ask quick clarifying questions.",
        selector: '[data-nextstep="chat-widget"]',
        side: "top-right",
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <LogOut size={15} />,
        title: "Leave Session",
        content:
          "When you are done, click this button to leave the session and return to the dashboard.",
        selector: '[data-nextstep="leave-session-btn"]',
        side: "bottom-right",
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
    ],
  },
];
