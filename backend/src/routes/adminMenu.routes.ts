import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { requirePermission } from '../middlewares/requirePermission.middleware';
import {
  getVotingStats,
  generateFinalMenu,
  getMenuPreview,
  publishMenu,
  updateMenu,
  getMenuHistory,
  deleteMenu
} from '../controllers/adminMenu.controller';

const router = express.Router();

router.use(verifyToken, requireRole('ADMIN'));

router.get('/voting/stats', requirePermission('MANAGE_MENU'), getVotingStats);
router.post('/generate', requirePermission('MANAGE_MENU'), generateFinalMenu);
router.get('/preview', requirePermission('MANAGE_MENU'), getMenuPreview);
router.post('/publish', requirePermission('MANAGE_MENU'), publishMenu);
router.put('/update', requirePermission('MANAGE_MENU'), updateMenu);
router.get('/history', requirePermission('MANAGE_MENU'), getMenuHistory);
router.delete('/:menuId', requirePermission('MANAGE_MENU'), deleteMenu);

export default router;