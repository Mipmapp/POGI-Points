# SSAAM — Student School Activities Attendance Monitoring

---

**SSAAM** is a multi-college web platform for Jose Rizal Memorial State University (JRMSU) that manages student registration, RFID-based attendance tracking, contribution/payment collection, and administrative management across multiple colleges.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Colleges & Departments](#4-colleges--departments)
5. [User Roles](#5-user-roles)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [API Reference](#8-api-reference)
9. [Database Design](#9-database-design)
10. [Authentication & Security](#10-authentication--security)
11. [Running the Project](#11-running-the-project)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)

---

## 1. Project Overview

SSAAM allows students to register and manage their profiles, attend school events via RFID scanning, and track contribution/payment requirements. Administrators and co-admins can create events, manage student records, export attendance reports, and send announcements.

### Key Features

| Feature | Description |
|---|---|
| Student Registration | Multi-step sign-up with photo upload and email verification |
| RFID Attendance | Real-time event check-in using RFID card scanning |
| Contribution Management | Create payment requirements, mark students paid/unpaid, apply discounts |
| Announcements | Post/edit notifications with image support and reaction (like) system |
| Role-Based Access | Different views and permissions per role (Student, Admin, Co-Admin, Super Admin) |
| Multi-College Support | CCS, COE, SOM, CNAHS colleges share one backend with isolated data collections |
| Excel Export | Admin/Co-Admin can export attendance records as `.xlsx` files |
| PDF Receipts | Auto-generate contribution receipts as downloadable PDFs |
| Password Reset | Email-based OTP password reset flow |
| Admin Profile | Admins and co-admins can manage their own profile info and change password |
| Co-Admin Transfer | Co-admins can transfer their role to another account |
| Co-Admin Management | Super admin can assign/remove co-admins per college (CCS, COE, SOM, CNAHS) |
| Student Request System | Students can submit name-change or department-change requests; admins and co-admins review and approve/reject |
| Statistics View | Admin dashboard renamed "Statistics" and shows student registration counts per program and year level |

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Vue.js 3 | ^3.5.26 | UI framework (Composition API + `<script setup>`) |
| Vue Router 4 | ^4.6.4 | Client-side routing |
| Vite | ^5.4.21 | Build tool and dev server |
| Tailwind CSS | ^3.4.19 | Utility-first CSS |
| PostCSS + Autoprefixer | latest | CSS processing |
| fast-average-color | ^9.5.0 | Dynamic image color extraction |
| html2pdf.js | ^0.14.0 | PDF generation for receipts |
| xlsx | ^0.18.5 | Excel report export |
| cropperjs | ^2.1.0 | In-browser image cropping for profile photos |
| @vladmandic/face-api | latest | Browser face detection + 128-float descriptor matching for the admin Face ID 3rd-step login |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime environment |
| Express.js | ^5.2.1 | HTTP server and API routing |
| MongoDB + Mongoose | ^9.1.5 | Database and ODM |
| jsonwebtoken | latest | JWT-based authentication |
| bcrypt | latest | Password hashing |
| nodemailer | ^7.0.12 | Email delivery (verification, password reset) |
| dotenv | ^17.2.3 | Environment variable management |
| cors | ^2.8.6 | Cross-Origin Resource Sharing |

---

## 3. Project Structure

```
ssaam/
├── public/                        # Static public assets
│   ├── icons/                     # College logos (ccs.svg, coe.svg, som.svg, cnahs.svg)
│   └── team/                      # Team member photos
│
├── src/                           # Frontend source code
│   ├── assets/
│   │   └── styles.css             # Global Tailwind CSS imports
│   ├── components/
│   │   ├── AdminContributionPanel.vue   # Admin contribution management UI (hosts LoyversePOSPanel)
│   │   ├── AnnouncementPopup.vue        # Notification/announcement modal
│   │   ├── ContributionReceipt.vue      # PDF-ready receipt component
│   │   ├── ContributionsModal.vue       # Contribution list modal
│   │   ├── FaceRecognitionSettings.vue  # Admin Face ID enrollment panel (Settings page)
│   │   ├── GlobalLoadingEffect.vue      # App-wide loading spinner
│   │   ├── LoadingScreen.vue            # Full-screen loading screen
│   │   ├── LoyversePOSPanel.vue         # Auto-receipt POS panel + ESC/POS Bluetooth printer
│   │   ├── Manage.vue                   # Admin management panel (students, events)
│   │   ├── ProgrammerLoadingEffect.vue  # Coding-themed animated loader
│   │   ├── RFIDLoadingEffect.vue        # RFID scan animation loader
│   │   ├── SessionExpiredModal.vue      # Displays when JWT session expires
│   │   └── StudentContributionsView.vue # Student's own contribution status
│   ├── config/
│   │   ├── api.js                 # API base URL, college detection, default headers
│   │   └── departments.js         # College and program definitions
│   ├── router/
│   │   └── index.js               # Vue Router configuration
│   ├── utils/
│   │   ├── faceapi.js             # Lazy CDN loader + matcher for @vladmandic/face-api
│   │   └── tokenHandler.js        # JWT token refresh and 401 auto-logout
│   ├── views/
│   │   ├── Login.vue              # Landing page + login + college selector
│   │   ├── Register.vue           # Multi-step student registration
│   │   ├── Dashboard.vue          # Main hub for all roles
│   │   ├── Attendance.vue         # RFID attendance check-in interface
│   │   └── EventDetails.vue       # Single event detail view
│   ├── App.vue                    # Root component
│   └── main.js                    # App entry point
│
├── SSAAM_VERCEL_BACKEND.js        # Full backend API source (Express + MongoDB)
├── server.js                      # Local dev server entry point
├── vite.config.js                 # Vite config with API proxy settings
├── tailwind.config.js             # Tailwind customization
├── vercel.json                    # Vercel deployment routing rules
├── package.json                   # Dependencies and npm scripts
├── .env                           # Development environment variables
└── .env.production                # Production environment variables
```

---

## 4. Colleges & Departments

The system serves four colleges, each with its own isolated data in the shared MongoDB database:

| College | Label | Programs |
|---|---|---|
| College of Computing Studies | `CCS` | BSIT, BSCS, BSIS |
| College of Engineering | `COE` | BSCE, BSEE, BSECE, BSCPE |
| School of Midwifery | `SOM` | BSM |
| College of Nursing and Allied Health Sciences | `CNAHS` | BSN |

Data isolation is achieved by prefixing MongoDB collection names: `ccs_students`, `coe_events`, `som_payments`, etc. The `masters` collection is shared and unprefixed.

---

## 5. User Roles

### Student Roles (stored in college-prefixed `students` collections)

| Role | Description | Access Level |
|---|---|---|
| `student` | Registered student | View own profile, attendance, and contributions |

> **Note:** The `medpub` and `treasurer` roles have been removed from the system. All student accounts use the `student` role only.

### Admin Roles (stored in shared `masters` collection)

| Role | Description | Access Level |
|---|---|---|
| `admin` | Super Admin | Full access across all colleges, all data, all co-admins |
| `co-admin` | College Department Admin | Restricted to their assigned college only |

**Admin vs Co-Admin comparison:**

| Capability | Admin | Co-Admin |
|---|---|---|
| Post public notifications | ✅ Yes | ❌ No |
| Manage students | ✅ All colleges | ✅ Own college only |
| Manage events | ✅ All colleges | ✅ Own college only |
| Manage payments | ✅ All colleges | ✅ Own college only |
| View co-admin list | ✅ Yes | ❌ No |
| Create co-admin accounts | ✅ Yes | ❌ No |
| Assign co-admin per college | ✅ Yes | ❌ No |
| Access system settings | ✅ Yes | ❌ No |
| Manage own profile | ✅ Yes | ✅ Yes |
| Transfer role to another user | ❌ No | ✅ Yes (own role only) |

The college of the logged-in user is determined by:
1. `X-SSAAM-College` request header (set by frontend)
2. JWT token payload (`college` field — enforced server-side for co-admin)
3. Student's program (mapped to college via `departments.js`)
4. Default fallback: `CCS`

---

## 6. Frontend Architecture

### Routing

| Route | Component | Description |
|---|---|---|
| `/` | `Login.vue` | Landing page with college selector and login form |
| `/register` | `Register.vue` | Multi-step student registration flow |
| `/dashboard` | `Dashboard.vue` | Main dashboard (varies by role) |
| `/attendance/events/:id` | `EventDetails.vue` | Individual event attendance view |

### College Detection (`src/config/api.js`)

The frontend determines the active college through a priority chain:
1. `loginChosenDepartment` from `localStorage` (set at login screen)
2. `loginChosenProgram` mapped to a college
3. `currentUser.selectedDepartment` from the logged-in user object
4. User's `program` field mapped through `departments.js`
5. Default: `CCS`

The college code is sent on every API request via the `X-SSAAM-College` header.

> **Note:** College detection is used only for backend routing (selecting the correct database collection). The UI does not apply any college-specific color theming — all users see the same SSAAM blue/navy theme regardless of college.

### Token Handling (`src/utils/tokenHandler.js`)

- Intercepts HTTP 401 and 400 responses globally
- Automatically logs the user out and redirects to `/` on invalid or expired tokens
- Handles token refresh when a valid refresh token exists

---

## 7. Backend Architecture

The entire backend lives in `SSAAM_VERCEL_BACKEND.js` — a single Express application designed to be deployed on Vercel Serverless Functions.

### Middleware Stack (applied in order)

1. **CORS** — Allows Vercel, Replit, and localhost origins
2. **JSON Body Parser** — Parses incoming JSON requests
3. **DB Connection Check** — Warns on lost MongoDB connections (does not block)
4. **Security Headers** — Sets `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`, `Cache-Control`
5. **Database Connection** (`ensureDatabaseConnection`) — Ensures Mongoose is connected before any `/apis` route runs
6. **College Context** — Reads `X-SSAAM-College` header and attaches `req.college` to every request

### Authentication Middleware

| Middleware | Description |
|---|---|
| `auth` | Verifies JWT; accepts students and masters |
| `studentAuth` | Validates the request is from a legitimate student token |
| `studentAuthWithToken` | Like `studentAuth` but also extracts the raw token for logout |
| `studentSearchAuth` | Students and admin/co-admin; used for search and listing endpoints |
| `requireMaster` | Restricts to master/admin accounts (both `admin` and `co-admin`) |
| `requireSuperAdmin` | Restricts to super admin (`role === 'admin'`) only; blocks co-admins |
| `timestampAuth` | Validates `X-SSAAM-TS` header to prevent replay attacks |
| `antiBotProtection` | Rate limiting for sensitive operations |

### Multi-College Data Isolation

All collection access goes through helper functions that prepend the college prefix:

```javascript
withPrefix('COE', 'students')  // → 'coe_students'
withPrefix('CCS', 'events')    // → 'ccs_events'
withPrefix('SOM', 'payments')  // → 'som_payments'
```

The `masters` collection is unprefixed and shared across all colleges.

### Email System

A rotating pool of Gmail accounts is used for sending emails (verification codes, password reset OTPs). If one account fails, the system automatically tries the next. Emails are sent using **Nodemailer** with Gmail SMTP.

### Rate Limiting

An in-memory rate limiter (`likeRateLimiter`) prevents notification like spam:
- Max 15 like attempts per minute per user (sliding window)
- 2-second cooldown per notification per user

---

## 8. API Reference

All endpoints are prefixed with `/apis`.

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/apis/health` | None | Server health check |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/apis/students/login` | None | Student login, returns JWT |
| POST | `/apis/students/logout` | Student | Invalidates token |
| POST | `/apis/masters` | Admin | Master/admin login |
| POST | `/apis/masters/logout` | Admin | Master logout |
| POST | `/apis/validate-token` | None | Validate a JWT token |

### Students

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/apis/students` | Student | Get own profile |
| GET | `/apis/students/stats` | Student | Student statistics |
| GET | `/apis/students/list/all` | Admin | List all students |
| GET | `/apis/students/pending` | Student | Get pending students |
| POST | `/apis/students/search` | Admin | Search students (admin access) |
| GET | `/apis/students/search` | Student/Admin | Public student search |
| PUT | `/apis/students/:id/approve` | Admin | Approve student registration |
| PUT | `/apis/students/:id/reject` | Admin | Reject student registration |
| PUT | `/apis/students/:id/rfid` | Admin | Assign RFID to student |
| PUT | `/apis/students/:id/role` | Admin | Update student role |
| PUT | `/apis/students/:id/photo` | Student | Upload profile photo |
| GET | `/apis/students/:id/photo` | None | Get student profile photo |
| PUT | `/apis/students/:id` | Admin | Update student data |
| DELETE | `/apis/students/:id` | Admin | Delete student |
| POST | `/apis/students/send-verification` | Student | Send email verification code |
| POST | `/apis/students/verify-and-register` | Student | Confirm email and register |
| POST | `/apis/students/change-password` | None | Change password with token |

### Password Reset

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/apis/password-reset/request` | Student | Request OTP reset email |
| POST | `/apis/password-reset/verify` | Student | Verify OTP code |
| POST | `/apis/password-reset/complete` | Student | Set new password |

### Attendance & Events

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/apis/attendance/events` | Auth | List all events |
| GET | `/apis/attendance/events/active` | Student | Currently active events |
| GET | `/apis/attendance/events/upcoming` | Student | Upcoming events |
| GET | `/apis/attendance/events/:id` | Auth | Get single event |
| POST | `/apis/attendance/events` | Auth | Create event |
| PUT | `/apis/attendance/events/:id` | Auth | Update event |
| DELETE | `/apis/attendance/events/:id` | Auth | Delete event |
| POST | `/apis/attendance/events/custom/create` | Admin | Create custom event |
| PUT | `/apis/attendance/events/custom/:id` | Admin | Update custom event |
| GET | `/apis/events/:id/stats` | Auth | Event statistics |
| GET | `/apis/attendance/events/:id/export-excel` | Admin | Export attendance as Excel |
| POST | `/apis/attendance/events/:id/sessions` | Auth | Create attendance session |
| GET | `/apis/attendance/events/:id/sessions` | Auth | Get event sessions |
| PUT | `/apis/attendance/sessions/:id` | Auth | Update session (RFID check-in) |

### Payments & Contributions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/apis/admin/contributions` | Admin | Create contribution requirement |
| GET | `/apis/contributions/transparency` | None | Public contribution transparency |
| POST | `/apis/payments` | Admin | Create payment record |
| GET | `/apis/payments` | Auth | List payments |
| GET | `/apis/payments/:id` | Auth | Get payment by ID |
| PUT | `/apis/payments/:id/mark-paid` | Admin | Mark student as paid |
| PUT | `/apis/payments/:id/mark-unpaid` | Admin | Mark student as unpaid |
| PUT | `/apis/payments/:id/apply-discount` | Admin | Apply discount |
| PUT | `/apis/payments/:id/status` | Admin | Update payment status |
| PUT | `/apis/payments/:id` | Admin | Update payment record |
| DELETE | `/apis/payments/:id/student/:studentId` | Admin | Remove student from payment |
| DELETE | `/apis/payments/:id` | Admin | Delete payment record |
| POST | `/apis/payments/:id/sync-students` | Admin | Sync student list |
| POST | `/apis/payments/:id/deduplicate` | Admin | Remove duplicate entries |
| GET | `/apis/my-payments` | Auth | Get own payment records |

### Notifications & Announcements

Notifications follow a **single-tier architecture**:

| Tier | Collection | Who Posts | Who Sees |
|---|---|---|---|
| **Global** | `notifications` | Super Admin and Co-Admin | All students (or college-specific based on header) |

All announcements are posted through the shared `notifications` collection. The `posted_by` field on each notification records whether it was created by `admin` or `co-admin`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/apis/notifications` | All authenticated | List notifications |
| POST | `/apis/notifications` | Admin/Co-Admin | Create notification |
| PUT | `/apis/notifications/:id` | Admin/Co-Admin | Update notification |
| DELETE | `/apis/notifications/:id` | Admin/Co-Admin | Delete notification |
| POST | `/apis/notifications/mark-seen` | None | Mark notifications as seen |
| GET | `/apis/notifications/seen` | None | Get seen notification IDs |
| POST | `/apis/notifications/:id/like` | None | Toggle like on notification |

### Co-Admin Management (Super Admin only)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/apis/co-admin` | Admin | Create a co-admin account for a college |
| GET | `/apis/co-admin` | Admin | List all co-admin accounts |
| GET | `/apis/co-admin/:id` | Admin | Get a specific co-admin |
| PUT | `/apis/co-admin/:id` | Admin | Update co-admin (username, email, password, college) |
| DELETE | `/apis/co-admin/:id` | Admin | Delete a co-admin account |
| POST | `/apis/co-admin/:id/transfer` | Admin | Transfer a co-admin's role to another account |

**Create co-admin request body:**
```json
{
  "username": "ccs_admin",
  "email": "ccs@jrmsu.edu.ph",
  "password": "securepassword",
  "college": "CCS"
}
```
College must be one of: `CCS`, `COE`, `SOM`, `CNAHS`.

### Admin / Co-Admin Profile

Both `admin` and `co-admin` accounts can manage their own profiles via these endpoints.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/apis/admin/me` | Admin/Co-Admin | Get own profile (excludes password) |
| PUT | `/apis/admin/me` | Admin/Co-Admin | Update own profile (name, phone, bio, photo, password) |
| POST | `/apis/co-admin/me/transfer` | Co-Admin only | Self-transfer co-admin role to another account |

**Update profile request body (`PUT /apis/admin/me`):**
```json
{
  "full_name": "Juan Dela Cruz",
  "phone": "09171234567",
  "bio": "College administrator for CCS.",
  "photo": "https://cdn.example.com/photo.jpg",
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```
- Password fields are optional. If `new_password` is provided, `current_password` must also be provided.
- New password must be at least 8 characters.

**Transfer role request body (`POST /apis/co-admin/me/transfer`):**
```json
{
  "target_username": "new_ccs_admin"
}
```
- The calling co-admin's account is deleted and the target account receives the `co-admin` role and college assignment.
- The target account must already exist in the `masters` collection.

### Settings & Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/apis/settings` | Student | Get system settings |
| PUT | `/apis/settings` | Admin | Update system settings |
| POST | `/apis/admin/verify` | Admin | Verify admin credentials |
| POST | `/apis/upload-image` | Admin | Upload image to Cloudinary |
| POST | `/apis/admin/cleanup-unused-fields` | Admin | Database field cleanup |
| POST | `/apis/admin/migrate-database` | Admin | Run database migrations |

---

## 9. Database Design

All data lives in a single MongoDB database (`dbconnect` on Cluster0). Collections are prefixed per college.

### Collection Naming Convention

Every feature area has its own collection per college, prefixed with the college code. The only shared (unprefixed) collections are `notifications` (global admin announcements), `masters`, and `settings`.

```
── STUDENTS ──────────────────────────────────────────────────────────────────
ccs_students            → CCS student records
coe_students            → COE student records
som_students            → SOM student records
cnahs_students          → CNAHS student records

── SESSION TOKENS ────────────────────────────────────────────────────────────
ccs_sessiontokens       → CCS login session tokens
coe_sessiontokens       → COE login session tokens
som_sessiontokens       → SOM login session tokens
cnahs_sessiontokens     → CNAHS login session tokens

── SETTINGS ──────────────────────────────────────────────────────────────────
ccs_settings            → CCS system settings
coe_settings            → COE system settings
som_settings            → SOM system settings
cnahs_settings          → CNAHS system settings

── NOTIFICATIONS ─────────────────────────────────────────────────────────────
notifications           → Global announcements posted by admin/co-admin
notification_seen       → Global seen-tracking for notifications

── ATTENDANCE ────────────────────────────────────────────────────────────────
ccs_attendanceevents    → CCS attendance events
coe_attendanceevents    → COE attendance events
som_attendanceevents    → SOM attendance events
cnahs_attendanceevents  → CNAHS attendance events

ccs_attendancesessions  → CCS attendance sessions (Morning, Afternoon, etc.)
coe_attendancesessions  → COE attendance sessions
som_attendancesessions  → SOM attendance sessions
cnahs_attendancesessions→ CNAHS attendance sessions

ccs_attendancelogs      → CCS per-student check-in/out logs
coe_attendancelogs      → COE per-student check-in/out logs
som_attendancelogs      → SOM per-student check-in/out logs
cnahs_attendancelogs    → CNAHS per-student check-in/out logs

── CONTRIBUTIONS & PAYMENTS ──────────────────────────────────────────────────
ccs_eventcontributions  → CCS event contribution tracking
coe_eventcontributions  → COE event contribution tracking
som_eventcontributions  → SOM event contribution tracking
cnahs_eventcontributions→ CNAHS event contribution tracking

ccs_payments            → CCS payment campaigns
coe_payments            → COE payment campaigns
som_payments            → SOM payment campaigns
cnahs_payments          → CNAHS payment campaigns

ccs_paymentrecords      → CCS per-student payment records
coe_paymentrecords      → COE per-student payment records
som_paymentrecords      → SOM per-student payment records
cnahs_paymentrecords    → CNAHS per-student payment records

── APPLICATION FORMS ─────────────────────────────────────────────────────────
ccs_applicationforms        → CCS application form configurations
coe_applicationforms        → COE application form configurations
som_applicationforms        → SOM application form configurations
cnahs_applicationforms      → CNAHS application form configurations

ccs_studentapplications     → CCS student applications
coe_studentapplications     → COE student applications
som_studentapplications     → SOM student applications
cnahs_studentapplications   → CNAHS student applications

── GLOBAL (shared, no college prefix) ────────────────────────────────────────
notifications       → Global announcements posted by admin/co-admin
notification_seen   → Global seen-tracking for admin announcements
masters             → Admin + Co-Admin accounts
settings            → Global system settings
```

> **SOM and CNAHS models** are created automatically the first time a request for those colleges is made (dynamic model creation using the `getCollegeModel` helper). No manual setup needed.

### Key Data Shapes

**Student**
```json
{
  "studentId": "2021-00001",
  "firstName": "JUAN",
  "lastName": "DELA CRUZ",
  "program": "BSIT",
  "yearLevel": "2nd Year",
  "semester": "1st Sem",
  "email": "juan@email.com",
  "rfidCode": "AB12CD34",
  "rfidStatus": "verified",
  "role": "student",
  "status": "approved",
  "photo": "<base64 or cloudinary url>"
}
```

**Master (Admin / Co-Admin)**
```json
{
  "username": "ccs_admin",
  "email": "ccs@jrmsu.edu.ph",
  "role": "co-admin",
  "college": "CCS",
  "full_name": "Juan Dela Cruz",
  "phone": "09171234567",
  "bio": "CCS College Administrator",
  "photo": "https://cdn.example.com/photo.jpg",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-06-01T00:00:00.000Z"
}
```
- `role` is either `"admin"` (super admin) or `"co-admin"` (department admin)
- `college` is one of `CCS`, `COE`, `SOM`, `CNAHS` (required for co-admins; ignored for admin)
- Co-admin's `college` restricts which college's data they can manage (enforced server-side via JWT)
- `full_name`, `phone`, `bio`, `photo` are optional profile fields editable via `PUT /apis/admin/me`

**Event**
```json
{
  "title": "Acquaintance Party 2024",
  "date": "2024-09-15",
  "sessions": ["Morning", "Afternoon"],
  "isActive": true,
  "type": "mandatory"
}
```

**Payment**
```json
{
  "title": "SSAAM Fee 2024",
  "amount": 150,
  "students": [
    { "studentId": "2021-00001", "paid": true, "paidAt": "2024-09-01" }
  ]
}
```

---

## 10. Authentication & Security

### JWT Flow
1. Student submits credentials to `POST /apis/students/login`
2. Server verifies password with `bcrypt.compare()`
3. Server signs a JWT with `SSAAM_API_KEY` as the secret; token contains `studentId`, `college`, and `role`
4. Frontend stores token in `localStorage` and sends it as `Authorization: Bearer <token>` on every request
5. On 401 responses, `tokenHandler.js` auto-logs-out the user

### Replay Attack Prevention
Sensitive endpoints require the `X-SSAAM-TS` timestamp header. The server validates that the timestamp is recent (within a tolerance window) to prevent replay attacks.

### Security Headers (applied to all responses)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Cache-Control: no-store, no-cache, must-revalidate, private`

### CORS Policy
Allowed origins:
- `https://ssaam.vercel.app` (production frontend)
- `https://ssaam-api.vercel.app` (same-origin API calls)
- Any `*.replit.dev` or `*.repl.co` origin (Replit development)
- `localhost` and `127.0.0.1` (local development)

---

## 11. Running the Project

### Prerequisites
- Node.js 20+
- npm

### Install Dependencies
```bash
npm install
```

### Run Frontend Only (recommended for development)
```bash
npm run dev
```
The Vite dev server starts on `http://localhost:5000`. API requests to `/apis/*` are automatically proxied to the live backend at `https://ssaam-api.vercel.app`.

### Run Backend Locally
```bash
npm run server
```
The Express server starts on `http://localhost:5000` by default. Set `PORT=3001` to run on a different port.

> **Note:** Running the backend locally requires the environment variables listed in the next section.

### Build for Production
```bash
npm run build
```
Outputs to `dist/`. The `vercel.json` handles routing for Vercel deployment.

---

## 12. Environment Variables

### Frontend (`.env`)
| Variable | Example | Description |
|---|---|---|
| `VITE_API_URL` | `https://ssaam-api.vercel.app` | Backend API base URL |
| `NODE_ENV` | `development` | Node environment |

### Backend (required for local backend)
| Variable | Description |
|---|---|
| `SSAAM_API_KEY` | JWT signing secret |
| `SSAAM_CRYPTO_KEY` | Encryption key for sensitive data |
| `ADMIN_VERIFICATION_SECRET` | Secret for admin verification |
| `PRIMARY_ADMIN_USERNAME` | Default admin username (defaults to `ssaam`) |
| `FRONTEND_URL` | Additional allowed CORS origin |
| `PORT` | Server port (defaults to `5000`) |

Set these in Replit's Secrets panel or in a local `.env` file that is never committed to version control.

---

## 13. Deployment

The project is deployed on **Vercel**:

| Service | URL |
|---|---|
| Frontend | `https://ssaam.vercel.app` |
| Backend API | `https://ssaam-api.vercel.app` |

### `vercel.json` Routing
- All `/apis/*` requests route to the backend serverless function (`SSAAM_VERCEL_BACKEND.js`)
- All other requests serve the built Vue SPA (`dist/index.html`)

### Replit Deployment
When running on Replit, the frontend is served on port `5000` via the `Start application` workflow (`npm run dev`). API calls proxy to the live Vercel backend unless a local backend server is also running.

---

## 14. Changelog

### Session — April 27, 2026

#### Frontend Feature Additions

| Area | Change |
|---|---|
| Create Event — Sessions Inline | The Create Event modal now includes a "Sessions" section so admins can stage one or more sessions (Add / Edit / Delete) before submitting the event. After the parent event is created, all staged sessions are batch-posted to `POST /apis/attendance/events/:eventId/sessions`. The Edit Event modal only auto-opens after creation when no sessions were staged. |
| Admin Contribution — Mark Paid as Unpaid | The Admin Contribution panel can now reverse a payment. The selected-student card shows "Already Paid" with a Mark as Unpaid button when the active campaign is paid; the records table also exposes a Mark Unpaid action in place of the static "✓ Paid" cell. Both call `PUT /apis/payments/:paymentId/mark-unpaid`. |
| Scanner Fullscreen — Always Available | The "Open Fullscreen" button in the Scanner tab is no longer gated behind a specific scanner mode. It opens the RFID kiosk overlay directly. The watcher on `rfidFullscreenMode` calls `document.exitFullscreen()` when the overlay closes. |

#### Face Recognition / Face ID — Removed

All Face ID / face recognition functionality was removed end-to-end on the client. The backend Face ID endpoints (`/apis/students/face`, `/apis/masters/face`, `/apis/attendance/sessions/:id/check-face`) in `SSAAM_VERCEL_BACKEND.js` were left untouched; nothing on the client now calls them.

| Area | Change |
|---|---|
| Components Deleted | `src/components/FaceRecognitionSettings.vue`, `src/components/FaceScannerKiosk.vue`, `src/components/StudentFaceID.vue`. |
| Dependencies | Removed `face-api.js` from `package.json`. |
| `Login.vue` — Template | Removed the entire Face ID modal (the Step 3 of 3 biometric verification overlay). |
| `Login.vue` — Script | Removed all face state, helpers, and constants (`showFaceModal`, `faceStep`, `faceStatusText`, `faceMatchLabel`, `faceConfidence`, `faceSavedFaces`, `faceStream`, `faceDetectLoopId`, `faceApiInst`, `faceModelsReady`, `faceLoadError`, `faceapiLoginPromise`, `FACE_THRESHOLD`, `FACE_MATCH_STREAK_NEEDED`, `faceMatchStreak`, `FACE_MODEL_URL`, `loadFaceApiLogin`, `startFaceVerification`, `euclideanFace`, `stopFaceCamera`, `runFaceLoginLoop`, `cancelFaceVerification`). Added a small `completeLogin()` that persists the pending user and triggers navigation. `verifyAdminCode()` now calls `completeLogin()` instead of `startFaceVerification()`. |
| `Login.vue` — CSS | Removed the `.face-mirror` rule, the `.ssaam-face-scanline` rule, and the `@keyframes face-scan` animation. |
| `Dashboard.vue` — Template | Removed the "Switch to Face Recognition" button inside the RFID fullscreen overlay; the entire Face ID Scanner Fullscreen Overlay (right-panel feed, particle canvas reuse, etc.); the RFID-vs-Face scanner mode tabs; the inline `<FaceScannerKiosk>` mount; the `v-if="scannerMode === 'rfid'"` gate on the RFID Scanner Card; the student-facing Face ID profile section; and the Student Face ID modal. |
| `Dashboard.vue` — Script | Removed three imports (`FaceRecognitionSettings`, `StudentFaceID`, `FaceScannerKiosk`); removed face state (`faceFullscreenMode`, `faceRecentLogs`, `faceRecognizedCount`, `onFaceRecognized`, `scannerMode`, `showFaceIDModal`, `studentFaceCount`); removed the `faceFullscreenMode` watcher; simplified `enterFullscreenMode` to take no arguments and always open RFID; removed the `switchKioskMode` function and `isSwitchingKiosk` ref; removed the face branch from `handleEscKey`; removed face-related guards from the `rfidFullscreenMode` watcher. |
| `replit.md` | Removed the Face ID feature description and rewrote the Scanner Fullscreen UX entry to reflect the RFID-only behaviour. Added a "Face Recognition Removed" note for traceability. |

**Preserved on purpose:** `facebook` URLs in developer-team arrays (Login.vue, Register.vue, Dashboard.vue, AnnouncementPopup.vue), the `backface-hidden` CSS in `RFIDLoadingEffect.vue`, and the social-pattern regex (`fb|facebook|...`) — these are unrelated to face recognition.

### Session — April 13, 2026

#### Dashboard.vue

| Area | Change |
|---|---|
| Master Admin Dashboard | Added `fetchAllCollegesStats()` to fetch stats for all four colleges. Added an all-colleges overview section with one card per college and a grand-total row. |
| Submit a Request | Redesigned the section with a banner header, interactive type toggle buttons, a grid-based college selector with SVG icons, a suffix dropdown, a live full-name preview, and a character counter. |
| Submit a Request — Suffix | Added `suffix` field to `newRequest` ref. Suffix is now included when assembling `new_value` from name parts (`first_name + middle_name + last_name + suffix`). Suffix is sent to the `/apis/requests` endpoint and the form is reset properly on success. |
| Assign Co-Admins | Renamed from "Promote" to "Assign Co-Admins". Input changed from username to Student ID. Backend call sends `student_id`. |
| My Profile — Blank State | `fetchAdminProfile` now falls back to `currentUser` data when the `/apis/admin/me` endpoint fails or returns a non-OK status. Profile section never shows blank after this change. |
| My Profile — Empty Fields | Info cards for Email and Phone use `v-if` / `v-else` to show italic placeholder text ("No email set", "No phone set") instead of leaving the field blank. An "About" card is shown only when bio is present. |
| CCS College Name | Fixed one remaining label that said "College of Computer Studies" to "College of Computing Studies" in the Assign Co-Admins section. |
| Statistics Sidebar Icon | Changed the Statistics sidebar icon from home.svg to a bar-chart SVG for admin/master roles. |
| College Full Names | Corrected all college full names across the UI: SOM = School of Midwifery, CNAHS = College of Nursing and Allied Health Sciences, CCS = College of Computing Studies, COE = College of Engineering. |
| Available Programs | `availablePrograms` computed property now derives program keys dynamically from actual `statsData` object keys instead of hardcoded lists. Falls back to per-college hardcoded list when no data is present. |

#### Backend (server.js / SSAAM_VERCEL_BACKEND.js)

| Area | Change |
|---|---|
| `/apis/co-admin/assign` | New POST endpoint. Accepts `student_id` and `college`. Looks up user by `username === student_id`, validates they are not already an admin/co-admin, and promotes them to `co-admin` for the given college. |
| `/apis/stats` | Stats endpoint now counts programs dynamically from actual student records instead of hardcoded BSCS/BSIS/BSIT lists. |

---

### Session — April 29, 2026

#### Face Recognition / Face ID — Reinstated (Phase 1)

The April 27 removal was reversed. Face ID is back as the third-step admin login check and as a Settings-page enrollment panel for admins. The backend Face ID endpoints (`/apis/masters/face`, `/apis/students/face`, `/apis/attendance/sessions/:id/check-face`) — which were left intact during the removal — are now used again from the client.

| Area | Change |
|---|---|
| Dependency | Installed `@vladmandic/face-api` (browser fork of `face-api.js` with current TF.js bindings). Models are loaded from a public CDN at runtime (no models shipped in the repo). |
| New File | `src/utils/faceapi.js` — single shared lazy loader + matcher. Loads `tinyFaceDetector`, `faceLandmark68Net`, and `faceRecognitionNet` once on first use. Exposes `loadFaceApi()`, `detectDescriptor(videoOrCanvas)`, and `euclidean(a, b)`. Uses a `0.55` distance threshold and a `3-frame match streak` to avoid false positives. |
| New File | `src/components/FaceRecognitionSettings.vue` — admin-only enrollment panel mounted in the Dashboard Settings page (above the existing Save button). Shows enrolled count (max 10), live camera feed, capture-and-save flow, list of enrolled descriptors with delete, and a relabel action. Persists 128-float descriptors via `POST /apis/masters/face` (and `DELETE /apis/masters/face/:id`). |
| `Login.vue` — Template | Restored the Step 3 of 3 modal (camera card + status row + cancel button). It only opens after the existing MM/DD/YY admin verification step succeeds. |
| `Login.vue` — Script | Added back `startFaceVerification()`, the `runFaceLoginLoop()` interval (~250 ms cadence), `cancelFaceVerification()`, and `stopFaceCamera()`. `verifyAdminCode()` now branches: if the admin has at least one enrolled face descriptor (fetched via `GET /apis/masters/face`), open the modal; otherwise call the existing `completeLogin()` directly so admins without enrolment never get locked out. |
| `Login.vue` — CSS | Added back `.face-mirror`, `.ssaam-face-scanline`, and the `@keyframes face-scan` rule for the camera overlay. |
| `Dashboard.vue` | Re-imported `FaceRecognitionSettings` and mounted it inside the Settings page card (above the Save button). All other previously removed face surfaces (RFID/Face mode tabs, kiosk overlay, student-facing Face ID) are still removed — only the admin enrollment panel is restored in this phase. |

**Phase 2 (not yet done, parked for follow-up):** restore `FaceScannerKiosk.vue` (admin attendance kiosk camera) and `StudentFaceID.vue` (student self-enrollment). The endpoints already exist on the backend.

#### Loyverse POS Receipt Panel — Rewritten

The contribution POS panel (`src/components/LoyversePOSPanel.vue`) was redesigned end-to-end. The catalog/cart/items grid was removed; the panel now composes a single auto-receipt from the selected student + active payment campaign and prints it to a thermal Bluetooth printer.

| Area | Change |
|---|---|
| Catalog / Cart Removed | Deleted the items grid, the categories filter, the cart sidebar, the per-line qty/discount controls, the item editor modal, and the discount field. The panel no longer holds product state. |
| Auto Line Item | The single receipt line is built from `props.activePayment` — `name = activePayment.title` (uppercased), `price = props.suggestedAmount \|\| activePayment.amount_due`, `qty = 1`. Updates reactively when the parent swaps the active payment. |
| Customer | Pulled from `props.student` — `full_name` if present, otherwise `first_name + middle_name + last_name + suffix` collapsed to a single uppercased line. |
| Cashier (Employee) | Auto-filled from `localStorage.currentUser` on mount and whenever the prop `student` changes (only when blank, so user overrides are preserved). Uses `full_name` / `fullName` / first+middle+last+suffix / `username` in that priority order. |
| Editable Header Settings | Green "Header" button in the panel toolbar opens a Teleport modal with editable inputs for `businessHeader`, `businessAddress`, `businessName`, `businessPhone`, `posName`, `employeeName`, plus a "Reset to Default" action. Persisted to `localStorage` under `ssaam_pos_receipt_v2`. |
| Receipt Preview | Right-hand on-screen receipt preview matches the printed layout: CCS shield logo (`/assets/ccs_logo.png`) → ACADEMIC → address → org name → `Phone No:` → `Employee:` / `POS:` / `Customer:` → dashed separator → ITEM/price → `1 x P…` → dashed separator → `Total` (extrabold) / `Cash` → `THANK YOU FOR YOUR PURCHASE!` → italic retention note. Preview width capped at 240 px to feel like a 57 mm strip. |
| Logo on Print | New `loadLogoBitmap()` helper renders the CCS shield to a monochrome ESC/POS raster. 160 dots wide (multiple of 8, comfortable margin in the ~384-dot printable area of a 57 mm roll). MSB-first packing, threshold 128, transparent pixels treated as white. Sent ahead of the text via the `GS v 0` raster command. |
| ESC/POS Build | `buildEscPos()` produces the full byte stream: init → centered logo → bold ACADEMIC → address → bold org name (word-wrapped) → phone → left-align body → Employee/POS/Customer (word-wrapped) → dashed → item line (right-aligned price, word-wrapped if title is long) → `1 x` quantity → dashed → bold + double-height `Total` → normal `Cash` → centered bold thank-you → wrapped retention note → paper cut (`GS V 0`). |
| Peso Sign Fix | Most ESC/POS thermals default to code page 437/PC850 which lacks U+20B1 (₱) — the printer was rendering a checker-block. Print bytes now use a plain `P` prefix (`P410.00`). The on-screen preview keeps the real ₱ glyph since browsers handle Unicode fine. |
| Bold Total | The `Total` row prints with bold ON (`ESC E 1`) plus double-height (`ESC ! 0x10`), then both modes are reset before the `Cash` row. The amount inherits the bold/size while it's active. |
| Word Wrap (No Letters Stranded) | New `wrapText(text, w)` helper word-wraps any line at a 32-char boundary without splitting words. Applied to Employee, Customer, the org-name header, and the footer note. New `itemRow(name, price, w)` keeps the price right-aligned on the first line and flows the rest of a long item title onto whole-word continuation lines. Result: `JULLAN CARL JAMORA MAGLINTE` now prints as `Customer: JULLAN CARL JAMORA` / `MAGLINTE` instead of `…MAG` / `LINTE`. |
| Copies to Print | New "Copies to Print" card with `−`/number-input/`+` controls. Hard-clamped between 1 and 10 (typing 99 snaps back to 10 on blur). Print button label updates to "Print N Receipts"; status line shows "Printing 2 of 3...". A 350 ms pause is inserted between copies so the printer's buffer drains. |
| 57 × 30 mm Roll Fit | Logo width capped at 160 dots; text body fixed at 32 chars (Font A standard for 57/58 mm); footer note wrapped via `wrapText`; on-screen preview narrowed to 240 px. |
| USB Printer — Removed | Stripped the `Connect USB Printer` button, the USB status pill, the `PRINTER_VENDORS` constant, the `pickUSBDevice` / `connectUSB` methods, the USB branch in `disconnectAll`, the USB branch in `printReceipt`, and the `usbDevice` / `usbEndpoint` / `usbConnected` / `connectingUSB` state fields. The panel is Bluetooth-only now. |
| Bluetooth Printer | Unchanged otherwise. Uses Web Bluetooth with a known-services filter list (POS58, GOOJPRT, ZJ, Xprinter, MTP, etc.) and an `acceptAllDevices` fallback when the chooser comes up empty. Writes are chunked at 180 bytes, preferring `writeValueWithoutResponse`. Auto-handles `gattserverdisconnected`. |
| Emit | Still emits `printed` on success, now with `{ item, amount, customer, copies }`. |
