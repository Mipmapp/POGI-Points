# SSAAM — Student School Activities Attendance Monitoring

A web-based attendance monitoring system for JRMSU-CCS (Jose Rizal Memorial State University – College of Computing Studies). Built with Vue 3 + Vite (frontend) and Express.js (backend), using MongoDB Atlas, Cloudinary, face-detection, and email notifications.

## How to run

Two workflows run in parallel (configured in `.replit`):

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 (frontend) |
| Backend Server | `node server.js` | 3001 (backend) |

The Vite dev server proxies `/apis/*` requests to the Express backend at `localhost:3001`, so the frontend and backend work seamlessly together.

## Stack

- **Frontend**: Vue 3, Vite, Tailwind CSS, Vue Router, PWA (vite-plugin-pwa)
- **Backend**: Express.js (`SSAAM_VERCEL_BACKEND.js` → `server.js`)
- **Database**: MongoDB Atlas (Mongoose)
- **Storage**: Cloudinary (image uploads)
- **Auth**: JWT + bcrypt
- **Face detection**: @vladmandic/face-api
- **Email**: Nodemailer (multiple Gmail accounts)

## Environment

Credentials are stored in `.env` and `.replit` `[userenv]` sections. Key variables:
- `MONGODB_URI` — MongoDB Atlas connection string
- `CLOUDINARY_URL` / `CLOUDINARY_CLOUD_NAME` — image storage
- `JWT_SECRET` — token signing
- `GMAIL_ACCOUNTS` — JSON array of Gmail credentials for email dispatch
- `VITE_API_URL` — set to `""` (uses Vite proxy in dev; configure for production)

## User preferences

_None recorded yet._
