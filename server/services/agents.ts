import Groq from 'groq-sdk';

let groq: Groq | null = null;

// Initialize Groq - will be called after env vars are loaded
export function initializeGroq() {
  console.log('Initializing Groq with API key:', process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0, 10)}...` : 'NOT SET');

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  console.log('✅ Groq instance created and configured');
}

export async function verifyGroqConnection(): Promise<boolean> {
  try {
    if (!groq) {
      console.error('❌ Groq instance not initialized');
      return false;
    }
    // Make a simple test call
    console.log('Testing Groq connection...');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{role: 'user', content: 'test'}],
      max_tokens: 10,
    });
    console.log('✅ Test API call succeeded, received response');
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Groq connection test failed:', msg);
    return false;
  }
}
const AGENT_PROMPTS = {
  story: `Analyze THIS essay's narrative. Be DIRECT and CONCISE.

Quick assessment:
- Story strength: Does it have a clear arc? Quote one strong moment.
- Voice: Does it sound like YOU or generic?
- Key issue: One main weakness to fix.

Keep it brief. Use bullet points. No lengthy paragraphs.`,

  admissions: `You're an admissions officer. Give DIRECT feedback on THIS essay.

Quick hit list:
- 1 red flag (cliché or weak spot)
- 1 standout strength
- 1 problem to fix

Quote directly. Stay brief. No fluff.`,

  technical: `Quick grammar and style check on THIS essay.

Just list:
- Top 3 grammar/spelling errors (quote them)
- 1 awkward sentence to rewrite
- 1 word choice improvement

Bullet points only. No explanations.`,

  authenticity: `Does THIS essay sound like a real student? Quick verdict.

- Authenticity level: Sounds like a human? Yes/No/Mostly
- 1 authentic moment (quote it)
- 1 flag if any (if none, say "None")

IMPORTANT: End with "Authenticity Score: XX/100"

Keep it SHORT.`,

  synthesis: `Summarize feedback in 3 actionable steps. One sentence each.

1. **Top fix**: [Most important change]
2. **Add**: [One thing to expand]
3. **Remove**: [One thing to cut or avoid]

That's it. Direct and done.`,
};

export interface AgentFeedback {
  type: string;
  feedback: string;
  score?: number;
}

async function callGroq(systemPrompt: string, userContent: string): Promise<string> {
  console.log('🔍 callGroq called');
  console.log('groq instance exists:', !!groq);
  console.log('groq type:', groq?.constructor?.name);
  
  try {
    if (!groq) {
      throw new Error('Groq client not initialized. Check that GROQ_API_KEY is set in .env');
    }
    
    const prompt = `${systemPrompt}\n\n---\n\nUser Input:\n${userContent}`;
    
    console.log('📤 Calling Groq API with model: llama-3.3-70b-versatile');
    const message = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
    });
    
    const text = message.choices[0]?.message?.content || '';
    console.log('✅ Groq response received, length:', text.length);
    return text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Groq API error:', errorMsg);
    if (error instanceof Error && 'status' in error) {
      console.error('HTTP Status:', (error as any).status);
    }
    throw new Error(`Groq API failed: ${errorMsg}`);
  }
}

export async function runAgent(
  agentType: keyof typeof AGENT_PROMPTS,
  essay: string,
  additionalContext?: string
): Promise<AgentFeedback> {
  try {
    console.log(`Running ${agentType} agent...`);
    const systemPrompt = AGENT_PROMPTS[agentType];

    let userContent = `Analyze this college essay:\n\n${essay}`;
    if (additionalContext) {
      userContent += `\n\nAdditional context:\n${additionalContext}`;
    }

    const feedbackText = await callGroq(systemPrompt, userContent);

    // Extract score for authenticity agent
    let score: number | undefined;
    if (agentType === 'authenticity') {
      const scoreMatch = feedbackText.match(/(?:Authenticity\s*Score|Score)[:\s]*(\d{1,3})(?:\/100)?/i);
      if (scoreMatch) {
        score = Math.min(100, Math.max(1, parseInt(scoreMatch[1])));
      } else {
        // Default score if not found
        score = 75;
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
    const systemPrompt = `You are an expert at extracting meaningful personal stories from interview transcripts for college essays.
Your job is to identify distinct story threads that could become compelling college essays.`;

    const userContent = `Analyze this interview transcript and extract meaningful personal stories.

Transcript:
${transcript}

For each story, identify:
1. A compelling title
2. The core narrative (2-3 sentences)
3. Key moment/turning point
4. Character traits revealed
5. Potential essay themes
6. Memorable quotes (verbatim from transcript)

Return as JSON only (no markdown code blocks):
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
}`;

    const text = await callGroq(systemPrompt, userContent);

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
    const systemPrompt = `You are an expert at predicting college admission outcomes based on student profiles.`;

    const userContent = `Estimate the admission probability for this profile to ${schoolName}:

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

Return ONLY a number 1-100 representing probability. No explanation.`;

    const text = await callGroq(systemPrompt, userContent);
    const match = text.match(/\d+/);
    return match ? Math.min(100, Math.max(1, parseInt(match[0]))) : 50;
  } catch (error) {
    console.error('Error calculating initial odds:', error);
    return 50; // Default to 50% on error
  }
}
