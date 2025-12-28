import express from 'express';
import { submitMealReview } from '../controllers/mealReview.controller';

const router = express.Router();

// Student submits meal review
router.post(
  '/',
  submitMealReview
);

export default router;
