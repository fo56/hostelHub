import express, {Express, Request, Response} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import adminDishRoutes from './routes/adminDish.routes';
import dishRoutes from './routes/dish.routes';
import adminMenuRoutes from './routes/adminMenu.routes';
import adminUserRoutes from './routes/adminUser.routes';
dotenv.config();
// Middleware
import { verifyToken } from './middlewares/verifyToken.middleware';
import { requireRole } from './middlewares/requireRole.middleware';

const PORT = process.env.PORT || 8000;

const app: Express = express();


app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({message : "Server is running properly"});
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', verifyToken, adminDishRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/menu-votes', verifyToken, require('./routes/menuVote.routes').default);
app.use('/api/admin/menu', verifyToken, require('./routes/adminMenu.routes').default);
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