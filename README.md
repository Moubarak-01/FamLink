# FamLink ✨

FamLink is a comprehensive, community-driven mobile web application designed to empower parents and connect families with trusted care providers. It combines AI-powered vetting, community sharing features, and a robust marketplace to relieve the mental load of parenthood.

---

## ✅ Project Status: Core Implementation Complete (v1.7)

The application is fully architected and implemented with a **React Frontend** and a **NestJS Backend**.

* **Frontend**: Complete UI, API integration, Real-time Chat with persistent history, Interactive Maps (simulated), and Multilingual support.
* **Backend**: Full NestJS server with Authentication, MongoDB Database, WebSockets (Socket.io) for real-time features, Payment Logic (Stripe), and CRUD endpoints for all modules.

---

## 🆕 Latest Implementations (v1.7 - AI & Chat UX Focus)

This release significantly upgrades the user experience in the AI Assistant and standard Chat Modal, introducing new input methods, custom layouts, and accessibility shortcuts.

### 1. Multi-Model AI Stability Architecture (New)
To ensure the AI Assistant remains stable and available even if the primary Gemini model fails or hits rate limits, a robust fallback system has been implemented:
* **Perplexity AI Integration:** Added support for the Perplexity AI API, including models like `sonar-reasoning-pro`.
* **Sequential Failover:** The system attempts to generate responses sequentially across a comprehensive list of models:
    * **Primary:** Multiple Gemini models (`gemini-2.5-flash`, etc.) are attempted first.
    * **Fallback:** A list of Perplexity AI models (`sonar-reasoning-pro`, `sonar-deep-research`, etc.) is used as a final fallback.
* **System Resilience:** This multi-tiered approach provides submission-level model failover to guarantee the AI Assistant's availability.

### 2. AI Assistant & Accessibility
The AI Assistant component has been enhanced with new UX features and global shortcuts:
* **Smart Thinking Loader:** Implemented a time-gated loader that only displays if the AI response takes longer than 2 seconds, preventing visual flickering during fast API responses.
* **Draggability Fix:** Resolved visual artifacts and ensured the drag handles in the header of the AI Assistant are perfectly centered (`mx-auto` solution).
* **Custom UI Styling:** Applied consistent pink/white branding to the floating button and the send button, and implemented the WhatsApp-style send icon.

### 3. Global Keyboard Shortcuts (Expanded)
We have added global keyboard shortcuts to improve accessibility and navigation speed:
* **`Shift + N`**: **Toggle AI Chat Open/Close.** Opens the chat window if closed, and closes it if open.
* **`Shift + A`**: Toggle the AI Assistant visibility (hide/show) on the screen.
* **`Ctrl + D`**: **Clear AI Chat History.** Triggers a confirmation prompt and clears all conversation history in the AI Assistant.

### 4. Universal Chat & Messaging UX
The core messaging system now offers advanced layout control and reaction functionality:
* **Asymmetrical Message Layout:** Implemented flexible message widths across all chat modals: User messages are constrained to **85% width** (right-aligned), while other/AI messages are allowed up to **95% width** (left-aligned) for better display of long content or code.
* **Advanced Reactions (Native Picker Attempt):** Enhanced the quick-reaction menu (`👍, ❤️, etc.`) with a **`+` button**. Clicking the `+` button now attempts to trigger the user's **native OS emoji picker** (e.g., Windows V / Win + .) by focusing a hidden input field, allowing access to the full emoji library.

---

## 🚧 Known Issues & Future Implementation Goals

The following features were either implemented but failed QA or were stalled due to technical constraints.

| Feature/Issue | Status & Constraint | Next Steps |
| :--- | :--- | :--- |
| **Chat Button on Accepted Booking** | **STALLED:** We were unable to implement the "Open Chat" button directly next to an accepted booking request on the Dashboard screen. | Implement a conditional render (`if (status === 'accepted')`) on the booking card action bar to show the chat button, utilizing the existing `onOpenBookingChat` handler. |
| **Native System Emoji Picker** | **FAILED QA:** The workaround to access the native OS emoji picker (`Win + .` on Windows, etc.) was implemented but failed to reliably capture the selected multi-byte emoji character and apply the reaction consistently. | Requires further debugging of the `onchange` and `blur` sequence in `MessageBubble.tsx` to handle multi-byte emoji character capturing correctly, or integration of a dedicated third-party React emoji library. |

---

## 🚀 Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Vite.
* **Backend**: NestJS, Node.js, Express.
* **Database**: MongoDB (Mongoose).
* **Real-time**: Socket.io (WebSockets) for Chat and Notifications.
* **AI**: Google Gemini API (`@google/genai`) for Nanny Assessment and Assistant.
* **Localization**: Custom i18n (English, French, Spanish, Japanese, Chinese, Arabic).
* **External APIs**: GeoDB Cities API (RapidAPI).

---

### 📦 Installation & Setup
**Prerequisites:**
* Node.js (v16 or higher)
* MongoDB (Running locally or a cloud Atlas URI)

**Backend Setup (Server & Database)**
Navigate to the backend folder:

```bash
cd backend
npm install
npm run start:dev
The server will start on http://localhost:3001.

Frontend Setup Navigate to the root folder (open a new terminal):

Bash

cd ..
npm install
npm run dev
The app will open at http://localhost:5173.

⚙️ Environment Configuration (Crucial)
To run this project locally without errors, you must configure environment variables correctly for both the Frontend and Backend. They are separate.
```
### 1. Frontend Environment (Root Directory)
Create a file named .env.local in the project root and add the following content:

# Required for AI Assessment and Assistant (Gemini)
VITE_GEMINI_API_KEY=AIzaSyC... (Your Google Gemini API Key)
# NEW: Required for Perplexity AI Fallback
VITE_PPLX_API_KEY=pplx-sk-... (Your Perplexity AI API Key)
### 2. Backend Environment (/backend Directory)
Create a file named .env inside the /backend/ folder and add the following content:


MONGO_URI=mongodb://localhost:27017/famlink
JWT_SECRET=super_secure_secret_key_change_this
PORT=3001
STRIPE_SECRET_KEY=sk_test_placeholder_key
# New GeoDB API Key (Get from RapidAPI)
GEODB_API_KEY=your_rapidapi_key_here
### 🌟 Features Overview
## 🛡️ Safety & Trust

# AI-Powered Assessment: Nannies undergo a 15-question exam evaluated by Gemini AI for empathy and safety.

# Authentication: Secure JWT-based login and signup for Parents and Nannies.

## 🤖 AI Assistant

# Context-Aware: A floating chatbot (Gemini 2.5 Flash) that helps users navigate the app and answers parenting questions.

# Multilingual: Supports 6 languages natively.

# Shortcuts: Use Shift + N to toggle open/close; Shift + A to toggle visibility.

### 👥 Community & Marketplace

# Mom-to-Mom Activities: Schedule playdates, walks, and workouts.

# Child Outing Sharing: Coordinate group outings to share costs and supervision.

# Skill Marketplace: Post tasks (cleaning, tutoring) and receive offers from the community.

### 💼 Management Dashboard

Bookings: Full booking lifecycle (Request -> Accept/Decline -> Complete).

Real-time Chat: Instant messaging with robust persistence, E2E encryption, and read receipts.

Notifications: Real-time alerts for all key events.

Tasks: Assign specific to-do items to hired nannies.

### 📂 Folder Structure
Bash

/                               # Frontend Root
 ├── src/
 │   ├── components/             # React UI Components
 │   │   └── chat/               # (ReactionPicker, MessageBubble, etc.)
 │   ├── services/               # API Clients (Axios, Socket.io, chatService, cryptoService, locationService)
 │   ├── contexts/               # React Contexts (Theme, Language)
 │   ├── hooks/                  # Custom Hooks (useAppLogic, useSocketListeners)
 │   ├── App.tsx                 # Main Logic & Routing
 │   └── types.ts                # TypeScript Interfaces (Updated for E2E)
 ├── backend/                    # Backend Root (NestJS)
 │   ├── src/
 │   │   ├── schemas/            # MongoDB Models 
 │   │   ├── chat/               # WebSocket Gateway, Chat Controller & Service
 │   │   ├── locations/          # New GeoDB Proxy Module
 │   │   ├── notifications/      # Real-time Alert System
 │   │   └── [modules]/          # Feature Modules (Auth, Bookings, Activities, etc.)
 └── package.json                # Frontend Dependencies