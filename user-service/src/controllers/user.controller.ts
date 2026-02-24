import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authenticate';

export async function getAllUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id, '-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id, '-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { username, password } = req.body;

    if (!username && !password) {
      res.status(400).json({ error: 'Nothing to update' });
      return;
    }

    if (username) {
      user.username = username;
    }

    if (password) {
      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }

      user.password = password;
    }

    await user.save();

    res.json({ message: 'User updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
