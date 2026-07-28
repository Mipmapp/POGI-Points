# SSAAM — Student School Activities Attendance Monitoring

A full-stack web application for Jose Rizal Memorial State University's College of Computing Studies Student Government. Tracks student attendance at school activities and events.

## Stack

- **Frontend:** Vue 3 + Vite + Tailwind CSS (port 5000)
- **Backend:** Express.js (Node 24) on `SSAAM_VERCEL_BACKEND.js` (port 3001)
- **Database:** MongoDB Atlas (mongoose)
- **Image storage:** Cloudinary
- **Auth:** JWT + Google OAuth (passport-google-oauth20)
- **Email:** Nodemailer with Gmail accounts

## Running the project

Two workflows run in parallel (configured in `.replit`):

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| Backend Server | `node server.js` | 3001 |

The Vite dev server proxies `/apis` and `/api/auth` requests to the Express backend on port 3001.

## Environment variables

Most are already set in `.replit` `[userenv.shared]`. Sensitive values are stored as Replit Secrets:

| Key | Required | Notes |
|---|---|---|
| `MONGODB_URI` | ✅ | Already configured |
| `SSAAM_API_KEY` | ✅ | Already set; also used as JWT fallback |
| `JWT_SECRET` | Optional | Falls back to `SSAAM_API_KEY` if unset |
| `CLOUDINARY_URL` | Optional | For image uploads |
| `GMAIL_ACCOUNTS` | Optional | JSON array `[{"user":"...","pass":"..."}]`; email disabled if unset |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth login |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth login |
| `GOOGLE_CALLBACK_URL` | Optional | Google OAuth callback URL |
| `ARMS_API_KEY` | Optional | External ARMS integration |
| `ARMS_API_SECRET` | Optional | External ARMS integration |

## User preferences

_No preferences recorded yet._
