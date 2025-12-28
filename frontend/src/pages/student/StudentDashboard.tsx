import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'

interface Notification {
  type: 'APPROVED' | 'REJECTED'
  dishName: string
  priceScore?: number
  healthScore?: number
  reason?: string
  date: string
}

export default function StudentDashboard() {
  const { request } = useApi()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    request('/student/notifications')
      .then(setNotifications)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Student Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Manage hostel operations from the sidebar.
      </p>

      <h2 className="text-xl font-semibold mb-3">Notifications</h2>

      {loading && <p>Loading notifications...</p>}

      {!loading && notifications.length === 0 && (
        <p className="text-gray-500">
          No notifications yet.
        </p>
      )}

      <div className="space-y-3">
        {notifications.map((n, idx) => (
          <div
            key={idx}
            className={`border p-3 rounded ${
              n.type === 'APPROVED'
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            {n.type === 'APPROVED' ? (
              <>
                <p className="font-semibold text-green-700">
                  Dish Approved: {n.dishName}
                </p>
                <p className="text-sm">
                  Price Score: <b>{n.priceScore}</b> | Health Score:{' '}
                  <b>{n.healthScore}</b>
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-red-700">
                  Dish Rejected: {n.dishName}
                </p>
                <p className="text-sm">
                  Reason: <b>{n.reason}</b>
                </p>
              </>
            )}

            <p className="text-xs text-gray-500 mt-1">
              {new Date(n.date).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
