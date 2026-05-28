import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FileText, Clock, CheckCircle, Edit3, Share2, TrendingUp, ArrowRight, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import PlatformBadge from '../components/PlatformBadge';
import StatusBadge from '../components/StatusBadge';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  const { stats, recentPosts, upcomingPosts, weeklyActivity } = data || {};

  const chartData = weeklyActivity?.map((d) => ({
    date: format(new Date(d.date), 'MMM d'),
    Posts: d.count,
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={FileText} label="Total Posts" value={stats?.total_posts} color="bg-brand-500" />
        <StatCard icon={Clock} label="Scheduled" value={stats?.scheduled} color="bg-amber-500" />
        <StatCard icon={CheckCircle} label="Published" value={stats?.published} color="bg-emerald-500" />
        <StatCard icon={Edit3} label="Drafts" value={stats?.drafts} color="bg-gray-400" />
        <StatCard icon={Share2} label="Connected Accounts" value={stats?.total_accounts} color="bg-violet-500" />
      </div>

      {/* Chart + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-500" />
              Weekly Activity
            </h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                />
                <Bar dataKey="Posts" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <TrendingUp size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No activity yet this week</p>
            </div>
          )}
        </div>

        {/* Upcoming Posts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              Upcoming
            </h2>
            <button
              onClick={() => navigate('/queue')}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          {upcomingPosts?.length ? (
            <div className="space-y-3">
              {upcomingPosts.map((post) => (
                <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800 line-clamp-2 mb-1.5">{post.content}</p>
                  {post.platforms && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {post.platforms.split(',').filter(Boolean).map((p) => <PlatformBadge key={p} platform={p} />)}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-gray-400">
              <Clock size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No upcoming posts</p>
              <button onClick={() => navigate('/compose')} className="text-xs text-brand-500 mt-1 hover:underline">
                Create one →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Posts</h2>
          <button
            onClick={() => navigate('/queue')}
            className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {recentPosts?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Content</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Platforms</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 max-w-xs">
                      <p className="truncate text-gray-800">{post.content}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {post.platforms?.split(',').filter(Boolean).map((p) => <PlatformBadge key={p} platform={p} showLabel={false} />)}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="py-3 text-gray-500 text-xs whitespace-nowrap">
                      {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center text-gray-400">
            <FileText size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No posts yet</p>
            <button onClick={() => navigate('/compose')} className="btn-primary mt-3">
              Create your first post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
