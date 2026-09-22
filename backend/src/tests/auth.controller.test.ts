import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { login } from '../controllers/auth.controller';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('../models/User');
vi.mock('bcrypt');
vi.mock('jsonwebtoken');

describe('Auth Controller - login', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  it('should return 400 if username or password is not provided', async () => {
    req.body = { username: 'testuser' }; // Missing password
    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Username and password are required' });
  });

  it('should return 400 for invalid credentials (user not found)', async () => {
    req.body = { username: 'testuser', password: 'password123' };
    vi.mocked(User.findOne).mockResolvedValue(null); // User not found

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 400 for invalid credentials (wrong password)', async () => {
    req.body = { username: 'testuser', password: 'wrongpassword' };
    vi.mocked(User.findOne).mockResolvedValue({ _id: '1', username: 'testuser', password: 'hashedpassword' });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never); // Password doesn't match

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 403 if user is inactive', async () => {
    req.body = { username: 'testuser', password: 'password123' };
    vi.mocked(User.findOne).mockResolvedValue({ _id: '1', username: 'testuser', password: 'hashedpassword', isActive: false });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never); // Password matches

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Account is deactivated' });
  });

  it('should return 200 and a token on successful login', async () => {
    req.body = { username: 'testuser', password: 'password123' };
    const mockUser = { 
      _id: '1', 
      username: 'testuser', 
      password: 'hashedpassword', 
      isActive: true, 
      role: 'STUDENT',
      name: 'Test User'
    };
    
    vi.mocked(User.findOne).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(jwt.sign).mockReturnValue('mocked-token' as never);

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      token: 'mocked-token',
      user: expect.objectContaining({ username: 'testuser' })
    }));
  });
});
