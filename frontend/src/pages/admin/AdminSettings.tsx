import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import toast from 'react-hot-toast'
import { Trash2, Plus, Ban, CheckCircle, Sparkles } from 'lucide-react'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AdminSettings() {
  const { request } = useApi()
  const { logout } = useAuth()
  const [activeSection, setActiveSection] = useState<'general' | 'meals' | 'maintenance' | 'constraints' | 'danger'>('general')
  const [settings, setSettings] = useState<any>(null)
  const [initialSettings, setInitialSettings] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  
  // Constraints state
  const [constraintsText, setConstraintsText] = useState('')
  const [previewedText, setPreviewedText] = useState('')
  const [parsedConstraints, setParsedConstraints] = useState<any[]>([])
  const [previewText, setPreviewText] = useState('')
  const [previewErrors, setPreviewErrors] = useState<string[]>([])
  const [previewing, setPreviewing] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, type: 'mealCat' | 'issueCat', mealIndex?: number, catIndex: number, replacementCatIndex?: number } | null>(null)
  const [categoryReassignments, setCategoryReassignments] = useState<any[]>([])

  const fetchSettings = () => {
    request('/admin/settings').then(res => {
      setSettings(res)
      setInitialSettings(JSON.parse(JSON.stringify(res)))
      setConstraintsText(res.menuConstraintsText || '')
      setPreviewedText(res.menuConstraintsText || '')
    }).catch(err => {
      toast.error(err.message || 'Failed to fetch settings')
    })
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id as any)
        }
      })
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 })

    const sections = ['general', 'meals', 'maintenance', 'constraints']
    sections.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [settings]) // Re-run observer setup when settings load and DOM is populated

  const saveSettings = async () => {
    if (!settings.defaultPassword || !settings.defaultPassword.trim()) {
      toast.error('Default password cannot be empty')
      return
    }

    try {
      setSaving(true)
      
      // Save general settings
      await request('/admin/settings', 'PUT', { ...settings, categoryReassignments })
      
      // Save constraints if changed and previewed
      if (constraintsText !== initialSettings.menuConstraintsText) {
        await request('/admin/settings/menu-constraints/confirm', 'POST', {
          text: constraintsText,
          constraints: parsedConstraints
        })
      }

      toast.success('Settings saved successfully')
      
      const newSettings = { 
        ...settings, 
        menuConstraintsText: constraintsText,
        ...(constraintsText !== initialSettings.menuConstraintsText ? { menuConstraints: parsedConstraints } : {})
      }
      setSettings(newSettings)
      setInitialSettings(JSON.parse(JSON.stringify(newSettings)))
      setCategoryReassignments([])
      setPreviewedText(constraintsText)
      setPreviewText('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePreviewConstraints = async () => {
    if (!constraintsText.trim()) {
      setParsedConstraints([])
      setPreviewText('No constraints defined.')
      setPreviewErrors([])
      setPreviewedText(constraintsText)
      return
    }

    try {
      setPreviewing(true)
      setPreviewErrors([])
      
      const res = await request('/admin/settings/menu-constraints/preview', 'POST', { text: constraintsText }, { skipToast: true })
      
      setParsedConstraints(res.constraints)
      setPreviewText(res.preview)
      setPreviewedText(constraintsText)
    } catch (err: any) {
      if (err.message === 'Could not produce a consistent rule set') {
        // The API returns 422 with the errors array if validation fails. 
        // Our useApi will throw an Error with the message, so we can't easily get the error array unless we modify useApi.
        // Wait, useApi returns the parsed json on success, but throws on error.
        // I will just show the error message. Wait, let me handle the 422 properly if I can.
        setPreviewErrors(['Validation failed: Check your logic for conflicting rules.'])
      } else {
        toast.error(err.message || 'Failed to parse constraints')
      }
    } finally {
      setPreviewing(false)
    }
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings) || constraintsText !== initialSettings?.menuConstraintsText
  const canSaveConstraints = constraintsText === previewedText && previewErrors.length === 0

  const handleDeleteConfirm = () => {
    if (!deleteModal || !settings) return
    const { type, mealIndex, catIndex, replacementCatIndex } = deleteModal
    
    const newSettings = { ...settings }
    
    if (type === 'mealCat' && mealIndex !== undefined) {
      const oldCat = newSettings.mealPlan[mealIndex].categories[catIndex];
      const newCat = replacementCatIndex !== undefined ? newSettings.mealPlan[mealIndex].categories[replacementCatIndex] : null;
      if (newCat) {
        setCategoryReassignments([...categoryReassignments, {
          mealName: newSettings.mealPlan[mealIndex].mealName,
          oldCategory: oldCat.categoryName,
          newCategory: newCat.categoryName
        }]);
      }
      newSettings.mealPlan[mealIndex].categories.splice(catIndex, 1)
    } else if (type === 'issueCat') {
      newSettings.issueCategories.splice(catIndex, 1)
    }
    
    setSettings(newSettings)
    setDeleteModal(null)
  }

  const [deleteHostelModal, setDeleteHostelModal] = useState(false)
  const [deleteHostelConfirm, setDeleteHostelConfirm] = useState('')
  const [deletingHostel, setDeletingHostel] = useState(false)

  const handleDeleteHostel = async () => {
    if (deleteHostelConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm.')
      return
    }
    try {
      setDeletingHostel(true)
      await request('/admin/settings/hostel', 'DELETE')
      toast.success('Hostel deleted successfully')
      logout()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete hostel')
    } finally {
      setDeletingHostel(false)
      setDeleteHostelModal(false)
    }
  }

  const toggleMealCategoryActive = (mealIndex: number, catIndex: number) => {
    const newSettings = { ...settings }
    const cat = newSettings.mealPlan[mealIndex].categories[catIndex]
    cat.isActive = !cat.isActive
    setSettings(newSettings)
  }

  const toggleMealActive = (mealIndex: number) => {
    const newSettings = { ...settings }
    const meal = newSettings.mealPlan[mealIndex]
    meal.isActive = meal.isActive === false ? true : false
    setSettings(newSettings)
  }

  const addMealCategory = (mealIndex: number) => {
    const name = window.prompt("Enter new meal category name (Dessert, Main, etc):")
    if (!name?.trim()) return
    const newSettings = { ...settings }
    newSettings.mealPlan[mealIndex].categories.push({ categoryName: name.trim(), isActive: true })
    setSettings(newSettings)
  }

  const toggleOffDay = (mealIndex: number, dayIndex: number) => {
    const newSettings = { ...settings }
    const offDays = newSettings.mealPlan[mealIndex].offDays
    if (offDays.includes(dayIndex)) {
      newSettings.mealPlan[mealIndex].offDays = offDays.filter((d: number) => d !== dayIndex)
    } else {
      offDays.push(dayIndex)
    }
    setSettings(newSettings)
  }

  const toggleIssueCategoryActive = (catIndex: number) => {
    const newSettings = { ...settings }
    const cat = newSettings.issueCategories[catIndex]
    cat.isActive = !cat.isActive
    setSettings(newSettings)
  }

  const addIssueCategory = () => {
    const name = window.prompt("Enter new maintenance category (IT, Cleaning, etc):")
    if (!name?.trim()) return
    const newSettings = { ...settings }
    newSettings.issueCategories.push({ name: name.trim(), isActive: true })
    setSettings(newSettings)
  }

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted text-body">Loading settings...</p>
      </div>
    )
  }

  return (
    <>
    <div className="w-full mx-auto pb-24 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-8 mt-2">
        {/* Navigation Sidebar */}
        <div className="lg:w-64 shrink-0 hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-1 border border-hairline p-2 rounded-lg bg-canvas">
            <a href="#general" className={`px-3 py-2 text-body rounded transition-colors ${activeSection === 'general' ? 'bg-(--color-primary)/10 text-(--color-primary) ' : 'text-ink hover:bg-surface-soft'}`}>General</a>
            <a href="#meals" className={`px-3 py-2 text-body rounded transition-colors ${activeSection === 'meals' ? 'bg-(--color-primary)/10 text-(--color-primary) ' : 'text-ink hover:bg-surface-soft'}`}>Mess Menu Config</a>
            <a href="#maintenance" className={`px-3 py-2 text-body rounded transition-colors ${activeSection === 'maintenance' ? 'bg-(--color-primary)/10 text-(--color-primary) ' : 'text-ink hover:bg-surface-soft'}`}>Maintenance</a>
            <a href="#constraints" className={`px-3 py-2 text-body rounded transition-colors ${activeSection === 'constraints' ? 'bg-(--color-primary)/10 text-(--color-primary) ' : 'text-ink hover:bg-surface-soft'}`}>AI Menu Rules</a>
            <a href="#danger" className={`px-3 py-2 text-body rounded transition-colors ${activeSection === 'danger' ? 'bg-(--color-semantic-error)/10 text-(--color-semantic-error) ' : 'text-(--color-semantic-error) hover:bg-surface-soft'}`}>Danger Zone</a>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-12">
          {/* General Section */}
          <section id="general" className="scroll-mt-24 space-y-6">
          <Card className="p-6 shadow-none border-hairline">
            <h2 className="text-card-title text-ink mb-1">Default User Password</h2>
            <div className="w-full">
              <p className="text-body-xs text-muted mb-4">
                This password will be assigned to all new users created individually or in bulk if no password is provided. If left empty, a random password will be generated for each user.
              </p>
              <div className="max-w-md">
                <Input
                  type="text"
                  value={settings.defaultPassword || ''}
                  onChange={(e: any) => setSettings({ ...settings, defaultPassword: e.target.value })}
                  placeholder="Enter default password"
                />
              </div>
            </div>
          </Card>
          </section>

          {/* Meals Section */}
          <section id="meals" className="scroll-mt-24">
            <h2 className="text-card-title text-ink mb-4 pb-2 border-b border-hairline">Mess Menu Configuration</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {settings.mealPlan.map((meal: any, mIdx: number) => (
            <Card key={meal.mealName} className={`p-5 shadow-none border-hairline transition-opacity ${meal.isActive === false ? 'opacity-70 bg-surface-soft' : ''}`}>
              <div className="flex justify-between items-start mb-4 border-b border-hairline pb-4">
                <div>
                  <h2 className={`text-card-title ${meal.isActive !== false ? 'text-ink' : 'text-muted line-through'}`}>{meal.mealName}</h2>
                  {meal.isActive === false && <p className="text-caption text-(--color-semantic-error) mt-1">MEAL DEACTIVATED</p>}
                </div>
                <button 
                  onClick={() => toggleMealActive(mIdx)}
                  className={`p-2 rounded transition-colors ${meal.isActive !== false ? 'text-(--color-semantic-warning) hover:bg-canvas' : 'text-(--color-semantic-success) hover:bg-surface-hover bg-canvas border border-hairline'}`}
                  title={meal.isActive !== false ? "Deactivate Meal" : "Activate Meal"}
                >
                  {meal.isActive !== false ? <Ban size={20} /> : <CheckCircle size={20} />}
                </button>
              </div>
              
              <div className={`transition-all ${meal.isActive === false ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="mb-6">
                  <h3 className="text-body text-muted mb-2">Off-Days (No meal served)</h3>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day, dIdx) => {
                    const isOff = meal.offDays.includes(dIdx)
                    return (
                      <button
                        key={day}
                        onClick={() => toggleOffDay(mIdx, dIdx)}
                        className={`px-3 py-1 text-body-sm rounded-full border transition-colors ${
                          isOff 
                            ? 'bg-(--color-semantic-error) text-white border-transparent' 
                            : 'bg-surface-soft text-muted border-hairline hover:bg-surface-hover hover:text-ink'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-body text-muted">Categories</h3>
                  <button onClick={() => addMealCategory(mIdx)} className="text-primary text-body-sm hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add Category
                  </button>
                </div>
                <div className="space-y-2">
                  {meal.categories.map((cat: any, cIdx: number) => (
                    <div key={cIdx} className={`flex items-center justify-between p-2 rounded border ${cat.isActive ? 'bg-surface-soft border-hairline' : 'bg-canvas border-hairline opacity-60'}`}>
                      <span className={`text-body ${cat.isActive ? 'text-ink' : 'text-muted line-through'}`}>{cat.categoryName}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleMealCategoryActive(mIdx, cIdx)}
                          className={`p-1.5 rounded transition-colors ${cat.isActive ? 'text-(--color-semantic-warning) hover:bg-canvas' : 'text-(--color-semantic-success) hover:bg-surface-hover'}`}
                          title={cat.isActive ? "Deactivate" : "Activate"}
                        >
                          {cat.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, type: 'mealCat', mealIndex: mIdx, catIndex: cIdx })}
                          className="p-1.5 text-muted hover:text-(--color-semantic-error) hover:bg-canvas rounded transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {meal.categories.length === 0 && <p className="text-body-sm text-muted">No categories defined.</p>}
                </div>
              </div>
              </div>
            </Card>
          ))}
        </div>
          </section>

          {/* Maintenance Section */}
          <section id="maintenance" className="scroll-mt-24 space-y-6">
            <h2 className="text-card-title text-ink mb-2 pb-2 border-b border-hairline">Maintenance Categories</h2>
        <div className="space-y-6">
          <Card className="p-6 shadow-none border-hairline">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-card-title text-ink">Issue Categories</h2>
              <p className="text-body-sm text-muted mt-1">Categories students can select when raising an issue.</p>
            </div>
            <Button onClick={addIssueCategory} variant="secondary" className="flex items-center gap-2">
              <Plus size={16} /> Add Category
            </Button>
          </div>

          <div className="space-y-3">
            {settings.issueCategories.map((cat: any, cIdx: number) => (
              <div key={cIdx} className={`flex items-center justify-between p-3 rounded border ${cat.isActive ? 'bg-surface-soft border-hairline' : 'bg-canvas border-hairline opacity-60'}`}>
                <span className={`text-body ${cat.isActive ? 'text-ink' : 'text-muted line-through'}`}>{cat.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-body-xs text-muted uppercase">{cat.isActive ? 'Active' : 'Inactive'}</span>
                  <button 
                    onClick={() => toggleIssueCategoryActive(cIdx)}
                    className={`p-1.5 rounded transition-colors ${cat.isActive ? 'text-(--color-semantic-warning) hover:bg-canvas' : 'text-(--color-semantic-success) hover:bg-surface-hover'}`}
                    title={cat.isActive ? "Deactivate" : "Activate"}
                  >
                    {cat.isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button 
                    onClick={() => setDeleteModal({ isOpen: true, type: 'issueCat', catIndex: cIdx })}
                    className="p-1.5 text-muted hover:text-(--color-semantic-error) hover:bg-canvas rounded transition-colors"
                    title="Delete Permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {settings.issueCategories.length === 0 && <p className="text-body-sm text-muted">No categories defined.</p>}
          </div>
        </Card>

        <Card className="p-6 shadow-none border-hairline">
          <h2 className="text-card-title text-ink">General Maintenance Settings</h2>
          <p className="text-body-sm text-muted mt-1 mb-6">Configure default behaviors for handling student issues.</p>
          
          <div>
            <label className="block text-body-sm text-ink mb-2">Default Closure Remark</label>
            <Textarea
              value={settings.defaultResolverNote || ''}
              onChange={(e) => setSettings({...settings, defaultResolverNote: e.target.value})}
              className="w-full"
              rows={3}
              placeholder="Fixed the issue as requested."
            />
            <p className="text-caption text-muted mt-2 normal-case tracking-normal">This note will be pre-filled when you resolve or close an issue. You can still edit it before submitting.</p>
          </div>
        </Card>
        </div>
          </section>

          {/* Constraints Section */}
          <section id="constraints" className="scroll-mt-24">
        <div className="space-y-6">
          <Card className="p-6 shadow-none border-hairline">
            <h2 className="text-card-title text-ink flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-(--color-primary)" />
              Menu Constraints 
            </h2>
            <p className="text-body-sm text-muted mt-1 mb-6">
              Write plain English rules for the menu generator. The AI will parse them into strict constraints. Examples include: "Require paneer on Monday for dinner", "Close the mess on Sunday breakfast", "Limit desserts to 2 per week".
            </p>

            <Textarea
              value={constraintsText}
              onChange={(e) => setConstraintsText(e.target.value)}
              className="w-full h-40 font-mono text-body-sm"
              placeholder="Enter your menu rules here..."
            />

            <div className="mt-4 flex justify-end">
              <Button onClick={handlePreviewConstraints} disabled={previewing} variant="secondary">
                {previewing ? 'Parsing...' : 'Preview Rules'}
              </Button>
            </div>

            {previewText && (
              <div className="mt-8 p-5 bg-surface-soft/50 border border-hairline rounded-lg">
                <h3 className="text-body text-ink mb-2">AI Interpretation</h3>
                <p className="text-body-sm text-muted italic">{previewText}</p>
                
                {previewErrors.length > 0 && (
                  <div className="mt-4 p-3 bg-(--color-semantic-error)/10 border border-(--color-semantic-error)/20 rounded-md">
                    <h4 className="text-caption text-(--color-semantic-error) mb-1 uppercase tracking-wider">Conflicts Detected</h4>
                    <ul className="list-disc list-inside text-body-sm text-(--color-semantic-error)/90 space-y-1">
                      {previewErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {settings.menuConstraints?.length > 0 && !previewText && (
              <div className="mt-8">
                <h3 className="text-body text-ink mb-3">Active Rules</h3>
                <div className="space-y-2">
                  {settings.menuConstraints.map((c: any, i: number) => (
                    <div key={i} className="p-3 bg-canvas border border-hairline rounded flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-(--color-primary) mt-1.5 shrink-0" />
                      <span className="text-body-sm text-ink">{c.sourcePhrase}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
        </section>

        {/* Danger Zone */}
          <section id="danger" className="scroll-mt-24 space-y-6">
            <Card className="p-6 shadow-none border-(--color-semantic-error) bg-(--color-semantic-error)/5">
              <h2 className="text-card-title text-(--color-semantic-error) mb-4">Danger Zone</h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-body-sm text-ink max-w-2xl">
                  Permanently delete this hostel and all associated data, including users, dishes, menus, and issues. This action cannot be undone.
                </p>
                <Button 
                  variant="danger"
                  onClick={() => setDeleteHostelModal(true)}
                >
                  Delete Hostel
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </div>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Confirm Deletion">
        <div className="p-6">
          <p className="text-body text-ink mb-4">
            Are you sure you want to permanently delete this category?
          </p>
          {deleteModal?.type === 'mealCat' && (
            <div className="bg-(--color-semantic-error)/10 text-(--color-semantic-error) p-3 rounded text-body-sm mb-4">
              <strong>Warning:</strong> Deleting a meal category requires reassigning existing dishes.
              <div className="mt-3">
                <label className="block mb-1">Reassign existing dishes to:</label>
                <Select 
                  className="w-full"
                  value={deleteModal.replacementCatIndex ?? ''}
                  onChange={e => setDeleteModal({ ...deleteModal, replacementCatIndex: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">-- Do not reassign (Dishes will be deleted) --</option>
                  {settings?.mealPlan[deleteModal.mealIndex!]?.categories.map((c: any, i: number) => 
                    i !== deleteModal.catIndex ? (
                      <option key={i} value={i}>{c.categoryName}</option>
                    ) : null
                  )}
                </Select>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>Yes, Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteHostelModal} onClose={() => setDeleteHostelModal(false)} title="Delete Hostel">
        <div className="p-6">
          <p className="text-body text-ink mb-4">
            Are you absolutely sure you want to permanently delete this hostel? All data will be wiped out.
          </p>
          <div className="bg-(--color-semantic-error)/10 text-(--color-semantic-error) p-3 rounded text-body-sm mb-4">
            <strong>Warning:</strong> This action is irreversible. Please type <strong>DELETE</strong> to confirm.
            <div className="mt-3">
              <Input
                type="text"
                placeholder="Type DELETE"
                value={deleteHostelConfirm}
                onChange={e => setDeleteHostelConfirm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteHostelModal(false)}>Cancel</Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteHostel}
              disabled={deletingHostel || deleteHostelConfirm !== 'DELETE'}
            >
              {deletingHostel ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>

      {/* Frozen Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-canvas/80 backdrop-blur-md border-t border-hairline flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm">
          <Button 
            onClick={saveSettings} 
            disabled={saving || !hasChanges || !canSaveConstraints}
            className={`w-full transition-all shadow-none ${hasChanges && canSaveConstraints ? 'bg-ink text-canvas scale-105' : 'bg-surface-soft text-muted'}`}
          >
            {saving ? 'Saving...' : !canSaveConstraints ? 'Preview Rules First' : hasChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>
    </>
  )
}
