import express from 'express';
import { getActiveDishesForVoting } from '../controllers/studentDish.controller';
import { getCurrentMessMenu, getServedDishesToday } from '../controllers/studentMenu.controller';
import { getStudentNotifications } from '../controllers/studentNotification.controller';
import { getStudentVotes, saveStudentVotes } from '../controllers/studentVote.controller';

const router = express.Router();

router.get('/menu/today', getServedDishesToday);
router.get('/menu/current', getCurrentMessMenu);
router.get('/dishes/active', getActiveDishesForVoting);
router.get('/notifications', getStudentNotifications);

// Continuous preference management routes
router.get('/votes', getStudentVotes);
router.post('/votes', saveStudentVotes);

export default router;