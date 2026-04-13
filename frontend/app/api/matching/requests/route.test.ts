import { fetchMock, resetFetchMock } from '@/test-utils/fetch';

jest.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json(data: unknown, init?: { status?: number }) {
      return {
        status: init?.status ?? 200,
        json: async () => data,
      };
    },
  },
}));

describe('POST /api/matching/requests', () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it('forwards structured conflict reasons from the matching service', async () => {
    const { POST } = await import('@/app/api/matching/requests/route');

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          error: 'You are already in the matching queue.',
          reason: 'ALREADY_IN_QUEUE',
        }),
    } as Response);

    const request = {
      json: async () => ({
        topic: 'Arrays',
        difficulty: 'Medium',
        language: 'python',
      }),
      headers: {
        get(name: string) {
          if (name.toLowerCase() === 'cookie') {
            return 'token=abc';
          }

          return null;
        },
      },
    } as Request;

    const response = await POST(
      request
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'You are already in the matching queue.',
      reason: 'ALREADY_IN_QUEUE',
    });
  });

  it('forwards an existing match id when the user is already in a session', async () => {
    const { POST } = await import('@/app/api/matching/requests/route');

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          error: 'You are already in a session.',
          reason: 'ALREADY_IN_SESSION',
          matchId: 'match-123',
        }),
    } as Response);

    const request = {
      json: async () => ({
        topic: 'Arrays',
        difficulty: 'Medium',
        language: 'python',
      }),
      headers: {
        get(name: string) {
          if (name.toLowerCase() === 'cookie') {
            return 'token=abc';
          }

          return null;
        },
      },
    } as Request;

    const response = await POST(request);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'You are already in a session.',
      reason: 'ALREADY_IN_SESSION',
      matchId: 'match-123',
    });
  });
});
