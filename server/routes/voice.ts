import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { runAgent, extractStoryThreads } from "../services/agents";

export const voiceRouter = Router();

type HistoryTurn = { role: "user" | "assistant"; text: string };

function normalizeAgentReply(result: unknown): string {
  if (!result) return "";

  if (typeof result === "string") return result.trim();

  if (typeof result === "object") {
    const r: any = result;

    const candidates = [
      r.reply,
      r.text,
      r.feedback,
      r.message,
      r.output_text,
      r.content,
      r?.feedback?.text,
    ];

    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }

    // if it returned JSON-ish, try to pick out a feedback field
    try {
      const asString = JSON.stringify(r);
      const m = asString.match(/"feedback"\s*:\s*"([^"]+)"/);
      if (m?.[1]) return m[1].replace(/\\n/g, "\n").trim();
    } catch {
      // ignore
    }
  }

  return String(result).trim();
}

/**
 * POST /api/voice/interview
 * body: { message: string, history?: { role, text }[] }
 * returns: { reply: string }
 */
voiceRouter.post("/interview", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body as {
      message?: string;
      history?: HistoryTurn[];
    };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const turns = Array.isArray(history) ? history.slice(-10) : [];
    const formattedHistory = turns
      .map((t) => `${t.role === "user" ? "Student" : "Advisor"}: ${t.text}`)
      .join("\n");

    const prompt = `
You are an expert college admissions advisor doing a live interview.

Rules:
- Ask exactly 1 strong follow-up question at a time.
- Give short, practical feedback (not generic).
- Collect details: grade, GPA (weighted/unweighted), courses (AP/IB/honors), SAT/ACT, activities, awards, leadership, volunteering, work, intended major, and story moments.
- Be supportive and clear (no fluff).
- Keep responses under ~120 words unless asked for more.
- Respond with plain text only. Do NOT output JSON.

Conversation so far:
${formattedHistory || "(none)"}

Student just said:
${message}

Now reply as the Advisor:
`.trim();

    const result = await runAgent("admissions", prompt);
    const reply = normalizeAgentReply(result);

    return res.json({ reply: reply || "Got it — can you tell me a bit more?" });
  } catch (err: any) {
    console.error("voice/interview error:", err);
    return res.status(500).json({
      error: err?.message ?? "Failed to generate advisor reply",
    });
  }
});

/**
 * POST /api/voice/save
 * body: { sessionId: string, transcript: { role, text, ts? }[] }
 * writes: server/data/interviews/<sessionId>.json
 */
const DATA_DIR = path.join(process.cwd(), "server", "data", "interviews");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

voiceRouter.post("/save", async (req: Request, res: Response) => {
  try {
    const { sessionId, transcript } = req.body as {
      sessionId?: string;
      transcript?: Array<{ role: "user" | "assistant"; text: string; ts?: number }>;
    };

    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    if (!Array.isArray(transcript))
      return res.status(400).json({ error: "transcript must be an array" });

    const filePath = path.join(DATA_DIR, `${sessionId}.json`);

    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : null;

    const base = existing ?? {
      sessionId,
      createdAt: new Date().toISOString(),
      transcript: [],
    };

    base.transcript = transcript;

    fs.writeFileSync(filePath, JSON.stringify(base, null, 2), "utf8");

    return res.json({ ok: true, saved: `${sessionId}.json` });
  } catch (err: any) {
    console.error("voice/save error:", err);
    return res.status(500).json({ error: err?.message ?? "save failed" });
  }
});

/**
 * OPTIONAL: story extraction
 * POST /api/voice/extract-stories
 * body: { transcript: string }
 */
voiceRouter.post("/extract-stories", async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body as { transcript?: string };
    if (!transcript) {
      return res.status(400).json({ error: "transcript is required" });
    }
    const stories = await extractStoryThreads(transcript);
    return res.json(stories);
  } catch (err: any) {
    console.error("voice/extract-stories error:", err);
    return res.status(500).json({
      error: err?.message ?? "Failed to extract stories",
    });
  }
});

voiceRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});
