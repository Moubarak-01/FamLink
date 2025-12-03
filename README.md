
# FamLink ✨

**FamLink** is a comprehensive, community-driven mobile web application designed to empower mothers and connect families with trusted care providers. It combines AI-powered vetting, community sharing features, and a robust marketplace to relieve the mental load of parenthood.

---

## ✅ Project Status: 100% Completed

The application is fully architected and implemented with a **React Frontend** and a **NestJS Backend**.

*   **Frontend**: Complete UI, API integration, Real-time Chat, Interactive Maps (simulated), and Multilingual support.
*   **Backend**: Full NestJS server with Authentication, MongoDB Database, WebSockets (Socket.io), Payment Logic (Stripe), and CRUD endpoints for all modules.

---

## 🚀 Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS, Vite.
*   **Backend**: NestJS, Node.js, Express.
*   **Database**: MongoDB (Mongoose).
*   **Real-time**: Socket.io (WebSockets) for Chat and Notifications.
*   **AI**: Google Gemini API (`@google/genai`) for Nanny Assessment and Assistant.
*   **Localization**: Custom i18n (English, French, Spanish, Japanese, Chinese, Arabic).

---

## ⚙️ Environment Configuration (Crucial)

To run this project locally without errors, you must configure environment variables correctly for both the Frontend and Backend. **They are separate.**

### 1. Frontend Environment (`/` Root Directory)
Create a file named `.env.local` in the project root.
**Note:** Vite requires variables to start with `VITE_` to be exposed to the browser.

```env
# Required for AI Assessment and Assistant
VITE_GEMINI_API_KEY=AIzaSyC... (Your Google Gemini API Key)
```

### 2. Backend Environment (`/backend` Directory)
Create a file named `.env` inside the `backend/` folder.

```env
MONGO_URI=mongodb://localhost:27017/famlink
JWT_SECRET=super_secure_secret_key_change_this
PORT=3001
STRIPE_SECRET_KEY=sk_test_placeholder_key
```

---

## 📦 Installation & Setup

### Prerequisites
*   **Node.js** (v16 or higher)
*   **MongoDB** (Running locally or a cloud Atlas URI)

### 1. Backend Setup (Server & Database)

1.  **Navigate to the backend folder**:
    ```bash
    cd backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Ensure `.env` exists** (see Configuration section above).

4.  **Start the Server**:
    ```bash
    npm run start:dev
    ```
    *The server will start on `http://localhost:3001`.*

### 2. Frontend Setup

1.  **Navigate to the root folder** (open a new terminal):
    ```bash
    cd ..
    ```
    *(Or just stay in the root if you haven't entered `backend/`)*

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
    *The app will open at `http://localhost:5173`.*

---

## 🔧 Troubleshooting & Common Fixes

If you encounter **"Signup failed"**, **"Network Error"**, or **AI issues**, check the following:

### 1. "Signup failed" / Network Error
*   **Cause:** The Frontend cannot talk to the Backend.
*   **Fix 1 (Server Status):** Ensure the NestJS server is running (`npm run start:dev` in `/backend`) and listening on port 3001.
*   **Fix 2 (Database):** Ensure MongoDB is running (`mongod`). If the backend fails to start, it's usually a database connection error.
*   **Fix 3 (CORS):** The backend is configured to allow CORS from `http://localhost:5173`. If you are running on a different port, check `backend/src/main.ts`.

### 2. AI Assistant / Assessment Not Working
*   **Cause:** Missing or incorrectly named API Key.
*   **Fix:** In your root `.env.local` file, ensure the key is named `VITE_GEMINI_API_KEY`. Old configurations using just `GEMINI_API_KEY` will not work in the browser due to Vite security restrictions.

### 3. "Cannot connect to server" Message
*   The app includes an automatic fallback to "Mock Mode" for sockets if the backend is down, but API calls (Login/Signup) will fail with a specific message if the server is unreachable.

---

## 🌟 Features Overview

### 1. 🛡️ Safety & Trust
*   **AI-Powered Assessment**: Nannies undergo a 15-question exam evaluated by Gemini AI for empathy and safety before they can create a profile.
*   **Authentication**: Secure JWT-based login and signup for Parents and Nannies.

### 2. 🤖 AI Assistant
*   **Context-Aware**: A floating chatbot (Gemini 2.5 Flash) that helps users navigate the app and answers parenting questions.
*   **Multilingual**: Supports 6 languages natively.

### 3. 👥 Community & Marketplace
*   **Mom-to-Mom Activities**: Schedule playdates, walks, and workouts.
*   **Child Outing Sharing**: Coordinate group outings to share costs and supervision.
*   **Skill Marketplace**: Post tasks (cleaning, tutoring) and receive offers from the community.

### 4. 💼 Management Dashboard
*   **Bookings**: Full booking lifecycle (Request -> Accept/Decline -> Complete).
*   **Tasks**: Assign specific to-do items to hired nannies.
*   **Real-time Chat**: Instant messaging for activities, outings, and booking coordination.
*   **Notifications**: Real-time alerts for new messages, booking updates, and task completions.

---

## 📂 Folder Structure

```
/                       # Frontend Root
  ├── src/
  │   ├── components/   # React UI Components
  │   ├── services/     # API Clients (Axios & Socket.io)
  │   ├── contexts/     # React Contexts (Theme, Language)
  │   ├── locales/      # Translation files
  │   ├── App.tsx       # Main Application Logic
  │   └── types.ts      # TypeScript Interfaces
  ├── backend/          # Backend Root (NestJS)
  │   ├── src/
  │   │   ├── schemas/      # MongoDB Models (User, Activity, etc.)
  │   │   ├── auth/         # Authentication Module
  │   │   ├── chat/         # WebSocket Gateway
  │   │   ├── [modules]/    # Feature Modules (Activities, Outings, etc.)
  │   │   ├── app.module.ts # Root Module
  │   │   └── main.ts       # Entry Point
  └── package.json      # Frontend Dependencies
```

---

## 📄 License

This project is licensed under the MIT License.
# FamLink
