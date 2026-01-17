-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ USERS & AUTH ============
-- Note: Supabase Auth handles the auth.users table
-- This is for additional user data

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  credits INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============ STUDENT PROFILES ============
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  gpa DECIMAL(3, 2),
  sat_score INTEGER CHECK (sat_score >= 400 AND sat_score <= 1600),
  act_score INTEGER CHECK (act_score >= 1 AND act_score <= 36),
  ap_count INTEGER DEFAULT 0,
  intended_major TEXT,
  state TEXT,
  is_first_gen BOOLEAN DEFAULT FALSE,
  essay_authenticity_score INTEGER CHECK (essay_authenticity_score >= 0 AND essay_authenticity_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own profile" ON public.student_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ============ ANONYMOUS BETTING PROFILES ============
CREATE TABLE public.anonymous_profiles (
  id TEXT PRIMARY KEY, -- e.g., "A7B2"
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  gpa DECIMAL(3, 2) NOT NULL,
  test_score INTEGER NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('SAT', 'ACT')),
  ap_count INTEGER DEFAULT 0,
  ec_summary JSONB DEFAULT '[]'::jsonb,
  demographics JSONB DEFAULT '{}'::jsonb,
  essay_score INTEGER CHECK (essay_score >= 0 AND essay_score <= 100),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.anonymous_profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles are readable by all
CREATE POLICY "Public profiles are readable" ON public.anonymous_profiles
  FOR SELECT USING (is_public = TRUE);

-- Users can manage own profiles
CREATE POLICY "Users can manage own profiles" ON public.anonymous_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_anonymous_profiles_public ON public.anonymous_profiles(is_public);

-- ============ COLLEGES ============
CREATE TABLE public.colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  deadline DATE,
  decision_type TEXT CHECK (decision_type IN ('ED', 'ED2', 'EA', 'REA', 'RD')),
  application_type TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'decided')),
  result TEXT CHECK (result IN ('accepted', 'rejected', 'waitlisted', 'deferred')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own colleges" ON public.colleges
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_colleges_user ON public.colleges(user_id);
CREATE INDEX idx_colleges_deadline ON public.colleges(deadline);

-- ============ COLLEGE REQUIREMENTS ============
CREATE TABLE public.college_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE NOT NULL,
  requirement_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.college_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own requirements" ON public.college_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.colleges c
      WHERE c.id = college_id AND c.user_id = auth.uid()
    )
  );

-- ============ ESSAYS ============
CREATE TABLE public.essays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  draft TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  authenticity_score INTEGER CHECK (authenticity_score >= 0 AND authenticity_score <= 100),
  word_count INTEGER DEFAULT 0,
  last_feedback_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own essays" ON public.essays
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_essays_user ON public.essays(user_id);

-- ============ ESSAY FEEDBACK ============
CREATE TABLE public.essay_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID REFERENCES public.essays(id) ON DELETE CASCADE NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('story', 'admissions', 'technical', 'authenticity', 'synthesis')),
  feedback_text TEXT NOT NULL,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.essay_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback" ON public.essay_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.essays e
      WHERE e.id = essay_id AND e.user_id = auth.uid()
    )
  );

-- ============ VOICE INTERVIEWS ============
CREATE TABLE public.voice_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER DEFAULT 0,
  story_threads JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.voice_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own interviews" ON public.voice_interviews
  FOR ALL USING (auth.uid() = user_id);

-- ============ ACTIVITIES ============
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  description TEXT,
  hours_per_week INTEGER DEFAULT 0,
  weeks_per_year INTEGER DEFAULT 0,
  years_participated INTEGER DEFAULT 0,
  leadership_position BOOLEAN DEFAULT FALSE,
  tier TEXT CHECK (tier IN ('International', 'National', 'Regional', 'State', 'School')),
  photo_url TEXT,
  photo_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own activities" ON public.activities
  FOR ALL USING (auth.uid() = user_id);

-- ============ HONORS ============
CREATE TABLE public.honors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('International', 'National', 'State', 'Regional', 'School')),
  description TEXT,
  grade_received TEXT CHECK (grade_received IN ('9', '10', '11', '12')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.honors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own honors" ON public.honors
  FOR ALL USING (auth.uid() = user_id);

-- ============ PREDICTION MARKETS ============
CREATE TABLE public.admissions_markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_profile_id TEXT REFERENCES public.anonymous_profiles(id) ON DELETE CASCADE NOT NULL,
  school_name TEXT NOT NULL,
  decision_type TEXT CHECK (decision_type IN ('EA', 'ED', 'ED2', 'REA', 'RD')),
  decision_date DATE,

  -- Market state
  current_odds_yes DECIMAL(5, 2) DEFAULT 50.00,
  current_odds_no DECIMAL(5, 2) DEFAULT 50.00,
  total_volume INTEGER DEFAULT 0,
  unique_participants INTEGER DEFAULT 0,

  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  actual_result TEXT CHECK (actual_result IN ('accepted', 'rejected')),
  resolved_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admissions_markets ENABLE ROW LEVEL SECURITY;

-- All can read open markets
CREATE POLICY "Markets are readable" ON public.admissions_markets
  FOR SELECT USING (TRUE);

-- Only admins can modify markets (via service role)
CREATE POLICY "Service can modify markets" ON public.admissions_markets
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_markets_status ON public.admissions_markets(status);
CREATE INDEX idx_markets_school ON public.admissions_markets(school_name);

-- ============ BETS ============
CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID REFERENCES public.admissions_markets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  prediction TEXT NOT NULL CHECK (prediction IN ('yes', 'no')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  odds_at_bet DECIMAL(5, 2) NOT NULL,

  payout INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- Users can read own bets
CREATE POLICY "Users can read own bets" ON public.bets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert bets
CREATE POLICY "Users can place bets" ON public.bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bets_market ON public.bets(market_id);
CREATE INDEX idx_bets_user ON public.bets(user_id);

-- ============ MARKET ACTIVITY ============
CREATE TABLE public.market_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID REFERENCES public.admissions_markets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.market_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity is readable" ON public.market_activity
  FOR SELECT USING (TRUE);

CREATE INDEX idx_activity_market_time ON public.market_activity(market_id, created_at DESC);

-- ============ USER STATS ============
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_bets INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5, 4) DEFAULT 0.0000,
  total_credits_won INTEGER DEFAULT 0,
  total_credits_lost INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stats are readable" ON public.user_stats
  FOR SELECT USING (TRUE);

-- ============ MARKET INSIGHTS ============
CREATE TABLE public.market_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL,
  school_name TEXT,
  data JSONB NOT NULL,
  sample_size INTEGER DEFAULT 0,
  confidence DECIMAL(5, 4) DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insights are readable" ON public.market_insights
  FOR SELECT USING (TRUE);

CREATE INDEX idx_insights_type ON public.market_insights(insight_type);
CREATE INDEX idx_insights_school ON public.market_insights(school_name);

-- ============ FUNCTIONS ============

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, credits)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    1000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update market odds after bet
CREATE OR REPLACE FUNCTION public.update_market_odds()
RETURNS TRIGGER AS $$
DECLARE
  market_record RECORD;
  weight DECIMAL;
  shift DECIMAL;
  new_yes DECIMAL;
  new_no DECIMAL;
BEGIN
  -- Get current market state
  SELECT * INTO market_record FROM public.admissions_markets WHERE id = NEW.market_id;

  -- Calculate odds shift
  weight := NEW.amount::DECIMAL / (market_record.total_volume + NEW.amount)::DECIMAL;
  shift := weight * 10; -- Max 10 point shift per bet

  IF NEW.prediction = 'yes' THEN
    new_yes := LEAST(95, market_record.current_odds_yes + shift);
    new_no := GREATEST(5, market_record.current_odds_no - shift);
  ELSE
    new_yes := GREATEST(5, market_record.current_odds_yes - shift);
    new_no := LEAST(95, market_record.current_odds_no + shift);
  END IF;

  -- Update market
  UPDATE public.admissions_markets
  SET
    current_odds_yes = new_yes,
    current_odds_no = new_no,
    total_volume = total_volume + NEW.amount,
    unique_participants = (
      SELECT COUNT(DISTINCT user_id) FROM public.bets WHERE market_id = NEW.market_id
    ),
    updated_at = NOW()
  WHERE id = NEW.market_id;

  -- Deduct credits from user
  UPDATE public.users
  SET credits = credits - NEW.amount
  WHERE id = NEW.user_id;

  -- Log activity
  INSERT INTO public.market_activity (market_id, user_id, action_type, data)
  VALUES (
    NEW.market_id,
    NEW.user_id,
    'bet_placed',
    jsonb_build_object(
      'prediction', NEW.prediction,
      'amount', NEW.amount,
      'odds', NEW.odds_at_bet
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for bet placement
CREATE TRIGGER on_bet_placed
  AFTER INSERT ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.update_market_odds();
