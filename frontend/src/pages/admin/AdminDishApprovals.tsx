import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'

export default function AdminDishApprovals() {
  const { request } = useApi()
  const [dishes, setDishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const data = await request('/admin/dishes?status=UNDER_REVIEW')
    setDishes(data)
    setLoading(false)
  }

  const approve = async (id: string) => {
  const priceScore = Number(prompt('Price score (1–5):'))
  const healthScore = Number(prompt('Health score (1–5):'))

  // invalid input
  if (
    Number.isNaN(priceScore) ||
    Number.isNaN(healthScore) ||
    priceScore < 1 ||
    priceScore > 5 ||
    healthScore < 1 ||
    healthScore > 5
  ) {
    alert('Invalid score. Price and Health scores must be numbers between 1 and 5.')
    return
  }

  try {
    await request(`/admin/dishes/${id}/approve`, 'POST', { priceScore, healthScore })

    load()
  } catch (err: any) {
    alert(err.message || 'Failed to approve dish')
  }
}


  const reject = async (id: string) => {
  const reason = prompt('Reason for rejection:')

  if (!reason || !reason.trim()) {
    alert('Rejection reason is required.')
    return
  }

  try {
    await request(`/admin/dishes/${id}/reject`, 'POST', { reason })

    load()
  } catch (err: any) {
    alert(err.message || 'Failed to reject dish')
  }
}


  if (loading) return <p>Loading...</p>

  if (!dishes.length) {
    return <p>No dishes pending review.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dish Approvals</h1>

      <table className="w-full border bg-white">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Meal</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Suggested By</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {dishes.map(d => (
            <tr key={d._id}>
              <td className="border p-2">{d.name}</td>
              <td className="border p-2">{d.mealType}</td>
              <td className="border p-2">{d.category}</td>
              <td className="border p-2">
                {d.suggestedBy?.name || '—'}
              </td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => approve(d._id)}
                  className="bg-green-600 text-white px-2 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject(d._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
