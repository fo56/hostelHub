function formatMeal(meal: any[], week: number) {
  return meal.map(item => ({
    dishId: item.dishId._id,
    name: item.dishId.name,
    mealType: item.dishId.mealType,

    // Admin-defined scores
    priceScore: item.dishId.priceScore,
    healthScore: item.dishId.healthScore,

    // Voting
    weeklyVotes: item.dishId.weeklyVotes?.get(String(week)) ?? 0,

    // Computed
    voteScore: item.voteScore,
    costEfficiency: item.costEfficiency,
    finalScore: item.finalScore
  }))
}
export { formatMeal };