import express from 'express';
import { suggestDish } from '../controllers/dish.controller';

const router = express.Router();

// Maps to POST /api/dishes/
router.post('/', suggestDish);

export default router;