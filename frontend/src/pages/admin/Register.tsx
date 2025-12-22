import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    hostelName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // Step 1: Hostel Info, Step 2: Admin Info
  const navigate = useNavigate()

  const generateDomain = (hostelName: string): string => {
    return hostelName
      .toLowerCase()
      .replace(/\s+/g, '')
      .substring(0, 10) + '.com';
  };

  const domain = generateDomain(formData.hostelName);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hostelName.trim()) {
      setError('Please enter hostel name');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.adminName.trim()) {
      setError('Please enter admin name');
      return;
    }

    if (formData.adminPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.adminEmail.endsWith(`@${domain}`)) {
      setError(`Email must be in format: admin@${domain}`);
      return;
    }

    setLoading(true);

    try {
      await authService.registerAdmin({
        hostelName: formData.hostelName,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword
      });

      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setStep(1); // Go back to first step on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-1">HostelHub</h1>
          <p className="text-black/60">Hostel Registration</p>
        </div>

        {error && (
          <div className="p-3 border-2 border-black/30 rounded-lg bg-black/5 text-sm text-black">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-3">
            <div>
              <label htmlFor="hostelName" className="block text-sm font-medium mb-2">
                Hostel Name
              </label>
              <input
                type="text"
                id="hostelName"
                name="hostelName"
                value={formData.hostelName}
                onChange={handleChange}
                placeholder="e.g., DGH Hostel"
                required
                className="w-full px-4 py-2 border-2 border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>

            {formData.hostelName && (
              <div className="p-3 border-2 border-black/20 rounded-lg bg-black/5">
                <p className="text-sm">
                  <span className="font-medium">Domain:</span> <span className="font-mono">@{domain}</span>
                </p>
                <p className="text-xs text-black/60 mt-1">Admin email must match this domain</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-black text-white font-semibold rounded-lg hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition"
            >
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Hostel</label>
              <div className="px-4 py-2 bg-black/10 rounded-lg font-medium">
                {formData.hostelName}
              </div>
            </div>

            <div>
              <label htmlFor="adminName" className="block text-sm font-medium mb-2">
                Admin Name
              </label>
              <input
                type="text"
                id="adminName"
                name="adminName"
                value={formData.adminName}
                onChange={handleChange}
                placeholder="Full name"
                required
                className="w-full px-4 py-2 border-2 border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>

            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium mb-2">
                Admin Email
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="adminEmail"
                  name="adminEmail"
                  value={formData.adminEmail.replace(`@${domain}`, '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value + `@${domain}` }))}
                  placeholder="admin"
                  required
                  className="flex-1 px-4 py-2 border-2 border-r-0 border-black/20 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
                />
                <div className="px-3 py-2 bg-black/10 border-2 border-l-0 border-black/20 rounded-r-lg font-medium flex items-center">
                  @{domain}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="adminPassword"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                className="w-full px-4 py-2 border-2 border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="w-full px-4 py-2 border-2 border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 bg-black/20 text-black font-semibold rounded-lg hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-black text-white font-semibold rounded-lg hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-black/60 text-sm">
          Already have an account? <a href="/login" className="text-black hover:underline font-medium">Login here</a>
        </p>
      </div>
    </div>
  );
}
