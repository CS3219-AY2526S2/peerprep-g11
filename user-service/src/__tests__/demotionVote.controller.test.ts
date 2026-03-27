import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { User } from '../models/User';
import { DemotionVote } from '../models/DemotionVote';

process.env.JWT_SECRET = 'test_secret';

function makeToken(payload: object) {
  return jwt.sign(payload, 'test_secret', { expiresIn: '1h' });
}

describe('Demotion Vote API', () => {
  let admin1: any, admin2: any, admin3: any, targetAdmin: any;
  let token1: string, token2: string, token3: string, targetToken: string;

  beforeEach(async () => {
    admin1 = await User.create({ username: 'admin1', email: 'admin1@test.com', password: 'Password1', role: 'admin' });
    admin2 = await User.create({ username: 'admin2', email: 'admin2@test.com', password: 'Password1', role: 'admin' });
    admin3 = await User.create({ username: 'admin3', email: 'admin3@test.com', password: 'Password1', role: 'admin' });
    targetAdmin = await User.create({ username: 'target', email: 'target@test.com', password: 'Password1', role: 'admin' });

    token1 = makeToken({ id: admin1._id.toString(), email: admin1.email, role: 'admin' });
    token2 = makeToken({ id: admin2._id.toString(), email: admin2.email, role: 'admin' });
    token3 = makeToken({ id: admin3._id.toString(), email: admin3.email, role: 'admin' });
    targetToken = makeToken({ id: targetAdmin._id.toString(), email: targetAdmin.email, role: 'admin' });
  });

  describe('POST /users/demotion-votes', () => {
    it('creates a demotion vote and automatically votes yes', async () => {
      const res = await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetUserId: targetAdmin._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('active');
      expect(res.body.requiredVotes).toBe(2); // 4 admins - 1 target = 3 eligible, majority = 2
      expect(res.body.votes.length).toBe(1);
      expect(res.body.votes[0].vote).toBe('yes');
      expect(res.body.votes[0].voterId._id).toBe(admin1._id.toString());
    });

    it('rejects voting against yourself', async () => {
      const res = await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetUserId: admin1._id.toString() });

      expect(res.status).toBe(400);
    });

    it('rejects duplicate active votes', async () => {
      await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetUserId: targetAdmin._id.toString() });

      const res = await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token2}`)
        .send({ targetUserId: targetAdmin._id.toString() });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /users/demotion-votes/:id/vote', () => {
    it('casts a vote and triggers demotion on majority', async () => {
      const createRes = await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetUserId: targetAdmin._id.toString() });

      const voteId = createRes.body._id;

      // Second yes vote — should trigger demotion (2 of 3 eligible)
      // First yes vote was already cast by admin1 upon creation
      const res = await request(app)
        .post(`/users/demotion-votes/${voteId}/vote`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ vote: 'yes' });

      expect(res.body.status).toBe('approved');

      // Verify target is demoted
      const demotedUser = await User.findById(targetAdmin._id);
      expect(demotedUser!.role).toBe('user');
      expect(demotedUser!.tokenInvalidatedAt).toBeDefined();
    });

    it('prevents target from voting', async () => {
      const createRes = await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetUserId: targetAdmin._id.toString() });

      const res = await request(app)
        .post(`/users/demotion-votes/${createRes.body._id}/vote`)
        .set('Authorization', `Bearer ${targetToken}`)
        .send({ vote: 'no' });

      expect(res.status).toBe(403);
    });

    it('allows changing a vote', async () => {
      const createRes = await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetUserId: targetAdmin._id.toString() });

      const voteId = createRes.body._id;

      await request(app)
        .post(`/users/demotion-votes/${voteId}/vote`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ vote: 'yes' });

      const res = await request(app)
        .post(`/users/demotion-votes/${voteId}/vote`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ vote: 'no' });

      expect(res.status).toBe(200);
      const voterVote = res.body.votes.find((v: any) => v.voterId._id === admin1._id.toString());
      expect(voterVote.vote).toBe('no');
    });
  });

  describe('DELETE /users/demotion-votes/:id/vote', () => {
    it('withdraws a vote', async () => {
      const createRes = await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetUserId: targetAdmin._id.toString() });

      const voteId = createRes.body._id;

      const res = await request(app)
        .delete(`/users/demotion-votes/${voteId}/vote`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.votes.length).toBe(0);
    });
  });

  describe('auto-rejection', () => {
    it('auto-rejects when yes can no longer reach threshold', async () => {
      const createRes = await request(app)
        .post('/users/demotion-votes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetUserId: targetAdmin._id.toString() });

      const voteId = createRes.body._id;

      // Initiator (admin1) already voted yes, let's change it to no
      await request(app)
        .post(`/users/demotion-votes/${voteId}/vote`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ vote: 'no' });

      // Second no vote — should trigger rejection (0 yes + 1 remaining < 2 required)
      const res = await request(app)
        .post(`/users/demotion-votes/${voteId}/vote`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ vote: 'no' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');
    });
  });
});
