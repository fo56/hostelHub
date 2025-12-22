import { Schema, model } from 'mongoose';

export interface MenuRecommendation {
  _id: string;
  dishId: string;
  popularityScore: number;
  healthScore: number;
  costEfficiency: number;
  finalScore: number;
  computedAt: Date;
}

const menuRecommendationSchema = new Schema<MenuRecommendation>(
  {
    dishId: { type: String, required: true },
    popularityScore: { type: Number, required: true },
    healthScore: { type: Number, required: true },
    costEfficiency: { type: Number, required: true },
    finalScore: { type: Number, required: true },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<MenuRecommendation>('MenuRecommendation', menuRecommendationSchema);