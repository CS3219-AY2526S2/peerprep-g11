const USER_SERVICE = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:4001';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${USER_SERVICE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return res;
}

export async function apiPost<T>(path: string, body: T, init: RequestInit = {}) {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
    ...init,
  });
}
