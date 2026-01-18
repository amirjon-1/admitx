import { createClient } from '@supabase/supabase-js';
import type { College, Essay, Activity, Honor, User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Ensure a row exists in public.users for RLS checks
export async function ensureUserRow(user: Pick<User, 'id' | 'email' | 'username'>) {
  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      username: user.username || user.email,
    }, { onConflict: 'id' });
  if (error) {
    console.error('ensureUserRow error', error.message);
    throw error;
  }
}

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
  // Handle deadline - it might be a Date object, string, or null
  let deadlineStr: string | null = null;
  if (college.deadline) {
    if (college.deadline instanceof Date) {
      deadlineStr = college.deadline.toISOString().split('T')[0];
    } else if (typeof college.deadline === 'string') {
      // If it's already a string, validate and use it
      // Check if it's a valid date string
      const date = new Date(college.deadline);
      if (!isNaN(date.getTime())) {
        deadlineStr = date.toISOString().split('T')[0];
      } else {
        // If it's already in YYYY-MM-DD format, use it directly
        deadlineStr = college.deadline;
      }
    } else {
      // Try to parse it as a date
      const date = new Date(college.deadline as any);
      if (!isNaN(date.getTime())) {
        deadlineStr = date.toISOString().split('T')[0];
      }
    }
  }

  const payload = {
    id: college.id,
    user_id: userId,
    name: college.name,
    deadline: deadlineStr,
    decision_type: college.decisionType,
    application_type: college.applicationType || '',
    status: college.status,
    result: college.result || null,
  };
  
  console.log('💾 Saving college to database:', { userId, collegeId: college.id, name: college.name, status: college.status });
  
  const { error } = await supabase.from('colleges').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('❌ upsertCollege error', error.message, payload);
    throw error;
  }
  
  console.log('✅ College saved successfully');
}

export async function deleteCollege(id: string) {
  const { error } = await supabase.from('colleges').delete().eq('id', id);
  if (error) throw error;
}

// Essays
export async function fetchEssays(userId: string): Promise<Essay[]> {
  console.log('📥 Fetching essays from database for user:', userId);
  
  // First, check if we can query the table at all
  const { data: testData, error: testError } = await supabase
    .from('essays')
    .select('count')
    .limit(1);
  
  if (testError) {
    console.error('❌ Cannot access essays table:', testError);
    console.error('Error code:', testError.code);
    console.error('Error message:', testError.message);
    console.error('Error hint:', testError.hint);
  }
  
  const { data, error } = await supabase
    .from('essays')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching essays:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error hint:', error.hint);
    throw error;
  }
  
  console.log(`📊 Raw data from query:`, data);
  console.log(`📊 Number of rows returned:`, data?.length || 0);
  
  const essays = (data || []).map((e: any) => ({
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
  
  console.log(`✅ Fetched ${essays.length} essays from database`);
  if (essays.length > 0) {
    console.log('Essays:', essays.map(e => ({ id: e.id, prompt: e.prompt.substring(0, 50) + '...', wordCount: e.wordCount, userId: e.userId })));
  } else {
    console.warn('⚠️ No essays found for user:', userId);
    // Try a query without user filter to see if there are any essays at all
    const { data: allEssays } = await supabase
      .from('essays')
      .select('id, user_id, prompt')
      .limit(5);
    console.log('🔍 Sample essays in database (any user):', allEssays);
  }
  
  return essays;
}

export async function upsertEssay(userId: string, essay: Essay) {
  try {
    // Validate required fields
    if (!essay.prompt || !essay.prompt.trim()) {
      throw new Error('Essay prompt is required');
    }
    if (!essay.draft || !essay.draft.trim()) {
      throw new Error('Essay draft is required');
    }
    if (!essay.id) {
      throw new Error('Essay ID is required');
    }

    // Helper function to convert to ISO string
    const toISOString = (date: Date | string | null | undefined): string => {
      if (!date) return new Date().toISOString();
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
      }
      return new Date().toISOString();
    };

    const payload = {
      id: essay.id,
      user_id: userId,
      college_id: essay.collegeId || null,
      prompt: essay.prompt.trim(),
      draft: essay.draft.trim(),
      version: essay.version || 1,
      authenticity_score: essay.authenticityScore ?? null,
      word_count: essay.wordCount || 0,
      last_feedback_at: essay.lastFeedbackAt ? toISOString(essay.lastFeedbackAt) : null,
      created_at: toISOString(essay.createdAt),
      updated_at: toISOString(essay.updatedAt),
    };

    console.log('💾 Saving essay to database:', { 
      userId, 
      essayId: essay.id, 
      prompt: essay.prompt.substring(0, 50) + '...', 
      wordCount: essay.wordCount,
      collegeId: essay.collegeId 
    });
    console.log('📦 Full payload being saved:', payload);

    console.log('🔄 Calling supabase.upsert...');
    console.log('🔍 Supabase URL:', supabaseUrl);
    console.log('🔍 Has anon key:', !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key');
    console.log('🔍 Payload user_id:', userId);
    
    // Check authentication state
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('🔐 Auth session check:', { 
      hasSession: !!authData?.session, 
      userId: authData?.session?.user?.id,
      matchesPayload: authData?.session?.user?.id === userId,
      authError: authError?.message 
    });
    
    if (!authData?.session) {
      throw new Error('No active session. Please sign in again.');
    }
    
    if (authData.session.user.id !== userId) {
      throw new Error(`User ID mismatch: session has ${authData.session.user.id}, but payload has ${userId}`);
    }
    
    // Verify user row exists in public.users (required for foreign key)
    console.log('🔍 Verifying user row exists in public.users...');
    const { data: userRow, error: userRowError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    if (userRowError || !userRow) {
      console.error('❌ User row does not exist in public.users!', userRowError);
      console.log('🔄 Attempting to create user row...');
      
      // Try to get email from auth
      const email = authData.session.user.email || '';
      
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          username: email.split('@')[0] || 'user',
          credits: 1000
        });
      
      if (createUserError) {
        console.error('❌ Failed to create user row:', createUserError);
        throw new Error(`User row does not exist and could not be created: ${createUserError.message}`);
      } else {
        console.log('✅ User row created successfully');
      }
    } else {
      console.log('✅ User row exists:', { id: userRow.id, email: userRow.email });
    }
    
    // Use the userId directly from parameter (it should match auth.uid() for RLS)
    payload.user_id = userId;
    
    // Try direct upsert - simpler approach
    let data, error;
    try {
      console.log('🔄 Attempting direct upsert (no select first)...');
      
      // First try without .select() to see if insert works
      const upsertWithoutSelect = supabase
        .from('essays')
        .upsert(payload, { onConflict: 'id' });
      
      const timeout1 = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Upsert (no select) timeout after 10 seconds')), 10000)
      );
      
      console.log('⏳ Waiting for upsert (no select)...');
      const result1 = await Promise.race([upsertWithoutSelect, timeout1]);
      error = result1.error;
      
      if (error) {
        console.error('❌ Upsert (no select) failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error hint:', error.hint);
        throw error;
      }
      
      console.log('✅ Upsert (no select) succeeded! Now fetching the data...');
      
      // Now fetch the data we just inserted
      const fetchPromise = supabase
        .from('essays')
        .select('*')
        .eq('id', essay.id)
        .eq('user_id', userId)
        .single();
      
      const timeout2 = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Fetch after upsert timeout after 5 seconds')), 5000)
      );
      
      const fetchResult = await Promise.race([fetchPromise, timeout2]);
      data = fetchResult.data ? [fetchResult.data] : null;
      error = fetchResult.error;
      
      if (error) {
        console.warn('⚠️ Upsert succeeded but could not fetch data:', error);
        // This is okay - the data was saved, we just can't read it back (RLS issue)
        console.log('✅ Essay was saved, but RLS is preventing read-back');
        return null; // Return null to indicate success but no data
      }
      
      console.log('✅ Successfully fetched essay after upsert:', { 
        id: data?.[0]?.id, 
        user_id: data?.[0]?.user_id 
      });
    } catch (upsertError: any) {
      console.error('❌ Exception during upsert call:', upsertError);
      console.error('Upsert error type:', upsertError instanceof Error ? upsertError.constructor.name : typeof upsertError);
      console.error('Upsert error message:', upsertError instanceof Error ? upsertError.message : String(upsertError));
      
      if (upsertError instanceof Error && (upsertError.name === 'AbortError' || upsertError.message.includes('timeout'))) {
        console.error('❌ Request was aborted or timed out');
        console.error('❌ This could indicate:');
        console.error('   1. Network connectivity issue');
        console.error('   2. Supabase server is down');
        console.error('   3. RLS policy is blocking the operation');
        console.error('   4. CORS issue');
        
        // Try to check if it was saved despite the error
        try {
          const { data: checkData, error: checkError } = await supabase
            .from('essays')
            .select('id')
            .eq('id', essay.id)
            .eq('user_id', userId)
            .single();
          
          if (checkData) {
            console.log('✅ Essay was actually saved despite the error!');
            return [checkData];
          } else if (checkError) {
            console.error('❌ Verification query also failed:', checkError);
          } else {
            console.error('❌ Essay was NOT saved - verification query returned no data');
          }
        } catch (verifyErr) {
          console.error('❌ Verification query threw exception:', verifyErr);
        }
      }
      throw upsertError;
    }
    
    if (error) {
      console.error('❌ upsertEssay error:', error.message);
      console.error('Error details:', error);
      console.error('Error code:', error.code);
      console.error('Error hint:', error.hint);
      console.error('Error details object:', JSON.stringify(error, null, 2));
      console.error('Payload that failed:', payload);
      throw error;
    }

    console.log('✅ Essay saved successfully to database');
    if (data && data.length > 0) {
      console.log('✅ Saved essay data from response:', data[0]);
    } else {
      console.warn('⚠️ Upsert succeeded but no data returned - this might indicate RLS policy issue');
      console.warn('⚠️ The essay might be saved but RLS is preventing us from reading it back');
    }

    // Verify the save by immediately fetching it
    const { data: verifyData, error: verifyError } = await supabase
      .from('essays')
      .select('*')
      .eq('id', essay.id)
      .eq('user_id', userId)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification query failed:', verifyError);
      console.error('Verification error code:', verifyError.code);
      console.error('Verification error message:', verifyError.message);
    } else if (verifyData) {
      console.log('✅ Verified essay exists in database:', { 
        id: verifyData.id, 
        user_id: verifyData.user_id,
        prompt: verifyData.prompt?.substring(0, 30) + '...' 
      });
    } else {
      console.warn('⚠️ Essay not found in verification query - might be RLS issue');
    }

    return data;
  } catch (err) {
    console.error('❌ Exception in upsertEssay:', err);
    console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
    throw err;
  }
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
  const { data, error } = await supabase
    .from('activities')
    .upsert(payload, { onConflict: 'id' })
    .select();
  if (error) {
    console.error('❌ Error upserting activity:', error);
    throw error;
  }
  console.log('✅ Activity saved to database:', { id: activity.id, name: activity.name });
  return data;
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
  const { data, error } = await supabase
    .from('honors')
    .upsert(payload, { onConflict: 'id' })
    .select();
  if (error) {
    console.error('❌ Error upserting honor:', error);
    throw error;
  }
  console.log('✅ Honor saved to database:', { id: honor.id, name: honor.name });
  return data;
}

export async function deleteHonor(id: string) {
  const { error } = await supabase.from('honors').delete().eq('id', id);
  if (error) throw error;
}
