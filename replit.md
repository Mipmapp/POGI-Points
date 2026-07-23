# SSAAM — Student School Activities Attendance Monitoring

A Vue 3 + Vite PWA frontend with an Express + MongoDB Atlas backend for tracking student attendance at school activities.

## Stack

- **Frontend:** Vue 3, Vite, Tailwind CSS, Vue Router (PWA-enabled)
- **Backend:** Express 5, Mongoose (MongoDB Atlas), JWT auth, Cloudinary, Nodemailer
- **Tools:** face-api.js (face recognition), cropperjs, xlsx, html2pdf

## Running the Project

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| Backend Server | `node server.js` | 3001 |

The Vite dev server proxies `/apis/*` requests to the backend at `localhost:3001`.

Start both with the **Project** run button (parallel workflow).

## Environment

All environment variables are configured in `.replit` under `[userenv]`. Key vars:

- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — JWT signing secret
- `CLOUDINARY_CLOUD_NAME` — Cloudinary account
- `GMAIL_ACCOUNTS` — Array of Gmail credentials for email sending
- `SSAAM_API_KEY`, `SSAAM_CRYPTO_KEY`, `ADMIN_VERIFICATION_SECRET`
- `VITE_API_URL` — Left empty in dev (Vite proxy handles `/apis` locally)

## User Preferences

- Keep the existing project structure and stack as-is.
