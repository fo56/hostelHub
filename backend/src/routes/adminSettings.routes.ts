import express from 'express';
import { getSettings, updateSettings, previewMenuConstraints, confirmMenuConstraints, deleteHostel } from '../controllers/adminSettings.controller';
import { requireRole } from '../middlewares/requireRole.middleware';
import { requirePermission } from '../middlewares/requirePermission.middleware';

const router = express.Router();

router.get('/', requireRole('ADMIN'), requirePermission('MANAGE_SETTINGS'), getSettings);
router.put('/', requireRole('ADMIN'), requirePermission('MANAGE_SETTINGS'), updateSettings);
router.post('/menu-constraints/preview', requireRole('ADMIN'), requirePermission('MANAGE_SETTINGS'), previewMenuConstraints);
router.post('/menu-constraints/confirm', requireRole('ADMIN'), requirePermission('MANAGE_SETTINGS'), confirmMenuConstraints);
router.delete('/hostel', requireRole('ADMIN'), requirePermission('MANAGE_SETTINGS'), deleteHostel);

export default router;
