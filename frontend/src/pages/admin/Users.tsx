import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'WORKER';
  roomNo?: string;
  jobType?: string;
  isActive: boolean;
  createdAt: string;
}

interface CreateUserPayload {
  name: string;
  email: string;
  role: 'STUDENT' | 'WORKER';
  roomNo?: string;
  jobType?: string;
}

export default function AdminUsers() {
  const { request } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterRole, setFilterRole] = useState<'STUDENT' | 'WORKER' | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState<CreateUserPayload>({
    name: '',
    email: '',
    role: 'STUDENT',
    roomNo: '',
    jobType: '',
  });

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole !== 'ALL') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await request(
        `/admin/users?${params.toString()}`,
        'GET'
      );
      setUsers(response.users || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await request('/admin/users', 'POST', formData);
      setUsers([...users, response.user]);
      setFormData({
        name: '',
        email: '',
        role: 'STUDENT',
        roomNo: '',
        jobType: '',
      });
      setShowCreateForm(false);
      alert(`User created!\nQR Token: ${response.qrToken}\nLogin URL: ${response.loginURL}`);
    } catch (err) {
      // User creation failed
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await request(`/admin/users/${userId}`, 'DELETE');
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      // User deletion failed
    }
  };

  const handleDeactivateUser = async (userId: string, isActive: boolean) => {
    try {
      const endpoint = isActive ? 'deactivate' : 'reactivate';
      await request(`/admin/users/${userId}/${endpoint}`, 'PATCH');
      setUsers(
        users.map(u => (u.id === userId ? { ...u, isActive: !isActive } : u))
      );
    } catch (err) {
      // Status update failed
    }
  };

  const handleRegenerateQR = async (userId: string) => {
    try {
      const response = await request(`/admin/users/${userId}/qr-code`, 'POST');
      alert(`New QR Token generated!\n\nQR Code:\n${response.qrCode}`);
    } catch (err) {
      // QR regeneration failed
    }
  };

  const handleRegenerateLoginToken = async (userId: string) => {
    try {
      const response = await request(`/admin/users/${userId}/login-token`, 'POST');
      alert(`New Login URL generated!\n${response.loginURL}`);
    } catch (err) {
      // Login token regeneration failed
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant="primary"
        >
          {showCreateForm ? 'Cancel' : 'Create User'}
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-bold mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="User name"
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <Label>Role</Label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as 'STUDENT' | 'WORKER' })
                }
                className="w-full border border-black px-3 py-2"
              >
                <option value="STUDENT">Student</option>
                <option value="WORKER">Worker</option>
              </select>
            </div>

            {formData.role === 'STUDENT' && (
              <div>
                <Label>Room Number</Label>
                <Input
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
                <Label>Job Type</Label>
                <Input
                  type="text"
                  value={formData.jobType || ''}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  placeholder="e.g., Chef, Cleaner"
                  required
                />
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full">
              Create User
            </Button>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <Label>Filter by Role</Label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="border border-black px-3 py-2 mt-2"
          >
            <option value="ALL">All</option>
            <option value="STUDENT">Students</option>
            <option value="WORKER">Workers</option>
          </select>
        </div>

        <div>
          <Label>Filter by Status</Label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-black px-3 py-2 mt-2"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <Card className="overflow-x-auto">
        {loading ? (
          <p className="p-6 text-center">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-center text-black/60">No users found</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-black/20">
              <tr>
                <th className="text-left p-4 font-bold">Name</th>
                <th className="text-left p-4 font-bold">Email</th>
                <th className="text-left p-4 font-bold">Role</th>
                <th className="text-left p-4 font-bold">Room/Job</th>
                <th className="text-left p-4 font-bold">Status</th>
                <th className="text-left p-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-black/10 hover:bg-black/5">
                  <td className="p-4">{user.name}</td>
                  <td className="p-4 text-black/60">{user.email}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 border border-black font-semibold text-sm">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-black/60">
                    {user.role === 'STUDENT' ? user.roomNo : user.jobType}
                  </td>
                  <td className="p-4">
                    <span className={user.isActive ? 'text-black font-semibold' : 'text-black/40 font-semibold'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <Button
                      onClick={() => handleRegenerateQR(user.id)}
                      variant="secondary"
                      size="sm"
                    >
                      QR Code
                    </Button>
                    <Button
                      onClick={() => handleRegenerateLoginToken(user.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Login URL
                    </Button>
                    <Button
                      onClick={() => handleDeactivateUser(user.id, user.isActive)}
                      variant="secondary"
                      size="sm"
                    >
                      {user.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteUser(user.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
