# FamLink ✨

**FamLink** is a comprehensive, community-driven mobile web application designed to empower mothers and connect families with trusted care providers. It combines AI-powered vetting, community sharing features, and a robust marketplace to relieve the mental load of parenthood.

---

## ✅ Project Status: 100% Completed

The application is fully architected and implemented with a **React Frontend** and a **NestJS Backend**.

* **Frontend**: Complete UI, API integration, Real-time Chat with persistent history, Interactive Maps (simulated), and Multilingual support.
* **Backend**: Full NestJS server with Authentication, MongoDB Database, WebSockets (Socket.io) for real-time features, Payment Logic (Stripe), and CRUD endpoints for all modules.

---

## 🆕 Latest Implementations (v1.2 Updates)

We have recently added robust real-time notification systems and enhanced data persistence.

### 1. Global Notification System
* **Feature:** Users now receive instant alerts for **Chat Messages**, **Booking Requests**, **Task Assignments**, and **Status Updates**.
* **New Files:**
    * `backend/src/notifications/notifications.gateway.ts`: Dedicated WebSocket gateway for pushing alerts to specific users.
* **Updates:**
    * `notifications.service.ts`: Integrated with the gateway to broadcast events immediately upon database creation.
    * `socketService.ts`: Added a dedicated `onNotification` listener on the frontend.

### 2. Chat Persistence & Reliability
* **Feature:** Messages are now saved to MongoDB and retrieved upon login. The "White Screen" crash on chat open has been resolved by robust data transformation.
* **New Files:**
    * `backend/src/chat/chat.controller.ts`: Endpoint to fetch message history.
    * `services/chatService.ts`: Frontend service to handle history fetching and deletion.
* **Updates:**
    * `ChatModal.tsx`: Now loads history on open, handles missing sender data gracefully, and supports immediate message deletion.
    * `chat.gateway.ts`: Smart routing logic ensures notifications are sent to the correct recipients based on room type (Booking vs. Activity vs. Outing).

### 3. Deep Linking & Refresh Strategy
* **Feature:** Clicking a notification (e.g., "New Task Assigned") instantly refreshes the dashboard data and navigates the user to the specific context (e.g., opening the relevant chat or booking modal).
* **Update:** `App.tsx` now implements a centralized `refreshData` strategy triggered by notification interactions.

---

## 🚀 Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Vite.
* **Backend**: NestJS, Node.js, Express.
* **Database**: MongoDB (Mongoose).
* **Real-time**: Socket.io (WebSockets) for Chat and Notifications.
* **AI**: Google Gemini API (`@google/genai`) for Nanny Assessment and Assistant.
* **Localization**: Custom i18n (English, French, Spanish, Japanese, Chinese, Arabic).

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
Create a file named .env inside the backend/ folder.

Code snippet

MONGO_URI=mongodb://localhost:27017/famlink
JWT_SECRET=super_secure_secret_key_change_this
PORT=3001
STRIPE_SECRET_KEY=sk_test_placeholder_key
📦 Installation & Setup
Prerequisites
Node.js (v16 or higher)

MongoDB (Running locally or a cloud Atlas URI)

1. Backend Setup (Server & Database)
Navigate to the backend folder:

Bash

cd backend
Install Dependencies:

Bash

npm install
Ensure .env exists (see Configuration section above).

Start the Server:

Bash

npm run start:dev
The server will start on http://localhost:3001.

2. Frontend Setup
Navigate to the root folder (open a new terminal):

Bash

cd ..
(Or just stay in the root if you haven't entered backend/)

Install Dependencies:

Bash

npm install
Start the Development Server:

Bash

npm run dev
The app will open at http://localhost:5173.

🔧 Troubleshooting & Common Fixes
If you encounter "Signup failed", "Network Error", or AI issues, check the following:

1. "Signup failed" / Network Error
Cause: The Frontend cannot talk to the Backend.

Fix 1 (Server Status): Ensure the NestJS server is running (npm run start:dev in /backend) and listening on port 3001.

Fix 2 (Database): Ensure MongoDB is running (mongod). If the backend fails to start, it's usually a database connection error.

Fix 3 (CORS): The backend is configured to allow CORS from http://localhost:5173. If you are running on a different port, check backend/src/main.ts.

2. AI Assistant / Assessment Not Working
Cause: Missing or incorrectly named API Key.

Fix: In your root .env.local file, ensure the key is named VITE_GEMINI_API_KEY. Old configurations using just GEMINI_API_KEY will not work in the browser due to Vite security restrictions.

3. "Cannot connect to server" Message
The app includes an automatic fallback to "Mock Mode" for sockets if the backend is down, but API calls (Login/Signup) will fail with a specific message if the server is unreachable.

🌟 Features Overview
1. 🛡️ Safety & Trust
AI-Powered Assessment: Nannies undergo a 15-question exam evaluated by Gemini AI for empathy and safety before they can create a profile.

Authentication: Secure JWT-based login and signup for Parents and Nannies.

2. 🤖 AI Assistant
Context-Aware: A floating chatbot (Gemini 2.5 Flash) that helps users navigate the app and answers parenting questions.

Multilingual: Supports 6 languages natively.

3. 👥 Community & Marketplace
Mom-to-Mom Activities: Schedule playdates, walks, and workouts.

Child Outing Sharing: Coordinate group outings to share costs and supervision.

Skill Marketplace: Post tasks (cleaning, tutoring) and receive offers from the community.

4. 💼 Management Dashboard
Bookings: Full booking lifecycle (Request -> Accept/Decline -> Complete) with cancellation options.

Real-time Chat: Instant messaging for activities, outings, and bookings. Now supports message history persistence and deletion.

Notifications: Real-time alerts for new bookings, tasks, chat messages, and status updates with direct navigation logic.

Tasks: Assign specific to-do items to hired nannies.

📂 Folder Structure
/                       # Frontend Root
  ├── src/
  │   ├── components/   # React UI Components (ChatModal, DashboardScreen, etc.)
  │   ├── services/     # API Clients (Axios, Socket.io, chatService)
  │   ├── contexts/     # React Contexts (Theme, Language)
  │   ├── locales/      # Translation files
  │   ├── App.tsx       # Main Logic & Routing
  │   └── types.ts      # TypeScript Interfaces
  ├── backend/          # Backend Root (NestJS)
  │   ├── src/
  │   │   ├── schemas/      # MongoDB Models (User, Activity, Message, etc.)
  │   │   ├── auth/         # Authentication Module
  │   │   ├── chat/         # WebSocket Gateway, Chat Controller & Service
  │   │   ├── bookings/     # Booking Logic & Notifications
  │   │   ├── notifications/# Real-time Alert System
  │   │   ├── [modules]/    # Feature Modules (Activities, Outings, etc.)
  │   │   ├── app.module.ts # Root Module
  │   │   └── main.ts       # Entry Point
  └── package.json      # Frontend Dependencies
📄 License
This project is licensed under the MIT License.