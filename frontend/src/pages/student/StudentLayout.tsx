import { Outlet } from 'react-router-dom'
import StudentSidebar from '../../components/student/StudentSidebar'
import StudentTopbar from '../../components/student/StudentTopbar'

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <StudentSidebar />

      <div className="flex flex-col flex-1">
        <StudentTopbar />
        <main className="p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
