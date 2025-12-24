import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { getMe } from '../controllers/user.controller';

const router = Router();

router.get('/me', verifyToken, getMe);

export default router;
