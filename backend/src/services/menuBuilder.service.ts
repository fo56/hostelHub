// services/menuBuilder.service.ts
import MenuRecommendation from '../models/MenuRecommendation';
import { MessMenu } from '../models/MessMenu';

export const buildMessMenu = async (
  hostelId: string,
  week: number
) => {
  const recommendations = await MenuRecommendation
    .find()
    .sort({ finalScore: -1 });

  if (recommendations.length === 0) {
    throw new Error('No menu recommendations found');
  }

  // Simple fair split (can evolve later)
  const breakfast = recommendations.slice(0, 7);
  const lunch = recommendations.slice(7, 14);
  const dinner = recommendations.slice(14, 21);

  return MessMenu.create({
    hostelId,
    week,
    breakfast,
    lunch,
    dinner,
    generatedAt: new Date(),
    published: false
  });
};
