import { logger } from '../../lib/logger'
import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { Modal } from '../../components/ui/modal';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

interface Issue {
  _id: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  resolverNote?: string;
  raisedBy: string;
  raisedByName: string;
  roomNo: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminIssues() {
  const { request } = useApi();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [closePrompt, setClosePrompt] = useState<{ issueId: string, note: string } | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchIssues();
    request('/admin/settings', 'GET').then(res => setSettings(res)).catch(err => logger.error('APP', 'Failed to fetch settings', err));
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await request('/issues/admin/all', 'GET');
      setIssues(response.issues || []);
    } catch (error: any) {
      logger.error('APP', 'Failed to fetch issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };



  const handleStatusUpdate = async (issueId: string, newStatus: string, resolverNote?: string) => {
    try {
      const payload: any = { status: newStatus };
      if (resolverNote !== undefined) payload.resolverNote = resolverNote;

      await request(`/issues/${issueId}/status`, 'PATCH', payload);
      toast.success('Issue status updated successfully');
      fetchIssues();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const categories = Array.from(new Set(issues.map(i => i.category)));

  const filteredIssues = issues.filter(issue => {
    const matchCategory = filterCategory === 'ALL' || issue.category === filterCategory;
    const matchPriority = filterPriority === 'ALL' || issue.priority === filterPriority;
    const matchStatus = filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && issue.status === 'OPEN') ||
      (filterStatus === 'CLOSED' && issue.status === 'CLOSED');
    return matchCategory && matchPriority && matchStatus;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    
    let valA: any = a[key as keyof Issue];
    let valB: any = b[key as keyof Issue];

    if (key === 'priority') {
      const pMap: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      valA = pMap[a.priority] || 0;
      valB = pMap[b.priority] || 0;
    } else if (key === 'status') {
      const sMap: Record<string, number> = { OPEN: 1, CLOSED: 2 };
      valA = sMap[a.status] || 0;
      valB = sMap[b.status] || 0;
    } else if (key === 'createdAt') {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
    }
    
    if (valA === valB) return 0;
    
    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-hairline mb-6 gap-4">
        <div className="flex overflow-x-auto w-full md:w-auto scrollbar-hide">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`whitespace-nowrap px-4 py-2 font-medium text-body transition-colors border-b-2 -mb-[1px] ${
              filterCategory === 'ALL'
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`whitespace-nowrap capitalize px-4 py-2 font-medium text-body transition-colors border-b-2 -mb-[1px] ${
                filterCategory === c
                  ? 'border-ink text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 pb-2 w-full md:w-auto">
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-[140px]"
          >
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="ALL">All Statuses</option>
          </Select>
          <Select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="w-[140px]"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-body text-muted">Loading issues...</div>
      )}

      {!loading && filteredIssues.length === 0 && (
        <div className="p-8 text-center text-body text-muted">No issues found matching your filters.</div>
      )}

      {!loading && filteredIssues.length > 0 && (
      <Card className="overflow-hidden shadow-none border-hairline">
        <div className="overflow-x-auto w-full">
          <Table>
              <TableHeader>
                <TableRow className="bg-surface-soft">
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center justify-center gap-1">
                      Category <span className="w-3 inline-block text-center">{sortConfig?.key === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[300px] cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('description')}>
                    <div className="flex items-center gap-1">
                      Issue <span className="w-3 inline-block text-center">{sortConfig?.key === 'description' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('raisedByName')}>
                    <div className="flex items-center justify-center gap-1">
                      Raised By <span className="w-3 inline-block text-center">{sortConfig?.key === 'raisedByName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('roomNo')}>
                    <div className="flex items-center justify-center gap-1">
                      Room No <span className="w-3 inline-block text-center">{sortConfig?.key === 'roomNo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center justify-center gap-1">
                      Date <span className="w-3 inline-block text-center">{sortConfig?.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center gap-1">
                      Status <span className="w-3 inline-block text-center">{sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('priority')}>
                    <div className="flex items-center justify-center gap-1">
                      Priority <span className="w-3 inline-block text-center">{sortConfig?.key === 'priority' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:bg-surface transition-colors" onClick={() => handleSort('resolverNote')}>
                    <div className="flex items-center justify-center gap-1">
                      Note <span className="w-3 inline-block text-center">{sortConfig?.key === 'resolverNote' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedIssues.map((issue) => (
                  <TableRow key={issue._id} className="transition-colors hover:bg-surface-soft">
                    <TableCell className="text-center capitalize text-ink font-medium">
                      {issue.category}
                    </TableCell>
                    <TableCell className="max-w-[300px] leading-tight">
                      <p className={`${issue.status === 'CLOSED' ? 'line-through text-(--color-ink)/50' : 'text-(--color-ink)/80'}`}>
                        {issue.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-center text-muted">
                      {issue.raisedByName}
                    </TableCell>
                    <TableCell className="text-center text-muted font-mono text-sm">
                      {issue.roomNo}
                    </TableCell>
                    <TableCell className="text-center text-muted whitespace-nowrap font-mono">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => {
                          if (issue.status === 'CLOSED') {
                            handleStatusUpdate(issue._id, 'OPEN');
                          } else {
                            setClosePrompt({
                              issueId: issue._id,
                              note: settings?.defaultResolverNote || "Fixed the issue as requested."
                            });
                          }
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          issue.status === 'CLOSED'
                            ? 'text-(--color-semantic-success) hover:bg-(--color-semantic-success)/10'
                            : 'text-muted hover:text-(--color-ink) hover:bg-surface'
                        }`}
                        title={issue.status === 'CLOSED' ? 'Reopen Issue' : 'Close Issue'}
                      >
                        {issue.status === 'CLOSED' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={issue.priority === 'URGENT' || issue.priority === 'HIGH' ? 'error' : 'warning'} className="px-2 py-1 rounded uppercase tracking-wider">
                        {issue.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted max-w-[200px] truncate" title={issue.resolverNote || ''}>
                      {issue.resolverNote ? issue.resolverNote : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
      </Card>
      )}

      <Modal isOpen={!!closePrompt} onClose={() => setClosePrompt(null)} title="Resolve Issue">
        <div className="p-4">
          <p className="text-body text-ink mb-4">Please provide a closing remark for the student.</p>
          <textarea
            value={closePrompt?.note || ''}
            onChange={(e) => closePrompt && setClosePrompt({ ...closePrompt, note: e.target.value })}
            className="w-full bg-surface-soft border border-hairline rounded p-3 text-body text-ink focus:outline-none focus:border-ink transition-colors"
            rows={3}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setClosePrompt(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (closePrompt) {
                handleStatusUpdate(closePrompt.issueId, 'CLOSED', closePrompt.note);
                setClosePrompt(null);
              }
            }}>Resolve Issue</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
