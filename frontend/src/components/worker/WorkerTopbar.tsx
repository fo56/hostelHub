import { useAuth } from '../../hooks/useAuth'

import { useNavigate } from 'react-router-dom'

export default function WorkerTopbar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-black">Worker Portal</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="px-4 py-1 border rounded hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
