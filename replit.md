# SSAAM — Student School Activities Attendance Monitoring

A full-stack attendance monitoring system for Jose Rizal Memorial State University (JRMSU), College of Computing Studies.

## Stack
- **Frontend**: Vue 3 + Vite + Tailwind CSS (port 5000)
- **Backend**: Express.js API server (port 3001)
- **Database**: MongoDB Atlas
- **Storage**: Cloudinary (image uploads)
- **Auth**: JWT + Google OAuth 2.0 + Passport.js
- **Face recognition**: @vladmandic/face-api

## Running the project

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| Backend Server | `node server.js` | 3001 |

The Vite dev server proxies `/apis` and `/api/auth` requests to the backend on port 3001.

## Key entry points
- `src/main.js` — Vue app entry
- `SSAAM_VERCEL_BACKEND.js` — Express app (routes, middleware)
- `server.js` — starts the Express server locally
- `api/index.js` — Vercel serverless entry point
- `vite.config.js` — Vite config with proxy rules

## Environment variables
Secrets are managed via Replit's environment secrets. The `.env` file provides local values; production uses `.env.production`.

## User preferences
