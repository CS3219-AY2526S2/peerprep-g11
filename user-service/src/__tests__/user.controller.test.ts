import request from 'supertest';
import app from '../app';

process.env.JWT_SECRET = 'test_secret';

const AUTH = '/auth';
const USERS = '/users';

const alice = { username: 'alice', email: 'alice@example.com', password: 'Password1' };
const bob = { username: 'bob', email: 'bob@example.com', password: 'Password1' };

/** Register a user and return their Bearer token. */
async function registerAndLogin(creds: typeof alice): Promise<string> {
  await request(app).post(`${AUTH}/register`).send(creds);
  const res = await request(app)
    .post(`${AUTH}/login`)
    .send({ email: creds.email, password: creds.password });
  return res.body.token as string;
}

// ---------------------------------------------------------------------------
// GET /users/me
// ---------------------------------------------------------------------------
describe('GET /users/me', () => {
  it('returns the authenticated user profile', async () => {
    const token = await registerAndLogin(alice);

    const res = await request(app)
      .get(`${USERS}/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(alice.email);
    expect(res.body.username).toBe(alice.username);
    expect(res.body).not.toHaveProperty('password');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get(`${USERS}/me`);
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get(`${USERS}/me`)
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /users/profile
// ---------------------------------------------------------------------------
describe('PUT /users/profile', () => {
  it('updates the username successfully', async () => {
    const token = await registerAndLogin(alice);

    const res = await request(app)
      .put(`${USERS}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'alice_updated' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User updated');

    // Verify the change persisted
    const me = await request(app)
      .get(`${USERS}/me`)
      .set('Authorization', `Bearer ${token}`);
    expect(me.body.username).toBe('alice_updated');
  });

  it('updates the password and allows login with the new password', async () => {
    const token = await registerAndLogin(alice);

    await request(app)
      .put(`${USERS}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: alice.username, password: 'NewPassword1' });

    // Old password no longer works
    const oldLogin = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: alice.email, password: alice.password });
    expect(oldLogin.status).toBe(401);

    // New password works
    const newLogin = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: alice.email, password: 'NewPassword1' });
    expect(newLogin.status).toBe(200);
  });

  it('returns 400 when neither username nor password is provided', async () => {
    const token = await registerAndLogin(alice);

    const res = await request(app)
      .put(`${USERS}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nothing to update/i);
  });

  it('returns 400 when new password is too short', async () => {
    const token = await registerAndLogin(alice);

    const res = await request(app)
      .put(`${USERS}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'Short1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .put(`${USERS}/profile`)
      .send({ username: 'hacker' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /users  (admin only)
// ---------------------------------------------------------------------------
describe('GET /users', () => {
  it('returns all users for an admin', async () => {
    // Register a normal user first
    await request(app).post(`${AUTH}/register`).send(alice);

    // Seed an admin directly via the model so we can control role
    const { User } = await import('../models/User');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin1234!',
      role: 'admin',
    });

    const loginRes = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: admin.email, password: 'Admin1234!' });
    const adminToken = loginRes.body.token as string;

    const res = await request(app)
      .get(`${USERS}/`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    // Passwords must never be returned
    res.body.forEach((u: Record<string, unknown>) => {
      expect(u).not.toHaveProperty('password');
    });
  });

  it('returns 403 for a regular user', async () => {
    const token = await registerAndLogin(alice);

    const res = await request(app)
      .get(`${USERS}/`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get(`${USERS}/`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /users/:id  (admin only)
// ---------------------------------------------------------------------------
describe('DELETE /users/:id', () => {
  it('allows an admin to delete another user', async () => {
    await request(app).post(`${AUTH}/register`).send(bob);

    const { User } = await import('../models/User');
    const bobUser = await User.findOne({ email: bob.email });

    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin1234!',
      role: 'admin',
    });
    const loginRes = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: admin.email, password: 'Admin1234!' });
    const adminToken = loginRes.body.token as string;

    const res = await request(app)
      .delete(`${USERS}/${bobUser!._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User deleted');

    // User should be gone
    const gone = await User.findById(bobUser!._id);
    expect(gone).toBeNull();
  });

  it('returns 404 when the target user does not exist', async () => {
    const { User } = await import('../models/User');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin1234!',
      role: 'admin',
    });
    const loginRes = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: admin.email, password: 'Admin1234!' });
    const adminToken = loginRes.body.token as string;

    const fakeId = '000000000000000000000000';
    const res = await request(app)
      .delete(`${USERS}/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 when a regular user tries to delete someone', async () => {
    const tokenAlice = await registerAndLogin(alice);
    await request(app).post(`${AUTH}/register`).send(bob);

    const { User } = await import('../models/User');
    const bobUser = await User.findOne({ email: bob.email });

    const res = await request(app)
      .delete(`${USERS}/${bobUser!._id}`)
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).delete(`${USERS}/000000000000000000000000`);
    expect(res.status).toBe(401);
  });
});
