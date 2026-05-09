import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Zap, ScrollText, User, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { authApi } from '../services/api.js';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/automations', label: 'Automations', icon: Zap },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/account', label: 'Account', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const { clearAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      clearAdmin();
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-secondary border-r border-surface-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-black" fill="black" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">InstaFlow</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-surface-border pt-3">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-950/30"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
