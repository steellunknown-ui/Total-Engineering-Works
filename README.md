# Tatva Dynamics — Metal Engineering Platform

## Project Structure

```
GOATED/
├── Frontend/          ← Next.js 15 public website (tatvadynamics.com)
└── Backend/
    └── MetalQuoteTool-v5/   ← FastAPI admin panel + quote engine (offline/LAN only)
```

---

## Frontend (Next.js)

**Tech:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion

### Run locally
```bash
cd Frontend
npm install
npm run dev          # http://localhost:3000
```

### Environment setup
```bash
cp .env.example .env.local
# Fill in your API keys in .env.local
```

---

## Backend (FastAPI)

**Tech:** FastAPI, SQLAlchemy, PostgreSQL (Supabase), Python 3.11+

### Run locally
```bash
cd Backend/MetalQuoteTool-v5
pip install -r requirements.txt
cp .env.example .env
# Fill in your credentials in .env
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

Admin panel: http://localhost:8000

### Deployment
The backend is **offline only** — runs on the local office machine / LAN.
Never expose it to the public internet.

---

## Key Rules
- Never commit `.env` or `.env.local` — use `.env.example` as template
- Admin panel is accessible only on the local network
- Public website is deployed on Vercel
