import { useState } from 'react'
import toast from 'react-hot-toast'
import { useApi } from '../../hooks/useApi'

const MEALS = ['Breakfast', 'Lunch', 'Dinner']

export default function StudentSuggestDish() {
  const { request } = useApi()

  const [name, setName] = useState('')
  const [mealType, setMealType] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name || !mealType || !category) {
      toast.error('All fields are required')
      return
    }

    setLoading(true)

    try {
      // Convert comma-separated string to an array of strings for the backend
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean)

      // FIXED: Endpoint changed from '/student/suggest-dishes' to '/dishes' 
      // (assuming useApi hook automatically prepends '/api')
      await request('/dishes', 'POST', {
        name,
        mealType,
        category,
        tags: tagsArray
      })

      toast.success('Dish suggestion submitted for review')

      // reset
      setName('')
      setMealType('')
      setCategory('')
      setTags('')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to suggest dish')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Suggest a Dish</h1>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Dish name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <select
        className="border p-2 w-full mb-2"
        value={mealType}
        onChange={e => setMealType(e.target.value)}
      >
        <option value="">Select meal type</option>
        {MEALS.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Category (Veg / Non-Veg / Vegan etc.)"
        value={category}
        onChange={e => setCategory(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-4"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={e => setTags(e.target.value)}
      />

      <button
        disabled={loading}
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  )
}