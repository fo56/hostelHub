import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'

type TabType = 'ACTIVE' | 'UNDER_REVIEW'

export default function AdminDishManagement() {
  const { request } = useApi()
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE')
  const [dishes, setDishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    mealType: 'Lunch', // Fixed Casing
    category: 'Veg',
    tags: '',
    priceScore: 3,
    healthScore: 3
  })

  useEffect(() => {
    loadDishes()
  }, [activeTab])

  const loadDishes = async () => {
    setLoading(true)
    try {
      const data = await request(`/admin/dishes?status=${activeTab}`)
      setDishes(data || [])
    } catch (err: any) {
      alert(err.message || 'Failed to fetch dishes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        priceScore: Number(formData.priceScore),
        healthScore: Number(formData.healthScore)
      }

      await request('/admin/dishes', 'POST', payload)
      alert('Dish created successfully!')
      setShowModal(false)
      setFormData({ name: '', mealType: 'Lunch', category: 'Veg', tags: '', priceScore: 3, healthScore: 3 })
      loadDishes()
    } catch (err: any) {
      alert(err.message || 'Failed to create dish')
    }
  }

  const approve = async (id: string) => {
    const priceScore = Number(prompt('Price score (1–5):'))
    const healthScore = Number(prompt('Health score (1–5):'))

    if (
      Number.isNaN(priceScore) ||
      Number.isNaN(healthScore) ||
      priceScore < 1 || priceScore > 5 ||
      healthScore < 1 || healthScore > 5
    ) {
      alert('Invalid score. Price and Health scores must be numbers between 1 and 5.')
      return
    }

    try {
      await request(`/admin/dishes/${id}/approve`, 'POST', { priceScore, healthScore })
      loadDishes()
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
      loadDishes()
    } catch (err: any) {
      alert(err.message || 'Failed to reject dish')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dish Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
        >
          + Suggest / Add Dish
        </button>
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`py-2 px-4 font-semibold border-b-2 ${
            activeTab === 'ACTIVE'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Approved Dishes
        </button>
        <button
          onClick={() => setActiveTab('UNDER_REVIEW')}
          className={`py-2 px-4 font-semibold border-b-2 ${
            activeTab === 'UNDER_REVIEW'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Review
        </button>
      </div>

      {loading ? (
        <p>Loading dishes...</p>
      ) : dishes.length === 0 ? (
        <p className="text-gray-500 py-4">
          No {activeTab === 'ACTIVE' ? 'approved' : 'pending'} dishes found.
        </p>
      ) : (
        <table className="w-full border bg-white rounded shadow-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Meal Type</th>
              <th className="border p-2 text-left">Category</th>
              {activeTab === 'ACTIVE' ? (
                <>
                  <th className="border p-2 text-center">Price Score</th>
                  <th className="border p-2 text-center">Health Score</th>
                  <th className="border p-2 text-left">Approved By</th>
                </>
              ) : (
                <>
                  <th className="border p-2 text-left">Suggested By</th>
                  <th className="border p-2 text-center">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {dishes.map((d) => (
              <tr key={d._id} className="hover:bg-gray-50">
                <td className="border p-2 font-medium">{d.name}</td>
                <td className="border p-2">{d.mealType}</td>
                <td className="border p-2">{d.category}</td>
                {activeTab === 'ACTIVE' ? (
                  <>
                    <td className="border p-2 text-center">{d.priceScore ?? '—'}</td>
                    <td className="border p-2 text-center">{d.healthScore ?? '—'}</td>
                    <td className="border p-2">{d.approvedBy?.name || 'Admin'}</td>
                  </>
                ) : (
                  <>
                    <td className="border p-2">{d.suggestedBy?.name || '—'}</td>
                    <td className="border p-2 text-center space-x-2">
                      <button
                        onClick={() => approve(d._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reject(d._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Reject
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">Suggest / Add New Dish</h2>
            <form onSubmit={handleCreateDish} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border p-2 rounded"
                  placeholder="e.g. Paneer Butter Masala"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Meal Type</label>
                  <select
                    value={formData.mealType}
                    onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                    className="w-full border p-2 rounded"
                  >
                    {/* Fixed to match schema casing exactly */}
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Egg">Egg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border p-2 rounded"
                  placeholder="spicy, North Indian"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Price Score (1–5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.priceScore}
                    onChange={(e) => setFormData({ ...formData, priceScore: Number(e.target.value) })}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Health Score (1–5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.healthScore}
                    onChange={(e) => setFormData({ ...formData, healthScore: Number(e.target.value) })}
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}