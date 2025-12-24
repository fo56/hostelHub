// components/admin/SidebarItem.tsx
import { useNavigate, useLocation } from 'react-router-dom'

interface Props {
  label: string
  path: string
  highlight?: boolean
}

export default function SidebarItem({ label, path, highlight }: Props) {
  const navigate = useNavigate()
  const location = useLocation()

  const active = location.pathname === path

  return (
    <div
      onClick={() => navigate(path)}
      className={`
        px-3 py-2 rounded cursor-pointer
        ${active ? 'bg-black text-white' : 'hover:bg-black/10'}
        ${highlight ? 'border border-black font-bold' : ''}
      `}
    >
      {label}
    </div>
  )
}
