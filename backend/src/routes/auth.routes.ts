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

// Protected routes (Logout should be accessible even if token is expired to clear cookies)
router.post('/logout', logout);

export default router;
