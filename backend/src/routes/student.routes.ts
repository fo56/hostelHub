// routes/studentMenu.routes.ts
import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { getActiveDishesForVoting } from '../controllers/studentDish.controller'
import {
  getCurrentMessMenu,
  getMessMenuByWeek,
  getStudentVotingStatus, 
  getServedDishesToday
} from '../controllers/studentMenu.controller';
import { getStudentNotifications } from '../controllers/studentNotification.controller'
const router = express.Router();

router.get(
  '/menu/today',
  verifyToken,
  requireRole('STUDENT'),
  getServedDishesToday
);

router.get(
  '/menu/current',
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
  '/menu/:week',
  verifyToken,
  requireRole('STUDENT'),
  getMessMenuByWeek
);

router.get(
  '/dishes/active',
  verifyToken,
  requireRole('STUDENT'),
  getActiveDishesForVoting
)
router.get(
  '/notifications',
  verifyToken,
  requireRole('STUDENT'),
  getStudentNotifications
)
export default router;