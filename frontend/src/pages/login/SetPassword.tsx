import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginToken, setLoginToken] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Try to get token from URL path or query params
    let token = searchParams.get('url')
    
    // If token is a full URL, extract just the token
    if (token) {
      const urlParts = token.split('/')
      token = urlParts[urlParts.length - 1]
    }
    
    if (token) {
      setLoginToken(token)
    } else {
      setError('Invalid or expired login link. Please request a new one.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!loginToken) {
      setError('Invalid login link')
      return
    }

    setLoading(true)

    try {
      const result = await authService.setPassword(loginToken, password)
      
      // Store tokens from setPassword response
      if (!result.user || !result.user.role) {
        throw new Error('Failed to authenticate after password setup')
      }
      
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      
      const role = result.user.role.toLowerCase()
      navigate(`/${role}/dashboard`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-1">HostelHub</h1>
          <p className="text-black/60">Set Your Password</p>
        </div>

        <div className="p-3 border-2 border-black/20 rounded-lg bg-black/5">
          <p className="text-sm">
            This is your first login. Please set a password to secure your account.
          </p>
        </div>

        {error && (
          <div className="p-3 border-2 border-black/30 rounded-lg bg-black/5 text-sm text-black">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoFocus
              className="w-full px-4 py-2 border-2 border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            />
            <p className="text-xs text-black/60 mt-1">
              Use uppercase, lowercase, numbers, and symbols for strength
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              className="w-full px-4 py-2 border-2 border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white font-semibold rounded-lg hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition disabled:opacity-50"
          >
            {loading ? 'Setting Password...' : 'Set Password & Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
