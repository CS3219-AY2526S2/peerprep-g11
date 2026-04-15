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

describe('PUT /api/admin/questions/[questionSlug]', () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it('updates the current question by slug', async () => {
    const { PUT } = await import('@/app/api/admin/questions/[questionSlug]/route');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Question updated.',
        title: 'Palindrome Number',
        slug: 'palindrome-number',
      }),
    } as Response);

    const request = {
      json: async () => ({
        title: 'Palindrome Number',
        description: 'Determine whether an integer is a palindrome.',
        difficulty: 'Easy',
        topics: ['Math'],
        constraints: ['-2^31 <= x <= 2^31 - 1'],
        examples: [{ input: '121', output: 'true', explanation: 'Reads the same backwards.' }],
      }),
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

    const response = await PUT(request as never, {
      params: Promise.resolve({ questionSlug: 'two-sum' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: 'Question updated.',
      title: 'Palindrome Number',
      slug: 'palindrome-number',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/questions/two-sum',
      expect.objectContaining({
        method: 'PUT',
      })
    );
  });

  it('surfaces FastAPI validation messages from the question service', async () => {
    const { PUT } = await import('@/app/api/admin/questions/[questionSlug]/route');

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [{ msg: 'Title contains unsupported characters' }],
      }),
    } as Response);

    const request = {
      json: async () => ({
        title: 'Palindrome Number #1',
        description: 'desc',
        difficulty: 'Easy',
        topics: ['Math'],
        constraints: ['constraint'],
        examples: [{ input: '1', output: '1' }],
      }),
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

    const response = await PUT(request as never, {
      params: Promise.resolve({ questionSlug: 'two-sum' }),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: 'Title contains unsupported characters',
    });
  });
});
