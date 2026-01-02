// routes/studentMenu.routes.ts
import express from 'express';
import { getActiveDishesForVoting } from '../controllers/studentDish.controller'
import {
  getCurrentMessMenu,
  getStudentVotingStatus, 
  getServedDishesToday
} from '../controllers/studentMenu.controller';
import { getStudentNotifications } from '../controllers/studentNotification.controller';
const router = express.Router();

router.get(
  '/menu/today',
  getServedDishesToday
);

router.get(
  '/menu/current',
  getCurrentMessMenu
);

router.get(
  '/voting/status',
  getStudentVotingStatus
);


router.get(
  '/dishes/active',
  getActiveDishesForVoting
)
router.get(
  '/notifications',
  getStudentNotifications
)
export default router;