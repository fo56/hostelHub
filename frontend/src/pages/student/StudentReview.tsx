import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';

interface ServedDish {
  _id: string;
  name: string;
  mealType: string;
}

export default function StudentReviewForm() {
  const { request } = useApi();
  
  // State for fetching today's menu
  const [todayDishes, setTodayDishes] = useState<Record<string, ServedDish | null>>({});
  
  // Form State
  const [selectedMeal, setSelectedMeal] = useState<{ id: string, type: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Fetch what is being served today so student can select easily
    request('/student/menu/today').then((res) => {
      setTodayDishes({
        BREAKFAST: res.breakfast,
        LUNCH: res.lunch,
        DINNER: res.dinner
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
        dishId: selectedMeal.id,
        mealType: selectedMeal.type,
        rating,
        comment,
        servedOn: new Date().toISOString(), // Current date
      });

      setMessage({ type: 'success', text: 'Thank you! Review submitted successfully.' });
      setRating(0);
      setComment('');
      setSelectedMeal(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit review' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Rate Your Meal</h2>

      {message && (
        <div className={`p-4 mb-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Meal Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Which meal did you just have?</label>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(todayDishes).map(([type, dish]) => (
              dish && (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMeal({ id: dish._id, type })}
                  className={`flex justify-between items-center p-4 border rounded-lg transition-all ${
                    selectedMeal?.id === dish._id 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{type}</p>
                    <p className="font-semibold text-gray-800">{dish.name}</p>
                  </div>
                  {selectedMeal?.id === dish._id && <div className="w-4 h-4 bg-blue-500 rounded-full" />}
                </button>
              )
            ))}
          </div>
        </div>

        {/* 2. Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">How was the taste?</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-3xl transition-transform active:scale-90 ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* 3. Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Any specific feedback? (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="E.g. The salt was a bit high, or the paneer was very soft!"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedMeal || rating === 0 || isSubmitting}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:shadow-none transition-all"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}