import express from 'express';
import { submitMealReview } from '../controllers/mealReview.controller';

const router = express.Router();

// Maps to POST /api/reviews/submit
router.post('/submit', submitMealReview);

export default router;