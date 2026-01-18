import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function ProtectedRoute() {
  const { user } = useStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsChecking(false);
      }
    }, 2000);

    // Double-check auth state if user is not in store
    const checkAuth = async () => {
      // If user exists in store, we're done
      if (user) {
        clearTimeout(timeoutId);
        setIsChecking(false);
        return;
      }

      try {
        // Check session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, error: null }), 1000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const { data: { session } } = result || { data: { session: null }, error: null };
        
        if (isMounted) {
          clearTimeout(timeoutId);
          if (session?.user) {
            // Session exists - allow access, App.tsx will load user data
            // Don't wait for user to be in store, just allow the route
            setIsChecking(false);
          } else {
            // No session - will redirect to home
            setIsChecking(false);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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

