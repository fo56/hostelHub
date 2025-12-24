// components/admin/Sidebar.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useMessService } from '../../hooks/useMessService'
import SidebarItem from './SidebarItem'

export default function Sidebar() {
  const { logout } = useAuth()
  const { getVotingStatus } = useMessService()

  const [votingEnded, setVotingEnded] = useState(false)
  const [notified, setNotified] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getVotingStatus()
        setVotingEnded(status.ended)
      } catch (err) {
        console.error('Voting status fetch failed')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (votingEnded && !notified) {
      alert('Mess voting has ended. You can now generate the mess menu.')
      setNotified(true)
    }
  }, [votingEnded])

  return (
    <aside className="w-64 border-r border-black/20 p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-6">HostelHub</h1>

      <nav className="flex-1 space-y-1">
        <SidebarItem label="Dashboard" path="/admin/dashboard" />
        <SidebarItem label="Create User" path="/admin/create-user" />
        <SidebarItem label="Users" path="/admin/users" />
        <SidebarItem label="Open Mess Voting" path="/admin/mess-voting" />
        <SidebarItem label="Reviews" path="/admin/reviews" />
        <SidebarItem label="Issues" path="/admin/issues" />

        {votingEnded && (
          <SidebarItem
            label="Generate Mess Menu"
            path="/admin/generate-menu"
            highlight
          />
        )}
      </nav>

      <button
        onClick={logout}
        className="mt-6 text-left font-semibold text-red-600 hover:underline"
      >
        Logout
      </button>
    </aside>
  )
}
