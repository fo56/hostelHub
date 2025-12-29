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

export default function StudentMessMenu() {
  const { request } = useApi()
  const [menu, setMenu] = useState<any>(null)

  useEffect(() => {
    request('/student/menu/current').then(setMenu)
  }, [])

  if (!menu) {
    return <p>No menu generated yet.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Weekly Mess Menu</h1>

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
