# FamLink ✨

<div align="center">

![Version](https://img.shields.io/badge/version-2.0-pink?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)

**An AI-powered community platform connecting parents with trusted care providers**

[Features](#-features-overview) • [Tech Stack](#-tech-stack) • [Installation](#-installation--setup) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

FamLink is a comprehensive, community-driven mobile web application designed to **empower parents** and connect families with trusted care providers. It combines AI-powered vetting, community sharing features, and a robust marketplace to relieve the mental load of parenthood.

### Key Highlights

- 🛡️ **AI-Powered Nanny Vetting** - 50-question assessment evaluated by multi-model AI (Gemini, Perplexity, OpenRouter)
- 💬 **Real-time Messaging** - End-to-end encrypted chat with read receipts, reactions, and replies
- 🌍 **Multilingual Support** - 6 languages (English, French, Spanish, Japanese, Chinese, Arabic)
- 🤖 **AI Assistant** - Context-aware chatbot with streaming responses and keyboard shortcuts
- 💳 **Subscription System** - Stripe-integrated payment processing

---

## ✅ Project Status: Core Implementation Complete (v2.0)

The application is fully architected and implemented with a **React Frontend** and **NestJS Backend**.

| Layer | Status | Description |
|:------|:------:|:------------|
| **Frontend** | ✅ | Complete UI, API integration, Real-time Chat, Interactive Maps, Multilingual support |
| **Backend** | ✅ | Full NestJS server with Authentication, MongoDB, WebSockets, Payment Logic (Stripe) |
| **AI Services** | ✅ | Three-tier AI waterfall: OpenRouter → Gemini → Perplexity |
| **Testing** | 🔄 | Jest configuration in place, Cypress e2e setup |

---

## 🆕 Latest Updates (v2.0: The "Ultra-Reactivity" Upgrade)

### 1. ⚡ "Ultra-Reactivity" Engine (React Query Migration)
Moved the entire data layer from legacy `useState`/`useEffect` to **TanStack React Query**.
*   **Instant Feedback:** Actions like booking requests, message sending, and history deletion are now reflected immediately via **Optimistic Updates**.
*   **Smart Caching:** Data is cached and automatically invalidated when backend events occur (via Socket.io).
*   **No More Manual Refreshing:** Fixed the "Status Lag" where users had to refresh to see new bookings or cleared history.

### 2. 💬 WhatsApp-Grade Messaging Experience
A complete overhaul of the chat interface to match premium standards:
*   **dancing Typing Bubbles:** A smooth, 3-dot animation appears at the bottom when the other person is typing (or drafting a message).
*   **Blue Ticks (Read Receipts):** Ticks turn blue *instantly* when the recipient is viewing the chat, triggered by real-time `mark_seen` events.
*   **Spring Animations:** Messages slide up with a physical "spring" feel (stiffness: 500, damping: 30) instead of just popping in.
*   **Smart Typing Logic:** Typing status persists even if the user loses focus but has text in the input bar (drafting mode).

### 3. Three-Tier AI Stability Architecture
The application now uses a robust multi-provider AI fallback system:

| Tier | Provider | Models | Purpose |
|:----:|:---------|:-------|:--------|
| **1** | OpenRouter | 10 free models (Llama 4, Gemini 3, DeepSeek R1T2, etc.) | Primary - Cost-free tier |
| **2** | Google Gemini | gemini-2.5-flash, gemma-3-* variants | Secondary - High-quality fallback |
| **3** | Perplexity | sonar, sonar-reasoning-pro, sonar-deep-research | Tertiary - Research-focused backup |

### 4. Global Keyboard Shortcuts
| Shortcut | Action |
|:---------|:-------|
| `Shift + N` | Toggle AI Chat Open/Close |
| `Shift + A` | Toggle AI Assistant Visibility |
| `Ctrl + D` | Clear AI Chat History |

---

## 🆕 Latest Updates (v2.1: The AI & Polish Upgrade) - Feb 2026

### 1. 🧠 Advanced AI & Telemetry
*   **Smart Model Waterfall:** Prioritizes **Meta Llama 3.3 70B** for best logic, falling back to **Gemini 2.0 Flash** and **Z.AI GLM 4.5** if the free tier is busy.
*   **Backend Telemetry:** Every AI attempt and failure is now logged to the backend console (`[Telemetry] ai_attempt: ...`), giving complete visibility into the waterfall process.
*   **Voice Input 2.0:** Voice transcription now intelligently **appends** to your existing text instead of overwriting it, allowing for multi-sentence composition.

### 2. 🎨 "Moubely" Visual Style & Math
*   **Pink Emphasis:** Bold text in AI responses now renders in a distinct **Pink** highlight, improving readability and visual flair.
*   **LaTeX Math Support:** Integrated `remark-math` and `rehype-katex` to render beautiful mathematical formulas (e.g., $E=mc^2$) directly in the chat.

### 3. 📅 Precision Date Handling
*   **Timezone Fix:** Solved the "Off-by-One Day" bug by forcing all activity dates to **Noon UTC**. This ensures dates remain stable regardless of whether the user is in the US, Europe, or Asia.

---

## 🔧 Challenges Faced & Solutions

### 🔴 The "Yesterday" Date Bug
**The Issue:**
Activity dates selected as "Feb 1st" were saving as `2026-02-01`. JavaScript parses this string as "Midnight UTC". For users in the US (e.g., EST), "Midnight UTC" is "7 PM Yesterday", causing the UI to display "Jan 31st".
**The Solution:**
We updated the frontend storage logic to append `T12:00:00` (Noon) to date strings. This places the timestamp safely in the middle of the day, so timezone offsets (+/- 12h) never shift the calendar date.

### 🔴 OpenRouter Free Tier Volatility
**The Issue:**
Free models like `llama-3.3-70b-instruct:free` are hosted by volunteers and often go offline, returning `404 Not Found` or `400 Bad Request`.
**The Solution:**
We built a robust **Waterfall System** in `geminiService.ts`. It tries the user's preferred model (Llama) first. If it fails (caught via specific error codes), it silently retries with the next best model (Gemini/Z.AI/Nvidia), ensuring the user always gets an answer.

### 🔴 The Reactivity Problem
**The Issue:**
In v1.8, deleting chat history or clearing bookings required a page refresh. The UI state was disconnected from the server state.
**The Solution:**
Implemented **TanStack React Query** with aggressive invalidation strategies. Now, `queryClient.setQueryData` updates the UI *instantly* (optimistic), while `invalidateQueries` ensures the server data is synced in the background.

### 🔴 The "Static" Chat Feel
**The Issue:**
Messages appeared instantly with no weight, and typing indicators were just plain text ("User is typing..."). It felt "cheap."
**The Solution:**
Integrated **Framer Motion** `AnimatePresence`. Added a custom "Dancing Dots" component for typing, and applied "Spring" physics to every message bubble. Also enforced strict input contrast modes for readability.

### 🔴 Stale Read Receipts
**The Issue:**
Blue ticks would only update if you re-entered the room.
**The Solution:**
Added a live `onMessage` listener that checks if the user is currently viewing the room. If yes, it fires a `mark_seen` event immediately, turning the sender's ticks blue in real-time.

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
| **React Three Fiber** | 9.5 | 3D graphics |
| **Socket.io Client** | 4.7 | Real-time communication |
| **React Markdown** | 10.1 | Markdown rendering |
| **Axios** | 1.13 | HTTP client |

### Backend

| Technology | Version | Purpose |
|:-----------|:-------:|:--------|
| **NestJS** | 10.0 | Server framework |
| **MongoDB (Mongoose)** | 8.0 | Database & ODM |
| **Socket.io** | 4.7 | WebSocket server |
| **Passport JWT** | 4.0 | Authentication |
| **Stripe** | 14.0 | Payment processing |
| **bcrypt** | 6.0 | Password hashing |
| **Axios** | 1.13 | External API calls |

### AI & External APIs

| Service | Purpose |
|:--------|:--------|
| **Google Gemini** | Primary AI for assessment & chat |
| **Perplexity AI** | Fallback AI with research capabilities |
| **OpenRouter** | Free-tier AI model aggregator |
| **GeoDB Cities** | Location autocomplete & geographic data |

---

## 🌟 Features Overview

### 🛡️ Safety & Trust

| Feature | Description |
|:--------|:------------|
| **AI-Powered Assessment** | 50-question exam evaluating empathy, safety awareness, and childcare knowledge |
| **Multi-Model Evaluation** | Answers processed through Gemini with Perplexity fallback |
| **JWT Authentication** | Secure token-based login for Parents and Nannies |
| **E2E Encryption** | Chat messages encrypted with MAC verification |

### 🤖 AI Assistant

| Feature | Description |
|:--------|:------------|
| **Context-Aware** | Knows current screen and user context |
| **Streaming Responses** | Real-time text generation with async generators |
| **Multilingual** | Responds in user's selected language |
| **Draggable Window** | Repositionable chat interface |

### 👥 Community & Marketplace

| Module | Features |
|:-------|:---------|
| **Mom-to-Mom Activities** | Schedule walks, playdates, workouts, shopping trips |
| **Child Outings** | Coordinate group outings with cost sharing |
| **Skill Marketplace** | Post tasks (cleaning, tutoring) and receive offers |

### 💼 Management Dashboard

| Feature | Description |
|:--------|:------------|
| **Booking Lifecycle** | Request → Accept/Decline → Complete/Cancel |
| **Real-time Chat** | Instant messaging with read receipts |
| **Task Management** | Assign and track to-do items for nannies |
| **Notifications** | Real-time alerts for all key events |

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js** v16 or higher
- **MongoDB** (Local instance or MongoDB Atlas URI)
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/moubarak-01/FamLink.git
cd FamLink
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

The server will start on `http://localhost:3001`.

### 3. Frontend Setup

Open a new terminal in the root directory:

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`.

---

## ⚙️ Environment Configuration

### Frontend Environment (Root Directory)

Create a file named `.env.local` in the project root:

```env
# Google Gemini API (Primary AI)
VITE_GEMINI_API_KEY=AIzaSyC...

# Perplexity AI (Fallback)
VITE_PPLX_API_KEY=pplx-sk-...

# OpenRouter (Free Tier AI)
VITE_OPENROUTER_API_KEY=sk-or-v1-...
```

### Backend Environment (`/backend/.env`)

Create a file named `.env` inside the `/backend/` folder:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/famlink

# JWT Secret (Change in production!)
JWT_SECRET=super_secure_secret_key_change_this

# Server Port
PORT=3001

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_...

# GeoDB API (Get from RapidAPI)
GEODB_API_KEY=your_rapidapi_key_here
```

---

## 📂 Project Structure

```
FamLink/
├── App.tsx                    # Main application logic & routing (671 lines)
├── index.tsx                  # React entry point with ErrorBoundary
├── types.ts                   # TypeScript interfaces (222 lines)
├── constants.ts               # AI models, assessment questions, configs
├── index.css                  # Global styles & CSS variables
│
├── components/                # React UI Components (41 files)
│   ├── AiAssistant.tsx        # Draggable AI chat (420 lines)
│   ├── ChatModal.tsx          # Main messaging interface
│   ├── DashboardScreen.tsx    # Parent/Nanny dashboards (517 lines)
│   ├── Questionnaire.tsx      # 50-question nanny assessment
│   ├── chat/                  # Chat sub-components
│   │   ├── MessageBubble.tsx
│   │   ├── MessageContent.tsx
│   │   ├── ReactionPicker.tsx
│   │   └── ReplyPreview.tsx
│   ├── dashboard/             # Dashboard widgets
│   │   ├── DashboardWidgets.tsx
│   │   ├── NannyDashboard.tsx
│   │   └── ParentDashboard.tsx
│   └── login/                 # 3D login experience
│       ├── GlassForm.tsx
│       ├── LoginScene.tsx
│       └── MockCodeFooter.tsx
│
├── services/                  # API & Service Layer (15 files)
│   ├── geminiService.ts       # AI integration (466 lines, 3-tier waterfall)
│   ├── socketService.ts       # WebSocket connection manager
│   ├── chatService.ts         # Messaging methods
│   ├── cryptoService.ts       # E2E encryption utilities
│   ├── api.ts                 # Axios HTTP client
│   └── [feature]Service.ts    # Activity, Booking, Marketplace, etc.
│
├── contexts/                  # React Context Providers
│   ├── LanguageContext.tsx    # i18n with 6 languages
│   └── ThemeContext.tsx       # Light/Dark theme toggle
│
├── hooks/                     # Custom React Hooks
│   ├── useAppData.ts          # Data fetching & state
│   ├── useAppLogic.ts         # Business logic handlers
│   └── useSocketListeners.ts  # Real-time event handlers
│
├── locales/                   # Internationalization (6 languages)
│   ├── en.ts                  # English (37KB)
│   ├── fr.ts                  # French
│   ├── es.ts                  # Spanish
│   ├── ja.ts                  # Japanese
│   ├── zh.ts                  # Chinese
│   └── ar.ts                  # Arabic (47KB - largest due to RTL)
│
├── backend/                   # NestJS Backend (54 src files)
│   └── src/
│       ├── main.ts            # Server entry point
│       ├── app.module.ts      # Root module
│       ├── schemas/           # MongoDB Models (9 schemas)
│       │   ├── user.schema.ts
│       │   ├── booking.schema.ts
│       │   ├── message.schema.ts
│       │   └── ...
│       ├── auth/              # JWT Authentication
│       ├── chat/              # WebSocket Gateway
│       ├── bookings/          # Booking CRUD
│       ├── activities/        # Community activities
│       ├── outings/           # Child outings
│       ├── marketplace/       # Skill marketplace
│       ├── notifications/     # Real-time alerts
│       ├── payment/           # Stripe integration
│       ├── reviews/           # Rating system
│       └── locations/         # GeoDB proxy
│
└── package.json               # Frontend dependencies
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/auth/register` | Create new user account |
| `POST` | `/auth/login` | Authenticate and receive JWT |
| `GET` | `/auth/profile` | Get current user profile |

### Bookings

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/bookings` | List all bookings |
| `POST` | `/bookings` | Create booking request |
| `PATCH` | `/bookings/:id/status` | Update booking status |
| `DELETE` | `/bookings/:id` | Cancel booking |

### Real-time Events (WebSocket)

| Event | Direction | Description |
|:------|:---------:|:------------|
| `message` | ↔️ | Chat message send/receive |
| `notification` | ← | New notification alert |
| `booking_update` | ← | Booking status change |
| `typing` | ↔️ | User typing indicator |

---

## 🚧 Known Issues & Roadmap

### Current Limitations

| Issue | Status | Notes |
|:------|:------:|:------|
| Chat button on accepted booking | Stalled | Needs conditional render implementation |
| Native emoji picker | Failed QA | Multi-byte character handling issues |

### Roadmap

- [ ] **Fix AuthService** - Use `bcrypt.compare` for password verification
- [ ] **Email Verification** - Add email confirmation flow
- [ ] **Push Notifications** - Add Firebase Cloud Messaging
- [ ] **Calendar Integration** - Google/Apple Calendar sync
- [ ] **Video Chat** - WebRTC integration for video calls

---

## 🛠️ Development

### Available Scripts

**Frontend:**
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

**Backend:**
```bash
npm run start:dev   # Start with hot reload
npm run start:prod  # Production mode
npm run build       # Compile TypeScript
npm run lint        # ESLint with auto-fix
```

### Testing

```bash
# Backend unit tests
cd backend
npm run test

# E2E tests (Cypress)
npm run cypress:open
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is **UNLICENSED** - private and proprietary.

---

## 👨‍💻 Author

**Moubarak**

- GitHub: [@moubarak-01](https://github.com/moubarak-01)

---

<div align="center">

Made with ❤️ for families everywhere

**FamLink** - *Empowering Mothers, Protecting Children*

</div>