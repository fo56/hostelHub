import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import RaiseIssueForm from '../../components/common/RaiseIssueForm';

interface Issue {
  _id: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  assignedTo?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function StudentIssuesPage() {
  const { request } = useApi();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchIssues();
  }, [refreshKey]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await request('/issues/my-issues', 'GET');
      setIssues(response.issues || []);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueRaised = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
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

  return (
    <div className="space-y-6">
      {/* Header with button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Issues</h1>
          <p className="text-gray-600 mt-2">Track issues you've raised and their progress</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {showForm ? 'Cancel' : 'Raise New Issue'}
        </button>
      </div>

      {/* Raise Issue Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Raise New Issue</h2>
          <RaiseIssueForm onSuccess={handleIssueRaised} />
        </div>
      )}

      {/* Issues List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {issues.length > 0 ? `Your Issues (${issues.length})` : 'No Issues'}
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">You haven't raised any issues yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {issues.map((issue) => (
              <div key={issue._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {issue.category}
                        </h3>
                        <p className="text-gray-600 mt-1">{issue.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>

                    {issue.assignedTo && (
                      <div className="mt-3 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Assigned to:</span> {issue.assignedTo.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="md:text-right text-sm text-gray-500">
                    <p>Raised: {new Date(issue.createdAt).toLocaleDateString()}</p>
                    {issue.updatedAt && (
                      <p>Updated: {new Date(issue.updatedAt).toLocaleDateString()}</p>
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
