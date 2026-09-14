import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Trash2, Copy } from 'lucide-react'

interface User {
  _id: string
  name: string
  username: string
  role: 'STUDENT' | 'ADMIN'
  roomNo?: string
  isActive: boolean
}

export default function AdminUsers() {
  const { request } = useApi()
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'ADMIN'>('STUDENT')

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [form, setForm] = useState<any>({ role: 'STUDENT' })
  const [creating, setCreating] = useState(false)
  
  // Success Modal State
  const [createdUser, setCreatedUser] = useState<any>(null)

  const fetchUsers = async () => {
    setLoading(true)
    const res = await request('/admin/users')
    setUsers(res.users)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const confirmDeleteUser = (userId: string) => {
    setDeleteConfirmId(userId)
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirmId) return
    try {
      await request(`/admin/users/${deleteConfirmId}`, 'DELETE')
      setUsers(users.filter(u => u._id !== deleteConfirmId))
      toast.success('User deleted successfully')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete user')
    } finally {
      setDeleteConfirmId(null)
    }
  }



  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setCreating(true)
      const res = await request('/admin/users', 'POST', form)

      setCreatedUser({ ...res.user, rawPassword: res.rawPassword })

      setForm({ role: 'STUDENT' })
      setIsCreateModalOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-hairline mb-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab('STUDENT')}
            className={`px-4 py-2 font-medium text-body transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'STUDENT'
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`px-4 py-2 font-medium text-body transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'ADMIN'
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Admins
          </button>
        </div>
        <div className="pb-2">
          <Button onClick={() => setIsCreateModalOpen(true)} className="h-8 text-caption px-3">
            Add User
          </Button>
        </div>
      </div>

      {loading && <div className="p-8 text-center text-body text-muted">Loading users...</div>}

      {!loading && users.filter(u => u.role === activeTab).length === 0 && (
        <div className="p-8 text-center text-body text-muted">No {activeTab.toLowerCase()}s found.</div>
      )}

      {!loading && users.filter(u => u.role === activeTab).length > 0 && (
        <Card className="overflow-hidden shadow-none border-hairline">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-soft">
                  <TableHead className="text-center w-1/4">Name</TableHead>
                  <TableHead className="text-center">Username</TableHead>
                  <TableHead className="text-center">Room No</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.filter(u => u.role === activeTab).map(user => (
                  <TableRow key={user._id} className="transition-colors hover:bg-surface-soft">
                    <TableCell className="font-medium text-ink text-center">{user.name}</TableCell>
                    <TableCell className="text-muted text-center">{user.username}</TableCell>
                    <TableCell className="text-center text-muted">
                      {user.role === 'STUDENT' ? `Room ${user.roomNo || 'N/A'}` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.isActive ? (
                        <span className="text-semantic-success font-medium">Active</span>
                      ) : (
                        <span className="text-muted">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {user._id !== currentUser?._id && !(user.role === 'ADMIN' && user.username.startsWith('admin@')) && (
                          <button
                            onClick={() => confirmDeleteUser(user._id)}
                            className="p-1.5 text-muted hover:text-(--color-semantic-error) hover:bg-(--color-semantic-error)/10 rounded transition-colors" 
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <form onSubmit={submitCreate} className="p-6 space-y-4" autoComplete="off">
          <div>
            <label className="block text-body-sm mb-1">Full Name</label>
            <Input
              required
              autoComplete="off"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-body-sm mb-1">Role</label>
            <Select
              className="w-full"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value, roomNo: '' })}
            >
              <option value="STUDENT">Student</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          {form.role === 'STUDENT' && (
            <div>
              <label className="block text-body-sm mb-1">Room No</label>
              <Input
                required
                value={form.roomNo || ''}
                onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-body-sm mb-1">Username / Login ID</label>
            <Input
              required
              autoComplete="off"
              value={form.username || ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-body-sm mb-1">Password</label>
            <Input
              type="text"
              required
              autoComplete="new-password"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal
        isOpen={!!createdUser}
        onClose={() => {
          setCreatedUser(null)
        }}
        title="User Created Successfully"
      >
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="font-medium text-ink">{createdUser?.name}</p>
            <p className="text-muted text-body-sm mb-4">Username: <span className="font-mono text-ink font-medium">{createdUser?.username}</span></p>
            <p className="text-body-sm text-muted">Password: <span className="font-mono bg-surface-soft p-1 rounded text-ink">{createdUser?.rawPassword}</span></p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              className="w-full"
              onClick={() => {
                setCreatedUser(null)
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete User">
        <div className="p-6">
          <p className="text-body text-ink mb-6">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleDeleteUser} className="bg-(--color-semantic-error) hover:bg-(--color-semantic-error)/90 border-(--color-semantic-error)">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
