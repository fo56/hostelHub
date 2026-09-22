import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '../../../components/ui/modal'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import { useApi } from '../../../hooks/useApi'

export function CreateUserModal({ isOpen, onClose, onSuccess, currentUser }: any) {
  const { request } = useApi()
  const [form, setForm] = useState<any>({ role: 'STUDENT' })
  const [creating, setCreating] = useState(false)
  const [createdUser, setCreatedUser] = useState<any>(null)

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setCreating(true)
      const res = await request('/admin/users', 'POST', form)
      setCreatedUser({ ...res.user, rawPassword: res.rawPassword })
      setForm({ role: 'STUDENT' })
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen && !createdUser} onClose={onClose} title="Create New User">
        <form onSubmit={submitCreate} className="p-6 space-y-4" autoComplete="off">
          <div>
            <label className="block text-body-sm mb-1">Full Name <span className="text-muted font-normal">(Optional)</span></label>
            <Input
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
              onChange={(e) => setForm({ ...form, role: e.target.value, roomNo: '', permissions: [] })}
            >
              <option value="STUDENT">Student</option>
              {currentUser?.isPrimaryAdmin && <option value="ADMIN">Admin</option>}
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
          {form.role === 'ADMIN' && (
            <div>
              <label className="block text-body-sm mb-2">Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {['MANAGE_USERS', 'MANAGE_MENU', 'MANAGE_ISSUES', 'MANAGE_SETTINGS'].map(p => (
                  <label key={p} className="flex items-center gap-2 text-body-sm capitalize">
                    <input
                      type="checkbox"
                      checked={(form.permissions || []).includes(p)}
                      onChange={(e) => {
                        const newPerms = e.target.checked 
                          ? [...(form.permissions || []), p]
                          : (form.permissions || []).filter((x: string) => x !== p);
                        setForm({ ...form, permissions: newPerms });
                      }}
                      className="rounded border-(--color-hairline) text-(--color-primary) focus:ring-(--color-primary)"
                    />
                    {p.replace('MANAGE_', '').toLowerCase()}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-body-sm mb-1">Username / Login ID <span className="text-muted font-normal">(Optional)</span></label>
            <Input
              autoComplete="off"
              value={form.username || ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder={form.role === 'STUDENT' ? 'Auto-generated based on room no' : 'Auto-generated if empty'}
            />
          </div>
          <div>
            <label className="block text-body-sm mb-1">Password <span className="text-muted font-normal">(Optional)</span></label>
            <Input
              type="text"
              autoComplete="new-password"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Will use default password if empty"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!createdUser} onClose={() => { setCreatedUser(null); onClose(); }} title="User Created Successfully">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="font-medium text-ink">{createdUser?.name}</p>
            <p className="text-muted text-body-sm mb-4">Username: <span className="font-mono text-ink font-medium">{createdUser?.username}</span></p>
            <p className="text-body-sm text-muted">Password: <span className="font-mono bg-surface-soft p-1 rounded text-ink">{createdUser?.rawPassword}</span></p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button className="w-full" onClick={() => { setCreatedUser(null); onClose(); }}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export function BulkCreateModal({ isOpen, onClose, onSuccess }: any) {
  const { request } = useApi()
  const [bulkInput, setBulkInput] = useState('')
  const [bulkCreating, setBulkCreating] = useState(false)

  const submitBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkInput.trim()) return

    try {
      setBulkCreating(true)
      const input = bulkInput.replace(/,/g, '\n')
      const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
      
      const expandedRooms = lines.flatMap(line => {
        const match = line.match(/^([a-zA-Z\-_]*?)(\d+)\s*-\s*([a-zA-Z\-_]*?)(\d+)$/)
        if (match) {
          const prefix1 = match[1]
          const startNum = parseInt(match[2], 10)
          const prefix2 = match[3]
          const endNum = parseInt(match[4], 10)

          if ((prefix1 === prefix2 || prefix2 === '') && startNum <= endNum && endNum - startNum < 1000) {
            const result = []
            const padding = match[2].length
            for (let i = startNum; i <= endNum; i++) {
              let numStr = i.toString()
              if (match[2].startsWith('0') && numStr.length < padding) {
                numStr = numStr.padStart(padding, '0')
              }
              result.push(`${prefix1}${numStr}`)
            }
            return result
          }
        }
        return [line]
      })

      const usersToCreate = expandedRooms.map(room => ({
        name: `Student (Room ${room})`,
        roomNo: room,
        role: 'STUDENT'
      }))

      const res = await request('/admin/users/bulk', 'POST', { users: usersToCreate })
      toast.success(`Successfully created ${res.createdCount} users`)
      setBulkInput('')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to bulk create users')
    } finally {
      setBulkCreating(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Students">
      <form onSubmit={submitBulkCreate} className="p-6 space-y-4">
        <div>
          <label className="block text-body-sm mb-1">
            Enter room numbers (comma or newline separated)
          </label>
          <p className="text-xs text-muted mb-2">You can use ranges like <code>f1-f50</code>. Passwords and usernames will be auto-generated based on room numbers.</p>
          <Textarea
            required
            className="h-40"
            placeholder="101, 102, 103&#10;104-110&#10;f1-f50"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={bulkCreating || !bulkInput.trim()} className="w-full sm:w-auto px-6">
            {bulkCreating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function CsvImportModal({ isOpen, onClose, onSuccess }: any) {
  const { request } = useApi()
  const [csvInput, setCsvInput] = useState('')
  const [csvImporting, setCsvImporting] = useState(false)

  const submitCsvImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvInput.trim()) return

    try {
      setCsvImporting(true)
      const lines = csvInput.split('\n').filter(l => l.trim())
      const usersToCreate = lines.map(line => {
        const parts = line.split(',').map(s => s.trim())
        return {
          name: parts[0],
          roomNo: parts[1] || undefined,
          role: (parts[2] || 'STUDENT').toUpperCase()
        }
      })

      const res = await request('/admin/users/bulk', 'POST', { users: usersToCreate })
      toast.success(`Successfully created ${res.createdCount} users`)
      setCsvInput('')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to import users')
    } finally {
      setCsvImporting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Users">
      <form onSubmit={submitCsvImport} className="p-6 space-y-4">
        <div>
          <label className="block text-body-sm mb-1">
            Enter users (one per line, format: <code>Name, RoomNo, Role</code>)
          </label>
          <p className="text-xs text-muted mb-2">Role defaults to STUDENT. Passwords and usernames are auto-generated if omitted.</p>
          <Textarea
            required
            className="h-40"
            placeholder="John Doe, 101, STUDENT&#10;Jane Smith, 102&#10;Admin Guy, , ADMIN"
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={csvImporting || !csvInput.trim()} className="w-full sm:w-auto px-6">
            {csvImporting ? 'Importing...' : 'Import Users'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: any) {
  const { request } = useApi()
  const [editForm, setEditForm] = useState<any>({})
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      setEditForm({
        name: user.name || '',
        roomNo: user.roomNo || '',
        permissions: user.permissions || [],
      })
    }
  }, [user, isOpen])

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setEditing(true)
      const res = await request(`/admin/users/${user._id}`, 'PUT', editForm)
      toast.success('User updated successfully')
      onSuccess(res.user)
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update user')
    } finally {
      setEditing(false)
    }
  }

  return (
    <Modal isOpen={isOpen && !!user} onClose={onClose} title="Edit User">
      <form onSubmit={submitEdit} className="p-6 space-y-4" autoComplete="off">
        <div>
          <label className="block text-body-sm mb-1">Full Name</label>
          <Input
            autoComplete="off"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
        </div>
        {user?.role === 'STUDENT' && (
          <div>
            <label className="block text-body-sm mb-1">Room No</label>
            <Input
              value={editForm.roomNo || ''}
              onChange={(e) => setEditForm({ ...editForm, roomNo: e.target.value })}
            />
          </div>
        )}
        {user?.role === 'ADMIN' && (
          <div>
            <label className="block text-body-sm mb-2">Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {['MANAGE_USERS', 'MANAGE_MENU', 'MANAGE_ISSUES', 'MANAGE_SETTINGS'].map(p => (
                <label key={p} className="flex items-center gap-2 text-body-sm capitalize">
                  <input
                    type="checkbox"
                    checked={(editForm.permissions || []).includes(p)}
                    onChange={(e) => {
                      const newPerms = e.target.checked 
                        ? [...(editForm.permissions || []), p]
                        : (editForm.permissions || []).filter((x: string) => x !== p);
                      setEditForm({ ...editForm, permissions: newPerms });
                    }}
                    className="rounded border-(--color-hairline) text-(--color-primary) focus:ring-(--color-primary)"
                  />
                  {p.replace('MANAGE_', '').toLowerCase()}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={editing}>
            {editing ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
