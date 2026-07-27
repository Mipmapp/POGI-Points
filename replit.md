# SSAAM — Student School Activities Attendance Monitoring

A Vue 3 + Express web application for Jose Rizal Memorial State University (JRMSU), College of Computing Studies Student Government. Manages student attendance, events, and academic activities.

## Stack
- **Frontend**: Vue 3 + Vite + Tailwind CSS (port 5000)
- **Backend**: Express.js (port 3001)
- **Database**: MongoDB Atlas (Mongoose)
- **Storage**: Cloudinary (file/image uploads)
- **Auth**: JWT
- **Email**: Nodemailer (multiple Gmail accounts)

## How to run

Two workflows must both be running:

1. **Start application** — `npm run dev` — starts the Vite dev server on port 5000
2. **Backend Server** — `node server.js` — starts the Express API on port 3001

The Vite dev server proxies `/apis/*` requests to the backend on port 3001.

## Environment
All credentials are in `.env` (MongoDB URI, Cloudinary URL, JWT secret, Gmail accounts, etc.).

## Key files
- `SSAAM_VERCEL_BACKEND.js` — main Express app (routes, middleware)
- `server.js` — entry point that starts the Express server
- `src/` — Vue 3 frontend (components, pages, router, composables)
- `api/` — additional API modules
- `config/cloudinary.js` — Cloudinary configuration

## User preferences
