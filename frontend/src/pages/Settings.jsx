import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-accent-muted mt-1">Application configuration and environment info.</p>
      </div>

      <div className="card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
          <Settings size={18} className="text-accent-dim" />
          <div>
            <p className="text-sm font-medium">Environment Variables</p>
            <p className="text-xs text-accent-muted mt-0.5">
              All configuration is managed via the backend <code className="bg-surface px-1 rounded">.env</code> file.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'INSTAGRAM_CLIENT_ID', desc: 'Meta App client ID' },
            { key: 'INSTAGRAM_REDIRECT_URI', desc: 'OAuth callback URL' },
            { key: 'META_VERIFY_TOKEN', desc: 'Webhook verify token' },
            { key: 'DATABASE_URL', desc: 'Neon PostgreSQL connection string' },
            { key: 'REDIS_URL', desc: 'Redis connection string (Railway/Upstash)' },
            { key: 'ENCRYPTION_KEY', desc: '32-byte AES key (hex) for token encryption' },
            { key: 'JWT_SECRET', desc: 'Secret for admin session tokens' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4 py-2">
              <code className="text-xs text-accent-muted bg-surface border border-surface-border px-2 py-1 rounded flex-shrink-0">
                {key}
              </code>
              <p className="text-xs text-accent-dim text-right">{desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-surface-border">
          <p className="text-xs text-accent-dim">
            See <code className="bg-surface px-1 rounded">/backend/.env.example</code> for the full list of required variables.
          </p>
        </div>
      </div>
    </div>
  );
}
