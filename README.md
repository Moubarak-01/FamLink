# FamLink ✨

FamLink is a comprehensive, community-driven mobile web application designed to empower parents and connect families with trusted care providers. It combines AI-powered vetting, community sharing features, and a robust marketplace to relieve the mental load of parenthood.

---

## ✅ Project Status: 100% Completed

The application is fully architected and implemented with a **React Frontend** and a **NestJS Backend**.

* **Frontend**: Complete UI, API integration, Real-time Chat with persistent history, Interactive Maps (simulated), and Multilingual support.
* **Backend**: Full NestJS server with Authentication, MongoDB Database, WebSockets (Socket.io) for real-time features, Payment Logic (Stripe), and CRUD endpoints for all modules.

---

## 🆕 Latest Implementations (v1.6 - Global Location Services)

This release integrates the **GeoDB Cities API** to provide accurate, real-time location data worldwide, replacing static lists with dynamic, searchable endpoints.

### 1. Global Location API Integration
* **Dynamic Data:** Replaced static country/city lists with real-time data from GeoDB.
* **Smart Caching:** Implemented backend caching (Redis-like in-memory) to minimize API calls and avoid rate limits.
* **New Endpoints:**
    * `GET /locations/countries` - Fetches all available countries.
    * `GET /locations/states/:countryCode` - Fetches states/regions for a specific country.
    * `GET /locations/cities/:countryCode/:regionCode` - Fetches cities within a selected region.
    * `GET /locations/search?query=...` - Global type-ahead search for cities.

### 2. UI Refinements & Dark Mode Fixes
* **Improved Settings Display:** Fixed visibility issues in dark mode for settings modals and toggle switches.
* **Adaptive Text:** Modals now correctly adapt their text color based on the active theme (Light/Dark).

### 3. Keyboard Shortcuts
We have added global keyboard shortcuts to improve accessibility and navigation speed:
* **`Shift + N`**: Open a new AI Assistant chat session instantly.
* **`Shift + A`**: Toggle the AI Assistant visibility (hide/show) on the screen.
*(Note: These shortcuts are listed in the Settings menu)*

### 4. End-to-End Encryption (E2E) Architecture
* **Secure Messaging:** Implemented a robust cryptographic service layer (`cryptoService.ts`).
* **Client-Side Encryption:** Messages are encrypted on the device before sending. The server only stores ciphertext.
* **Decryption:** Incoming messages are decrypted locally on the user's device.
* **Integrity Check:** Added Message Authentication Code (MAC) verification.

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

## ⚙️ Environment Configuration (Crucial)

To run this project locally without errors, you must configure environment variables correctly for both the Frontend and Backend. **They are separate.**

### 1. Frontend Environment (`/` Root Directory)
Create a file named `.env.local` in the project root.

```env
# Required for AI Assessment and Assistant
VITE_GEMINI_API_KEY=AIzaSyC... (Your Google Gemini API Key)
2. Backend Environment (/backend Directory)
Create a file named .env inside the /backend/ folder.

Code snippet

MONGO_URI=mongodb://localhost:27017/famlink
JWT_SECRET=super_secure_secret_key_change_this
PORT=3001
STRIPE_SECRET_KEY=sk_test_placeholder_key
# New GeoDB API Key (Get from RapidAPI)
GEODB_API_KEY=your_rapidapi_key_here
📦 Installation & Setup
Prerequisites:
Node.js (v16 or higher)

MongoDB (Running locally or a cloud Atlas URI)

1. Backend Setup (Server & Database)
Navigate to the backend folder:

Bash

cd backend
npm install
npm run start:dev
The server will start on http://localhost:3001.

2. Frontend Setup
Navigate to the root folder (open a new terminal):

Bash

cd ..
# (Or just stay in the root if you haven't entered backend/)
npm install
npm run dev
The app will open at http://localhost:5173.

🌟 Features Overview
1. 🛡️ Safety & Trust
AI-Powered Assessment: Nannies undergo a 15-question exam evaluated by Gemini AI for empathy and safety.

Authentication: Secure JWT-based login and signup for Parents and Nannies.

2. 🤖 AI Assistant
Context-Aware: A floating chatbot (Gemini 2.5 Flash) that helps users navigate the app and answers parenting questions.

Multilingual: Supports 6 languages natively.

Shortcuts: Use Shift + A to toggle visibility.

3. 👥 Community & Marketplace
Mom-to-Mom Activities: Schedule playdates, walks, and workouts.

Child Outing Sharing: Coordinate group outings to share costs and supervision.

Skill Marketplace: Post tasks (cleaning, tutoring) and receive offers from the community.

4. 💼 Management Dashboard
Bookings: Full booking lifecycle (Request -> Accept/Decline -> Complete).

Real-time Chat: Instant messaging with robust persistence, E2E encryption, and read receipts.

Notifications: Real-time alerts for all key events.

Tasks: Assign specific to-do items to hired nannies.

📂 Folder Structure
Bash

/                             # Frontend Root
 ├── src/
 │   ├── components/           # React UI Components
 │   ├── services/             # API Clients (Axios, Socket.io, chatService, cryptoService, locationService)
 │   ├── contexts/             # React Contexts (Theme, Language)
 │   ├── hooks/                # Custom Hooks (useAppLogic, useSocketListeners)
 │   ├── App.tsx               # Main Logic & Routing
 │   └── types.ts              # TypeScript Interfaces (Updated for E2E)
 ├── backend/                    # Backend Root (NestJS)
 │   ├── src/
 │   │   ├── schemas/          # MongoDB Models (Updated for E2E MAC field)
 │   │   ├── chat/             # WebSocket Gateway, Chat Controller & Service
 │   │   ├── locations/        # New GeoDB Proxy Module
 │   │   ├── notifications/    # Real-time Alert System
 │   │   └── [modules]/        # Feature Modules (Auth, Bookings, Activities, etc.)
 └── package.json            # Frontend Dependencies
📄 License
This project is licensed under the MIT License.