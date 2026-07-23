import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import {
  fetchDishes,
  approveDish,
  rejectDish
} from '../controllers/adminDish.controller';
import { createAdminDish } from '../controllers/dish.controller';

const router = express.Router();

router.use(verifyToken, requireRole('ADMIN'));

// GET /api/admin/dishes?status=ACTIVE | UNDER_REVIEW
router.get('/', fetchDishes);

// POST /api/admin/dishes (Admin suggest/create dish)
router.post('/', createAdminDish);

// POST /api/admin/dishes/:id/approve
router.post('/:id/approve', approveDish);

// POST /api/admin/dishes/:id/reject
router.post('/:id/reject', rejectDish);

export default router;