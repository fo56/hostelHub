export const formatMeal = (mealDishes: any[]) => {
  return mealDishes.map((item) => {
    // If it's a fully populated dish object
    if (item.dishId && item.dishId._id) {
      return {
        _id: item._id,
        dishId: {
          _id: item.dishId._id,
          name: item.dishId.name,
          mealType: item.dishId.mealType,
          priceScore: item.dishId.priceScore,
          healthScore: item.dishId.healthScore
        },
        // Computed metrics from MenuRecommendation
        voteScore: item.voteScore,
        costEfficiency: item.costEfficiency,
        finalScore: item.finalScore
      };
    }
    // Fallback if dishId is missing
    return item;
  });
};