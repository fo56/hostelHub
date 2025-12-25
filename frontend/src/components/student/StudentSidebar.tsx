import { NavLink } from 'react-router-dom'
import { BookOpen, UtensilsCrossed, AlertCircle } from 'lucide-react'

const links = [
  { label: 'Dashboard', to: '/student/dashboard', icon: BookOpen },
  { label: 'Mess Menu', to: '/student/mess-menu', icon: UtensilsCrossed },
  { label: 'Issues', to: '/student/issues', icon: AlertCircle }
]

export default function StudentSidebar() {
  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-4 font-bold text-xl border-b">
        HostelHub
      </div>

      <nav className="p-4 space-y-2">
        {links.map(link => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                  isActive ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
