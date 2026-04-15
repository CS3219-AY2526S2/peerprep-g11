import 'server-only';

import { Role } from '@/lib/auth';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

export interface ServerAuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
}

interface RawServerAuthUser {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  role?: Role;
}

export async function getCurrentServerUser(
  token: string | undefined
): Promise<ServerAuthUser | null> {
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${USER_SERVICE_URL}/users/me`, {
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as RawServerAuthUser;
    const userId = data.id ?? data._id;

    if (!userId || !data.email || !data.username || !data.role) {
      return null;
    }

    return {
      id: userId,
      email: data.email,
      username: data.username,
      role: data.role,
    };
  } catch {
    return null;
  }
}
