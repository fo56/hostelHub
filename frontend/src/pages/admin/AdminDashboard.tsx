import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { request } = useApi();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await request('/admin/dashboard');
      setStats(data);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading Dashboard Data...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-red-500 font-medium">Failed to load dashboard.</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border rounded text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 font-semibold text-sm">Registered Students</h3>
          </div>
          <p className="text-3xl font-black mt-4">{stats.totalStudents}</p>
        </div>

        {/* Active Dishes */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 font-semibold text-sm">Active Dishes</h3>
          </div>
          <p className="text-3xl font-black mt-4">{stats.activeDishes}</p>
        </div>

        {/* Open Issues */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 font-semibold text-sm">Open Issues</h3>
          </div>
          <p className="text-3xl font-black mt-4 text-red-600">{stats.openIssues}</p>
        </div>

        {/* Total Votes */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 font-semibold text-sm">Total Votes</h3>
          </div>
          <p className="text-3xl font-black mt-4 text-purple-600">{stats.totalVotes}</p>
        </div>
      </div>

      {/* Activity Log Section */}
      <div className="bg-white rounded-xl border shadow-sm flex flex-col">
        <div className="p-4 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
          <h2 className="font-bold">Recent Hostel Activity</h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">
            Live Feed
          </span>
        </div>
        <div className="p-0">
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recentActivity.map((log: any) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {log.userId?.name || 'Unknown User'}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {log.userId?.role || 'UNKNOWN'}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {log.action}
                      </td>
                      <td className="px-4 py-2 text-gray-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="p-8 text-center text-gray-500">
               No recent activity found.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
