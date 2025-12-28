import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { getMealReviews } from '../controllers/adminReview.controller';

const router = express.Router();

router.get(
  '/',
  getMealReviews
);

export default router;
