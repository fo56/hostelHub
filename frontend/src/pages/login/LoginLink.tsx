import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'

export default function LoginLink() {
  const [loginLink, setLoginLink] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!loginLink.trim()) {
      setError('Please enter or paste the login link')
      return
    }

    setLoading(true)

    try {
      // Extract the token from the link
      const urlParts = loginLink.split('/')
      const token = urlParts[urlParts.length - 1]

      // Try to login via the URL
      const result = await authService.loginViaURL(token)
      
      if (!result.user || !result.user.role) {
        throw new Error('Invalid authentication response. Please try again.')
      }
      
      const userRole = result.user.role.toLowerCase()
      navigate(`/${userRole}/dashboard`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-1">HostelHub</h1>
          <p className="text-black/60 text-sm">Login with Your Link</p>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="text-sm text-black hover:underline"
        >
          ← Back
        </button>

        <div className="p-4 border-2 border-black/20 rounded-lg bg-black/5">
          <p className="text-sm text-black/70">
            Paste the login link sent to your email.
          </p>
        </div>

        {error && (
          <div className="p-3 border-2 border-black/30 rounded-lg bg-black/5 text-sm text-black">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="loginLink" className="block text-sm font-medium mb-2">
              Login Link
            </label>
            <textarea
              id="loginLink"
              value={loginLink}
              onChange={(e) => setLoginLink(e.target.value)}
              placeholder="Paste the complete link from your email"
              required
              autoFocus
              rows={4}
              className="w-full px-4 py-2 border-2 border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white font-semibold rounded-lg hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </form>

        <p className="text-xs text-black/60 text-center">
          Links expire after 24 hours
        </p>
      </div>
    </div>
  )
}
