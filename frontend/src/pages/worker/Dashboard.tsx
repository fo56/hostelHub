import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { CheckCircle2, AlertCircle, Clock, TrendingUp, X } from 'lucide-react'

interface Issue {
  _id: string
  category: string
  priority: string
  status: string
  description: string
  raisedBy: {
    email: string
  }
}

interface Stats {
  openIssues: number
  solvedIssues: number
  inProgressIssues: number
  averageResolutionTime: string
}

export default function WorkerDashboard() {
  const { request } = useApi()
  const [stats, setStats] = useState<Stats>({
    openIssues: 0,
    solvedIssues: 0,
    inProgressIssues: 0,
    averageResolutionTime: 'N/A'
  })
  const [activeIssues, setActiveIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchIssues()
  }, [request])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await request('/issues/assigned', 'GET')
      
      if (response && (response.issues || Array.isArray(response))) {
        const allIssues = Array.isArray(response) ? response : (response.issues || [])

        const openCount = allIssues.filter((i: Issue) => i.status === 'OPEN').length
        const solvedCount = allIssues.filter((i: Issue) => i.status === 'RESOLVED').length
        const inProgressCount = allIssues.filter((i: Issue) => i.status === 'IN_PROGRESS').length

        setStats({
          openIssues: openCount,
          solvedIssues: solvedCount,
          inProgressIssues: inProgressCount,
          averageResolutionTime: '2.5 days'
        })

        setActiveIssues(allIssues.filter((i: Issue) => i.status === 'OPEN' || i.status === 'IN_PROGRESS'))
      } else {
        setActiveIssues([])
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClick = (issue: Issue) => {
    setSelectedIssue(issue)
    setNote('')
    setShowModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedIssue) return

    try {
      setUpdating(true)
      await request(`/issues/${selectedIssue._id}/status`, 'PATCH', {
        status: 'RESOLVED',
        resolverNote: note
      })
      setShowModal(false)
      setNote('')
      await fetchIssues()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black">Worker Dashboard</h1>
        <p className="text-gray-600 mt-2">Track and resolve your assigned issues</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-black" />
            <div>
              <p className="text-sm text-gray-600">Open Issues</p>
              <p className="text-3xl font-bold text-black">{stats.openIssues}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-black" />
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-black">{stats.inProgressIssues}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-black" />
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-black">{stats.solvedIssues}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-black" />
            <div>
              <p className="text-sm text-gray-600">Avg Resolution</p>
              <p className="text-2xl font-bold text-black">{stats.averageResolutionTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Issues */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Active Issues</h2>
        </div>

        {activeIssues.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No active issues. Great work!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activeIssues.map(issue => (
              <div key={issue._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-black text-lg">{issue.category}</h3>
                    <p className="text-gray-600 mt-2">{issue.description}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className={`text-sm px-3 py-1 rounded font-medium border ${
                        issue.priority === 'URGENT' ? 'border-black bg-black text-white' :
                        issue.priority === 'HIGH' ? 'border-gray-700 bg-gray-700 text-white' :
                        issue.priority === 'MEDIUM' ? 'border-gray-600 bg-gray-600 text-white' :
                        'border-gray-400 text-gray-700'
                      }`}>
                        {issue.priority}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded font-medium border ${
                        issue.status === 'IN_PROGRESS' ? 'border-black bg-black text-white' :
                        'border-gray-400 text-gray-700'
                      }`}>
                        {issue.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}
                      </span>
                      <span className="text-sm text-gray-600">
                        Reported by: {issue.raisedBy?.email || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateClick(issue)}
                    className="px-6 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showModal && selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-black">Resolve Issue</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Issue</p>
                <p className="text-black font-medium mt-1">{selectedIssue.category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Resolution Note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes about how this issue was resolved..."
                  className="w-full mt-2 p-3 border border-gray-300 rounded-lg font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-black rounded font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
