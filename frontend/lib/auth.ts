export enum Role {
    ADMIN = 'admin',
    USER = 'user'
}

// Keeps browser auth logic separate from server forwarding logic, hence split into two functions
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