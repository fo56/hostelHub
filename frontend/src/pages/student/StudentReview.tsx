import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

interface ServedDish {
  dishId: {
    _id: string;
    name: string;
    mealType: MealType;
  };
}

export default function StudentReviewForm() {
  const { request } = useApi();

  const [todayDishes, setTodayDishes] = useState<Record<MealType, ServedDish | null>>({
    Breakfast: null,
    Lunch: null,
    Dinner: null
  });

  const [selectedMeal, setSelectedMeal] = useState<{
    dishId: string;
    mealType: MealType;
  } | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] =
    useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // FETCH TODAY'S MENU
  useEffect(() => {
    request('/student/menu/today').then((res) => {
      setTodayDishes({
        Breakfast: res.breakfast ?? null,
        Lunch: res.lunch ?? null,
        Dinner: res.dinner ?? null
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeal || rating === 0) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      await request('/student/reviews/submit', 'POST', {
        dishId: selectedMeal.dishId,
        mealType: selectedMeal.mealType,
        rating,
        comment,
        servedOn: new Date().toISOString().split('T')[0] // today only
      });

      setMessage({
        type: 'success',
        text: 'Thank you! Review submitted successfully.'
      });

      setRating(0);
      setComment('');
      setSelectedMeal(null);

    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to submit review'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md border">
      <h2 className="text-2xl font-bold mb-6">Rate Your Meal</h2>

      {message && (
        <div
          className={`p-4 mb-4 rounded ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* MEAL SELECTION */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Which meal did you have?
          </label>

          <div className="space-y-3">
            {(Object.entries(todayDishes) as [MealType, ServedDish | null][])
              .map(([mealType, served]) => {
                if (!served) return null;

                const dish = served.dishId;

                return (
                  <button
                    key={mealType}
                    type="button"
                    onClick={() =>
                      setSelectedMeal({
                        dishId: dish._id,
                        mealType
                      })
                    }
                    className={`w-full p-4 border rounded-lg flex justify-between ${
                      selectedMeal?.dishId === dish._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-blue-300'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-blue-600">
                        {mealType}
                      </p>
                      <p className="font-semibold">{dish.name}</p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* RATING */}
        <div>
          <label className="block text-sm font-medium mb-2">
            How was the taste?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-3xl ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* COMMENT */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Feedback (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full p-3 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedMeal || rating === 0 || isSubmitting}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
