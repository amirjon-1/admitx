import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Sparkles,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Volume2,
} from 'lucide-react';
import { Header } from '../components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from '../components/ui';
import { cn } from '../lib/utils';

interface StoryThread {
  id: string;
  title: string;
  narrative: string;
  keyMoment: string;
  traits: string[];
  themes: string[];
  quotes: string[];
}

// Interview prompts
const INTERVIEW_PROMPTS = [
  "Tell me about a time when you faced a significant challenge. What happened?",
  "Describe a moment when you realized something important about yourself.",
  "What's a project or activity you're most proud of? Why does it matter to you?",
  "Tell me about someone who has influenced your perspective. How did they change you?",
  "Describe a time when you failed. What did you learn?",
];

// Simulated story threads (in production, these come from Claude API)
const SIMULATED_STORIES: StoryThread[] = [
  {
    id: '1',
    title: 'The Midnight Breakthrough',
    narrative: 'During a robotics competition, you stayed up until 3am debugging code when everyone else had given up. This moment of perseverance led to a crucial breakthrough that saved the project.',
    keyMoment: 'The realization that the sensor calibration was off by just 2 degrees, causing cascading failures',
    traits: ['Perseverance', 'Technical Problem-Solving', 'Leadership Under Pressure'],
    themes: ['Growth through adversity', 'Finding solutions when others give up', 'Technical mastery'],
    quotes: [
      "I remember thinking, if I just look at this one more time...",
      "Everyone else had gone home, but I couldn't let it go",
      "When it finally worked, I just stared at the screen for a full minute",
    ],
  },
  {
    id: '2',
    title: 'The Unexpected Mentor',
    narrative: 'Your relationship with a younger student you tutored evolved into a two-way learning experience, challenging your assumptions about teaching and expertise.',
    keyMoment: 'When the student asked a question you couldn\'t answer, forcing you to reconsider your approach',
    traits: ['Humility', 'Adaptability', 'Genuine Connection'],
    themes: ['Learning from unexpected sources', 'The value of questioning', 'Reciprocal growth'],
    quotes: [
      "She asked me 'why' about something I'd never questioned before",
      "I realized I was learning as much as I was teaching",
    ],
  },
];

export function Voice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedStories, setExtractedStories] = useState<StoryThread[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate audio level visualization
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 100);
        setDuration((prev) => prev + 1);

        // Simulate real-time transcription
        if (Math.random() > 0.7) {
          setTranscript((prev) =>
            prev + (prev ? ' ' : '') + getRandomWords()
          );
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const getRandomWords = () => {
    const words = [
      'and then', 'I realized', 'it was', 'the moment when', 'I felt',
      'we worked', 'together', 'challenging', 'breakthrough', 'learned',
    ];
    return words[Math.floor(Math.random() * words.length)];
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTranscript('');
    setDuration(0);
    setExtractedStories([]);
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsPaused(false);

    if (transcript.length > 0) {
      setIsProcessing(true);

      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setExtractedStories(SIMULATED_STORIES);

      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Voice Interview"
        subtitle="Share your story naturally, we'll extract the essay threads"
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recording Section */}
          <div className="space-y-6">
            {/* Current Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-500" />
                  Interview Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-gray-800 italic">
                  "{INTERVIEW_PROMPTS[currentPromptIndex]}"
                </p>
                <div className="flex gap-2 mt-4">
                  {INTERVIEW_PROMPTS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPromptIndex(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === currentPromptIndex
                          ? 'bg-primary-500'
                          : 'bg-gray-300 hover:bg-gray-400'
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recording Interface */}
            <Card className="overflow-hidden">
              <CardContent className="p-8">
                {/* Waveform Visualization */}
                <div className="h-24 mb-6 flex items-center justify-center gap-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary-500 rounded-full"
                      animate={{
                        height: isRecording && !isPaused
                          ? Math.random() * 80 + 10
                          : 4,
                      }}
                      transition={{
                        duration: 0.1,
                        repeat: isRecording && !isPaused ? Infinity : 0,
                        repeatType: 'reverse',
                      }}
                    />
                  ))}
                </div>

                {/* Duration */}
                <p className="text-center text-3xl font-mono font-bold text-gray-900 mb-6">
                  {formatDuration(duration)}
                </p>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button
                      size="lg"
                      className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                      onClick={handleStartRecording}
                    >
                      <Mic className="w-8 h-8" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-14 h-14 rounded-full"
                        onClick={handlePauseRecording}
                      >
                        {isPaused ? (
                          <Play className="w-6 h-6" />
                        ) : (
                          <Pause className="w-6 h-6" />
                        )}
                      </Button>
                      <Button
                        size="lg"
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                        onClick={handleStopRecording}
                      >
                        <Square className="w-6 h-6" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Status */}
                <div className="text-center mt-4">
                  {isRecording && !isPaused && (
                    <Badge variant="danger" className="animate-pulse">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                      Recording
                    </Badge>
                  )}
                  {isPaused && (
                    <Badge variant="warning">Paused</Badge>
                  )}
                  {!isRecording && duration === 0 && (
                    <p className="text-gray-500">
                      Click the microphone to start recording
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-primary-500" />
                  Live Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[150px] p-4 bg-gray-50 rounded-lg">
                  {transcript ? (
                    <p className="text-gray-700">{transcript}</p>
                  ) : (
                    <p className="text-gray-400 italic">
                      Your words will appear here as you speak...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Extracted Stories */}
          <div className="space-y-6">
            {isProcessing ? (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary-500 mb-4"
                  />
                  <p className="text-lg font-medium text-gray-900">
                    Extracting Story Threads...
                  </p>
                  <p className="text-gray-500 mt-1">
                    Our AI is identifying key narratives from your interview
                  </p>
                </div>
              </Card>
            ) : extractedStories.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold">Extracted Story Threads</h2>
                </div>

                <AnimatePresence>
                  {extractedStories.map((story, index) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <Card className="mb-4">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-purple-500" />
                              {story.title}
                            </CardTitle>
                            <Badge variant="primary">Story #{index + 1}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Narrative */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">
                              Narrative
                            </h4>
                            <p className="text-gray-700">{story.narrative}</p>
                          </div>

                          {/* Key Moment */}
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Lightbulb className="w-4 h-4 text-yellow-600" />
                              <h4 className="text-sm font-medium text-yellow-800">
                                Key Moment
                              </h4>
                            </div>
                            <p className="text-yellow-900 text-sm">
                              {story.keyMoment}
                            </p>
                          </div>

                          {/* Traits */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">
                              Character Traits Revealed
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {story.traits.map((trait) => (
                                <Badge key={trait} variant="primary">
                                  {trait}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Quotes */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">
                              Pull Quotes
                            </h4>
                            <div className="space-y-2">
                              {story.quotes.map((quote, i) => (
                                <div
                                  key={i}
                                  className="pl-3 border-l-2 border-primary-300 text-gray-600 italic text-sm"
                                >
                                  "{quote}"
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button className="w-full" variant="accent">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Essay Outline
                </Button>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your Stories Will Appear Here
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Record your interview and our AI will extract key story
                    threads, memorable moments, and essay-ready quotes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
