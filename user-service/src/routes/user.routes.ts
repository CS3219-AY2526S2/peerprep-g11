import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { getAllUsers, getMe, deleteUser } from '../controllers/user.controller';

const router = Router();

router.get('/me', authenticate, getMe);
router.get('/', authenticate, requireAdmin, getAllUsers);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
