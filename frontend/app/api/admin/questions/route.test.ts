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

jest.mock('@/lib/server-auth', () => ({
  getCurrentServerUser: jest.fn().mockResolvedValue({
    id: 'admin-1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
  }),
}));

describe('GET /api/admin/questions', () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it('checks duplicates against the paginated question-service response', async () => {
    const { GET } = await import('@/app/api/admin/questions/route');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ title: 'Another Question', slug: 'another-question' }],
          totalPages: 2,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ title: 'Two Sum', slug: 'two-sum' }],
          totalPages: 2,
        }),
      } as Response);

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('title=Two Sum'),
      },
      cookies: {
        get(name: string) {
          if (name === 'token') {
            return { value: 'token-123' };
          }

          return undefined;
        },
      },
      headers: {
        get(name: string) {
          if (name.toLowerCase() === 'cookie') {
            return 'token=token-123';
          }

          return null;
        },
      },
    } as unknown as Request;

    const response = await GET(request as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      exists: true,
      matchedQuestion: {
        title: 'Two Sum',
        slug: 'two-sum',
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8000/questions?search=Two+Sum&page=1&size=100'
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'http://localhost:8000/questions?search=Two+Sum&page=2&size=100'
    );
  });
});
