import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUser,
  deactivateUser,
  reactivateUser,
  deleteUser,
  regenerateQRCode,
  regenerateLoginToken,
} from '../controllers/adminUser.controller';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';

const router = Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('ADMIN'));

// Create user
router.post('/', createUser);

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

// Regenerate QR code
router.post('/:userId/qr-code', regenerateQRCode);

// Regenerate login token
router.post('/:userId/login-token', regenerateLoginToken);

export default router;
