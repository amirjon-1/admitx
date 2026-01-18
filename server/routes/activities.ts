import { Router, Request, Response } from "express";
import { runAgent } from "../services/agents";

export const activitiesRouter = Router();

export type ActivityItem = {
  position_title: string;
  organization: string;
  description: string;
  years: string;
  hours_per_week: number;
  weeks_per_year: number;
};

export type HonorItem = {
  name: string;
  level: "School" | "State" | "Regional" | "National" | "International";
  description: string;
  grade_received: "9" | "10" | "11" | "12";
};

/**
 * Extract the first valid JSON object/array from text.
 * More tolerant than “first bracket match”, because models sometimes prepend text.
 */
function extractFirstJson(text: string): any | null {
  const starts: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{" || ch === "[") starts.push(i);
  }
  if (starts.length === 0) return null;

  for (const start of starts) {
    const open = text[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === open) depth++;
      if (ch === close) depth--;

      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          break; // try the next start position
        }
      }
    }
  }

  return null;
}

function clampStr(v: any, max: number) {
  const s = String(v ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function toNum(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeActivities(parsed: any): ActivityItem[] {
  const list = Array.isArray(parsed) ? parsed : parsed?.activities;
  if (!Array.isArray(list)) return [];

  return list.slice(0, 10).map((a: any) => ({
    position_title: clampStr(a.position_title, 50),
    organization: clampStr(a.organization, 50),
    description: clampStr(a.description, 150),
    years: clampStr(a.years, 10),
    hours_per_week: toNum(a.hours_per_week, 0),
    weeks_per_year: toNum(a.weeks_per_year, 0),
  }));
}

function normalizeHonors(parsed: any): HonorItem[] {
  const list = parsed?.honors;
  if (!Array.isArray(list)) return [];

  const validLevels = ["School", "State", "Regional", "National", "International"];
  const validGrades = ["9", "10", "11", "12"];

  return list.slice(0, 5).map((h: any) => ({
    name: clampStr(h.name, 100),
    level: validLevels.includes(h.level) ? h.level : "School",
    description: clampStr(h.description, 150),
    grade_received: validGrades.includes(String(h.grade_received)) ? String(h.grade_received) : "12",
  }));
}

function asText(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    const r: any = result;
    const maybe = r.reply ?? r.text ?? r.content ?? r.feedback;
    if (typeof maybe === "string") return maybe;
  }
  try {
    return JSON.stringify(result);
  } catch {
    return String(result);
  }
}

/**
 * POST /api/activities/generate
 * Body: { transcript: string }
 * Returns: { activities: ActivityItem[], honors: HonorItem[] }
 */
activitiesRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body as { transcript?: string };

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "transcript is required" });
    }

    const prompt = `
Return valid JSON ONLY. No markdown. No commentary.
Output MUST match this exact schema:

{
  "activities": [
    {
      "position_title": string,
      "organization": string,
      "description": string,
      "years": string,
      "hours_per_week": number,
      "weeks_per_year": number
    }
  ],
  "honors": [
    {
      "name": string,
      "level": "School" | "State" | "Regional" | "National" | "International",
      "description": string,
      "grade_received": "9" | "10" | "11" | "12"
    }
  ]
}

Hard limits:
- position_title <= 50 chars
- organization <= 50 chars
- description <= 150 chars
- honor name <= 100 chars

Rules:
- Use ONLY the information provided in the interview transcript below. Do NOT invent activities, awards, or results.
- Extract real extracurricular activities, clubs, sports, volunteer work, jobs, or other involvements for the "activities" array.
- Extract real honors, awards, recognitions, competitions won, or achievements for the "honors" array.
- If hours/weeks are not explicitly mentioned, make a reasonable conservative estimate based on context.
- For honors, determine the appropriate level (School, State, Regional, National, International) based on context.
- Output JSON only. Absolutely no extra keys.

Interview Transcript:
${transcript}
`.trim();

    // Dedicated JSON agent
    const result = await runAgent("activities" as any, prompt);
    const raw = asText(result);

    // Try strict parse first, then extraction
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = extractFirstJson(raw);
    }

    if (!parsed) {
      return res.status(500).json({
        error: "Model did not return valid JSON",
        raw,
      });
    }

    const activities = normalizeActivities(parsed);
    const honors = normalizeHonors(parsed);

    if (!activities.length && !honors.length) {
      return res.status(500).json({
        error: "Model returned JSON but no activities or honors found",
        rawParsed: parsed,
      });
    }

    return res.json({ activities, honors });
  } catch (e: any) {
    console.error("activities/generate error:", e);
    return res.status(500).json({
      error: e?.message ?? "Failed to generate activities",
    });
  }
});
