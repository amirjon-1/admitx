// ============ USER & AUTH ============
export interface User {
  id: string;
  email: string;
  username: string;
  credits: number;
  createdAt: Date;
}

// ============ STUDENT PROFILE ============
export interface StudentProfile {
  id: string;
  userId: string;
  gpa: number | null;
  satScore: number | null;
  actScore: number | null;
  apCount: number | null;
  intendedMajor: string | null;
  state: string | null;
  isFirstGen: boolean;
  essayAuthenticityScore: number | null;
  createdAt: Date;
}

// ============ ANONYMOUS BETTING PROFILE ============
export interface AnonymousProfile {
  id: string; // e.g., "A7B2"
  userId: string;
  gpa: number;
  testScore: number;
  testType: 'SAT' | 'ACT';
  apCount: number;
  ecSummary: ECItem[];
  demographics: Demographics;
  essayScore: number;
  isPublic: boolean;
  createdAt: Date;
}

export interface ECItem {
  category: string;
  tier: 'International' | 'National' | 'Regional' | 'State' | 'School';
  leadership: boolean;
}

export interface Demographics {
  state: string;
  firstGen: boolean;
  urm: boolean;
}

// ============ COLLEGES ============
export interface College {
  id: string;
  userId: string;
  name: string;
  deadline: Date | null;
  decisionType: 'ED' | 'ED2' | 'EA' | 'REA' | 'RD';
  applicationType: string;
  status: CollegeStatus;
  result: CollegeResult | null;
  createdAt: Date;
}

export type CollegeStatus = 'not_started' | 'in_progress' | 'submitted' | 'decided';
export type CollegeResult = 'accepted' | 'rejected' | 'waitlisted' | 'deferred';

// ============ REQUIREMENTS ============
export interface Requirement {
  id: string;
  collegeId: string;
  requirementType: RequirementType;
  name: string;
  description: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
}

export type RequirementType =
  | 'essay'
  | 'test_scores'
  | 'transcript'
  | 'rec_letter'
  | 'portfolio'
  | 'interview'
  | 'other';

// ============ ESSAYS ============
export interface Essay {
  id: string;
  userId: string;
  collegeId: string | null;
  prompt: string;
  draft: string;
  version: number;
  authenticityScore: number | null;
  wordCount: number;
  lastFeedbackAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EssayFeedback {
  id: string;
  essayId: string;
  agentType: AgentType;
  feedbackText: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
  createdAt: Date;
}

export type AgentType =
  | 'story'
  | 'admissions'
  | 'technical'
  | 'authenticity'
  | 'synthesis';

// ============ VOICE INTERVIEWS ============
export interface VoiceInterview {
  id: string;
  userId: string;
  audioUrl: string;
  transcript: string;
  durationSeconds: number;
  storyThreads: StoryThread[];
  createdAt: Date;
}

export interface StoryThread {
  id: string;
  title: string;
  narrative: string;
  keyMoment: string;
  traits: string[];
  themes: string[];
  quotes: string[];
}

// ============ ACTIVITIES ============
export interface Activity {
  id: string;
  userId: string;
  category: ActivityCategory;
  name: string;
  role: string;
  description: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  yearsParticipated: number;
  leadershipPosition: boolean;
  tier: 'International' | 'National' | 'Regional' | 'State' | 'School';
  photoUrl: string | null;
  photoAnalysis: PhotoAnalysis | null;
  createdAt: Date;
}

export type ActivityCategory =
  | 'STEM'
  | 'Arts'
  | 'Service'
  | 'Sports'
  | 'Leadership'
  | 'Work'
  | 'Other';

export interface PhotoAnalysis {
  description: string;
  skills: string[];
  suggestions: string[];
}

// ============ HONORS ============
export interface Honor {
  id: string;
  userId: string;
  name: string;
  level: 'International' | 'National' | 'State' | 'Regional' | 'School';
  description: string | null;
  gradeReceived: '9' | '10' | '11' | '12';
  createdAt: Date;
}

// ============ PREDICTION MARKETS ============
export interface AdmissionsMarket {
  id: string;
  applicantProfileId: string;
  schoolName: string;
  decisionType: 'EA' | 'ED' | 'ED2' | 'REA' | 'RD';
  decisionDate: Date;
  currentOddsYes: number;
  currentOddsNo: number;
  totalVolume: number;
  uniqueParticipants: number;
  status: MarketStatus;
  actualResult: 'accepted' | 'rejected' | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  applicantProfile?: AnonymousProfile;
}

export type MarketStatus = 'open' | 'closed' | 'resolved';

export interface Bet {
  id: string;
  marketId: string;
  userId: string;
  prediction: 'yes' | 'no';
  amount: number;
  oddsAtBet: number;
  payout: number;
  createdAt: Date;
}

export interface MarketActivity {
  id: string;
  marketId: string;
  userId: string;
  actionType: 'bet_placed' | 'odds_updated' | 'market_closed' | 'market_resolved';
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface UserStats {
  userId: string;
  totalBets: number;
  correctPredictions: number;
  accuracyRate: number;
  totalCreditsWon: number;
  totalCreditsLost: number;
  rank: number;
  updatedAt: Date;
}

export interface MarketInsight {
  id: string;
  insightType: string;
  schoolName: string;
  data: {
    stat: string;
    oddsDelta: string;
  };
  sampleSize: number;
  confidence: number;
  createdAt: Date;
}

// ============ API RESPONSES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
