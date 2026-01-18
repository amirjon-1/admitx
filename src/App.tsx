import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home, Dashboard, Colleges, Essays, Markets, Voice, Activities } from './pages';
import { useStore } from './store/useStore';
import { supabase, ensureUserRow } from './lib/supabase';
import { fetchColleges, fetchEssays, fetchActivities, fetchHonors } from './lib/supabase';

function App() {
  const { setUser, setColleges, setEssays, setActivities, setHonors } = useStore();

  useEffect(() => {
    // Initialize session and subscribe to auth changes
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const appUser = { id: user.id, email: user.email || '', username: user.user_metadata?.name || '' };
        setUser({ ...appUser, credits: 1000, createdAt: new Date() });
        await ensureUserRow(appUser);
        // Load user data
        console.log('🔄 Loading user data from database...');
        const [colleges, essays, activities, honors] = await Promise.all([
          fetchColleges(user.id).catch((err) => {
            console.error('Failed to fetch colleges:', err);
            return [];
          }),
          fetchEssays(user.id).catch((err) => {
            console.error('Failed to fetch essays:', err);
            return [];
          }),
          fetchActivities(user.id).catch((err) => {
            console.error('Failed to fetch activities:', err);
            return [];
          }),
          fetchHonors(user.id).catch((err) => {
            console.error('Failed to fetch honors:', err);
            return [];
          }),
        ]);
        // Always use database data, don't fallback to cache
        console.log(`📊 Loaded: ${colleges.length} colleges, ${essays.length} essays, ${activities.length} activities, ${honors.length} honors`);
        setColleges(colleges);
        setEssays(essays);
        setActivities(activities);
        setHonors(honors);
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      if (user) {
        const appUser = { id: user.id, email: user.email || '', username: user.user_metadata?.name || '' };
        setUser({ ...appUser, credits: 1000, createdAt: new Date() });
        await ensureUserRow(appUser);
        console.log('🔄 Loading user data from database (auth state change)...');
        const [colleges, essays, activities, honors] = await Promise.all([
          fetchColleges(user.id).catch((err) => {
            console.error('Failed to fetch colleges:', err);
            return [];
          }),
          fetchEssays(user.id).catch((err) => {
            console.error('Failed to fetch essays:', err);
            return [];
          }),
          fetchActivities(user.id).catch((err) => {
            console.error('Failed to fetch activities:', err);
            return [];
          }),
          fetchHonors(user.id).catch((err) => {
            console.error('Failed to fetch honors:', err);
            return [];
          }),
        ]);
        // Always use database data, don't fallback to cache
        console.log(`📊 Loaded: ${colleges.length} colleges, ${essays.length} essays, ${activities.length} activities, ${honors.length} honors`);
        setColleges(colleges);
        setEssays(essays);
        setActivities(activities);
        setHonors(honors);
      } else if (event === 'SIGNED_OUT') {
        // Only clear on explicit sign-out; preserve cache on initial null session
        setUser(null);
        setColleges([]);
        setEssays([]);
        setActivities([]);
        setHonors([]);
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, [setUser, setColleges, setEssays, setActivities, setHonors]);

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
