import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home, Dashboard, Colleges, Essays, Markets, Voice, Activities } from './pages';
import { useStore } from './store/useStore';
import { supabase, ensureUserRow } from './lib/supabase';
import { fetchColleges, fetchEssays, fetchActivities, fetchHonors } from './lib/supabase';

function App() {
  const { setUser, setColleges, setEssays, setActivities, setHonors } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { subscription: { unsubscribe: () => void } } | null = null;
    let initTimeout: NodeJS.Timeout | null = null;

    // Set a timeout to ensure we don't get stuck loading forever
    initTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth initialization timeout - proceeding anyway');
        setIsInitializing(false);
      }
    }, 2000); // 2 second timeout

    // Initialize session and subscribe to auth changes
    const init = async () => {
      try {
        // Use Promise.race to ensure we don't wait forever
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, error: null }), 1500)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const { data: { session }, error } = result || { data: { session: null }, error: null };
        
        if (error && error.name !== 'AbortError') {
          console.error('Error getting session:', error);
        }
        
        if (isMounted) {
          if (session?.user) {
            // Valid session - set user
            const appUser = { 
              id: session.user.id, 
              email: session.user.email || '', 
              username: session.user.user_metadata?.name || '' 
            };
            setUser({ ...appUser, credits: 1000, createdAt: new Date() });
            
            // Don't await these - let them run in background
            ensureUserRow(appUser).catch(console.error);
            loadUserData(session.user.id).catch(console.error);
          } else {
            // No valid session - clear user to prevent stale redirects
            setUser(null);
            setColleges([]);
            setEssays([]);
            setActivities([]);
            setHonors([]);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Always set initializing to false, even if there's an error
        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    const loadUserData = async (userId: string) => {
      console.log('🔄 Loading user data from database...');
      try {
        const [colleges, essays, activities, honors] = await Promise.all([
          fetchColleges(userId).catch((err) => {
            console.error('Failed to fetch colleges:', err);
            return [];
          }),
          fetchEssays(userId).catch((err) => {
            console.error('Failed to fetch essays:', err);
            return [];
          }),
          fetchActivities(userId).catch((err) => {
            console.error('Failed to fetch activities:', err);
            return [];
          }),
          fetchHonors(userId).catch((err) => {
            console.error('Failed to fetch honors:', err);
            return [];
          }),
        ]);
        if (isMounted) {
          console.log(`📊 Loaded: ${colleges.length} colleges, ${essays.length} essays, ${activities.length} activities, ${honors.length} honors`);
          setColleges(colleges);
          setEssays(essays);
          setActivities(activities);
          setHonors(honors);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    init();

    // Subscribe to auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      try {
        const user = session?.user;
        if (user) {
          const appUser = { 
            id: user.id, 
            email: user.email || '', 
            username: user.user_metadata?.name || '' 
          };
          setUser({ ...appUser, credits: 1000, createdAt: new Date() });
          await ensureUserRow(appUser);
          await loadUserData(user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setColleges([]);
          setEssays([]);
          setActivities([]);
          setHonors([]);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });

    authSubscription = subscription;

    return () => {
      isMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      authSubscription?.subscription.unsubscribe();
    };
  }, [setUser, setColleges, setEssays, setActivities, setHonors]);

  // Show loading state during initialization to prevent 404s
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - Home page */}
        <Route path="/" element={<Home />} />
        
        {/* Protected routes - require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/colleges" element={<Colleges />} />
            <Route path="/essays" element={<Essays />} />
            <Route path="/voice" element={<Voice />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/markets" element={<Markets />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
