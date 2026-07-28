import express from 'express';
import { getMealReviews, getReviewStats } from '../controllers/adminReview.controller';

const router = express.Router();

router.get(
  '/stats',
  getReviewStats
);

router.get(
  '/',
  getMealReviews
);

export default router;
