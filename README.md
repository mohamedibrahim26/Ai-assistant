<div align="center">

```
 ██╗   ██╗███████╗██████╗  █████╗
 ██║   ██║██╔════╝██╔══██╗██╔══██╗
 ██║   ██║█████╗  ██████╔╝███████║
 ╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══██║
  ╚████╔╝ ███████╗██║  ██║██║  ██║
   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
```

**Your personal AI life companion — voice, memory, goals, and emotional intelligence in one app.**

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/LLM-Groq%20%7C%20Llama%203.1-F55036?logo=meta&logoColor=white)](https://groq.com)
[![ElevenLabs](https://img.shields.io/badge/TTS-ElevenLabs-000000)](https://elevenlabs.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## What is Vera?

Vera is a full-stack AI life companion — not a generic chatbot, but a personal assistant that knows you. She tracks your goals, reads your mood, remembers your story across sessions, and can hold a real-time voice conversation with you.

The core insight: most AI assistants are stateless and impersonal. Vera is the opposite — she builds a persistent memory of who you are, adapts her persona to your communication style, and gives you genuine accountability on the goals that matter most to you.

---

## Features

| Feature | Details |
|---|---|
| **Live voice calls** | Real-time two-way voice — Web Speech API (STT) + ElevenLabs TTS. Auto-restart on silence, emotion-matched responses. |
| **Long-term memory** | Conversations are periodically summarised into persistent memory. Vera references them in future sessions. |
| **Goal tracking** | Three tiers: 🔴 Locked In, 🟡 Wanting It, 🟢 Would Be Nice. Streak tracking, daily check-in nudges, missed-day counters. |
| **Mood tracking** | Daily mood check-ins (1–5 scale). 7-day mood history fed into Vera's context window. |
| **Push notifications** | Browser notifications at 9 AM and 8 PM for Locked In goals that haven't been checked in yet. |
| **30+ languages** | Vera always replies in the user's configured language, regardless of what language they type in. |
| **Adaptive persona** | Vera adapts her tone based on the user's gender — warm and nurturing for males, calm and grounding for females. |
| **Memory panel** | Users can view and edit everything Vera knows about them. |
| **Conversation search** | Full-text keyword search across all past messages. |
| **Progress log** | Per-goal progress notes with timestamps. |
| **Chat export** | Download full chat history as a formatted HTML file. |
| **Admin dashboard** | Overview of all users, mood trends, goal health, and low-mood / abandoned-goal alerts. |
| **PWA-ready** | Service worker + web app manifest — installable on desktop and mobile. |
| **Dark / light mode** | System-aware theme with manual toggle. |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                 │
│   (Vite + Tailwind CSS — port 5173)         │
│                                             │
│  ChatPage  DashboardPage  OnboardingPage    │
│  VoiceCall  GoalModal  MoodCheck  Sidebar   │
└──────────────────┬──────────────────────────┘
                   │ REST API (axios)
┌──────────────────▼──────────────────────────┐
│           Node.js / Express Backend          │
│               (port 3001)                   │
│                                             │
│  /chat/:id    /goals    /mood    /tts       │
│  /auth        /user     /admin  /insights   │
│                                             │
│  SQLite (node:sqlite — synchronous)         │
│  JWT auth · bcryptjs · node-cron            │
└──────────────────┬──────────────────────────┘
                   │ HTTP (internal)
┌──────────────────▼──────────────────────────┐
│        Python FastAPI AI Service            │
│               (port 8000)                   │
│                                             │
│  Provider-agnostic LLM router:              │
│    Groq → OpenAI → Anthropic → Ollama      │
│                                             │
│  RAG (ChromaDB) · Safety checks             │
│  Memory summarisation · Career roadmap      │
└─────────────────────────────────────────────┘
```

---

## Tech Stack

**Frontend**
- React 18 + Vite + Tailwind CSS
- Web Speech API (STT — continuous recognition with BCP-47 locale support, auto-restart on `no-speech`)
- ElevenLabs TTS (`eleven_turbo_v2_5` for English, `eleven_flash_v2_5` for others)
- PWA: Service Worker + Web App Manifest

**Backend**
- Node.js 22 + Express
- SQLite via `node:sqlite` (built-in — zero extra dependencies)
- JWT authentication + bcryptjs
- `node-cron` for daily check-ins and weekly recaps
- ElevenLabs TTS proxy with graceful fallback to Web Speech API synthesis

**AI Service (Python)**
- FastAPI + Pydantic
- Groq (primary: `llama-3.1-8b-instant`, 500k tokens/day — no billing required for normal usage)
- OpenAI, Anthropic, Ollama (fallback chain via tenacity)
- ChromaDB + sentence-transformers for RAG
- Provider-agnostic router — swap models without touching the Node backend

**AI / Prompt Design**
- System prompt engineered for emotional intelligence (~400 tokens — optimised for low latency)
- Voice mode: hard 25-word response limit, emotion-mirroring rules
- Consecutive-message deduplication before Groq calls (prevents API rejection on malformed history)
- Long-term memory via periodic summarisation stored in `memory_summaries` table
- Automated profile extraction from conversation (name, age, profession, gender, life context)

---

## Quick Start

### Prerequisites
- Node.js 22+
- Python 3.11+
- [Groq API key](https://console.groq.com) (free — 500k tokens/day on llama-3.1-8b-instant)
- (Optional) [ElevenLabs API key](https://elevenlabs.io) for voice — Starter plan required for library voices

### 1. Clone the repo

```bash
git clone https://github.com/mohamedibrahim26/Ai-assitant.git
cd Ai-assitant
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env   # then add your ELEVENLABS_API_KEY
npm install
```

`.env` format:
```
AI_SERVICE_URL=http://localhost:8000
PORT=3001
ELEVENLABS_API_KEY=your_key_here
```

### 3. Configure the AI service

```bash
cd ../ai-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
cp .env.example .env         # then add your GROQ_API_KEY
```

### 4. Start everything

**Windows — one click:**
```
Double-click start.bat
```

**Manual (any OS):**
```bash
# Terminal 1 — AI service
cd ai-service && python main.py

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## API Reference

### Chat
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/:userId` | Send a message. Body: `{ message, voiceMode? }` |
| `GET` | `/chat/:userId/history` | Fetch message history |
| `DELETE` | `/chat/:userId/history` | Clear all messages for a user |

### Goals
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/goals/:userId` | List active goals |
| `POST` | `/goals/:userId` | Create a goal (`{ title, tier, deadline?, description? }`) |
| `PATCH` | `/goals/:userId/:goalId/checkin` | Mark today's check-in |
| `PATCH` | `/goals/:userId/:goalId` | Update goal |
| `DELETE` | `/goals/:userId/:goalId` | Archive goal |

### Mood
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/mood/:userId` | Log mood score (1–5) |
| `GET` | `/mood/:userId` | Get mood history |

### TTS
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/tts` | Convert text to speech. Body: `{ text, language? }`. Returns `audio/mpeg`. |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register: `{ email, password, name }` |
| `POST` | `/auth/login` | Login: `{ email, password }` → `{ token, userId }` |

---

## Database Schema

```sql
users            — id, email, password_hash, name, age, gender, profession,
                   language, life_context, personality_notes, onboarded

messages         — id, user_id, role (user|assistant), content, created_at

goals            — id, user_id, title, description, tier, deadline, status,
                   streak, best_streak, days_missed, last_streak_date

moods            — id, user_id, score (1–5), note, created_at

memory_summaries — id, user_id, summary, message_count, period_start, period_end

goal_progress    — id, goal_id, user_id, note, created_at

invites          — id, inviter_id, invitee_email, status, created_at
```

---

## Voice Call Design

The voice pipeline runs with minimal server round-trips:

```
Microphone
  → Web Speech API  (continuous STT, BCP-47 locale)
  → POST /chat      (voiceMode: true)
  → Groq Llama 3.1  (25-word limit enforced in system prompt)
  → POST /tts       → ElevenLabs
  → AudioBuffer     → Speaker
```

Auto-restart on `no-speech` / `audio-capture` errors keeps the call alive during silence. Voice selection is language-aware: Rachel for English, Josh for all other languages.

---

## Project Structure

```
vera/
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/              # ChatPage, DashboardPage, LoginPage, OnboardingPage, AdminPage
│   │   ├── components/         # VoiceCall, GoalModal, MoodCheck, Sidebar, SearchBar, ...
│   │   ├── hooks/              # useVoice, useNotifications
│   │   └── api.js              # Axios client
│   ├── public/                 # manifest.json, sw.js (PWA)
│   └── vite.config.js
│
├── backend/                    # Node.js + Express
│   ├── routes/                 # chat, goals, mood, tts, auth, user, admin, insights, ...
│   ├── ai/
│   │   └── vera.js             # Vera brain: prompt builder, memory, profile extraction
│   ├── scheduler.js            # node-cron: daily check-ins, weekly recaps
│   ├── db.js                   # SQLite setup + schema migrations
│   └── server.js
│
├── ai-service/                 # Python FastAPI
│   ├── services/               # llm_service, rag_service, embedding_service, ...
│   ├── models/schemas.py       # Pydantic request / response models
│   ├── config.py               # Provider config + fallback chain
│   └── main.py
│
└── start.bat                   # One-click launcher (Windows)
```

---

## Roadmap

- [ ] Weekly recap message (every Sunday)
- [ ] Progress charts — mood trends, goal streaks visualised
- [ ] AI-powered goal suggestions from conversation history
- [ ] Voice cloning — personalise Vera's voice (ElevenLabs IVC)
- [ ] Mobile PWA — push notifications on iOS / Android
- [ ] Invite system — share Vera with friends and family

---

## Author

**Mohamed Ibrahim** — M.Tech, Computer Science & Engineering, VIT  
[GitHub](https://github.com/mohamedibrahim26) · [LinkedIn](https://linkedin.com/in/mohamedibrahim26) · ibrahim764566@gmail.com

---

## License

MIT — see [LICENSE](LICENSE).
