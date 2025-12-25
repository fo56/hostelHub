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
import StudentIssuesPage from '../pages/student/Issues'
import StudentLayout from '../pages/student/StudentLayout'

// Worker Pages
import WorkerDashboard from '../pages/worker/Dashboard'
import WorkerLayout from '../pages/worker/WorkerLayout'

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
      <Route path="/student" element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="mess-menu" element={<StudentMessMenu />} />
        <Route path="issues" element={<StudentIssuesPage />} />
      </Route>

      {/* ───── WORKER ───── */}
      <Route path="/worker" element={<WorkerLayout />}>
        <Route path="dashboard" element={<WorkerDashboard />} />
      </Route>

      {/* ───── DEFAULT ───── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
