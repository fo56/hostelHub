import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import {
  createIssue,
  getAllIssues,
  getMyIssues,
  updateIssueStatus,
  deleteIssue,
  getIssueCategories
} from '../controllers/issue.controller';

const router = Router();

// Student routes - IMPORTANT: static routes must come before parameterized routes
router.post('/', verifyToken, createIssue); // Student creates issue
router.get('/my-issues', verifyToken, getMyIssues); // Student views their issues
router.get('/categories', verifyToken, getIssueCategories); // Get active issue categories

// Admin routes
router.get('/admin/all', verifyToken, requireRole('ADMIN'), getAllIssues); // Admin views all issues

router.patch('/:issueId/status', verifyToken, requireRole('ADMIN'), updateIssueStatus); // Update issue status (admin only)
router.delete('/:issueId', verifyToken, requireRole('ADMIN'), deleteIssue); // Delete issue

export default router;
