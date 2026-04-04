# LifeOS 🧠

**Autonomous Productivity Orchestration System**

LifeOS connects to your Gmail and Google Calendar, uses AI to analyze emails, and automatically schedules deep work blocks — so your most important work always gets time on the calendar.

---

## What it does

| Feature | Description |
|---|---|
| 📧 **Email Intelligence** | Fetches your latest emails and classifies each with urgency, deadline, reply required, and a summary using Gemini AI |
| 📅 **Calendar Optimization** | Scans your calendar and inserts a deep work block before the nearest deadline |
| ✉️ **Reply Drafts** | Generates professional reply drafts for urgent emails — never auto-sends |
| 🚀 **Autonomous Mode** | Runs the full 8-step pipeline with one click; streams live progress to the UI |
| 🧪 **Dry Run** | Same pipeline without writing to your calendar — safe for demos |
| ⚙️ **Settings** | Configure working hours, timezone, and minimum block duration |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend | Node.js + Express |
| AI / LLM | Google Gemini (`gemini-flash-lite-latest`) — free tier |
| Google APIs | Gmail API + Google Calendar API |
| Auth | Google OAuth 2.0 |
| Streaming | Server-Sent Events (SSE) |

---

## Project Structure

```
lifeos/
├── backend/                  # Express API server
│   ├── api-wrappers/         # Gmail + Calendar API wrappers
│   ├── llm/                  # Gemini AI layer + prompts
│   ├── modules/              # emailIntel, scheduler, replyDraft, calendarManager
│   ├── orchestrator/         # 8-step autonomous pipeline
│   ├── routes/               # All REST endpoints
│   ├── config/               # Working hours config
│   ├── auth.js               # Google OAuth2 + token refresh
│   ├── server.js             # Express entry point
│   └── .env.example          # Environment variable template
│
└── frontend/                 # Next.js dashboard
    ├── app/
    │   ├── components/       # EmailIntelPanel, CalendarPanel, ReplyDraftPanel, ExecutionFeed, SettingsModal
    │   ├── dashboard/        # Main dashboard page
    │   └── globals.css       # Dark control-dashboard aesthetic
    └── lib/
        └── api.js            # Single source of truth for all API calls
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/AntarikshRanjan/Hackathon_CMRIT.git
cd Hackathon_CMRIT/lifeos
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your credentials in .env
```

Required environment variables (see `.env.example`):

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `GOOGLE_REDIRECT_URI` | Set to `http://localhost:4000/api/auth/callback` |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — free |
| `SESSION_SECRET` | Any random string |
| `PORT` | `4000` |

> Enable **Gmail API** and **Google Calendar API** in your GCP project.  
> Set OAuth consent screen to **External** and add your email as a test user.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm start

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:3000** → Sign in with Google → Start using LifeOS.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/google` | Start OAuth flow |
| `GET` | `/api/auth/status` | Check authentication |
| `GET` | `/api/emails/fetch` | Fetch latest 20 emails |
| `POST` | `/api/emails/analyze` | Analyze emails with Gemini |
| `GET` | `/api/calendar/events` | Fetch upcoming events |
| `POST` | `/api/calendar/schedule` | Compute optimal deep work block |
| `POST` | `/api/calendar/create` | Create event on Google Calendar |
| `POST` | `/api/reply/draft` | Generate a reply draft |
| `GET` | `/api/run` | Run full pipeline (SSE stream) |
| `GET` | `/api/config/hours` | Get working hours config |
| `POST` | `/api/config/hours` | Update working hours config |

---

## Architecture Principles

- **LLMs observe, code executes** — Gemini classifies and reasons; scheduling is purely deterministic
- **JSON is the only contract** — every module speaks structured JSON
- **No data stored** — emails and calendar data are fetched live every time
- **Modules are independent** — each can be tested and replaced in isolation

---

## Full Capability Details

See [CAPABILITIES.md](./CAPABILITIES.md) for a complete walkthrough of every feature.
