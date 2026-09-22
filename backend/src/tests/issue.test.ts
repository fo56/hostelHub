import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { createIssue } from '../controllers/issue.controller';
import { Issue } from '../models/Issue';
import { User } from '../models/User';
import { Hostel } from '../models/Hostel';

// Mock mongoose models
vi.mock('../models/Issue');
vi.mock('../models/User');
vi.mock('../models/Hostel');

describe('Issue Controller - createIssue', () => {
  it('should return 400 if fields are missing', async () => {
    const req = {
      body: {},
      user: { _id: 'user123' }
    } as unknown as Request;
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    await createIssue(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All fields (category, priority, description) are required' });
  });

  it('should return 400 if priority is invalid', async () => {
    const req = {
      body: { category: 'Plumbing', priority: 'INVALID', description: 'Test' },
      user: { _id: 'user123' }
    } as unknown as Request;
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    await createIssue(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid priority level' });
  });
});
