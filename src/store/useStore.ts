import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { upsertCollege, deleteCollege, upsertEssay, deleteEssay, upsertActivity, deleteActivity, upsertHonor, deleteHonor } from '../lib/supabase';
import type {
  User,
  StudentProfile,
  College,
  Essay,
  Activity,
  Honor,
  AdmissionsMarket,
  Bet,
  VoiceInterview,
} from '../types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Profile
  profile: StudentProfile | null;
  setProfile: (profile: StudentProfile | null) => void;

  // Colleges
  colleges: College[];
  setColleges: (colleges: College[]) => void;
  addCollege: (college: College) => void;
  updateCollege: (id: string, updates: Partial<College>) => void;
  removeCollege: (id: string) => void;

  // Essays
  essays: Essay[];
  setEssays: (essays: Essay[]) => void;
  addEssay: (essay: Essay) => void;
  updateEssay: (id: string, updates: Partial<Essay>) => void;
  removeEssay: (id: string) => void;

  // Activities
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  removeActivity: (id: string) => void;

  // Honors
  honors: Honor[];
  setHonors: (honors: Honor[]) => void;
  addHonor: (honor: Honor) => void;
  updateHonor: (id: string, updates: Partial<Honor>) => void;
  removeHonor: (id: string) => void;

  // Voice Interviews
  interviews: VoiceInterview[];
  setInterviews: (interviews: VoiceInterview[]) => void;
  addInterview: (interview: VoiceInterview) => void;

  // Markets
  markets: AdmissionsMarket[];
  setMarkets: (markets: AdmissionsMarket[]) => void;
  updateMarket: (id: string, updates: Partial<AdmissionsMarket>) => void;

  // User Bets
  myBets: Bet[];
  setMyBets: (bets: Bet[]) => void;
  addBet: (bet: Bet) => void;

  // UI State
  selectedCollegeId: string | null;
  setSelectedCollegeId: (id: string | null) => void;
  selectedEssayId: string | null;
  setSelectedEssayId: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          profile: null,
          colleges: [],
          essays: [],
          activities: [],
          honors: [],
          interviews: [],
          myBets: [],
        }),

      // Profile
      profile: null,
      setProfile: (profile) => set({ profile }),

      // Colleges
      colleges: [],
      setColleges: (colleges) => set({ colleges }),
      addCollege: (college) =>
        set((state) => {
          const next = [...state.colleges, college];
          if (state.user) {
            upsertCollege(state.user.id, college).catch((err) => {
              console.error('Failed to save college to Supabase', err);
            });
          }
          return { colleges: next };
        }),
      updateCollege: (id, updates) =>
        set((state) => {
          const next = state.colleges.map((c) => (c.id === id ? { ...c, ...updates } : c));
          const updated = next.find((c) => c.id === id);
          if (state.user && updated) {
            upsertCollege(state.user.id, updated).catch((err) => {
              console.error('Failed to update college in Supabase', err);
            });
          }
          return { colleges: next };
        }),
      removeCollege: (id) =>
        set((state) => {
          if (state.user) deleteCollege(id).catch(console.error);
          return { colleges: state.colleges.filter((c) => c.id !== id) };
        }),

      // Essays
      essays: [],
      setEssays: (essays) => set({ essays }),
      addEssay: (essay) =>
        set((state) => {
          const next = [...state.essays, essay];
          if (state.user) upsertEssay(state.user.id, essay).catch(console.error);
          return { essays: next };
        }),
      updateEssay: (id, updates) =>
        set((state) => {
          const next = state.essays.map((e) => (e.id === id ? { ...e, ...updates } : e));
          const updated = next.find((e) => e.id === id);
          if (state.user && updated) {
            upsertEssay(state.user.id, {
              ...updated,
              updatedAt: new Date(),
            }).catch(console.error);
          }
          return { essays: next };
        }),
      removeEssay: (id) =>
        set((state) => {
          if (state.user) deleteEssay(id).catch(console.error);
          return { essays: state.essays.filter((e) => e.id !== id) };
        }),

      // Activities
      activities: [],
      setActivities: (activities) => set({ activities }),
      addActivity: (activity) =>
        set((state) => {
          const next = [...state.activities, activity];
          if (state.user) upsertActivity(state.user.id, activity).catch(console.error);
          return { activities: next };
        }),
      updateActivity: (id, updates) =>
        set((state) => {
          const next = state.activities.map((a) => (a.id === id ? { ...a, ...updates } : a));
          const updated = next.find((a) => a.id === id);
          if (state.user && updated) upsertActivity(state.user.id, updated).catch(console.error);
          return { activities: next };
        }),
      removeActivity: (id) =>
        set((state) => {
          if (state.user) deleteActivity(id).catch(console.error);
          return { activities: state.activities.filter((a) => a.id !== id) };
        }),

      // Honors
      honors: [],
      setHonors: (honors) => set({ honors }),
      addHonor: (honor) =>
        set((state) => {
          const next = [...state.honors, honor];
          if (state.user) upsertHonor(state.user.id, honor).catch(console.error);
          return { honors: next };
        }),
      updateHonor: (id, updates) =>
        set((state) => {
          const next = state.honors.map((h) => (h.id === id ? { ...h, ...updates } : h));
          const updated = next.find((h) => h.id === id);
          if (state.user && updated) upsertHonor(state.user.id, updated).catch(console.error);
          return { honors: next };
        }),
      removeHonor: (id) =>
        set((state) => {
          if (state.user) deleteHonor(id).catch(console.error);
          return { honors: state.honors.filter((h) => h.id !== id) };
        }),

      // Voice Interviews
      interviews: [],
      setInterviews: (interviews) => set({ interviews }),
      addInterview: (interview) =>
        set((state) => ({ interviews: [...state.interviews, interview] })),

      // Markets
      markets: [],
      setMarkets: (markets) => set({ markets }),
      updateMarket: (id, updates) =>
        set((state) => ({
          markets: state.markets.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      // User Bets
      myBets: [],
      setMyBets: (bets) => set({ myBets: bets }),
      addBet: (bet) =>
        set((state) => ({ myBets: [...state.myBets, bet] })),

      // UI State
      selectedCollegeId: null,
      setSelectedCollegeId: (id) => set({ selectedCollegeId: id }),
      selectedEssayId: null,
      setSelectedEssayId: (id) => set({ selectedEssayId: id }),
    }),
    {
      name: 'admitx-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
        colleges: state.colleges,
        essays: state.essays,
        activities: state.activities,
        honors: state.honors,
        interviews: state.interviews,
        markets: state.markets,
        myBets: state.myBets,
        selectedCollegeId: state.selectedCollegeId,
        selectedEssayId: state.selectedEssayId,
      }),
    }
  )
);
