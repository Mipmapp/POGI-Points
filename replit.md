# SSAAM — Student School Activities Attendance Monitoring

A full-stack web application for Jose Rizal Memorial State University (JRMSU), College of Computing Studies. Tracks student attendance at school activities.

## Stack
- **Frontend**: Vue 3 + Vite + Tailwind CSS (port 5000)
- **Backend**: Express.js + MongoDB (Mongoose) (port 3001)
- **Auth**: JWT + Google OAuth 2.0 (passport-google-oauth20)
- **Storage**: Cloudinary (images), MongoDB Atlas (data)
- **Email**: Nodemailer (multiple Gmail accounts)

## How to run

Two workflows run in parallel (both started via the **Project** run button):

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| Backend Server | `node server.js` | 3001 |

The Vite dev server proxies `/apis` and `/api/auth` requests to the backend at `localhost:3001`.

## Environment
Credentials are stored in `.env` (Cloudinary, MongoDB Atlas, JWT secret, Gmail accounts, ARMS API).

**Google OAuth note**: The `GOOGLE_CALLBACK_URL` is set in `.replit` `[userenv.shared]` to the Replit dev domain. If the dev domain changes, update that value and re-register it in the Google Cloud Console.

## User preferences
