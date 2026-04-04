# LifeOS — Current Capabilities

> Last updated: 2026-02-27 | Stack: Next.js · Express · Google APIs · Gemini AI

---

## 🔐 Authentication
- Sign in with Google via OAuth 2.0
- Session persists across page refreshes
- Access tokens auto-refresh before expiry
- Required scopes: Gmail (read-only) + Google Calendar (read/write)

---

## 📧 Email Intelligence

**Fetch**
- Pulls your 20 most recent Gmail emails in real time
- Extracts: subject, sender, snippet, timestamp

**AI Analysis (Gemini)**  
Every email is classified with:
| Field | What it returns |
|---|---|
| `urgency` | `true` if action needed within ~48h |
| `deadline` | ISO date if explicitly mentioned, else `null` |
| `replyRequired` | `true` if a reply is expected |
| `actionItem` | One-line description of what needs doing |
| `summary` | 1–2 sentence plain-English summary |

- All 20 emails sent in a **single batched AI call** (efficient, no rate limit issues)
- Results displayed in the Email Intelligence Panel with urgency badges, deadline chips, and action items

---

## 📅 Calendar Optimization

**Fetch Events**
- Retrieves all your Google Calendar events for the next 5 days

**Deterministic Scheduler**
- Finds the best available deep work block in your calendar
- Respects working hours (default: 09:00–18:00 UTC)
- Avoids all existing events
- Targets the nearest detected email deadline
- Returns a specific start/end time with a plain-English reason
- Returns `null` with an explanation if calendar is fully booked

**Create Event**
- One click creates a real **"LifeOS: Deep Work Block"** event on Google Calendar
- Returns a direct link to the event

---

## ✉️ Reply Drafts
- Identifies emails that are both urgent AND require a reply
- Generates a professional, context-aware draft reply for each one
- Each draft is shown in the Reply Drafts panel with a **Copy** button
- Drafts are **never auto-sent** — always require manual review

---

## 🚀 Autonomous Mode (Full Pipeline)

Runs the complete 8-step pipeline with a single button click:

```
Step 1 → Fetch 20 emails from Gmail
Step 2 → Analyze all emails with Gemini AI
Step 3 → Extract nearest deadline
Step 4 → Fetch calendar events
Step 5 → Compute optimal deep work block
Step 6 → Create event on Google Calendar
Step 7 → Generate reply drafts for urgent emails
Step 8 → Assemble full execution report
```

- Each step **streams live to the UI** via Server-Sent Events (SSE)
- If any one step fails, the pipeline continues with the rest
- Final execution summary shows counts: emails, urgent, events, drafts

---

## 🧪 Dry Run Mode
- Runs the full pipeline (all reasoning steps) but **skips calendar event creation**
- Safe for demos and testing
- Clearly logged as `dryRun: true` in the execution feed

---

## ⚙️ Settings — Working Hours
Configurable via the Settings panel:
| Setting | Default |
|---|---|
| Start time | `09:00` |
| End time | `18:00` |
| Timezone | `UTC` |
| Min block duration | `60 min` |

Changes take effect immediately for all future scheduling decisions.

---

## 🏗️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend | Node.js + Express |
| AI / LLM | Google Gemini (`gemini-flash-lite-latest`) — **free tier** |
| Google APIs | Gmail API + Google Calendar API |
| Auth | Google OAuth 2.0 |
| Streaming | Server-Sent Events (SSE) |

---

## 🚦 Running the App

```bash
# Terminal 1 — Backend (port 4000)
cd lifeos/backend && npm start

# Terminal 2 — Frontend (port 3000)
cd lifeos/frontend && npm run dev
```

Open: **http://localhost:3000**

---

## ⚠️ Known Limitation
- **GCP OAuth `org_internal` error:** If your GCP project is tied to a Google Workspace organisation, personal Gmail accounts are blocked from signing in. Fix: create a new GCP project under your personal Gmail account at [console.cloud.google.com](https://console.cloud.google.com).
