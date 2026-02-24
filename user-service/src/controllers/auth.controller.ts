import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address' });
      return;
    }

    const passwordUppercaseValid = /[A-Z]/.test(password);
    if (password.length < 8 || !passwordUppercaseValid) {
      res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain an uppercase letter' 
      });
      return;
    }

    const user = await User.create({ username, email, password });
    res.status(201).json({ message: 'User registered', id: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const secret = process.env.JWT_SECRET!;
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      secret,
      { expiresIn }
    );

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ message: 'Login successful', role: user.role, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}
