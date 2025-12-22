import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'

export default function QRLogin() {
  const [qrToken, setQrToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [manualInput, setManualInput] = useState(false)
  const navigate = useNavigate()
  const cameraRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!manualInput) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [manualInput])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Unable to access camera. Use manual input instead.')
      setManualInput(true)
    }
  }

  const stopCamera = () => {
    if (cameraRef.current?.srcObject) {
      const tracks = (cameraRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  const handleQRLogin = async (token: string) => {
    if (!token.trim()) {
      setError('Please scan a QR code or enter the code manually')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authService.loginViaQR(token)

      if ('setPasswordURL' in response) {
        // First login - redirect to set password
        navigate(`/set-password/${response.userId}?url=${encodeURIComponent(response.setPasswordURL)}`)
      } else {
        // Already has password - redirect to dashboard
        if (!response.user || !response.user.role) {
          throw new Error('Invalid authentication response. Please try again.')
        }
        const role = response.user.role.toLowerCase()
        navigate(`/${role}/dashboard`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleQRLogin(qrToken)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-1">HostelHub</h1>
          <p className="text-black/60 text-sm">Scan QR Code to Login</p>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="text-sm text-black hover:underline"
        >
          ← Back
        </button>

        {error && (
          <div className="p-3 border-2 border-black/30 rounded-lg bg-black/5 text-sm text-black">
            {error}
          </div>
        )}

        {!manualInput ? (
          <div className="space-y-3">
            <div className="bg-black/5 rounded-lg overflow-hidden border-2 border-black/20">
              <video
                ref={cameraRef}
                autoPlay
                playsInline
                className="w-full h-80 object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setManualInput(true)
                stopCamera()
              }}
              className="w-full py-2 bg-black/20 text-black font-semibold rounded-lg hover:bg-black/30 transition"
            >
              Enter Code Manually
            </button>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label htmlFor="qrToken" className="block text-sm font-medium mb-2">
                QR Code or Token
              </label>
              <input
                type="text"
                id="qrToken"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Paste QR code token here"
                required
                autoFocus
                className="w-full px-4 py-2 border-2 border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-black text-white font-semibold rounded-lg hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Login'}
            </button>

            <button
              type="button"
              onClick={() => {
                setManualInput(false)
                setQrToken('')
                setError('')
                startCamera()
              }}
              className="w-full py-2 bg-black/20 text-black font-semibold rounded-lg hover:bg-black/30 transition"
            >
              Back to Camera
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
