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

## System Architecture
The application is a Vue 3 SPA utilizing the Composition API and Vite 5. Styling is handled by Tailwind CSS, and routing by Vue Router 4.

**UI/UX Decisions:**
- Professional SVG icon system.
- Mobile-first design with an animated hamburger menu.
- Custom scrollbar styling (purple/pink gradient).
- Notifications display links with a purple-to-pink gradient.
- Enhanced custom calendar and time pickers with SSAAM aesthetic.
- Fullscreen RFID scanner mode with purple gradient background, two-column layout (scanner left, results right), and student photo display in Recent Logs with smart photo caching across multiple student identifiers.

**Technical Implementations & Feature Specifications:**
- **Face ID — 3rd Login Verification (rebuilt April 27, 2026):** Admin login flow has Step 3 of 3 face check after the MM/DD/YY verification code. When the admin has at least one face descriptor enrolled (via Settings → "Face ID — 3rd Login Verification" panel), the camera opens for a live scan; matching uses 128-float descriptors via `@vladmandic/face-api` (CDN-loaded models, lazy-imported) with Euclidean distance threshold 0.55 and a 3-frame match streak. Admins without enrolled faces are silently passed through to keep them from being locked out. Backend endpoints `/apis/masters/face` GET/POST/PATCH/DELETE store descriptors in the Master document (max 10). Components: `src/utils/faceapi.js` (lazy loader + matcher), `src/components/FaceRecognitionSettings.vue` (enrollment panel inserted in Dashboard Settings page), Step 3 modal + scan loop in `src/views/Login.vue`.
- **Authentication:** Dual-role system — Students (by ID) and Master accounts (Admin/Co-Admin). JWT tokens include `role` field (`admin` or `co-admin`). Co-admin tokens are college-scoped: the server enforces their college restriction on every API call. Super Admin can access all colleges; Co-Admin can only access their assigned college. Encrypted timestamp authentication with XOR+Base64 encoding for all protected API calls. Anti-bot protection for registration.
- **Student Management:** Admin/Master dashboard with full CRUD for student records, search/filter, and pagination. Student names are uppercase, and IDs are validated. Admin-only access for edit/delete.
- **Attendance:** RFID code support for attendance. Students receive email notifications upon RFID verification. Supports both "Single Session" (2-in-a-day) and "Dual Session" (4-in-a-day) attendance tracking modes. RFID scanner supports both RFID scan and manual Student ID input modes. Admins can mark RFID cards as 'Unreadable'. **Session-Level Logs:** Admin dashboard displays attendance logs per session (not per event), with Logs button at session level. User dashboard shows expandable event folders with per-session attendance history including check-in/check-out times. **Session Stats & Late Threshold:** Stats (Present, Incomplete, Late, Absent, Total) are fetched from ALL logs separately from paginated display, ensuring accurate counts. Admins can set a custom late threshold time to bulk-update `is_late` status for all attendance records in a session.
- **Global RFID Scanner Controls:** Admins can enable/disable check-in/check-out globally with auto-disable timers enforced server-side.
- **Dashboard Statistics:** Displays aggregate student statistics by program and year level. Enhanced RFID verification stats with expandable user lists.
- **Image Management:** Integration with ImgBB for image uploads, with client-side compression to under 100KB before upload via backend.
- **Form Validation:** Advanced validation with custom error messages, including Unicode support.
- **Notifications System:** GET `/apis/notifications` merges two sources: (1) global `notifications` collection (super admin posted, visible to all) and (2) per-college collections (`ccs_notifications`, `coe_notifications`, etc.) for college-specific posts by medpub/college admin. Results are deduped and sorted by date. POST `/apis/notifications/college` allows medpub/admin to post to their college's collection. Like and seen tracking use the global `notification_seen` collection.
- **Multi-College Manage:** Super admin's Manage page fetches from `/apis/students/all-colleges` (returns all 4 college students with a `college` field). Each user card shows a college badge. College filter tabs (All, CCS, COE, SOM, CNAHS) appear for super admin. Delete/edit requests include `X-SSAAM-College` header derived from the student record's `college` field. Backend DELETE falls back to searching all colleges if student not found in specified college.
- **Admin Profile Token Fix:** `fetchAdminProfile` and all related admin profile functions now use `adminToken || token` (falling back to `token` for legacy support).
- **Duplicate Change Photo Button Removed:** Dashboard.vue no longer shows a standalone "Change Photo" button beside the admin name — only the hover overlay and Edit Form dashed button remain.
- **Manage.vue Unified Theme:** `isCOE()`, `isSOM()`, `isCNAHS()` all return `false` in Manage.vue — all management UI uses SSAAM blue theme regardless of logged-in college.
- **CSS Fix:** Replaced `@apply` directives that referenced custom gradient color utilities (`from-ssaam-dark`, `to-ssaam-light`) in `.login-submit-btn`, `.register-button-primary`, and `.btn-primary` with plain CSS `background-image` rules using hardcoded hex values to prevent PostCSS compilation errors.
- **Password Reset:** Three-step email-based password reset with rate limiting, hashed codes, and enumeration prevention.
- **Admin Settings:** Allows Admins/Masters to toggle user registration and student login status, with custom messages for disabled features. Settings are stored in MongoDB. Includes a feature to clear all user session tokens (force logout).
- **Duplicate Records Search:** Admin feature to search for duplicate student records by RFID, Student ID, or Email, with categorized matches and options to edit/delete duplicates.
- **Registration Restrictions:** Registration is restricted to Gmail addresses only, with case-insensitive duplicate email prevention.

- **Student Request System:** Students have a "Request" page to submit name-change or department/college-change requests. Name changes route to the admin; department changes route to the co-admin of the target college. Requests show status (pending/approved/rejected) and admin notes.
- **Co-Admin Management:** Super admin has a "Co-Admins" page to assign/remove co-admins per college (CCS, COE, SOM, CNAHS) using their username. Each college card shows current co-admin with remove option.
- **Statistics Nav:** For admin and super admin users, the first sidebar item is labeled "Statistics" (not "Dashboard") and shows the student registration statistics table.
- **Manage Filters Cleaned:** Removed Medpub and Treasurer role filter buttons from Manage → Users tab.
- **Logout Animation Fixed:** Logout animation background uses solid college-themed gradients (no broken image references).
- **Create Event Sessions Inline:** The Create Event modal includes a Sessions section so admins can stage one or more sessions (Add/Edit/Delete) before submitting. After the parent event is created, staged sessions are batch-POSTed to `/apis/attendance/events/:eventId/sessions`. The Edit Event modal only auto-opens after creation when no sessions were staged.
- **Mark Paid as Unpaid:** The Admin Contribution panel can now reverse a payment. The selected-student card shows "Already Paid" with a Mark as Unpaid button when the active campaign is paid; the records table replaces the static "✓ Paid" cell with a Mark Unpaid action. Both call `PUT /apis/payments/:paymentId/mark-unpaid`.
- **Scanner Fullscreen UX:** The "Open Fullscreen" button in the Scanner tab opens the RFID kiosk overlay directly. The watcher on `rfidFullscreenMode` calls `document.exitFullscreen()` when the overlay closes.
- **Loyverse-style POS Panel (Apr 2026):** When an admin searches a student in Admin → Contribution and a student is selected, a Loyverse-style POS panel (`LoyversePOSPanel.vue`) appears below the payment card. The Search button is now wrapped in a `<form @submit.prevent="searchStudent">` so pressing Enter inside the input fires (and visually clicks) the Search button. The POS panel includes: an editable item catalog persisted in `localStorage` (key `ssaam_pos_items_v1`) with name/price/category/emoji/color and full add/edit/delete via a modal; a tappable item grid with category filter; a cart with quantity steppers and per-line discount; a receipt preview; and ESC/POS thermal-printer support over both **WebUSB** (`navigator.usb`, scanning common printer vendor IDs and any bulk OUT endpoint) and **Web Bluetooth** (`navigator.bluetooth`, BLE service `000018f0-...` characteristic `00002af1-...`, chunked at 180 bytes). Layout is fully mobile responsive (stacks catalog + cart on small screens, side-by-side on `lg`+). USB/BT require Chromium-based browsers and an HTTPS or `localhost` origin.

- **Face Recognition Removed (Apr 2026):** All Face ID / face recognition functionality has been removed end-to-end on the client. Deleted: `FaceRecognitionSettings.vue`, `FaceScannerKiosk.vue`, and `StudentFaceID.vue` components; the `face-api.js` dependency from `package.json`; the Login Face ID verification step (login now completes after the admin verification code); the Dashboard Face ID scanner mode tabs, Face Fullscreen overlay, "Switch to Face Recognition" button, the student-facing Face ID profile section/modal, and all related script state (`faceFullscreenMode`, `scannerMode`, `studentFaceCount`, `switchKioskMode`, `isSwitchingKiosk`, `onFaceRecognized`, etc.). Backend `/apis/students/face`, `/apis/masters/face`, and `/apis/attendance/sessions/:id/check-face` endpoints in `SSAAM_VERCEL_BACKEND.js` were left untouched (no client now calls them).

**System Design Choices:**
- **Efficient Pagination:** Frontend displays current page only, with all search and filtering server-side. Statistics fetched separately for complete data.
- **Security:** Robust validation, anti-bot measures, timestamp-based authentication, restricted CORS origins, Regex injection prevention, XSS prevention, and required environment secrets. Implemented security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`).
- **API Integration:** Designed to work with `https://ssaam-api.vercel.app`.

## External Dependencies
- **Backend API:** `https://ssaam-api.vercel.app` (Vercel deployment)
- **Image Hosting:** ImgBB
- **Email Service:** Gmail SMTP via Nodemailer
- **Database:** MongoDB