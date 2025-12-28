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
  '/',
  fetchDishes
);

// POST /api/admin/dishes/:id/approve
router.post(
  '/:id/approve',
  approveDish
);

// POST /api/admin/dishes/:id/reject
router.post(
  '/:id/reject',
  rejectDish
);

export default router;
