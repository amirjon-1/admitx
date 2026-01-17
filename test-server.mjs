#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = 3001;

// Initialize Groq
let groq = null;
if (process.env.GEMINI_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GEMINI_API_KEY,
  });
  console.log('✅ Groq initialized');
}

app.use(cors());
app.use(express.json());

// Test route
app.post('/test', async (req, res) => {
  console.log('🔥 TEST ROUTE HIT');
  try {
    if (!groq) {
      return res.json({ error: 'Groq not initialized' });
    }
    
    console.log('Calling Groq API...');
    const msg = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10,
    });
    console.log('✅ Groq response received');
    res.json({ success: true, response: msg.choices[0]?.message?.content });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
