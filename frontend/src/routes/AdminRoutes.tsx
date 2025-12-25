import { Navigate, Route } from 'react-router-dom'

// Layout
import AdminLayout from '../pages/admin/AdminLayout'

// Pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminCreateUser from '../pages/admin/AdminCreateUser'
import AdminVoting from '../pages/admin/AdminVoting'
import AdminMessMenu from '../pages/admin/AdminMessMenu'
import AdminReviews from '../pages/admin/AdminReviews'
import AdminIssues from '../pages/admin/AdminIssues'

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    {/* This renders at /admin/dashboard */}
    <Route path="dashboard" element={<AdminDashboard />} /> 
    
    {/* These render at /admin/users, /admin/menu, etc. */}
    <Route path="users" element={<AdminUsers />} />
    <Route path="create-user" element={<AdminCreateUser />} />
    <Route path="voting" element={<AdminVoting />} />
    <Route path="menu" element={<AdminMessMenu />} />
    <Route path="reviews" element={<AdminReviews />} />
    <Route path="issues" element={<AdminIssues />} />
    
    {/* Optional: Redirect /admin to /admin/dashboard */}
    <Route index element={<Navigate to="dashboard" replace />} />
  </Route>
)
