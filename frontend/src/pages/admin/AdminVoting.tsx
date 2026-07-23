import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'

export default function AdminVoting() {
  const { request } = useApi()
  const { user } = useAuth()
  const hostelId = user?.hostelId || ''

  const [totalVoters, setTotalVoters] = useState<number>(0)
  const [targetWeek, setTargetWeek] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    // Connect to Socket.io server
    const socket: Socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000')

    socket.emit('join_hostel_room', hostelId)

    // Receive live updates whenever any student updates their vote
    socket.on('VOTES_UPDATED', (data: { totalVoters: number }) => {
      setTotalVoters(data.totalVoters)
    })

    // Fetch initial stats
    request('/admin/menu/voting/stats').then((res) => {
      if (res) setTotalVoters(res.totalVoters)
    })

    return () => {
      socket.disconnect()
    }
  }, [hostelId])

  const handleGenerateMenu = async () => {
    setLoading(true)
    try {
      await request('/admin/menu/generate', 'POST', { week: targetWeek })
      setToast({ message: `Menu for Week ${targetWeek} generated! Review it under the Menu tab.`, type: 'success' })
    } catch (e: any) {
      setToast({ message: e.message || 'Error generating menu', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {toast && (
        <div className={`p-4 rounded-lg shadow-md text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Generate Mess Menu</h1>
        <p className="text-gray-600 text-sm">
          Generate menus on demand using active student dish choices.
        </p>
      </header>

      {/* LIVE VOTE STATS CARD */}
      <div className="bg-white border-2 border-black p-6 rounded shadow-md flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase">Active Participating Students</h3>
          <p className="text-4xl font-black text-black mt-1">{totalVoters}</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          LIVE SYNC
        </span>
      </div>

      {/* GENERATION CONTROL */}
      <div className="p-6 border-2 border-black bg-white space-y-4 rounded">
        <h2 className="font-bold uppercase text-sm border-b pb-2">Menu Setup</h2>
        
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Target Week Number</label>
          <input
            type="number"
            className="w-full border-2 border-black p-2 rounded outline-none focus:bg-yellow-50 font-bold"
            value={targetWeek}
            onChange={(e) => setTargetWeek(Number(e.target.value))}
          />
        </div>

        <button
          onClick={handleGenerateMenu}
          disabled={loading}
          className="w-full bg-black hover:bg-gray-800 text-white p-3 font-bold uppercase rounded transition disabled:bg-gray-300"
        >
          {loading ? 'Generating Menu...' : 'Generate Menu Now'}
        </button>
      </div>
    </div>
  )
}