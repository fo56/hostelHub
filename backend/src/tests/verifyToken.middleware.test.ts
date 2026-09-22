import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');

describe('VerifyToken Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should return 401 if authorization header is missing', () => {
    verifyToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authorization token missing' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Bearer', () => {
    req.headers!.authorization = 'Basic somedata';
    verifyToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authorization token missing' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid or expired', () => {
    req.headers!.authorization = 'Bearer invalidtoken';
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    verifyToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next if token is valid', () => {
    req.headers!.authorization = 'Bearer validtoken';
    const decoded = {
      userId: 'user123',
      role: 'STUDENT',
      hostelId: 'hostel123',
      email: 'student@example.com'
    };
    vi.mocked(jwt.verify).mockReturnValue(decoded as any);

    verifyToken(req as Request, res as Response, next);

    expect(req.user).toBeDefined();
    expect(req.user?._id).toBe('user123');
    expect(req.user?.role).toBe('STUDENT');
    expect(req.user?.hostelId).toBe('hostel123');
    expect(next).toHaveBeenCalled();
  });
});
