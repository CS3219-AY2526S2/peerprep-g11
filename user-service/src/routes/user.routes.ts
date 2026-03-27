import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import {
  getAllUsers,
  getMe,
  deleteUser,
  updateUser,
  updateOnboardingPreference,
} from '../controllers/user.controller';
import {
  createAdminRequest,
  getAllAdminRequests,
  updateAdminRequest,
  getMyAdminRequest,
} from '../controllers/adminRequest.controller';
import {
  createDemotionVote,
  getDemotionVotes,
  castVote,
  withdrawVote,
} from '../controllers/demotionVote.controller';

const router = Router();

router.get('/me', authenticate, getMe);
router.get('/', authenticate, requireAdmin, getAllUsers);
router.put('/profile', authenticate, updateUser);
router.patch('/onboarding-preference', authenticate, updateOnboardingPreference);

router.post('/admin-requests', authenticate, createAdminRequest);
router.get('/admin-requests/mine', authenticate, getMyAdminRequest);
router.get('/admin-requests', authenticate, requireAdmin, getAllAdminRequests);
router.put('/admin-requests/:id', authenticate, requireAdmin, updateAdminRequest);

router.post('/demotion-votes', authenticate, requireAdmin, createDemotionVote);
router.get('/demotion-votes', authenticate, requireAdmin, getDemotionVotes);
router.post('/demotion-votes/:id/vote', authenticate, requireAdmin, castVote);
router.delete('/demotion-votes/:id/vote', authenticate, requireAdmin, withdrawVote);

router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
