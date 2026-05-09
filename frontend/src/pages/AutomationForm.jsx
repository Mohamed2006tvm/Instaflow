import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { automationsApi } from '../services/api.js';
import { X, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const MATCH_TYPES = [
  { value: 'contains', label: 'Contains' },
  { value: 'exact', label: 'Exact' },
  { value: 'starts_with', label: 'Starts with' },
];

function KeywordTag({ keyword, matchType, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 bg-surface border border-surface-border rounded-lg px-2.5 py-1.5">
      <span className="text-sm">{keyword}</span>
      <span className="text-xs text-accent-dim">({matchType})</span>
      <button onClick={onRemove} className="text-accent-dim hover:text-white transition-colors ml-1">
        <X size={13} />
      </button>
    </div>
  );
}

export default function AutomationFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    post_id: '',
    public_reply_text: '',
    dm_text: '',
    follow_gate_enabled: false,
    keywords: [],
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newMatchType, setNewMatchType] = useState('contains');

  const { data: existing } = useQuery({
    queryKey: ['automation', id],
    queryFn: () => automationsApi.getById(id).then(r => r.data.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        post_id: existing.post_id,
        public_reply_text: existing.public_reply_text,
        dm_text: existing.dm_text,
        follow_gate_enabled: existing.follow_gate_enabled,
        keywords: existing.keywords ?? [],
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? automationsApi.update(id, data)
      : automationsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automations'] });
      toast.success(isEdit ? 'Automation updated' : 'Automation created');
      navigate('/automations');
    },
    onError: (err) => {
      const msg = err.response?.data?.error ?? 'Something went wrong';
      toast.error(msg);
    },
  });

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return;
    if (form.keywords.some(k => k.keyword === kw)) {
      toast.error('Keyword already added');
      return;
    }
    setForm(f => ({
      ...f,
      keywords: [...f.keywords, { keyword: kw, match_type: newMatchType }],
    }));
    setNewKeyword('');
  };

  const removeKeyword = (keyword) => {
    setForm(f => ({ ...f, keywords: f.keywords.filter(k => k.keyword !== keyword) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.keywords.length) {
      toast.error('Add at least one keyword');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <button
        onClick={() => navigate('/automations')}
        className="flex items-center gap-2 text-sm text-accent-muted hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={15} /> Back to Automations
      </button>

      <h1 className="text-xl font-semibold mb-1">
        {isEdit ? 'Edit Automation' : 'New Automation'}
      </h1>
      <p className="text-sm text-accent-muted mb-8">
        Configure keyword triggers, public replies, and DM messages.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold">Basic Info</h2>
          <div>
            <label className="label">Automation Name</label>
            <input
              className="input"
              placeholder="e.g. Price inquiry automation"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Instagram Post ID</label>
            <input
              className="input font-mono"
              placeholder="e.g. 17846368219941196"
              value={form.post_id}
              onChange={e => setForm(f => ({ ...f, post_id: e.target.value }))}
              required
            />
            <p className="text-xs text-accent-dim mt-1.5">
              Find the post ID from the Graph API or Instagram URL.
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold">Trigger Keywords</h2>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. price, link, info"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            />
            <select
              className="input w-36"
              value={newMatchType}
              onChange={e => setNewMatchType(e.target.value)}
            >
              {MATCH_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button type="button" onClick={addKeyword} className="btn-secondary flex items-center gap-1.5 whitespace-nowrap">
              <Plus size={14} /> Add
            </button>
          </div>
          {form.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.keywords.map(k => (
                <KeywordTag
                  key={k.keyword}
                  keyword={k.keyword}
                  matchType={k.match_type}
                  onRemove={() => removeKeyword(k.keyword)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Responses */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold">Responses</h2>
          <div>
            <label className="label">Public Reply (comment reply)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Check your DMs! 👀"
              value={form.public_reply_text}
              onChange={e => setForm(f => ({ ...f, public_reply_text: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">DM Message</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="e.g. Hey! Here's the link you were asking about: https://..."
              value={form.dm_text}
              onChange={e => setForm(f => ({ ...f, dm_text: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Options */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.follow_gate_enabled}
                onChange={e => setForm(f => ({ ...f, follow_gate_enabled: e.target.checked }))}
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${form.follow_gate_enabled ? 'bg-white' : 'bg-surface-border'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform ${form.follow_gate_enabled ? 'translate-x-5' : ''}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Follow Gate</p>
              <p className="text-xs text-accent-muted">Only send DM if the commenter follows your account.</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Automation'}
          </button>
          <button type="button" onClick={() => navigate('/automations')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
