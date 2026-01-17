import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Agent System Prompts
const AGENT_PROMPTS = {
  story: `You are a narrative expert analyzing college essays.
Focus on:
- Story arc and structure
- Emotional authenticity
- Show vs. tell
- Unique voice
- Memorable moments

Be specific. Quote directly from the essay. Provide actionable feedback.`,

  admissions: `You are a college admissions officer with 15+ years of experience at a top-10 university.
Focus on:
- Red flags (clichés, generic statements)
- What this reveals about the student
- Fit for competitive schools
- Standout qualities
- Common pitfalls

Be brutally honest but constructive. Identify specific phrases that are problematic.`,

  technical: `You are a writing coach specializing in college essays.
Focus on:
- Grammar and mechanics
- Sentence structure and flow
- Word choice and clarity
- Transitions
- Length/pacing

Be precise and actionable. Point to specific line numbers when possible.`,

  authenticity: `You are an AI-detection specialist analyzing essays for authenticity.
Focus on:
- Signs of AI generation (generic phrases, formal language)
- Lack of specificity or personal detail
- Teen voice vs. adult voice
- Authentic emotion vs. manufactured
- Over-polished sections

Score authenticity 1-100 and explain your reasoning. Higher scores mean more authentic/human-written.`,

  synthesis: `You are synthesizing feedback from 4 specialist agents analyzing a college essay.

Create a unified action plan:
1. Top 3 strengths (be specific)
2. Top 3 areas for improvement (prioritized)
3. Concrete next steps
4. Overall assessment (letter grade with explanation)

Resolve any disagreements between agents. Be encouraging but honest.`,
};

export interface AgentFeedback {
  type: string;
  feedback: string;
  score?: number;
}

export async function runAgent(
  agentType: keyof typeof AGENT_PROMPTS,
  essay: string,
  additionalContext?: string
): Promise<AgentFeedback> {
  try {
    const systemPrompt = AGENT_PROMPTS[agentType];

    let userContent = `Analyze this college essay:\n\n${essay}`;
    if (additionalContext) {
      userContent += `\n\nAdditional context:\n${additionalContext}`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userContent,
      }],
    });

    const feedbackText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Extract score for authenticity agent
    let score: number | undefined;
    if (agentType === 'authenticity') {
      const scoreMatch = feedbackText.match(/(\d{1,3})(?:\/100|\s*percent|\s*%)/i);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1]);
      }
    }

    return {
      type: agentType,
      feedback: feedbackText,
      score,
    };
  } catch (error) {
    console.error(`Error running ${agentType} agent:`, error);
    throw error;
  }
}

export async function runMultiAgentAnalysis(essay: string): Promise<{
  story: AgentFeedback;
  admissions: AgentFeedback;
  technical: AgentFeedback;
  authenticity: AgentFeedback;
  synthesis: AgentFeedback;
}> {
  // Run first 4 agents in parallel
  const [story, admissions, technical, authenticity] = await Promise.all([
    runAgent('story', essay),
    runAgent('admissions', essay),
    runAgent('technical', essay),
    runAgent('authenticity', essay),
  ]);

  // Prepare context for synthesis
  const synthesisContext = `
Story Agent Feedback:
${story.feedback}

Admissions Agent Feedback:
${admissions.feedback}

Technical Agent Feedback:
${technical.feedback}

Authenticity Agent Feedback:
${authenticity.feedback}
`;

  // Run synthesis agent
  const synthesis = await runAgent('synthesis', essay, synthesisContext);

  return {
    story,
    admissions,
    technical,
    authenticity,
    synthesis,
  };
}

export async function extractStoryThreads(transcript: string): Promise<{
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
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are an expert at extracting meaningful personal stories from interview transcripts for college essays.

Your job is to identify distinct story threads that could become compelling college essays.`,
      messages: [{
        role: 'user',
        content: `Analyze this interview transcript and extract meaningful personal stories.

Transcript:
${transcript}

For each story, identify:
1. A compelling title
2. The core narrative (2-3 sentences)
3. Key moment/turning point
4. Character traits revealed
5. Potential essay themes
6. Memorable quotes (verbatim from transcript)

Return as JSON:
{
  "threads": [
    {
      "id": "1",
      "title": "...",
      "narrative": "...",
      "keyMoment": "...",
      "traits": ["...", "..."],
      "themes": ["...", "..."],
      "quotes": ["...", "..."]
    }
  ]
}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { threads: [] };
  } catch (error) {
    console.error('Error extracting story threads:', error);
    throw error;
  }
}

export async function calculateInitialOdds(
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
): Promise<number> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Estimate the admission probability for this profile to ${schoolName}:

GPA: ${profile.gpa}
Test Score: ${profile.testScore} (${profile.testType})
APs: ${profile.apCount}
ECs: ${JSON.stringify(profile.ecSummary)}
Essay Score: ${profile.essayScore}/100
State: ${profile.demographics.state}
First-Gen: ${profile.demographics.firstGen}
URM: ${profile.demographics.urm}

Consider:
- School's acceptance rate and selectivity
- Profile competitiveness
- Geographic diversity
- Demographic factors
- EC strength and tier

Return ONLY a number 1-100 representing probability. No explanation.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '50';
    const match = text.match(/\d+/);
    return match ? Math.min(100, Math.max(1, parseInt(match[0]))) : 50;
  } catch (error) {
    console.error('Error calculating initial odds:', error);
    return 50; // Default to 50% on error
  }
}
