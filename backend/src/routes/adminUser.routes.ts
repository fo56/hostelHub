import { Router } from 'express';
import {
  createUser,
  bulkCreateUsers,
  getUsers,
  getUser,
  deactivateUser,
  reactivateUser,
  deleteUser,
} from '../controllers/adminUser.controller';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';

const router = Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('ADMIN'));

// Create user
router.post('/', createUser);

// Bulk create users
router.post('/bulk', bulkCreateUsers);

// Get all users
router.get('/', getUsers);

// Get single user
router.get('/:userId', getUser);

// Deactivate user
router.patch('/:userId/deactivate', deactivateUser);

// Reactivate user
router.patch('/:userId/reactivate', reactivateUser);

// Delete user
router.delete('/:userId', deleteUser);

// Deleted setup url regeneration

export default router;
