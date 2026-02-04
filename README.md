<div align="center">

<img src="public/famlink-logo.png" alt="FamLink Logo" width="200" />
<br />

**An AI-powered community platform connecting parents with trusted care providers**
<hr />

![Version](https://img.shields.io/badge/version-2.4-pink?style=for-the-badge)
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
MONGO_URI=mongodb://localhost:27017/famlink

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your_jwt_secret_here

# Server Port
PORT=3001

# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret

# Stripe Payment Processing
STRIPE_SECRET_KEY=your_key_here

# GeoDB API (Get from RapidAPI)
GEODB_API_KEY=your_rapidapi_key_here
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
> Server starts on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
> App opens at `http://localhost:5173` (Vite) or `http://localhost:3000`

---

## 🔑 API Keys Reference

| Service | Variable | Get Key | Purpose |
|:--------|:---------|:--------|:--------|
| **Google Gemini** | `VITE_GEMINI_API_KEY` | [Get Key](https://aistudio.google.com/app/apikey) | Primary AI for chat & assessment |
| **Perplexity** | `VITE_PPLX_API_KEY` | [Get Key](https://www.perplexity.ai/settings/api) | Research-focused AI fallback |
| **OpenRouter** | `VITE_OPENROUTER_API_KEY` | [Get Key](https://openrouter.ai/keys) | Free-tier AI model aggregator |
| **Stripe** | `STRIPE_SECRET_KEY` | [Get Key](https://dashboard.stripe.com/apikeys) | Payment processing |
| **GeoDB** | `GEODB_API_KEY` | [Get Key](https://rapidapi.com/wirefreethought/api/geodb-cities) | Location autocomplete |

---

## ✅ Project Status: v2.4 (Feb 2026)

| Layer | Status | Description |
|:------|:------:|:------------|
| **Frontend** | ✅ | Complete UI, API integration, Real-time Chat, Video Calls, Interactive Maps |
| **Backend** | ✅ | NestJS server with Secure Auth (Cookies), WebSocket Gateway, OAuth2, Payment Logic |
| **AI Services** | ✅ | Three-tier AI waterfall: OpenRouter → Gemini → Perplexity |
| **Security** | ✅ | HttpOnly Cookies, Helmet, Rate Limiting, Class Validator |
| **Testing** | 🔄 | Jest configuration in place, Cypress e2e setup |

---

## 🆕 Latest Updates (v2.4: Security & Video Chat)

### 1. 🛡️ Cookie-Guard Security Architecture
Migrated the entire authentication system from LocalStorage to **HttpOnly Cookies**.
- **Impact**: Zero-exposure of JWTs to client-side scripts (XSS protection).
- **Compliance**: `SameSite=Lax` (Dev) / `SameSite=None` + `Secure` (Prod).
- **Backend**: Strict validation via `class-validator` and `cookie-parser`.

### 2. 📹 Peer-to-Peer Video Chat
Direct, high-quality video calling between Parents and Nannies.
- **Tech**: WebRTC (PeerJS) + Socket.io (Signaling).
- **Features**: Picture-in-Picture, Mute/Video Toggle, Global Call Notifications.

### 3. 📅 Google Calendar Integration
Two-way synchronization for bookings.
- **Sync**: Automatically adds accepted FamLink bookings to your personal Google Calendar.
- **OAuth2**: Secure, verified Google connection via Settings.

### 4. ⚡ Previous Highlights
- **Universal Real-time Updates**: Instant UI reflection for Tasks, Bookings, and Outings.
- **Redesigned UI**: Enhanced Nanny Cards with quick-action buttons.
- **Complete Localization**: Full RTL/Arabic support.

---

## 🐛 Solved Engineering Challenges

<details>
<summary><strong>1. The "Cookie-Guard" Migration</strong></summary>

**Problem:** Storing JWTs in LocalStorage made the app vulnerable to XSS attacks.
**Solution:** Refactored the entire full-stack auth flow. Backend now sets HttpOnly cookies. Frontend uses `withCredentials: true` and verifies session via `/users/profile` endpoint instead of checking storage.
</details>

<details>
<summary><strong>2. The "Invalid Hook" Recursion</strong></summary>

**Problem:** A copy-paste error nested a `useEffect` inside another `useEffect` in the main App component, causing a "Rules of Hooks" violation crash.
**Solution:** Identified and removed the nested hook architecture, ensuring stable rendering.
</details>

<details>
<summary><strong>3. The "Yesterday" Date Bug</strong></summary>

**Problem:** Activity dates selected as "Feb 1st" were saving as `2026-02-01` (Midnight UTC), displaying as "Jan 31st" in US times.
**Solution:** Updated frontend storage logic to append `T12:00:00` (Noon) to date strings, ensuring timezone stability.
</details>

<details>
<summary><strong>4. OpenRouter Free Tier Volatility</strong></summary>

**Problem:** Free models like `llama-3.3-70b-instruct:free` often go offline.
**Solution:** Built a robust **Waterfall System** in `geminiService.ts`. It tries the user's preferred model first, then silently fails over to Gemini/Perplexity.
</details>

<details>
<summary><strong>5. The Reactivity Problem</strong></summary>

**Problem:** Deleting chat history or clearing bookings required a page refresh.
**Solution:** Implemented **TanStack React Query** with aggressive invalidation strategies for instant UI updates.
</details>

<details>
<summary><strong>6. The "Static" Chat Feel</strong></summary>

**Problem:** Messages appeared instantly with no weight.
**Solution:** Integrated **Framer Motion** `AnimatePresence`. Added a custom "Dancing Dots" component and spring physics to message bubbles.
</details>

<details>
<summary><strong>7. Duplicate Locale Keys</strong></summary>

**Problem:** `ar.ts` had duplicate keys causing TypeScript errors.
**Solution:** Automated audit script identified duplicates; manually resolved by removing redundant entries.
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

**FamLink** - *Empowering Mothers, Protecting Children*

</div>