
export interface MenuRecommendation {
  _id: string;
  dishId: string;
  popularityScore: number;
  healthScore: number;
  costEfficiency: number;
  finalScore: number;
  computedAt: Date;
}