import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

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
    return <div className="p-8 text-center text-muted font-medium">Loading Dashboard Data...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-semantic-error font-medium">Failed to load dashboard.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto sm:p-4 space-y-6 pb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-card-title">Admin Dashboard</h1>
        <Button variant="secondary" 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-surface hover:bg-surface-soft border rounded text-body-sm"
        >
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-canvas p-4 sm:rounded border-y sm:border-x border-hairline flex flex-col justify-between transition">
          <div className="flex justify-between items-start">
            <h3 className="text-muted text-body-sm">Registered Students</h3>
          </div>
          <p className="text-data font-mono mt-4">{stats.totalStudents}</p>
        </div>

        {/* Active Dishes */}
        <div className="bg-canvas p-4 sm:rounded border-y sm:border-x border-hairline flex flex-col justify-between transition">
          <div className="flex justify-between items-start">
            <h3 className="text-muted text-body-sm">Active Dishes</h3>
          </div>
          <p className="text-data font-mono mt-4">{stats.activeDishes}</p>
        </div>

        {/* Open Issues */}
        <div className="bg-canvas p-4 sm:rounded border-y sm:border-x border-hairline flex flex-col justify-between transition">
          <div className="flex justify-between items-start">
            <h3 className="text-muted text-body-sm">Open Issues</h3>
          </div>
          <p className="text-data font-mono mt-4 text-semantic-error">{stats.openIssues}</p>
        </div>

        {/* Total Votes */}
        <div className="bg-canvas p-4 sm:rounded border-y sm:border-x border-hairline flex flex-col justify-between transition">
          <div className="flex justify-between items-start">
            <h3 className="text-muted text-body-sm">Total Votes</h3>
          </div>
          <p className="text-data font-mono mt-4 text-ink">{stats.totalVotes}</p>
        </div>
      </div>

      {/* Activity Log Section */}
      <div className="bg-canvas sm:rounded border-y sm:border-x border-hairline flex flex-col">
        <div className="p-4 border-b border-hairline bg-surface-soft rounded-t flex justify-between items-center">
          <h2 className="font-bold">Recent Hostel Activity</h2>
          <span className="text-caption bg-canvas text-ink px-2 py-1 rounded border border-hairline">
            Live Feed
          </span>
        </div>
        <div className="p-0">
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentActivity.map((log: any) => (
                    <TableRow key={log._id}>
                      <TableCell className="text-ink">
                        {log.userId?.name || 'Unknown User'}
                      </TableCell>
                      <TableCell className="text-muted">
                        {log.userId?.role || 'UNKNOWN'}
                      </TableCell>
                      <TableCell className="text-muted">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-muted font-mono text-data whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="p-4 text-center text-muted">
               No recent activity found.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
