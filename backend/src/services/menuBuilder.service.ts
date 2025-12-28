// services/menuBuilder.service.ts
import MenuRecommendation from '../models/MenuRecommendation';
import { MessMenu } from '../models/MessMenu';

export const buildMessMenu = async (
  hostelId: string,
  week: number
) => {
  const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;

  const menu: Record<typeof MEALS[number], any[]> = {
    Breakfast: [],
    Lunch: [],
    Dinner: []
  };

  // Fetch top 7 per meal
  for (const meal of MEALS) {
    const dishes = await MenuRecommendation.find({
      hostelId,
      week,
      mealType: meal
    })
      .sort({ finalScore: -1 })
      .limit(7);

    if (dishes.length < 7) {
      throw new Error('not enough meals');
    }

    menu[meal] = dishes;
  }

  return MessMenu.create({
    hostelId,
    week,
    breakfast: menu.Breakfast,
    lunch: menu.Lunch,
    dinner: menu.Dinner,
    generatedAt: new Date(),
    published: false
  });
};
