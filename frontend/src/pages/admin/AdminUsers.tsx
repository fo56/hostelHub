import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'

interface User {
  _id: string
  name: string
  email: string
  role: 'STUDENT' | 'WORKER'
  roomNo?: string
  jobType?: string
  isActive: boolean
  qrToken?: string
}

export default function AdminUsers() {
  const { request } = useApi()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    const res = await request('/admin/users')
    setUsers(res.users)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
  }

  // DELETE USER
  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this user?'
    )
    if (!confirmed) return

    try {
      await request(`/admin/users/${userId}`, 'DELETE')
      setUsers(users.filter(u => u._id !== userId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    }
  }

  const shorten = (token?: string) => {
    if (!token) return '—'
    return `${token.slice(0, 6)}…${token.slice(-4)}`
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>

      {loading && <p>Loading users...</p>}

      {!loading && users.length === 0 && (
        <p className="text-gray-500">No users found</p>
      )}

      {!loading && users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border bg-white">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-center">Role</th>
                <th className="p-2 text-center">Details</th>
                <th className="p-2 text-center">QR Token</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b">
                  <td className="p-2">{user.name}</td>

                  <td className="p-2 text-gray-600">
                    {user.email}
                  </td>

                  <td className="p-2 text-center">
                    {user.role}
                  </td>

                  <td className="p-2 text-sm text-center">
                    {user.role === 'STUDENT'
                      ? `Room ${user.roomNo}`
                      : user.jobType}
                  </td>

                  {/* QR TOKEN COLUMN */}
                  <td className="p-2 text-center text-sm font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <span>{shorten(user.qrToken)}</span>
                      {user.qrToken && (
                        <button
                          onClick={() => copy(user.qrToken!)}
                          className="text-blue-600 text-xs"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="p-2 text-center">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </td>

                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
