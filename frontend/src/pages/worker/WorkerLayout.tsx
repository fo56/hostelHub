import { Outlet } from 'react-router-dom'
import WorkerTopbar from '../../components/worker/WorkerTopbar'

export default function WorkerLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <WorkerTopbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
