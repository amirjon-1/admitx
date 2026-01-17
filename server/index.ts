import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { agentsRouter } from './routes/agents';
import { initializeGroq, verifyGroqConnection } from './services/agents';
import { marketsRouter } from './routes/markets';
import { voiceRouter } from './routes/voice';

dotenv.config();

// Initialize Groq API client with environment variables
try {
  initializeGroq();
  console.log('✅ Groq API initialized successfully');
  
  // Verify connection
  verifyGroqConnection().then(isConnected => {
    if (isConnected) {
      console.log('✅ Groq API connection verified');
    } else {
      console.error('❌ Groq API connection failed');
    }
  });
} catch (error) {
  console.error('❌ Failed to initialize Groq API:', error instanceof Error ? error.message : error);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 Request: ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check called');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
console.log('Registering /api/agents route');
app.use('/api/agents', agentsRouter);
console.log('Registering /api/markets route');
app.use('/api/markets', marketsRouter);
console.log('Registering /api/voice route');
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
