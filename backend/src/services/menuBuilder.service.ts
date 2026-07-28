import { MenuRecommendation } from '../models/MenuRecommendation'
import { MessMenu } from '../models/MessMenu'

export const buildMessMenu = async (hostelId: string) => {
  const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const
  const menu: Record<typeof MEALS[number], any[]> = {
    Breakfast: [],
    Lunch: [],
    Dinner: []
  }

  for (const meal of MEALS) {
    const dishes = await MenuRecommendation.find({
      hostelId,
      mealType: meal
    })
      .sort({ finalScore: -1 })
      .limit(7)

    if (dishes.length < 7) {
      throw new Error(`Not enough dishes for ${meal}. Required 7, found ${dishes.length}`)
    }

    menu[meal] = dishes
  }

  // Upsert the menu for the hostel
  return await MessMenu.findOneAndUpdate(
    { hostelId },
    {
      breakfast: menu.Breakfast,
      lunch: menu.Lunch,
      dinner: menu.Dinner,
      generatedAt: new Date(),
      published: false
    },
    { upsert: true, new: true }
  )
}