import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

const meals = ['breakfast', 'lunch', 'dinner'] as const

export default function AdminMessMenu() {
  const { request } = useApi()
  const [menu, setMenu] = useState<any>(null)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    request('/admin/menu/preview').then(setMenu)
  }, [])

  const publishMenu = async () => {
    try {
      setPublishing(true)
      setError(null)

      await request('/admin/menu/publish', 'POST')

      setPublished(true)
    } catch (err: any) {
      setError(err.message || 'Failed to publish menu')
    } finally {
      setPublishing(false)
    }
  }

  if (!menu) {
    return <p>No menu generated yet.</p>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Weekly Mess Menu</h1>

        <button
          onClick={publishMenu}
          disabled={publishing || published}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {publishing
            ? 'Publishing...'
            : published
            ? 'Published'
            : 'Publish Menu'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <table className="w-full border bg-white">
        <thead>
          <tr>
            <th className="border p-2">Day</th>
            <th className="border p-2">Breakfast</th>
            <th className="border p-2">Lunch</th>
            <th className="border p-2">Dinner</th>
          </tr>
        </thead>

        <tbody>
          {days.map((day, index) => (
            <tr key={day}>
              <td className="border p-2 font-medium">{day}</td>
              {meals.map(meal => (
                <td key={meal} className="border p-2 text-sm">
                  {menu[meal]?.[index]?.dishId?.name ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
