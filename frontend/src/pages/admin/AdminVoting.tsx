import { useEffect, useMemo, useState } from 'react'
import { useApi } from '../../hooks/useApi'

export default function AdminVoting() {
  const { request } = useApi()

  const [status, setStatus] = useState<any>(null)
  const [duration, setDuration] = useState(7)
  const [targetWeek, setTargetWeek] = useState(1) // Added week state
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchStatus = async () => {
    try {
      const res = await request('/admin/menu/voting/status')
      setStatus(res)
      // Automatically suggest the next week
      if (res?.week) setTargetWeek(res.week + 1)
    } catch (err) {
      console.error("Failed to fetch status", err)
    }
  }

  useEffect(() => {
    fetchStatus()
    const timeInterval = setInterval(() => setNow(Date.now()), 1000)
    const statusInterval = setInterval(fetchStatus, 30_000) // Refresh status more often
    return () => {
      clearInterval(timeInterval)
      clearInterval(statusInterval)
    }
  }, [])

  const startTime = status?.startsAt ? new Date(status.startsAt).getTime() : null
  const endTime = status?.endsAt ? new Date(status.endsAt).getTime() : null
  
  // CRITICAL FIX: The button should ONLY be disabled if the clock is actually ticking.
  // If status.isOpen is false OR the time has passed, we should be allowed to start a new session.
  const isActivelyTicking = status?.isOpen && endTime && now < endTime

  const progress = useMemo(() => {
    if (!startTime || !endTime) return 0
    const total = endTime - startTime
    const elapsed = now - startTime
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }, [now, startTime, endTime])

  const timeLeft = useMemo(() => {
    if (!endTime || now >= endTime) return null
    const diff = endTime - now
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60) % 60
    const hours = Math.floor(seconds / 3600) % 24
    const days = Math.floor(seconds / 86400)
    return `${days}d ${hours}h ${minutes}m ${seconds % 60}s`
  }, [now, endTime])

  const openVoting = async () => {
    setLoading(true)
    try {
      const payload = {
        week: targetWeek,
        durationInDays: Number(duration),
      }
      
      const res = await request('/admin/menu/voting/open', 'POST', payload)
      
      if (res) {
        await fetchStatus()
        setToast({ message: 'New voting window launched!', type: 'success' })
      }
    } catch (e: any) {
      setToast({ message: e.message || 'Error launching voting', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMenu = async () => {
    setLoading(true)
    try {
      await request('/admin/menu/generate', 'POST')
      await fetchStatus()
      setToast({ message: 'Menu generated successfully!', type: 'success' })
      setShowConfirm(false)
    } catch (e: any) {
      setToast({ message: e.message || 'Error generating menu', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* TOAST */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-lg shadow-xl border animate-bounce ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <header className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-black text-gray-900 uppercase">Voting Admin</h1>
        {loading && <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />}
      </header>

      {/* SESSION DISPLAY */}
      <div className="bg-white border-2 border-black p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase bg-black text-white px-2 py-1">Week {status?.week || '??'}</span>
            <span className={`text-sm font-bold ${isActivelyTicking ? 'text-green-600' : 'text-red-600'}`}>
                {isActivelyTicking ? '● ACTIVE' : '○ CLOSED'}
            </span>
        </div>

        {isActivelyTicking ? (
          <div className="space-y-4">
             <div className="w-full bg-gray-200 h-6 border-2 border-black overflow-hidden">
                <div className="bg-black h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
             </div>
             <div className="flex justify-between font-mono text-sm">
                <span>{progress.toFixed(1)}% Complete</span>
                <span>{timeLeft} remaining</span>
             </div>
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-4 border-2 border-dashed border-gray-200">
            Ready for the next session or menu generation.
          </p>
        )}
      </div>

      {/* ACTION GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LAUNCH SECTION */}
        <div className="p-6 border-2 border-black space-y-4 bg-white">
          <h2 className="font-bold uppercase text-sm border-b border-black pb-2">1. Start Session</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase">Week Number</label>
              <input 
                type="number" 
                className="w-full border-2 border-black p-2 outline-none focus:bg-yellow-50"
                value={targetWeek}
                onChange={(e) => setTargetWeek(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase">Duration (Days)</label>
              <input 
                type="number" 
                className="w-full border-2 border-black p-2 outline-none focus:bg-yellow-50"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <button 
              onClick={openVoting}
              disabled={isActivelyTicking || loading}
              className="w-full bg-black text-white p-3 font-bold uppercase hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              Launch Voting
            </button>
          </div>
        </div>

        {/* GENERATE SECTION */}
        <div className="p-6 border-2 border-black space-y-4 bg-white">
          <h2 className="font-bold uppercase text-sm border-b border-black pb-2">2. Finalize</h2>
          {showConfirm ? (
            <div className="space-y-3">
               <p className="text-xs font-bold text-red-600">This will close voting and build the final menu. Proceed?</p>
               <div className="flex gap-2">
                 <button onClick={handleGenerateMenu} className="flex-1 bg-green-600 text-white p-2 font-bold text-xs uppercase">Yes</button>
                 <button onClick={() => setShowConfirm(false)} className="flex-1 bg-gray-200 text-black p-2 font-bold text-xs uppercase">No</button>
               </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirm(true)}
              disabled={isActivelyTicking || loading || !status}
              className="w-full border-2 border-black text-black p-3 font-bold uppercase hover:bg-black hover:text-white disabled:border-gray-200 disabled:text-gray-400 h-[104px] mt-auto"
            >
              Generate Menu
            </button>
          )}
        </div>
      </div>
    </div>
  )
}