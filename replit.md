# SSAAM — Student School Activities Attendance Monitoring

A Vue 3 + Vite frontend with an Express/Node.js backend for JRMSU (Jose Rizal Memorial State University). Tracks student attendance at school activities.

## Stack

- **Frontend**: Vue 3, Vite, Tailwind CSS, Vue Router
- **Backend**: Express 5, Mongoose (MongoDB Atlas), Passport (Google OAuth), Cloudinary, Nodemailer
- **Auth**: JWT + Google OAuth 2.0
- **Face recognition**: @vladmandic/face-api

## How to run

Install dependencies first (one-time):

```
npm install
```

Two workflows run concurrently:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 (webview) |
| Backend Server | `node server.js` | 3001 (console) |

Vite proxies `/apis` and `/api/auth` requests to `localhost:3001` automatically.

> **Note:** The project declares `"engines": { "node": "24.x" }` in `package.json` but runs correctly on Node 20 (Replit default) with an engine warning.

## Environment / Secrets

All credentials live in `.env` (loaded by dotenv on the backend). Key variables:

- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — JWT signing secret
- `CLOUDINARY_URL` — Cloudinary media storage
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` — Google OAuth
- `GMAIL_ACCOUNTS` — JSON array of Gmail accounts used for email sending
- `SSAAM_CRYPTO_KEY`, `SSAAM_API_KEY`, `ADMIN_VERIFICATION_SECRET`, `ARMS_API_KEY`, `ARMS_API_SECRET`, `DB_PASSWORD` — app-specific secrets

## User preferences

_None recorded yet._
