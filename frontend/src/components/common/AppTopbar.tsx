import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, User, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import ProfileModal from './ProfileModal'

const adminLinks = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Menu Management', to: '/admin/menu' },
  { label: 'Dishes', to: '/admin/dishes' },
  { label: 'Issues', to: '/admin/issues' },
  { label: 'Settings', to: '/admin/settings' }
]

const studentLinks = [
  { label: 'Dashboard', to: '/student/dashboard' },
  { label: 'Menu Voting', to: '/student/voting/status' },
  { label: 'Issues', to: '/student/issues' }
]

export default function AppTopbar() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Auto-pop ProfileModal for onboarding if student name is unset (defaults to email)
  useEffect(() => {
    if (user && user.role === 'student' && user.name === user.email) {
      setIsProfileOpen(true)
    }
  }, [user?.name, user?.email, user?.role])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Determine which links to show based on role
  let activeLinks: { label: string; to: string }[] = []
  let homeRoute = '/'
  
  if (user?.role === 'admin') {
    activeLinks = adminLinks
    homeRoute = '/admin/dashboard'
  } else if (user?.role === 'student') {
    activeLinks = studentLinks
    homeRoute = '/student/dashboard'
  }

  const navLinks = activeLinks.map(link => (
    <NavLink
      key={link.to}
      to={link.to}
      className={({ isActive }) =>
        `px-2 sm:px-3 py-1.5 text-body-sm sm:text-body whitespace-nowrap font-medium rounded transition-colors ${
          isActive 
            ? 'bg-ink text-canvas' 
            : 'text-muted hover:text-ink hover:bg-surface'
        }`
      }
    >
      {link.label}
    </NavLink>
  ))

  const rightActions = isAuthenticated ? (
    <div className="flex items-center gap-2">
      {user?.role === 'student' && (
        <Button 
          variant="tertiary" 
          onClick={() => setIsProfileOpen(true)}
          className="text-muted hover:text-ink gap-2 px-2"
          title="Profile"
        >
          <User className="w-5 h-5" />
        </Button>
      )}
      
      <Button 
        variant="tertiary" 
        onClick={handleLogout}
        className={user?.role === 'admin' 
          ? "text-body-sm text-(--color-semantic-error) hover:bg-(--color-canvas) hover:text-(--color-semantic-error) h-8 px-3"
          : "text-muted hover:text-ink gap-2 px-2"}
        title="Logout"
      >
        <LogOut className="w-5 h-5 mr-2" />
        {user?.role === 'admin' && <span className="hidden sm:inline-block">Logout</span>}
      </Button>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  ) : null

  return (
    <header className="sticky top-0 z-40 w-full bg-canvas/80 backdrop-blur-md border-b border-hairline">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 w-full mx-auto">
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Toggle (Hamburger) */}
          {navLinks.length > 0 && (
            <button 
              className="md:hidden p-1.5 text-muted hover:text-ink hover:bg-surface rounded transition-colors -ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          {/* Logo / Brand */}
          <Link to={homeRoute} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-ink rounded flex items-center justify-center shrink-0">
              <span className="text-card-title text-canvas leading-none">H</span>
            </div>
            <span className="text-card-title tracking-tight text-ink hidden sm:inline-block">HostelHub</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        {navLinks.length > 0 && (
          <nav className="hidden md:flex flex-1 items-center gap-1 mx-6">
            {navLinks}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto -mr-2">
          <ThemeToggle />
          {rightActions}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && navLinks.length > 0 && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-canvas border-b border-hairline shadow-lg p-4 flex flex-col gap-2 z-50">
          {activeLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-3 text-body font-medium rounded transition-colors ${
                  isActive 
                    ? 'bg-ink text-canvas' 
                    : 'text-muted hover:text-ink hover:bg-surface-soft'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
