# SSAAM — Student/School Attendance & Activity Management

A Vue 3 + Vite frontend with an Express/Node.js backend for managing student attendance, events, and accounts across multiple colleges.

## Stack
- **Frontend**: Vue 3, Vite, Tailwind CSS, Vue Router
- **Backend**: Express (Node 20), MongoDB Atlas (Mongoose)
- **Auth**: JWT, Google OAuth 2.0 (Passport)
- **Storage**: Cloudinary (profile photos)
- **Email**: Nodemailer with multiple Gmail accounts

## How to run

Two workflows must both be running:

| Workflow | Command | Port |
|---|---|---|
| `Start application` | `npm run dev` | 5000 (frontend + proxy) |
| `Backend Server` | `node server.js` | 3001 (API) |

The Vite dev server proxies `/apis/*` and `/api/auth/*` to `localhost:3001`, so the frontend uses relative URLs throughout.

## Environment
All required secrets are in `.env`. External services used:
- **MongoDB Atlas** — `MONGODB_URI`
- **Cloudinary** — `CLOUDINARY_URL`
- **Google OAuth** — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- **Gmail** — `GMAIL_ACCOUNTS` (array of app-password accounts for email sending)
- **JWT** — `JWT_SECRET`

## Project structure
```
src/
  pages/        # Vue page components (routed views)
  components/   # Shared UI components
  services/     # API fetch wrappers (apiService.js)
  composables/  # Vue composables
  router/       # Vue Router config
  config/       # API base URL, Cloudinary config
SSAAM_VERCEL_BACKEND.js   # Main Express app (all routes/models)
server.js                 # Entry point — calls app.listen()
api/index.js              # Vercel serverless adapter (not used on Replit)
```

## User preferences
