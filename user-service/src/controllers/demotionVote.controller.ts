import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { DemotionVote } from '../models/DemotionVote';
import { User } from '../models/User';

function expireIfNeeded(vote: any) {
  if (vote.status === 'active' && vote.expiresAt < new Date()) {
    vote.status = 'expired';
    vote.save();
  }
  return vote;
}

export async function createDemotionVote(req: AuthRequest, res: Response): Promise<void> {
  try {
    const initiatorId = req.user!.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'targetUserId is required' });
      return;
    }

    if (targetUserId === initiatorId) {
      res.status(400).json({ error: 'You cannot start a demotion vote against yourself' });
      return;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    if (targetUser.role !== 'admin') {
      res.status(400).json({ error: 'Target user is not an admin' });
      return;
    }

    // Check for existing active vote against this target
    const existing = await DemotionVote.findOne({ targetUserId, status: 'active' });
    if (existing) {
      expireIfNeeded(existing);
      if (existing.status === 'active') {
        res.status(409).json({ error: 'An active demotion vote already exists for this user' });
        return;
      }
    }

    // Calculate required votes: majority of admins excluding the target
    const adminCount = await User.countDocuments({ role: 'admin' });
    const eligibleVoters = adminCount - 1; // exclude target
    const requiredVotes = Math.floor(eligibleVoters / 2) + 1;

    if (eligibleVoters < 1) {
      res.status(400).json({ error: 'Not enough admins to hold a vote' });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const vote = await DemotionVote.create({
      targetUserId,
      initiatorId,
      requiredVotes,
      expiresAt,
      votes: [{ voterId: initiatorId, vote: 'yes', votedAt: new Date() }],
    });

    await resolveVote(vote);

    // Reload to get populated fields and updated status
    const createdVote = await DemotionVote.findById(vote._id)
      .populate('targetUserId', 'username email')
      .populate('initiatorId', 'username email')
      .populate('votes.voterId', 'username email');

    res.status(201).json(createdVote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDemotionVotes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const votes = await DemotionVote.find({ status: 'active' })
      .populate('targetUserId', 'username email')
      .populate('initiatorId', 'username email')
      .populate('votes.voterId', 'username email')
      .sort({ createdAt: -1 });

    // Lazy-expire
    const result = votes.map(expireIfNeeded);

    res.json(result.filter((v: any) => v.status === 'active'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function resolveVote(vote: any): Promise<void> {
  const yesCount = vote.votes.filter((v: any) => v.vote === 'yes').length;
  const noCount = vote.votes.filter((v: any) => v.vote === 'no').length;

  // Count current eligible voters (admins minus target)
  const adminCount = await User.countDocuments({ role: 'admin' });
  const eligibleVoters = adminCount - 1;

  if (yesCount >= vote.requiredVotes) {
    vote.status = 'approved';
    await vote.save();

    // Demote the target and invalidate their token
    await User.findByIdAndUpdate(vote.targetUserId, {
      role: 'user',
      tokenInvalidatedAt: new Date(),
    });
    return;
  }

  // If enough 'no' votes that 'yes' can never reach threshold
  const remainingVoters = eligibleVoters - yesCount - noCount;
  if (yesCount + remainingVoters < vote.requiredVotes) {
    vote.status = 'rejected';
    await vote.save();
    return;
  }
}

export async function castVote(req: AuthRequest, res: Response): Promise<void> {
  try {
    const voterId = req.user!.id;
    const { id } = req.params;
    const { vote } = req.body;

    if (!['yes', 'no'].includes(vote)) {
      res.status(400).json({ error: 'Vote must be "yes" or "no"' });
      return;
    }

    const demotionVote = await DemotionVote.findById(id);
    if (!demotionVote) {
      res.status(404).json({ error: 'Demotion vote not found' });
      return;
    }

    expireIfNeeded(demotionVote);
    if (demotionVote.status !== 'active') {
      res.status(400).json({ error: 'This vote is no longer active' });
      return;
    }

    // Target cannot vote
    if (demotionVote.targetUserId.toString() === voterId) {
      res.status(403).json({ error: 'You cannot vote on your own demotion' });
      return;
    }

    // Update or insert vote
    const existingIdx = demotionVote.votes.findIndex(
      (v) => v.voterId.toString() === voterId
    );
    if (existingIdx >= 0) {
      demotionVote.votes[existingIdx].vote = vote;
      demotionVote.votes[existingIdx].votedAt = new Date();
    } else {
      demotionVote.votes.push({ voterId: voterId as any, vote, votedAt: new Date() });
    }

    await demotionVote.save();
    await resolveVote(demotionVote);

    // Reload to get final state
    const updated = await DemotionVote.findById(id)
      .populate('targetUserId', 'username email')
      .populate('initiatorId', 'username email')
      .populate('votes.voterId', 'username email');

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function withdrawVote(req: AuthRequest, res: Response): Promise<void> {
  try {
    const voterId = req.user!.id;
    const { id } = req.params;

    const demotionVote = await DemotionVote.findById(id);
    if (!demotionVote) {
      res.status(404).json({ error: 'Demotion vote not found' });
      return;
    }

    expireIfNeeded(demotionVote);
    if (demotionVote.status !== 'active') {
      res.status(400).json({ error: 'This vote is no longer active' });
      return;
    }

    const existingIdx = demotionVote.votes.findIndex(
      (v) => v.voterId.toString() === voterId
    );
    if (existingIdx < 0) {
      res.status(400).json({ error: 'You have not voted on this' });
      return;
    }

    demotionVote.votes.splice(existingIdx, 1);
    await demotionVote.save();
    await resolveVote(demotionVote);

    const updated = await DemotionVote.findById(id)
      .populate('targetUserId', 'username email')
      .populate('initiatorId', 'username email')
      .populate('votes.voterId', 'username email');

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
