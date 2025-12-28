import express from 'express';
import { ensureVotingOpen } from '../middlewares/ensureVotingOpen.middleware';
import { submitMenuVotes } from '../controllers/menuVote.controller';

const router = express.Router();

router.post(
  '/vote',
  ensureVotingOpen,
  submitMenuVotes
);

export default router;
