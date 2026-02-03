# FamLink Feature Roadmap 🚀

This roadmap outlines the step-by-step implementation plan for the requested features, prioritized by complexity and dependency.

---

## 🔒 Phase 1: Security Hardening (AuthService & Encryption)
**Goal:** Secure user passwords using industry-standard hashing instead of plain text/simple comparison.
**Status:** 📅 Planned

### Implementation Steps
1.  **Backend Dependencies:** Install `bcrypt` (or `bcryptjs`) and types.
2.  **Refactor Registration:** Update `auth.service.ts` register method to hash passwords before saving: `await bcrypt.hash(password, 10)`.
3.  **Refactor Login:** Update `auth.service.ts` validateUser method to use `await bcrypt.compare(plainText, hash)`.
4.  **Migration Strategy (Dev):** Since we are in development, we will likely wipe the existing user database (or manually update extensive test accounts) as old plain-text passwords will no longer work.
5.  **Verification:** Test Register -> Login flow.

---

## 📧 Phase 2: Email Verification
**Goal:** Ensure users provide valid email addresses upon registration.
**Status:** 📅 Planned

### Implementation Steps
1.  **Service Setup:** Set up a free **Resend** or **SendGrid** account for testing. Get API Key.
2.  **Backend Mailer:**
    -   Install `@nestjs-modules/mailer` (or generic axios wrapper).
    -   Create `MailService` to handle sending emails.
3.  **Token Generation:** Use `jwt` or `crypto` to generate a short-lived verification token.
4.  **Database:** Update `User` schema to add `isEmailVerified` (boolean) and `verificationToken` (string).
5.  **API Endpoints:**
    -   `POST /auth/verify-email`: Accepts token, updates user status.
    -   `POST /auth/resend-verification`: Sends a fresh token.
6.  **Frontend:**
    -   Create "Check your email" landing page.
    -   Add `verify-email/:token` route to handle the link click.

---

## 🔔 Phase 3: Push Notifications (Firebase)
**Goal:** Notify users of messages and booking updates even when the app is closed.
**Status:** 📅 Planned

### Implementation Steps
1.  **Firebase Setup:** Create a Firebase Project (free), get `firebaseConfig` and `service-account.json`.
2.  **Frontend (PWA/Web):**
    -   Add `firebase` SDK.
    -   Create `firebase-messaging-sw.js` (Service Worker) in `public/`.
    -   Request permission (`Notification.requestPermission()`) on login.
    -   Get **FCM Token** and send to backend.
3.  **Backend:**
    -   Update `User` schema to store an array of `fcmTokens` (for multiple devices).
    -   Create `NotificationsService` (or update existing) to send messages via `firebase-admin`.
4.  **Integration:** Hook into `SocketService` events. When a socket message is sent, *also* send a push notification if the user is not connected.

---

## 📅 Phase 4: Calendar Integration (Google)
**Goal:** Sync FamLink bookings to the user's personal Google Calendar.
**Status:** 📅 Planned

### Implementation Steps
1.  **Google Cloud Console:** Enable Calendar API, configure OAuth 2.0 Client ID/Secret.
2.  **Backend:**
    -   Install `googleapis`.
    -   Create endpoints for OAuth flow: `/auth/google` and `/auth/google/callback`.
    -   Store `refresh_token` in `User` schema (encrypted!).
3.  **Sync Logic:**
    -   Create `CalendarService`.
    -   On `Booking` creation (Accepted status), call Google API to insert event `insertEvent()`.
4.  **Frontend:** Add "Connect Google Calendar" button in Settings.

---

## 📹 Phase 5: Video Chat (WebRTC)
**Goal:** Enable face-to-face calls between Parent and Nanny.
**Status:** 📅 Planned

### Implementation Steps
1.  **Architecture:**
    -   Use **Mesh/P2P** architecture (browsers connect directly).
    -   Use existing **Socket.io** server as the "Signaling Server" (to exchange SDP offers/answers and ICE candidates).
2.  **Backend (Signaling):**
    -   Add `call-user`, `answer-call`, `ice-candidate` socket events.
3.  **Frontend:**
    -   Create `VideoCallModal` component.
    -   Use `navigator.mediaDevices.getUserMedia()` for camera/mic access.
    -   Implement `RTCPeerConnection` logic.
    -   Handle UI states: Calling, Ringing, Connected, Ended.
4.  **Testing:** Localhost with two browser windows (Incognito).
