# SSAAM — Student School Activities Attendance Monitoring

Vue 3 + Vite frontend for JRMSU (Jose Rizal Memorial State University) College of Computing Studies student government activities and attendance tracking system.

## Stack

- **Frontend**: Vue 3, Vite, Tailwind CSS, Vue Router
- **Backend**: Hosted on Vercel at `https://ssaam-api.vercel.app` (not running locally)
- **Auth**: JWT-based, handled by the Vercel backend

## Running the app

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| Backend Server | `node server.js` | 3001 |

API calls from the frontend (`/apis/*`) are proxied by Vite to the local Express backend on port 3001, which connects to MongoDB Atlas.

## Notes

- `vite-plugin-pwa` was removed because its `workbox-expiration` transitive dependency was blocked by the Replit Package Firewall. PWA features (service worker, offline caching) are disabled — re-add the plugin if a production build with PWA support is needed.
- All credentials (MongoDB, Cloudinary, JWT secret, Gmail accounts) are loaded from `.env` via `dotenv`.

## User preferences

- Run both frontend and local backend on Replit.
