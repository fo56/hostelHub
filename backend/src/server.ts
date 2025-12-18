import express, {Express, Request, Response} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import adminDishRoutes from './routes/adminDish.routes';
import dishRoutes from './routes/dish.routes';
import adminMenuRoutes from './routes/adminMenu.routes';
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
app.use('/api/admin', verifyToken, adminDishRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/menu-votes', verifyToken, require('./routes/menuVote.routes').default);
app.use('/api/admin/menu', verifyToken, require('./routes/adminMenu.routes').default);
// Connect DB before starting server
connectDB().then(() => {
  app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
  });
});