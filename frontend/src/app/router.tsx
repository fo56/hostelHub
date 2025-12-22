import type { ReactNode } from 'react'

// Login Pages
import Login from '../pages/login/login'
import QRLogin from '../pages/login/QRLogin'
import LoginLink from '../pages/login/LoginLink'
import SetPassword from '../pages/login/SetPassword'
import AdminRegister from '../pages/admin/Register'

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard'
import AdminIssues from '../pages/admin/Issues'
import AdminUsers from '../pages/admin/Users'

// Student Pages
import StudentDashboard from '../pages/student/Dashboard'
import StudentMessMenu from '../pages/student/MessMenu'

// Worker Pages
import WorkerDashboard from '../pages/worker/Dashboard'
import WorkerAssignedIssue from '../pages/worker/AssignedIssue'

export interface Route {
  path: string
  element: ReactNode
  name: string
  role?: 'admin' | 'student' | 'worker'
}

export const routes: Route[] = [
  // Auth Routes
  {
    path: '/login',
    element: <Login />,
    name: 'Login',
  },
  {
    path: '/qr-login',
    element: <QRLogin />,
    name: 'QR Login',
  },
  {
    path: '/login-link',
    element: <LoginLink />,
    name: 'Login Link',
  },
  {
    path: '/set-password/:userId',
    element: <SetPassword />,
    name: 'Set Password',
  },
  {
    path: '/admin/register',
    element: <AdminRegister />,
    name: 'Admin Register',
  },

  // Admin Routes
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
    name: 'Admin Dashboard',
    role: 'admin',
  },
  {
    path: '/admin/issues',
    element: <AdminIssues />,
    name: 'Issues',
    role: 'admin',
  },
  {
    path: '/admin/users',
    element: <AdminUsers />,
    name: 'Users',
    role: 'admin',
  },

  // Student Routes
  {
    path: '/student/dashboard',
    element: <StudentDashboard />,
    name: 'Student Dashboard',
    role: 'student',
  },
  {
    path: '/student/mess-menu',
    element: <StudentMessMenu />,
    name: 'Mess Menu',
    role: 'student',
  },

  // Worker Routes
  {
    path: '/worker/dashboard',
    element: <WorkerDashboard />,
    name: 'Worker Dashboard',
    role: 'worker',
  },
  {
    path: '/worker/assigned-issues',
    element: <WorkerAssignedIssue />,
    name: 'Assigned Issues',
    role: 'worker',
  },
]

export const getRoutesByRole = (role: string) => {
  return routes.filter((route) => route.role === role)
}
