import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Edit,
  Calendar,
  GraduationCap,
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
import { countWords, formatDateShort } from '../lib/utils';
import { analyzeWithSingleAgent, analyzeEssay } from '../lib/api';
import { useStore } from '../store/useStore';
import type { AgentType, Essay } from '../types';

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

type TabType = 'new' | 'my-essays';

export function Essays() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, colleges, addEssay, updateEssay, essays, updateCollege } = useStore();
  
  // Get prompt and college from navigation state (for new essay from college page)
  const navigationState = location.state as { essay?: string; college?: string } | null;
  const initialEssayPrompt = navigationState?.essay || '';
  const initialCollegeName = navigationState?.college || '';
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(
    initialEssayPrompt ? 'new' : 'my-essays'
  );
  
  // Essay writing state
  const [essayPrompt, setEssayPrompt] = useState(initialEssayPrompt);
  const [collegeName, setCollegeName] = useState(initialCollegeName);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);
  const [essay, setEssay] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<AgentFeedback[]>([]);
  const [authenticityScore, setAuthenticityScore] = useState<number | null>(null);
  const [synthesisText, setSynthesisText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [savedEssayId, setSavedEssayId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Selected essay for editing
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);

  const wordCount = countWords(essay);
  
  // Find the college by name to get its ID
  const college = colleges.find((c) => c.name === collegeName);
  const collegeId = selectedCollegeId || college?.id || null;

  // Load selected essay for editing
  useEffect(() => {
    if (selectedEssay) {
      setEssay(selectedEssay.draft);
      setEssayPrompt(selectedEssay.prompt);
      setSavedEssayId(selectedEssay.id);
      setLastSaved(new Date(selectedEssay.updatedAt));
      setAuthenticityScore(selectedEssay.authenticityScore);
      
      // Find college name from collegeId
      if (selectedEssay.collegeId) {
        const essayCollege = colleges.find((c) => c.id === selectedEssay.collegeId);
        if (essayCollege) {
          setCollegeName(essayCollege.name);
          setSelectedCollegeId(essayCollege.id);
        }
      }
      
      // Switch to new tab to edit
      setActiveTab('new');
    }
  }, [selectedEssay, colleges]);

  // Load existing essay draft if coming from navigation
  useEffect(() => {
    if (essayPrompt && collegeId && !selectedEssay) {
      const existingEssay = essays.find(
        (e) => e.prompt === essayPrompt && e.collegeId === collegeId
      );
      if (existingEssay) {
        setEssay(existingEssay.draft);
        setSavedEssayId(existingEssay.id);
        setLastSaved(new Date(existingEssay.updatedAt));
        setAuthenticityScore(existingEssay.authenticityScore);
      }
    }
  }, [essayPrompt, collegeId, essays, selectedEssay]);

  // Save essay function (called manually)
  const saveEssay = useCallback(async () => {
    if (!essay.trim() || !user || activeTab !== 'new') {
      console.warn('Cannot save: essay is empty, user not authenticated, or not on new tab');
      return;
    }

    const essayId = savedEssayId || crypto.randomUUID();
    const existingEssay = savedEssayId ? essays.find((e) => e.id === savedEssayId) : null;

    const essayData: Essay = {
      id: essayId,
      userId: user.id,
      collegeId: collegeId || null,
      prompt: essayPrompt || existingEssay?.prompt || 'Untitled Essay',
      draft: essay,
      version: existingEssay?.version || 1,
      authenticityScore: authenticityScore ?? existingEssay?.authenticityScore ?? null,
      wordCount,
      lastFeedbackAt: feedback.length > 0 ? new Date() : (existingEssay?.lastFeedbackAt || null),
      createdAt: existingEssay?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      if (savedEssayId && existingEssay) {
        await updateEssay(savedEssayId, {
          draft: essay,
          wordCount,
          prompt: essayPrompt || existingEssay.prompt || 'Untitled Essay',
          updatedAt: new Date(),
        });
      } else {
        await addEssay(essayData);
        setSavedEssayId(essayId);
      }
      
      // Mark college as "in_progress" when essay is saved and has content
      if (collegeId) {
        const essayCollege = colleges.find((c) => c.id === collegeId);
        if (essayCollege && essayCollege.status === 'not_started' && essay.trim().length > 0) {
          updateCollege(essayCollege.id, { status: 'in_progress' });
        }
      }
      
      setLastSaved(new Date());
      console.log('✅ Essay saved successfully');
    } catch (error) {
      console.error('❌ Failed to save essay:', error);
    }
  }, [essay, user, activeTab, savedEssayId, essays, collegeId, essayPrompt, authenticityScore, wordCount, feedback.length, addEssay, updateEssay, colleges, updateCollege]);

  const handleAnalyze = useCallback(async () => {
    if (!essay.trim()) return;

    // Save essay before analyzing
    await saveEssay();

    setIsAnalyzing(true);
    setFeedback([]);
    setAuthenticityScore(null);
    setSynthesisText(null);
    setCurrentAgentIndex(0);

    const promptContext = essayPrompt
      ? `\n\nESSAY PROMPT: "${essayPrompt}"\n\nIMPORTANT: Evaluate how well this essay answers the specific prompt above. Does it directly address the question? Is it relevant and on-topic?`
      : '';

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
        setFeedback((prev) => [
          ...prev,
          {
            ...agent,
            feedback: `**Error**: Failed to get AI analysis. Please check that the server is running and try again.\n\nError details: ${error instanceof Error ? error.message : 'Unknown error'}`,
            score: undefined,
          },
        ]);
      }
    }

    setCurrentAgentIndex(4);
    try {
      const response = await analyzeEssay(essay + (essayPrompt ? `\n\nESSAY PROMPT: "${essayPrompt}"` : ''));
      setSynthesisText(response.synthesis.feedback);
    } catch (error) {
      console.error('Error generating synthesis:', error);
      setSynthesisText(`**Error**: Failed to generate synthesis. Please check that the server is running and try again.\n\nError details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (savedEssayId) {
      updateEssay(savedEssayId, {
        lastFeedbackAt: new Date(),
        authenticityScore,
      });
    }

    setCurrentAgentIndex(-1);
    setIsAnalyzing(false);
  }, [essay, essayPrompt, savedEssayId, authenticityScore, updateEssay, saveEssay]);

  const handleCopy = () => {
    navigator.clipboard.writeText(essay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setEssay('');
    setEssayPrompt('');
    setCollegeName('');
    setSelectedCollegeId(null);
    setFeedback([]);
    setAuthenticityScore(null);
    setSynthesisText(null);
    setSavedEssayId(null);
    setSelectedEssay(null);
  };

  const handleManualSave = async () => {
    await saveEssay();
  };

  const handleNewEssay = () => {
    handleClear();
    setActiveTab('new');
  };

  const handleSelectEssay = (essay: Essay) => {
    setSelectedEssay(essay);
  };

  // Group essays by college
  const essaysByCollege = essays.reduce((acc, essay) => {
    const collegeName = essay.collegeId 
      ? colleges.find((c) => c.id === essay.collegeId)?.name || 'Unknown College'
      : 'General';
    if (!acc[collegeName]) acc[collegeName] = [];
    acc[collegeName].push(essay);
    return acc;
  }, {} as Record<string, Essay[]>);

  return (
    <div className="min-h-screen">
      <Header
        title="Essays"
        subtitle="Write and analyze your college application essays"
      />

      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'new'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            New Essay
          </button>
          <button
            onClick={() => setActiveTab('my-essays')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'my-essays'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            My Essays ({essays.length})
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'new' ? (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
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
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          College (optional)
                        </label>
                        <select
                          value={selectedCollegeId || ''}
                          onChange={(e) => {
                            const collegeId = e.target.value || null;
                            setSelectedCollegeId(collegeId);
                            const selectedCollege = colleges.find((c) => c.id === collegeId);
                            setCollegeName(selectedCollege?.name || '');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select a college...</option>
                          {colleges.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Essay Prompt
                        </label>
                        <TextArea
                          value={essayPrompt}
                          onChange={(e) => setEssayPrompt(e.target.value)}
                          placeholder="Enter the essay prompt or question..."
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>

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
                        <Button variant="outline" size="sm" onClick={handleManualSave} disabled={!essay.trim() || !user}>
                          <FileText className="w-4 h-4 mr-1" />
                          Save
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
                              <p className="text-xs text-gray-500">Combined recommendations</p>
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
            </motion.div>
          ) : (
            <motion.div
              key="my-essays"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {essays.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No essays yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Start writing your first essay to get AI-powered feedback
                    </p>
                    <Button onClick={handleNewEssay}>
                      <Plus className="w-4 h-4 mr-2" />
                      Write New Essay
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(essaysByCollege).map(([collegeName, collegeEssays]) => (
                    <Card key={collegeName}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-primary-500" />
                          {collegeName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {collegeEssays.map((essay) => (
                            <div
                              key={essay.id}
                              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
                              onClick={() => handleSelectEssay(essay)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {essay.prompt.length > 80 
                                      ? `${essay.prompt.substring(0, 80)}...` 
                                      : essay.prompt}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                    <span className="flex items-center gap-1">
                                      <FileText className="w-4 h-4" />
                                      {essay.wordCount} words
                                    </span>
                                    {essay.authenticityScore !== null && (
                                      <span className="flex items-center gap-1">
                                        <span>🔍</span>
                                        {essay.authenticityScore}/100
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {formatDateShort(essay.updatedAt)}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectEssay(essay);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
