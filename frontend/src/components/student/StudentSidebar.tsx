import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Dashboard', to: '/student' },
  { label: 'Mess Voting', to: '/student/voting/status' },
  { label: 'Mess Menu', to: '/student/menu' },
  { label: 'Reviews', to: '/student/reviews' },
  { label: 'Suggest Dish', to: '/student/suggest-dishes' },
  { label: 'Issues', to: '/student/issues' }
]

export default function StudentSidebar() {
  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-4 font-bold text-xl border-b">
        HostelHub
      </div>

      <nav className="p-4 space-y-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded ${
                isActive ? 'bg-black text-white' : 'hover:bg-gray-200'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
