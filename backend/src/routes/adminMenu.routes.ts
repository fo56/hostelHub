// routes/adminMenu.routes.ts
import express from 'express';

import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';

import {
  openVotingWindow,closeVotingWindow, getVotingStatus
} from '../controllers/adminMenu.controller';

const router = express.Router();

// Admin opens voting for a week (time-bound)
router.post(
  '/menu/voting/open',
  verifyToken,
  requireRole('ADMIN'),
  openVotingWindow
);

// Admin manually closes voting
router.post(
  '/menu/voting/close',
  verifyToken,
  requireRole('ADMIN'),
  closeVotingWindow
);

// admin checks if voting is open or closed
router.get(
  '/menu/voting/status',
  verifyToken,
  requireRole('ADMIN'),
  getVotingStatus
);

export default router;
