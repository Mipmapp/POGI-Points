# SSAAM — Student School Activities Attendance Monitoring

A Vue 3 + Vite frontend with an Express/Node.js backend for Jose Rizal Memorial State University (JRMSU) College of Computing Studies.

## Stack
- **Frontend**: Vue 3, Vite, Vue Router, Tailwind CSS
- **Backend**: Express (ESM), served via `server.js` → `SSAAM_VERCEL_BACKEND.js`
- **Database**: MongoDB Atlas (Mongoose)
- **Storage**: Cloudinary (image uploads)
- **Auth**: JWT + bcrypt
- **Email**: Nodemailer (rotating Gmail accounts)
- **Face detection**: @vladmandic/face-api

## How to run

Two servers must run in parallel (already configured as Replit workflows):

| Workflow | Command | Port |
|---|---|---|
| **Start application** | `npm run dev` | 5000 (Vite dev server) |
| **Backend Server** | `node server.js` | 3001 (Express API) |

The Vite dev server proxies all `/apis/*` requests to `http://localhost:3001`.

## Environment
Most config is loaded from `.env` at runtime by the backend. Key env vars are also declared in `.replit` under `[userenv]`:
- `MONGODB_URI` — MongoDB Atlas connection string
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `JWT_SECRET` — JWT signing secret
- `SSAAM_CRYPTO_KEY` — app-level encryption key
- `VITE_API_URL` — set to `""` in development (uses Vite proxy); set to deployed API URL in production

## User preferences
