export enum Role {
    ADMIN = 'admin',
    USER = 'user'
}

export async function apiFetch(
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