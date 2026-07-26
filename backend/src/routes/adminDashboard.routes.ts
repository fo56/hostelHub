import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { getDashboardStats } from '../controllers/adminDashboard.controller';

const router = express.Router();

router.use(verifyToken, requireRole('ADMIN'));

// GET /api/admin/dashboard
router.get('/', getDashboardStats);

export default router;
