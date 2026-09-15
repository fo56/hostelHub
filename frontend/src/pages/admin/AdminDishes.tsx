import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useApi } from '../../hooks/useApi'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Card } from '../../components/ui/card'
import { Modal } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'

type TabType = 'ACTIVE' | 'UNDER_REVIEW' | 'INACTIVE'

export default function AdminDishManagement() {
  const { request } = useApi()
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE')
  const [dishes, setDishes] = useState<any[]>([])
  const [dishStats, setDishStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingDishId, setEditingDishId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [reviewsModal, setReviewsModal] = useState<{ isOpen: boolean, dish: any, reviews: any[], loading: boolean } | null>(null)
  
  const [approveConfirmId, setApproveConfirmId] = useState<string | null>(null)
  const [approveScores, setApproveScores] = useState({ priceScore: 3, healthScore: 3 })
  
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    mealType: 'Lunch',
    category: 'Veg',
    tags: '',
    priceScore: 3,
    healthScore: 3,
    itemClass: 'ROTATING'
  })

  useEffect(() => {
    loadDishes()
  }, [activeTab])

  const loadDishes = async () => {
    setLoading(true)
    try {
      if (activeTab === 'ACTIVE') {
        const [dishesData, statsData] = await Promise.all([
          request(`/admin/dishes?status=${activeTab}`),
          request('/admin/reviews/stats')
        ])
        setDishes(dishesData || [])
        setDishStats(statsData?.dishStats || [])
      } else {
        const data = await request(`/admin/dishes?status=${activeTab}`)
        setDishes(data || [])
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to fetch dishes')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedDishes = [...dishes].sort((a, b) => {
    if (!sortConfig) {
      // Default grouping logic: MealType then itemClass
      const mealOrder: Record<string, number> = { Breakfast: 1, Lunch: 2, Snack: 3, Dinner: 4 };
      const m1 = mealOrder[a.mealType] || 99;
      const m2 = mealOrder[b.mealType] || 99;
      if (m1 !== m2) return m1 - m2;
      
      const classOrder: Record<string, number> = { FIXED: 1, ROTATING: 2 };
      const c1 = classOrder[a.itemClass] || 99;
      const c2 = classOrder[b.itemClass] || 99;
      if (c1 !== c2) return c1 - c2;
      
      return (a.name || '').localeCompare(b.name || '');
    }

    const { key, direction } = sortConfig
    
    let valA = key === 'suggestedBy' ? (a.suggestedBy?.name || '') : a[key]
    let valB = key === 'suggestedBy' ? (b.suggestedBy?.name || '') : b[key]

    if (valA == null) valA = ''
    if (valB == null) valB = ''

    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1
    if (valA > valB) return direction === 'asc' ? 1 : -1
    return 0
  })

  const handleEditClick = (dish: any) => {
    setFormData({
      name: dish.name,
      mealType: dish.mealType,
      category: dish.category,
      tags: dish.tags ? dish.tags.join(', ') : '',
      priceScore: dish.priceScore || 3,
      healthScore: dish.healthScore || 3,
      itemClass: dish.itemClass || 'ROTATING'
    })
    setEditingDishId(dish._id)
    setShowModal(true)
  }

  const openReviewsModal = async (dish: any) => {
    setReviewsModal({ isOpen: true, dish, reviews: [], loading: true })
    try {
      const data = await request(`/admin/reviews?dishId=${dish._id}`)
      setReviewsModal({ isOpen: true, dish, reviews: data?.reviews || [], loading: false })
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch reviews')
      setReviewsModal({ isOpen: true, dish, reviews: [], loading: false })
    }
  }

  const deleteDish = async () => {
    if (!deleteConfirmId) return;
    try {
      await request(`/admin/dishes/${deleteConfirmId}`, 'DELETE')
      toast.success('Dish deleted successfully!')
      loadDishes()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete dish')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
        priceScore: Number(formData.priceScore),
        healthScore: Number(formData.healthScore)
      }

      if (editingDishId) {
        await request(`/admin/dishes/${editingDishId}`, 'PUT', payload)
        toast.success('Dish updated successfully!')
      } else {
        await request('/admin/dishes', 'POST', payload)
        toast.success('Dish created successfully!')
      }

      setShowModal(false)
      setEditingDishId(null)
      setFormData({ name: '', mealType: 'Lunch', category: 'Veg', tags: '', priceScore: 3, healthScore: 3, itemClass: 'ROTATING' })
      loadDishes()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save dish')
    }
  }

  const approve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!approveConfirmId) return

    const { priceScore, healthScore } = approveScores

    if (
      Number.isNaN(priceScore) ||
      Number.isNaN(healthScore) ||
      priceScore < 1 || priceScore > 5 ||
      healthScore < 1 || healthScore > 5
    ) {
      toast.error('Invalid score. Price and Health scores must be numbers between 1 and 5.')
      return
    }

    try {
      await request(`/admin/dishes/${approveConfirmId}/approve`, 'POST', { priceScore, healthScore })
      loadDishes()
      toast.success('Dish approved successfully!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to approve dish')
    } finally {
      setApproveConfirmId(null)
    }
  }

  const reject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectConfirmId) return

    if (!rejectReason || !rejectReason.trim()) {
      toast.error('Rejection reason is required.')
      return
    }

    try {
      await request(`/admin/dishes/${rejectConfirmId}/reject`, 'POST', { reason: rejectReason })
      loadDishes()
      toast.success('Dish rejected successfully!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to reject dish')
    } finally {
      setRejectConfirmId(null)
      setRejectReason('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-end border-b border-hairline gap-3 sm:gap-0">
        <div className="flex overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('ACTIVE')}
            className={`py-3 px-4 border-b-2 font-medium text-body whitespace-nowrap transition-colors -mb-[1px] ${
              activeTab === 'ACTIVE'
              ? 'border-ink text-ink'
              : 'border-transparent text-muted hover:text-ink hover:border-hairline'
            }`}
          >
            Approved Dishes
          </button>
          <button 
            onClick={() => setActiveTab('UNDER_REVIEW')}
            className={`py-3 px-4 border-b-2 font-medium text-body whitespace-nowrap transition-colors -mb-[1px] ${
              activeTab === 'UNDER_REVIEW'
              ? 'border-ink text-ink'
              : 'border-transparent text-muted hover:text-ink hover:border-hairline'
            }`}
          >
            Pending Dishes
          </button>
          <button 
            onClick={() => setActiveTab('INACTIVE')}
            className={`py-3 px-4 border-b-2 font-medium text-body whitespace-nowrap transition-colors -mb-[1px] ${
              activeTab === 'INACTIVE'
              ? 'border-ink text-ink'
              : 'border-transparent text-muted hover:text-ink hover:border-hairline'
            }`}
          >
            Rejected Dishes
          </button>
        </div>
        <div className="pb-2 w-full sm:w-auto">
          <Button variant="primary" className="h-9 w-full sm:w-auto"
            onClick={() => {
              setEditingDishId(null)
              setFormData({ name: '', mealType: 'Lunch', category: 'Veg', tags: '', priceScore: 3, healthScore: 3, itemClass: 'ROTATING' })
              setShowModal(true)
            }}
          >
            + Add New Dish
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-body text-muted">Loading dishes...</div>
      ) : dishes.length === 0 ? (
        <div className="p-8 text-center text-body text-muted">
          No {activeTab === 'ACTIVE' ? 'approved' : activeTab === 'UNDER_REVIEW' ? 'pending' : 'rejected'} dishes found.
        </div>
      ) : (
        <Card className="overflow-hidden shadow-none border-hairline">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-soft">
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors w-1/4" onClick={() => handleSort('name')}>
                    <div className="flex items-center justify-center gap-1">
                      Name <span className="w-3 inline-block text-center">{sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('mealType')}>
                    <div className="flex items-center justify-center gap-1">
                      Meal Type <span className="w-3 inline-block text-center">{sortConfig?.key === 'mealType' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('itemClass')}>
                    <div className="flex items-center justify-center gap-1">
                      Fixed <span className="w-3 inline-block text-center">{sortConfig?.key === 'itemClass' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center justify-center gap-1">
                      Category <span className="w-3 inline-block text-center">{sortConfig?.key === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  {activeTab === 'ACTIVE' ? (
                    <>
                      <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('priceScore')}>
                        <div className="flex items-center justify-center gap-1">
                          Price <span className="w-3 inline-block text-center">{sortConfig?.key === 'priceScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('healthScore')}>
                        <div className="flex items-center justify-center gap-1">
                          Health <span className="w-3 inline-block text-center">{sortConfig?.key === 'healthScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Tags</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">Reviews</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </>
                  ) : activeTab === 'UNDER_REVIEW' ? (
                    <>
                      <TableHead className="text-center">Tags</TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('suggestedBy')}>
                        <div className="flex items-center justify-center gap-1">
                          Suggested By <span className="w-3 inline-block text-center">{sortConfig?.key === 'suggestedBy' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-center">Tags</TableHead>
                      <TableHead className="text-center">Reason</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDishes.map((d) => (
                  <TableRow 
                    key={d._id} 
                    className={`transition-colors hover:bg-surface-soft ${activeTab === 'ACTIVE' ? 'cursor-pointer' : ''}`}
                    onClick={() => { if (activeTab === 'ACTIVE') openReviewsModal(d) }}
                  >
                    <TableCell className="font-medium text-ink text-center">{d.name}</TableCell>
                    <TableCell className="text-muted text-center">{d.mealType}</TableCell>
                    <TableCell className="text-muted text-center">
                      <span className={`inline-flex px-2 py-1 rounded text-caption uppercase font-bold tracking-wider border ${
                        d.itemClass === 'FIXED' ? 'bg-ink border-ink text-canvas' : 'bg-transparent border-hairline text-muted'
                      }`}>
                        {d.itemClass || 'ROTATING'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted text-center">{d.category || '-'}</TableCell>
                    {activeTab === 'ACTIVE' ? (
                      <>
                        <TableCell className="text-center">
                          {d.priceScore !== undefined && d.priceScore !== null ? (
                            <div className="flex items-center justify-center gap-2" title={`Price: ${d.priceScore}/5`}>
                              <div className="w-12 h-1.5 bg-hairline rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-ink" 
                                  style={{ width: `${(d.priceScore / 5) * 100}%` }} 
                                />
                              </div>
                            </div>
                          ) : <span className="text-muted">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {d.healthScore !== undefined && d.healthScore !== null ? (
                            <div className="flex items-center justify-center gap-2" title={`Health: ${d.healthScore}/5`}>
                              <div className="w-12 h-1.5 bg-hairline rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-ink" 
                                  style={{ width: `${(d.healthScore / 5) * 100}%` }} 
                                />
                              </div>
                            </div>
                          ) : <span className="text-muted">—</span>}
                        </TableCell>
                        <TableCell className="text-center truncate max-w-[150px]" title={d.tags?.join(', ')}>{d.tags?.join(', ') || '—'}</TableCell>
                        <TableCell className="text-center font-mono text-data text-semantic-warning">
                          {dishStats.find(s => s._id === d._id)?.averageRating ? (
                            <div className="flex items-center justify-center gap-1">
                              <span>★</span>
                              <span>{dishStats.find(s => s._id === d._id)?.averageRating.toFixed(1)}</span>
                            </div>
                          ) : <span className="text-muted">No ratings</span>}
                        </TableCell>
                        <TableCell className="text-center text-muted">
                          {dishStats.find(s => s._id === d._id)?.totalReviews || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(d) }} className="p-1.5 text-muted hover:text-ink hover:bg-surface rounded transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(d._id) }} className="p-1.5 text-muted hover:text-(--color-semantic-error) hover:bg-(--color-semantic-error)/10 rounded transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </>
                    ) : activeTab === 'UNDER_REVIEW' ? (
                      <>
                        <TableCell className="text-center truncate max-w-[150px]" title={d.tags?.join(', ')}>{d.tags?.join(', ') || '—'}</TableCell>
                        <TableCell className="text-muted text-center">{d.suggestedBy?.name || '—'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setApproveConfirmId(d._id); setApproveScores({ priceScore: 3, healthScore: 3 }) }} className="p-1.5 text-muted hover:text-(--color-semantic-success) hover:bg-(--color-semantic-success)/10 rounded transition-colors" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setRejectConfirmId(d._id); setRejectReason('') }} className="p-1.5 text-muted hover:text-(--color-semantic-error) hover:bg-(--color-semantic-error)/10 rounded transition-colors" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-center py-2 truncate max-w-[150px]" title={d.tags?.join(', ')}>{d.tags?.join(', ') || '—'}</TableCell>
                        <TableCell className="text-muted py-2 text-center truncate max-w-[150px]" title={d.rejectionReason}>{d.rejectionReason || '—'}</TableCell>
                        <TableCell className="text-center py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(d._id) }} className="p-1.5 text-muted hover:text-(--color-semantic-error) hover:bg-(--color-semantic-error)/10 rounded transition-colors" title="Delete Permanently">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDishId ? 'Edit Dish' : 'Add New Dish'}>
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
                  onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                  className="w-full"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Snack">Snack</option>
                  <option value="Dinner">Dinner</option>
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
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Egg">Egg</option>
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
              <Button variant="secondary" 
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingDishId(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingDishId ? 'Update Dish' : 'Save Dish'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Dish">
        <div className="p-6">
          <p className="text-body text-ink mb-6">Are you sure you want to permanently delete this dish? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="primary" onClick={deleteDish} className="bg-(--color-semantic-error) hover:bg-(--color-semantic-error)/90 border-(--color-semantic-error)">Delete</Button>
          </div>
        </div>
      </Modal>

      {/* APPROVE DISH MODAL */}
      <Modal isOpen={!!approveConfirmId} onClose={() => setApproveConfirmId(null)} title="Approve Dish">
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
              <Button variant="secondary" type="button" onClick={() => setApproveConfirmId(null)}>Cancel</Button>
              <Button variant="primary" type="submit" className="bg-(--color-semantic-success) hover:bg-(--color-semantic-success)/90 border-(--color-semantic-success)">Approve</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* REJECT DISH MODAL */}
      <Modal isOpen={!!rejectConfirmId} onClose={() => setRejectConfirmId(null)} title="Reject Dish">
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
              <Button variant="secondary" type="button" onClick={() => setRejectConfirmId(null)}>Cancel</Button>
              <Button variant="primary" type="submit" className="bg-(--color-semantic-error) hover:bg-(--color-semantic-error)/90 border-(--color-semantic-error)">Reject</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* DISH REVIEWS MODAL */}
      <Modal isOpen={reviewsModal?.isOpen || false} onClose={() => setReviewsModal(null)} title={`Reviews for ${reviewsModal?.dish?.name || 'Dish'}`}>
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {reviewsModal?.loading ? (
            <div className="text-center text-muted text-body py-8">Loading reviews...</div>
          ) : reviewsModal?.reviews.length === 0 ? (
            <div className="text-center text-muted text-body py-8">No reviews yet for this dish.</div>
          ) : (
            <div className="space-y-4">
              {reviewsModal?.reviews.map((r: any) => (
                <div key={r._id} className="p-4 bg-surface-soft border border-hairline rounded flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-ink block">{r.studentId?.name || 'Unknown Student'}</span>
                      <span className="text-caption text-muted">{new Date(r.createdAt).toLocaleString()}</span>
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
    </div>
  )
}
