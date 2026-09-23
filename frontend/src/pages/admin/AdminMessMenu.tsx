import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { formatDate } from '../../lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Modal } from '../../components/ui/modal'
import { Trash2, Calendar } from 'lucide-react'
import { MenuSlotsTable } from './components/MenuSlotsTable'
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
  const [menuVariants, setMenuVariants] = useState<any[]>([])
  const [menu, setMenu] = useState<any>(null)
  const [publishing, setPublishing] = useState(false)
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showTrendModal, setShowTrendModal] = useState(false)
  
  // Voting stats state
  const [totalVoters, setTotalVoters] = useState<number>(0)
  const [totalStudents, setTotalStudents] = useState<number>(0)
  const [requestsNewMenu, setRequestsNewMenu] = useState<number>(0)
  const [generating, setGenerating] = useState<boolean>(false)

  // Reviews stats
  const [trendStats, setTrendStats] = useState<any[]>([])

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyMenus, setHistoryMenus] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [viewingPastMenu, setViewingPastMenu] = useState<any>(null)
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null)

  const fetchMenuData = () => {
    request('/admin/menu/preview').then((res: any) => {
      if (Array.isArray(res)) {
        setMenuVariants(res)
        if (res.length > 0) {
          setMenu((prev: any) => {
            const m = res.find((m: any) => m._id === prev?._id) || res[0];
            if (m.solverFailures && m.solverFailures.length > 0) {
              setTimeout(() => toast.error(`Solver Warnings:\n${m.solverFailures.join('\n')}`, { duration: 6000 }), 500);
            }
            return m;
          });
        } else {
          setMenu(null)
        }
      } else {
        // Fallback if backend hasn't updated or returns single menu
        setMenuVariants(res ? [res] : [])
        setMenu(res)
        if (res?.solverFailures && res.solverFailures.length > 0) {
           setTimeout(() => toast.error(`Solver Warnings:\n${res.solverFailures.join('\n')}`, { duration: 6000 }), 500);
        }
      }
      // setHasUnsavedChanges(false)
    }).catch((err: any) => {
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

  /* const saveMenuEdits = async () => {
    try {
      await request('/admin/menu/update', 'PUT', { meals: menu.meals })
      setHasUnsavedChanges(false)
      toast.success('Menu edits saved successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save menu edits')
    }
  } */

  const publishMenu = async () => {
    try {
      setPublishing(true)
      /* if (hasUnsavedChanges) {
        await request('/admin/menu/update', 'PUT', { menuId: menu._id, meals: menu.meals })
        setHasUnsavedChanges(false)
      } */
      await request('/admin/menu/publish', 'POST', { menuId: menu._id })
      setMenu((prev: any) => ({ ...prev, status: 'PUBLISHED' }))
      toast.success('Menu published successfully!')
      fetchMenuData() // Refresh to clear old drafts
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish menu')
    } finally {
      setPublishing(false)
    }
  }

  const swapDish = (mealIndex: number, dayIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const slots = menu.meals[mealIndex].slots;
    
    let targetDayIndex = dayIndex;
    let found = false;
    
    while (true) {
      targetDayIndex = direction === 'up' ? targetDayIndex - 1 : targetDayIndex + 1;
      if (targetDayIndex < 0 || targetDayIndex > 6) break;
      
      if (slots[targetDayIndex] && slots[targetDayIndex].rotatingItems && slots[targetDayIndex].rotatingItems.length > itemIndex) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      toast.error('No valid day to swap with in that direction');
      return;
    }
    
    const newMenu = JSON.parse(JSON.stringify(menu));
    // const newMenu = JSON.parse(JSON.stringify(prev));
      const newSlots = newMenu.meals[mealIndex].slots;
      
      const currentItem = newSlots[dayIndex].rotatingItems[itemIndex];
      const targetItem = newSlots[targetDayIndex].rotatingItems[itemIndex];
      
      newSlots[dayIndex].rotatingItems[itemIndex] = targetItem;
      newSlots[targetDayIndex].rotatingItems[itemIndex] = currentItem;
      
    setMenu(newMenu);
    // Auto-save
    request('/admin/menu/update', 'PUT', { meals: newMenu.meals }).then(() => { toast.success('Menu auto-saved'); }).catch((e: any) => { toast.error(e.message || 'Auto-save failed'); });
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

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const res = await request('/admin/menu/history')
      setHistoryMenus(res)
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const openHistory = () => {
    setShowHistoryModal(true)
    setViewingPastMenu(null)
    fetchHistory()
  }

  const handleDeleteMenu = async (id: string) => {
    try {
      await request(`/admin/menu/${id}`, 'DELETE')
      toast.success('Menu deleted successfully')
      // Update locally to avoid loading buffer
      setHistoryMenus(prev => prev.filter(m => m._id !== id))
      // If the currently viewed menu was deleted, refresh preview
      if (menu && menu._id === id) {
        fetchMenuData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete menu')
    } finally {
      setMenuToDelete(null)
    }
  }

  return (
    <>
    <div className="space-y-6">

      {/* HISTORY MODAL */}
      <Modal 
        isOpen={showHistoryModal} 
        onClose={() => { 
          if (viewingPastMenu) {
            setViewingPastMenu(null);
          } else {
            setShowHistoryModal(false);
          }
        }} 
        title={viewingPastMenu ? "Past Menu Details" : "Menu History"} 
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col">
          {loadingHistory ? (
            <div className="text-center p-8 text-muted">Loading history...</div>
          ) : viewingPastMenu ? (
            <div className="flex flex-col gap-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-card-title text-ink">{viewingPastMenu.variantLabel || 'Standard Menu'}</h3>
                  <span className="text-body text-muted flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Effective From: {formatDate(viewingPastMenu.effectiveFrom)} 
                    {viewingPastMenu.effectiveTo ? ` - ${formatDate(viewingPastMenu.effectiveTo)}` : ' - Present'}
                  </span>
                </div>
                <Button variant="secondary" onClick={() => setViewingPastMenu(null)}>Back to History</Button>
              </div>
              
              <div className="overflow-x-auto overflow-y-auto max-h-[65vh] w-full border border-hairline rounded-lg mt-2">
                <Table className="table-fixed min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-surface-soft">
                      <TableHead className="w-[100px] lg:w-[120px]">Day</TableHead>
                      {viewingPastMenu.meals.map((meal: any) => (
                        <TableHead key={meal.mealName}>
                          <div className="flex flex-col">
                            <span>{meal.mealName}</span>
                            {meal.startTime && meal.endTime && <span className="text-[10px] text-muted tracking-wide">({meal.startTime} - {meal.endTime})</span>}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {days.map((day, index) => (
                      <TableRow key={day} className="transition-colors hover:bg-surface-soft">
                        <TableCell className="text-ink">{day}</TableCell>
                        {viewingPastMenu.meals.map((meal: any) => {
                          const slot = meal.slots?.[index];
                          if (!slot) return <TableCell key={meal.mealName} className="text-muted"><span className="">-</span></TableCell>;
                          
                          const fixedNames = slot.fixedItems?.map((d: any) => d.name) || [];
                          
                          return (
                            <TableCell key={meal.mealName} className="text-body-sm border-l border-hairline align-top py-2">
                              {(fixedNames.length > 0 || (slot.rotatingItems && slot.rotatingItems.length > 0)) ? (
                                <div className="flex flex-col gap-1">
                                  {slot.rotatingItems?.map((r: any, i: number) => {
                                    const name = r.item?.name || r.item?.dishId?.name;
                                    if (!name) return null;
                                    return <span key={`rot-${i}`} className="text-ink whitespace-normal text-body opacity-100">{name}</span>
                                  })}
                                  {fixedNames.map((name: string, i: number) => (
                                    <span key={`fix-${i}`} className="text-body whitespace-normal text-ink">{name}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <p className="text-body-sm text-muted">
                View past published menus or delete old ones to reset generation history.
              </p>
              <div className="flex flex-col">
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh] w-full border border-hairline rounded-lg bg-canvas">
                  <Table>
                        <TableHeader className="bg-surface-soft">
                          <TableRow>
                            <TableHead>Effective Period</TableHead>
                            <TableHead>Variant Name</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyMenus.length > 0 ? (
                            historyMenus.map(hMenu => (
                              <TableRow 
                                key={hMenu._id} 
                                className="transition-colors hover:bg-surface-soft cursor-pointer"
                                onClick={(e) => {
                                  // Don't trigger if clicking delete button
                                  if ((e.target as HTMLElement).closest('button')) return;
                                  setViewingPastMenu(hMenu);
                                }}
                              >
                                <TableCell className="text-ink whitespace-nowrap">
                                  <div className="text-caption text-muted flex items-center gap-2">
                                    <span className="bg-canvas px-1.5 py-0.5 rounded border border-hairline">
                                      {hMenu.effectiveFrom ? formatDate(hMenu.effectiveFrom) : 'N/A'}
                                    </span>
                                    to
                                    <span className="bg-canvas px-1.5 py-0.5 rounded border border-hairline">
                                      {hMenu.effectiveTo ? formatDate(hMenu.effectiveTo) : 'Present'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted text-body-sm">
                                  {hMenu.variantLabel || 'Standard Menu'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px]  border ${
                                    hMenu.status === 'PUBLISHED' ? 'border-[var(--color-semantic-success)] text-[var(--color-semantic-success)] bg-[var(--color-semantic-success)]/10' :
                                    'border-muted text-muted bg-surface-soft'
                                  }`}>
                                    {hMenu.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {hMenu.status !== 'PUBLISHED' && (
                                    <button
                                      title="Delete from History"
                                      onClick={() => setMenuToDelete(hMenu._id)}
                                      className="p-1.5 text-muted hover:text-(--color-semantic-error) hover:bg-(--color-semantic-error)/10 rounded transition-colors inline-block"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted">
                                No published history found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
            </div>
          )}
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={!!menuToDelete} onClose={() => setMenuToDelete(null)} title="Confirm Deletion" maxWidth="max-w-md">
        <div className="p-4 flex flex-col gap-4">
          <p className="text-body text-ink">
            Are you sure you want to delete this menu from history? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setMenuToDelete(null)}>Cancel</Button>
            <Button variant="primary" className="bg-[var(--color-semantic-error)] text-white hover:bg-[var(--color-semantic-error)]/90 border-transparent" onClick={() => handleDeleteMenu(menuToDelete!)}>
              Delete Menu
            </Button>
          </div>
        </div>
      </Modal>

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
            <strong className="">{totalVoters}/{totalStudents}</strong> have voted. <strong className="">{requestsNewMenu}</strong> users request for a new menu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto mt-3 lg:mt-0">
          <Button onClick={openHistory} variant="secondary" className="flex-1 sm:flex-none whitespace-nowrap">
            View History
          </Button>
          <Button onClick={() => setShowTrendModal(true)} variant="secondary" className="flex-1 sm:flex-none whitespace-nowrap">
            Rating Stats
          </Button>
          <Button onClick={handleGenerateMenu} disabled={generating || totalVoters === 0} variant="secondary" className="flex-1 sm:flex-none whitespace-nowrap">
            {generating ? 'Generating...' : 'Generate New Menu'}
          </Button>
          {/*
            <Button 
              onClick={saveMenuEdits} 
              variant="secondary"
              className="text-body-sm"
            >
              Save Edits
            </Button>
          */}
          {menu && (
            <Button 
              onClick={publishMenu}
              disabled={publishing || menu.status === 'PUBLISHED'}
              variant={menu.status === 'PUBLISHED' ? 'secondary' : 'primary'}
              className="text-body-sm px-6"
            >
              {publishing
                ? 'Publishing...'
                : menu.status === 'PUBLISHED'
                ? 'Published'
                : 'Publish Menu'}
            </Button>
          )}
        </div>
      </div>

      {menuVariants.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4 animate-fade-in stagger-1">
          {menuVariants.map((variant) => (
            <Button 
              key={variant._id} 
              variant={menu?._id === variant._id ? "primary" : "secondary"}
              onClick={() => {
                /*
                  if (!window.confirm('You have unsaved changes. Switch variant anyway?')) return;
                */
                setMenu(variant)
                setMenu(variant)
              }}
              className="text-body-sm"
            >
              {variant.variantLabel || 'Variant'}
            </Button>
          ))}
        </div>
      )}

      <Card className="overflow-hidden shadow-none border-hairline animate-fade-in stagger-2">
        {!menu ? (
          <div className="p-8 text-center text-body text-muted">
            No menu generated yet. Click "Generate New Menu" to create one based on current votes.
          </div>
        ) : (
          <MenuSlotsTable menu={menu} swapDish={swapDish} />
        )}
      </Card>
    </div>
    </>
  )
}
