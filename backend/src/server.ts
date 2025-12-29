import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import adminDishRoutes from './routes/adminDish.routes';
import dishRoutes from './routes/dish.routes';
import adminMenuRoutes from './routes/adminMenu.routes';
import adminUserRoutes from './routes/adminUser.routes';
import mealReviewRoutes from './routes/mealReview.routes';
import adminReviewRoutes from './routes/adminReview.routes';
import menuVoteRoutes from './routes/menuVote.routes';
import userRoutes from './routes/user.routes';
import issueRoutes from './routes/issue.routes';
import studentRoutes from './routes/student.routes';
import { verifyToken } from './middlewares/verifyToken.middleware';
import { requireRole } from './middlewares/requireRole.middleware';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Public Routes
app.get('/', (req, res) => res.status(200).json({ message: 'Server Running' }));
app.use('/api/auth', authRoutes);

// Protected Routes (Require Login)
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/issues', verifyToken, issueRoutes);

// Student Specific Routes
// Applying verifyToken and Role check here covers all routes inside studentRoutes
app.use('/api/student/reviews', verifyToken, requireRole('STUDENT'), mealReviewRoutes);
app.use('/api/student', verifyToken, requireRole('STUDENT'), studentRoutes);
app.use('/api/menu-votes', verifyToken, requireRole('STUDENT'), menuVoteRoutes);

// Admin Specific Routes
app.use('/api/admin/menu', verifyToken, requireRole('ADMIN'), adminMenuRoutes);
app.use('/api/admin/users', verifyToken, requireRole('ADMIN'), adminUserRoutes);
app.use('/api/admin/dishes', verifyToken, requireRole('ADMIN'), adminDishRoutes);
app.use('/api/admin/reviews', verifyToken, requireRole('ADMIN'), adminReviewRoutes);

// Shared/General Data Routes
app.use('/api/dishes', verifyToken, dishRoutes);
app.use('/api/reviews', verifyToken, mealReviewRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
};

startServer();