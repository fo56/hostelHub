import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import toast from 'react-hot-toast'

interface Notification {
  type: 'APPROVED' | 'REJECTED'
  dishName: string
  priceScore?: number
  healthScore?: number
  reason?: string
  date: string
}

interface IssueStats {
  open: number
  resolved: number
}

interface ServedDish {
  dishId: {
    _id: string
    name: string
  }
}

export default function StudentDashboard() {
  const { request } = useApi()
  const [loading, setLoading] = useState(true)

  // Data states
  const [issueStats, setIssueStats] = useState<IssueStats>({ open: 0, resolved: 0 })
  const [todayDishes, setTodayDishes] = useState<Record<'breakfast' | 'lunch' | 'dinner', ServedDish | null>>({
    breakfast: null,
    lunch: null,
    dinner: null
  })
  
  // Rating states
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 1. Fetch My Issues for Stats
      const issuesRes = await request('/issues/my-issues', 'GET')
      if (issuesRes && issuesRes.issues) {
        const open = issuesRes.issues.filter((i: Record<string, unknown>) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length
        const resolved = issuesRes.issues.filter((i: Record<string, unknown>) => i.status === 'RESOLVED' || i.status === 'CLOSED').length
        setIssueStats({ open, resolved })
      }

      // 2. Fetch Today's Menu
      try {
        const menuRes = await request('/student/menu/current', 'GET')
        if (menuRes) {
          // Toast for menu generation
          if (menuRes.generatedAt) {
            toast(`A menu is active, generated on ${new Date(menuRes.generatedAt).toLocaleDateString()}`, {
              duration: 6000,
              id: 'menu-toast'
            })
          }
          
          // Get today's index (0 = Monday, 6 = Sunday)
          // JS getDay(): 0 = Sunday, 1 = Monday.
          let dayIndex = new Date().getDay() - 1
          if (dayIndex === -1) dayIndex = 6 // Sunday is 6 in our array
          
          setTodayDishes({
            breakfast: menuRes.breakfast?.[dayIndex] || null,
            lunch: menuRes.lunch?.[dayIndex] || null,
            dinner: menuRes.dinner?.[dayIndex] || null
          })
        }
      } catch (e) {
        console.error("Menu not found or error fetching menu", e)
      }

      // 3. Fetch Notifications and Toast them
      const notifRes = await request('/student/notifications', 'GET')
      if (notifRes && Array.isArray(notifRes)) {
        notifRes.forEach((n: Notification) => {
          if (n.type === 'APPROVED') {
            toast.success(`Your dish suggestion "${n.dishName}" was ACCEPTED!`, { 
              duration: 8000,
              id: `notif-app-${n.dishName}` 
            })
          } else {
            toast.error(`Your dish suggestion "${n.dishName}" was REJECTED.`, { 
              duration: 8000,
              id: `notif-rej-${n.dishName}`
            })
          }
        })
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      toast.error('Failed to load some dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRate = (mealType: string, star: number) => {
    setRatings(prev => ({
      ...prev,
      [mealType]: star
    }))
  }

  const submitRating = async (mealType: string, dishId: string) => {
    const rating = ratings[mealType]
    if (!rating) return

    try {
      setSubmitting(true)
      await request('/reviews/submit', 'POST', {
        dishId,
        mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1),
        rating,
        comment: '',
        servedOn: new Date().toISOString().split('T')[0]
      })
      toast.success(`Rating submitted for ${mealType}!`)
      
      // Clear that rating so they know it submitted
      setRatings(prev => {
        const next = { ...prev }
        delete next[mealType]
        return next
      })
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your hostel overview.</p>
      </div>

      {/* Issue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 font-semibold">My Open Issues</h3>
          </div>
          <p className="text-4xl font-black mt-4 text-red-600">{issueStats.open}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 font-semibold">My Resolved Issues</h3>
          </div>
          <p className="text-4xl font-black mt-4 text-green-600">{issueStats.resolved}</p>
        </div>
      </div>

      {/* Today's Menu & Rating Section */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Today's Menu & Ratings</h2>
          <p className="text-sm text-gray-500 mt-1">Rate the dishes you eat today to improve future menus!</p>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600 w-1/4">Meal</th>
                <th className="p-4 font-semibold text-gray-600 w-1/3">Dish</th>
                <th className="p-4 font-semibold text-gray-600">Rate</th>
                <th className="p-4 font-semibold text-gray-600 w-1/5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
                const served = todayDishes[meal]
                if (!served) {
                  return (
                    <tr key={meal}>
                      <td className="p-4 capitalize font-medium text-gray-900">{meal}</td>
                      <td className="p-4 text-gray-500 italic" colSpan={3}>Not scheduled</td>
                    </tr>
                  )
                }

                return (
                  <tr key={meal} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 capitalize font-medium text-gray-900">{meal}</td>
                    <td className="p-4 font-medium text-blue-700">{served.dishId.name}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(meal, star)}
                            className={`text-2xl transition-colors ${
                              star <= (ratings[meal] || 0) ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-400'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => submitRating(meal, served.dishId._id)}
                        disabled={!ratings[meal] || submitting}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded disabled:bg-gray-300 transition-colors"
                      >
                        Submit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
