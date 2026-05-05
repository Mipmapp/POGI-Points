# SSAAM - Student School Activities Attendance Monitoring

## Overview
SSAAM is a Vue 3 + Vite SPA for JRMSU that monitors student attendance at school activities. It supports dual-role authentication (Students and Masters/Teachers), full CRUD student management, RFID check-in, face-recognition enrolment/check-in, contribution/raffle tracking, GPS geofencing, and a POS receipt panel. The backend is an Express.js API backed by MongoDB Atlas.

## User Preferences
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.
- I prefer simple language.
- I like functional programming.

## Tech Stack
| Layer      | Technology |
|------------|-----------|
| Frontend   | Vue 3 (Composition API) + Vite 5 |
| Styling    | Tailwind CSS |
| Routing    | Vue Router 4 |
| Backend    | Express.js (`SSAAM_VERCEL_BACKEND.js`, entry `server.js`) |
| Database   | MongoDB Atlas (Mongoose) |
| Auth       | JWT (dual-role: Student / Master) |
| Email      | Nodemailer — rotating Gmail SMTP pool |
| Images     | ImgBB upload, client-side compression |
| Face ID    | `@vladmandic/face-api` (in-browser) |
| Maps       | Leaflet + OpenStreetMap |

## Theme System
The app uses a **CCS purple + gold** palette matching the JRMSU College of Computer Studies shield logo.

| Token | Hex | Usage |
|-------|-----|-------|
| `ssaam-dark` | `#3d1154` | Deep royal purple (shield background) |
| `ssaam-light` | `#7d2fa3` | Medium purple (buttons, gradients) |
| `ssaam-gold` | `#c9952b` | Antique gold (banner accent) |
| `ssaam-gold-light` | `#e8c840` | Bright gold highlight |

**Tailwind blue palette is overridden** in `tailwind.config.js` to remap all `blue-*` classes to purple tones automatically. Every `bg-blue-600`, `text-blue-700`, `ring-blue-300` etc. becomes brand-purple without touching any template code.

CSS variables are defined in `src/assets/theme.css` (imported first in `main.js`) under `:root` and `[data-theme="ccs"]`. Use `var(--ssaam-dark)`, `var(--ssaam-light)`, `var(--ssaam-gold)` in any inline style.

## Project Structure
```
src/
├── assets/
│   ├── theme.css           CSS custom properties — CCS purple+gold palette
│   └── styles.css          Global CSS (Tailwind directives + shared animations)
├── components/             Reusable Vue components
│   ├── AdminContributionPanel.vue
│   ├── AdminRaffleTicketPanel.vue
│   ├── AnnouncementPopup.vue
│   ├── ContributionsModal.vue
│   ├── FaceRecognitionSettings.vue
│   ├── GeofenceMap.vue
│   ├── LoadingScreen.vue
│   ├── LoyversePOSPanel.vue
│   ├── Manage.vue
│   ├── StudentContributionsView.vue
│   ├── StudentFaceCheckIn.vue
│   ├── StudentFaceEnroll.vue
│   ├── StudentRaffleResultsView.vue
│   └── TopBar.vue
├── composables/
│   └── useCollege.js       Reactive college/department state (isCCS, isCOE, isSOM, isCNAHS)
├── config/
│   ├── api.js              getCollege(), buildAPIUrl(), getDefaultHeaders()
│   ├── departments.js      Canonical array of all JRMSU colleges + programs
│   └── themes.js           COLLEGES export + checkDepartment helper
├── pages/                  Route-level page components (replaces /views)
│   ├── Dashboard.vue       Main authenticated dashboard (~20k lines, all panels)
│   ├── EventDetails.vue    Public event attendance detail page
│   ├── Login.vue           Login + Face ID modal + admin verification
│   └── Register.vue        Multi-step student registration
├── router/
│   └── index.js            Vue Router 4 — 4 routes pointing to /pages
├── services/
│   └── apiService.js       Centralised fetch helpers (apiGet/Post/Put/Patch/Delete/Upload)
└── utils/
    ├── faceapi.js          Face-API model loader helpers
    ├── formatters.js       Shared formatDate, formatDateTime, formatRelativeDate, getInitials, formatCurrency
    ├── ssaamCrypto.js      Timestamp-based token encoding
    ├── theme.js            applyTheme(), initThemeWatcher() — college-aware gradient swapping
    └── tokenHandler.js     JWT storage and parsing helpers
```

## Key Architectural Decisions

### Multi-College Architecture
A single MongoDB database uses prefixed collections per college. The active college is resolved by `getCollege()` in `src/config/api.js` and sent on every API request via the `X-SSAAM-College` header.

Four colleges are supported — **CCS** (default, blue), **COE** (orange), **SOM** (green/yellow), **CNAHS** (green).

### Shared Utilities (New — post-refactor)
| File | Purpose |
|------|---------|
| `src/composables/useCollege.js` | Vue composable providing `isCCS`, `isCOE`, `isSOM`, `isCNAHS` computed refs. Replaces duplicated inline checks across components. |
| `src/utils/formatters.js` | `formatDate`, `formatDateTime`, `formatRelativeDate`, `getInitials`, `truncate`, `formatCurrency`. Import from here instead of duplicating. |
| `src/utils/theme.js` | Extracted from `main.js` — college-aware gradient class swapping + MutationObserver watcher. |
| `src/services/apiService.js` | Wraps `fetch` with base URL resolution, college header, and auth token injection. |

### Theme System
`src/utils/theme.js` swaps Tailwind blue-gradient classes to SOM green/yellow when the SOM college is active. Called once on mount via `initThemeWatcher()` in `main.js`.

### Authentication
JWT tokens are stored in `localStorage`. `tokenHandler.js` handles storage/parsing. Encrypted timestamp tokens (via `ssaamCrypto.js`) provide anti-bot protection on registration.

### Dashboard
`src/pages/Dashboard.vue` is a large single-file component (~20k lines) that houses all admin and student panels as conditional sections. Component extraction is a future refactor goal.

## API Proxy (Development)
Vite proxies `/apis/*` to the Express backend running on port 3001. The proxy config is in `vite.config.js`.

## Running the Project
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5000) |
| `node server.js` | Start Express backend (port 3001) |

## External Dependencies
- **Database:** MongoDB Atlas (connection string in Replit userenv `MONGODB_URL`)
- **Image Hosting:** Cloudinary (`app_uploads` folder) — notification images + student/admin profile photos
- **Email Service:** Gmail SMTP via Nodemailer
- **Face Recognition:** `@vladmandic/face-api` (WASM models served from `/public`)
- **Maps:** Leaflet + OpenStreetMap (no API key required)

## Cloudinary Image Lifecycle
Notification images are automatically deleted from Cloudinary (with CDN cache invalidation via `invalidate: true`) when:
- A notification is deleted (`DELETE /apis/notifications/:id`)
- A notification's image is replaced with a new one (`PUT /apis/notifications/:id`)

### Orphan Cleanup Script
`scripts/cleanup_cloudinary.js` cross-references every notification, student, and admin document in MongoDB against all assets in the Cloudinary `app_uploads` folder and removes any that are no longer referenced.

```bash
# Preview what would be deleted (safe — no changes made)
node scripts/cleanup_cloudinary.js

# Actually delete orphaned images (with CDN invalidation)
node scripts/cleanup_cloudinary.js --delete
```

Requires env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `MONGODB_URL`.
