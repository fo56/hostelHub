import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const meals = ['breakfast','lunch','dinner']

export default function AdminMessMenu() {
  const { request } = useApi()
  const [menu, setMenu] = useState<any>(null)

  useEffect(() => {
    request('/admin/menu/preview').then(setMenu)
  }, [])

  if (!menu) return <p>No menu generated yet.</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mess Menu</h1>

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
          {days.map(day => (
            <tr key={day}>
              <td className="border p-2">{day}</td>
              {meals.map(meal => (
                <td key={meal} className="border p-2 text-sm">
                  {menu[meal]?.[day]?.map((d:any) => d.name).join(', ') || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
