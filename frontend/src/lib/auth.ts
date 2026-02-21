import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface SessionPayload {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
