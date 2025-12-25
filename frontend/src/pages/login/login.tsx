import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/contexts/AuthContextType'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, GraduationCap, Wrench, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '@/services/authService'

export default function Login() {
  const navigate = useNavigate()
  const { login, error: authError } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<'email' | 'qr'>('email')
  const [credentialsSaved, setCredentialsSaved] = useState(false)

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCreds = await authService.getSavedCredentials()
        if (savedCreds) {
          setEmail(savedCreds.email)
          setPassword(savedCreds.password)
          setCredentialsSaved(true)
        }
      } catch (err) {
        console.debug('No saved credentials found')
      }
    }
    
    loadSavedCredentials()
  }, [])

  const roles: { id: UserRole; label: string; icon: typeof Users }[] = [
    { id: 'admin', label: 'Admin', icon: Users },
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'worker', label: 'Worker', icon: Wrench },
  ]

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      return
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setAdminLoading(true)
    try {
      if (selectedRole === 'admin') {
        await login({ email, password })
      } else {
        await authService.loginUser(email, password, selectedRole.toUpperCase() as 'STUDENT' | 'WORKER')
      }
      navigate(`/${selectedRole}/dashboard`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      
      // Provide specific error messages
      if (errorMessage.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check and try again.')
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

  const handleQRLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!qrToken.trim()) {
      setError('Please enter or scan a QR token')
      return
    }
    setQrLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/auth/login-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrToken }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        const errorMsg = data.message || data.error || 'QR login failed'
        throw new Error(errorMsg)
      }
      
      if (data.setPasswordURL) {
        navigate(`/set-password/${data.userId}?url=${encodeURIComponent(data.setPasswordURL)}`)
        return
      }
      
      if (!data.user || !data.user.role) {
        throw new Error('Invalid authentication response. Missing user information.')
      }
      
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      navigate(`/${data.user.role.toLowerCase()}/dashboard`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'QR login failed'
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('not found')) {
        setError('Invalid QR code. Please ask your administrator for a new one.')
      } else if (errorMessage.includes('already set')) {
        setError('This account has already been initialized. Please log in with your password.')
      } else {
        setError(errorMessage || 'An error occurred. Please try again.')
      }
    } finally {
      setQrLoading(false)
    }
  }

  const errorDisplay = error || authError;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
            <h1 className="text-2xl font-bold">Hostel Hub</h1>
          </div>
          <h2 className="text-xl font-bold mb-1">Welcome back</h2>
          <p className="text-black/60 text-sm">Sign in to your account</p>
        </div>

        <div className="space-y-2">
          <Label>Select your role</Label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedRole === role.id
                      ? 'border-black bg-black text-white'
                      : 'border-black/20 text-black'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{role.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {credentialsSaved && !error && (
          <div className="p-4 border-2 border-green-300 rounded-lg bg-green-50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-900 font-medium">Saved credentials detected</p>
              <p className="text-xs text-green-800 mt-1">Your login information has been auto-filled</p>
            </div>
          </div>
        )}

        {errorDisplay && (
          <div className="p-4 border-2 border-red-300 rounded-lg bg-red-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-900 font-medium">Login failed</p>
              <p className="text-sm text-red-800 mt-1">{errorDisplay}</p>
            </div>
          </div>
        )}

        {selectedRole === 'admin' ? (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@hostel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={adminLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={adminLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={adminLoading}
                  className="px-3 border-2 border-black/20 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={adminLoading}>
              {adminLoading ? 'Signing in...' : 'Sign in as Admin'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-black/10">
              <button
                onClick={() => { setLoginMode('email'); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  loginMode === 'email'
                    ? 'border-b-2 border-black text-black'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => { setLoginMode('qr'); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  loginMode === 'qr'
                    ? 'border-b-2 border-black text-black'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                QR Code
              </button>
            </div>

            {loginMode === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="student-email" className="text-sm">Email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="your.email@hostel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={adminLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="student-password" className="text-sm">Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="student-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={adminLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={adminLoading}
                      className="px-3 border-2 border-black/20 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={adminLoading}>
                  {adminLoading ? 'Signing in...' : `Sign in as ${roles.find(r => r.id === selectedRole)?.label}`}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleQRLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="qr-token" className="text-sm">Scan or Paste QR Token</Label>
                  <Input
                    id="qr-token"
                    type="text"
                    placeholder="Paste your QR token or scan"
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    disabled={qrLoading}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={qrLoading}>
                  {qrLoading ? 'Verifying...' : `Sign in as ${roles.find(r => r.id === selectedRole)?.label}`}
                </Button>
                <p className="text-xs text-center text-black/60">
                  Don't have a token? Ask your admin for a QR code
                </p>
              </form>
            )}
          </div>
        )}


        <p className="text-center text-xs text-black/60">
          First time?{' '}
          <button 
            onClick={() => navigate('/admin/register')}
            className="font-medium underline hover:text-black"
          >
            Register Hostel
          </button>
        </p>
      </div>
    </div>
  )
}
