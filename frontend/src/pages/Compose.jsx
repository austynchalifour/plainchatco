import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Image, X, Hash, Calendar, Send, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import PlatformBadge, { PLATFORMS } from '../components/PlatformBadge';

const MAX_CHARS = 280;

export default function Compose() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const isEditing = Boolean(id);

  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    api.get('/accounts').then((res) => setAccounts(res.data.accounts || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    setFetching(true);
    api.get(`/posts/${id}`)
      .then((res) => {
        const post = res.data.post;
        setContent(post.content);
        setCharCount(post.content.length);
        setHashtags(post.hashtags || []);
        setSelectedAccounts(post.post_accounts?.map((pa) => pa.social_account_id) || []);
        if (post.scheduled_at) {
          const d = new Date(post.scheduled_at);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          setScheduledAt(local.toISOString().slice(0, 16));
        }
      })
      .catch(() => toast.error('Post not found'))
      .finally(() => setFetching(false));
  }, [id, isEditing]);

  const toggleAccount = (accountId) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((a) => a !== accountId) : [...prev, accountId]
    );
  };

  const handleContent = (e) => {
    setContent(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setMediaPreviews((prev) => [...prev, ...previews]);
  };

  const removeMedia = (i) => {
    setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
    setMediaPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) setHashtags((prev) => [...prev, tag]);
    setHashtagInput('');
  };

  const removeHashtag = (tag) => setHashtags((prev) => prev.filter((t) => t !== tag));

  const buildFullContent = () => {
    let text = content.trim();
    if (hashtags.length) text += '\n\n' + hashtags.map((t) => `#${t}`).join(' ');
    return text;
  };

  const handleSave = async (asDraft = false) => {
    if (!content.trim()) { toast.error('Content is required'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', buildFullContent());
      formData.append('status', asDraft ? 'draft' : scheduledAt ? 'scheduled' : 'draft');
      if (scheduledAt && !asDraft) formData.append('scheduled_at', new Date(scheduledAt).toISOString());
      selectedAccounts.forEach((id) => formData.append('account_ids[]', id));
      hashtags.forEach((t) => formData.append('hashtags[]', t));
      mediaFiles.forEach((f) => formData.append('media', f));

      if (isEditing) {
        await api.put(`/posts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Post updated!');
      } else {
        await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(asDraft ? 'Draft saved!' : scheduledAt ? 'Post scheduled!' : 'Draft saved!');
      }
      navigate('/queue');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async () => {
    if (!content.trim()) { toast.error('Content is required'); return; }
    if (!selectedAccounts.length) { toast.error('Select at least one account'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', buildFullContent());
      formData.append('status', 'published');
      selectedAccounts.forEach((id) => formData.append('account_ids[]', id));
      hashtags.forEach((t) => formData.append('hashtags[]', t));
      mediaFiles.forEach((f) => formData.append('media', f));

      if (isEditing) {
        await api.put(`/posts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        await api.post(`/posts/${id}/publish`);
      } else {
        const res = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        await api.post(`/posts/${res.data.post.id}/publish`);
      }
      toast.success('Post published!');
      navigate('/queue');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const minDateTime = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16);
  const charOver = charCount > MAX_CHARS;

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <label className="label">Content</label>
            <textarea
              className="input min-h-[180px] resize-none text-base leading-relaxed"
              placeholder="What's on your mind? Write your post here..."
              value={content}
              onChange={handleContent}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 transition-colors"
                >
                  <Image size={16} /> Add media
                </button>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
              </div>
              <span className={`text-xs font-medium ${charOver ? 'text-red-500' : charCount > MAX_CHARS * 0.8 ? 'text-amber-500' : 'text-gray-400'}`}>
                {charCount}/{MAX_CHARS}
              </span>
            </div>

            {charOver && (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                Twitter/X limits posts to 280 characters. Other platforms may allow more.
              </div>
            )}

            {/* Media previews */}
            {mediaPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {mediaPreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="card p-5">
            <label className="label flex items-center gap-2"><Hash size={15} /> Hashtags</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="trending, socialmedia..."
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
              />
              <button type="button" onClick={addHashtag} className="btn-secondary">Add</button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {hashtags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 bg-brand-50 text-brand-600 text-sm px-2.5 py-1 rounded-full">
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:text-brand-800">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="card p-5">
            <label className="label text-gray-500">Preview</label>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[80px]">
              {content || hashtags.length ? (
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {content}
                  {hashtags.length > 0 && (
                    <><br /><br /><span className="text-brand-500">{hashtags.map((t) => `#${t}`).join(' ')}</span></>
                  )}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Your post preview will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Accounts */}
          <div className="card p-5">
            <label className="label">Post to accounts</label>
            {accounts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">No accounts connected</p>
                <button onClick={() => navigate('/accounts')} className="text-xs text-brand-500 hover:underline">
                  Connect accounts →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.filter((a) => a.is_active).map((account) => (
                  <label
                    key={account.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => toggleAccount(account.id)}
                      className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                    />
                    <PlatformBadge platform={account.platform} showLabel={false} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{account.account_name}</p>
                      {account.account_handle && (
                        <p className="text-xs text-gray-400 truncate">@{account.account_handle}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="card p-5">
            <label className="label flex items-center gap-2"><Calendar size={15} /> Schedule for later</label>
            <input
              type="datetime-local"
              className="input"
              min={minDateTime}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            {scheduledAt && (
              <button
                onClick={() => setScheduledAt('')}
                className="text-xs text-gray-400 hover:text-red-400 mt-1.5 flex items-center gap-1"
              >
                <X size={11} /> Clear schedule
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            <button
              onClick={handlePublishNow}
              disabled={loading || !content.trim() || !selectedAccounts.length}
              className="btn-primary w-full justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
              Publish Now
            </button>
            {scheduledAt && (
              <button
                onClick={() => handleSave(false)}
                disabled={loading || !content.trim()}
                className="btn-secondary w-full justify-center"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar size={16} />}
                Schedule Post
              </button>
            )}
            <button
              onClick={() => handleSave(true)}
              disabled={loading || !content.trim()}
              className="btn-secondary w-full justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
