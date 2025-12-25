import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import {
  createIssue,
  getAllIssues,
  getMyIssues,
  getAssignedIssues,
  assignIssue,
  updateIssueStatus,
  deleteIssue
} from '../controllers/issue.controller';

const router = Router();

// Student routes - IMPORTANT: static routes must come before parameterized routes
router.post('/', verifyToken, createIssue); // Student creates issue
router.get('/my-issues', verifyToken, getMyIssues); // Student views their issues
router.get('/assigned', verifyToken, getAssignedIssues); // Worker views assigned issues

// Admin routes
router.get('/admin/all', verifyToken, requireRole('ADMIN'), getAllIssues); // Admin views all issues

// Parameterized routes (must come last)
router.patch('/:issueId/assign', verifyToken, requireRole('ADMIN'), assignIssue); // Admin assigns issue
router.patch('/:issueId/status', verifyToken, updateIssueStatus); // Update issue status (worker or admin)
router.delete('/:issueId', verifyToken, deleteIssue); // Delete issue

export default router;
