import {Dish} from '../models/Dish';
import {MenuRecommendation} from '../models/MenuRecommendation';
import { Types } from 'mongoose';

export const computeMenuRecommendations = async () => {
  const pipeline = [
    // Only active dishes
    {
      $match: { isActive: true }
    },

    // Join feedback data
    {
      $lookup: {
        from: 'dishfeedbacks',
        localField: '_id',
        foreignField: 'dishId',
        as: 'feedbacks'
      }
    },

    // Compute aggregates
    {
      $addFields: {
        avgRating: {
          $cond: [
            { $gt: [{ $size: '$feedbacks' }, 0] },
            { $avg: '$feedbacks.rating' },
            0
          ]
        },

        wantAgainPercent: {
          $cond: [
            { $gt: [{ $size: '$feedbacks' }, 0] },
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$feedbacks',
                          as: 'f',
                          cond: { $eq: ['$$f.wantAgain', true] }
                        }
                      }
                    },
                    { $size: '$feedbacks' }
                  ]
                },
                100
              ]
            },
            0
          ]
        }
      }
    },

    // Popularity + Cost efficiency
    {
      $addFields: {
        popularityScore: {
          $add: ['$avgRating', '$wantAgainPercent']
        },
        costEfficiency: {
          $cond: [
            { $gt: ['$priceScore', 0] },
            { $divide: [1, '$priceScore'] },
            0
          ]
        }
      }
    },

    // Final weighted score
    {
      $addFields: {
        finalScore: {
          $add: [
            { $multiply: [0.5, '$popularityScore'] },
            { $multiply: [0.3, '$healthScore'] },
            { $multiply: [0.2, '$costEfficiency'] }
          ]
        }
      }
    },

    // Shape output for storage
    {
      $project: {
        dishId: '$_id',
        popularityScore: 1,
        healthScore: 1,
        costEfficiency: 1,
        finalScore: 1,
        _id: 0
      }
    }
  ];

  const computedResults = await Dish.aggregate(pipeline);

  // Clear previous recommendations
  await MenuRecommendation.deleteMany({});

  // Insert fresh computation
  await MenuRecommendation.insertMany(
    computedResults.map(item => ({
      ...item,
      computedAt: new Date()
    }))
  );

  return {
    success: true,
    count: computedResults.length
  };
};
