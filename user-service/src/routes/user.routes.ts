import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { getAllUsers, getMe, deleteUser, updateUser } from '../controllers/user.controller';
import {
  createAdminRequest,
  getAllAdminRequests,
  updateAdminRequest,
  getMyAdminRequest,
} from '../controllers/adminRequest.controller';

const router = Router();

router.get('/me', authenticate, getMe);
router.get('/', authenticate, requireAdmin, getAllUsers);
router.put('/profile', authenticate, updateUser);

router.post('/admin-requests', authenticate, createAdminRequest);
router.get('/admin-requests/mine', authenticate, getMyAdminRequest);
router.get('/admin-requests', authenticate, requireAdmin, getAllAdminRequests);
router.put('/admin-requests/:id', authenticate, requireAdmin, updateAdminRequest);

router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
