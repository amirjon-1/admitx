import { Router, Request, Response } from 'express';
import { runAgent, runMultiAgentAnalysis, extractStoryThreads, calculateInitialOdds } from '../services/agents';

export const agentsRouter = Router();

// Single agent analysis
agentsRouter.post('/story', async (req: Request, res: Response) => {
  try {
    const { essay } = req.body;
    if (!essay) {
      return res.status(400).json({ error: 'Essay is required' });
    }
    const feedback = await runAgent('story', essay);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze essay' });
  }
});

agentsRouter.post('/admissions', async (req: Request, res: Response) => {
  try {
    const { essay } = req.body;
    if (!essay) {
      return res.status(400).json({ error: 'Essay is required' });
    }
    const feedback = await runAgent('admissions', essay);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze essay' });
  }
});

agentsRouter.post('/technical', async (req: Request, res: Response) => {
  try {
    const { essay } = req.body;
    if (!essay) {
      return res.status(400).json({ error: 'Essay is required' });
    }
    const feedback = await runAgent('technical', essay);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze essay' });
  }
});

agentsRouter.post('/authenticity', async (req: Request, res: Response) => {
  try {
    const { essay } = req.body;
    if (!essay) {
      return res.status(400).json({ error: 'Essay is required' });
    }
    const feedback = await runAgent('authenticity', essay);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze essay' });
  }
});

// Full multi-agent analysis
agentsRouter.post('/orchestrate', async (req: Request, res: Response) => {
  try {
    const { essay } = req.body;
    if (!essay) {
      return res.status(400).json({ error: 'Essay is required' });
    }
    const results = await runMultiAgentAnalysis(essay);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run multi-agent analysis' });
  }
});

// Story extraction from voice interview
agentsRouter.post('/extract-stories', async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    const stories = await extractStoryThreads(transcript);
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract stories' });
  }
});

// Calculate admission odds
agentsRouter.post('/calculate-odds', async (req: Request, res: Response) => {
  try {
    const { profile, schoolName } = req.body;
    if (!profile || !schoolName) {
      return res.status(400).json({ error: 'Profile and school name are required' });
    }
    const odds = await calculateInitialOdds(profile, schoolName);
    res.json({ odds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate odds' });
  }
});
