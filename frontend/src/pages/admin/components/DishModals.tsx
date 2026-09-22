import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '../../../components/ui/modal'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select } from '../../../components/ui/select'
import { useApi } from '../../../hooks/useApi'
import { formatDate } from '../../../lib/utils'

export function EditDishModal({ isOpen, onClose, onSuccess, dish, mealPlan }: any) {
  const { request } = useApi()
  const [formData, setFormData] = useState({
    name: '',
    mealType: 'Lunch',
    category: 'Main Course',
    tags: '',
    priceScore: 3,
    healthScore: 3,
    itemClass: 'ROTATING',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (dish) {
        setFormData({
          name: dish.name,
          mealType: dish.mealType,
          category: dish.category,
          tags: dish.tags ? dish.tags.join(', ') : '',
          priceScore: dish.priceScore || 3,
          healthScore: dish.healthScore || 3,
          itemClass: dish.itemClass || 'ROTATING',
        })
      } else {
        setFormData({
          name: '',
          mealType: mealPlan[0]?.mealName || 'Lunch',
          category: mealPlan[0]?.categories?.[0]?.categoryName || 'Main Course',
          tags: '',
          priceScore: 3,
          healthScore: 3,
          itemClass: 'ROTATING',
        })
      }
    }
  }, [dish, isOpen, mealPlan])

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
        priceScore: Number(formData.priceScore),
        healthScore: Number(formData.healthScore)
      }

      if (dish) {
        await request(`/admin/dishes/${dish._id}`, 'PUT', payload)
        toast.success('Dish updated successfully!')
      } else {
        await request('/admin/dishes', 'POST', payload)
        toast.success('Dish created successfully!')
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save dish')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dish ? 'Edit Dish' : 'Add New Dish'}>
      <div className="p-4">
        <form onSubmit={handleSaveDish} className="space-y-4">
          <div>
            <label className="block text-body-sm text-muted mb-1">Dish Name</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Paneer Butter Masala"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm text-muted mb-1">Meal Type</label>
              <Select
                value={formData.mealType}
                onChange={(e) => {
                  const newMeal = e.target.value;
                  const mealData = mealPlan.find((m: any) => m.mealName === newMeal);
                  const firstCat = mealData?.categories?.[0]?.categoryName || '';
                  setFormData({ ...formData, mealType: newMeal, category: firstCat })
                }}
                className="w-full"
              >
                {mealPlan.map((m: any) => (
                  <option key={m.mealName} value={m.mealName}>{m.mealName}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-body-sm text-muted mb-1">Fixed</label>
              <Select
                value={formData.itemClass}
                onChange={(e) => setFormData({ ...formData, itemClass: e.target.value })}
                className="w-full"
              >
                <option value="FIXED">Fixed</option>
                <option value="ROTATING">Rotating</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm text-muted mb-1">Category</label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full"
              >
                {mealPlan.find((m: any) => m.mealName === formData.mealType)?.categories?.map((cat: any) => (
                  <option key={cat.categoryName} value={cat.categoryName}>{cat.categoryName}</option>
                )) || <option value="">Select Meal Type</option>}
              </Select>
            </div>

            <div>
              <label className="block text-body-sm text-muted mb-1">Tags (comma separated)</label>
              <Input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="spicy, North Indian"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm text-muted mb-1">Price Score (1–5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.priceScore}
                onChange={(e) => setFormData({ ...formData, priceScore: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-body-sm text-muted mb-1">Health Score (1–5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.healthScore}
                onChange={(e) => setFormData({ ...formData, healthScore: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-hairline mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : (dish ? 'Update Dish' : 'Save Dish')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export function DeleteDishModal({ isOpen, onClose, onSuccess, dishId }: any) {
  const { request } = useApi()
  const [deleting, setDeleting] = useState(false)

  const deleteDish = async () => {
    if (!dishId) return
    try {
      setDeleting(true)
      await request(`/admin/dishes/${dishId}`, 'DELETE')
      toast.success('Dish deleted successfully!')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete dish')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Dish">
      <div className="p-6">
        <p className="text-body text-ink mb-6">Are you sure you want to permanently delete this dish? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={deleteDish} disabled={deleting} className="bg-(--color-semantic-error) hover:bg-(--color-semantic-error)/90 border-(--color-semantic-error)">
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function ApproveDishModal({ isOpen, onClose, onSuccess, dishId }: any) {
  const { request } = useApi()
  const [approveScores, setApproveScores] = useState({ priceScore: 3, healthScore: 3 })
  const [approving, setApproving] = useState(false)

  const approve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dishId) return
    const { priceScore, healthScore } = approveScores

    if (Number.isNaN(priceScore) || Number.isNaN(healthScore) || priceScore < 1 || priceScore > 5 || healthScore < 1 || healthScore > 5) {
      toast.error('Invalid score. Price and Health scores must be numbers between 1 and 5.')
      return
    }

    try {
      setApproving(true)
      await request(`/admin/dishes/${dishId}/approve`, 'POST', { priceScore, healthScore })
      toast.success('Dish approved successfully!')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to approve dish')
    } finally {
      setApproving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Dish">
      <div className="p-4">
        <form onSubmit={approve} className="space-y-4">
          <p className="text-body-sm text-muted">Assign initial price and health scores for this suggested dish.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm text-muted mb-1">Price Score (1–5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                required
                value={approveScores.priceScore}
                onChange={(e) => setApproveScores({ ...approveScores, priceScore: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-body-sm text-muted mb-1">Health Score (1–5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                required
                value={approveScores.healthScore}
                onChange={(e) => setApproveScores({ ...approveScores, healthScore: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t border-hairline mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={approving} className="bg-(--color-semantic-success) hover:bg-(--color-semantic-success)/90 border-(--color-semantic-success)">
              {approving ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export function RejectDishModal({ isOpen, onClose, onSuccess, dishId }: any) {
  const { request } = useApi()
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const reject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dishId) return
    if (!rejectReason || !rejectReason.trim()) {
      toast.error('Rejection reason is required.')
      return
    }

    try {
      setRejecting(true)
      await request(`/admin/dishes/${dishId}/reject`, 'POST', { reason: rejectReason })
      toast.success('Dish rejected successfully!')
      onSuccess()
      onClose()
      setRejectReason('')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to reject dish')
    } finally {
      setRejecting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Dish">
      <div className="p-4">
        <form onSubmit={reject} className="space-y-4">
          <div>
            <label className="block text-body-sm text-muted mb-1">Reason for Rejection</label>
            <Input
              type="text"
              required
              placeholder="e.g. Too expensive to prepare, unhygienic..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t border-hairline mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={rejecting} className="bg-(--color-semantic-error) hover:bg-(--color-semantic-error)/90 border-(--color-semantic-error)">
              {rejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export function ToggleStatusModal({ isOpen, onClose, onSuccess, dishId, currentStatus }: any) {
  const { request } = useApi()
  const [toggleNote, setToggleNote] = useState('')
  const [toggling, setToggling] = useState(false)

  const handleToggleStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dishId) return
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    if (newStatus === 'INACTIVE' && (!toggleNote || !toggleNote.trim())) {
      toast.error('A note is required when deactivating a dish.')
      return
    }

    try {
      setToggling(true)
      await request(`/admin/dishes/${dishId}/toggle-status`, 'PATCH', { status: newStatus, note: toggleNote })
      toast.success(`Dish ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`)
      onSuccess()
      onClose()
      setToggleNote('')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to toggle status')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentStatus === 'ACTIVE' ? "Deactivate Dish" : "Activate Dish"}>
      <div className="p-4">
        <form onSubmit={handleToggleStatus} className="space-y-4">
          <p className="text-body text-ink">
            {currentStatus === 'ACTIVE' 
              ? 'Are you sure you want to deactivate this dish? It will no longer be available in the menu generation pool.' 
              : 'Are you sure you want to reactivate this dish? It will become available in the menu generation pool.'}
          </p>
          {currentStatus === 'ACTIVE' && (
            <div>
              <label className="block text-body-sm text-muted mb-1">Note / Reason for Deactivation</label>
              <Input
                type="text"
                required
                placeholder="e.g. Temporarily out of season, unhygienic..."
                value={toggleNote}
                onChange={(e) => setToggleNote(e.target.value)}
              />
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4 border-t border-hairline mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={toggling} className={currentStatus === 'ACTIVE' ? "bg-(--color-semantic-warning) hover:bg-(--color-semantic-warning)/90 border-(--color-semantic-warning)" : "bg-(--color-semantic-success) hover:bg-(--color-semantic-success)/90 border-(--color-semantic-success)"}>
              {toggling ? 'Processing...' : (currentStatus === 'ACTIVE' ? 'Deactivate' : 'Activate')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export function DishReviewsModal({ isOpen, onClose, data }: any) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reviews for ${data?.dish?.name || 'Dish'}`}>
      <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {data?.loading ? (
          <div className="text-center text-muted text-body py-8">Loading reviews...</div>
        ) : data?.reviews?.length === 0 ? (
          <div className="text-center text-muted text-body py-8">No reviews yet for this dish.</div>
        ) : (
          <div className="space-y-4">
            {data?.reviews?.map((r: any) => (
              <div key={r._id} className="p-4 bg-surface-soft border border-hairline rounded flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-ink block">{r.studentId?.name || 'Unknown Student'}</span>
                    <span className="text-caption text-muted">{formatDate(r.createdAt, true)}</span>
                  </div>
                  <span className="text-sm font-mono text-semantic-warning bg-semantic-warning/10 px-2 py-1 rounded font-bold">★ {r.rating}</span>
                </div>
                {r.comment && <p className="text-body-sm text-ink/90 mt-1 italic leading-relaxed">"{r.comment}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
