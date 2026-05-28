import { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Users, Loader2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import PlatformBadge, { PLATFORMS } from '../components/PlatformBadge';

const PLATFORM_OPTIONS = Object.entries(PLATFORMS).map(([key, val]) => ({ value: key, label: val.label }));

const ConnectModal = ({ onClose, onConnected }) => {
  const [platform, setPlatform] = useState('twitter');
  const [form, setForm] = useState({ account_name: '', account_handle: '', followers_count: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/accounts/connect', {
        platform,
        account_name: form.account_name,
        account_handle: form.account_handle,
        followers_count: parseInt(form.followers_count) || 0,
      });
      toast.success('Account connected!');
      onConnected();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to connect account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Connect Social Account</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Platform</label>
            <select
              className="input"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Account / Page Name</label>
            <input
              className="input"
              placeholder="e.g. My Brand Page"
              value={form.account_name}
              onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Username / Handle <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input
                className="input pl-7"
                placeholder="yourbrand"
                value={form.account_handle}
                onChange={(e) => setForm((f) => ({ ...f, account_handle: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Followers Count <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="0"
              value={form.followers_count}
              onChange={(e) => setForm((f) => ({ ...f, followers_count: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AccountCard = ({ account, onDisconnect, onToggle }) => (
  <div className={`card p-5 transition-opacity ${!account.is_active ? 'opacity-60' : ''}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 shrink-0">
          {account.account_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{account.account_name}</p>
          {account.account_handle && (
            <p className="text-xs text-gray-500 truncate">@{account.account_handle}</p>
          )}
          <div className="mt-1">
            <PlatformBadge platform={account.platform} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onToggle(account.id)}
          className={`p-1.5 rounded-lg transition-colors ${account.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
          title={account.is_active ? 'Disable account' : 'Enable account'}
        >
          {account.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
        </button>
        <button
          onClick={() => onDisconnect(account.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Disconnect"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
      <span className="text-gray-500 flex items-center gap-1.5">
        <Users size={14} />
        {account.followers_count?.toLocaleString() || 0} followers
      </span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${account.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        {account.is_active ? 'Active' : 'Paused'}
      </span>
    </div>
  </div>
);

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data.accounts || []);
    } catch {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleDisconnect = async (id) => {
    if (!window.confirm('Disconnect this account?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      toast.success('Account disconnected');
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error('Failed to disconnect account');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/accounts/${id}/toggle`);
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, is_active: res.data.is_active } : a));
      toast.success(res.data.is_active ? 'Account enabled' : 'Account paused');
    } catch {
      toast.error('Failed to update account');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {showModal && <ConnectModal onClose={() => setShowModal(false)} onConnected={fetchAccounts} />}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Connect Account
        </button>
      </div>

      {/* Platform info banner */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-700">
        <p className="font-medium mb-1">Simulated connections</p>
        <p className="text-brand-600 text-xs">
          PlainChat currently simulates posting. To enable live publishing, configure OAuth credentials for each platform in the backend settings.
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="card py-16 flex flex-col items-center text-gray-400">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="text-base font-medium text-gray-500">No accounts yet</p>
          <p className="text-sm mt-1">Connect your social accounts to start scheduling posts.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-5">
            <Plus size={16} /> Connect your first account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onDisconnect={handleDisconnect}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
