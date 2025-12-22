import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { User } from '../models/User';
import { Hostel } from '../models/Hostel';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, refreshAccessToken, revokeRefreshToken } from '../utils/jwt';

// Helper function to generate domain from hostel name
const generateDomain = (hostelName: string): string => {
  return hostelName
    .toLowerCase()
    .replace(/\s+/g, '')
    .substring(0, 10) + '.com';
};

// ADMIN REGISTRATION
export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostelName, adminName, adminEmail, adminPassword } = req.body;

    // Validate required fields
    if (!hostelName?.trim() || !adminName?.trim() || !adminEmail?.trim() || !adminPassword?.trim()) {
      res.status(400).json({ message: 'All fields (hostel name, admin name, email, password) are required' });
      return;
    }

    if (adminPassword.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters long' });
      return;
    }

    // Generate domain
    const domain = generateDomain(hostelName);

    // Verify email matches domain
    if (!adminEmail.endsWith(`@${domain}`)) {
      res.status(400).json({ message: `Admin email must end with @${domain}` });
      return;
    }

    // Check if hostel already exists
    const existingHostel = await Hostel.findOne({ name: hostelName });
    if (existingHostel) {
      res.status(400).json({ message: 'This hostel name is already registered. Please choose a different name.' });
      return;
    }

    // Create hostel
    const hostel = new Hostel({ name: hostelName, domain });
    await hostel.save();

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const user = new User({
      hostelId: hostel._id,
      name: adminName,
      email: adminEmail,
      role: 'ADMIN',
      passwordHash,
      isPasswordSet: true,
      emailVerified: true
    });
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      hostelId: hostel._id.toString()
    });

    const refreshToken = await generateRefreshToken(user._id.toString());

    res.status(201).json({
      message: 'Admin registered successfully',
      hostel: { id: hostel._id, name: hostel.name, domain: hostel.domain },
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    res.status(500).json({ message: `Registration failed: ${errorMessage}` });
  }
};

// ADMIN LOGIN
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email?.trim() || !password?.trim()) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email, role: 'ADMIN' });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      hostelId: user.hostelId.toString()
    });

    const refreshToken = await generateRefreshToken(user._id.toString());

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Admin login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    res.status(500).json({ message: `Login failed: ${errorMessage}` });
  }
};

// STUDENT/WORKER LOGIN (email & password)
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email?.trim() || !password?.trim() || !role?.trim()) {
      res.status(400).json({ message: 'Email, password, and role are required' });
      return;
    }

    // Validate role
    const validRoles = ['STUDENT', 'WORKER'];
    if (!validRoles.includes(role.toUpperCase())) {
      res.status(400).json({ message: 'Invalid role. Must be STUDENT or WORKER.' });
      return;
    }

    const user = await User.findOne({ email, role: role.toUpperCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Check if password is set
    if (!user.isPasswordSet || !user.passwordHash) {
      res.status(401).json({ message: 'Your account password has not been set yet. Please use QR code login or contact your admin.' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ message: 'Your account has been deactivated. Please contact your admin.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      hostelId: user.hostelId.toString()
    });

    const refreshToken = await generateRefreshToken(user._id.toString());

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('User login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    res.status(500).json({ message: `Login failed: ${errorMessage}` });
  }
};

// GENERATE QR CODE FOR STUDENT/WORKER
export const generateQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId?.trim()) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !['STUDENT', 'WORKER'].includes(user.role)) {
      res.status(404).json({ message: 'User not found or invalid user role' });
      return;
    }

    // Generate QR token if not exists
    if (!user.qrToken) {
      user.qrToken = crypto.randomBytes(32).toString('hex');
      await user.save();
    }

    const qrCodeData = `${process.env.APP_URL || 'http://localhost:3000'}/qr-login/${user.qrToken}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    res.json({ qrCode: qrCodeImage, qrToken: user.qrToken });
  } catch (error) {
    console.error('QR code generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
    res.status(500).json({ message: `QR code generation failed: ${errorMessage}` });
  }
};

// QR CODE LOGIN
export const loginViaQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrToken } = req.body;

    if (!qrToken?.trim()) {
      res.status(400).json({ message: 'QR token is required' });
      return;
    }

    const user = await User.findOne({ qrToken });
    if (!user) {
      res.status(401).json({ message: 'Invalid or expired QR token' });
      return;
    }

    // For first login, just generate login URL
    if (!user.isPasswordSet) {
      const loginToken = crypto.randomBytes(32).toString('hex');
      user.loginURL = loginToken;
      user.loginURLExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      const setPasswordURL = `${process.env.APP_URL || 'http://localhost:3000'}/set-password/${loginToken}`;
      res.json({
        message: 'First login detected',
        setPasswordURL,
        userId: user._id
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      hostelId: user.hostelId.toString()
    });

    const refreshToken = await generateRefreshToken(user._id.toString());

    res.json({
      message: 'QR login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('QR login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    res.status(500).json({ message: `QR login failed: ${errorMessage}` });
  }
};

// TOKENIZED LOGIN URL
export const loginViaURL = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loginURL } = req.body;

    if (!loginURL?.trim()) {
      res.status(400).json({ message: 'Login URL token is required' });
      return;
    }

    const user = await User.findOne({ loginURL });
    if (!user) {
      res.status(401).json({ message: 'Invalid or expired login link' });
      return;
    }

    // Check if URL expired
    if (!user.loginURLExpires || new Date() > user.loginURLExpires) {
      res.status(401).json({ message: 'Login link has expired. Please request a new one.' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      hostelId: user.hostelId.toString()
    });

    const refreshToken = await generateRefreshToken(user._id.toString());

    // Clear the login URL
    user.loginURL = undefined;
    user.loginURLExpires = undefined;
    await user.save();

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('URL login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    res.status(500).json({ message: `Login failed: ${errorMessage}` });
  }
};

// SET PASSWORD (First login)
export const setPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loginURL, password } = req.body;

    if (!loginURL?.trim()) {
      res.status(400).json({ message: 'Login URL token is required' });
      return;
    }

    if (!password?.trim()) {
      res.status(400).json({ message: 'Password is required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters long' });
      return;
    }

    const user = await User.findOne({ loginURL });
    if (!user) {
      res.status(401).json({ message: 'Invalid or expired login link' });
      return;
    }

    // Check if URL expired
    if (!user.loginURLExpires || new Date() > user.loginURLExpires) {
      res.status(401).json({ message: 'Login link has expired. Please request a new one.' });
      return;
    }

    // Hash and set password
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    user.isPasswordSet = true;
    user.loginURL = undefined;
    user.loginURLExpires = undefined;
    await user.save();

    // Generate tokens for immediate login
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      hostelId: user.hostelId.toString()
    });

    const refreshToken = await generateRefreshToken(user._id.toString());

    res.json({
      message: 'Password set successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Set password error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to set password';
    res.status(500).json({ message: `Failed to set password: ${errorMessage}` });
  }
};

// REFRESH TOKEN
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken?.trim()) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    const userId = await verifyRefreshToken(refreshToken);
    if (!userId) {
      res.status(401).json({ message: 'Invalid or expired refresh token. Please login again.' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(userId);

    res.json({
      message: 'Token refreshed',
      tokens: { accessToken, refreshToken: newRefreshToken }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(500).json({ message: `Token refresh failed: ${errorMessage}` });
  }
};

// LOGOUT
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    res.status(500).json({ message: `Logout failed: ${errorMessage}` });
  }
};
