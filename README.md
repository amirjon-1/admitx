# AdmitX 🎓

> An AI-powered college counseling platform that provides comprehensive essay analysis, supplemental essay management, and college application tracking.

## ✨ Features

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

## 🛠️ Tech Stack

### Frontend
- **[React](https://react.dev/)** (v18.3.1) - UI library
- **[TypeScript](https://www.typescriptlang.org/)** (v5.6.2) - Type safety
- **[Vite](https://vitejs.dev/)** (v5.4.10) - Build tool and dev server
- **[TailwindCSS](https://tailwindcss.com/)** (v4.1.18) - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** (v12.26.2) - Animation library
- **[Zustand](https://zustand-demo.pmnd.rs/)** (v5.0.10) - State management
- **[React Router](https://reactrouter.com/)** (v7.12.0) - Client-side routing
- **[Lucide React](https://lucide.dev/)** (v0.562.0) - Icon library
- **[Recharts](https://recharts.org/)** (v3.6.0) - Chart library

### Backend
- **[Express.js](https://expressjs.com/)** (v5.2.1) - Web framework
- **[Groq SDK](https://github.com/groq/groq-sdk-js)** (v0.37.0) - AI inference API
- **[Supabase](https://supabase.com/)** (v2.90.1) - Authentication and database
- **[CORS](https://github.com/expressjs/cors)** (v2.8.5) - Cross-origin resource sharing

### Additional Libraries
- **[date-fns](https://date-fns.org/)** (v4.1.0) - Date utility library
- **[clsx](https://github.com/lukeed/clsx)** (v2.1.1) - Conditional className utility
- **[dotenv](https://github.com/motdotla/dotenv)** (v17.2.3) - Environment variable management

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Groq API Key** - [Get one here](https://console.groq.com/keys)
- **Supabase Account** - [Sign up here](https://supabase.com/)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd admitx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Groq API
   GROQ_API_KEY=your_groq_api_key_here

   # Server
   PORT=3001

   # Supabase
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # API URL (for development)
   VITE_API_URL=http://localhost:3001/
   ```

   **Getting your Supabase credentials:**
   1. Go to [Supabase Dashboard](https://app.supabase.com/)
   2. Select your project (or create a new one)
   3. Go to Settings → API
   4. Copy the "Project URL" to `VITE_SUPABASE_URL`
   5. Copy the "anon public" key to `VITE_SUPABASE_ANON_KEY`

4. **Start the development servers**
   ```bash
   # Start both frontend and backend concurrently
   npm run dev:all
   
   # Or start them separately:
   npm run dev          # Frontend (http://localhost:5173)
   npm run dev:server   # Backend (http://localhost:3001)
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173`

## 📁 Project Structure

```
admitx/
├── src/
│   ├── components/          # React components
│   │   ├── dashboard/       # College cards, modals, stats
│   │   ├── essays/         # Essay analysis UI components
│   │   ├── layout/         # Header, sidebar, layout components
│   │   ├── markets/        # Prediction markets UI
│   │   └── ui/             # Reusable UI components (Button, Card, etc.)
│   ├── data/               # Static data files
│   │   ├── college_stats.json
│   │   ├── college_deadlines.json
│   │   ├── college_decisions.json
│   │   ├── college_applications.json
│   │   └── college_supplements.json
│   ├── lib/                # Utilities and API clients
│   │   ├── api.ts          # Backend API client
│   │   ├── supabase.ts     # Supabase client and helpers
│   │   └── utils.ts        # Utility functions
│   ├── pages/              # Route pages
│   │   ├── Home.tsx        # Landing page
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Colleges.tsx   # College management
│   │   ├── Essays.tsx     # Essay writing and analysis
│   │   ├── Activities.tsx # Activities and honors tracking
│   │   ├── Markets.tsx    # Prediction markets
│   │   └── Voice.tsx       # Voice interview
│   ├── store/              # Zustand state management
│   │   └── useStore.ts     # Global application state
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Root component
├── server/
│   ├── routes/             # Express API routes
│   │   ├── agents.ts      # AI agent endpoints
│   │   └── activities.ts  # Activity generation
│   ├── services/           # Business logic
│   │   └── groq.ts        # Groq AI integration
│   └── index.ts            # Server entry point
├── public/                 # Static assets
└── vercel.json             # Vercel deployment configuration
```

## 🔌 API Endpoints

### Health Check
```bash
GET /api/health
```

### Single Agent Analysis
```bash
POST /api/agents/{story|admissions|technical|authenticity}
Content-Type: application/json

Body:
{
  "essay": "your essay text"
}
```

### Multi-Agent Analysis (Orchestration)
```bash
POST /api/agents/orchestrate
Content-Type: application/json

Body:
{
  "essay": "your essay text"
}
```

### Story Extraction (Voice Interview)
```bash
POST /api/agents/extract-stories
Content-Type: application/json

Body:
{
  "transcript": "interview transcript"
}
```

### Activity Generation
```bash
POST /api/activities/generate
Content-Type: application/json

Body:
{
  "transcript": "voice interview transcript"
}
```

### Admissions Odds Calculation
```bash
POST /api/agents/calculate-odds
Content-Type: application/json

Body:
{
  "profile": {...},
  "schoolName": "..."
}
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:server` | Start Express server (backend only) |
| `npm run dev:all` | Start both frontend and backend concurrently |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality checks |

## 📊 Data Files

College data is stored in `/src/data/`:

- **`college_stats.json`**** - Admissions statistics (SAT/ACT ranges, GPA averages, acceptance rates, class sizes)
- **`college_deadlines.json`** - Application deadlines organized by decision type
- **`college_decisions.json`** - Available decision types per school (EA, ED, REA, RD)
- **`college_applications.json`** - Accepted application platforms (Common App, Coalition, Direct)
- **`college_supplements.json`** - 2025-26 supplemental essay prompts by institution

## 🚢 Deployment

### Vercel (Recommended)

The project is configured for deployment on Vercel:

1. **Frontend**: Automatically deployed via Vercel's build system
2. **Backend**: Serverless functions in `/api` directory
3. **Environment Variables**: Set in Vercel dashboard under Project Settings → Environment Variables

**Required Environment Variables for Production:**
- `GROQ_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (should be your production API URL)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

### Core Technologies
- **[Groq](https://groq.com/)** - Ultra-fast AI inference engine powering our essay analysis
- **[Supabase](https://supabase.com/)** - Open-source Firebase alternative for authentication and database
- **[Vercel](https://vercel.com/)** - Deployment platform and serverless functions

### Data Sources
- College statistics and deadlines compiled from official university websites
- Supplemental essay prompts sourced from 2025-26 application cycles

### Design Inspiration
- Modern design systems and component libraries
- User experience patterns from leading SaaS applications

---

**Built with ❤️ for students navigating the college application process**
