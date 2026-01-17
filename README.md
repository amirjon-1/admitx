# AdmitX 🎓

An AI-powered college counseling platform that provides comprehensive essay analysis, supplemental essay management, and college application tracking.

## Features

- **AI Essay Analysis** - Multi-agent AI system providing feedback on:
  - Story structure and narrative flow
  - College admissions perspective
  - Technical writing quality
  - Authenticity scoring
  - Synthesized recommendations

- **College Dashboard** - Track applications across top 20 universities with:
  - Application status tracking
  - Decision type management (EA/ED/REA/RD)
  - Dynamic deadline tracking
  - Admissions statistics

- **Supplemental Essays** - Access 2025-26 supplemental essay prompts:
  - Click-to-navigate from college profiles
  - Pre-populated essay context
  - Organized by institution

- **Real-time Analysis** - Powered by Groq AI (Llama 3.3 70B)

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- Zustand (state management)
- React Router

**Backend:**
- Express.js
- Groq SDK (AI analysis)
- CORS-enabled REST API

## Prerequisites

- Node.js 18+ and npm
- A Groq API key ([get one here](https://console.groq.com/keys))

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd AdmitX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3001
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:all
   
   # Or start them separately:
   npm run dev          # Frontend (http://localhost:5173)
   npm run dev:server   # Backend (http://localhost:3001)
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173`

## Project Structure

```
AdmitX/
├── src/
│   ├── components/       # React components
│   │   ├── dashboard/    # College cards, modals
│   │   ├── essays/       # Essay analysis UI
│   │   ├── layout/       # Header, sidebar
│   │   └── ui/          # Reusable UI components
│   ├── data/            # College data (stats, deadlines, supplements)
│   ├── pages/           # Route pages
│   ├── lib/             # API client, utilities
│   └── store/           # Zustand state management
├── server/
│   ├── routes/          # Express API routes
│   ├── services/        # Groq AI integration
│   └── index.ts         # Server entry point
└── public/              # Static assets
```

## API Endpoints

**Health Check:**
```bash
GET /api/health
```

**Single Agent Analysis:**
```bash
POST /api/agents/{story|admissions|technical|authenticity}
Body: { "essay": "your essay text" }
```

**Multi-Agent Analysis:**
```bash
POST /api/agents/orchestrate
Body: { "essay": "your essay text" }
```

**Story Extraction (Voice):**
```bash
POST /api/agents/extract-stories
Body: { "transcript": "interview transcript" }
```

**Admissions Odds:**
```bash
POST /api/agents/calculate-odds
Body: { "profile": {...}, "schoolName": "..." }
```

## Available Scripts

- `npm run dev` - Start Vite dev server (frontend)
- `npm run dev:server` - Start Express server (backend)
- `npm run dev:all` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Data Files

College data is stored in `/src/data/`:
- `college_stats.json` - Admissions statistics (SAT/ACT, GPA, acceptance rates)
- `college_deadlines.json` - Application deadlines by decision type
- `college_decisions.json` - Available decision types per school
- `college_applications.json` - Accepted application platforms
- `college_supplements.json` - 2025-26 supplemental essay prompts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

- Powered by [Groq](https://groq.com/) - Ultra-fast AI inference
- UI components inspired by modern design systems
- College data compiled from official university websites
