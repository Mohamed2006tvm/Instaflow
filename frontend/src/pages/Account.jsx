import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { accountApi } from '../services/api.js';
import { Instagram, Link2, CheckCircle, AlertCircle, Users, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const successParam = params.get('success');
  const errorParam = params.get('error');

  const { data, isLoading } = useQuery({
    queryKey: ['account'],
    queryFn: () => accountApi.get().then(r => r.data.data),
  });

  const disconnectMut = useMutation({
    mutationFn: accountApi.disconnect,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account'] });
      toast.success('Account disconnected');
    },
    onError: () => toast.error('Failed to disconnect'),
  });

  const account = data;

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Instagram Account</h1>
        <p className="text-sm text-accent-muted mt-1">
          Connect your Instagram Business account to enable automations.
        </p>
      </div>

      {successParam && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-950 border border-green-900 mb-6">
          <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-300">Instagram account connected successfully!</p>
        </div>
      )}
      {errorParam && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950 border border-red-900 mb-6">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">Connection failed: {decodeURIComponent(errorParam)}</p>
        </div>
      )}

      {isLoading ? (
        <div className="card flex justify-center py-10">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : account ? (
        <div className="card space-y-5">
          <div className="flex items-center gap-4">
            {account.profile_picture_url ? (
              <img
                src={account.profile_picture_url}
                alt={account.username}
                className="w-14 h-14 rounded-full ring-1 ring-surface-border"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center ring-1 ring-surface-border">
                <Instagram size={22} className="text-accent-dim" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">@{account.username}</p>
                <span className="badge-success">Connected</span>
              </div>
              <p className="text-sm text-accent-muted mt-0.5">{account.name}</p>
              <p className="text-xs text-accent-dim mt-0.5">{account.account_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-lg p-3 border border-surface-border">
              <div className="flex items-center gap-2 mb-1">
                <Users size={13} className="text-accent-dim" />
                <p className="text-xs text-accent-muted">Followers</p>
              </div>
              <p className="text-lg font-semibold tabular-nums">
                {account.follower_count?.toLocaleString() ?? '—'}
              </p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-surface-border">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={13} className="text-accent-dim" />
                <p className="text-xs text-accent-muted">Token expires</p>
              </div>
              <p className="text-sm font-medium">
                {account.token_expires_at
                  ? new Date(account.token_expires_at).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <a href="/auth/instagram" className="btn-secondary flex items-center gap-2">
              <Link2 size={14} /> Reconnect
            </a>
            <button
              onClick={() => {
                if (confirm('Disconnect this account? Automations will stop working.')) {
                  disconnectMut.mutate();
                }
              }}
              className="btn-danger"
              disabled={disconnectMut.isPending}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="card text-center py-10 space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface border border-surface-border flex items-center justify-center mx-auto">
            <Instagram size={22} className="text-accent-dim" />
          </div>
          <div>
            <p className="text-sm font-medium">No account connected</p>
            <p className="text-xs text-accent-muted mt-1">
              Connect your Instagram Business account to start automating.
            </p>
          </div>
          <a
            href="/auth/instagram"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Link2 size={14} /> Connect Instagram
          </a>
          <div className="text-left bg-surface rounded-lg border border-surface-border p-4 mt-4">
            <p className="text-xs font-medium text-accent-muted mb-2">Requirements</p>
            <ul className="text-xs text-accent-dim space-y-1.5">
              <li>• Instagram Business or Creator account</li>
              <li>• Linked to a Facebook Page</li>
              <li>• Meta App with comment + DM permissions</li>
              <li>• Webhook configured to point to this server</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
