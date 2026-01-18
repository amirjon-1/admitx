import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { upsertCollege, deleteCollege, upsertEssay, deleteEssay, upsertActivity, deleteActivity, upsertHonor, deleteHonor, signOut } from '../lib/supabase';
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
      logout: async () => {
        await signOut().catch(console.error);
        // set({
        //   user: null,
        //   isAuthenticated: false,
        //   profile: null,
        //   colleges: [],
        //   essays: [],
        //   activities: [],
        //   honors: [],
        //   interviews: [],
        //   myBets: [],
        // });
      },

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
          if (state.user) {
            upsertEssay(state.user.id, essay)
              .then(() => {
                console.log('✅ Essay saved to database:', essay.id);
              })
              .catch((err) => {
                console.error('❌ Failed to save essay to database:', err);
                console.error('Essay data:', essay);
              });
          } else {
            console.warn('⚠️ Cannot save essay: user not authenticated');
          }
          return { essays: next };
        }),
      updateEssay: (id, updates) =>
        set((state) => {
          const next = state.essays.map((e) => (e.id === id ? { ...e, ...updates } : e));
          const updated = next.find((e) => e.id === id);
          if (state.user && updated) {
            // Ensure all required fields are present and dates are Date objects
            const essayToSave = {
              ...updated,
              // Ensure required fields exist - preserve ALL fields from the existing essay
              id: updated.id,
              userId: updated.userId || state.user.id,
              collegeId: updated.collegeId || null,
              prompt: updated.prompt || 'Untitled Essay',
              draft: updated.draft || '', // CRITICAL: Make sure draft is included
              version: updated.version || 1,
              wordCount: updated.wordCount || 0,
              authenticityScore: updated.authenticityScore ?? null,
              // Ensure dates are Date objects
              createdAt: updated.createdAt instanceof Date 
                ? updated.createdAt 
                : new Date(updated.createdAt || Date.now()),
              updatedAt: updated.updatedAt instanceof Date 
                ? updated.updatedAt 
                : new Date(updates.updatedAt || Date.now()),
              lastFeedbackAt: updated.lastFeedbackAt 
                ? (updated.lastFeedbackAt instanceof Date 
                    ? updated.lastFeedbackAt 
                    : new Date(updated.lastFeedbackAt))
                : null,
            };
            
            console.log('🔄 Updating essay in database:', { 
              id, 
              updates,
              draft_length: essayToSave.draft?.length || 0,
              prompt: essayToSave.prompt?.substring(0, 30) + '...'
            });
            
            // Await the upsert to ensure it completes
            upsertEssay(state.user.id, essayToSave)
              .then((result) => {
                console.log('✅ Essay updated in database:', id);
                console.log('✅ Upsert result:', result ? 'Success' : 'No data returned');
                
                // Verify the save was successful by checking if we got data back
                if (!result || result.length === 0) {
                  console.warn('⚠️ Essay update completed but no data returned - might indicate RLS issue');
                }
              })
              .catch((err) => {
                console.error('❌ Failed to update essay in database:', err);
                console.error('Essay data:', {
                  id: essayToSave.id,
                  prompt: essayToSave.prompt?.substring(0, 50),
                  draft_length: essayToSave.draft?.length,
                  wordCount: essayToSave.wordCount
                });
                // Revert the local state update if save failed
                // Actually, don't revert - let the user see their changes, but log the error
              });
          } else {
            if (!state.user) {
              console.warn('⚠️ Cannot update essay: user not authenticated');
            } else {
              console.warn('⚠️ Cannot update essay: essay not found with id:', id);
            }
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
          if (state.user) {
            upsertActivity(state.user.id, activity)
              .then(() => {
                console.log('✅ Activity saved to database:', activity.id);
              })
              .catch((err) => {
                console.error('❌ Failed to save activity to database:', err);
                console.error('Activity data:', activity);
              });
          } else {
            console.warn('⚠️ Cannot save activity: user not authenticated');
          }
          return { activities: next };
        }),
      updateActivity: (id, updates) =>
        set((state) => {
          const next = state.activities.map((a) => (a.id === id ? { ...a, ...updates } : a));
          const updated = next.find((a) => a.id === id);
          if (state.user && updated) {
            upsertActivity(state.user.id, updated)
              .then(() => {
                console.log('✅ Activity updated in database:', id);
              })
              .catch((err) => {
                console.error('❌ Failed to update activity in database:', err);
                console.error('Activity data:', updated);
              });
          } else {
            if (!state.user) {
              console.warn('⚠️ Cannot update activity: user not authenticated');
            }
          }
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
