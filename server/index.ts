import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { agentsRouter } from "./routes/agents";
import { marketsRouter } from "./routes/markets";
import { voiceRouter } from "./routes/voice";
import livekitRouter from "./routes/livekit";
import { initializeGroq, verifyGroqConnection } from "./services/agents";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, _res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/agents", agentsRouter);
app.use("/api/markets", marketsRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/livekit", livekitRouter);

// Groq init (non-blocking)
try {
  initializeGroq();
  console.log("✅ Groq API initialized successfully");
  verifyGroqConnection()
    .then((ok) => console.log(ok ? "✅ Groq verified" : "❌ Groq verify failed"))
    .catch((e) => console.error("❌ Groq verify error:", e));
} catch (e) {
  console.error("❌ Groq init error:", e);
}

// last
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
