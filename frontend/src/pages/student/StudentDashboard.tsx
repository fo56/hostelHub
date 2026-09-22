import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { logger } from '../../lib/logger'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { formatDate } from '../../lib/utils'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


export default function StudentDashboard() {
  const { request } = useApi()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [menu, setMenu] = useState<any>(null)
  const [todayDishes, setTodayDishes] = useState<any[]>([])

  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [expandedDishes, setExpandedDishes] = useState<Record<string, boolean>>({})
  const [expandedMeal, setExpandedMeal] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const menuRes = await request('/student/menu/current', 'GET', undefined, { skipToast: true })
      if (menuRes) {
        setMenu(menuRes)

        let dayIndex = new Date().getDay() - 1
        if (dayIndex === -1) dayIndex = 6

        setTodayDishes(
          menuRes.meals.map((meal: any) => ({
            mealName: meal.mealName,
            slot: meal.slots?.[dayIndex] || null
          }))
        )
      } else {
        setMenu(null)
        setTodayDishes([])
      }
    } catch (err: any) {
      logger.error('APP', 'Failed to load dashboard data:', err)
      toast.error('Failed to load menu data')
    } finally {
      setLoading(false)
    }
  }

  const handleRate = (dishId: string, star: number) => {
    setRatings(prev => ({
      ...prev,
      [dishId]: star
    }))
  }

  const submitRating = async (mealType: string, dishId: string) => {
    const rating = ratings[dishId]
    const comment = comments[dishId] || ''
    if (!rating) return

    try {
      setSubmitting(true)

      await request('/reviews/submit', 'POST', {
        dishId,
        mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1),
        rating,
        comment,
        servedOn: new Date().toISOString().split('T')[0]
      }).catch(err => {
        if (err.message !== 'You have already reviewed this meal') throw err;
      })

      toast.success(`Rating submitted successfully!`)

      setRatings(prev => {
        const next = { ...prev }
        delete next[dishId]
        return next
      })
      setComments(prev => {
        const next = { ...prev }
        delete next[dishId]
        return next
      })
      setExpandedDishes(prev => ({
        ...prev,
        [dishId]: false
      }))
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-muted">Loading Dashboard...</div>
  }

  if (!menu) {
    return (
      <div className="space-y-6 pb-6 w-full">
        <div className="bg-canvas sm:rounded border-y sm:border-x border-(--color-hairline) p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-4xl mb-4 opacity-80">🍽️</div>
          <h2 className="text-card-title md:text-headline mb-2 text-ink">No Menu Published Yet</h2>
          <p className="text-body text-muted max-w-md mx-auto">
            The mess admin hasn't published this week's menu yet. Please check back later once it's finalized!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6 w-full">

      {/* Today's Menu & Rating Section */}
      <Card className="overflow-hidden shadow-none border-hairline">
        <div className="p-4 border-b bg-surface-soft flex items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-card-title text-ink leading-tight">Today's Menu & Ratings</h2>
            <p className="text-caption text-muted mt-1">{formatDate(new Date())}</p>
          </div>
          <Button
            onClick={() => navigate('/student/voting/status')}
            className="whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all bg-ink text-canvas hover:bg-ink/90"
          >
            <span className="hidden sm:inline font-medium">Vote for Menu</span>
            <span className="sm:hidden px-1 text-caption font-medium tracking-wide">VOTE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-canvas">
          {todayDishes.map((mealData: any) => {
            const served = mealData.slot
            if (!served) return null

            const rotatingItems = served.rotatingItems?.map((r: any) => r.item).filter(Boolean) || []

            return (
              <div key={mealData.mealName} className="flex flex-col bg-canvas sm:bg-surface/30 border border-hairline rounded-xl overflow-hidden hover:border-ink/20 transition-all">
                <div
                  className="flex items-center justify-between p-4 shrink-0 cursor-pointer sm:cursor-default border-b border-hairline bg-surface-soft/50 sm:bg-transparent"
                  onClick={() => setExpandedMeal(expandedMeal === mealData.mealName ? '' : mealData.mealName)}
                >
                  <h3 className="text-body font-medium m-0 flex items-center gap-2 text-ink capitalize">
                    {mealData.mealName}
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform sm:hidden ${expandedMeal === mealData.mealName ? 'rotate-180' : ''}`} />
                  </h3>
                  {served.status === 'CLOSED' && (
                    <span className="text-[10px] font-medium tracking-wide bg-(--color-semantic-error)/10 text-(--color-semantic-error) px-2 py-1 rounded uppercase">CLOSED</span>
                  )}
                </div>

                <div className={`p-4 flex-grow flex-col ${expandedMeal === mealData.mealName ? 'flex' : 'hidden sm:flex'}`}>
                  {served.status === 'CLOSED' ? (
                    <p className="text-body text-muted italic flex-grow">Mess is closed for this meal.</p>
                  ) : rotatingItems.length === 0 ? (
                    <p className="text-body text-muted italic flex-grow">Fixed menu items only.</p>
                  ) : (
                    <div className="flex flex-col gap-3 flex-grow">
                      {rotatingItems.map((dish: any, index: number) => {
                        const isExpanded = expandedDishes[dish._id]
                        return (
                          <div key={dish._id} className={index > 0 ? "pt-3 border-t border-hairline" : ""}>
                            <button
                              onClick={() => setExpandedDishes(prev => ({ ...prev, [dish._id]: !prev[dish._id] }))}
                              className="w-full flex justify-between items-center text-left focus:outline-none group"
                            >
                              <p className="text-body font-medium text-ink/90 leading-tight group-hover:text-ink transition-colors">
                                {dish.name}
                              </p>
                              <span className="text-caption font-medium tracking-wide px-2 py-1 rounded bg-surface-soft group-hover:bg-hairline transition-colors ml-2 shrink-0">
                                {isExpanded ? 'CLOSE' : 'RATE'}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-200 fade-in">
                                <div>
                                  <div className="flex gap-2 justify-between">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => handleRate(dish._id, star)}
                                        className={`flex-1 h-9 rounded border flex items-center justify-center font-mono text-data transition-all focus:outline-none ${star <= (ratings[dish._id] || 0) ? 'bg-ink text-canvas border-ink scale-105' : 'bg-surface-soft text-ink border-hairline hover:border-ink/50'}`}
                                      >
                                        {star}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <Input
                                    type="text"
                                    placeholder="Write a review..."
                                    value={comments[dish._id] || ''}
                                    onChange={(e) => setComments(prev => ({ ...prev, [dish._id]: e.target.value }))}
                                    className="w-full text-body-sm h-9 bg-surface-soft"
                                  />
                                  <Button
                                    variant="primary"
                                    onClick={() => submitRating(mealData.mealName, dish._id)}
                                    disabled={!ratings[dish._id] || submitting}
                                    className="w-full justify-center transition-all h-9 text-caption"
                                  >
                                    Submit Review
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Full Weekly Menu */}
      {menu && (
        <Card className="overflow-hidden shadow-none border-hairline">
          <div className="p-4 border-b bg-surface-soft">
            <h2 className="text-card-title text-ink leading-tight">Weekly Menu</h2>
            {menu.generatedAt && (
              <p className="text-caption text-muted mt-1">Generated: <span className="font-mono text-data">{formatDate(menu.generatedAt)}</span></p>
            )}
          </div>
          <div className="overflow-x-auto w-full">
            <Table className="table-fixed min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] lg:w-[120px] sticky left-0 bg-surface-soft z-10 border-r border-hairline">Day</TableHead>
                  {menu.meals.map((m: any) => (
                    <TableHead key={m.mealName}>
                      <div className="flex flex-col">
                        <span>{m.mealName}</span>
                        {m.startTime && m.endTime && <span className="text-[10px] font-normal text-muted tracking-wide">({m.startTime} - {m.endTime})</span>}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map((day, index) => (
                  <TableRow key={day}>
                    <TableCell className="text-body text-ink font-medium sticky left-0 bg-canvas z-10 border-r border-hairline">{day}</TableCell>
                    {menu.meals.map((meal: any) => {
                      const item = meal.slots?.[index]
                      const rotatingNames = item?.rotatingItems?.map((r: any) => r.item?.name).filter(Boolean) || []
                      const fixedNames = item?.fixedItems?.map((d: any) => d.name).filter(Boolean) || []

                      return (
                        <TableCell key={meal.mealName} className="text-body text-ink align-top py-2">
                          {(rotatingNames.length > 0 || fixedNames.length > 0) ? (
                            <div className="whitespace-normal leading-tight">
                              {rotatingNames.length > 0 && (
                                <span className="text-ink">{rotatingNames.join(', ')}</span>
                              )}
                              {rotatingNames.length > 0 && fixedNames.length > 0 && (
                                <span className="text-ink">, </span>
                              )}
                              {fixedNames.length > 0 && (
                                <span className="text-muted opacity-80">{fixedNames.join(', ')}</span>
                              )}
                            </div>
                          ) : (
                            <span className="opacity-50 text-muted">{item?.status === 'CLOSED' ? 'Closed' : '-'}</span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

    </div>
  )
}
