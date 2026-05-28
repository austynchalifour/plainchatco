import { useState, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import PlatformBadge from '../components/PlatformBadge';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const year = format(currentDate, 'yyyy');
    const month = format(currentDate, 'M');
    setLoading(true);
    api.get('/posts/calendar', { params: { year, month } })
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getPostsForDay = (day) =>
    posts.filter((p) => isSameDay(new Date(p.scheduled_at), day));

  const selectedPosts = selectedDay ? getPostsForDay(selectedDay) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn-secondary px-2.5">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 w-44 text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn-secondary px-2.5">
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn-secondary text-xs"
          >
            Today
          </button>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-brand-500" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayPosts = getPostsForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                  className={`min-h-[90px] p-2 border-b border-r border-gray-50 cursor-pointer transition-colors
                    ${!inMonth ? 'bg-gray-50/50' : 'bg-white hover:bg-brand-50/30'}
                    ${isSelected ? 'bg-brand-50 ring-2 ring-inset ring-brand-400' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${today ? 'bg-brand-500 text-white' : inMonth ? 'text-gray-800' : 'text-gray-300'}
                    `}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Post pills */}
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map((post, j) => (
                      <div
                        key={j}
                        className={`text-xs truncate px-1.5 py-0.5 rounded font-medium
                          ${post.status === 'published' ? 'bg-emerald-100 text-emerald-700'
                            : post.status === 'scheduled' ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'}
                        `}
                      >
                        {post.content.slice(0, 20)}…
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="text-xs text-gray-400 pl-1">+{dayPosts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="card p-5">
          {selectedDay ? (
            <>
              <h3 className="font-semibold text-gray-900 mb-4">
                {format(selectedDay, 'EEEE, MMMM d')}
              </h3>
              {selectedPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No posts scheduled</p>
                  <button
                    onClick={() => navigate('/compose')}
                    className="text-xs text-brand-500 mt-2 hover:underline"
                  >
                    Schedule a post →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/compose/${post.id}`)}
                      className="p-3 border border-gray-100 rounded-lg hover:border-brand-300 hover:bg-brand-50/30 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusBadge status={post.status} />
                        {post.platforms?.split(',').filter(Boolean).map((p) => (
                          <PlatformBadge key={p} platform={p} showLabel={false} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">{post.content}</p>
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(post.scheduled_at), 'h:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="opacity-40" />
              </div>
              <p className="text-sm font-medium text-gray-500">Select a day</p>
              <p className="text-xs mt-1">Click on any date to see posts scheduled for that day</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-200" /> Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-200" /> Published
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-200" /> Draft
        </span>
      </div>
    </div>
  );
}
