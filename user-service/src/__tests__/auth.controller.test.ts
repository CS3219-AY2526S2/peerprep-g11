import request from 'supertest';
import app from '../app';

// Set a JWT secret for the test process
process.env.JWT_SECRET = 'test_secret';

const BASE = '/auth';

const validUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password1',
};

// ---------------------------------------------------------------------------
// POST /auth/register
// ---------------------------------------------------------------------------
describe('POST /auth/register', () => {
  it('returns 201 and a user id on valid input', async () => {
    const res = await request(app).post(`${BASE}/register`).send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.message).toBe('User registered');
  });

  it('returns 409 when the email is already registered', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const res = await request(app).post(`${BASE}/register`).send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ username: 'u', password: 'Password1' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ username: 'u', email: 'u@example.com' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...validUser, password: 'Short1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  it('returns 400 when password has no uppercase letter', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...validUser, password: 'alllowercase1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/uppercase/i);
  });

  it('returns 400 when email format is invalid', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...validUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid email/i);
  });
});

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
  });

  it('returns 200, sets a cookie, and returns a token on valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body).toHaveProperty('token');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@example.com', password: validUser.password });

    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ password: validUser.password });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email });

    expect(res.status).toBe(400);
  });

  it('returns the correct role in the response body', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });

    expect(res.body.role).toBe('user');
  });
});

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------
describe('POST /auth/logout', () => {
  it('returns 200 and clears the token cookie', async () => {
    const res = await request(app).post(`${BASE}/logout`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out');

    // The Set-Cookie header should clear the token (maxAge=0 or Expires in the past)
    const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toMatch(/token=;|Max-Age=0|Expires=/i);
  });
});
