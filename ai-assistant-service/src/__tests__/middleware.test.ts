import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

process.env.JWT_SECRET = 'test_secret';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function makeToken(payload: object, secret = 'test_secret') {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

// ---------------------------------------------------------------------------
// authenticate middleware
// ---------------------------------------------------------------------------
describe('authenticate middleware', () => {
  it('calls next() and populates req.user when a valid Bearer token is provided', () => {
    const payload = { id: 'abc123', email: 'user@example.com', role: 'user' };
    const token = makeToken(payload);

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject(payload);
  });

  it('calls next() when a valid token is provided via cookie', () => {
    const payload = { id: 'abc123', email: 'user@example.com', role: 'user' };
    const token = makeToken(payload);

    const req = {
      headers: {},
      cookies: { token },
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject(payload);
  });

  it('prefers the Authorization header over the cookie', () => {
    const headerPayload = { id: 'header-id', email: 'header@example.com', role: 'admin' };
    const cookiePayload = { id: 'cookie-id', email: 'cookie@example.com', role: 'user' };

    const req = {
      headers: { authorization: `Bearer ${makeToken(headerPayload)}` },
      cookies: { token: makeToken(cookiePayload) },
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user!.id).toBe('header-id');
  });

  it('returns 401 when no token is provided', () => {
    const req = { headers: {}, cookies: {} } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Unauthorized' }));
  });

  it('returns 401 when the token is signed with the wrong secret', () => {
    const token = makeToken({ id: 'x', email: 'x@x.com', role: 'user' }, 'wrong_secret');

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid or expired token' })
    );
  });

  it('returns 401 when the token is expired', () => {
    const token = jwt.sign(
      { id: 'x', email: 'x@x.com', role: 'user' },
      'test_secret',
      { expiresIn: -1 } // already expired
    );

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when the token is malformed', () => {
    const req = {
      headers: { authorization: 'Bearer not.a.valid.jwt' },
      cookies: {},
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ---------------------------------------------------------------------------
// requireAdmin middleware
// ---------------------------------------------------------------------------
describe('requireAdmin middleware', () => {
  it('calls next() when the user has the admin role', () => {
    const req = {
      user: { id: '1', email: 'admin@example.com', role: 'admin' },
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when the user has the user role', () => {
    const req = {
      user: { id: '2', email: 'user@example.com', role: 'user' },
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Forbidden' }));
  });

  it('returns 403 when req.user is undefined', () => {
    const req = { user: undefined } as unknown as AuthRequest;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
