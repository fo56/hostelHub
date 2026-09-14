import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-canvas flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <p className="text-body text-muted">
          A transparent, data-driven platform where students shape the food they eat. 
          Vote on dishes, suggest new ones, and see exactly how your hostel's menu comes to life.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button className="w-full sm:w-auto">
              Login to your account
            </Button>
          </Link>
          <Link to="/admin/register">
            <Button variant="secondary" className="w-full sm:w-auto">
              Register a new hostel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
