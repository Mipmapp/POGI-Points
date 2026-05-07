# SSAAM — Demo Guide
## Student School Activities Attendance Monitoring System
**Jose Rizal Memorial State University (JRMSU)**

---

## 1. What is SSAAM?

SSAAM is a web-based system that helps JRMSU manage and track student attendance at school activities. It supports four colleges, two user roles, and multiple check-in methods — including RFID scanning, manual entry, and face recognition.

---

## 2. Colleges Supported

| College | Code | Theme Color |
|---------|------|-------------|
| College of Computer Studies | CCS | Blue |
| College of Engineering | COE | Orange |
| School of Management | SOM | Green / Yellow |
| College of Nursing and Allied Health Sciences | CNAHS | Green |

Each college has its own **isolated database collections** (e.g., `ccs_students`, `coe_students`). All API calls carry an `X-SSAAM-College` header so every request reads and writes to the correct college's data only.

---

## 3. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Vue 3 (Composition API) | ^3.5 | UI framework |
| Vite | ^5.4 | Build tool & dev server (port 5000) |
| Vue Router 4 | ^4.6 | Client-side routing |
| Tailwind CSS | ^3.4 | Utility-first styling |
| Leaflet + OpenStreetMap | — | GPS geofence map (no API key required) |
| `@vladmandic/face-api` | ^1.7.15 | In-browser face recognition |
| CropperJS | ^2.1 | Profile photo cropping |
| html2pdf.js | ^0.14 | Receipt / PDF export |
| xlsx | ^0.18 | Excel export for attendance & contributions |
| fast-average-color | ^9.5 | College-aware theme color detection |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | ^5.2 | REST API server (port 3001) |
| Mongoose | ^9.6 | MongoDB ODM |
| MongoDB Atlas | — | Cloud database (multi-college collections) |
| bcrypt | ^6.0 | Password hashing |
| jsonwebtoken | ^9.0 | JWT authentication |
| Nodemailer | ^7.0 | Email (OTP, password reset) via Gmail SMTP |
| Cloudinary SDK | ^2.10 | Profile photo & notification image hosting |
| `crypto` (Node built-in) | — | Token hashing, SSAAM crypto encoding |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Serverless deployment (`api/index.js`) |
| MongoDB Atlas | Database |
| Cloudinary | Image CDN (`app_uploads` folder) |
| jsDelivr CDN | Face recognition model delivery |

---

## 4. User Roles

### Student
- Self-registers (multi-step form with email OTP verification)
- Logs in with Student ID + last name (default) or custom password
- Checks in to events via RFID, manual ID, or Face ID
- Views their own attendance history, payment status, and raffle ticket
- Enrolls their own face for Face ID check-in
- Submits change requests (profile edits require admin approval)

### Master (Admin)
There are four admin levels — each level can do everything below it, plus more:

| Role | Key Permissions |
|------|----------------|
| **Super Admin** | Full access; transfers ownership |
| **Administrator** | Manage all students, events, payments, co-admins |
| **Co-Admin** | Manage events, sessions, contributions, announcements |
| **Treasurer** | Manage payments, contributions, discounts |

Admins log in with username + password and can also enroll Face ID for kiosk check-in.

---

## 5. Authentication System

### How Login Works
1. Student or admin submits credentials
2. Backend verifies password (bcrypt compare against hashed `custom_password`, falls back to `last_name` if no custom password set)
3. A **JWT token** is issued (signed with `SSAAM_API_KEY`)
4. A **SessionToken** document is saved in the college-specific collection (e.g., `ccs_sessiontokens`) — hashed with SHA-256, includes expiry and `is_revoked` flag
5. Every subsequent request must include the JWT in the `Authorization: Bearer <token>` header

### Security Features
- Tokens are **revocable** — logout sets `is_revoked: true` on the server-side session
- Sessions auto-expire after **12 hours of inactivity** (cleaned up across all college collections)
- Timestamp-based anti-bot tokens (`ssaamCrypto.js`) protect the registration endpoint
- Password reset uses a 6-digit OTP sent by email (10-minute expiry)
- Face check-in uses **liveness challenge tokens** (signed JWT, single-use, 3-minute TTL)

---

## 6. Face Recognition — Deep Dive

This is the most technically advanced feature. All recognition happens **inside the browser** — no face images are ever sent to the server.

### Library
- **`@vladmandic/face-api`** v1.7.13 (loaded lazily from jsDelivr CDN on first use)
- Based on TensorFlow.js — runs entirely in the browser via WebGL or WASM

### Models Used

| Model | Purpose |
|-------|---------|
| `tinyFaceDetector` | Detects faces in a video frame — lightweight, real-time |
| `faceLandmark68TinyNet` | Finds 68 facial landmark points (eyes, nose, mouth, jaw) |
| `faceRecognitionNet` | Converts a face into a **128-float descriptor** vector |

All three models are loaded in parallel on first use:
```
MODEL_BASE = https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model
```

### Detection Parameters
| Parameter | Value | Meaning |
|-----------|-------|---------|
| `inputSize` | 320 | Video frame is resized to 320px before processing |
| `scoreThreshold` | 0.5 | Minimum confidence to consider a face detected |
| Output | 128-float array | One number per "facial feature dimension" |

### How Matching Works

Faces are compared using **Euclidean distance** between two 128-float descriptors:

```
distance = sqrt( sum of (a[i] - b[i])^2 for all 128 values )
```

| Distance | Meaning |
|----------|---------|
| < 0.45 | Almost certainly the same person (backend uniqueness threshold) |
| < 0.55 | Same person — accepted for check-in (frontend threshold) |
| ≥ 0.6 | Different people |

### Student Face Enrollment Flow
1. Student opens the **Face ID Enrollment** panel in the app
2. Camera activates; `tinyFaceDetector` scans each frame in real time
3. When a face is detected with score ≥ 0.5, the 128-float descriptor is computed
4. The descriptor is sent to `POST /apis/students/face`
5. **Uniqueness check**: Backend computes Euclidean distance against every other enrolled student in the same college. If any existing student's descriptor is within **0.45** of the new one, enrollment is rejected (prevents impersonation)
6. One face per student; re-enrollment allowed once every **7 days**

### Student Face Check-In Flow (Anti-Spoof Protected)
```
Step 1 → POST /apis/attendance/sessions/:id/face-challenge
         Server issues a signed JWT (3-minute TTL) containing a random
         liveness challenge: either "turn_left" or "turn_right"

Step 2 → Client shows the challenge on screen ("Please turn your head right")
         face-api.js tracks face landmarks frame by frame to detect the head turn
         Captures a fresh descriptor during the motion

Step 3 → POST /apis/attendance/sessions/:id/check-face-student
         Sends: { challenge_token, descriptor }
         Server verifies:
           - Token is valid, not expired, not already used (single-use registry)
           - Token is bound to this student + this session
           - Descriptor matches THIS student's enrolled face (distance < 0.45)
         Then marks attendance
```

**Why liveness challenges?** A still photo or a photo on a phone screen cannot pass a head-turn check — the landmarks won't show motion. This prevents someone from checking in with a classmate's photo.

### Admin (Master) Face Check-In
- Admins can enroll up to **10 face descriptors** (different angles, lighting)
- Used for kiosk-style check-in at events
- No liveness challenge (admin is present in person at the kiosk)
- Threshold: standard 0.55 Euclidean distance

---

## 7. RFID Check-In

- Each student can have an RFID code stored on their profile
- Admin assigns RFID codes via the student management panel
- At an event, an RFID scanner sends the student's card code to `POST /apis/attendance/sessions/:id/check`
- The backend looks up the student by `rfid_code` and logs attendance
- RFID scanner settings (check-in / check-out enabled, auto-disable times, late threshold) are configurable per-college in the Settings panel

---

## 8. GPS Geofence

Per-event GPS boundary enforced on the backend (not just the frontend).

### How It Works
1. Admin creates an event and enables geofence — sets a **center point** (latitude/longitude) on a Leaflet map and a **radius** (10m to 5000m, default 80m)
2. When a student checks in, the browser requests their GPS coordinates
3. Coordinates are sent with the check-in request
4. Backend calculates distance using the **Haversine formula** (accurate over the Earth's curvature)
5. GPS accuracy slack is added (capped at 50m) to handle indoor signal drift
6. If distance > radius + slack → check-in is rejected with a helpful error message

### Anti-Cheat: VPN/Proxy Detection
If geofence is enabled, the backend checks the student's IP address before processing location:
- If a **VPN or proxy** is detected → check-in is immediately rejected
- Private/LAN IPs (on-campus Wi-Fi) are always allowed
- This prevents a student from spoofing GPS from home via VPN

### Error Codes
| Code | Meaning |
|------|---------|
| `GEOFENCE_LOCATION_REQUIRED` | Student did not share GPS location |
| `GEOFENCE_OUT_OF_RANGE` | Student is too far from the venue |
| `GEOFENCE_VPN_DETECTED` | VPN/proxy detected — location cannot be trusted |

---

## 9. Attendance System

### Events
- Events have a date, name, description, and optional geofence
- Each event can have multiple **Sessions** (e.g., Morning, Afternoon, Seminar Part 1)
- Each session has a start time, end time, and can be marked as `active` or `closed`

### Check-In Methods (per session)
| Method | Who | Endpoint |
|--------|-----|---------|
| Admin scans RFID / enters Student ID | Admin | `POST /check` |
| Admin uses Face ID kiosk | Admin | `POST /check-face` |
| Student self-check via Face ID | Student | `POST /check-face-student` |
| Student self-check via manual ID | Student | `POST /check` |

### Attendance Status
- **Present / Late** — determined by comparing check-in time against the session's late threshold (default: 30 minutes after start)
- **Absent** — no log entry for that session
- Logs can be manually patched by admin (e.g., to correct a late mark)
- Full attendance export to Excel per event

---

## 10. Contributions Tracking

- Each **attendance event** can have a required student contribution (fee)
- Admin marks individual students as Paid / Unpaid
- Students can view their own contribution status per event
- Full Excel export of contribution records
- Transparency mode: a public-facing endpoint shows contribution summaries

---

## 11. Raffle Ticket System

- Admin assigns raffle tickets to students (tied to events or campaigns)
- Each student can view their own assigned raffle ticket
- Admin can manage (add/delete) raffle ticket entries
- Draw results can be announced through the notifications system

---

## 12. Payment Campaigns

- Admin creates **Payment Campaigns** (e.g., "Enrollment Fee", "T-Shirt")
- All approved students in the college are automatically synced to each campaign
- Admin can mark individual students as Paid / Unpaid
- **Discounts** can be applied per student per campaign:
  - Percentage discount (0–100%)
  - Fixed amount discount
  - Reason and applied-by fields tracked for audit
- Students view their payment status from their dashboard
- Excel export available

---

## 13. Notification / Announcement System

- Two tiers of notifications:
  - **Global** — posted by super admin, visible to all colleges
  - **College-specific** — posted by college admins, visible only to their college
- Supports images (uploaded to Cloudinary, auto-deleted on update/delete)
- Students can **like** notifications (rate-limited: max 5 per minute per user)
- Notifications marked as seen per user (stored in `notificationseens` collection)
- Priority levels supported

---

## 14. Email System

Password reset OTPs and registration verification codes are sent via email.

- **Library**: Nodemailer
- **Provider**: Gmail SMTP
- **Strategy**: Rotating pool of 8 Gmail accounts — if one account hits rate limits, the next one is used automatically
- **Emails sent for**:
  - Registration email verification (6-digit OTP, 10-minute expiry)
  - Password reset (6-digit OTP, 10-minute expiry)
  - Change request status updates (approved / rejected)

---

## 15. Image Handling

### Profile Photos
- Uploaded via `POST /apis/upload-image`
- Stored on **Cloudinary** in the `app_uploads` folder
- CDN URL stored in the student/admin document in MongoDB
- Client-side compression applied before upload (keeps file sizes small)
- CropperJS used for in-browser photo cropping before upload

### Notification Images
- Same Cloudinary upload flow
- **Auto-deleted from Cloudinary** (with CDN cache invalidation) when:
  - A notification is deleted
  - A notification's image is replaced

### Orphan Cleanup
A maintenance script (`scripts/cleanup_cloudinary.js`) cross-references all MongoDB documents against Cloudinary assets and removes any images no longer referenced:
```bash
node scripts/cleanup_cloudinary.js          # Preview (safe, no changes)
node scripts/cleanup_cloudinary.js --delete # Actually delete orphans
```

---

## 16. Student Registration Flow

1. Student fills in personal info (name, Student ID, program, year level, email)
2. An OTP is sent to their Gmail address
3. Student enters the OTP to verify their email
4. A timestamp-based encrypted token (`ssaamCrypto.js`) is issued by the backend — this token must be included in the final registration submission to prove the request is not a bot replay
5. Student uploads a profile photo (optional)
6. Account is created with `status: 'pending'` — admin must approve before the student can log in
7. Admin reviews and approves/rejects from the student management panel

---

## 17. PWA (Progressive Web App)

SSAAM is installable on mobile and desktop as a native-like app.

- **Auto-updates** when a new version is deployed
- **Offline caching** via Workbox service worker:
  - All JS, CSS, HTML, images cached on install
  - API calls use Network-First strategy (shows cached data if offline)
  - Google Fonts cached for 1 year
- **App icons**: 192×192 and 512×512 PNG (maskable)
- **Display mode**: Standalone (no browser chrome, looks like a native app)
- **Orientation**: Portrait

---

## 18. API Structure

The backend runs as a single Express.js app (`SSAAM_VERCEL_BACKEND.js`) with the entry point at `server.js`. On Vercel it is wrapped at `api/index.js` as a serverless function.

All endpoints are prefixed with `/apis/`. The Vite dev server proxies `/apis/*` to `localhost:3001` during development.

### Key Endpoint Groups

| Group | Example Endpoints |
|-------|-----------------|
| Auth | `POST /apis/students/login`, `POST /apis/masters/logout` |
| Students | `GET/POST/PUT /apis/students` |
| Face ID | `POST /apis/students/face`, `POST /apis/masters/face` |
| Attendance | `GET /apis/attendance/events`, `POST /apis/attendance/sessions/:id/check` |
| Face Check-In | `POST /apis/attendance/sessions/:id/face-challenge`, `POST /apis/attendance/sessions/:id/check-face-student` |
| Contributions | `GET/POST /apis/contributions/event/:id` |
| Payments | `GET/POST /apis/payments`, `PUT /apis/payments/:id/apply-discount` |
| Raffle | `POST /apis/admin/raffle-tickets`, `GET /apis/student/raffle-ticket` |
| Notifications | `GET/POST /apis/notifications`, `POST /apis/notifications/:id/like` |
| Settings | `PUT /apis/settings` |
| Password Reset | `POST /apis/password-reset/request`, `/verify`, `/complete` |
| Image Upload | `POST /apis/upload-image` |

---

## 19. Multi-College Architecture

```
MongoDB Atlas Database
├── ccs_students          ← CCS student accounts
├── coe_students          ← COE student accounts
├── som_students          ← SOM student accounts
├── cnahs_students        ← CNAHS student accounts
├── ccs_sessiontokens     ← CCS login sessions
├── ccs_attendanceevents  ← CCS events
├── ccs_paymentrecords    ← CCS payment data
├── ccs_settings          ← CCS system settings
├── ccs_notifications     ← CCS-specific announcements
├── notifications         ← Global announcements (all colleges)
├── masters               ← All admin accounts (shared)
└── ...                   ← Same pattern for coe_, som_, cnahs_
```

The active college is sent on every request via the `X-SSAAM-College` HTTP header. The backend function `getCollegeModel(baseModel, CCS_Model, COE_Model, college)` resolves the correct Mongoose model for every operation.

---

## 20. Demo Checklist

Use this checklist to walk through the system during the demo:

### Setup
- [ ] Open the app — confirm the correct college theme (CCS = blue gradient)
- [ ] Log in as **Admin** (Master account)

### Admin Side
- [ ] Show the **Student Management** panel — list of students, approval status
- [ ] Create a new **Attendance Event** with geofence enabled (set the map pin)
- [ ] Add a **Session** to the event (Morning session, 8AM–12PM)
- [ ] Activate the session
- [ ] Check in a student manually by Student ID
- [ ] Show **Face ID Kiosk** mode — camera activates, detects face, marks attendance
- [ ] Show the **Attendance Logs** — who checked in, what time, late/present status
- [ ] Export attendance to **Excel**
- [ ] Show the **Payment Campaign** panel — student payment statuses
- [ ] Apply a **discount** to one student
- [ ] Show the **Contribution** tracking panel
- [ ] Post a **Notification / Announcement** with an image

### Student Side
- [ ] Log in as a **Student**
- [ ] Show the student **Dashboard** — upcoming events, notifications, payment status
- [ ] Open **Face ID Enrollment** — camera activates, capture face, save
- [ ] Check in to the active session via **Face ID** (liveness challenge appears)
- [ ] View **Attendance History**
- [ ] View **Raffle Ticket**
- [ ] Like a notification
- [ ] Show **Forgot Password** flow (request OTP → enter code → set new password)

### Settings
- [ ] Show **RFID Settings** — enable/disable check-in scanner
- [ ] Show **College Theme** switch (CCS blue vs SOM green/yellow)

---

## 21. Key Numbers to Know

| Metric | Value |
|--------|-------|
| Face descriptor size | 128 floats per face |
| Face match threshold (check-in) | 0.55 Euclidean distance |
| Face match threshold (uniqueness) | 0.45 Euclidean distance |
| Max faces per student | 1 (replaceable every 7 days) |
| Max faces per admin | 10 |
| Face challenge TTL | 3 minutes (single-use) |
| Session inactivity timeout | 12 hours |
| Password reset OTP expiry | 10 minutes |
| Geofence default radius | 80 meters |
| Geofence GPS accuracy slack cap | 50 meters |
| Email accounts in rotation pool | 8 Gmail accounts |
| Colleges supported | 4 (CCS, COE, SOM, CNAHS) |
