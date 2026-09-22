import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) {
    if (error?.message?.includes('dynamically imported module') || error?.name === 'ChunkLoadError' || error?.message?.includes('fetch')) {
      window.location.reload();
    }
  }
  render() {
    if (this.state.hasError) return <div className="p-8 text-center text-muted">Failed to load page content. Please <button onClick={() => window.location.reload()} className="underline text-ink hover:text-ink/80 transition-colors">refresh</button>.</div>;
    return this.props.children;
  }
}


// App Layout (Keep synchronous)
import AppLayout from '../components/common/AppLayout'

// Lazy Load Pages
const Login = lazy(() => import('../pages/Login'))
const Home = lazy(() => import('../pages/Home'))
const AdminRegister = lazy(() => import('../pages/admin/AdminRegister'))


const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'))
const AdminMessMenu = lazy(() => import('../pages/admin/AdminMessMenu'))
const AdminIssues = lazy(() => import('../pages/admin/AdminIssues'))
const AdminDishes = lazy(() => import('../pages/admin/AdminDishes'))
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'))

const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard'))
const StudentVoting = lazy(() => import('../pages/student/StudentVoting'))
const StudentIssues = lazy(() => import('../pages/student/StudentIssues'))
const StudentStats = lazy(() => import('../pages/student/StudentStats'))

// Minimalist fallback loader
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-(--color-muted)">
    <div className="w-5 h-5 border-2 border-(--color-hairline) border-t-(--color-ink) rounded-full animate-spin"></div>
  </div>
)

// Wrapper for routes that should only be accessible when NOT logged in (e.g. Login, Home)
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }
  return <>{children}</>
}

// Wrapper for routes that require authentication
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()
  
  if (isLoading) return <PageLoader />
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }
  
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ───── PUBLIC / AUTH ───── */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<PublicOnlyRoute><Home /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/admin/register" element={<PublicOnlyRoute><AdminRegister /></PublicOnlyRoute>} />
          </Route>

          {/* ───── ADMIN ───── */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} /> 
            <Route path="users" element={<AdminUsers />} />
            <Route path="menu" element={<AdminMessMenu />} />
            <Route path="issues" element={<AdminIssues />} />
            <Route path="dishes" element={<AdminDishes />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* ───── STUDENT ───── */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><AppLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<StudentDashboard />} /> 
            <Route path="voting/status" element={<StudentVoting />} />
            <Route path="issues" element={<StudentIssues />} />
            <Route path="stats" element={<StudentStats />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>


          {/* ───── DEFAULT ───── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
