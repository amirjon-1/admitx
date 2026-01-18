import { Router, Request, Response } from "express";
import { runAgent, extractStoryThreads } from "../services/agents";

export const voiceRouter = Router();

type HistoryTurn = { role: "user" | "assistant"; text: string };

// Pull a usable text reply out of whatever runAgent returns
function normalizeAgentReply(result: unknown): string {
  if (!result) return "";

  // If runAgent returns a string, we’re done
  if (typeof result === "string") return result.trim();

  // If runAgent returns an object, try common fields
  if (typeof result === "object") {
    const r: any = result;

    // Most common candidates
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

    // If it has nested structures, try to find any string leaf that looks like an answer
    // (keep this minimal so it doesn't get weird)
    try {
      const asString = JSON.stringify(r);
      // If it looks like JSON but contains "feedback":"...", try to extract that quickly
      const m = asString.match(/"feedback"\s*:\s*"([^"]+)"/);
      if (m?.[1]) return m[1].replace(/\\n/g, "\n").trim();
    } catch {
      // ignore
    }
  }

  // Last resort
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
- Ask 1 strong follow-up question at a time.
- Give short, practical feedback.
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
    return res.status(500).json({ error: err?.message ?? "Failed to extract stories" });
  }
});

voiceRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});
