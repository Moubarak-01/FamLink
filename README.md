# FamLink ✨

<div align="center">

![Version](https://img.shields.io/badge/version-2.2-pink?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)

**An AI-powered community platform connecting parents with trusted care providers**

[Features](#-features-overview) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Challenges](#-solved-engineering-challenges)

</div>

---

## 📖 Overview

FamLink is a comprehensive, community-driven mobile web application designed to **empower parents** and connect families with trusted care providers. It combines AI-powered vetting, community sharing features, and a robust marketplace to relieve the mental load of parenthood.

### Key Highlights

- 🛡️ **AI-Powered Nanny Vetting** - 50-question assessment evaluated by multi-model AI (Gemini, Perplexity, OpenRouter)
- 💬 **Real-time Messaging** - End-to-end encrypted chat with read receipts, reactions, and replies
- 🌍 **Multilingual Support** - 6 languages (English, French, Spanish, Japanese, Chinese, Arabic) with RTL support
- 🤖 **AI Assistant** - Context-aware chatbot with streaming responses and keyboard shortcuts
- ⚡ **Real-time Everything** - WebSocket-powered updates across all features (tasks, bookings, activities)
- 💳 **Subscription System** - Stripe-integrated payment processing

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

## ✅ Project Status: v2.2 (Feb 2026)

| Layer | Status | Description |
|:------|:------:|:------------|
| **Frontend** | ✅ | Complete UI, API integration, Real-time Chat, Interactive Maps, Multilingual support |
| **Backend** | ✅ | Full NestJS server with Authentication, MongoDB, WebSockets, Payment Logic (Stripe) |
| **AI Services** | ✅ | Three-tier AI waterfall: OpenRouter → Gemini → Perplexity |
| **Real-time** | ✅ | WebSocket events for all data changes with React Query cache invalidation |
| **Testing** | 🔄 | Jest configuration in place, Cypress e2e setup |

---

## 🆕 Latest Updates (v2.2: Real-time & Polish)

### 1. ⚡ Universal Real-time Updates

Fixed real-time synchronization across the entire application:

| Feature | Before | After |
|:--------|:-------|:------|
| Task completion | Required page refresh | Updates instantly |
| Booking requests | Stale until refresh | Live updates via WebSocket |
| Nanny card buttons | Text-only, no feedback | Styled with emojis & animations |

### 2. 🎨 Redesigned UI Components

- **Nanny Card Buttons** - 5 styled action buttons with hover effects:
  - 📄 View Details (gray) → Opens nanny profile
  - 💬 Contact (pink) → Opens chat
  - ⭐ Rate (yellow) → Submit rating
  - 📝 Add Task (green) → Assign work
  - 🗑️ Remove (red) → Remove from dashboard

### 3. 🌐 Complete Localization

- Arabic (RTL) fully implemented with proper text direction
- All 6 languages synchronized with 400+ translation keys
- Dashboard, settings, AI assistant, and all forms localized

---

## 🐛 Solved Engineering Challenges

<details>
<summary><strong>1. The "Yesterday" Date Bug</strong></summary>

**Problem:** Activity dates selected as "Feb 1st" were saving as `2026-02-01`. JavaScript parses this string as "Midnight UTC". For users in the US (e.g., EST), "Midnight UTC" is "7 PM Yesterday", causing the UI to display "Jan 31st".

**Solution:** Updated the frontend storage logic to append `T12:00:00` (Noon) to date strings. This places the timestamp safely in the middle of the day, so timezone offsets (+/- 12h) never shift the calendar date.
</details>

<details>
<summary><strong>2. OpenRouter Free Tier Volatility</strong></summary>

**Problem:** Free models like `llama-3.3-70b-instruct:free` are hosted by volunteers and often go offline, returning `404 Not Found` or `400 Bad Request`.

**Solution:** Built a robust **Waterfall System** in `geminiService.ts`. It tries the user's preferred model (Llama) first. If it fails (caught via specific error codes), it silently retries with the next best model (Gemini/Z.AI/Nvidia), ensuring the user always gets an answer.
</details>

<details>
<summary><strong>3. The Query Key Mismatch (Real-time Tasks)</strong></summary>

**Problem:** When a nanny completed a task, the parent's dashboard didn't update. Users had to manually refresh the page to see changes.

**Solution:** The socket listener was invalidating `['userTasks']` but the React Query hook used `['tasks', userId]`. Fixed by changing the invalidation to `['tasks']` which matches the hook's query key prefix, enabling partial matching.
</details>

<details>
<summary><strong>4. Unreachable Socket Emit (Bookings)</strong></summary>

**Problem:** New booking requests weren't triggering real-time updates for nannies.

**Solution:** Found a duplicate `return` statement in `bookings.service.ts` that made the `socket.emit('bookings_update')` call unreachable. Removed the duplicate return.

```diff
-    return this.mapBooking(savedBooking);
-
     this.chatGateway.server.emit('bookings_update', { action: 'create' });
     return this.mapBooking(savedBooking);
```
</details>

<details>
<summary><strong>5. The Reactivity Problem</strong></summary>

**Problem:** In v1.8, deleting chat history or clearing bookings required a page refresh. The UI state was disconnected from the server state.

**Solution:** Implemented **TanStack React Query** with aggressive invalidation strategies. Now, `queryClient.setQueryData` updates the UI *instantly* (optimistic), while `invalidateQueries` ensures the server data is synced in the background.
</details>

<details>
<summary><strong>6. The "Static" Chat Feel</strong></summary>

**Problem:** Messages appeared instantly with no weight, and typing indicators were just plain text ("User is typing..."). It felt "cheap."

**Solution:** Integrated **Framer Motion** `AnimatePresence`. Added a custom "Dancing Dots" component for typing, and applied "Spring" physics to every message bubble. Also enforced strict input contrast modes for readability.
</details>

<details>
<summary><strong>7. Stale Read Receipts</strong></summary>

**Problem:** Blue ticks would only update if you re-entered the room.

**Solution:** Added a live `onMessage` listener that checks if the user is currently viewing the room. If yes, it fires a `mark_seen` event immediately, turning the sender's ticks blue in real-time.
</details>

<details>
<summary><strong>8. Silent Remove Button</strong></summary>

**Problem:** The "Remove Nanny" button had no visual feedback - it worked but users thought nothing happened.

**Solution:** Added confirmation dialog (`window.confirm`) and success alert to `handleRemoveNanny`, giving users clear feedback that the action was processed.
</details>

<details>
<summary><strong>9. Notification Click Missing Invalidation</strong></summary>

**Problem:** Clicking task/outing/skill notifications navigated to the correct screen but showed stale data.

**Solution:** Added `queryClient.invalidateQueries()` calls for each notification type before navigation, ensuring fresh data is loaded.
</details>

<details>
<summary><strong>10. Nanny Visibility on Parent Dashboard</strong></summary>

**Problem:** Nannies weren't appearing on the parent dashboard even after completing their profiles.

**Solution:** The `approvedNannies` state was initialized but never populated on app startup. Added a `useEffect` hook to fetch nannies via `userService.getNannies()` when a user logs in.
</details>

<details>
<summary><strong>11. Booking Notification Handler</strong></summary>

**Problem:** Clicking a booking notification as a nanny didn't show the pending request for acceptance.

**Solution:** Modified the notification handler to invalidate bookings cache and navigate to Dashboard for all booking notifications, not just accepted ones.
</details>

<details>
<summary><strong>12. Arabic Locale Incomplete</strong></summary>

**Problem:** Arabic translations were missing 200+ keys, causing fallback to English in many UI areas.

**Solution:** Comprehensive audit of all locale files, adding all missing translations with proper RTL considerations.
</details>

<details>
<summary><strong>13. Duplicate Locale Keys</strong></summary>

**Problem:** `ar.ts` had duplicate keys causing TypeScript errors and unpredictable behavior.

**Solution:** Automated audit script identified duplicates; manually resolved by removing redundant entries.
</details>

<details>
<summary><strong>14. Multi-Process Startup</strong></summary>

**Problem:** Developers had to manually open multiple terminals to start frontend and backend.

**Solution:** Created `npm start` script in root that uses `concurrently` to launch both services. Also added workflow documentation in `.agent/workflows/`.
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
| **React Markdown** | 10.1 | Markdown rendering |
| **KaTeX** | - | Math formula rendering |

### Backend

| Technology | Version | Purpose |
|:-----------|:-------:|:--------|
| **NestJS** | 10.0 | Server framework |
| **MongoDB (Mongoose)** | 8.0 | Database & ODM |
| **Socket.io** | 4.7 | WebSocket server |
| **Passport JWT** | 4.0 | Authentication |
| **Stripe** | 14.0 | Payment processing |
| **bcrypt** | 6.0 | Password hashing |

### AI & External APIs

| Service | Purpose |
|:--------|:--------|
| **Google Gemini** | Primary AI for assessment & chat |
| **Perplexity AI** | Fallback AI with research capabilities |
| **OpenRouter** | Free-tier AI model aggregator (10+ models) |
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
| **Keyboard Shortcuts** | `Shift+N` toggle, `Shift+A` visibility, `Ctrl+D` clear |

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
| **Real-time Chat** | Instant messaging with read receipts & typing indicators |
| **Task Management** | Assign and track to-do items for nannies |
| **Notifications** | Real-time alerts for all key events |

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

### Tasks

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/tasks` | List all tasks |
| `POST` | `/tasks` | Create new task |
| `PATCH` | `/tasks/:id/status` | Update task status |
| `DELETE` | `/tasks/:id` | Delete task |

### Real-time Events (WebSocket)

| Event | Direction | Description |
|:------|:---------:|:------------|
| `tasks_update` | ← | Task created/updated/deleted |
| `bookings_update` | ← | Booking status change |
| `activity_update` | ← | Activity join/approve/delete |
| `outings_update` | ← | Outing requests and status |
| `marketplace_update` | ← | Skill task offers |
| `notification` | ← | New notification alert |
| `message` | ↔️ | Chat message send/receive |
| `typing` | ↔️ | User typing indicator |

---

## 📂 Project Structure

```
FamLink/
├── App.tsx                    # Main application logic & routing
├── index.tsx                  # React entry point with ErrorBoundary
├── types.ts                   # TypeScript interfaces
├── constants.ts               # AI models, assessment questions, configs
│
├── components/                # React UI Components (45+ files)
│   ├── AiAssistant.tsx        # Draggable AI chat
│   ├── ChatModal.tsx          # Main messaging interface
│   ├── DashboardScreen.tsx    # Parent/Nanny dashboards
│   ├── SettingsModal.tsx      # App settings & preferences
│   └── ...
│
├── services/                  # API & Service Layer
│   ├── geminiService.ts       # AI integration (3-tier waterfall)
│   ├── socketService.ts       # WebSocket connection manager
│   ├── chatService.ts         # Messaging methods
│   ├── cryptoService.ts       # E2E encryption utilities
│   └── [feature]Service.ts    # Activity, Booking, Task, etc.
│
├── hooks/                     # Custom React Hooks
│   └── useFamLinkQueries.ts   # React Query hooks for all data
│
├── locales/                   # Internationalization (6 languages)
│   ├── en.ts, fr.ts, es.ts
│   ├── ja.ts, zh.ts, ar.ts
│
├── backend/                   # NestJS Backend
│   └── src/
│       ├── schemas/           # MongoDB Models
│       ├── auth/              # JWT Authentication
│       ├── chat/              # WebSocket Gateway
│       ├── bookings/          # Booking CRUD
│       ├── user-tasks/        # Task management
│       ├── activities/        # Community activities
│       ├── outings/           # Child outings
│       ├── marketplace/       # Skill marketplace
│       ├── notifications/     # Real-time alerts
│       └── payment/           # Stripe integration
│
└── .agent/workflows/          # Development automation scripts
```

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

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Moubarak**

- GitHub: [@Moubarak-01](https://github.com/Moubarak-01)

---

<div align="center">

Made with ❤️ for families everywhere

**FamLink** - *Empowering Mothers, Protecting Children*

</div>