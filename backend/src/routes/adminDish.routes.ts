import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { requirePermission } from '../middlewares/requirePermission.middleware';
import {
  fetchDishes,
  approveDish,
  rejectDish,
  updateDish,
  deleteDish,
  toggleDishStatus
} from '../controllers/adminDish.controller';
import { createAdminDish } from '../controllers/dish.controller';

const router = express.Router();

router.use(verifyToken, requireRole('ADMIN'));

// GET /api/admin/dishes?status=ACTIVE | UNDER_REVIEW
router.get('/', requirePermission('MANAGE_MENU'), fetchDishes);

// POST /api/admin/dishes (Admin suggest/create dish)
router.post('/', requirePermission('MANAGE_MENU'), createAdminDish);

// POST /api/admin/dishes/:id/approve
router.post('/:id/approve', requirePermission('MANAGE_MENU'), approveDish);

// POST /api/admin/dishes/:id/reject
router.post('/:id/reject', requirePermission('MANAGE_MENU'), rejectDish);
// PUT /api/admin/dishes/:id
router.put('/:id', requirePermission('MANAGE_MENU'), updateDish);

// PATCH /api/admin/dishes/:id/toggle-status
router.patch('/:id/toggle-status', requirePermission('MANAGE_MENU'), toggleDishStatus);

// DELETE /api/admin/dishes/:id
router.delete('/:id', requirePermission('MANAGE_MENU'), deleteDish);

export default router;