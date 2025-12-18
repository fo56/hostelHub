import express from 'express';

import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import {
  fetchDishes,
  approveDish,
  rejectDish
} from '../controllers/adminDish.controller';

const router = express.Router();

// GET /api/admin/dishes?status=UNDER_REVIEW
router.get(
  '/dishes',
  verifyToken,
  requireRole('ADMIN'),
  fetchDishes
);

// POST /api/admin/dishes/:id/approve
router.post(
  '/dishes/:id/approve',
  verifyToken,
  requireRole('ADMIN'),
  approveDish
);

// POST /api/admin/dishes/:id/reject
router.post(
  '/dishes/:id/reject',
  verifyToken,
  requireRole('ADMIN'),
  rejectDish
);

export default router;
