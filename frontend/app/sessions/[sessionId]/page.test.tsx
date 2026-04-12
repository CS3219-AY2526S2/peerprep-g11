import type { ReactNode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

import SessionPage from '@/app/sessions/[sessionId]/page';
import { Role } from '@/lib/auth';
import { fetchMock, resetFetchMock } from '@/test-utils/fetch';
import {
  resetMockRequireAuth,
  setMockRequireAuthState,
} from '@/test-utils/mock-require-auth';
import {
  resetNextNavigationMocks,
  setMockParams,
} from '@/test-utils/next-navigation';

jest.mock('next/navigation', () => jest.requireActual('@/test-utils/next-navigation'));
jest.mock('@/hooks/useRequireAuth', () =>
  jest.requireActual('@/test-utils/mock-require-auth'),
);
jest.mock(
  'nextstepjs',
  () => ({
    useNextStep: () => ({ startNextStep: jest.fn() }),
  }),
  { virtual: true },
);
jest.mock('@/app/sessions/[sessionId]/useSessionAi', () => ({
  useSessionAi: () => ({
    sidebarOpen: false,
    setSidebarOpen: jest.fn(),
    activeAiTab: 'hints',
    setActiveAiTab: jest.fn(),
    explanations: [],
    activeExplainIndex: null,
    setActiveExplainIndex: jest.fn(),
    handleExplainCode: jest.fn(),
    hintMessages: [],
    isHintStreaming: false,
    handleSendHint: jest.fn(),
    handleClearHints: jest.fn(),
    translations: [],
    activeTranslateIndex: null,
    setActiveTranslateIndex: jest.fn(),
    isTranslateStreaming: false,
    handleTranslateCode: jest.fn(),
  }),
}));
jest.mock('@/app/sessions/[sessionId]/_components/SessionPageSkeleton', () => ({
  SessionPageSkeleton: () => <div data-testid="session-skeleton" />,
}));
jest.mock('@/app/sessions/[sessionId]/_components/SessionErrorState', () => ({
  SessionErrorState: ({ title, message }: { title: string; message: string }) => (
    <div>
      <p>{title}</p>
      <p>{message}</p>
    </div>
  ),
}));
jest.mock('@/app/sessions/[sessionId]/_components/QuestionPanel', () => ({
  QuestionPanel: () => <div data-testid="question-panel" />,
}));
jest.mock('@/app/sessions/[sessionId]/_components/EditorPanel', () => ({
  EditorPanel: () => <div data-testid="editor-panel" />,
}));
jest.mock('@/app/sessions/[sessionId]/_components/SessionOnboardingTour', () => ({
  SessionOnboardingTour: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('@/app/sessions/[sessionId]/_components/AiSidebar', () => ({
  AiSidebar: () => <div data-testid="ai-sidebar" />,
}));
jest.mock('@/app/sessions/[sessionId]/_components/AiSidebarToggle', () => ({
  AiSidebarToggle: () => <button type="button">AI</button>,
}));
jest.mock('@/app/sessions/[sessionId]/_components/ChatWidget', () => ({
  ChatWidget: () => <div data-testid="chat-widget" />,
}));

const sessionResponse = {
  sessionId: 'session-123',
  questionId: 'question-456',
  questionSlug: 'two-sum',
  status: 'active' as const,
  selectedLanguage: 'python' as const,
  allowedLanguages: ['python', 'javascript', 'java'] as const,
  starterCode: {
    javascript: '',
    python: 'print("hi")',
    java: '',
  },
  participants: [
    {
      id: 'user-1',
      username: 'Ada',
      isCurrentUser: true,
      presence: 'connected' as const,
    },
    {
      id: 'user-2',
      username: 'Taylor',
      isCurrentUser: false,
      presence: 'connected' as const,
    },
  ],
  ticket: 'ticket-123',
};

const questionResponse = {
  id: 'question-456',
  title: 'Two Sum',
  description: 'Find two numbers.',
  topics: ['Arrays'],
  difficulty: 'Easy' as const,
  status: 'Pending' as const,
  examples: [],
  constraints: [],
};

describe('SessionPage peer departure flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetFetchMock();
    resetMockRequireAuth();
    resetNextNavigationMocks();
    setMockParams({ sessionId: 'session-123' });
    setMockRequireAuthState({
      user: {
        id: 'user-1',
        username: 'Ada',
        email: 'ada@example.com',
        role: Role.USER,
        skipOnboarding: false,
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows a persistent peer-left banner and marks the other participant disconnected after a later 404', async () => {
    let sessionRequestCount = 0;

    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === '/api/sessions/session-123') {
        sessionRequestCount += 1;

        if (sessionRequestCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => sessionResponse,
          } as Response;
        }

        return {
          ok: false,
          status: 404,
          json: async () => ({ error: 'Session not found' }),
        } as Response;
      }

      if (url === '/api/questions/question-456') {
        return {
          ok: true,
          status: 200,
          json: async () => questionResponse,
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    render(<SessionPage />);

    expect(await screen.findByText('Collaboration Session')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      await screen.findByText(
        'Taylor has closed the session. Any further edits will not be saved.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Session unavailable')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Taylor.*Disconnected/i }),
    ).toBeInTheDocument();
  });

  it('ignores transient polling failures and keeps the session active', async () => {
    let sessionRequestCount = 0;

    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === '/api/sessions/session-123') {
        sessionRequestCount += 1;

        if (sessionRequestCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => sessionResponse,
          } as Response;
        }

        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        } as Response;
      }

      if (url === '/api/questions/question-456') {
        return {
          ok: true,
          status: 200,
          json: async () => questionResponse,
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    render(<SessionPage />);

    expect(await screen.findByText('Collaboration Session')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    expect(
      screen.queryByText(
        'Taylor has closed the session. Any further edits will not be saved.',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Taylor.*Connected/i })).toBeInTheDocument();
  });
});
