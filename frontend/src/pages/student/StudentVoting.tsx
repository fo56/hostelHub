import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'

type Meal = 'Breakfast' | 'Lunch' | 'Dinner'

interface Dish {
  _id: string
  name: string
  mealType: Meal
  healthScore: number
}

interface VotingWindow {
  isOpen: boolean
  week: number
  startsAt?: string
  endsAt?: string
}

export default function StudentVoting() {
  const { request } = useApi()

  // Backend-provided grouped dishes
  const [dishes, setDishes] = useState<Record<Meal, Dish[]>>({
    Breakfast: [],
    Lunch: [],
    Dinner: []
  })

  const [votingWindow, setVotingWindow] = useState<VotingWindow | null>(null)
  const [loading, setLoading] = useState(true)

  // Selected dish IDs
  const [selections, setSelections] = useState<Record<Meal, string[]>>({
    Breakfast: [],
    Lunch: [],
    Dinner: []
  })

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] =
    useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // INIT
  useEffect(() => {
    const init = async () => {
      try {
        const [windowRes, dishesRes] = await Promise.all([
          request('/student/voting/status'),
          request('/student/dishes/active')
        ])

        setVotingWindow(windowRes)

        setDishes({
          Breakfast: dishesRes.Breakfast ?? [],
          Lunch: dishesRes.Lunch ?? [],
          Dinner: dishesRes.Dinner ?? []
        })
      } catch (err) {
        console.error('Initialization failed', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  // TOGGLE DISH
  const toggleDish = (meal: Meal, dishId: string) => {
    setSelections(prev => {
      const current = prev[meal]

      if (current.includes(dishId)) {
        return { ...prev, [meal]: current.filter(id => id !== dishId) }
      }

      if (current.length >= 7) return prev

      return { ...prev, [meal]: [...current, dishId] }
    })
  }

  const isComplete =
    selections.Breakfast.length === 7 &&
    selections.Lunch.length === 7 &&
    selections.Dinner.length === 7

  // SUBMIT (NO WEEK SENT — SERVER DERIVES IT)
  const handleSubmit = async () => {
    if (!isComplete || submitting) return

    setSubmitting(true)
    setMessage(null)

    try {
      await request('/menu-votes/vote', 'POST', {
        votes: selections
      })

      setMessage({
        type: 'success',
        text: 'Your votes have been cast successfully!'
      })
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to submit votes'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // STATES
  if (loading) {
    return <div className="p-8 text-center">Loading voting window…</div>
  }

  if (!votingWindow?.isOpen) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-gray-50 border border-dashed rounded-xl text-center">
        <h2 className="text-xl font-bold text-gray-700">
          Voting is currently closed
        </h2>
        <p className="text-gray-500 mt-2">
          Check back later when the admin opens the next window.
        </p>
      </div>
    )
  }

  // UI
  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Cast Your Votes</h1>
        <p className="text-gray-600">
          Select exactly 7 dishes for each meal.
        </p>
        <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
          Week {votingWindow.week}
        </div>
      </header>

      {message && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(['Breakfast', 'Lunch', 'Dinner'] as Meal[]).map(meal => (
          <div key={meal} className="bg-white border rounded-xl">
            <div className="p-4 bg-gray-50 border-b flex justify-between">
              <h2 className="font-bold">{meal}</h2>
              <span
                className={`text-sm ${
                  selections[meal].length === 7
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`}
              >
                {selections[meal].length}/7
              </span>
            </div>

            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {dishes[meal].map(dish => (
                <button
                  key={dish._id}
                  onClick={() => toggleDish(meal, dish._id)}
                  className={`w-full p-3 rounded-lg border text-left transition ${
                    selections[meal].includes(dish._id)
                      ? 'bg-blue-600 text-white'
                      : 'hover:border-blue-400'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{dish.name}</span>
                    <span className="text-xs">H: {dish.healthScore}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SUBMIT BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {isComplete
              ? 'All categories ready!'
              : 'Please complete all selections.'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
          >
            {submitting ? 'Submitting…' : 'Submit All Votes'}
          </button>
        </div>
      </div>
    </div>
  )
}
