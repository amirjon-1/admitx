import { Router, Request, Response } from "express";
import {
  runAgent,
  runMultiAgentAnalysis,
  extractStoryThreads,
  calculateInitialOdds,
} from "../services/agents";

export const agentsRouter = Router();

function requireBodyField(req: Request, res: Response, field: string): string | null {
  const value = (req.body as any)?.[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    res.status(400).json({ error: `${field} is required` });
    return null;
  }

  return value.trim();
}

async function handleAgent(
  req: Request,
  res: Response,
  agentName: string,
  fieldName: string = "essay"
) {
  try {
    const input = requireBodyField(req, res, fieldName);
    if (!input) return;

    console.log(`🤖 Agent "${agentName}" running. Length:`, input.length);
    const output = await runAgent(agentName as any, input);

    // Always respond as JSON
    return res.json(output);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Agent "${agentName}" error:`, msg, error);
    return res.status(500).json({
      error: `Failed to run ${agentName} agent`,
      details: msg,
    });
  }
}

// ---------- Single agent analysis ----------
agentsRouter.post("/story", (req, res) => handleAgent(req, res, "story"));
agentsRouter.post("/admissions", (req, res) => handleAgent(req, res, "admissions"));
agentsRouter.post("/technical", (req, res) => handleAgent(req, res, "technical"));
agentsRouter.post("/authenticity", (req, res) => handleAgent(req, res, "authenticity"));

/**
 * ✅ Activities generator (JSON-only prompt)
 * POST /api/agents/activities
 * body: { prompt: string }
 */
agentsRouter.post("/activities", async (req, res) => {
  try {
    const prompt = requireBodyField(req, res, "prompt");
    if (!prompt) return;

    const raw = await runAgent("activities", String(prompt)); // <-- returns string
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);

    // Parse the JSON string into an object
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "Activities agent did not return valid JSON",
        raw: text,
      });
    }

    // Ensure we return a clean shape
    const activities = Array.isArray(parsed?.activities) ? parsed.activities : [];
    return res.json({ activities });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Activities agent error:", errorMsg, error);
    res.status(500).json({ error: "Failed to generate activities", details: errorMsg });
  }
});


// ---------- Full multi-agent analysis ----------
agentsRouter.post("/orchestrate", async (req, res) => {
  try {
    const essay = requireBodyField(req, res, "essay");
    if (!essay) return;

    const results = await runMultiAgentAnalysis(essay);
    return res.json(results);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to run multi-agent analysis", details: msg });
  }
});

// ---------- Story extraction ----------
agentsRouter.post("/extract-stories", async (req, res) => {
  try {
    const transcript = requireBodyField(req, res, "transcript");
    if (!transcript) return;

    const stories = await extractStoryThreads(transcript);
    return res.json(stories);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to extract stories", details: msg });
  }
});

// ---------- Odds ----------
agentsRouter.post("/calculate-odds", async (req, res) => {
  try {
    const profile = (req.body as any)?.profile;
    const schoolName = (req.body as any)?.schoolName;

    if (!profile || typeof schoolName !== "string" || !schoolName.trim()) {
      return res.status(400).json({ error: "profile and schoolName are required" });
    }

    const odds = await calculateInitialOdds(profile, schoolName.trim());
    return res.json({ odds });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to calculate odds", details: msg });
  }
});

// ---------- Quick health ----------
agentsRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});
