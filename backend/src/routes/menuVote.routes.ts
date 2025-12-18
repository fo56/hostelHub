import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { ensureVotingOpen } from '../middlewares/ensureVotingOpen.middleware';
import { submitMenuVotes } from '../controllers/menuVote.controller';

const router = express.Router();

router.post(
  '/vote',
  verifyToken,
  requireRole('STUDENT'),
  ensureVotingOpen,
  submitMenuVotes
);

export default router;
