// routes/adminMenu.routes.ts
import express from 'express';

import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';

import {
  openVotingWindow,closeVotingWindow, getVotingStatus, generateFinalMenu, getMenuPreview, publishMenu
} from '../controllers/adminMenu.controller';

const router = express.Router();

// Admin opens voting for a week (time-bound)
router.post(
  '/voting/open',
  verifyToken,
  requireRole('ADMIN'),
  openVotingWindow
);

// Admin manually closes voting
router.post(
  '/voting/close',
  verifyToken,
  requireRole('ADMIN'),
  closeVotingWindow
);

// admin checks if voting is open or closed
router.get(
  '/voting/status',
  verifyToken,
  requireRole('ADMIN'),
  getVotingStatus
);

router.post(
  '/generate',
  verifyToken,
  requireRole('ADMIN'),
  generateFinalMenu
);
// GET preview
router.get(
  '/preview',
  verifyToken,
  requireRole('ADMIN'),
  getMenuPreview
);

// POST publish
router.post(
  '/publish',
  verifyToken,
  requireRole('ADMIN'),
  publishMenu
);

export default router;
