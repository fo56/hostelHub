// routes/studentMenu.routes.ts
import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';

import {
  getCurrentMessMenu,
  getMessMenuByWeek,
  getStudentVotingStatus, 
  getServedDishesToday
} from '../controllers/studentMenu.controller';

const router = express.Router();

router.get(
  '/today',
  verifyToken,
  requireRole('STUDENT'),
  getServedDishesToday
);

router.get(
  '/current',
  verifyToken,
  requireRole('STUDENT'),
  getCurrentMessMenu
);

router.get(
  '/voting/status',
  verifyToken,
  requireRole('STUDENT'),
  getStudentVotingStatus
);

router.get(
  '/:week',
  verifyToken,
  requireRole('STUDENT'),
  getMessMenuByWeek
);
export default router;