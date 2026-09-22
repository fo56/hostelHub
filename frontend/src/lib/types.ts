export type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
export type Role = 'STUDENT' | 'ADMIN' | 'WORKER';

export interface Dish {
  _id: string;
  name: string;
  mealType: MealType[];
  category: string; // 'VEG' | 'NON-VEG'
  tags: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  priceScore?: number;
  healthScore?: number;
  isFixed: boolean;
}

export interface ServedDish {
  _id: string;
  dishId: Dish | string;
  date: string;
  mealType: MealType;
  totalVotes: number;
  averageRating: number;
}
