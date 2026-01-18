import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, Colleges, Essays, Markets, Voice, Activities } from './pages';
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
        const [colleges, essays, activities, honors] = await Promise.all([
          fetchColleges(user.id).catch(() => []),
          fetchEssays(user.id).catch(() => []),
          fetchActivities(user.id).catch(() => []),
          fetchHonors(user.id).catch(() => []),
        ]);
        const current = useStore.getState();
        setColleges(colleges.length ? colleges : current.colleges);
        setEssays(essays.length ? essays : current.essays);
        setActivities(activities.length ? activities : current.activities);
        setHonors(honors.length ? honors : current.honors);
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      if (user) {
        const appUser = { id: user.id, email: user.email || '', username: user.user_metadata?.name || '' };
        setUser({ ...appUser, credits: 1000, createdAt: new Date() });
        await ensureUserRow(appUser);
        const [colleges, essays, activities, honors] = await Promise.all([
          fetchColleges(user.id).catch(() => []),
          fetchEssays(user.id).catch(() => []),
          fetchActivities(user.id).catch(() => []),
          fetchHonors(user.id).catch(() => []),
        ]);
        const current = useStore.getState();
        setColleges(colleges.length ? colleges : current.colleges);
        setEssays(essays.length ? essays : current.essays);
        setActivities(activities.length ? activities : current.activities);
        setHonors(honors.length ? honors : current.honors);
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
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/essays" element={<Essays />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/markets" element={<Markets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
