import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  Mic,
  Trophy,
  TrendingUp,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Colleges', href: '/colleges', icon: GraduationCap },
  { name: 'Essays', href: '/essays', icon: FileText },
  { name: 'Voice Interview', href: '/voice', icon: Mic },
  { name: 'Activities', href: '/activities', icon: Trophy },
  { name: 'Markets', href: '/markets', icon: TrendingUp },
];

export function Sidebar() {
  const { user, logout } = useStore();

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="p-2 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AdmitX</h1>
          <p className="text-xs text-gray-400">AI College Counseling</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-primary-400 rounded-r-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
            <span className="text-lg font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.username || 'Guest User'}
            </p>
            <p className="text-xs text-gray-400">
              {user?.credits?.toLocaleString() || 1000} credits
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
