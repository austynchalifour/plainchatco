import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Filter, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import PostCard from '../components/PostCard';

const STATUSES = ['all', 'draft', 'scheduled', 'published', 'failed'];

export default function Queue() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (status !== 'all') params.status = status;
      const res = await api.get('/posts', { params });
      setPosts(res.data.posts);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { setPage(1); }, [status]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleDuplicate = async (postId) => {
    try {
      await api.post(`/posts/${postId}/duplicate`);
      toast.success('Post duplicated as draft');
      fetchPosts();
    } catch {
      toast.error('Failed to duplicate post');
    }
  };

  const handlePublish = async (postId) => {
    try {
      await api.post(`/posts/${postId}/publish`);
      toast.success('Post published!');
      fetchPosts();
    } catch {
      toast.error('Failed to publish post');
    }
  };

  const filtered = posts.filter((p) =>
    search ? p.content.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Status tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                status === s ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-1 sm:justify-end">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              className="input pl-8 w-48"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchPosts} className="btn-secondary px-2.5" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => navigate('/compose')} className="btn-primary">
            <Plus size={15} /> New Post
          </button>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-500">{total} post{total !== 1 ? 's' : ''} total</p>

      {/* Posts grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 flex flex-col items-center text-gray-400">
          <Filter size={36} className="mb-3 opacity-30" />
          <p className="text-base font-medium">No posts found</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search.' : status !== 'all' ? `No ${status} posts yet.` : "You haven't created any posts yet."}
          </p>
          {!search && (
            <button onClick={() => navigate('/compose')} className="btn-primary mt-4">
              Create your first post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onPublish={handlePublish}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary px-3 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary px-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
