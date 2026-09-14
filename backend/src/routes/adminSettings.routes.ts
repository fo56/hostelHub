import express from 'express';
import { getSettings, updateSettings, previewMenuConstraints, confirmMenuConstraints } from '../controllers/adminSettings.controller';
import { requireRole } from '../middlewares/requireRole.middleware';

const router = express.Router();

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/menu-constraints/preview', requireRole('ADMIN'), previewMenuConstraints);
router.post('/menu-constraints/confirm', requireRole('ADMIN'), confirmMenuConstraints);

export default router;
