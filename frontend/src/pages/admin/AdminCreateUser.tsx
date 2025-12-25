import { useState } from 'react'
import { useApi } from '../../hooks/useApi'

export default function AdminCreateUser() {
  const { request } = useApi()

  const [form, setForm] = useState<any>({ role: 'STUDENT' })
  const [loading, setLoading] = useState(false)

  // Modal state
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loginURL, setLoginURL] = useState<string | null>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [createdUser, setCreatedUser] = useState<any>(null)

  const submit = async (e: any) => {
    e.preventDefault()

    try {
      setLoading(true)

      const res = await request('/admin/users', 'POST', form)

      setQrCode(res.qrCode)
      setLoginURL(res.loginURL)
      setQrToken(res.qrToken)
      setCreatedUser(res.user)

      setForm({ role: 'STUDENT' })
    } catch (err: any) {
      alert(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold mb-4">Create User</h1>

        <form onSubmit={submit} className="space-y-3 max-w-md">
          <input
            className="border p-2 w-full"
            placeholder="Name"
            required
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="border p-2 w-full"
            placeholder="Email (optional)"
            onChange={e => setForm({ ...form, email: e.target.value })}
          />

          <select
            className="border p-2 w-full"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="STUDENT">Student</option>
            <option value="WORKER">Worker</option>
          </select>

          {form.role === 'STUDENT' && (
            <input
              className="border p-2 w-full"
              placeholder="Room No"
              required
              onChange={e => setForm({ ...form, roomNo: e.target.value })}
            />
          )}

          {form.role === 'WORKER' && (
            <input
              className="border p-2 w-full"
              placeholder="Job Type"
              required
              onChange={e => setForm({ ...form, jobType: e.target.value })}
            />
          )}

          <button
            disabled={loading}
            className="bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      {/* ───────── MODAL ───────── */}
      {qrCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-center">
              User Created Successfully
            </h2>

            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="User QR Code"
                className="w-44 h-44"
              />
            </div>

            {createdUser && (
              <div className="text-center text-sm">
                <strong>{createdUser.name}</strong>
                <br />
                {createdUser.email}
              </div>
            )}

            {/* Login URL */}
            {loginURL && (
              <div className="border p-2 text-sm break-all">
                <p className="font-medium">Login URL</p>
                <p className="text-gray-600">{loginURL}</p>
                <button
                  onClick={() => copy(loginURL)}
                  className="text-blue-600 text-xs mt-1"
                >
                  Copy
                </button>
              </div>
            )}

            {/* QR Token */}
            {qrToken && (
              <div className="border p-2 text-sm break-all">
                <p className="font-medium">QR Token</p>
                <p className="text-gray-600">{qrToken}</p>
                <button
                  onClick={() => copy(qrToken)}
                  className="text-blue-600 text-xs mt-1"
                >
                  Copy
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <a
                href={qrCode}
                download="user-qr.png"
                className="border px-3 py-2 text-center w-full"
              >
                Download QR
              </a>

              <button
                onClick={() => {
                  setQrCode(null)
                  setLoginURL(null)
                  setQrToken(null)
                  setCreatedUser(null)
                }}
                className="bg-black text-white px-3 py-2 w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
