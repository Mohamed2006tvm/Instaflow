import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationsApi } from '../services/api.js';
import { Link } from 'react-router-dom';
import { Plus, Zap, Trash2, Pencil, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function AutomationRow({ automation, onToggle, onDelete }) {
  return (
    <tr className="table-row-hover border-b border-surface-border">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${automation.is_enabled ? 'bg-green-400' : 'bg-surface-border'}`} />
          <div>
            <p className="text-sm font-medium">{automation.name}</p>
            <p className="text-xs text-accent-dim font-mono mt-0.5">Post: {automation.post_id}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex flex-wrap gap-1.5">
          {(automation.keywords ?? []).slice(0, 4).map(k => (
            <span key={k.id} className="badge-neutral">{k.keyword}</span>
          ))}
          {(automation.keywords ?? []).length > 4 && (
            <span className="badge-neutral">+{automation.keywords.length - 4}</span>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm text-accent-muted max-w-[200px] truncate">
        {automation.public_reply_text}
      </td>
      <td className="py-3.5 px-4">
        {automation.follow_gate_enabled
          ? <span className="badge-warning">Follow gate</span>
          : <span className="badge-neutral">No gate</span>}
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(automation.id, !automation.is_enabled)}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-accent-muted hover:text-white transition-colors"
            title={automation.is_enabled ? 'Disable' : 'Enable'}
          >
            {automation.is_enabled
              ? <ToggleRight size={18} className="text-green-400" />
              : <ToggleLeft size={18} />}
          </button>
          <Link
            to={`/automations/${automation.id}/edit`}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-accent-muted hover:text-white transition-colors"
          >
            <Pencil size={15} />
          </Link>
          <button
            onClick={() => onDelete(automation.id)}
            className="p-1.5 rounded-lg hover:bg-red-950/30 text-accent-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AutomationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: () => automationsApi.list().then(r => r.data.data),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }) => automationsApi.toggle(id, enabled),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['automations'] }); },
    onError: () => toast.error('Failed to toggle automation'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => automationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automation deleted');
    },
    onError: () => toast.error('Failed to delete automation'),
  });

  const handleDelete = (id) => {
    if (!confirm('Delete this automation? This cannot be undone.')) return;
    deleteMut.mutate(id);
  };

  const automations = data ?? [];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">Automations</h1>
          <p className="text-sm text-accent-muted mt-1">
            Manage keyword-based comment reply and DM automations.
          </p>
        </div>
        <Link to="/automations/new" className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Automation
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Zap size={32} className="text-accent-dim mb-3" />
            <p className="text-sm text-accent-muted">No automations yet.</p>
            <p className="text-xs text-accent-dim mt-1 mb-4">Create your first keyword automation to get started.</p>
            <Link to="/automations/new" className="btn-primary">Create Automation</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Automation', 'Keywords', 'Public Reply', 'Follow Gate', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-accent-dim uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {automations.map(a => (
                  <AutomationRow
                    key={a.id}
                    automation={a}
                    onToggle={(id, enabled) => toggleMut.mutate({ id, enabled })}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
