import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { AdminRequest } from '../models/AdminRequest';
import { User } from '../models/User';

export async function createAdminRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.role === 'admin') {
      res.status(400).json({ error: 'You are already an admin' });
      return;
    }

    const existing = await AdminRequest.findOne({ userId, status: 'pending' });
    if (existing) {
      res.status(409).json({ error: 'You already have a pending request' });
      return;
    }

    const request = await AdminRequest.create({ userId });
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllAdminRequests(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const requests = await AdminRequest.find({ status: 'pending' })
      .populate('userId', 'username email')
      .sort({ createdAt: 1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAdminRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
      return;
    }

    const adminRequest = await AdminRequest.findById(id);
    if (!adminRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (adminRequest.status !== 'pending') {
      res.status(400).json({ error: 'Request has already been processed' });
      return;
    }

    adminRequest.status = status;
    await adminRequest.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(adminRequest.userId, { role: 'admin' });
    }

    res.json(adminRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyAdminRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const request = await AdminRequest.findOne({ userId, status: 'pending' });
    res.json({ hasPending: !!request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
