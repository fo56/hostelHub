import express, {Express, Request, Response} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import adminDishRoutes from './routes/adminDish.routes';
import dishRoutes from './routes/dish.routes';
import adminMenuRoutes from './routes/adminMenu.routes';
import adminUserRoutes from './routes/adminUser.routes';
import mealReviewRoutes from './routes/mealReview.routes';
import adminReviewRoutes from './routes/adminReview.routes';
import userRoutes from './routes/user.routes';

import { verifyToken } from './middlewares/verifyToken.middleware';
import { requireRole } from './middlewares/requireRole.middleware';
import { errorHandler } from './middlewares/errorHandler';


dotenv.config();
const PORT = process.env.PORT || 8000;

const app: Express = express();


app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({message : "Server is running properly"});
});

// Routes
app.use('/api/admin/menu', verifyToken, require('./routes/adminMenu.routes').default);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/dishes', verifyToken, adminDishRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/menu-votes', verifyToken, require('./routes/menuVote.routes').default);
app.use('/api/student/menu', require('./routes/studentMenu.routes').default);
app.use('/api/users', userRoutes);
app.use('/api/reviews', require('./routes/mealReview.routes').default);
app.use('/api/admin/reviews', require('./routes/adminReview.routes').default);
app.use(errorHandler);

// Connect DB before starting server
const connectWithTimeout = async () => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Database connection timeout')), 10000)
  );
  
  try {
    await Promise.race([connectDB(), timeout]);
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

connectWithTimeout();