// Get API base URL - add /api if it's a full URL, otherwise use relative path
const getApiBase = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    // No API URL set - use relative path (for Vercel serverless functions)
    return '/api';
  }
  if (apiUrl.startsWith('http')) {
    // Full URL - ensure it ends with /api
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  }
  // Relative path - ensure it starts with /
  return apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`;
};

const API_BASE = getApiBase();

export interface AgentFeedback {
  type: string;
  feedback: string;
  score?: number;
}

export interface MultiAgentResponse {
  story: AgentFeedback;
  admissions: AgentFeedback;
  technical: AgentFeedback;
  authenticity: AgentFeedback;
  synthesis: AgentFeedback;
}

// Essay Analysis
export async function analyzeEssay(essay: string): Promise<MultiAgentResponse> {
  const response = await fetch(`${API_BASE}/agents/orchestrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ essay }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze essay');
  }

  return response.json();
}

export async function analyzeWithSingleAgent(
  agentType: 'story' | 'admissions' | 'technical' | 'authenticity',
  essay: string
): Promise<AgentFeedback> {
  const response = await fetch(`${API_BASE}/agents/${agentType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ essay }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get ${agentType} feedback`);
  }

  return response.json();
}

// Story Extraction
export async function extractStories(transcript: string): Promise<{
  threads: Array<{
    id: string;
    title: string;
    narrative: string;
    keyMoment: string;
    traits: string[];
    themes: string[];
    quotes: string[];
  }>;
}> {
  const response = await fetch(`${API_BASE}/agents/extract-stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    throw new Error('Failed to extract stories');
  }

  return response.json();
}

// Odds Calculation
export async function calculateOdds(
  profile: {
    gpa: number;
    testScore: number;
    testType: string;
    apCount: number;
    ecSummary: Array<{ category: string; tier: string; leadership: boolean }>;
    demographics: { state: string; firstGen: boolean; urm: boolean };
    essayScore: number;
  },
  schoolName: string
): Promise<{ odds: number }> {
  const response = await fetch(`${API_BASE}/agents/calculate-odds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, schoolName }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate odds');
  }

  return response.json();
}

// Health check
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
