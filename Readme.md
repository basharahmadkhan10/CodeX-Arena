# ⚔️ CodeX Arena

> **Real-Time 1v1 Competitive Coding Platform**

CodeX Arena is a scalable, full-stack web application where developers compete head-to-head on algorithmic problems with live matchmaking, real-time submissions, anti-cheat enforcement, and dynamic Elo-based ranking.

---

## ✨ Features

### 🎮 Battle System
- **Real-time 1v1 Coding Duels** — Live matchmaking with automatic opponent pairing
- **Debugging Mode** — Pre-written buggy solutions that players must fix and correct
- **Room Battle Mode** — Private rooms where friends can host and join custom battles
- **Clash Royale-style VS Preloader** — Epic animated battle intro before every match
- **Synchronized Game Start** — Both players enter the arena at the same time with reconnect support

### 🛡️ Anti-Cheat & Security
- **Fullscreen Enforcement** — Players must stay in fullscreen; exits are tracked and penalized
- **Tab Switch Detection** — `visibilitychange` + `document.hasFocus()` polling (every 5s)
- **Auto-Disqualification** — After exceeding violation thresholds with reason shown to both players
- **Copy/Paste Blocking** — Disabled at DOM level and inside the Monaco Editor
- **DevTools Detection** — Window size delta threshold check
- **Keyboard Shortcut Blocking** — F12, Ctrl+U, Ctrl+Shift+I, and more are intercepted

### 🏆 Ranking System
- **Elo-Based Rating** — Win: +50 | Loss: −25 | Draw: +5
- **6 Rank Tiers** — Novice → Apprentice → Warrior → Expert → Master → Grandmaster (≥2000 RP)
- **Live Leaderboard** — Consistent ranking display synced between profile and leaderboard

### 🔐 Authentication
- **OTP Email Verification** — 6-digit code via Resend API (Render-compatible, no Gmail delays)
- **Two-Step Registration** — Register → Verify OTP → Account Created
- **JWT Auth** — Access tokens (15m) + Refresh tokens (10d)
- **Google OAuth** — One-click sign-in support

### 🖥️ Code Editor
- **Monaco Editor** — VS Code-grade editor inside the browser
- **Multi-Language Support** — JavaScript, Python, Java, C++, C
- **Run Code** — Test against custom inputs before submitting
- **Submission Judging** — Runs against all test cases (public + hidden) via JDoodle / Judge0

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Vite, Zustand, Framer Motion |
| **Styling** | Vanilla CSS + Tailwind CSS |
| **Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Backend** | Node.js, Express.js |
| **Real-time** | Socket.io |
| **Database** | MongoDB Atlas (Mongoose) |
| **Auth** | JWT (access + refresh), Google OAuth |
| **Email** | Resend API |
| **Code Execution** | JDoodle API / Judge0 RapidAPI |

---

## 🏗️ Architecture Overview

```
Client (React + Vite)
  │
  ├── Zustand Stores (authStore, battleStore)
  ├── Socket.io Client
  └── REST API (Axios / Fetch)
         │
         ▼
  Express.js Server
  ├── REST Routes  (/api/auth, /api/battles, /api/problems)
  ├── Socket Handlers
  │   ├── matchmaking.socket.js  — Queue, pairing, rejoin
  │   ├── battle.socket.js       — Submit, run, forfeit, disconnect grace
  │   └── room.socket.js         — Private room management
  ├── Services
  │   ├── battle.service.js      — endBattle, rating update
  │   ├── matchmaking.service.js — Queue logic, timers
  │   └── codeExecution.service.js
  └── MongoDB Atlas
      ├── User  (rating, rank, wins, losses, draws)
      ├── Battle (participants, results, roomId)
      ├── Problem (testCases, starterCode, mode)
      └── Otp  (temporary OTP storage, TTL 5m)
```

---

## 🚀 Getting Started

### 1. Clone the Repo
```bash
git clone https://github.com/basharahmadkhan10/CodeX-Arena
cd CodeX-Arena
```

### 2. Backend Setup
```bash
cd CodeX-backend/backend
npm install
```

Create `.env`:
```env
PORT=9000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/CodeXarena

JWT_SECRET=<your_secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<your_refresh_secret>
JWT_REFRESH_EXPIRES_IN=10d

GOOGLE_CLIENT_ID=<your_google_client_id>

RESEND_API_KEY=<your_resend_api_key>

JDOODLE_CLIENT_ID=<your_jdoodle_id>
JDOODLE_CLIENT_SECRET=<your_jdoodle_secret>
JUDGE0_API_KEY=<your_judge0_key>
```

```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd CodeX-frontend/frontend
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:9000
```

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 📋 Environment Variables Summary

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `RESEND_API_KEY` | ✅ | Email OTP delivery (get at resend.com) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth sign-in |
| `JDOODLE_CLIENT_ID/SECRET` | Optional | Code execution provider |
| `JUDGE0_API_KEY` | Optional | Alternative code execution provider |

---

## 🐛 Known Fixes (Latest Commit)

- ✅ Fixed infinite VS preloader caused by stale `useEffect` dependency
- ✅ Fixed fullscreen gate appearing on battle start (incorrect initial state)
- ✅ Fixed stale closure bug in `visibilitychange` / focus polling
- ✅ Fixed rank inconsistency between leaderboard and player profile
- ✅ Fixed matchmaking desync — both players now enter battle simultaneously
- ✅ Added Resend API OTP verification (replaces unreliable Gmail SMTP on Render)
- ✅ Players now see exact reason for loss (tab switch, fullscreen exit, etc.)

---

## 📄 License

MIT — built by [Bashar Ahmad Khan](https://github.com/basharahmadkhan10)
