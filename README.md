<div align="center">

<img src="public/famlink-logo.png" alt="FamLink Logo" width="200" />
<br />

**An AI-powered community platform connecting parents with trusted care providers**
<hr />

![Version](https://img.shields.io/badge/version-2.5-pink?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)

[Features](#-features-overview) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Challenges](#-solved-engineering-challenges)

</div>

---

## 📖 Overview

FamLink is a comprehensive, community-driven mobile web application designed to **empower parents** and connect families with trusted care providers. It combines AI-powered vetting, community sharing features, and a robust marketplace to relieve the mental load of parenthood.

### Key Highlights

- 🛡️ **AI-Powered Nanny Vetting** - 50-question assessment evaluated by multi-model AI (Gemini, Perplexity, OpenRouter)
- 💬 **Real-time Messaging** - End-to-end encrypted chat with read receipts, reactions, and replies
- 📹 **Video Chat** - High-quality Peer-to-Peer video calls between families and nannies
- 🌍 **Multilingual Support** - 6 languages (English, French, Spanish, Japanese, Chinese, Arabic) with RTL support
- 🤖 **AI Assistant** - Context-aware chatbot with streaming responses and keyboard shortcuts
- 📅 **Google Calendar Sync** - Two-way synchronization for seamless booking management
- 🔒 **Cookie-Guard Security** - HttpOnly cookies for maximum protection against XSS

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Purpose |
|:------------|:--------|:--------|
| **Node.js** | v18+ | JavaScript runtime |
| **MongoDB** | v7+ | Database (local or Atlas) |
| **npm** | v9+ | Package manager |

### 1. Clone the Repository

```bash
git clone https://github.com/Moubarak-01/FamLink.git
cd FamLink
```

### 2. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..

# Local Whisper dependencies
cd local-whisper
npm install
cd ..
```

### 3. Configure Environment Variables

**Frontend (`.env.local` in root):**

```env
# Google Gemini API (Primary AI)
VITE_GEMINI_API_KEY=your_key_here

# Perplexity AI (Fallback)
VITE_PPLX_API_KEY=your_key_here

# OpenRouter (Free Tier AI)
VITE_OPENROUTER_API_KEY=your_key_here
```

**Backend (`backend/.env`):**

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=Cluster0
# OR for local: mongodb://localhost:27017/famlink

# JWT Secret
JWT_SECRET=your_secure_jwt_secret

# Server Port
PORT=3001

# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/calendar/callback

# Google Calendar Redirect URI (Important for OAuth)
GOOGLE_REDIRECT_URI=http://localhost:3001/calendar/callback

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_...

# GeoDB API (RapidAPI)
GEODB_API_KEY=your_api_key
GEODB_API_HOST=wft-geo-db.p.rapidapi.com

# Email Service (Resend) - REQUIRED to prevent crash
MAIL_API_KEY=re_123...
```

### 4. Start the Application

**Terminal 1 - Backend & Voice AI:**
```bash
cd backend
npm run start:dev
```
> Starts NestJS Server (`http://localhost:3001`) AND Local Whisper Service (`http://localhost:3002`)

**Terminal 2 - Frontend:**
```bash
npm run dev
```
> App opens at `http://localhost:5173` or `http://localhost:3000`

---


## 🔑 API Keys Reference

| Service | Variable | Get Key | Purpose |
|:--------|:---------|:--------|:--------|
| **Google Gemini** | `VITE_GEMINI_API_KEY` | [Get Key](https://aistudio.google.com/app/apikey) | Primary AI for chat & assessment |
| **Perplexity** | `VITE_PPLX_API_KEY` | [Get Key](https://www.perplexity.ai/settings/api) | Research-focused AI fallback |
| **OpenRouter** | `VITE_OPENROUTER_API_KEY` | [Get Key](https://openrouter.ai/keys) | Free-tier AI model aggregator |
| **Stripe** | `STRIPE_SECRET_KEY` | [Get Key](https://dashboard.stripe.com/apikeys) | Payment processing |
| **GeoDB** | `GEODB_API_KEY` | [Get Key](https://rapidapi.com/wirefreethought/api/geodb-cities) | Location autocomplete |
| **Resend** | `MAIL_API_KEY` | [Get Key](https://resend.com/api-keys) | Email notifications |
| **Google Cloud** | `GOOGLE_CLIENT_ID` | [Get Key](https://console.cloud.google.com/apis/credentials) | Calendar OAuth & Auth |
| **MongoDB** | `MONGO_URI` | [Get Key](https://cloud.mongodb.com/) | Database Connection |

---



## ✅ Project Status: v2.5 (Feb 2026)

| Layer | Status | Description |
|:------|:------:|:------------|
| **Frontend** | ✅ | Complete UI, API integration, Real-time Chat, Video Calls, Interactive Maps |
| **Backend** | ✅ | NestJS server with Secure Auth (Cookies), WebSocket Gateway, OAuth2, Payment Logic |
| **AI Services** | ✅ | Three-tier AI waterfall: OpenRouter → Gemini → Perplexity |
| **Security** | ✅ | HttpOnly Cookies, Helmet, Rate Limiting, Class Validator |
| **Testing** | 🔄 | Jest configuration in place, Cypress e2e setup |

---

## 🆕 Latest Updates (v2.5: Premium Payment Experience)

### 1. 💳 Interactive 3D Payment Card
A stunning, premium credit card component with live interactivity.
- **3D Flip Animation**: Card flips to reveal CVV field on focus (Framer Motion spring physics).
- **Live Input Masking**: Shows first 4 + last 2 digits only (e.g., `4012 **** **87`).
- **Auto Brand Detection**: Dynamically displays Visa, Mastercard, Amex, or Discover logos.
- **5 Premium Themes**: Midnight, Ocean, Sunset, Gold, Royal — each with fluid marble/abstract art gradients.
- **Strict Validation**: CVV limited to exactly 3 digits.

### 2. 🛡️ Cookie-Guard Security Architecture
Migrated the entire authentication system from LocalStorage to **HttpOnly Cookies**.
- **Impact**: Zero-exposure of JWTs to client-side scripts (XSS protection).
- **Compliance**: `SameSite=Lax` (Dev) / `SameSite=None` + `Secure` (Prod).
- **Backend**: Strict validation via `class-validator` and `cookie-parser`.

### 3. 📹 Peer-to-Peer Video Chat
Direct, high-quality video calling between Parents and Nannies.
- **Tech**: WebRTC (PeerJS) + Socket.io (Signaling).
- **Features**: Picture-in-Picture, Mute/Video Toggle, Global Call Notifications.

### 4. 📅 Google Calendar Integration
Two-way synchronization for bookings.
- **Sync**: Automatically adds accepted FamLink bookings to your personal Google Calendar.
- **OAuth2**: Secure, verified Google connection via Settings.

### 5. 🌐 Advanced Localization & Notifications
Deep internationalization for dynamic content.
- **Dynamic Localization**: All system notifications (Bookings, Outings, Tasks) now support placeholder interpolation (e.g., "{{nannyName}} accepted your request").
- **Language Coverage**: Full support for 6 languages with RTL optimization for Arabic.
- **Chat Reactions**: WhatsApp-style reaction notifications ("User reacted with emoji") are now fully localized.

### 7. ✨ UI/UX Overhaul (Feb 19 Update)
Major aesthetic and functional upgrade inspired by premium design systems (Stripe, Lusion).
- **Magnetic Cards**: Dashboard elements now have a tactile "magnetic" pull, following the cursor for a weighted, physical feel.
- **Contextual AI Palette**: Implemented `Cmd+K` (or `Ctrl+K`) global shortcut to instantly toggle the AI Assistant from anywhere.
- **Staggered Motion**: Dashboard elements now enter with a smooth, staggered animation sequence using Framer Motion.
- **Refined Glassmorphism**: Updated the design language with subtle borders (`border-white/10`) and premium gradients (`bg-gradient-to-br`) for a deeper, modern look.
- **Progressive Disclosure**: Nanny cards are cleaner, hiding complex actions until hover, with a pulsing "Online" indicator for active users.

### 8. ⚡ Previous Highlights
- **Interactive 3D Payment Card**: A stunning, premium credit card component with live interactivity.
- **Cookie-Guard Security**: HTTPOnly Cookie architecture.
- **Universal Real-time Updates**: Instant UI reflection for Tasks, Bookings, and Outings.

---

## 🐛 Solved Engineering Challenges

<details>
<summary><strong>1. The "Cookie-Guard" Migration</strong></summary>

**Problem:** 
Storing JWTs in LocalStorage made the app vulnerable to XSS attacks.

**Solution:** 
Refactored the entire full-stack auth flow. Backend now sets HttpOnly cookies. Frontend uses `withCredentials: true` and verifies session via `/users/profile` endpoint instead of checking storage.
</details>

<details>
<summary><strong>2. The "Invalid Hook" Recursion</strong></summary>

**Problem:** 
A copy-paste error nested a `useEffect` inside another `useEffect` in the main App component, causing a "Rules of Hooks" violation crash.

**Solution:** 
Identified and removed the nested hook architecture, ensuring stable rendering.
</details>

<details>
<summary><strong>3. The "Yesterday" Date Bug</strong></summary>

**Problem:** 
Activity dates selected as "Feb 1st" were saving as `2026-02-01` (Midnight UTC), displaying as "Jan 31st" in US times.

**Solution:** 
Updated frontend storage logic to append `T12:00:00` (Noon) to date strings, ensuring timezone stability.
</details>

<details>
<summary><strong>4. OpenRouter Free Tier Volatility</strong></summary>

**Problem:** 
Free models like `llama-3.3-70b-instruct:free` often go offline.

**Solution:** 
Built a robust **Waterfall System** in `geminiService.ts`. It tries the user's preferred model first, then silently fails over to Gemini/Perplexity.
</details>

<details>
<summary><strong>5. The Reactivity Problem</strong></summary>

**Problem:** 
Deleting chat history or clearing bookings required a page refresh.

**Solution:** 
Implemented **TanStack React Query** with aggressive invalidation strategies for instant UI updates.
</details>

<details>
<summary><strong>6. The "Static" Chat Feel</strong></summary>

**Problem:** 
Messages appeared instantly with no weight.

**Solution:** 
Integrated **Framer Motion** `AnimatePresence`. Added a custom "Dancing Dots" component and spring physics to message bubbles.
</details>

<details>
<summary><strong>7. Duplicate Locale Keys</strong></summary>

**Problem:** 
`ar.ts` and other locale files had duplicate keys causing TypeScript errors and unpredictable translation behavior.

**Solution:** 
Built an automated audit script to identify duplicates across all language files; manually resolved by removing redundant entries.
</details>

<details>
<summary><strong>8. The "Button Clear History" Bug</strong></summary>

**Problem:** 
The call history button displayed "Button Clear History" (the raw key) instead of "Clear History" in English.

**Solution:** 
Identified that the key was present in other languages but missing in `en.ts`. Added the correct translation to the English locale file to fix the UI fallback issue.
</details>

<details>
<summary><strong>9. Static Notification Messages</strong></summary>

**Problem:** 
While the UI was localized, system notifications were hardcoded in the backend. Setting the language to French still showed English notifications in the bell icon.

**Solution:** 
Refactored the notification system to store metadata (JSON data) in the database. The frontend now uses these parameters to render fully localized, dynamic messages for all notification types.
</details>

<details>
<summary><strong>10. The Query Key Mismatch (Real-time Tasks)</strong></summary>

**Problem:** 
When a nanny completed a task, the parent's dashboard didn't update. Users had to manually refresh the page to see changes.

**Solution:** 
The socket listener was invalidating `['userTasks']` but the React Query hook used `['tasks', userId]`. Fixed by changing the invalidation to `['tasks']` which matches the hook's query key prefix.
</details>

<details>
<summary><strong>11. Unreachable Socket Emit (Bookings)</strong></summary>

**Problem:** 
New booking requests weren't triggering real-time updates for nannies.

**Solution:** 
Found a duplicate `return` statement in `bookings.service.ts` that made the `socket.emit('bookings_update')` call unreachable. Removed the duplicate return.
</details>

<details>
<summary><strong>12. Stale Read Receipts</strong></summary>

**Problem:** 
Chat "blue ticks" would only update if you re-entered the room.

**Solution:** 
Added a live `onMessage` listener that checks if the user is currently viewing the room. If yes, it fires a `mark_seen` event immediately, turning the sender's ticks blue in real-time.
</details>

<details>
<summary><strong>13. Notification Click Missing Invalidation</strong></summary>

**Problem:** 
Clicking task/outing/skill notifications navigated to the correct screen but often showed stale data.

**Solution:** 
Added `queryClient.invalidateQueries()` calls for each notification type before navigation, ensuring fresh data is forced to load.
</details>

<details>
<summary><strong>14. Nanny Visibility on Parent Dashboard</strong></summary>

**Problem:** 
Nannies weren't appearing on the parent dashboard even after completing their profiles until a manual refresh.

**Solution:** 
The `approvedNannies` state was initialized but never populated on app startup. Added a `useEffect` hook to fetch nannies via `userService.getNannies()` when a user logs in.
</details>

<details>
<summary><strong>15. Silent Remove Button</strong></summary>

**Problem:** 
The "Remove Nanny" button had no visual feedback - it worked but users thought nothing happened.

**Solution:** 
Added confirmation dialog (`window.confirm`) and success alert to `handleRemoveNanny`, providing clear feedback and styled the buttons with hover animations.
</details>

<details>
<summary><strong>16. The "Rollup Shim" Build Failure</strong></summary>

**Problem:** 
Production builds were failing with `Rollup failed to resolve import "vite-plugin-node-polyfills/shims/process"`, stopping deployment.

**Solution:** 
The default polyfill configuration wasn't resolving correctly in the nested `node_modules` structure. We implemented a custom `alias` strategy in `vite.config.ts` to point explicitly to the `dist/index.js` entry point of the process shim, ensuring a clean and stable build.
</details>

<details>
<summary><strong>17. The "Legacy Peer Deps" Conflict</strong></summary>

**Problem:** 
`npm install` failed with `ERESOLVE` due to a peer dependency conflict between `@react-three/fiber` and `framer-motion-3d`.

**Solution:** 
Initially used `--legacy-peer-deps` as a workaround. Ultimately resolved by removing the unused 3D libraries entirely, allowing for a standard, clean installation.
</details>

<details>
<summary><strong>18. The "Missing API Key" Crash</strong></summary>

**Problem:** 
The backend would crash on startup with `Error: Missing API key` from the Resend email service.

**Solution:** 
Identified that `MAIL_API_KEY` was missing from `.env`. Added strict environment validation and provided a dummy key (`re_123`) for development environments to bypass the crash.
</details>

<details>
<summary><strong>19. MongoDB Connection Refused</strong></summary>

**Problem:** 
Local development often hit `MongooseServerSelectionError: connect ECONNREFUSED ::1:27017` due to IPv6/IPv4 mismatch.

**Solution:** 
Explicitly configured the connection string to use `127.0.0.1` instead of `localhost`, ensuring reliable connection to the local MongoDB instance.
</details>

<details>
<summary><strong>20. The "Redirect URI Mismatch" Error</strong></summary>

**Problem:** 
Google OAuth login failed with `redirect_uri_mismatch` after deployment.

**Solution:** 
Harmonized the `GOOGLE_CALLBACK_URL` in `.env` to match exactly what is registered in the Google Cloud Console, correcting the discrepancy between local `localhost` and production URLs.
</details>

---

## 🚀 Tech Stack

### Frontend

| Technology | Version | Purpose |
|:-----------|:-------:|:--------|
| **React** | 19.0 | UI Framework |
| **TypeScript** | 5.8 | Type-safe JavaScript |
| **Vite** | 6.2 | Build tool & Dev server |
| **Tailwind CSS** | - | Utility-first styling |
| **Framer Motion** | 11.0 | Animations & gestures |
| **TanStack React Query** | 5.0 | Server state management |
| **Socket.io Client** | 4.7 | Real-time communication |
| **PeerJS** | 1.5 | WebRTC Video Chat |

### Backend

| Technology | Version | Purpose |
|:-----------|:-------:|:--------|
| **NestJS** | 10.0 | Server framework |
| **MongoDB (Mongoose)** | 8.0 | Database & ODM |
| **Passport JWT** | 4.0 | Authentication (Cookie-based) |
| **Class Validator** | 0.14 | DTO Validation |
| **Google APIs** | 126.0 | Calendar Integration |
| **Stripe** | 14.0 | Payment processing |

---

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---------|:-------|
| **Cmd + K** / **Ctrl + K** | Toggle AI Assistant |
| **Shift + N** | Toggle AI Sidebar |
| **Shift + P** | Open Settings |
| **Shift + A** | Toggle UI Visibility |
| **Ctrl + D** | Clear Chat History |

---

## 🌟 Features Overview

### 🛡️ Safety & Trust

| Feature | Description |
|:--------|:------------|
| **AI-Powered Assessment** | 50-question exam evaluated by multi-model AI |
| **Cookie-Guard Auth** | HttpOnly, Secure, SameSite cookies for top-tier security |
| **Video Vetting** | In-app video calling to interview candidates before meeting |

### 🤖 AI Assistant

| Feature | Description |
|:--------|:------------|
| **Context-Aware** | Knows current screen and user context |
| **Streaming Responses** | Real-time text generation |
| **Multilingual** | Responds in user's selected language |

### 👥 Community & Marketplace

| Module | Features |
|:-------|:---------|
| **Mom-to-Mom Activities** | Schedule walks, playdates, workouts |
| **Child Outings** | Coordinate group outings with cost sharing |
| **Skill Marketplace** | Post tasks and receive offers |

---

## 👨‍💻 Author

**Moubarak**
- GitHub: [@Moubarak-01](https://github.com/Moubarak-01)

---

<div align="center">

Made with ❤️ for families everywhere

**FamLink** - *Relieve Parents, Empower Families.*

</div>