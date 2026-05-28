import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, BarChart3, Users, Heart } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

const PLATFORM_LABELS = {
  twitter: 'X / Twitter',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card p-5">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
    <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [overtime, setOvertime] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [engagement, setEngagement] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/posts-over-time', { params: { days } }),
      api.get('/analytics/platforms'),
      api.get('/analytics/engagement'),
    ])
      .then(([dash, ot, plat, eng]) => {
        setDashboard(dash.data);
        setOvertime(ot.data.data || []);
        setPlatforms(plat.data.platforms || []);
        setEngagement(eng.data.engagement);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  const chartData = (() => {
    const map = {};
    overtime.forEach((d) => {
      const key = format(new Date(d.date), 'MMM d');
      if (!map[key]) map[key] = { date: key, scheduled: 0, published: 0, draft: 0 };
      map[key][d.status] = d.count;
    });
    return Object.values(map);
  })();

  const pieData = platforms.map((p) => ({
    name: PLATFORM_LABELS[p.platform] || p.platform,
    value: p.total_posts,
  })).filter((d) => d.value > 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  const stats = dashboard?.stats || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Total Posts" value={stats.total_posts} color="bg-brand-500" />
        <StatCard icon={TrendingUp} label="Published" value={stats.published} sub="Successfully sent" color="bg-emerald-500" />
        <StatCard icon={Users} label="Accounts" value={stats.total_accounts} sub="Connected" color="bg-violet-500" />
        <StatCard
          icon={Heart}
          label="Total Likes"
          value={engagement?.total_likes ?? 0}
          sub="Across all posts"
          color="bg-pink-500"
        />
      </div>

      {/* Posts over time */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Posts Over Time</h2>
          <div className="flex gap-1.5 bg-gray-100 rounded-lg p-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="published" stroke="#10b981" fill="url(#colorPublished)" strokeWidth={2} name="Published" />
              <Area type="monotone" dataKey="scheduled" stroke="#6366f1" fill="url(#colorScheduled)" strokeWidth={2} name="Scheduled" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp size={36} className="mb-2 opacity-20" />
            <p className="text-sm">No data for this period</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Platform Breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <BarChart3 size={32} className="mb-2 opacity-20" />
              <p className="text-sm">No platform data yet</p>
            </div>
          )}
        </div>

        {/* Engagement */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Engagement Summary</h2>
          {engagement ? (
            <div className="space-y-3">
              {[
                { label: 'Likes', value: engagement.total_likes, color: 'bg-pink-500' },
                { label: 'Comments', value: engagement.total_comments, color: 'bg-blue-500' },
                { label: 'Shares', value: engagement.total_shares, color: 'bg-violet-500' },
                { label: 'Impressions', value: engagement.total_impressions, color: 'bg-amber-500' },
                { label: 'Reach', value: engagement.total_reach, color: 'bg-emerald-500' },
                { label: 'Clicks', value: engagement.total_clicks, color: 'bg-gray-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                  <span className="text-sm text-gray-700 flex-1">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{(value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <p className="text-sm">No engagement data yet</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">
            Note: Analytics data is populated as posts are published to connected platforms.
          </p>
        </div>
      </div>

      {/* Platform table */}
      {platforms.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Per-Platform Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Platform', 'Total Posts', 'Published', 'Pending', 'Failed'].map((h) => (
                    <th key={h} className="text-left pb-3 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {platforms.map((p) => (
                  <tr key={p.platform} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-6 font-medium capitalize">{PLATFORM_LABELS[p.platform] || p.platform}</td>
                    <td className="py-3 pr-6">{p.total_posts}</td>
                    <td className="py-3 pr-6 text-emerald-600 font-medium">{p.published}</td>
                    <td className="py-3 pr-6 text-amber-600">{p.pending}</td>
                    <td className="py-3 text-red-500">{p.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
