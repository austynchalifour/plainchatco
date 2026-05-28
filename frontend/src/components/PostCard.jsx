import { format } from 'date-fns';
import { Clock, Edit2, Trash2, Copy, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PlatformBadge from './PlatformBadge';

export default function PostCard({ post, onDelete, onDuplicate, onPublish }) {
  const navigate = useNavigate();

  const platforms = post.post_accounts
    ?.map((pa) => pa.platform)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) || [];

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={post.status} />
          {platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {post.status !== 'published' && (
            <>
              <button
                onClick={() => navigate(`/compose/${post.id}`)}
                className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              {post.status !== 'published' && (
                <button
                  onClick={() => onPublish?.(post.id)}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  title="Publish now"
                >
                  <Send size={14} />
                </button>
              )}
            </>
          )}
          <button
            onClick={() => onDuplicate?.(post.id)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => onDelete?.(post.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-800 line-clamp-3 mb-3 leading-relaxed">{post.content}</p>

      {/* Media thumbnails */}
      {post.media_urls?.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {post.media_urls.slice(0, 3).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-16 h-16 object-cover rounded-lg border border-gray-100"
            />
          ))}
          {post.media_urls.length > 3 && (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium">
              +{post.media_urls.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {(post.scheduled_at || post.published_at) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={12} />
          <span>
            {post.status === 'published' ? 'Published' : 'Scheduled'}:{' '}
            {format(new Date(post.scheduled_at || post.published_at), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
      )}
    </div>
  );
}
