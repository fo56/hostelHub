import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DishStat {
  _id: string
  name: string
  mealType: string
  averageRating: number
  totalReviews: number
}

interface TrendStat {
  date: string
  averageRating: number
  totalReviews: number
}

export default function AdminReviews() {
  const { request } = useApi()

  const [dishStats, setDishStats] = useState<DishStat[]>([])
  const [trendStats, setTrendStats] = useState<TrendStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await request('/admin/reviews/stats')
        setDishStats(res.dishStats)
        setTrendStats(res.trendStats)
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to fetch reviews statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedDishStats = [...dishStats].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    const valA = (a as any)[key]
    const valB = (b as any)[key]

    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1
    if (valA > valB) return direction === 'asc' ? 1 : -1
    return 0
  })

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Reviews Dashboard...</div>
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews Analytics</h1>
        <p className="text-gray-600 mt-2">Track cumulative dish ratings and student satisfaction trends.</p>
      </div>

      {/* Date-wise Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Average Rating Trend (Date-wise)</h2>
        {trendStats.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  domain={[1, 5]} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [Number(value).toFixed(2), 'Avg Rating']}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageRating" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Not enough data to display trend.</p>
        )}
      </div>

      {/* Cumulative Dish Stats Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Cumulative Dish Ratings</h2>
        </div>
        
        {dishStats.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No ratings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th 
                    className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Dish Name {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('mealType')}
                  >
                    Meal Type {sortConfig?.key === 'mealType' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    className="p-4 text-center font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('totalReviews')}
                  >
                    Total Reviews {sortConfig?.key === 'totalReviews' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    className="p-4 text-center font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('averageRating')}
                  >
                    Avg Rating {sortConfig?.key === 'averageRating' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedDishStats.map((stat) => (
                  <tr key={stat._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">{stat.name}</td>
                    <td className="p-4 text-gray-600 capitalize">{stat.mealType}</td>
                    <td className="p-4 text-center text-gray-900 font-semibold">{stat.totalReviews}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
                        {stat.averageRating.toFixed(2)} ★
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
