import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Issue {
  _id: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  raisedBy: User;
  assignedTo?: User;
  createdAt: string;
  updatedAt: string;
}

interface Worker {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminIssues() {
  const { request } = useApi();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([fetchIssues(), fetchWorkers()]);
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await request('/issues/admin/all', 'GET');
      setIssues(response.issues || []);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await request('/admin/users?role=WORKER', 'GET');
      setWorkers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const handleAssignIssue = async (issueId: string) => {
    const workerId = selectedWorker[issueId];
    
    if (!workerId) {
      setError('Please select a worker');
      return;
    }

    try {
      setAssigningId(issueId);
      setError('');
      setSuccess('');

      await request(`/issues/${issueId}/assign`, 'PATCH', { workerId });

      setSuccess('Issue assigned successfully');
      setSelectedWorker(prev => {
        const updated = { ...prev };
        delete updated[issueId];
        return updated;
      });

      // Refresh issues
      fetchIssues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign issue';
      setError(message);
    } finally {
      setAssigningId(null);
    }
  };

  const handleStatusUpdate = async (issueId: string, newStatus: string) => {
    try {
      setError('');
      setSuccess('');

      await request(`/issues/${issueId}/status`, 'PATCH', { status: newStatus });

      setSuccess('Issue status updated successfully');
      fetchIssues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setError(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Issues Management</h1>
        <p className="text-gray-600 mt-2">Review and manage student-raised issues</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Issues List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {issues.length > 0 ? `All Issues (${issues.length})` : 'No Issues'}
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No issues raised yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {issues.map((issue) => (
              <div key={issue._id} className="p-6 hover:bg-gray-50 transition">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                  {/* Issue Details */}
                  <div className="lg:col-span-2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {issue.category}
                      </h3>
                      <div className="flex gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{issue.description}</p>
                    <div className="text-sm text-gray-500">
                      <p><span className="font-medium">Raised by:</span> {issue.raisedBy.name}</p>
                      <p><span className="font-medium">Date:</span> {new Date(issue.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status
                    </label>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignment */}
                  <div>
                    {issue.assignedTo ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Assigned to:</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="font-medium text-blue-900 text-sm">{issue.assignedTo.name}</p>
                          <p className="text-blue-700 text-xs">{issue.assignedTo.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign to Worker
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={selectedWorker[issue._id] || ''}
                            onChange={(e) =>
                              setSelectedWorker(prev => ({
                                ...prev,
                                [issue._id]: e.target.value
                              }))
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select worker</option>
                            {workers.map(worker => (
                              <option key={worker._id} value={worker._id}>
                                {worker.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignIssue(issue._id)}
                            disabled={assigningId === issue._id || !selectedWorker[issue._id]}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                          >
                            {assigningId === issue._id ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
