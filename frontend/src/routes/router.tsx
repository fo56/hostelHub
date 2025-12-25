import { Routes, Route, Navigate } from 'react-router-dom'

// Auth Pages
import Login from '../pages/login/login'
import QRLogin from '../pages/login/QRLogin'
import LoginLink from '../pages/login/LoginLink'
import SetPassword from '../pages/login/SetPassword'
import AdminRegister from '../pages/admin/AdminRegister'

// Student Pages
import StudentDashboard from '../pages/student/Dashboard'
import StudentMessMenu from '../pages/student/MessMenu'

// Worker Pages
import WorkerDashboard from '../pages/worker/Dashboard'
import WorkerAssignedIssue from '../pages/worker/AssignedIssue'

// Admin route tree
import { adminRoutes } from './AdminRoutes'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ───── AUTH ───── */}
      <Route path="/login" element={<Login />} />
      <Route path="/qr-login" element={<QRLogin />} />
      <Route path="/login-link" element={<LoginLink />} />
      <Route path="/set-password/:userId" element={<SetPassword />} />
      <Route path="/admin/register" element={<AdminRegister />} />

      {/* ───── ADMIN ───── */}
      {adminRoutes}

      {/* ───── STUDENT ───── */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/mess-menu" element={<StudentMessMenu />} />

      {/* ───── WORKER ───── */}
      <Route path="/worker/dashboard" element={<WorkerDashboard />} />
      <Route path="/worker/assigned-issues" element={<WorkerAssignedIssue />} />

      {/* ───── DEFAULT ───── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
