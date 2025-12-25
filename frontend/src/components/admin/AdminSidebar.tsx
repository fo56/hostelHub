import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Create User', to: '/admin/create-user' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Mess Voting', to: '/admin/voting' },
  { label: 'Mess Menu', to: '/admin/menu' },
  { label: 'Reviews', to: '/admin/reviews' },
  { label: 'Issues', to: '/admin/issues' }
]

export default function AdminSidebar() {
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
