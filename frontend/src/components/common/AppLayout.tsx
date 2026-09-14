import { Outlet } from 'react-router-dom'
import AppTopbar from './AppTopbar'

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <AppTopbar />
      <main className="flex-1 flex flex-col w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  )
}
