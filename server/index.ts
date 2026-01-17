import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { agentsRouter } from './routes/agents';
import { marketsRouter } from './routes/markets';
import { voiceRouter } from './routes/voice';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/agents', agentsRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/voice', voiceRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
