import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function ProtectedRoute() {
  const { user } = useStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Double-check auth state if user is not in store
    const checkAuth = async () => {
      if (!user) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setIsChecking(false);
          } else {
            // Session exists but user not in store - wait for App.tsx to load it
            setTimeout(() => setIsChecking(false), 1000);
          }
        } catch (error) {
          console.error('Auth check error:', error);
          setIsChecking(false);
        }
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [user]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Store the attempted location so we can redirect back after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

