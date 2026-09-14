import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Plus, MessageSquare, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface RaiseIssueFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function RaiseIssueForm({ onSuccess, onCancel }: RaiseIssueFormProps) {
  const { request } = useApi();
  const [formData, setFormData] = useState({
    category: '',
    priority: 'MEDIUM',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<string[]>([]);
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  useEffect(() => {
    request('/issues/categories').then((res: any) => {
      if (res.categories) setCategories(res.categories);
    }).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await request('/issues', 'POST', formData);
      setFormData({ category: '', priority: 'MEDIUM', description: '' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to raise issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {error && (
        <div className="bg-(--color-canvas) border border-(--color-semantic-error) text-(--color-semantic-error) px-4 py-3 rounded text-body-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="category" className="block text-body-sm text-muted mb-1">Issue Category *</label>
        <Select id="category" name="category" value={formData.category} onChange={handleChange} required className="w-full">
          <option value="">Select a category</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </Select>
      </div>
      <div>
        <label htmlFor="priority" className="block text-body-sm text-muted mb-1">Priority Level</label>
        <Select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="w-full">
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>
      <div>
        <label htmlFor="description" className="block text-body-sm text-muted mb-1">Description *</label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe your issue in detail..." rows={5} required />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Raising...' : 'Raise Issue'}
        </Button>
      </div>
    </form>
  );
}

interface Issue {
  _id: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  resolverNote?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentIssuesPage() {
  const { request } = useApi();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'warning';
      case 'CLOSED':
        return 'success';
      default:
        return 'outline';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
      case 'URGENT':
        return 'error';
      default:
        return 'outline';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-32">
      {/* Header section */}
      <section className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-card-title md:text-headline tracking-tight text-ink leading-tight">My Issues</h1>
          <p className="text-body text-muted mt-1">Track the issues you've raised and read admin responses</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
          className="whitespace-nowrap flex items-center gap-2 border-hairline hover:bg-surface-soft"
        >
          <Plus className="w-4 h-4" />
          Raise New Issue
        </Button>
      </section>

      {/* Issues List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-muted">Loading your issues...</div>
        ) : issues.length === 0 ? (
          <div className="py-16 px-4 text-center bg-canvas sm:bg-surface/30 border border-hairline rounded-xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center mb-4 text-muted">
              <MessageSquare className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="text-card-title text-ink mb-2">No Issues Found</h3>
            <p className="text-body text-muted max-w-md mx-auto mb-6">You haven't reported any issues yet. If you face any problems with the mess or hostel facilities, let us know.</p>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Raise an Issue
            </Button>
          </div>
        ) : (
          issues.map((issue) => {
            const isClosed = issue.status === 'CLOSED';
            
            return (
              <div key={issue._id} className="bg-canvas sm:bg-surface/30 border border-hairline rounded-xl overflow-hidden transition-all hover:border-ink/20 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-hairline bg-surface-soft/40">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-body font-medium capitalize ${isClosed ? 'text-ink/60 line-through decoration-ink/30' : 'text-ink'}`}>
                      {issue.category}
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant={getStatusVariant(issue.status) as any} className="text-[10px] tracking-widest px-2 py-0.5 rounded-sm uppercase">
                        {issue.status}
                      </Badge>
                      <Badge variant={getPriorityVariant(issue.priority) as any} className="text-[10px] tracking-widest px-2 py-0.5 rounded-sm uppercase">
                        {issue.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-muted tracking-wide flex items-center gap-1.5 opacity-70">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <div className="p-5 flex-grow">
                  <p className={`text-body leading-relaxed whitespace-pre-wrap ${isClosed ? 'text-muted' : 'text-ink/90'}`}>
                    {issue.description}
                  </p>

                  {/* Admin Note Box */}
                  {issue.resolverNote && (
                    <div className="mt-5 bg-surface-soft/80 border border-hairline rounded-lg p-4 flex gap-3 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-(--color-semantic-success) rounded-l-lg" />
                      <CheckCircle2 className="w-5 h-5 text-(--color-semantic-success) shrink-0" />
                      <div>
                        <h4 className="text-[11px] font-semibold text-ink/70 uppercase tracking-widest mb-1.5">Admin Response</h4>
                        <p className="text-body-sm text-ink/90 italic leading-relaxed">"{issue.resolverNote}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Raise New Issue">
        <RaiseIssueForm onSuccess={handleIssueRaised} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
