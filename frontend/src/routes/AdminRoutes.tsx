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
import AdminDishApprovals from '../pages/admin/AdminDishApprovals'
export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route path="dashboard" element={<AdminDashboard />} /> 
    <Route path="users" element={<AdminUsers />} />
    <Route path="create-user" element={<AdminCreateUser />} />
    <Route path="voting" element={<AdminVoting />} />
    <Route path="menu" element={<AdminMessMenu />} />
    <Route path="reviews" element={<AdminReviews />} />
    <Route path="issues" element={<AdminIssues />} />
    <Route path="dishes" element={<AdminDishApprovals />} />
    
    <Route index element={<Navigate to="dashboard" replace />} />
  </Route>
)
