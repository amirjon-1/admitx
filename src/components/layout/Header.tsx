import { Plus } from 'lucide-react';
import { Button } from '../ui';
import { useStore } from '../../store/useStore';
import { signInWithGoogle } from '../../lib/supabase';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { user, isAuthenticated } = useStore();

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
       

          {/* Credits Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-gray-700">
              {user?.credits?.toLocaleString() || 1000} CC
            </span>
          </div>

       

          {/* Action Button */}
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </Button>
          )}

          {/* Auth Buttons */}
          {!isAuthenticated && (
            <Button variant="secondary" onClick={() => signInWithGoogle()}>
              Sign in with Google
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
