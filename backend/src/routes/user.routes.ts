    import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { getMe, updateProfile } from '../controllers/user.controller';

const router = Router();

router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);

export default router;
