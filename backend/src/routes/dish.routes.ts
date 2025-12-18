import express from 'express';

import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { dishSuggestionRateLimit } from '../middlewares/dishRateLimit.middleware';
import { suggestDish } from '../controllers/dish.controller';

const router = express.Router();

router.post(
  '/suggest',
  verifyToken,
  requireRole('STUDENT'),
  dishSuggestionRateLimit,
  suggestDish
);

export default router;
