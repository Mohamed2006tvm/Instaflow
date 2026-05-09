import { useQuery } from '@tanstack/react-query';
import { logsApi, automationsApi } from '../services/api.js';
import { MessageCircle, Send, Zap, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

function StatCard({ label, value, icon: Icon, sub, color = 'white' }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
        ${color === 'green' ? 'bg-green-950 text-green-400' :
          color === 'red' ? 'bg-red-950 text-red-400' :
          color === 'blue' ? 'bg-blue-950 text-blue-400' :
          'bg-surface text-white'}`}>
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-semibold tabular-nums">{value ?? '—'}</p>
        <p className="text-sm text-accent-muted mt-0.5">{label}</p>
        {sub && <p className="text-xs text-accent-dim mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function RecentLog({ log }) {
  const statusClass = {
    success: 'badge-success',
    failed: 'badge-error',
    partial: 'badge-warning',
    skipped: 'badge-neutral',
    pending: 'badge-neutral',
  }[log.status] ?? 'badge-neutral';

  return (
    <tr className="table-row-hover border-b border-surface-border">
      <td className="py-3 px-4 text-sm text-accent-muted font-mono truncate max-w-[120px]">
        {log.comment_id}
      </td>
      <td className="py-3 px-4 text-sm truncate max-w-[200px]">
        {log.comment_text ?? '—'}
      </td>
      <td className="py-3 px-4 text-sm text-accent-muted">
        {log.matched_keyword ?? '—'}
      </td>
      <td className="py-3 px-4">
        <span className={statusClass}>{log.status}</span>
      </td>
      <td className="py-3 px-4 text-xs text-accent-dim whitespace-nowrap">
        {new Date(log.created_at).toLocaleString()}
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: () => logsApi.getStats().then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: logsData } = useQuery({
    queryKey: ['logs', 'recent'],
    queryFn: () => logsApi.getLogs({ limit: 8, page: 1 }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: automationsData } = useQuery({
    queryKey: ['automations'],
    queryFn: () => automationsApi.list().then(r => r.data.data),
  });

  const stats = statsData ?? {};
  const logs = logsData?.data ?? [];
  const automations = automationsData ?? [];
  const activeAutomations = automations.filter(a => a.is_enabled).length;
  const successRate = stats.total_logs > 0
    ? Math.round((stats.success_count / stats.total_logs) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-accent-muted mt-1">Real-time overview of your automation activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Comments Matched"
          value={stats.total_logs ?? 0}
          icon={MessageCircle}
        />
        <StatCard
          label="DMs Sent"
          value={stats.dms_sent ?? 0}
          icon={Send}
          color="blue"
        />
        <StatCard
          label="Active Automations"
          value={activeAutomations}
          icon={Zap}
          sub={`${automations.length} total`}
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={TrendingUp}
          color="green"
          sub={`${stats.failed_count ?? 0} failed`}
        />
      </div>

      {/* Recent Logs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
          <a href="/logs" className="text-xs text-accent-muted hover:text-white transition-colors">
            View all →
          </a>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={32} className="text-accent-dim mb-3" />
            <p className="text-sm text-accent-muted">No activity yet.</p>
            <p className="text-xs text-accent-dim mt-1">Comments matching your automations will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Comment ID', 'Comment', 'Keyword', 'Status', 'Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-accent-dim uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => <RecentLog key={log.id} log={log} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
