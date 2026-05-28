import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Plus, Bell } from 'lucide-react';

const pageTitles = {
  '/': 'Dashboard',
  '/compose': 'Compose Post',
  '/queue': 'Post Queue',
  '/calendar': 'Calendar',
  '/analytics': 'Analytics',
  '/accounts': 'Social Accounts',
  '/settings': 'Settings',
};

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'PlainChat';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate('/compose')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Post</span>
        </button>
      </div>
    </header>
  );
}
