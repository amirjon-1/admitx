import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  Mic,
  Trophy,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import logoImage from '../../assets/image.png';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Colleges', href: '/colleges', icon: GraduationCap },
  { name: 'Essays', href: '/essays', icon: FileText },
  { name: 'Voice Interview', href: '/voice', icon: Mic },
  { name: 'Activities', href: '/activities', icon: Trophy },
  { name: 'Markets', href: '/markets', icon: TrendingUp },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { user, setUser, setColleges, setEssays, setActivities, setHonors } = useStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    
    try {
      console.log('Starting logout...');
      
      // Clear state immediately
      setUser(null);
      setColleges([]);
      setEssays([]);
      setActivities([]);
      setHonors([]);
      
      // Set a flag to prevent auto-login on next page load
      sessionStorage.setItem('admitx_logging_out', 'true');
      
      // Clear all Supabase-related storage first
      try {
        // Clear Supabase session storage
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || key.includes('supabase')
        );
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        
        // Also clear sessionStorage (except our logout flag)
        const sessionKeys = Object.keys(sessionStorage).filter(key => 
          (key.startsWith('sb-') || key.includes('supabase')) && key !== 'admitx_logging_out'
        );
        sessionKeys.forEach(key => sessionStorage.removeItem(key));
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      // Sign out from Supabase (don't wait - do it in background)
      supabase.auth.signOut().catch(err => {
        console.error('Sign out error:', err);
      });
      
      console.log('Sign out successful, redirecting...');
      
      // Force immediate redirect - use setTimeout to ensure it happens after state updates
      setTimeout(() => {
        window.location.href = '/';
      }, 50);
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear state anyway
      setUser(null);
      setColleges([]);
      setEssays([]);
      setActivities([]);
      setHonors([]);
      
      // Set logout flag
      sessionStorage.setItem('admitx_logging_out', 'true');
      
      // Clear storage manually
      try {
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || key.includes('supabase')
        );
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        const sessionKeys = Object.keys(sessionStorage).filter(key => 
          (key.startsWith('sb-') || key.includes('supabase')) && key !== 'admitx_logging_out'
        );
        sessionKeys.forEach(key => sessionStorage.removeItem(key));
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      // Force redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 50);
    }
  };

  return (
    <div className="flex flex-col h-full w-64 md:w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <img 
          src={logoImage} 
          alt="AdmitX Logo" 
          className="w-10 h-10 rounded-xl"
        />
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
            onClick={onNavigate}
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
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-3 py-2 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
