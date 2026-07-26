# SSAAM — Student School Activities Attendance Monitoring

Vue 3 + Vite frontend for JRMSU (Jose Rizal Memorial State University) College of Computing Studies student government activities and attendance tracking system.

## Stack

- **Frontend**: Vue 3, Vite, Tailwind CSS, Vue Router
- **Backend**: Hosted on Vercel at `https://ssaam-api.vercel.app` (not running locally)
- **Auth**: JWT-based, handled by the Vercel backend

## Running the app

Start the frontend dev server (port 5000):

```
npm run dev
```

API calls to `/apis/*` are proxied to `https://ssaam-api.vercel.app` via Vite's dev server proxy.

## Notes

- `vite-plugin-pwa` was removed because its `workbox-expiration` transitive dependency was blocked by the Replit Package Firewall. PWA features (service worker, offline caching) are disabled in dev mode; re-add the plugin if you need a production build with PWA support.
- The local Express backend (`server.js` / `SSAAM_VERCEL_BACKEND.js`) is present but not used in this setup — the frontend connects to the already-deployed Vercel backend.

## User preferences

- Run frontend only; connect to the existing Vercel backend.
