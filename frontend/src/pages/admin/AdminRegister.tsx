import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

const JS_DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
]

const DEFAULT_MEALS = [
  { mealName: 'Breakfast', offDays: [] as number[], categories: [{ categoryName: 'Main Course' }, { categoryName: 'Beverage' }, { categoryName: 'Bread' }, { categoryName: 'Condiment' }] },
  { mealName: 'Lunch', offDays: [] as number[], categories: [{ categoryName: 'Main Course' }, { categoryName: 'Lentils' }, { categoryName: 'Rice' }, { categoryName: 'Sides' }, { categoryName: 'Condiment' }, { categoryName: 'Bread' }] },
  { mealName: 'Snack', offDays: [] as number[], categories: [{ categoryName: 'Snacks' }] },
  { mealName: 'Dinner', offDays: [] as number[], categories: [{ categoryName: 'Main Course' }, { categoryName: 'Lentils' }, { categoryName: 'Rice' }, { categoryName: 'Sides' }, { categoryName: 'Dessert' }, { categoryName: 'Bread' }] }
];

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    hostelName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  })
  const [mealPlan, setMealPlan] = useState(DEFAULT_MEALS)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.hostelName.trim()) { setError('Please enter hostel name'); return; }
    if (!formData.adminName.trim()) { setError('Please enter admin name'); return; }
    if (formData.adminPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (formData.adminPassword !== formData.confirmPassword) { setError('Passwords do not match'); return; }

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.registerAdmin({
        hostelName: formData.hostelName,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        mealPlan
      });
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleOffDay = (mealIndex: number, dayValue: number) => {
    const updatedPlan = [...mealPlan];
    const offDays = updatedPlan[mealIndex].offDays;
    if (offDays.includes(dayValue)) {
      updatedPlan[mealIndex].offDays = offDays.filter(d => d !== dayValue);
    } else {
      updatedPlan[mealIndex].offDays.push(dayValue);
    }
    setMealPlan(updatedPlan);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 overflow-y-auto">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-headline mb-1">Hostel Registration</h1>
          <p className="text-body-sm text-muted">Step {step} of 2</p>
        </div>

        {error && (
          <div className="p-3 border border-hairline rounded bg-surface-soft text-body-sm text-ink">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label htmlFor="hostelName" className="block text-body-sm mb-2">Hostel Name</label>
              <Input type="text" id="hostelName" name="hostelName" value={formData.hostelName} onChange={handleChange} placeholder="Enter hostel name" required />
              {formData.hostelName.trim() && (
                <p className="text-caption text-muted mt-2">
                  Your generated login ID: <span className="font-mono text-ink">admin@{formData.hostelName.toLowerCase().replace(/\s+/g, '').substring(0, 10)}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="adminName" className="block text-body-sm mb-2">Admin Name</label>
              <Input type="text" id="adminName" name="adminName" value={formData.adminName} onChange={handleChange} placeholder="Enter admin name" required />
            </div>

            <div>
              <label htmlFor="adminEmail" className="block text-body-sm mb-2">Personal Email (for recovery)</label>
              <Input type="email" id="adminEmail" name="adminEmail" value={formData.adminEmail} onChange={handleChange} placeholder="Enter email address" required />
            </div>

            <div>
              <label htmlFor="adminPassword" className="block text-body-sm mb-2">Password</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} id="adminPassword" name="adminPassword" value={formData.adminPassword} onChange={handleChange} placeholder="Enter password" required className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink transition-colors focus:outline-none">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-body-sm mb-2">Confirm Password</label>
              <div className="relative">
                <Input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required className="pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink transition-colors focus:outline-none">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button variant="primary" type="submit" className="w-full mt-6">
              Next: Configure Meals
            </Button>
            
            <p className="text-center text-muted text-body-sm mt-4">
              Already have an account? <a href="/login" className="text-ink hover:underline">Login here</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
              <h2 className="text-card-title text-ink mb-1">Meal Schedule (Off Days)</h2>
              <p className="text-body-sm text-muted mb-4">Select the days when specific meals will NOT be served (e.g. no snacks on weekends).</p>
            </div>
            
            <div className="space-y-4">
              {mealPlan.map((meal, index) => (
                <div key={meal.mealName} className="p-4 border border-hairline rounded bg-surface-soft">
                  <h3 className="font-medium text-ink mb-3">{meal.mealName}</h3>
                  <div className="flex flex-wrap gap-2">
                    {JS_DAYS.map(day => {
                      const isOff = meal.offDays.includes(day.value);
                      return (
                        <button
                          type="button"
                          key={day.value}
                          onClick={() => toggleOffDay(index, day.value)}
                          className={`px-3 py-1.5 rounded text-body-sm transition-colors border ${
                            isOff 
                              ? 'bg-(--color-semantic-error)/10 border-(--color-semantic-error)/30 text-(--color-semantic-error)' 
                              : 'bg-(--color-canvas) border-(--color-hairline) text-(--color-ink) hover:border-(--color-ink)/30'
                          }`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                  {meal.offDays.length > 0 && (
                    <p className="text-caption text-(--color-semantic-error) mt-2">
                      Off on: {JS_DAYS.filter(d => meal.offDays.includes(d.value)).map(d => d.label).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button variant="primary" type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating Hostel...' : 'Complete Registration'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
