import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface CreateUserPayload {
  name: string;
  email: string;
  registrationNo?: string;
  role: 'STUDENT' | 'WORKER';
  roomNo?: string;
  jobType?: string;
}

interface CreatedUserResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  password?: string;
  loginURL?: string;
  qrToken?: string;
}

export default function AdminDashboard() {
  const { request } = useApi();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      // Logout handled in logout function
    }
  };

  const [formData, setFormData] = useState<CreateUserPayload>({
    name: '',
    email: '',
    registrationNo: '',
    role: 'STUDENT',
    roomNo: '',
    jobType: '',
  });
  const [createdUser, setCreatedUser] = useState<CreatedUserResponse | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await request('/admin/users', 'POST', formData);
      setCreatedUser(response);
      setShowCredentials(false);
      setMessage({ type: 'success', text: 'User created successfully!' });
      setFormData({
        name: '',
        email: '',
        registrationNo: '',
        role: 'STUDENT',
        roomNo: '',
        jobType: '',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create user';
      setMessage({ type: 'error', text: errorMsg });
      setCreatedUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="border-b border-black p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">hostel hub</h1>
            <p className="text-sm text-black/60">admin dashboard</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`p-4 mb-6 border rounded ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                {message.type === 'error' ? (
                  <p className="text-sm text-red-900">{message.text}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-900 font-medium">User created successfully</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCredentials(!showCredentials)}
                      >
                        {showCredentials ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                    {showCredentials && createdUser && (
                      <div className="space-y-2 bg-white border border-green-300 rounded p-3 text-sm">
                        <div>
                          <p className="text-xs font-medium text-black/60">Email:</p>
                          <p className="font-mono text-xs break-all">{createdUser.user?.email}</p>
                        </div>
                        {createdUser.password && (
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-black/60">Password:</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPasswordText(!showPasswordText)}
                                className="h-6 px-2"
                              >
                                {showPasswordText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                            </div>
                            <p className="font-mono text-xs break-all">
                              {showPasswordText ? createdUser.password : '•'.repeat(createdUser.password.length)}
                            </p>
                          </div>
                        )}
                        {createdUser.loginURL && (
                          <div>
                            <p className="text-xs font-medium text-black/60">Login URL:</p>
                            <p className="font-mono text-xs break-all text-blue-600">{createdUser.loginURL}</p>
                          </div>
                        )}
                        {createdUser.qrToken && (
                          <div>
                            <p className="text-xs font-medium text-black/60">QR Token:</p>
                            <p className="font-mono text-xs break-all">{createdUser.qrToken}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter user name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="registrationNo">Registration Number (Optional)</Label>
                <Input
                  id="registrationNo"
                  type="text"
                  value={formData.registrationNo || ''}
                  onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                  placeholder="e.g., REG-2024-001"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'STUDENT' | 'WORKER' })
                  }
                  className="w-full border border-black px-3 py-2 rounded"
                  required
                >
                  <option value="STUDENT">Student</option>
                  <option value="WORKER">Worker</option>
                </select>
              </div>

              {formData.role === 'STUDENT' && (
                <div>
                  <Label htmlFor="room">Room Number</Label>
                  <Input
                    id="room"
                    type="text"
                    value={formData.roomNo || ''}
                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                    placeholder="e.g., A-101"
                    required
                  />
                </div>
              )}

              {formData.role === 'WORKER' && (
                <div>
                  <Label htmlFor="job">Job Type</Label>
                  <Input
                    id="job"
                    type="text"
                    value={formData.jobType || ''}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    placeholder="e.g., Cleaner, Cook"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
