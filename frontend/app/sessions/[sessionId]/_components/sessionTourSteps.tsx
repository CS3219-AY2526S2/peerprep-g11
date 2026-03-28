import {
  ClipboardList,
  Code,
  Languages,
  Sparkles,
  PanelLeft,
  Users,
  LogOut,
} from 'lucide-react';
import type { Tour } from 'nextstepjs';

export const SESSION_TOUR_ID = 'sessions';
export const SESSION_TOUR_STEP_INDEX = {
  QUESTION: 0,
  SHARED_EDITOR: 1,
  LANGUAGE_SELECTOR: 2,
  EXPLAIN_DEMO: 3,
  AI_SIDEBAR: 4,
  PARTICIPANTS: 5,
  LEAVE_SESSION: 6,
} as const;

export const sessionTourSteps: Tour[] = [
  {
    tour: SESSION_TOUR_ID,
    steps: [
      {
        icon: <ClipboardList size={15} />,
        title: 'Your Question',
        content:
          'This panel shows the question you and your peer will solve together. Read through the description, examples and constraints before you start coding.',
        selector: '[data-nextstep="question-panel"]',
        side: 'right',
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <Code size={15} />,
        title: 'Shared Editor',
        content:
          'This is your real-time collaborative code editor. Changes sync live between both participants, decide who starts first or take turns writing code.',
        selector: '[data-nextstep="editor-panel"]',
        side: 'left',
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <Languages size={15} />,
        title: 'Language Selector',
        content:
          'Switch between programming languages here. The editor will update its syntax highlighting to match the language you choose.',
        selector: '[data-nextstep="language-selector"]',
        side: 'bottom',
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <Sparkles size={15} />,
        title: 'Explain Selected Code',
        content:
          'The walkthrough highlights the starter code for you here. When you select code in the shared editor, the Explain action appears so you can ask AI to break it down.',
        selector: '[data-nextstep="editor-panel"]',
        side: 'left',
        showControls: true,
        showSkip: false,
        disableInteraction: true,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <PanelLeft size={15} />,
        title: 'AI Assistant Sidebar',
        content:
          'The AI sidebar opens on Hints first. Click the Explain tab yourself to see where code explanations appear and unlock the next step.',
        selector: '[data-nextstep="ai-sidebar-tabs"]',
        side: 'bottom-right',
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <Users size={15} />,
        title: 'Session Participants',
        content:
          "See who is in the session and their connection status. A green dot means they are connected and ready to collaborate.",
        selector: '[data-nextstep="participants-card"]',
        side: 'bottom',
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
      {
        icon: <LogOut size={15} />,
        title: 'Leave Session',
        content:
          "When you are done, click this button to leave the session and return to the dashboard.",
        selector: '[data-nextstep="leave-session-btn"]',
        side: 'bottom-right',
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 16,
      },
    ],
  },
];
