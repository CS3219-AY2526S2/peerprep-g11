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

describe('GET /api/history', () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it('forwards pagination params to question-service and returns the paginated payload', async () => {
    const { GET } = await import('@/app/api/history/route');

    const payload = {
      data: [
        {
          _id: 'hist_001',
          partner_id: 'user_abc123',
          partner_username: 'Priya',
          question: {
            id: 'q1',
            title: 'Two Sum',
            description: 'Prompt',
            topics: ['Arrays'],
            difficulty: 'Easy',
            status: 'Completed',
            examples: [],
            constraints: [],
          },
          timestamp: '2026-04-14T08:00:00.000Z',
        },
      ],
      total: 12,
      page: 2,
      pageSize: 5,
      totalPages: 3,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    } as Response);

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('user_id=user-123&page=2&pageSize=5'),
      },
      headers: {
        get(name: string) {
          if (name.toLowerCase() === 'cookie') {
            return 'token=token-123';
          }

          if (name.toLowerCase() === 'authorization') {
            return 'Bearer token-123';
          }

          return null;
        },
      },
    } as unknown as Request;

    const response = await GET(request as never);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/history/list?user_id=user-123&page=2&size=5',
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: 'token=token-123',
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
  });
});
