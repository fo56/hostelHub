import { Router } from 'express';
import {
  registerAdmin,
  loginAdmin,
  loginUser,
  generateQRCode,
  loginViaQR,
  loginViaURL,
  setPassword,
  refresh,
  logout
} from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/verifyToken.middleware';

const router = Router();

// Public routes
router.post('/register-admin', registerAdmin);
router.post('/login-admin', loginAdmin);
router.post('/login-user', loginUser);
router.post('/login-qr', loginViaQR);
router.post('/login-url', loginViaURL);
router.post('/set-password', setPassword);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', verifyToken, logout);
router.get('/qr/:userId', verifyToken, generateQRCode);

export default router;
