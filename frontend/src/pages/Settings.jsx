import { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Loader2, Check, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Sao_Paulo', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

const Section = ({ icon: Icon, title, children }) => (
  <div className="card p-6">
    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
      <Icon size={18} className="text-brand-500" />
      <h2 className="font-semibold text-gray-900">{title}</h2>
    </div>
    {children}
  </div>
);

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef();

  const [profile, setProfile] = useState({ name: '', timezone: 'UTC' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [notifs, setNotifs] = useState({ email_notifications: true, post_reminders: true, weekly_report: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', timezone: user.timezone || 'UTC' });
    }
    api.get('/auth/settings').then((res) => {
      const s = res.data.settings;
      if (s) setNotifs({
        email_notifications: !!s.email_notifications,
        post_reminders: !!s.post_reminders,
        weekly_report: !!s.weekly_report,
      });
    }).catch(console.error);
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('name', profile.name);
      fd.append('timezone', profile.timezone);
      if (avatarFile) fd.append('avatar', avatarFile);
      await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    if (passwords.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPassword(true);
    try {
      await api.put('/auth/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleNotifSave = async () => {
    setSavingNotifs(true);
    try {
      await api.put('/auth/settings', notifs);
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const Toggle = ({ label, sub, checked, onChange }) => (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? 'bg-brand-500' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
    </label>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile */}
      <Section icon={User} title="Profile">
        <form onSubmit={handleProfileSave} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {(avatarPreview || user?.avatar_url) ? (
                  <img src={avatarPreview || user?.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
              >
                <Camera size={12} className="text-gray-600" />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div>
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="label">Display name</label>
            <input
              className="input"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Timezone</label>
            <select
              className="input"
              value={profile.timezone}
              onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
            >
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={15} />}
            Save Profile
          </button>
        </form>
      </Section>

      {/* Password */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              placeholder="Min. 6 characters"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              required
            />
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary">
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={15} />}
            Change Password
          </button>
        </form>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="divide-y divide-gray-100">
          <Toggle
            label="Email notifications"
            sub="Receive emails about post status changes"
            checked={notifs.email_notifications}
            onChange={() => setNotifs((n) => ({ ...n, email_notifications: !n.email_notifications }))}
          />
          <Toggle
            label="Post reminders"
            sub="Get reminded before scheduled posts go live"
            checked={notifs.post_reminders}
            onChange={() => setNotifs((n) => ({ ...n, post_reminders: !n.post_reminders }))}
          />
          <Toggle
            label="Weekly report"
            sub="Receive a weekly digest of your post performance"
            checked={notifs.weekly_report}
            onChange={() => setNotifs((n) => ({ ...n, weekly_report: !n.weekly_report }))}
          />
        </div>
        <button onClick={handleNotifSave} disabled={savingNotifs} className="btn-primary mt-4">
          {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={15} />}
          Save Preferences
        </button>
      </Section>

      {/* Account info */}
      <div className="card p-5 bg-gray-50">
        <p className="text-xs text-gray-500">
          Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        </p>
        <p className="text-xs text-gray-500 mt-1">PlainChat v1.0.0</p>
      </div>
    </div>
  );
}
