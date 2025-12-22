import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/contexts/AuthContextType'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, GraduationCap, Wrench, Eye, EyeOff } from 'lucide-react'
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

  const roles: { id: UserRole; label: string; icon: typeof Users }[] = [
    { id: 'admin', label: 'Admin', icon: Users },
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'worker', label: 'Worker', icon: Wrench },
  ]

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password')
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
      setError(errorMessage)
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
        body: JSON.stringify({ qrToken }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'QR login failed')
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
      setError(errorMessage)
    } finally {
      setQrLoading(false)
    }
  }

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

        {(error || authError) && (
          <div className="p-4 border-2 border-red-300 rounded-lg bg-red-50">
            <p className="text-sm text-red-900 font-medium">Error:</p>
            <p className="text-sm text-red-800 mt-1">{error || authError}</p>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 border-2 border-black/20 rounded-lg hover:bg-black/5 transition-colors"
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-3 border-2 border-black/20 rounded-lg hover:bg-black/5 transition-colors"
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
            className="font-medium underline"
          >
            Register Hostel
          </button>
        </p>
      </div>
    </div>
  )
}
