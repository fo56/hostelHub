import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '@/services/auth.service'

export default function Login() {
  const navigate = useNavigate()
  const { login, error: authError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [credentialsSaved, setCredentialsSaved] = useState(false)

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCreds = await authService.getSavedCredentials()
        if (savedCreds) {
          setUsername(savedCreds.email) // using the standard email field in credentials for our username
          setPassword(savedCreds.password)
          setCredentialsSaved(true)
        }
      } catch {
        console.debug('No saved credentials found')
      }
    }

    loadSavedCredentials()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password')
      return
    }

    setAdminLoading(true)
    try {
      const user = await login({ email: username, password })
      navigate(`/${user.role.toLowerCase()}/dashboard`)
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Login failed'

      if (errorMessage.includes('Invalid username or password')) {
        setError('Invalid username or password. Please check and try again.')
      } else if (errorMessage.includes('not found')) {
        setError('User account not found. Please contact your administrator.')
      } else if (errorMessage.includes('timeout')) {
        setError('Connection timeout. Please check your internet connection.')
      } else {
        setError(errorMessage || 'An error occurred during login. Please try again.')
      }
    } finally {
      setAdminLoading(false)
    }
  }



  const errorDisplay = error || authError;

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-12 md:justify-center md:pt-0 md:-mt-16">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-headline text-ink mb-1">Sign in</h1>
          <p className="text-muted text-body-sm">Sign in to your account</p>
        </div>



        {credentialsSaved && !error && (
          <div className="p-4 border border-(--color-semantic-success) rounded bg-(--color-canvas) flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-(--color-semantic-success) shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm text-(--color-semantic-success)">Saved credentials detected</p>
              <p className="text-caption text-(--color-semantic-success) mt-1">Your login information has been auto-filled</p>
            </div>
          </div>
        )}

        {errorDisplay && (
          <div className="p-4 border border-(--color-semantic-error) rounded bg-(--color-canvas) flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-(--color-semantic-error) shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm text-(--color-semantic-error)">Login failed</p>
              <p className="text-body-sm text-(--color-semantic-error) mt-1">{errorDisplay}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username" className="text-body-sm">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={adminLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  key={showPassword ? 'visible' : 'hidden'}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={adminLoading}
                  autoComplete={showPassword ? 'current-password' : 'new-password'}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-ink transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={adminLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={adminLoading}>
              {adminLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>


        <p className="text-center text-body-sm text-muted">
          First time?{' '}
          <Button
            variant="tertiary"
            onClick={() => navigate('/admin/register')}
            className="p-0 underline hover:text-ink min-h-0"
          >
            Register Hostel
          </Button>
        </p>
      </div>
    </div>
  )
}
