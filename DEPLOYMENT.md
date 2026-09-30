# ArogyaMesh Production Deployment Architecture

ArogyaMesh is deployed using a decoupled, production-grade cloud architecture:

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Frontend                      │
│             https://arogyamesh.vercel.app              │
│       Next.js 16 App Router · TypeScript · PWA         │
└───────────────────────────┬────────────────────────────┘
                            │ /api/* rewrites
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Render Backend                      │
│       https://arogyamesh-api-6o84.onrender.com         │
│          FastAPI · Uvicorn · Python 3.12 (Ohio)        │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy (PgBouncer pooler)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Neon PostgreSQL Database               │
│          AWS US-East-2 (Ohio) · Branch: production     │
└────────────────────────────────────────────────────────┘
```

---

## 1. Production Endpoints

| Component | Target URL | Health / Docs |
|---|---|---|
| **Frontend** | `https://arogyamesh.vercel.app` | `/` |
| **Backend API** | `https://arogyamesh-api-6o84.onrender.com` | `/health`, `/docs` |
| **Database** | Neon Cloud PostgreSQL (AWS US East Ohio) | Connection pooled |
| **GitHub Source** | `https://github.com/MKVISHNUVARDHAN/arogyamesh` | Branch: `main` |

---

## 2. Environment Variables Specification

> **SECURITY NOTICE:** Do not commit actual credentials to Git. Values are injected directly in provider consoles.

### Render Backend (`arogyamesh-api`)
| Variable Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string (`postgresql://...sslmode=require`) |
| `GROQ_API_KEY` | Optional | Groq Cloud API key for low-latency AI Copilot |
| `GROQ_MODEL` | Optional | Groq model identifier (Default: `openai/gpt-oss-20b`) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key fallback |
| `DEMO_MODE` | Yes | Set to `true` to enable human-in-the-loop demo mutations |
| `PORT` | Auto | Injected dynamically by Render (Default: `10000`) |
| `HOST` | Auto | Binds to `0.0.0.0` |
| `ALLOWED_ORIGINS` | Yes | `https://arogyamesh.vercel.app,http://localhost:3000,http://localhost:3100` |

### Vercel Frontend (`arogyamesh`)
| Variable Name | Required | Description |
|---|---|---|
| `API_ORIGIN` | Yes | `https://arogyamesh-api-6o84.onrender.com` (proxies all `/api/*` calls) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Optional | Google Maps JavaScript API key |
| `NEXT_PUBLIC_GOOGLE_MAP_ID` | Optional | Map ID for vector styling |

---

## 3. How Deployments are Triggered

1. **Backend (Render):**
   - Automatically builds and deploys upon any `git push origin main` via connected GitHub repository (`MKVISHNUVARDHAN/arogyamesh`).
   - Defined via Blueprint in `render.yaml`.
2. **Frontend (Vercel):**
   - Deployed via Vercel CLI (`vercel --prod --cwd apps/web`) or connected Git deployment.
   - Next.js rewrites in `next.config.mjs` automatically forward all `/api/:path*` requests to `API_ORIGIN`.

---

## 4. Database Migrations & Seeding

- Migrations run automatically on backend startup via `apps.api.db.migrate()`.
- Tables are defined via SQLAlchemy DeclarativeBase with version tracking in `schema_migrations`.
- To manually execute migrations locally or against a remote database:
  ```bash
  python -c "from apps.api.db import migrate; migrate()"
  ```
- To seed or reset synthetic demo data idempotently:
  ```bash
  python -m scripts.seed
  ```
  Or trigger from the authenticated API:
  ```bash
  curl -X POST https://arogyamesh-api-6o84.onrender.com/demo/reset -H "X-Demo-Role: district"
  ```

---

## 5. Running Locally

1. **Install Dependencies:**
   ```bash
   uv sync
   npm install
   npm --prefix apps/web install
   ```
2. **Start Unified Development Server:**
   ```bash
   python scripts/dev.py
   ```
   - Frontend runs at: `http://127.0.0.1:3100`
   - Backend API runs at: `http://127.0.0.1:8100`
   - Swagger Documentation: `http://127.0.0.1:8100/docs`

---

## 6. Pre-Demo Checklist (Waking the Services)

Free-tier instances on Render automatically spin down after 15 minutes of inactivity. Run the automated pre-demo check script 60 seconds before presenting:

```bash
python scripts/demo-check.py
```

This script:
1. Pings Render's `/health` to wake the web service.
2. Verifies Neon PostgreSQL query latency.
3. Confirms Vercel frontend loading.
4. Verifies the Vercel -> Render proxy tunnel.

---

## 7. Known Free-Tier Limitations & Mitigations

- **Cold Start Delay:** Render Free Web Services sleep after 15 minutes of idle time. The first request after a sleep period may take ~20–30 seconds while the container initializes. Running `python scripts/demo-check.py` or visiting the `/health` endpoint before the demo keeps the container active.
- **Connection Limits:** Neon serverless PostgreSQL handles connection pooling via PgBouncer. `apps/api/db.py` is configured with `NullPool` and `prepare_threshold=None` to prevent connection exhaustion.
- **Groq Rate Limits:** `openai/gpt-oss-20b` is used as the primary LLM provider to ensure sub-second response times in English and Telugu without hitting free-tier token-per-minute ceilings.
