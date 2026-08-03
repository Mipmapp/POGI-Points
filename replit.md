# SSAAM — Student School Activities Attendance Monitoring

A Vue 3 + Vite frontend with an Express backend for managing student attendance and activities at Jose Rizal Memorial State University (JRMSU), College of Computing Studies.

## Stack

- **Frontend**: Vue 3, Vite, Tailwind CSS, Vue Router
- **Backend**: Express (Node.js), served via `server.js` → `SSAAM_VERCEL_BACKEND.js`
- **Database**: MongoDB Atlas
- **Auth**: JWT, Google OAuth 2.0 (Passport.js)
- **Storage**: Cloudinary (image uploads)
- **Email**: Nodemailer (Gmail)
- **Other**: face-api.js (face recognition), xlsx, html2pdf.js

## How to run

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| Backend Server | `node server.js` | 3001 |

The Vite dev server proxies `/apis` and `/api/auth` to the Express backend on port 3001.

## Environment variables

Most non-secret values are stored in `.replit` under `[userenv.shared]`:

- `MONGODB_URI` — MongoDB Atlas connection string
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `SSAAM_API_KEY`, `SSAAM_CRYPTO_KEY` — internal app keys
- `ADMIN_VERIFICATION_SECRET` — admin verification token
- `GOOGLE_CALLBACK_URL` — OAuth redirect URI
- `PORT` — backend port (3001)

Secrets (stored in Replit Secrets):
- `SESSION_SECRET` — session signing key

Additional secrets that may be needed for full functionality:
- `JWT_SECRET` — JWT signing (currently loaded from `.env`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `CLOUDINARY_URL` — full Cloudinary credentials for uploads
- `GMAIL_ACCOUNTS` — Gmail accounts JSON for email sending

## User preferences

- Keep the existing Vue 3 + Express structure; do not migrate or restructure.
