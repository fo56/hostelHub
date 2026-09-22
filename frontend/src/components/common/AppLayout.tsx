import { Outlet, useLocation } from 'react-router-dom'
import AppTopbar from './AppTopbar'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <AppTopbar />
      <main key={location.pathname} className="flex-1 flex flex-col w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
