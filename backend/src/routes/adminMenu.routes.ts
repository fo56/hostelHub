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
  openVotingWindow
);

// Admin manually closes voting
router.post(
  '/voting/close',
  closeVotingWindow
);

// admin checks if voting is open or closed
router.get(
  '/voting/status',
  getVotingStatus
);

router.post(
  '/generate',
  generateFinalMenu
);
// GET preview
router.get(
  '/preview',
  getMenuPreview
);

// POST publish
router.post(
  '/publish',
  publishMenu
);

export default router;
