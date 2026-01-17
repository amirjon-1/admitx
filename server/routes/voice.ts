import { Router, Request, Response } from 'express';
import { extractStoryThreads } from '../services/agents';

export const voiceRouter = Router();

// In-memory storage for demo
const interviews: any[] = [];

// Start voice session (would integrate with Livekit in production)
voiceRouter.post('/start-session', (req: Request, res: Response) => {
  const { userId } = req.body;

  // In production, this would create a Livekit room
  const session = {
    id: `session-${Date.now()}`,
    userId,
    roomName: `council-${userId}-${Date.now()}`,
    token: 'demo-token', // Would be a real Livekit token
    createdAt: new Date().toISOString(),
  };

  res.json(session);
});

// Upload recording
voiceRouter.post('/upload', async (req: Request, res: Response) => {
  const { userId, audioData, duration } = req.body;

  // In production, this would upload to Supabase Storage
  const interview = {
    id: `interview-${Date.now()}`,
    userId,
    audioUrl: `https://storage.example.com/audio/${Date.now()}.webm`,
    transcript: null,
    durationSeconds: duration,
    storyThreads: [],
    createdAt: new Date().toISOString(),
  };

  interviews.push(interview);
  res.status(201).json(interview);
});

// Transcribe audio
voiceRouter.post('/transcribe/:id', async (req: Request, res: Response) => {
  const interview = interviews.find(i => i.id === req.params.id);

  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  // In production, this would call Deepgram or Whisper API
  // For demo, we'll use a simulated transcript
  const simulatedTranscript = `
So the question is about a challenge I faced. Let me think about this.

I remember staying up really late, like 3am, working on our robotics project. Everyone else had given up for the night, but I couldn't stop. There was this bug in our autonomous navigation code that was causing the robot to drift.

I remember thinking, if I just look at this one more time, maybe I'll see what I'm missing. And then it hit me - the sensor calibration was off by just 2 degrees. Such a tiny error, but it was causing cascading failures throughout the whole system.

When it finally worked, I just stared at the screen for a full minute. I was so tired but so relieved. That moment taught me that sometimes the breakthrough comes when everyone else has stopped looking.

Another experience that shaped me was tutoring this younger student named Maya. At first I thought I'd be teaching her, but she asked this question about why we do math this way, and I couldn't answer it. She asked me 'why' about something I'd never questioned before.

That made me realize I was learning as much as I was teaching. It changed how I approach problems - now I always ask 'why' even about things I think I understand.
  `.trim();

  interview.transcript = simulatedTranscript;
  res.json({ transcript: simulatedTranscript });
});

// Extract stories from transcript
voiceRouter.post('/extract-stories/:id', async (req: Request, res: Response) => {
  const interview = interviews.find(i => i.id === req.params.id);

  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  if (!interview.transcript) {
    return res.status(400).json({ error: 'Interview has not been transcribed yet' });
  }

  try {
    const stories = await extractStoryThreads(interview.transcript);
    interview.storyThreads = stories.threads;
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract stories' });
  }
});

// Get all interviews for user
voiceRouter.get('/interviews', (req: Request, res: Response) => {
  const { userId } = req.query;
  const userInterviews = userId
    ? interviews.filter(i => i.userId === userId)
    : interviews;
  res.json(userInterviews);
});

// Get single interview
voiceRouter.get('/interviews/:id', (req: Request, res: Response) => {
  const interview = interviews.find(i => i.id === req.params.id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  res.json(interview);
});
