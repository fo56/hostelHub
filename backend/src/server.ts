import express, {Express, Request, Response} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

dotenv.config();

const PORT = process.env.PORT || 8000;

const app: Express = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({message : "Server is running properly"});
});

// Connect DB before starting server
connectDB().then(() => {
  app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
  });
});