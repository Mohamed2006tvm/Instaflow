import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsApi } from '../services/api.js';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_OPTS = ['', 'success', 'partial', 'failed', 'skipped', 'pending'];

function StatusBadge({ status }) {
  const cls = {
    success: 'badge-success',
    failed: 'badge-error',
    partial: 'badge-warning',
  }[status] ?? 'badge-neutral';
  return <span className={cls}>{status}</span>;
}

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, status],
    queryFn: () => logsApi.getLogs({ page, limit: 25, status: status || undefined }).then(r => r.data),
    keepPreviousData: true,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">Logs</h1>
          <p className="text-sm text-accent-muted mt-1">
            Automation execution history — {pagination.total} total events.
          </p>
        </div>
        <select
          className="input w-36"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
        >
          {STATUS_OPTS.map(s => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={32} className="text-accent-dim mb-3" />
            <p className="text-sm text-accent-muted">No logs found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Comment', 'Keyword', 'Reply', 'DM', 'Status', 'Time'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-medium text-accent-dim uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="table-row-hover border-b border-surface-border">
                      <td className="py-3 px-4 text-sm max-w-[200px]">
                        <p className="truncate">{log.comment_text ?? '—'}</p>
                        <p className="text-xs text-accent-dim font-mono mt-0.5 truncate">
                          @{log.commenter_username ?? log.commenter_ig_id ?? '?'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {log.matched_keyword
                          ? <span className="badge-neutral">{log.matched_keyword}</span>
                          : <span className="text-accent-dim text-sm">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={log.public_reply_sent ? 'text-green-400 text-xs' : 'text-accent-dim text-xs'}>
                          {log.public_reply_sent ? '✓ Sent' : '✗ Not sent'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={log.dm_sent ? 'text-green-400 text-xs' : 'text-accent-dim text-xs'}>
                          {log.dm_sent ? '✓ Sent' : '✗ Not sent'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-accent-dim whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
              <p className="text-xs text-accent-dim">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary px-2 py-1 disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="btn-secondary px-2 py-1 disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
