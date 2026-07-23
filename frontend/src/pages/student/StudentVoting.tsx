import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../../hooks/useAuth'

type Meal = 'Breakfast' | 'Lunch' | 'Dinner'

interface Dish {
  _id: string
  name: string
  mealType: Meal
  healthScore: number
}

export default function StudentVoting() {
  const { request } = useApi()
  const { user } = useAuth()
  const hostelId = user?.hostelId || ''

  const [dishes, setDishes] = useState<Record<Meal, Dish[]>>({
    Breakfast: [],
    Lunch: [],
    Dinner: []
  })

  const [selections, setSelections] = useState<Record<Meal, string[]>>({
    Breakfast: [],
    Lunch: [],
    Dinner: []
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const socket: Socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000')

    socket.emit('join_hostel_room', hostelId)

    socket.on('MENU_PUBLISHED', (data: { week: number }) => {
      setNotification(`🎉 Week ${data.week} mess menu has just been published!`)
    })

    const init = async () => {
      try {
        // Only one call needed since getStudentVotes returns both dishes and user's votes
        const data = await request('/menu-votes/votes')

        // 1. Group the flat availableDishes array by Meal Type
        const groupedDishes: Record<Meal, Dish[]> = {
          Breakfast: data.availableDishes.filter((d: Dish) => d.mealType === 'Breakfast'),
          Lunch: data.availableDishes.filter((d: Dish) => d.mealType === 'Lunch'),
          Dinner: data.availableDishes.filter((d: Dish) => d.mealType === 'Dinner')
        }
        setDishes(groupedDishes)

        // 2. Extract IDs from the populated vote objects returned by the backend
        if (data.votes) {
          setSelections({
            Breakfast: data.votes.breakfast.map((d: any) => d._id || d),
            Lunch: data.votes.lunch.map((d: any) => d._id || d),
            Dinner: data.votes.dinner.map((d: any) => d._id || d)
          })
        }
      } catch (err) {
        console.error('Failed to load student data:', err)
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      socket.disconnect()
    }
  }, [hostelId])

  const toggleDish = (meal: Meal, dishId: string) => {
    setSelections((prev) => {
      const current = prev[meal]
      if (current.includes(dishId)) {
        return { ...prev, [meal]: current.filter((id) => id !== dishId) }
      }
      if (current.length >= 7) return prev
      return { ...prev, [meal]: [...current, dishId] }
    })
  }

  const isComplete =
    selections.Breakfast.length === 7 &&
    selections.Lunch.length === 7 &&
    selections.Dinner.length === 7

  const handleSavePreferences = async () => {
    if (!isComplete || submitting) return

    setSubmitting(true)
    setMessage(null)

    try {
      await request('/menu-votes/votes', 'POST', {
        votes: {
          breakfast: selections.Breakfast,
          lunch: selections.Lunch,
          dinner: selections.Dinner
        }
      })

      setMessage({ type: 'success', text: 'Preferences updated successfully!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save preferences' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading meal choices...</div>

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      {notification && (
        <div className="p-4 bg-blue-600 text-white rounded-lg shadow-md flex justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="font-bold">✕</button>
        </div>
      )}

      <header>
        <h1 className="text-3xl font-bold">Your Preferred Weekly Dishes</h1>
        <p className="text-gray-600">
          Pick your top 7 choices for each meal. You can edit these preferences at any time!
        </p>
      </header>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['Breakfast', 'Lunch', 'Dinner'] as Meal[]).map((meal) => (
          <div key={meal} className="bg-white border rounded-xl shadow-sm">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="font-bold">{meal}</h2>
              <span className={`text-sm font-semibold ${selections[meal].length === 7 ? 'text-green-600' : 'text-orange-600'}`}>
                {selections[meal].length}/7 Selected
              </span>
            </div>

            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {dishes[meal].map((dish) => {
                const isSelected = selections[meal].includes(dish._id)
                return (
                  <button
                    key={dish._id}
                    onClick={() => toggleDish(meal, dish._id)}
                    className={`w-full p-3 rounded-lg border text-left transition flex justify-between items-center ${
                      isSelected ? 'bg-blue-600 text-white font-medium' : 'hover:border-blue-400'
                    }`}
                  >
                    <span>{dish.name}</span>
                    <span className="text-xs opacity-75">Health: {dish.healthScore}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {isComplete ? 'All categories complete!' : 'Please pick exactly 7 dishes per category.'}
          </span>
          <button
            onClick={handleSavePreferences}
            disabled={!isComplete || submitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:bg-gray-300 transition"
          >
            {submitting ? 'Saving...' : 'Save Choices'}
          </button>
        </div>
      </div>
    </div>
  )
}