import { useAuth } from '../../hooks/useAuth'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function WorkerTopbar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-black">Worker Portal</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </header>
  )
}
