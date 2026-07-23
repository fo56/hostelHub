import express from 'express';
import { dishSuggestionRateLimit } from '../middlewares/dishRateLimit.middleware';
import { suggestDish } from '../controllers/dish.controller';

const router = express.Router();

// Maps to POST /api/dishes/
router.post('/', dishSuggestionRateLimit, suggestDish);

export default router;