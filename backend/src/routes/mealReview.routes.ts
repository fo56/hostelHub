import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { submitMealReview } from '../controllers/mealReview.controller';

const router = express.Router();

// Student submits meal review
router.post(
  '/',
  verifyToken,
  requireRole('STUDENT'),
  submitMealReview
);

export default router;
