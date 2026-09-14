import { Router } from 'express';
import {
  registerAdmin,
  login,
  refresh,
  logout
} from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/verifyToken.middleware';

const router = Router();

// Public routes
router.post('/admin/register', registerAdmin);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', verifyToken, logout);

export default router;
