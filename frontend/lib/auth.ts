export enum Role {
    ADMIN = 'admin',
    USER = 'user'
}

// Browser fetches send cookies directly; server routes forward incoming auth headers.
export async function fetchWithAuth(
    path: string,
    init: RequestInit ={}
): Promise<Response> {
    return fetch(path, {
        ...init,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...init.headers,
        }
    });
}

export function forwardAuthHeaders(request: Request) {
    return {
      Cookie: request.headers.get('cookie') ?? '',
      Authorization: request.headers.get('authorization') ?? '',
    };
  }
