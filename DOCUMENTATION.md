# SSAAM — Student School Activities Attendance Monitoring

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

SSAAM allows students to register and manage their profiles, attend school events via RFID scanning, and track contribution/payment requirements. Administrators and treasurers can create events, manage student records, export attendance reports, and send announcements.

### Key Features

| Feature | Description |
|---|---|
| Student Registration | Multi-step sign-up with photo upload and email verification |
| RFID Attendance | Real-time event check-in using RFID card scanning |
| Contribution Management | Create payment requirements, mark students paid/unpaid, apply discounts |
| Announcements | Post/edit notifications with image support and reaction (like) system |
| Role-Based Access | Different views and permissions per role (Student, Medpub, Treasurer, Master/Admin) |
| Multi-College Support | CCS, COE, SOM, CNAHS colleges share one backend with isolated data collections |
| Excel Export | Treasurer can export attendance records as `.xlsx` files |
| PDF Receipts | Auto-generate contribution receipts as downloadable PDFs |
| Dynamic Theming | UI colors shift based on the selected college (blue for CCS/COE, green/yellow for SOM) |
| Password Reset | Email-based OTP password reset flow |

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
│   │   ├── AdminContributionPanel.vue   # Admin contribution management UI
│   │   ├── AnnouncementPopup.vue        # Notification/announcement modal
│   │   ├── ContributionReceipt.vue      # PDF-ready receipt component
│   │   ├── ContributionsModal.vue       # Contribution list modal
│   │   ├── GlobalLoadingEffect.vue      # App-wide loading spinner
│   │   ├── LoadingScreen.vue            # Full-screen loading screen
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
│   │   └── tokenHandler.js        # JWT token refresh and 401 auto-logout
│   ├── views/
│   │   ├── Login.vue              # Landing page + login + college selector
│   │   ├── Register.vue           # Multi-step student registration
│   │   ├── Dashboard.vue          # Main hub for all roles
│   │   ├── Attendance.vue         # RFID attendance check-in interface
│   │   └── EventDetails.vue       # Single event detail view
│   ├── App.vue                    # Root component
│   └── main.js                    # App entry point + dynamic theme switcher
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
| `medpub` | Media/publication officer | College-level role; can manage their own profile |
| `treasurer` | College treasurer | Manage payments, export reports for their college |

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
| Access other admin areas | ✅ Yes | ❌ No |

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

### Dynamic Theme Switching (`src/main.js`)

When a user selects SOM, the theme automatically replaces Tailwind blue gradient classes with SOM's green/yellow palette:

- `from-blue-*` → `from-som-green`
- `to-blue-*` / `to-cyan-*` → `to-som-yellow`

A `MutationObserver` continuously monitors the DOM for newly added elements and re-applies the theme in real time.

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
| `auth` | Verifies JWT; accepts students, medpub, treasurer, and masters |
| `studentAuth` | Validates the request is from a legitimate student token |
| `studentAuthWithToken` | Like `studentAuth` but also extracts the raw token for logout |
| `adminOrTreasurerAuth` | Restricts to admin or treasurer roles only |
| `treasurerAuth` | Treasurer-only endpoints |
| `studentMedpubTreasurerAuth` | Students, medpub, and treasurers |
| `requireMaster` | Restricts to master/admin accounts |
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
| GET | `/apis/students/list/all` | Admin/Treasurer | List all students |
| GET | `/apis/students/pending` | Student | Get pending students |
| POST | `/apis/students/search` | Admin/Treasurer | Search students |
| GET | `/apis/students/search` | Student/Medpub/Treasurer | Public student search |
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
| POST | `/apis/attendance/events/custom/create` | Admin/Treasurer | Create custom event |
| PUT | `/apis/attendance/events/custom/:id` | Admin/Treasurer | Update custom event |
| GET | `/apis/events/:id/stats` | Auth | Event statistics |
| GET | `/apis/attendance/events/:id/export-excel` | Treasurer | Export attendance as Excel |
| POST | `/apis/attendance/events/:id/sessions` | Auth | Create attendance session |
| GET | `/apis/attendance/events/:id/sessions` | Auth | Get event sessions |
| PUT | `/apis/attendance/sessions/:id` | Auth | Update session (RFID check-in) |

### Payments & Contributions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/apis/admin/contributions` | Admin | Create contribution requirement |
| GET | `/apis/contributions/transparency` | None | Public contribution transparency |
| POST | `/apis/payments` | Admin/Treasurer | Create payment record |
| GET | `/apis/payments` | Auth | List payments |
| GET | `/apis/payments/:id` | Auth | Get payment by ID |
| PUT | `/apis/payments/:id/mark-paid` | Admin/Treasurer | Mark student as paid |
| PUT | `/apis/payments/:id/mark-unpaid` | Admin/Treasurer | Mark student as unpaid |
| PUT | `/apis/payments/:id/apply-discount` | Admin/Treasurer | Apply discount |
| PUT | `/apis/payments/:id/status` | Admin/Treasurer | Update payment status |
| PUT | `/apis/payments/:id` | Admin/Treasurer | Update payment record |
| DELETE | `/apis/payments/:id/student/:studentId` | Admin/Treasurer | Remove student from payment |
| DELETE | `/apis/payments/:id` | Admin/Treasurer | Delete payment record |
| POST | `/apis/payments/:id/sync-students` | Admin/Treasurer | Sync student list |
| POST | `/apis/payments/:id/deduplicate` | Admin/Treasurer | Remove duplicate entries |
| GET | `/apis/my-payments` | Auth | Get own payment records |

### Notifications & Announcements

Notifications follow a **two-tier architecture**:

| Tier | Collection | Who Posts | Who Sees |
|---|---|---|---|
| **Global** | `notifications` | Super Admin only | All colleges (every student) |
| **College-specific** | `ccs_notifications`, `coe_notifications`, `som_notifications`, `cnahs_notifications` | College-level users (Medpub) | Only that college's students |

- The **Global** tier is for platform-wide announcements made by the super Admin. Every student across all colleges receives these.
- Each college still has its **own notification collection** for college-specific announcements posted by Medpub officers. Students only see their own college's posts.
- When a student loads their notifications, the frontend fetches **both** the global notifications and their college-specific notifications and merges them together.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/apis/notifications` | All authenticated | List global notifications (all colleges see these) |
| POST | `/apis/notifications` | Admin only | Create global notification |
| PUT | `/apis/notifications/:id` | Admin only | Update global notification |
| DELETE | `/apis/notifications/:id` | Admin only | Delete global notification |
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

### Settings & Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/apis/settings` | Student | Get system settings |
| PUT | `/apis/settings` | Admin | Update system settings |
| POST | `/apis/admin/verify` | Admin | Verify admin credentials |
| POST | `/apis/upload-image` | Medpub/Admin | Upload image to Cloudinary |
| POST | `/apis/admin/cleanup-unused-fields` | Admin | Database field cleanup |
| POST | `/apis/admin/migrate-database` | Admin | Run database migrations |

---

## 9. Database Design

All data lives in a single MongoDB database (`dbconnect` on Cluster0). Collections are prefixed per college.

### Collection Naming Convention

Collections use a college-prefix to isolate each college's data. Notifications and admin accounts are shared globally.

```
ccs_students       → CCS student records
coe_students       → COE student records
som_students       → SOM student records
cnahs_students     → CNAHS student records

ccs_events         → CCS attendance events
coe_events         → COE attendance events
som_events         → SOM attendance events
cnahs_events       → CNAHS attendance events

ccs_payments       → CCS contribution payments
coe_payments       → COE contribution payments
som_payments       → SOM contribution payments
cnahs_payments     → CNAHS contribution payments

ccs_sessiontokens  → CCS login session tokens
coe_sessiontokens  → COE login session tokens
som_sessiontokens  → SOM login session tokens
cnahs_sessiontokens→ CNAHS login session tokens

notifications          → GLOBAL announcements (posted by super Admin, visible to all colleges)
notification_seen      → GLOBAL seen tracking (shared across all colleges)

ccs_notifications      → CCS-specific announcements (posted by CCS Medpub)
coe_notifications      → COE-specific announcements (posted by COE Medpub)
som_notifications      → SOM-specific announcements (posted by SOM Medpub)
cnahs_notifications    → CNAHS-specific announcements (posted by CNAHS Medpub)

ccs_notificationseens  → CCS seen tracking for college-specific notifications
coe_notificationseens  → COE seen tracking for college-specific notifications

masters            → Admin + Co-Admin accounts (shared, no prefix)
settings           → Global settings
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
  "created_at": "2024-01-01T00:00:00.000Z"
}
```
- `role` is either `"admin"` (super admin) or `"co-admin"` (department admin)
- `college` is one of `CCS`, `COE`, `SOM`, `CNAHS`
- Co-admin's `college` restricts which college's data they can manage (enforced server-side via JWT)

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
