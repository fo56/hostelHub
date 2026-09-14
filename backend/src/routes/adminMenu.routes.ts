import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import {
  getVotingStats,
  generateFinalMenu,
  getMenuPreview,
  publishMenu,
  updateMenu
} from '../controllers/adminMenu.controller';

const router = express.Router();

router.use(verifyToken, requireRole('ADMIN'));

router.get('/voting/stats', getVotingStats);
router.post('/generate', generateFinalMenu);
router.get('/preview', getMenuPreview);
router.post('/publish', publishMenu);
router.put('/update', updateMenu);

export default router;