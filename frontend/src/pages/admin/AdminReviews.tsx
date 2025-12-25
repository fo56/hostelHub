import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'

interface Review {
  _id: string
  rating: number
  comment: string
  dishId: {
    name: string
  }
  createdAt: string
}

export default function AdminReviews() {
  const { request } = useApi()

  const [reviews, setReviews] = useState<Review[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await request(
          `/admin/reviews?page=${page}&limit=10`
        )

        setReviews(res.reviews)
        setTotalPages(res.pagination.totalPages)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch reviews')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [page])

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Meal Reviews</h1>

      {/* Loading */}
      {loading && <p className="text-gray-500">Loading reviews...</p>}

      {/* Error */}
      {error && (
        <p className="text-red-600 border p-2 mb-4">
          {error}
        </p>
      )}

      {/* Empty state */}
      {!loading && reviews.length === 0 && (
        <p className="text-gray-500">
          No reviews found.
        </p>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r._id} className="border p-3 bg-white rounded">
            <div className="flex justify-between items-center">
              <p className="font-semibold">
                {r.dishId?.name ?? 'Unknown Dish'}
              </p>
              <span className="text-sm text-gray-500">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="text-sm">
              Rating: <span className="font-medium">{r.rating}/5</span>
            </p>

            {r.comment && (
              <p className="text-gray-600 mt-1">
                {r.comment}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border disabled:opacity-40"
          >
            Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
