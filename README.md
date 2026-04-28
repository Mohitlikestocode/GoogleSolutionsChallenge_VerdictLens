<div align="center">

# VerdictLens — AI Fairness Auditor

**The AI that judges you is being judged back.**

VerdictLens is an adversarial red-teaming tool for auditing LLM-based decision systems. It reveals bias through real-time probing with synthetic personas, statistical significance testing, semantic divergence analysis, and actionable repair strategies.

## Quick Start

### Prerequisites
- Node.js 20+ (frontend)
- Python 3.11+ (backend, optional)
- Docker + Docker Compose (for containerized deployment)

### Local Development (Frontend + Local Engine)

```bash
# 1. Install frontend dependencies
npm install

# 2. Run frontend dev server (Vite on port 3002)
npm run dev

# 3. Open browser to http://localhost:3002
```

The frontend works standalone with a deterministic local audit engine. No backend API calls required.

### Local Development (Frontend + Backend APIs)

For real-time WebSocket streaming and advanced session management:

```bash
# Terminal 1: Frontend (port 3002)
npm run dev

# Terminal 2: Backend (port 8000)
npm run backend

# Terminal 3 (optional): Set environment
# On macOS/Linux:
export VITE_BACKEND_URL="http://localhost:8000"
# On Windows (PowerShell):
$env:VITE_BACKEND_URL = "http://localhost:8000"
```

The frontend will automatically detect the backend and use WebSocket streaming instead of local simulation.

### Docker Deployment (Production)

**Single-Command Deployment:**

```bash
# Build and run both frontend and backend containers
docker-compose up

# Services available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000 (internal)
# Backend health: http://localhost:8000/health
```

**Build-Only (without running):**
```bash
docker-compose build --no-cache
```

**View logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f  # All services
```

**Clean up containers and images:**
```bash
docker-compose down -v
docker system prune -a
```

### Build for Production

```bash
# Frontend: Build static assets (output: dist/)
npm run build

# Backend: Can be run directly or containerized
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

---

## Architecture

```
verdictlens/
├── frontend/                    # React 19 + Vite SPA
│   ├── src/
│   │   ├── components/          # React components (Landing, VictimFlow, AuditorFlow, Report, Repair)
│   │   ├── services/            # geminiService (API bridge, fallback logic)
│   │   ├── store/               # Zustand (useAuditStore)
│   │   ├── lib/                 # stats.ts (analytics computation)
│   │   └── types.ts             # TypeScript interfaces
│   ├── Dockerfile               # Nginx + reverse proxy to backend
│   ├── vite.config.ts           # Vite configuration
│   └── package.json
│
├── backend/                     # FastAPI + Uvicorn
│   ├── main.py                  # FastAPI app, all endpoints + WebSocket
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile               # Python 3.11 slim image
│   └── data/
│       └── demographics.json    # Demographic attribute pools for persona generation
│
├── docker-compose.yml           # Orchestration (backend + frontend + nginx proxy)
├── Dockerfile                   # Frontend Dockerfile (multi-stage build)
├── .dockerignore                # Docker build exclusions
├── tsconfig.json
└── README.md
```

---

## Features

### Two Entry Modes

#### 1. **Victim Mode** ("I Was Judged")
- Describe your rejection scenario
- VerdictLens generates 12 demographic variants of you
- See if a different version of yourself received a different outcome
- Real-time card animations + verdict reveal

#### 2. **Auditor Mode** ("I Built The Judge")
- Paste your LLM system prompt
- Configure probe depth (quick/standard/deep)
- Watch real-time force-directed swarm visualization
- Personas cluster by bias pattern in real-time

### Bias Metrics

- **Disparate Impact Ratio (DIR)**: Race-based approval gap (EEOC threshold: 0.8)
- **Demographic Parity Difference (DPD)**: Gender-based approval variance
- **Consistency Score**: Response stability across similar personas
- **Intersectional Gap**: Largest performance delta between demographic intersections
- **Semantic Divergence**: Language drift between groups (even when verdict matches)

All metrics include:
- Chi-square statistical significance tests (p-value < 0.05)
- Plain-English interpretation
- Severity classification (critical/warning/pass)

### Forensic Narrative Report

Groq-powered investigator report covering:
1. **THE FINDING** — Verdict in plain English with key numbers
2. **WHAT THE AI ACTUALLY DOES** — Mechanism analysis
3. **WHO IS MOST HARMED** — Intersectional group breakdown
4. **THE INVISIBLE DISCRIMINATION** — Semantic divergence evidence
5. **LEGAL EXPOSURE** — EEOC/AI Act risk assessment
6. **THREE ACTIONS, IN ORDER** — Ranked repair strategies

### Interactive Repair Workbench

Three algorithmic repair strategies with before/after validation:
1. **Demographic Blindfolding** — Strip demographic signal pathways
2. **Structured Rubric Forcing** — Criterion-by-criterion evaluation
3. **Counterfactual Self-Check** — Consistency verification in prompt

---

## Configuration

### Environment Variables

Create `.env.local` (frontend) or `.env` (backend):

**Frontend (.env.local):**
```env
# Optional: Point to backend API
VITE_BACKEND_URL=http://localhost:8000

# Optional: Groq API for real LLM probing when not using only the backend
VITE_GROQ_API_KEY=your-key-here
```

**Backend (.env):**
```env
# CORS origin (allow frontend origin)
VITE_APP_ORIGIN=http://localhost:3000
APP_ORIGIN=http://localhost:3000

# Optional: External LLM integration
GROQ_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
```

### Rate Limiting

Backend enforces:
- **10 requests per 60 seconds** per IP
- **384 maximum personas** per audit session
- **2-hour session TTL** (automatic cleanup)

---

## API Endpoints

All endpoints require `Content-Type: application/json`.

### HTTP Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/sessions` | Create or retrieve audit session |
| GET | `/api/sessions/{id}` | Get session state |
| DELETE | `/api/sessions/{id}` | Delete session (clears all data) |
| POST | `/api/reconstruct` | Reverse-engineer system prompt from situation description |
| POST | `/api/personas` | Generate demographic persona matrix |
| POST | `/api/probe` | Score single persona (deterministic engine) |
| POST | `/api/analyze` | Compute all bias metrics from personas |
| POST | `/api/narrative` | Generate forensic audit narrative |
| POST | `/api/repair` | Suggest prompt repair strategies |

### WebSocket Endpoint

| Path | Purpose |
|------|---------|
| `WS /ws/audit/{session_id}` | Real-time audit stream (persona completion events + final analysis) |

**WebSocket Message Types:**

```json
// Persona completion
{
  "type": "persona_complete",
  "persona": { id, name, demographics, verdictScore, verdictLabel, rawResponse, ... },
  "progress": 45.5
}

// Analysis complete
{
  "type": "analysis_complete",
  "metrics": [ ... ],
  "intersectional_data": { matrix, worst_intersection, best_intersection, gap },
  "semantic_divergence": { score, maxDivergencePair, tsneCoords, toneAnalysis },
  "narrative": "## THE FINDING..."
}
```

---

## Security & Privacy

✅ **API Keys**: Never written to disk, stored in memory only  
✅ **Session Data**: Ephemeral (2-hour TTL, auto-cleared)  
✅ **Rate Limiting**: 10 req/60s per IP  
✅ **Input Sanitization**: Prompt injection filtering  
✅ **CORS**: Configured for localhost + customizable origins  
✅ **Audit Logging**: Session events logged (no content)

---

## Troubleshooting

### "WebSocket failed, falling back to HTTP"
- **Cause**: Backend not running or CORS misconfigured
- **Fix**: Ensure `npm run backend` is running and `VITE_BACKEND_URL` matches backend address

### "Rate limit exceeded (429)"
- **Cause**: Too many API requests from your IP
- **Fix**: Wait 60 seconds or use different IP

### Docker build fails
- **Cause**: Python or Node.js versions incompatible
- **Fix**: Ensure Node 20+ and Python 3.11+
  ```bash
  node --version  # Should be v20+
  python --version  # Should be 3.11+
  ```

### Personas not loading in Auditor Mode
- **Cause**: Backend API timeout or HTTP fallback slow
- **Fix**: 
  1. Check backend is healthy: `curl http://localhost:8000/health`
  2. Check browser console for errors
  3. Increase network timeout in `AuditorFlow.tsx` if needed

---

## Development

### Tech Stack

**Frontend:**
- React 19, TypeScript 5.8, Vite 6.2
- Tailwind CSS 4.1, Framer Motion 12.23
- D3.js 7.9, Recharts 3.8, Zustand 5
- Lucide React 0.546 (icons)

**Backend:**
- FastAPI 0.115, Uvicorn 0.30
- Pydantic 2.8, Python 3.11
- scipy, numpy, pandas, statsmodels (statistics)
- sentence-transformers (semantic embeddings)

**Deployment:**
- Docker 24+, Docker Compose 2.20+
- Nginx (frontend reverse proxy + static serving)
- Python 3.11 slim (backend image)
- Node 20 Alpine (frontend build image)

### Linting & Type Checking

```bash
# Frontend: TypeScript strict mode
npm run lint

# Backend: Python syntax check (built-in)
python -m compileall backend/

# Frontend: Build (catches all errors)
npm run build
```

### Running Tests

```bash
# Frontend tests (when Jest configured)
npm test

# Backend tests (when pytest configured)
pytest backend/tests/
```

---

## Performance

- **Frontend build size**: ~1.1 MB minified (Vite with tree-shaking)
- **API response time**: <200ms per persona probe (deterministic)
- **WebSocket message rate**: ~20 personas/second (configurable)
- **Scalability**: Stateless backend, horizontal scaling ready

---

## Optional Backend

VerdictLens works without a backend using a deterministic local audit engine. For production deployments with session persistence and WebSocket support, deploy the FastAPI backend.

**With Backend:**
- Real-time WebSocket persona streaming ✅
- Session persistence across browser refreshes ✅
- Multi-user concurrent audits ✅
- Advanced repair validation ✅

**Without Backend (Local Engine):**
- Instant deterministic results ✅
- No server setup required ✅
- Works offline ✅
- Single-user only per session ⚠️

---

## Contributing

Issues, PRs, and feedback welcome. Please follow the existing code style and add tests for new features.

---

## License

Apache 2.0 (see [LICENSE](LICENSE) in root)

---

## Citation

If you use VerdictLens in research, please cite:

```bibtex
@software{verdictlens2025,
  title={VerdictLens: Adversarial Bias Auditing for LLM Decision Systems},
  author={VerdictLens Contributors},
  url={https://github.com/yourname/verdictlens},
  year={2025}
}
```

---

## Contact

For questions or enterprise deployment inquiries, please open an issue on GitHub.

