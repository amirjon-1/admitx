import { Router, Request, Response } from "express";
import { AccessToken } from "livekit-server-sdk";

const router = Router();

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

/**
 * Shared token issuer
 */
async function issueTokenWith(
  room: string,
  identity: string,
  res: Response
) {
  const livekitUrl = envOrThrow("LIVEKIT_URL");
  const apiKey = envOrThrow("LIVEKIT_API_KEY");
  const apiSecret = envOrThrow("LIVEKIT_API_SECRET");

  const at = new AccessToken(apiKey, apiSecret, { identity });

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const jwt = await at.toJwt(); // async in your version

  return res.json({
    token: jwt,
    url: livekitUrl,
    room,
    identity,
  });
}

/**
 * GET  /api/livekit/token?room=test-room&identity=bot
 * POST /api/livekit/token   { room, identity }
 */
async function issueUserToken(req: Request, res: Response) {
  const room =
    (req.method === "POST" ? req.body?.room : req.query?.room) || "test-room";

  const identity =
    (req.method === "POST" ? req.body?.identity : req.query?.identity) ||
    `user-${Date.now()}`;

  return issueTokenWith(String(room), String(identity), res);
}

router.get("/token", async (req, res) => {
  try {
    await issueUserToken(req, res);
  } catch (err) {
    console.error("LiveKit token error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create token",
    });
  }
});

router.post("/token", async (req, res) => {
  try {
    await issueUserToken(req, res);
  } catch (err) {
    console.error("LiveKit token error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create token",
    });
  }
});

/**
 * GET /api/livekit/agent-token
 * Returns a token for your “advisor bot” to join the same room.
 */
router.get("/agent-token", async (_req, res) => {
  try {
    const room = "admitx-voice";
    const identity = "admitx-agent";
    await issueTokenWith(room, identity, res);
  } catch (err) {
    console.error("LiveKit agent-token error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create agent token",
    });
  }
});

/**
 * GET /api/livekit/health
 */
router.get("/health", (_req, res) => {
  res.json({
    ok:
      !!process.env.LIVEKIT_URL &&
      !!process.env.LIVEKIT_API_KEY &&
      !!process.env.LIVEKIT_API_SECRET,
    hasUrl: !!process.env.LIVEKIT_URL,
    hasKey: !!process.env.LIVEKIT_API_KEY,
    hasSecret: !!process.env.LIVEKIT_API_SECRET,
  });
});

export default router;
