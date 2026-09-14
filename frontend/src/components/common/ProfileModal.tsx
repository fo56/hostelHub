import { useState } from 'react'
import { Button } from '../ui/button'
import toast from 'react-hot-toast'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { Modal } from '../ui/modal'
import { Input } from '../ui/input'

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { request } = useApi()
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleUpdate = async () => {
    try {
      if (password && password !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      
      setLoading(true)
      const updates: any = {}
      if (name !== user?.name) updates.name = name
      if (email !== user?.email) updates.email = email
      if (password) updates.password = password
      
      if (Object.keys(updates).length === 0) {
        toast('No changes to save')
        return
      }

      await request('/users/profile', 'PUT', updates)
      
      const newCtx: any = {}
      if (updates.name !== undefined) newCtx.name = updates.name
      if (updates.email !== undefined) newCtx.email = updates.email
      
      if (Object.keys(newCtx).length > 0) {
        updateUser(newCtx)
      }
      toast.success('Profile updated successfully')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile">
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-caption text-(--color-muted) mb-1">Username</label>
          <div className="w-full px-4 py-2 border border-(--color-hairline) rounded bg-(--color-surface-soft) text-(--color-muted) text-body-sm cursor-not-allowed">
            {(user as any)?.username || user?.email || 'N/A'}
          </div>
        </div>
        <div>
          <label className="block text-caption text-(--color-muted) mb-1">Recovery Email (Optional)</label>
          <Input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Add your real email for recovery"
          />
        </div>
        <div>
          <label className="block text-caption text-(--color-muted) mb-1">Name</label>
          <Input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-caption text-(--color-muted) mb-1">New Password (Optional)</label>
          <Input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Leave blank to keep same"
          />
        </div>
        {password && (
          <div>
            <label className="block text-caption text-(--color-muted) mb-1">Confirm New Password</label>
            <Input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />
          </div>
        )}
      </div>
      <div className="p-4 border-t border-(--color-hairline) flex justify-end">
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  )
}
