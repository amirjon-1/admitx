import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
        set((state) => ({ colleges: [...state.colleges, college] })),
      updateCollege: (id, updates) =>
        set((state) => ({
          colleges: state.colleges.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      removeCollege: (id) =>
        set((state) => ({
          colleges: state.colleges.filter((c) => c.id !== id),
        })),

      // Essays
      essays: [],
      setEssays: (essays) => set({ essays }),
      addEssay: (essay) =>
        set((state) => ({ essays: [...state.essays, essay] })),
      updateEssay: (id, updates) =>
        set((state) => ({
          essays: state.essays.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeEssay: (id) =>
        set((state) => ({
          essays: state.essays.filter((e) => e.id !== id),
        })),

      // Activities
      activities: [],
      setActivities: (activities) => set({ activities }),
      addActivity: (activity) =>
        set((state) => ({ activities: [...state.activities, activity] })),
      updateActivity: (id, updates) =>
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      removeActivity: (id) =>
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        })),

      // Honors
      honors: [],
      setHonors: (honors) => set({ honors }),
      addHonor: (honor) =>
        set((state) => ({ honors: [...state.honors, honor] })),
      updateHonor: (id, updates) =>
        set((state) => ({
          honors: state.honors.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),
      removeHonor: (id) =>
        set((state) => ({
          honors: state.honors.filter((h) => h.id !== id),
        })),

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
      name: 'council-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
