// TODO: Replace this mock implementation with an actual collaboration service
// session lookup when the backend session flow is available.

import { NextResponse } from 'next/server';
import type { SessionDetails } from '@/app/sessions/[sessionId]/types';
import { PROGRAMMING_LANGUAGES } from '@/lib/programming-languages';

const MOCK_SESSIONS: Record<string, Omit<SessionDetails, 'sessionId'>> = {
  'mock-match-001': {
    questionId: 'q2',
    status: 'active',
    selectedLanguage: 'python',
    allowedLanguages: [...PROGRAMMING_LANGUAGES],
    starterCode: {
      javascript: `function networkDelayTime(times, n, k) {
}
`,
      python: `def network_delay_time(times, n, k):
    pass
`,
      java: `import java.util.*;

class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
    }
}
`,
    },
    participants: [
      {
        id: 'user-current',
        username: 'Current User',
        isCurrentUser: true,
        presence: 'connected',
      },
      {
        id: 'user-partner',
        username: 'Alex P.',
        isCurrentUser: false,
        presence: 'connected',
      },
    ],
  },
  'mock-match-002': {
    questionId: 'q3',
    status: 'active',
    selectedLanguage: 'javascript',
    allowedLanguages: [...PROGRAMMING_LANGUAGES],
    starterCode: {
      javascript: `function lengthOfLIS(nums) {
}
`,
      python: `def length_of_lis(nums):
    pass
`,
      java: `class Solution {
    public int lengthOfLIS(int[] nums) {
    }
}
`,
    },
    participants: [
      {
        id: 'user-current',
        username: 'Current User',
        isCurrentUser: true,
        presence: 'connected',
      },
      {
        id: 'user-partner',
        username: 'Taylor G.',
        isCurrentUser: false,
        presence: 'disconnected',
      },
    ],
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const mockSession = MOCK_SESSIONS[sessionId];

    if (!mockSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      sessionId,
      ...mockSession,
    } satisfies SessionDetails);
  } catch {
    return NextResponse.json(
      { error: 'Collaboration session service unavailable' },
      { status: 503 }
    );
  }
}
