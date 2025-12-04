Here's the updated README.md incorporating all the requested changes, including the dark mode display fixes, the new keyboard shortcuts, and the End-to-End Encryption features.

Markdown

# FamLink ✨

FamLink is a comprehensive, community-driven mobile web application designed to empower parents and connect families with trusted care providers. It combines AI-powered vetting, community sharing features, and a robust marketplace to relieve the mental load of parenthood.

---

## ✅ Project Status: 100% Completed

The application is fully architected and implemented with a **React Frontend** and a **NestJS Backend**.

* **Frontend**: Complete UI, API integration, Real-time Chat with persistent history, Interactive Maps (simulated), and Multilingual support.
* **Backend**: Full NestJS server with Authentication, MongoDB Database, WebSockets (Socket.io) for real-time features, Payment Logic (Stripe), and CRUD endpoints for all modules.

---

## 🆕 Latest Implementations (v1.5 - UI & Encryption Update)

This release focuses on user experience enhancements, including better dark mode support and the introduction of End-to-End Encryption logic.

### 1. UI Refinements & Dark Mode Fixes
* **Improved Settings Display:** Fixed visibility issues in dark mode for settings modals and toggle switches.
* **Adaptive Text:** Modals now correctly adapt their text color based on the active theme (Light/Dark).

### 2. Keyboard Shortcuts
We have added global keyboard shortcuts to improve accessibility and navigation speed:
* **`Shift + N`**: Open a new AI Assistant chat session instantly.
* **`Shift + A`**: Toggle the AI Assistant visibility (hide/show) on the screen.
*(Note: These shortcuts are now listed in the Settings menu for easy reference)*

### 3. End-to-End Encryption (E2E) Architecture
* **Secure Messaging:** Implemented a robust cryptographic service layer (`cryptoService.ts`).
* **Client-Side Encryption:** Messages are now encrypted on the device before being sent via WebSocket. The server only sees and stores the ciphertext.
* **Decryption:** Incoming messages are decrypted locally on the user's device, ensuring privacy.
* **Integrity Check:** Added Message Authentication Code (MAC) verification to prevent tampering.

### 4. Persistent Message Status (WhatsApp-style)
* **Feature:** Message status relies on database persistence and user connection state.
    * ✓ **Sent** (Gray): Message successfully saved to the server database.
    * ✓✓ **Delivered** (Gray): Recipient user has successfully connected to the server.
    * ✓✓ **Seen** (Blue): Recipient user has the chat window open and focused.

---

## 🚀 Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Vite.
* **Backend**: NestJS, Node.js, Express.
* **Database**: MongoDB (Mongoose).
* **Real-time**: Socket.io (WebSockets) for Chat and Notifications.
* **AI**: Google Gemini API (`@google/genai`) for Nanny Assessment and Assistant.
* **Localization**: Custom i18n (English, French, Spanish, Japanese, Chinese, Arabic).
* **Security**: Custom E2E Encryption logic (Mock/Simulated for demo).

---

## ⚙️ Environment Configuration (Crucial)

To run this project locally without errors, you must configure environment variables correctly for both the Frontend and Backend. **They are separate.**

### 1. Frontend Environment (`/` Root Directory)
Create a file named `.env.local` in the project root.
**Note:** Vite requires variables to start with `VITE_` to be exposed to the browser.

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

Real-time Chat: Instant messaging for activities, outings, and bookings with robust persistence and E2E encryption.

Notifications: Real-time alerts for all key events.

Tasks: Assign specific to-do items to hired nannies.

📂 Folder Structure
Bash

/                             # Frontend Root
 ├── src/
 │   ├── components/           # React UI Components
 │   ├── services/             # API Clients (Axios, Socket.io, chatService, cryptoService)
 │   ├── contexts/             # React Contexts (Theme, Language)
 │   ├── hooks/                # Custom Hooks (useAppLogic, useSocketListeners)
 │   ├── App.tsx               # Main Logic & Routing
 │   └── types.ts              # TypeScript Interfaces (Updated for E2E)
 ├── backend/                    # Backend Root (NestJS)
 │   ├── src/
 │   │   ├── schemas/          # MongoDB Models (Updated for E2E MAC field)
 │   │   ├── chat/             # WebSocket Gateway, Chat Controller & Service
 │   │   ├── notifications/    # Real-time Alert System
 │   │   └── [modules]/        # Feature Modules (Auth, Bookings, Activities, etc.)
 └── package.json            # Frontend Dependencies
📄 License
This project is licensed under the MIT License.