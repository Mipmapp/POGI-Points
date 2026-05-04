# SSAAM — Student School Activities Attendance Monitoring
### Jose Rizal Memorial State University (JRMSU)

SSAAM is a web-based attendance monitoring system for tracking student participation in school activities. It serves four colleges at JRMSU with per-college theming, dual-role access (Students and Master accounts), and support for RFID badge scanning, face-recognition check-in, GPS geofencing, and contribution/raffle management.

---

## Features

| Area | Highlights |
|------|-----------|
| **Authentication** | JWT dual-role login (Student / Master), encrypted timestamp anti-bot protection, email OTP password reset |
| **Attendance** | RFID scanner (fullscreen kiosk mode), face-recognition check-in, manual Student ID entry, single/dual-session tracking, late threshold |
| **Face ID** | Browser-based enrolment and check-in via `@vladmandic/face-api`, geolocation pre-check for geofenced events |
| **Geofencing** | Per-event configurable geofence on Leaflet + OpenStreetMap; read-only student view |
| **Student Management** | Full CRUD with server-side search, filtering, and pagination |
| **Contributions** | Per-event contribution tracking with live summary cards and "Paid On" date filtering |
| **Raffle Tickets** | Raffle ticket pool management and result publishing |
| **Notifications** | Merged global + per-college announcements with like/seen tracking |
| **POS Panel** | Loyverse POS integration — auto-receipt composer with ESC/POS printing |
| **Multi-College** | CCS (blue), COE (orange), SOM (green/yellow), CNAHS (green) — single DB, prefixed collections |

---

## Tech Stack

```
Frontend  Vue 3 + Vite 5 + Tailwind CSS + Vue Router 4
Backend   Express.js + MongoDB Atlas (Mongoose)
Auth      JWT + encrypted timestamp tokens
Email     Nodemailer (rotating Gmail SMTP pool)
Images    ImgBB (client-side compressed uploads)
Face API  @vladmandic/face-api (in-browser WASM)
Maps      Leaflet + OpenStreetMap
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (connection string required)

### Install dependencies
```bash
npm install
```

### Environment variables
Set the following in your environment (Replit userenv / `.env`):

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `IMGBB_API_KEY` | ImgBB API key for image uploads |
| `GMAIL_USER` / `GMAIL_PASS` | Gmail SMTP credentials for email |
| `VITE_API_URL` | (optional) Backend base URL override — leave blank in dev (proxy handles it) |

### Run in development
```bash
# Terminal 1 — Express backend (port 3001)
node server.js

# Terminal 2 — Vite dev server (port 5000)
npm run dev
```

Vite proxies all `/apis/*` requests to the backend automatically.

---

## Project Structure

```
src/
├── assets/styles.css       Global CSS — Tailwind directives + shared animations
├── components/             Reusable UI components
├── composables/
│   └── useCollege.js       College state composable (isCCS, isCOE, isSOM, isCNAHS)
├── config/
│   ├── api.js              College detection + API URL helpers
│   ├── departments.js      Canonical college/program list
│   └── themes.js           COLLEGES constant + checkDepartment
├── pages/                  Route-level page components
│   ├── Dashboard.vue       All admin + student dashboard panels
│   ├── EventDetails.vue    Public event attendance page
│   ├── Login.vue           Login page + Face ID + admin modals
│   └── Register.vue        Multi-step student registration
├── router/index.js         Vue Router 4 routes
├── services/
│   └── apiService.js       Centralised fetch helpers (apiGet/Post/Put/Patch/Delete/Upload)
└── utils/
    ├── faceapi.js          Face-API model loader
    ├── formatters.js       Date, currency, and string formatting
    ├── ssaamCrypto.js      Timestamp token encoding
    ├── theme.js            College gradient theme watcher
    └── tokenHandler.js     JWT storage + parsing
```

---

## Multi-College Architecture

Each college has its own prefixed MongoDB collections. The active college is resolved via `src/config/api.js → getCollege()` and attached to every API request as the `X-SSAAM-College` header.

**College codes:** `CCS` · `COE` · `SOM` · `CNAHS`

---

## Contributing

This project follows standard Vue 3 Composition API conventions.

- Shared formatting → `src/utils/formatters.js`
- College detection → `src/composables/useCollege.js`
- API calls → `src/services/apiService.js`
- Global styles / animations → `src/assets/styles.css`
- New page routes → `src/pages/`

---

## License

Internal use only — Jose Rizal Memorial State University.
