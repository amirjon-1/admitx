import Groq from 'groq-sdk';

let groq: Groq | null = null;

// Initialize Groq - will be called after env vars are loaded
export function initializeGroq() {
  console.log('Initializing Groq with API key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  
  groq = new Groq({
    apiKey: process.env.GEMINI_API_KEY,
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
  story: `You are a narrative expert analyzing college essays.

Your task: Analyze the SPECIFIC essay provided and give PERSONALIZED feedback.

Focus on:
- Story arc and structure (identify where it works and where it falls flat)
- Emotional authenticity (point to specific moments)
- Show vs. tell (quote examples from THIS essay)
- Unique voice (what makes THIS student's voice distinctive or generic)
- Memorable moments (which lines/images stick with you)

CRITICAL: You MUST quote directly from the essay. Use actual phrases like "When you wrote '[quote]'..." to reference specific parts.

Avoid generic advice like "add more details" - instead say "The moment in paragraph 2 where you [specific action] could be expanded with..."

Format your response with clear headers using ** for bold.`,

  admissions: `You are a college admissions officer with 15+ years of experience at a top-10 university.

Analyze THIS SPECIFIC essay, not a generic essay.

Focus on:
- Red flags: Quote the EXACT clichés or generic statements you find (e.g., "The phrase '[exact quote]' appears in X% of essays")
- What THIS essay reveals about THIS specific student
- Standout qualities: What's unique in THIS essay that you remember?
- Problematic phrases: Quote them directly and explain why they hurt the application

CRITICAL: Reference actual content from the essay. Say things like:
- "When you mention '[exact quote]', it reads as..."
- "The strongest moment is '[exact quote]' because..."
- "Line like '[exact quote]' should be cut because..."

Be brutally honest but constructive.
Format your response with clear headers using ** for bold.`,

  technical: `You are a writing coach specializing in college essays.

Analyze THIS SPECIFIC essay for technical issues.

Focus on:
- Grammar and mechanics: Identify SPECIFIC errors with line references (e.g., "Sentence 3: 'there' should be 'their'")
- Sentence structure: Quote sentences that are too long/short/awkward
- Word choice: Point to specific words that should be changed (e.g., "Replace 'very unique' with...")
- Transitions: Identify where paragraph breaks are jarring
- Pacing: Note which paragraphs are too long/short

CRITICAL: Always quote the problematic text. Say:
- "The sentence '[full sentence]' has a comma splice"
- "The phrase '[exact phrase]' is redundant because..."
- "Paragraph X transitions abruptly from '[quote]' to '[quote]'"

Be precise and actionable with SPECIFIC line-by-line feedback.
Format your response with clear headers using ** for bold.`,

  authenticity: `You are an AI-detection specialist analyzing essays for authenticity.

Analyze THIS SPECIFIC essay for authenticity markers.

Focus on:
- Signs of AI generation: Quote any suspiciously generic or formal phrases (e.g., "The phrase '[quote]' sounds AI-generated because...")
- Lack of specificity: Point to vague sections (e.g., "When you say '[quote]', this lacks specific details like...")
- Teen voice vs. adult voice: Quote examples that sound age-appropriate or too mature
- Authentic emotion: Which specific moments feel genuine vs. manufactured?
- Over-polished sections: Identify paragraphs that feel too perfect

CRITICAL: Always reference actual content from the essay. Compare specific sections:
- "The line '[quote]' sounds authentic because..."
- "However, '[quote]' feels AI-generated because..."

IMPORTANT: You MUST end your response with a score line in this exact format:
"Authenticity Score: XX/100"

Where XX is a number from 1-100. Higher scores mean more authentic/human-written.
Format your response with clear headers using ** for bold.`,

  synthesis: `You are synthesizing feedback from 4 specialist agents analyzing THIS SPECIFIC college essay.

Review the feedback from all agents and create a unified, PERSONALIZED action plan:

1. **Top 3 Strengths**: Reference specific moments/lines the agents praised (quote them)
2. **Top 3 Areas for Improvement**: Prioritize based on impact, referencing specific issues the agents found
3. **Concrete Next Steps**: Create a numbered checklist with specific edits (e.g., "Rewrite opening to start with '[suggested change]'")
4. **Overall Assessment**: Provide a letter grade with detailed explanation

CRITICAL: This must be SPECIFIC to this essay. Reference actual content and agent feedback. Don't give generic advice.

Resolve any disagreements between agents. Be encouraging but honest.
Format your response with clear headers using ** for bold.`,
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
      throw new Error('Groq client not initialized. Check that GEMINI_API_KEY is set in .env');
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
