export const formatMeal = (mealDishes: any[]) => {
  return mealDishes.map((item) => {
    // If it's a fully populated dish object
    if (item.dishId && item.dishId._id) {
      let totalVotes = 0;
      if (item.dishId.weeklyVotes) {
        if (typeof item.dishId.weeklyVotes.get === 'function') {
          // It's a Map
          for (const val of item.dishId.weeklyVotes.values()) {
            totalVotes += val;
          }
        } else {
          // Plain object from Redis
          for (const key in item.dishId.weeklyVotes) {
            totalVotes += item.dishId.weeklyVotes[key];
          }
        }
      }

      return {
        _id: item._id,
        dishId: {
          _id: item.dishId._id,
          name: item.dishId.name,
          mealType: item.dishId.mealType,
          priceScore: item.dishId.priceScore,
          healthScore: item.dishId.healthScore
        },
        // Voting
        totalVotes,

        // Computed
        voteScore: item.voteScore,
        costEfficiency: item.costEfficiency,
        finalScore: item.finalScore
      };
    }
    // Fallback if dishId is missing
    return item;
  });
};