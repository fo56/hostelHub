import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AdminTopbar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b flex items-center justify-end px-6">
      <button
        onClick={handleLogout}
        className="px-4 py-1 border rounded hover:bg-gray-100"
      >
        Logout
      </button>
    </header>
  )
}
