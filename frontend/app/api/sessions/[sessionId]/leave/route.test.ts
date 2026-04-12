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

describe('POST /api/sessions/[sessionId]/leave', () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it('treats an already-deleted collaboration session as a successful leave', async () => {
    const { POST } = await import('@/app/api/sessions/[sessionId]/leave/route');

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Session not found' }),
    } as Response);

    const response = await POST({} as Request, {
      params: Promise.resolve({ sessionId: 'session-123' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: 'session-123',
      status: 'left',
      redirectTo: '/dashboard',
    });
  });
});
