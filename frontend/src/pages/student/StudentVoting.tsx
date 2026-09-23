import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { logger } from '../../lib/logger'
import type { MealType, Dish } from '../../lib/types'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Plus, ChevronDown, Ban } from 'lucide-react'
import { Modal } from '../../components/ui/modal'
import { Select } from '../../components/ui/select'

// Suggest Dish Modal Component
function SuggestDishModal({ isOpen, onClose, mealPlan }: { isOpen: boolean, onClose: () => void, mealPlan: any[] }) {
  const { request } = useApi()
  const [name, setName] = useState('')
  const [mealType, setMealType] = useState<MealType | ''>('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const submit = async () => {
    if (!name || !mealType || !category) {
      toast.error('Name, meal type, and category are required')
      return
    }
    setLoading(true)
    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean)
      await request('/dishes', 'POST', {
        name,
        mealType,
        category,
        tags: tagsArray
      })
      toast.success('Dish suggestion submitted for review')
      setName('')
      setMealType('')
      setCategory('')
      setTags('')
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to suggest dish')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Suggest a Dish">
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-body-sm mb-1">Dish Name</label>
          <Input
            placeholder="Paneer Tikka"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-body-sm mb-1">Meal Type</label>
          <Select
            className="w-full"
            value={mealType}
            onChange={e => {
              setMealType(e.target.value as MealType)
              setCategory('') // reset category when meal changes
            }}
          >
            <option value="">Select meal</option>
            {mealPlan.map(meal => (
              <option key={meal.mealName} value={meal.mealName}>{meal.mealName}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-body-sm mb-1">Category</label>
          <Select
            className="w-full"
            value={category}
            onChange={e => setCategory(e.target.value)}
            disabled={!mealType}
          >
            <option value="">Select category</option>
            {mealPlan.find(m => m.mealName === mealType)?.categories.map((cat: any) => (
              <option key={cat.categoryName} value={cat.categoryName}>{cat.categoryName}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-body-sm mb-1">Tags (comma separated)</label>
          <Input
            placeholder="spicy, dry, special"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>
        <Button onClick={submit} disabled={loading} className="w-full mt-4">
          {loading ? 'Submitting...' : 'Submit Suggestion'}
        </Button>
      </div>
    </Modal>
  )
}


export default function StudentVoting() {
  const { request } = useApi()
  const { user } = useAuth()
  const hostelId = user?.hostelId || ''

  const [mealPlan, setMealPlan] = useState<any[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [inactiveDishes, setInactiveDishes] = useState<any[]>([])
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [initialSelections, setInitialSelections] = useState<Record<string, string[]>>({})
  const [wantsNewMenu, setWantsNewMenu] = useState(false)
  const [initialWantsNewMenu, setInitialWantsNewMenu] = useState(false)

  const [isConfirmToggleOpen, setIsConfirmToggleOpen] = useState(false)
  const [pendingToggleState, setPendingToggleState] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState<'name_asc' | 'health_desc'>('name_asc')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false)
  const [expandedMeal, setExpandedMeal] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      try {
        const data = await request('/student/votes')

        setMealPlan(data.mealPlan || [])
        setDishes(data.availableDishes || [])
        setInactiveDishes(data.inactiveDishes || [])

        const initialSelectionsObj: Record<string, string[]> = {}
        if (data.votes) {
          data.votes.forEach((v: any) => {
            initialSelectionsObj[`${v.mealName}-${v.categoryName}`] = v.dishes.map((d: any) => d._id || d)
          })
        }

        // Ensure all configured categories have a key in selections even if empty
        if (data.mealPlan) {
          data.mealPlan.forEach((meal: any) => {
            meal.categories.forEach((cat: any) => {
              const key = `${meal.mealName}-${cat.categoryName}`
              if (!initialSelectionsObj[key]) initialSelectionsObj[key] = []
            })
          })
        }

        setSelections(initialSelectionsObj)
        setInitialSelections(JSON.parse(JSON.stringify(initialSelectionsObj)))
        setWantsNewMenu(data.wantsNewMenu || false)
        setInitialWantsNewMenu(data.wantsNewMenu || false)

        if (data.mealPlan && data.mealPlan.length > 0) {
          setExpandedMeal(data.mealPlan[0].mealName)
        }
      } catch (err) {
        logger.error('APP', 'Failed to load student data:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [hostelId, request])

  const toggleDish = (mealName: string, categoryName: string, dishId: string) => {
    const key = `${mealName}-${categoryName}`
    setSelections((prev) => {
      const current = prev[key] || []
      if (current.includes(dishId)) {
        return { ...prev, [key]: current.filter((id) => id !== dishId) }
      }
      return { ...prev, [key]: [...current, dishId] }
    })
  }

  const handleSavePreferences = async () => {
    if (submitting) return

    setSubmitting(true)

    try {
      const votesArray = Object.entries(selections).map(([key, ids]) => {
        const [mealName, categoryName] = key.split('-')
        return { mealName, categoryName, dishes: ids }
      })

      await request('/student/votes', 'POST', {
        votes: votesArray,
        wantsNewMenu
      })

      setInitialSelections(JSON.parse(JSON.stringify(selections)))
      setInitialWantsNewMenu(wantsNewMenu)
      toast.success('Preferences updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences')
    } finally {
      setSubmitting(false)
    }
  }

  const hasChanges = JSON.stringify(selections) !== JSON.stringify(initialSelections) || wantsNewMenu !== initialWantsNewMenu

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  if (loading) return <div className="p-4 text-center text-body text-(--color-ink)">Loading meal choices...</div>

  const handleToggleClick = () => {
    setPendingToggleState(!wantsNewMenu)
    setIsConfirmToggleOpen(true)
  }

  const confirmToggle = () => {
    setWantsNewMenu(pendingToggleState)
    setIsConfirmToggleOpen(false)
  }

  return (
    <div className="w-full pb-32">
      <section className="mb-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="w-full xl:w-auto">
            <h1 className="text-card-title md:text-headline tracking-tight text-ink leading-tight">
              Vote for Menu Additions
            </h1>
            <p className="text-body text-muted mt-1">
              Select your preferred dishes and save the choices.
            </p>
          </div>

          <div className="flex flex-row flex-wrap items-center justify-start xl:justify-end gap-2 w-full xl:w-auto mt-2 xl:mt-0">
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between gap-2 text-body-sm text-ink px-3 py-1.5 rounded border border-hairline bg-surface hover:bg-surface-soft transition-colors w-auto"
              >
                {sortBy === 'name_asc' ? 'Sort by Name' : 'Sort by Health'}
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute top-full mt-1 right-auto left-0 xl:right-0 xl:left-auto w-40 bg-canvas border border-hairline rounded shadow-sm z-50 py-1 flex flex-col">
                    <button
                      className="w-full text-left px-3 py-2 text-body-sm text-ink hover:bg-surface transition-colors"
                      onClick={() => { setSortBy('name_asc'); setIsSortOpen(false) }}
                    >
                      Sort by Name
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-body-sm text-ink hover:bg-surface transition-colors"
                      onClick={() => { setSortBy('health_desc'); setIsSortOpen(false) }}
                    >
                      Sort by Health
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleClick}
              className={`px-3 py-1.5 min-h-[36px] rounded text-body-sm  transition-all border flex items-center justify-center gap-2 whitespace-nowrap w-auto ${wantsNewMenu
                ? 'bg-(--color-semantic-error)/10 border-(--color-semantic-error)/30 text-(--color-semantic-error) shadow-sm'
                : 'bg-surface border-hairline text-ink hover:border-ink/30'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${wantsNewMenu ? 'bg-(--color-semantic-error) animate-pulse' : 'bg-muted'}`} />
              {wantsNewMenu ? 'Menu Request Active' : 'Request New Menu'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {mealPlan.map((meal) => {
          let mealSelectedCount = 0
          meal.categories.forEach((cat: any) => {
            const key = `${meal.mealName}-${cat.categoryName}`
            mealSelectedCount += selections[key]?.length || 0
          })

          return (
            <div key={meal.mealName} className={`flex flex-col bg-canvas sm:bg-surface/30 border border-hairline rounded-xl overflow-hidden transition-all ${expandedMeal === meal.mealName ? 'h-[500px]' : 'h-auto'} md:!h-[calc(100vh-280px)] md:max-h-[650px] md:min-h-[400px]`}>
              <div
                className="flex items-center justify-between p-4 shrink-0 cursor-pointer md:cursor-default border-b border-hairline group bg-surface-soft/50 sm:bg-transparent hover:bg-surface-soft/80 transition-colors"
                onClick={() => setExpandedMeal(meal.mealName === expandedMeal ? '' : meal.mealName)}
              >
                <h2 className="text-body m-0 flex items-center gap-2 text-ink">
                  {meal.mealName}
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform md:hidden ${expandedMeal === meal.mealName ? 'rotate-180' : ''}`} />
                </h2>
                <span className={`text-caption transition-colors ${mealSelectedCount > 0 ? 'text-ink  bg-ink/10 px-2 py-1 rounded-md' : 'text-muted'}`}>
                  {mealSelectedCount} SELECTED
                </span>
              </div>

              <div className={`flex-1 overflow-y-auto min-h-0 flex-col custom-scrollbar ${expandedMeal === meal.mealName ? 'flex' : 'hidden md:flex'}`}>
                {meal.categories.map((cat: any) => {
                  const key = `${meal.mealName}-${cat.categoryName}`
                  const selectedCount = selections[key]?.length || 0
                  const availableForCategory = dishes.filter(d => d.mealType === meal.mealName && d.category === cat.categoryName)

                  if (availableForCategory.length === 0) return null;

                  return (
                    <div key={key} className="shrink-0 mb-6 last:mb-0">
                      <div className="flex justify-between items-center px-4 py-3 bg-surface/50 sticky top-0 z-10 backdrop-blur-sm border-b border-hairline/50">
                        <h3 className="text-[11px] text-muted uppercase tracking-widest">{cat.categoryName}</h3>
                        {selectedCount > 0 && <span className="text-[11px] text-muted">{selectedCount} picked</span>}
                      </div>

                      <div className="flex flex-col gap-2 pb-4 px-3 md:px-2 pt-2">
                        {[...availableForCategory].sort((a, b) => {
                          if (sortBy === 'health_desc') {
                            const aScore = a.healthScore || 0
                            const bScore = b.healthScore || 0
                            if (aScore !== bScore) return bScore - aScore
                          }
                          return a.name.localeCompare(b.name)
                        }).map((dish) => {
                          const isSelected = selections[key]?.includes(dish._id)
                          return (
                            <button
                              key={dish._id}
                              onClick={() => toggleDish(meal.mealName, cat.categoryName, dish._id)}
                              className={`w-full px-4 py-3 text-left transition-colors flex flex-col items-start h-auto min-h-0 group relative border border-hairline rounded-lg ${isSelected
                                ? 'bg-ink/5 border-ink/20'
                                : 'bg-transparent hover:bg-surface-soft'
                                }`}
                            >
                              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink rounded-l-lg" />}
                              <div className="flex justify-between w-full items-start gap-2">
                                <span className={`leading-tight text-body whitespace-normal transition-colors ${isSelected ? ' text-ink' : ' text-ink group-hover:text-ink'}`}>
                                  {dish.name}
                                </span>
                                {isSelected && (
                                  <div className="w-4 h-4 rounded-full bg-ink flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                    <svg className="w-2.5 h-2.5 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                )}
                              </div>

                              {(dish.healthScore !== undefined) && (
                                <div className="flex items-center gap-1.5 w-full mt-1.5">
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${dish.healthScore >= 4 ? 'bg-(--color-semantic-success)' :
                                      dish.healthScore >= 2.5 ? 'bg-(--color-semantic-warning)' :
                                        'bg-(--color-semantic-error)'
                                      }`}
                                  />
                                  <span className="text-[10px] text-muted tracking-wide">
                                    HEALTH {dish.healthScore}/5
                                  </span>
                                </div>
                              )}
                            </button>
                          )
                        })}

                        {inactiveDishes.filter(d => d.mealType === meal.mealName && d.category === cat.categoryName).length > 0 && (
                          <div className="mt-4 border-t border-hairline/50 pt-3">
                            <h4 className="text-[10px] uppercase tracking-wider text-muted mb-2 px-1">Deactivated / Rejected</h4>
                            <div className="flex flex-col gap-2">
                              {inactiveDishes
                                .filter(d => d.mealType === meal.mealName && d.category === cat.categoryName)
                                .map(dish => (
                                  <div key={dish._id} className="w-full px-4 py-3 text-left bg-surface/30 border border-hairline/50 rounded-lg">
                                    <div className="flex justify-between w-full items-start gap-2">
                                      <span className="leading-tight text-body whitespace-normal text-muted line-through">
                                        {dish.name}
                                      </span>
                                      <Ban className="w-4 h-4 text-muted shrink-0" />
                                    </div>
                                    {dish.rejectionReason && (
                                      <div className="mt-2 text-body-xs text-(--color-semantic-warning)">
                                        Reason: {dish.rejectionReason}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* empty check removed as we now hide the category entirely */}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Suggest Floating Action Button */}
      <button
        onClick={() => setIsSuggestModalOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-8 z-40 bg-ink text-canvas rounded-full w-14 h-14 shadow-lg flex items-center justify-center hover:scale-105 hover:bg-ink/90 active:scale-95 transition-all"
        title="Suggest New Dish"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Frozen Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-canvas/90 backdrop-blur-md border-t border-hairline z-30 flex justify-center shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <Button
          onClick={handleSavePreferences}
          disabled={submitting || !hasChanges}
          className="w-full sm:w-auto sm:min-w-[200px] text-body shadow-sm"
        >
          {submitting ? 'Saving...' : 'Save Choices'}
        </Button>
      </div>

      <SuggestDishModal isOpen={isSuggestModalOpen} onClose={() => setIsSuggestModalOpen(false)} mealPlan={mealPlan} />

      <Modal isOpen={isConfirmToggleOpen} onClose={() => setIsConfirmToggleOpen(false)} title="Confirm Action">
        <div className="p-6">
          <p className="text-body text-ink mb-6">
            {pendingToggleState
              ? 'Are you sure you want to request a new menu? If 50% of voting students do this, the current menu will be discarded and a new one will be generated instantly.'
              : 'Are you sure you want to cancel your request for a new menu?'}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsConfirmToggleOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmToggle}>
              {pendingToggleState ? 'Yes, Request New Menu' : 'Yes, Cancel Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
