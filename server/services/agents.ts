import Groq from "groq-sdk";

let groq: Groq | null = null;

// -------------------- Groq init --------------------
export function initializeGroq() {
  console.log(
    "Initializing Groq with API key:",
    process.env.GROQ_API_KEY
      ? `${process.env.GROQ_API_KEY.substring(0, 10)}...`
      : "NOT SET"
  );

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }

  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log("✅ Groq instance created and configured");
}

export async function verifyGroqConnection(): Promise<boolean> {
  try {
    if (!groq) {
      console.error("❌ Groq instance not initialized");
      return false;
    }

    console.log("Testing Groq connection...");
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 10,
    });

    console.log("✅ Test API call succeeded");
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("❌ Groq connection test failed:", msg);
    return false;
  }
}

// -------------------- Prompts --------------------
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

  // ✅ JSON-only activities generator
  activities: `You generate a Common App Activities List from interview notes.

OUTPUT RULES (MUST FOLLOW):
- Return VALID JSON ONLY. No markdown. No explanation. No extra keys.
- Return exactly this shape:
{
  "activities": [
    {
      "position_title": "",
      "organization": "",
      "description": "",
      "years": "",
      "hours_per_week": 0,
      "weeks_per_year": 0
    }
  ]
}

CONSTRAINTS:
- position_title <= 50 chars
- organization <= 50 chars
- description <= 150 chars (action + impact, no fluff)
- years format: "9-11" or "11"
- hours_per_week: number
- weeks_per_year: number
- Max 10 activities
- Do NOT invent awards/results. If missing numbers, use conservative reasonable estimates.`,
};

export type AgentType = keyof typeof AGENT_PROMPTS;

export interface AgentFeedback {
  type: string;
  feedback: string;
  score?: number;
}

// -------------------- Groq call helper --------------------
async function callGroq(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  if (!groq) {
    throw new Error("Groq client not initialized. Check GROQ_API_KEY in .env");
  }

  const resp = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  const text = resp.choices[0]?.message?.content ?? "";
  return text.trim();
}

// -------------------- Single agent (always returns string) --------------------
export async function runAgent(
  agentType: AgentType,
  input: string,
  additionalContext?: string
): Promise<string> {
  console.log(`Running ${agentType} agent...`);

  const systemPrompt = AGENT_PROMPTS[agentType];
  const isJsonOnly = agentType === "activities";

  let userContent = isJsonOnly ? input : `Analyze this college essay:\n\n${input}`;

  if (additionalContext) {
    userContent += `\n\nAdditional context:\n${additionalContext}`;
  }

  return await callGroq(systemPrompt, userContent);
}

// -------------------- Multi-agent orchestrator --------------------
export async function runMultiAgentAnalysis(
  input: string
): Promise<{
  story: AgentFeedback;
  admissions: AgentFeedback;
  technical: AgentFeedback;
  authenticity: AgentFeedback;
  synthesis: AgentFeedback;
}> {
  const [storyText, admissionsText, technicalText, authenticityText] =
    await Promise.all([
      runAgent("story", input),
      runAgent("admissions", input),
      runAgent("technical", input),
      runAgent("authenticity", input),
    ]);

  const story: AgentFeedback = { type: "story", feedback: storyText };
  const admissions: AgentFeedback = { type: "admissions", feedback: admissionsText };
  const technical: AgentFeedback = { type: "technical", feedback: technicalText };

  // Extract score for authenticity
  let score = 75;
  const m = authenticityText.match(
    /(?:Authenticity\s*Score|Score)[:\s]*(\d{1,3})(?:\/100)?/i
  );
  if (m) score = Math.min(100, Math.max(1, parseInt(m[1], 10)));

  const authenticity: AgentFeedback = {
    type: "authenticity",
    feedback: authenticityText,
    score,
  };

  const synthesisContext = `
Story Agent Feedback:
${story.feedback}

Admissions Agent Feedback:
${admissions.feedback}

Technical Agent Feedback:
${technical.feedback}

Authenticity Agent Feedback:
${authenticity.feedback}
`.trim();

  const synthesisText = await runAgent("synthesis", input, synthesisContext);
  const synthesis: AgentFeedback = { type: "synthesis", feedback: synthesisText };

  return { story, admissions, technical, authenticity, synthesis };
}

// -------------------- Story thread extraction --------------------
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
  const systemPrompt = `You are an expert at extracting meaningful personal stories from interview transcripts for college essays.
Identify distinct story threads that could become compelling college essays.`;

  const userContent = `Analyze this interview transcript and extract meaningful personal stories.

Transcript:
${transcript}

Return JSON only:
{
  "threads": [
    {
      "id": "1",
      "title": "...",
      "narrative": "...",
      "keyMoment": "...",
      "traits": ["..."],
      "themes": ["..."],
      "quotes": ["..."]
    }
  ]
}`.trim();

  const text = await callGroq(systemPrompt, userContent);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return { threads: [] };
}

// -------------------- Odds calculator --------------------
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
    const systemPrompt = `You predict college admission outcomes based on student profiles.`;

    const userContent = `Estimate admission probability for ${schoolName}.

GPA: ${profile.gpa}
Test: ${profile.testScore} (${profile.testType})
AP count: ${profile.apCount}
ECs: ${JSON.stringify(profile.ecSummary)}
Essay Score: ${profile.essayScore}/100
State: ${profile.demographics.state}
First-Gen: ${profile.demographics.firstGen}
URM: ${profile.demographics.urm}

Return ONLY a number 1-100. No explanation.`.trim();

    const text = await callGroq(systemPrompt, userContent);
    const match = text.match(/\d+/);
    return match ? Math.min(100, Math.max(1, parseInt(match[0], 10))) : 50;
  } catch (error) {
    console.error("Error calculating initial odds:", error);
    return 50;
  }
}
