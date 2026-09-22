import express from 'express';
import { submitMealReview, getDishReviews } from '../controllers/mealReview.controller';

const router = express.Router();

// Maps to POST /api/reviews/submit
router.post('/submit', submitMealReview);

// Maps to GET /api/reviews/dish/:dishId
router.get('/dish/:dishId', getDishReviews);

export default router;