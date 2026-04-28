# SSAAM - Student School Activities Attendance Monitoring

## Overview
SSAAM is a Vue 3 + Vite frontend application for monitoring student attendance at school activities, with contribution management, and raffle ticket tracking. This Single Page Application (SPA) integrates with a backend API to provide dual-role authentication (Students and Masters/Teachers), comprehensive student data management with CRUD operations, and features like RFID code support for attendance. The project aims to provide a robust, scalable, and secure system for schools to track student engagement in activities efficiently, addressing performance concerns with large datasets through optimized pagination and server-side filtering.

## User Preferences
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.
- I prefer simple language.
- I like functional programming.

## Running the App on Replit

Two workflows run simultaneously:
- **Backend Server**: `node server.js` on port 3001 (console output)
- **Start application**: `npm run dev` on port 5000 (webview — what the user sees)

The Vite dev server proxies `/apis/*` requests from port 5000 → port 3001. In development, `VITE_API_URL` is empty so all API calls are relative and proxied automatically.

## Environment Variables (Replit Secrets/Env Vars)

Set in Replit shared environment:
- `MONGODB_URL` — MongoDB Atlas connection string
- `SSAAM_API_KEY` — Server-side API key
- `SSAAM_CRYPTO_KEY` — Crypto key for timestamp auth
- `ADMIN_VERIFICATION_SECRET` — Admin verification secret
- `VITE_SSAAM_API_KEY` — Client-side API key
- `VITE_SSAAM_STUDENTS_API_KEY` — Client-side students API key
- `PORT` — Set to 3001 for the backend server

Optional (not yet set):
- `IMGBB_API_KEYS` — Comma-separated ImgBB API keys for image uploads
- `MASTER_CREATION_SECRET` — For creating master admin accounts
- `ADMIN_SECRET_KEY` — Admin-level secret
- `PRIMARY_ADMIN_USERNAME` — Override default admin username (defaults to 'ssaam')
- `FRONTEND_URL` — Production frontend URL for CORS (set automatically by Replit)

## System Architecture
The application is a Vue 3 SPA utilizing the Composition API and Vite 5. Styling is handled by Tailwind CSS, and routing by Vue Router 4.

**Backend:** Express.js server (`SSAAM_VERCEL_BACKEND.js`) with MongoDB/Mongoose. Entry point is `server.js`. All routes are under `/apis/*`.

**UI/UX Decisions:**
- Professional SVG icon system.
- Mobile-first design with an animated hamburger menu.
- Custom scrollbar styling (purple/pink gradient).
- Notifications display links with a purple-to-pink gradient.
- Enhanced custom calendar and time pickers with SSAAM aesthetic.
- Fullscreen RFID scanner mode with purple gradient background, two-column layout (scanner left, results right), and student photo display in Recent Logs with smart photo caching across multiple student identifiers.

**Technical Implementations & Feature Specifications:**
- **POS Receipt Panel (rewritten April 27, 2026):** `LoyversePOSPanel.vue` is now an auto-receipt composer (catalog/cart/items removed). Single line item is auto-derived from the active payment campaign (title becomes the item, `suggestedAmount || amount_due` becomes the price). Customer is the selected student's full name. Cashier is auto-filled from the logged-in user (`currentUser` localStorage — treasurer / co-admin / admin) and is editable. Receipt header (ACADEMIC / address / org name / phone / POS name) is editable via a "Header" modal and persisted in `ssaam_pos_receipt_v2`. Receipt preview shows the CCS shield logo (`public/assets/ccs_logo.png`) at the top. ESC/POS print path renders the logo as a monochrome raster (GS v 0 command, 192-dot wide centered) followed by bold/regular text and the standard "THANK YOU FOR YOUR PURCHASE!" footer. WebUSB + Web Bluetooth printer connection unchanged.
- **Authentication:** Dual-role system — Students (by ID) and Master accounts (Admin/Co-Admin). JWT tokens include `role` field (`admin` or `co-admin`). Co-admin tokens are college-scoped: the server enforces their college restriction on every API call. Super Admin can access all colleges; Co-Admin can only access their assigned college. Encrypted timestamp authentication with XOR+Base64 encoding for all protected API calls. Anti-bot protection for registration.
- **Student Management:** Admin/Master dashboard with full CRUD for student records, search/filter, and pagination. Student names are uppercase, and IDs are validated. Admin-only access for edit/delete.
- **Attendance:** RFID code support for attendance. Students receive email notifications upon RFID verification. Supports both "Single Session" (2-in-a-day) and "Dual Session" (4-in-a-day) attendance tracking modes. RFID scanner supports both RFID scan and manual Student ID input modes. Admins can mark RFID cards as 'Unreadable'. Session-Level Logs, Session Stats & Late Threshold, and Global RFID Scanner Controls are all implemented.
- **Notifications System:** Merges global and per-college notifications with like/seen tracking.
- **Multi-College Architecture:** Single MongoDB database with prefixed collections per college (ccs_, coe_, som_, cnahs_). College is identified via `X-SSAAM-College` header or JWT payload.
- **Image Management:** Integration with ImgBB for image uploads, with client-side compression.
- **GPS Geofencing for Attendance:** Admin-configurable per-event geofence with Leaflet+OpenStreetMap map component.
- **Self-Service Face ID for Students:** Browser-based face enrollment and check-in using @vladmandic/face-api (CDN models). Students check in directly from User > Attendance page — active events show Check In / Check Out buttons per session. Geolocation is pre-checked before opening Face ID modal if the event has a geofence. Pre-fetched coords are passed to StudentFaceCheckIn to avoid double location prompt.
- **Session Check-In/Out Mode:** New sessions always default to `rfidScanner: { checkInEnabled: true, checkOutEnabled: false }` — check-in mode only. Admin enables check-out mode manually via session settings.
- **Attendance Notifications:** Only Check In / Check Out success notifications shown. The "Check In/Out Available" banner and toast have been removed from Dashboard.vue student attendance section.
- **Check-In / Check-Out Toggle (April 28, 2026):** `toggleCheckOut` in `Dashboard.vue` is now symmetric with `toggleCheckIn` — turning Check-Out ON forces Check-In OFF (and vice versa), and `setRfidOperation('in')` is called when Check-Out is turned off so the kiosk banner switches back. Previously, disabling Check-Out left the scanner stuck in Check-Out / Check-In ambiguity.
- **Admin Attendance Refresh Button:** The Refresh button in Admin > Attendance > Events header now uses the same college-themed gradient styling (white-on-gradient) as the user-side My Attendance refresh button instead of the lighter background-tint variant.
- **Sidebar / Page Title Label:** The page title (h1) on the Dashboard page now respects `inRoleView` — co-admins / treasurers in User View see "Dashboard" instead of "Statistics". Statistics is reserved for the Tools view.
- **Terms & Conditions Hover:** The dashboard T&C banner no longer brightens its base gradient on hover; only a soft white light-sweep passes across (1.4 s ease-out).
- **Face ID T&C Gate (`StudentFaceEnroll.vue`):** Before the camera turns on, the user must scroll to the bottom of a 5-section privacy/terms block, tick "I agree", and click "Agree & Continue". Agreement is persisted to `localStorage` (`ssaam_face_tnc_agreed_v1`); the checkbox itself resets every time the modal reopens to force an explicit re-confirmation tap, but the gate is skipped after the first persisted agreement on that browser.
- **Vite Dev Proxy → Vercel Backend:** `vite.config.js` proxies `/apis/*` to the live `https://ssaam-api.vercel.app` backend (not `localhost:3001`) so dev/preview features that depend on production secrets (ImgBB image upload, email, etc.) work without configuring local secrets. The local Backend Server workflow remains available for backend code editing but is not used by the dev proxy.
- **Manage page filters → dropdowns:** The Year / Program / College / Verification Status / Role pill-button rows in `Manage.vue` were replaced with a single responsive grid of compact dropdowns (2 cols on mobile, 3 on sm, 5 on lg) so they fit on one row and don't push the user list down.
- **Profile photo cache invalidation:** After a successful student photo update, `handleStudentPhotoUpload` in `Dashboard.vue` now (a) appends a `?v=<timestamp>` cache-buster to the new photo URL stored on `currentUser`, (b) deletes the persistent `localStorage` entry `photo_<student_id>`, and (c) clears the in-memory `studentPhotoCache` entry. This fixes the "image stays the same after upload" bug.
- **Password Reset:** Three-step email-based password reset with rate limiting and server-time clock sync.

**System Design Choices:**
- **Efficient Pagination:** Frontend displays current page only, with all search and filtering server-side.
- **Security:** Robust validation, anti-bot measures, timestamp-based authentication, restricted CORS origins, security headers.
- **Email:** Nodemailer with a rotating pool of Gmail app-password accounts for OTP/verification emails.

## External Dependencies
- **Database:** MongoDB Atlas (`MONGODB_URL`)
- **Image Hosting:** ImgBB (`IMGBB_API_KEYS`)
- **Email Service:** Gmail SMTP via Nodemailer (hardcoded app-password pool in backend)
