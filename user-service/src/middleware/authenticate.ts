import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
      iat?: number;
    };

    // Check if token was issued before a forced invalidation
    if (payload.iat) {
      const user = await User.findById(payload.id).select('tokenInvalidatedAt').lean();
      if (user?.tokenInvalidatedAt) {
        const invalidatedAtSec = Math.floor(new Date(user.tokenInvalidatedAt).getTime() / 1000);
        if (payload.iat < invalidatedAtSec) {
          res.status(401).json({ error: 'Invalid or expired token' });
          return;
        }
      }
    }

    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
