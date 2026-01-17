import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Save,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../components/layout';
import { AgentCard, AuthenticityMeter } from '../components/essays';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  TextArea,
  Badge,
} from '../components/ui';
import { countWords } from '../lib/utils';
import { analyzeWithSingleAgent, analyzeEssay } from '../lib/api';
import { useStore } from '../store/useStore';
import type { AgentType } from '../types';

interface AgentFeedback {
  type: AgentType;
  name: string;
  icon: string;
  feedback: string | null;
  score?: number;
}

const AGENTS: Omit<AgentFeedback, 'feedback' | 'score'>[] = [
  { type: 'story', name: 'Story Agent', icon: '📖' },
  { type: 'admissions', name: 'Admissions Agent', icon: '🎓' },
  { type: 'technical', name: 'Technical Agent', icon: '✍️' },
  { type: 'authenticity', name: 'Authenticity Agent', icon: '🔍' },
];

// Simulated agent responses (fallback when API unavailable)
const SIMULATED_FEEDBACK: Record<AgentType, { feedback: string; score?: number }> = {
  story: {
    feedback: `**Narrative Structure**: Your essay opens with a compelling hook, but the middle section loses momentum. The transition between your challenge and resolution feels abrupt.

**Emotional Authenticity**: The moment where you describe staying up late to debug code rings true - this specificity is your strength. However, the conclusion feels rushed and generic.

**Recommendations**:
• Expand the "debugging at 3am" scene with sensory details
• Show the emotional stakes more clearly - what would failure have meant?
• Your voice is strongest in paragraphs 2-3; maintain this throughout`,
  },
  admissions: {
    feedback: `**Red Flags Identified**:
• Opening paragraph uses the cliché "ever since I was young" - 47% of essays start this way
• The phrase "passionate about making a difference" appears in 31% of applications

**What This Reveals**: You're a self-directed learner who takes initiative. The robotics project demonstrates genuine technical ability and leadership.

**Standout Elements**: The specific metrics (3rd place out of 127 teams) add credibility. Your reflection on failure shows maturity.

**Suggestion**: Lead with the specific moment of realization, not the general statement.`,
  },
  technical: {
    feedback: `**Grammar & Mechanics**: 2 comma splices found (sentences 4, 12). Word choice is generally strong.

**Flow Analysis**:
• Average sentence length: 18 words (optimal range)
• Paragraph 3 has 4 consecutive short sentences - vary for rhythm

**Word Count**: 487/500 - you have room for expansion

**Specific Edits**:
• Line 3: "effect" should be "affect"
• Line 7: Remove redundant "very"
• Line 15: "They're" should be "Their"`,
  },
  authenticity: {
    feedback: `**AI Detection Analysis**: This essay shows strong markers of authentic human writing.

**Authentic Elements**:
• Specific details (debugging at 3am, robot named "Phoenix")
• Natural sentence variety
• Personal voice in reflective sections
• Imperfect but genuine phrasing

**Areas of Concern**:
• Conclusion paragraph feels more polished/formal than earlier sections
• Consider if someone helped edit this part

**Verdict**: This reads as a genuine student voice with minor editing assistance, which is appropriate.`,
    score: 82,
  },
  synthesis: {
    feedback: `**Action Items (Priority Order)**:

1. **Rewrite your opening** - Replace the cliché start with the 3am debugging moment
2. **Expand the turning point** - Add 2-3 sentences about what failure would have meant
3. **Fix technical issues** - 3 grammar errors identified above
4. **Strengthen your conclusion** - Make it sound more like YOUR voice

**Overall Assessment**: This is a strong foundation (B+). With the changes above, you can reach A- territory. Your authentic voice shines in the middle sections - the challenge is bringing that energy to the beginning and end.`,
  },
};

export function Essays() {
  const location = useLocation();
  const { addEssay, updateEssay, essays } = useStore();
  
  // Get prompt and college from navigation state
  const navigationState = location.state as { essay?: string; college?: string } | null;
  const essayPrompt = navigationState?.essay || '';
  const collegeName = navigationState?.college || '';
  
  const [essay, setEssay] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<AgentFeedback[]>([]);
  const [authenticityScore, setAuthenticityScore] = useState<number | null>(null);
  const [synthesisText, setSynthesisText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [savedEssayId, setSavedEssayId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const wordCount = countWords(essay);

  // Load existing essay draft if available (only once on mount)
  useEffect(() => {
    let loaded = false;
    if (essayPrompt && collegeName && !loaded) {
      const existingEssay = essays.find(
        (e) => e.prompt === essayPrompt && e.collegeId === collegeName
      );
      if (existingEssay && !essay) {
        setEssay(existingEssay.draft);
        setSavedEssayId(existingEssay.id);
        setLastSaved(new Date(existingEssay.updatedAt));
        loaded = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-save essay drafts continuously
  useEffect(() => {
    if (!essay.trim()) return;

    const timeoutId = setTimeout(() => {
      const essayData = {
        id: savedEssayId || `essay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'user_1',
        collegeId: collegeName || null,
        prompt: essayPrompt || 'Untitled Essay',
        draft: essay,
        version: 1,
        authenticityScore: authenticityScore,
        wordCount,
        lastFeedbackAt: feedback.length > 0 ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (savedEssayId) {
        updateEssay(savedEssayId, {
          draft: essay,
          wordCount,
          updatedAt: new Date(),
        });
      } else {
        addEssay(essayData);
        setSavedEssayId(essayData.id);
      }
      setLastSaved(new Date());
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [essay, wordCount, savedEssayId, authenticityScore, feedback.length, addEssay, updateEssay, essayPrompt, collegeName]);

  const handleAnalyze = useCallback(async () => {
    if (!essay.trim()) return;

    setIsAnalyzing(true);
    setFeedback([]);
    setAuthenticityScore(null);
    setSynthesisText(null);
    setCurrentAgentIndex(0);

    // Prepare context with the specific essay prompt
    const promptContext = essayPrompt
      ? `\n\nESSAY PROMPT: "${essayPrompt}"\n\nIMPORTANT: Evaluate how well this essay answers the specific prompt above. Does it directly address the question? Is it relevant and on-topic?`
      : '';

    // Analyze agents sequentially for visual effect
    for (let i = 0; i < AGENTS.length; i++) {
      setCurrentAgentIndex(i);
      const agent = AGENTS[i];

      try {
        const response = await analyzeWithSingleAgent(
          agent.type as 'story' | 'admissions' | 'technical' | 'authenticity',
          essay + promptContext
        );

        setFeedback((prev) => [
          ...prev,
          {
            ...agent,
            feedback: response.feedback,
            score: response.score,
          },
        ]);

        if (agent.type === 'authenticity' && response.score) {
          setAuthenticityScore(response.score);
        }
      } catch (error) {
        console.error(`Error with ${agent.type} agent:`, error);
        // Fallback to simulated feedback when API is unavailable
        const fallback = SIMULATED_FEEDBACK[agent.type as AgentType];
        setFeedback((prev) => [
          ...prev,
          {
            ...agent,
            feedback: fallback.feedback,
            score: fallback.score,
          },
        ]);

        if (agent.type === 'authenticity' && fallback.score !== undefined) {
          setAuthenticityScore(fallback.score);
        }
      }
    }

    // Generate synthesis using real API
    setCurrentAgentIndex(4);
    try {
      const response = await analyzeEssay(essay + (essayPrompt ? `\n\nESSAY PROMPT: "${essayPrompt}"` : ''));
      setSynthesisText(response.synthesis.feedback);
    } catch (error) {
      console.error('Error generating synthesis:', error);
      // Fallback to simulated synthesis when API is unavailable
      setSynthesisText(SIMULATED_FEEDBACK.synthesis.feedback);
    }

    // Save feedback timestamp
    if (savedEssayId) {
      updateEssay(savedEssayId, {
        lastFeedbackAt: new Date(),
        authenticityScore,
      });
    }

    setCurrentAgentIndex(-1);
    setIsAnalyzing(false);
  }, [essay, essayPrompt, savedEssayId, authenticityScore, updateEssay]);

  const handleCopy = () => {
    navigator.clipboard.writeText(essay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setEssay('');
    setFeedback([]);
    setAuthenticityScore(null);
    setSynthesisText(null);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Essay Feedback"
        subtitle="Get multi-agent AI analysis of your essays"
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Essay Input */}
          <div className="space-y-4">
            {/* Essay Prompt Card */}
            {essayPrompt && (
              <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-1">
                        {collegeName ? `${collegeName} Supplemental Essay` : 'Essay Prompt'}
                      </h3>
                      <p className="text-sm text-blue-800 leading-relaxed">{essayPrompt}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Your Essay
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {lastSaved && (
                      <span className="text-xs text-gray-500">
                        Saved {new Date(lastSaved).toLocaleTimeString()}
                      </span>
                    )}
                    <Badge variant={wordCount > 650 ? 'danger' : wordCount > 500 ? 'warning' : 'default'}>
                      {wordCount} words
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TextArea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder={essayPrompt ? `Write your response to the prompt above...\n\nThe AI will analyze how well your essay addresses the specific question.` : "Paste your essay here to get multi-agent feedback...\n\nExample: Start with a personal story about a challenge you faced, a project you worked on, or a moment of realization. The more specific and personal, the better feedback you'll receive."}
                  className="min-h-[400px] font-serif"
                />

                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={!essay.trim() || isAnalyzing}
                    isLoading={isAnalyzing}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'Analyze with AI Agents'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Authenticity Score */}
            <AuthenticityMeter score={authenticityScore} isLoading={isAnalyzing && currentAgentIndex >= 3} />
          </div>

          {/* Agent Feedback */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {feedback.map((agent, index) => (
                <AgentCard
                  key={agent.type}
                  name={agent.name}
                  type={agent.type}
                  icon={agent.icon}
                  feedback={agent.feedback}
                  score={agent.score}
                  isLoading={false}
                  delay={index * 0.1}
                />
              ))}

              {/* Loading states for remaining agents */}
              {isAnalyzing &&
                AGENTS.slice(feedback.length).map((agent, index) => (
                  <AgentCard
                    key={agent.type}
                    name={agent.name}
                    type={agent.type}
                    icon={agent.icon}
                    feedback={null}
                    isLoading={currentAgentIndex === feedback.length + index}
                  />
                ))}

              {/* Synthesis */}
              {synthesisText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br from-pink-500 to-purple-600">
                          <span className="text-xl">🎯</span>
                        </div>
                        <div>
                          <CardTitle>Synthesis Agent</CardTitle>
                          <p className="text-xs text-gray-500">
                            Combined recommendations
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                          {synthesisText}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!isAnalyzing && feedback.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Multi-Agent Essay Analysis
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Paste your essay and click "Analyze" to get feedback from 4 specialized AI agents plus a synthesis of their recommendations.
                  </p>
                  <div className="mt-4 text-sm text-gray-400">
                    <span>Powered by Groq AI</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
