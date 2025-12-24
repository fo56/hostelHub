// pages/admin/MessVoting.tsx
import { useState } from 'react'
import { useMessService } from '../../hooks/useMessService'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

export default function MessVoting() {
  const { openVoting } = useMessService()
  const [days, setDays] = useState(1)

  const handleOpenVoting = async () => {
    await openVoting(days)
    alert('Mess voting opened successfully')
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-4">Open Mess Voting</h1>

      <Input
        type="number"
        min={1}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
      />

      <Button className="mt-4" onClick={handleOpenVoting}>
        Open Voting
      </Button>
    </div>
  )
}
