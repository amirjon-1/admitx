import { createClient } from '@supabase/supabase-js';
import type { College, Essay, Activity, Honor } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Subscribe to auth changes
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// =================== DATA SYNC HELPERS ===================

// Colleges
export async function fetchColleges(userId: string): Promise<College[]> {
  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id,
    userId: c.user_id,
    name: c.name,
    deadline: c.deadline ? new Date(c.deadline) : null,
    decisionType: c.decision_type,
    applicationType: c.application_type || '',
    status: c.status,
    result: c.result || null,
    createdAt: new Date(c.created_at),
  }));
}

export async function upsertCollege(userId: string, college: College) {
  const payload = {
    id: college.id,
    user_id: userId,
    name: college.name,
    deadline: college.deadline ? college.deadline.toISOString().split('T')[0] : null,
    decision_type: college.decisionType,
    application_type: college.applicationType,
    status: college.status,
    result: college.result,
  };
  const { error } = await supabase.from('colleges').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteCollege(id: string) {
  const { error } = await supabase.from('colleges').delete().eq('id', id);
  if (error) throw error;
}

// Essays
export async function fetchEssays(userId: string): Promise<Essay[]> {
  const { data, error } = await supabase
    .from('essays')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    userId: e.user_id,
    collegeId: e.college_id,
    prompt: e.prompt,
    draft: e.draft,
    version: e.version || 1,
    authenticityScore: e.authenticity_score ?? null,
    wordCount: e.word_count || 0,
    lastFeedbackAt: e.last_feedback_at ? new Date(e.last_feedback_at) : null,
    createdAt: new Date(e.created_at),
    updatedAt: new Date(e.updated_at),
  }));
}

export async function upsertEssay(userId: string, essay: Essay) {
  const payload = {
    id: essay.id,
    user_id: userId,
    college_id: essay.collegeId,
    prompt: essay.prompt,
    draft: essay.draft,
    version: essay.version,
    authenticity_score: essay.authenticityScore,
    word_count: essay.wordCount,
    last_feedback_at: essay.lastFeedbackAt ? essay.lastFeedbackAt.toISOString() : null,
    created_at: essay.createdAt.toISOString(),
    updated_at: essay.updatedAt.toISOString(),
  };
  const { error } = await supabase.from('essays').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteEssay(id: string) {
  const { error } = await supabase.from('essays').delete().eq('id', id);
  if (error) throw error;
}

// TODO: Add similar helpers for activities, honors, interviews, markets, bets, profile
// Activities
export async function fetchActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    category: a.category,
    name: a.name,
    role: a.role || '',
    description: a.description || '',
    hoursPerWeek: a.hours_per_week || 0,
    weeksPerYear: a.weeks_per_year || 0,
    yearsParticipated: a.years_participated || 0,
    leadershipPosition: !!a.leadership_position,
    tier: a.tier,
    photoUrl: a.photo_url ?? null,
    photoAnalysis: a.photo_analysis ?? null,
    createdAt: new Date(a.created_at),
  }));
}

export async function upsertActivity(userId: string, activity: Activity) {
  const payload = {
    id: activity.id,
    user_id: userId,
    category: activity.category,
    name: activity.name,
    role: activity.role,
    description: activity.description,
    hours_per_week: activity.hoursPerWeek,
    weeks_per_year: activity.weeksPerYear,
    years_participated: activity.yearsParticipated,
    leadership_position: activity.leadershipPosition,
    tier: activity.tier,
    photo_url: activity.photoUrl,
    photo_analysis: activity.photoAnalysis,
  };
  const { error } = await supabase.from('activities').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteActivity(id: string) {
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
}

// Honors
export async function fetchHonors(userId: string): Promise<Honor[]> {
  const { data, error } = await supabase
    .from('honors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((h: any) => ({
    id: h.id,
    userId: h.user_id,
    name: h.name,
    level: h.level,
    description: h.description ?? null,
    gradeReceived: h.grade_received,
    createdAt: new Date(h.created_at),
  }));
}

export async function upsertHonor(userId: string, honor: Honor) {
  const payload = {
    id: honor.id,
    user_id: userId,
    name: honor.name,
    level: honor.level,
    description: honor.description,
    grade_received: honor.gradeReceived,
  };
  const { error } = await supabase.from('honors').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteHonor(id: string) {
  const { error } = await supabase.from('honors').delete().eq('id', id);
  if (error) throw error;
}
