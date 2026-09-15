import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Modal } from '../../components/ui/modal'
import toast from 'react-hot-toast'

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

export default function AdminMessMenu() {
  const { request } = useApi()
  const [menu, setMenu] = useState<any>(null)
  const [publishing, setPublishing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showTrendModal, setShowTrendModal] = useState(false)
  
  // Voting stats state
  const [totalVoters, setTotalVoters] = useState<number>(0)
  const [totalStudents, setTotalStudents] = useState<number>(0)
  const [requestsNewMenu, setRequestsNewMenu] = useState<number>(0)
  const [generating, setGenerating] = useState<boolean>(false)

  // Reviews stats
  const [trendStats, setTrendStats] = useState<any[]>([])

  const fetchMenuData = () => {
    request('/admin/menu/preview').then((res) => {
      setMenu(res)
      setHasUnsavedChanges(false)
    }).catch(err => {
      toast.error(err.message || 'Failed to fetch menu')
    })
  }

  useEffect(() => {
    fetchMenuData()
    // Fetch live voting stats
    request('/admin/menu/voting/stats').then((res: any) => {
      if (res) {
        setTotalVoters(res.totalVoters || 0)
        setTotalStudents(res.totalStudents || 0)
        setRequestsNewMenu(res.requestsNewMenu || 0)
      }
    }).catch(() => {})

    // Fetch review trend stats
    request('/admin/reviews/stats').then((res: any) => {
      if (res?.trendStats) setTrendStats(res.trendStats)
    }).catch(() => {})
  }, [request])

  const saveMenuEdits = async () => {
    try {
      await request('/admin/menu/update', 'PUT', { meals: menu.meals })
      setHasUnsavedChanges(false)
      toast.success('Menu edits saved successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save menu edits')
    }
  }

  const publishMenu = async () => {
    try {
      setPublishing(true)
      if (hasUnsavedChanges) {
        await request('/admin/menu/update', 'PUT', { meals: menu.meals })
        setHasUnsavedChanges(false)
      }
      await request('/admin/menu/publish', 'POST')
      setMenu((prev: any) => ({ ...prev, published: true }))
      toast.success('Menu published successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish menu')
    } finally {
      setPublishing(false)
    }
  }

  const swapDish = (mealIndex: number, dayIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const targetDayIndex = direction === 'up' ? dayIndex - 1 : dayIndex + 1;
    if (targetDayIndex < 0 || targetDayIndex > 6) return;
    
    setMenu((prev: any) => {
      const newMenu = JSON.parse(JSON.stringify(prev));
      const slots = newMenu.meals[mealIndex].slots;
      
      const currentItem = slots[dayIndex].rotatingItems[itemIndex];
      const targetItem = slots[targetDayIndex].rotatingItems[itemIndex];
      
      slots[dayIndex].rotatingItems[itemIndex] = targetItem;
      slots[targetDayIndex].rotatingItems[itemIndex] = currentItem;
      
      return newMenu;
    });
    setHasUnsavedChanges(true);
  }

  const handleGenerateMenu = async () => {
    setGenerating(true)
    try {
      await request('/admin/menu/generate', 'POST', {})
      toast.success('Menu generated successfully!')
      fetchMenuData() // Refresh menu after generation
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Error generating menu')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">




      <Modal isOpen={showTrendModal} onClose={() => setShowTrendModal(false)} title="Overall Rating Trend" maxWidth="max-w-[95vw]">
        {trendStats.length > 0 ? (
          <div className="h-[75vh] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendStats} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(tick) => {
                    const d = new Date(tick);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis stroke="var(--color-muted)" fontSize={12} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: '4px', padding: '4px 8px' }}
                  itemStyle={{ fontWeight: 500, fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="Breakfast" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Breakfast" connectNulls={true} />
                <Line type="monotone" dataKey="Lunch" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Lunch" connectNulls={true} />
                <Line type="monotone" dataKey="Snack" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Snack" connectNulls={true} />
                <Line type="monotone" dataKey="Dinner" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Dinner" connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex justify-center items-center">
            <p className="text-body text-muted">Students haven't submitted enough ratings yet.</p>
          </div>
        )}
      </Modal>



      {/* MENU PREVIEW TABLE */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-4 mt-2">
        <div>
          <h2 className="text-card-title text-ink">Menu Preview</h2>
          <p className="text-body-sm mt-1 text-(--color-semantic-warning)">
            <strong className="font-medium">{totalVoters}/{totalStudents}</strong> have voted. <strong className="font-medium">{requestsNewMenu}</strong> users request for a new menu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto mt-3 lg:mt-0">
          <Button onClick={() => setShowTrendModal(true)} variant="secondary" className="flex-1 sm:flex-none whitespace-nowrap">
            Rating Stats
          </Button>
          <Button onClick={handleGenerateMenu} disabled={generating || totalVoters === 0} variant="secondary" className="flex-1 sm:flex-none whitespace-nowrap">
            {generating ? 'Generating...' : 'Generate New Menu'}
          </Button>
          {menu && !menu.published && hasUnsavedChanges && (
            <Button onClick={saveMenuEdits} variant="secondary" className="flex-1 sm:flex-none whitespace-nowrap">Save Edits</Button>
          )}
          {menu && (
            <Button
              onClick={publishMenu}
              disabled={publishing || menu.published}
              variant={menu.published ? 'secondary' : 'primary'}
              className="flex-1 sm:flex-none whitespace-nowrap"
            >
              {publishing
                ? 'Publishing...'
                : menu.published
                ? 'Published'
                : 'Publish Menu'}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden shadow-none border-hairline">
        {!menu ? (
          <div className="p-8 text-center text-body text-muted">
            No menu generated yet. Click "Generate New Menu" to create one based on current votes.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table className="table-fixed min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-surface-soft">
                  <TableHead className="w-[100px] lg:w-[120px]">Day</TableHead>
                  {menu.meals.map((meal: any) => (
                    <TableHead key={meal.mealName}>
                      <div className="flex flex-col">
                        <span>{meal.mealName}</span>
                        {meal.startTime && meal.endTime && <span className="text-[10px] font-normal text-muted tracking-wide">({meal.startTime} - {meal.endTime})</span>}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map((day, index) => (
                  <TableRow key={day} className="transition-colors hover:bg-surface-soft">
                    <TableCell className="font-medium text-ink">{day}</TableCell>
                    {menu.meals.map((meal: any, mealIndex: number) => {
                      const slot = meal.slots?.[index];
                      if (!slot) return <TableCell key={meal.mealName} className="text-muted"><span className="opacity-30">-</span></TableCell>;
                      
                      const fixedNames = slot.fixedItems?.map((d: any) => d.name) || [];
                      
                      return (
                        <TableCell key={meal.mealName} className="text-sm border-l border-hairline align-top py-2">
                          {(fixedNames.length > 0 || (slot.rotatingItems && slot.rotatingItems.length > 0)) ? (
                            <div className="flex flex-col gap-1">
                              {slot.rotatingItems?.map((r: any, i: number) => {
                                const name = r.item?.dishId?.name;
                                if (!name) return null;
                                return (
                                  <div key={`rot-${i}`} className="flex items-start justify-between gap-1 group">
                                    <span className="text-ink whitespace-normal text-body">{name}</span>
                                    {!menu.published && (
                                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button 
                                          onClick={() => swapDish(mealIndex, index, i, 'up')}
                                          disabled={index === 0}
                                          className="px-1 hover:text-ink text-muted disabled:opacity-0"
                                          title="Move Up"
                                        >↑</button>
                                        <button 
                                          onClick={() => swapDish(mealIndex, index, i, 'down')}
                                          disabled={index === 6}
                                          className="px-1 hover:text-ink text-muted disabled:opacity-0"
                                          title="Move Down"
                                        >↓</button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              {fixedNames.map((name: string, i: number) => (
                                <span key={`fix-${i}`} className="text-body whitespace-normal text-muted opacity-80">{name}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="opacity-30 text-muted">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
