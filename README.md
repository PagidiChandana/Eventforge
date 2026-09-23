# EventForge — Enterprise Corporate Event & Conference Management Platform

**EventForge** is a full-stack MERN capstone application designed for managing corporate conferences, tech summits, and enterprise workshops. It features real-time QR ticket check-in, multi-role authorization (Admin, Organizer, Staff, Speaker, Attendee, Sponsor), custom sponsorship deliverable tracking, MongoDB aggregation analytics, and Google Gemini AI content generation and session recommendations.

---

## 🌟 Key Features

### 🏢 Core Event Management
- **Event Lifecycle**: Create, edit, publish, and manage multi-day conferences and summits.
- **Venue & Organization Directory**: Manage venues (capacity, addresses) and host organizations.
- **Session Scheduling**: Manage keynotes, breakout sessions, tracks, room assignments, and speakers.

### 🎟️ Ticketing, Registration & Coupons
- **Ticket Categories**: Early Bird, Standard, VIP passes with capacity limits and sale windows.
- **Coupon Codes**: Percentage or fixed-amount discounts with usage limits (`EARLY2026`).
- **Waitlist & Approval Workflow**: Automated status management (`Approved`, `Pending`, `Waitlisted`, `Cancelled`).
- **Digital Tickets**: Unique ticket numbers and secure encrypted QR tokens.

### 📲 On-Site Event Operations
- **QR Code Check-In**: Camera-based QR ticket scanner for event staff preventing invalid, expired, or duplicate check-ins.
- **Session Attendance Tracking**: Track capacity utilization and attendance per breakout room.
- **Staff Shifts & Assignments**: Assign staff roles (`Check-in Staff`, `Session Coordinator`, `Help Desk`).

### 🎤 Speaker Hub & 🤝 Sponsor Portal
- **Speaker Hub**: Speaker profiles, assigned session schedules, availability, and presentation deck uploads.
- **Sponsor Portal**: Package management (Platinum, Gold, Silver), brand asset uploads (logos, banners), and deliverable status workflows (`Pending` → `In Progress` → `Submitted` → `Approved`).

### 🤖 AI Capabilities (Google Gemini)
- **AI Event Content Generator**: Generate polished event descriptions, speaker bios, announcements, and session summaries with 1-click apply.
- **AI Session Recommendation Engine**: Hybrid scoring algorithm matching attendee profile interests, role, and schedule with session tags, returning personalized recommendations with match scores (e.g. `95% Match`).
- **Resilient Fallback**: Algorithmic scoring continues seamlessly if AI API keys are unavailable.

### 📊 Organizer Analytics & Attendee Feedback
- **Real-Time Aggregation**: MongoDB aggregation pipelines computing registration breakdown, check-in %, no-shows, session seat fill rates, feedback rating distribution (1-5 stars), and sponsor deliverable progress.
- **Attendee Feedback**: Star rating & review system preventing duplicate submissions.

---

## 🏗️ Architecture & Technology Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │                     React 18 Client                     │
   │   (Vite, React Router v6, Axios, Lucide Icons, CSS)     │
   └────────────────────────────┬────────────────────────────┘
                                │ JWT Auth Bearer Tokens / HTTP
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                    Express 4 API                        │
   │  (authMiddleware, eventAuthMiddleware, rateLimiter)     │
   └─────────────┬───────────────────────────┬───────────────┘
                 │                           │
                 ▼                           ▼
   ┌───────────────────────────┐   ┌─────────────────────────┐
   │     MongoDB Database      │   │  Google Gemini AI API   │
   │ (Mongoose Schemas & Aggs) │   │ (@google/generative-ai) │
   └───────────────────────────┘   └─────────────────────────┘
```

- **Frontend**: React 18, Vite, React Router DOM, Axios, Lucide Icons, Vanilla CSS (Glassmorphism & Dark Mode).
- **Backend**: Node.js, Express, Mongoose ODM, JWT Authentication, bcryptjs, express-validator.
- **Database**: MongoDB (Local or MongoDB Atlas) with Aggregation Pipelines.
- **AI Provider**: Google Generative AI (`gemini-1.5-flash`).

---

## 👥 User Roles & Access Control

| Role | Access Scope |
|---|---|
| **Platform Admin** | Full access to all events, users, venues, organizations, analytics, and platform settings. |
| **Event Organizer** | Manages owned events, sessions, ticket categories, coupons, staff assignments, sponsor packages, and views analytics. |
| **Event Staff** | Access to QR Scanner, session attendance check-in, assigned shifts, and attendee support lookup. |
| **Speaker** | Access to Speaker Hub: views assigned sessions, updates speaker bio, uploads presentation decks. |
| **Sponsor** | Access to Sponsor Portal: views package benefits, uploads brand logos, submits deliverables. |
| **Attendee** | Browses events, registers for tickets, applies coupons, views digital QR tickets, receives AI recommendations, submits feedback. |

---

## 🔑 Environment Variables Setup

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/eventforge
JWT_SECRET=your_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
AI_TIMEOUT_MS=20000
```

---

## Deploy to Render (API) and Vercel (client)

The repository includes a Render Blueprint at [`render.yaml`](render.yaml) and Vercel SPA routing in [`client/vercel.json`](client/vercel.json). The API uses MongoDB Atlas; Render does not provide the MongoDB database for this application.

### 1. Deploy the API to Render

1. Create a MongoDB Atlas database and database user. Copy its connection string, including the database name, for `MONGODB_URI`.
2. In Render, create a Blueprint deployment from this repository and select `render.yaml`. The service root is `server`; its start command is `npm start` and its health check is `/api/health`.
3. Set the prompted environment variables:
   - `MONGODB_URI`: your Atlas connection string.
   - `CLIENT_URL`: the exact Vercel site origin, for example `https://eventforge.vercel.app` (no path or trailing slash).
   - `JWT_SECRET` is generated by the Blueprint. Keep it private; production startup requires at least 32 characters.
4. After deployment, verify `https://<render-service>.onrender.com/api/health` returns a successful health response.

`GEMINI_API_KEY` is optional. Add it to the Render service environment if ForgeBot and AI content-generation features should use Gemini; without it, the client guide's built-in help remains available.

### 2. Deploy the client to Vercel

1. Import the same repository into Vercel and set **Root Directory** to `client`.
2. Use the Vite defaults: build command `npm run build` and output directory `dist`.
3. Add `VITE_API_URL` in the Vercel project environment variables, for Production and Preview as appropriate. Its value must be the deployed API base including `/api`, for example `https://eventforge-api.onrender.com/api` (no trailing slash).
4. Deploy or redeploy after setting the variable; Vite embeds it during the build.
5. Copy the deployed Vercel origin back to Render's `CLIENT_URL` and redeploy the API if you changed it. For additional preview/custom domains, set `CLIENT_URLS` on Render to a comma-separated list of exact allowed origins.

The Vercel rewrite sends client-side routes to `index.html`. Set `VITE_API_URL` so API calls go directly to Render instead of being handled as frontend routes.

### Production data

Do not run `npm run seed` against a production database: that development seed script deletes existing application records before creating demo data. Create production users through the application/admin workflows and use a separate, backed-up database for demonstrations.

---

## ⚡ Quick Start & Local Setup

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/eventforge.git
cd eventforge

# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install
```

### 2. Seed Demo Environment

To populate realistic corporate demo data (events, sessions, speakers, sponsors, registrations, tickets):

```bash
cd server
npm run seed
```

### 3. Run Development Servers

```bash
# Terminal 1: Start Express Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: Start Vite React Frontend (Port 5173)
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 👤 Demo Accounts (Pre-configured)

Password for all demo accounts: **`password123`**

| Role | Email | Purpose |
|---|---|---|
| **Platform Admin** | `admin@eventforge.com` | Full system administration |
| **Event Organizer** | `organizer@eventforge.com` | Event creation, management & analytics |
| **Event Staff** | `staff@eventforge.com` | QR code ticket scanner & session attendance |
| **Speaker** | `speaker@eventforge.com` | Speaker Hub & deck uploads |
| **Sponsor** | `sponsor@eventforge.com` | Sponsor Portal & deliverable submissions |
| **Attendee** | `attendee@eventforge.com` | Event registration, tickets & AI recommendations |

---

## 🧪 Testing

Run the automated integration test suite:

```bash
cd server
npm test
```

Tests cover Auth, Events, Tickets, QR Check-In, Speaker/Sponsor permissions, AI prompt builders, Feedback, and Analytics pipelines.

---

## 📄 License
ISC License — Created as a Senior MERN Capstone Project.
