# SSAAM Architecture Review
**Date:** May 16, 2026  
**Reviewer:** Senior Web Application Security Analyst / Architect

---

## 1. Overall Architecture Assessment

SSAAM is a well-intentioned system that has grown organically into a monolith. The core multi-college concept is sound, but the implementation has reached a scale where a single backend file of 8,763 lines and a single frontend component of ~20,000 lines are actively hindering security auditing, performance optimization, and maintainability. The most urgent structural problem is not architectural elegance — it is the security issues documented in `SECURITY_REPORT.md` — but the monolithic structure makes those issues harder to find, fix, and prevent in the future.

---

## 2. Frontend Architecture

### Current State
```
src/pages/
├── Dashboard.vue      (~20,000 lines — all admin and student panels in one file)
├── Login.vue          (~1,500 lines — login, face ID, admin 2FA, college detection loop)
├── Register.vue       (~1,000 lines — multi-step registration)
└── EventDetails.vue   (public event view)
```

### Issues Found

**Dead / Redundant Logic**
- The college detection loop in `Login.vue` sequentially tries multiple API endpoints with hardcoded bearer tokens. This client-side detection duplicates logic that the server already handles via the `X-SSAAM-College` header. It exposes your internal API structure and creates redundant network traffic.
- `VITE_SSAAM_STUDENTS_API_KEY` and `VITE_SSAAM_API_KEY` are baked into the built JS bundle — they are not private.

**Scalability / Maintainability Problems**
- `Dashboard.vue` at ~20,000 lines is unmaintainable. A security review of this file alone takes hours. Bugs introduced by one developer affect the entire application. Vue's component system exists precisely to solve this — it is not being used at the page level.
- All conditional panel visibility logic (`v-if="isAdmin"`, `v-if="isStudent"`) lives in one enormous file, making authorization bypasses easy to miss.

**Performance Issues**
- The face recognition models (`@vladmandic/face-api`) are loaded in the browser. These are large WASM/binary files. No lazy loading strategy is apparent — they may be loaded on every page visit regardless of whether the user needs face recognition.

**Recommended Structural Improvements**
```
src/pages/
├── dashboard/
│   ├── AdminDashboard.vue
│   ├── StudentDashboard.vue
│   └── panels/
│       ├── AttendancePanel.vue
│       ├── ContributionsPanel.vue
│       ├── PaymentsPanel.vue
│       ├── RafflePanel.vue
│       ├── EventsPanel.vue
│       └── SettingsPanel.vue
```
This is a future refactor goal — not a prerequisite for security fixes.

---

## 3. Backend Architecture

### Current State
```
SSAAM_VERCEL_BACKEND.js   (8,763 lines — single monolithic Express app)
server.js                  (8 lines — just imports and listens)
config/
└── cloudinary.js          (10 lines)
```

### Issues Found

**Dead Code**
- `vercel.json` — Vercel deployment configuration. The app runs on Replit. This file is vestigial and creates deployment confusion (see L-04 in Security Report).
- `api/index.js` — Exists but its purpose is unclear given the main backend is `SSAAM_VERCEL_BACKEND.js`. Should be audited and removed if unused.
- `.env.production` — Contains a `VITE_API_URL` pointing to `https://ssaam-api.vercel.app` which no longer exists.
- `scripts/cleanup_cloudinary.js` — One-off maintenance script committed to the repo. Fine to keep, but should be documented clearly.

**Duplicate Logic**
- College prefix resolution (`getPrefix`, `getPrefixedCollectionName`, `getCollectionName`, `withPrefix`) — four functions that all do variations of the same thing. This should be one canonical function.
- `autoFixStudentIds` runs on every single `GET /apis/payments` request (line 1005). This is a full collection scan on every payment page load. It should run once as a migration script, not on every API call.

**Performance Bottlenecks**
- **N+1 Queries:** `GET /apis/payments` fetches all payment records (`PaymentRecordModel.find({})`) and all students (`StudentModel.find({})`) on every request, then joins them in JavaScript. For large datasets this will be extremely slow. This should use MongoDB's `$lookup` aggregation pipeline.
- **No Pagination on Inner Data:** Payment records include all student records for all payments in a single response. As student counts grow, these responses will become very large.
- **`autoFixStudentIds` on every read:** This is a write operation running inside a read endpoint — it mutates the database on every page load.

**Security-Relevant Structural Issues**
- The single-file monolith makes it extremely easy for middleware to be applied to some routes and forgotten on others (as happened with `/apis/upload-image` — C-02 in Security Report).
- Route-level authorization is inconsistent: some admin routes use `[auth, requireMaster, requireSuperAdmin]`, others use just `[auth]`, and `/apis/upload-image` uses nothing. In a properly structured app with router-level middleware groupings, this class of mistake is far less likely.

**Recommended Structural Improvements**
```
server/
├── app.js              (Express app setup, middleware registration)
├── server.js           (listen)
├── middleware/
│   ├── auth.js         (auth, studentAuth, requireMaster, etc.)
│   ├── cors.js
│   └── rateLimit.js
├── routes/
│   ├── students.js
│   ├── masters.js
│   ├── payments.js
│   ├── attendance.js
│   ├── events.js
│   ├── contributions.js
│   └── notifications.js
├── models/             (Mongoose schemas)
└── services/
    ├── email.js
    └── cloudinary.js
```
Again — this is a long-term improvement. The security issues in `SECURITY_REPORT.md` should be addressed first.

---

## 4. Database Architecture

### Strengths
- Multi-college isolation via collection prefixes is a clean approach for a single-tenant system.
- bcrypt with 12 rounds for password hashing is appropriately strong.
- Session tokens stored in the database with expiry and revocation support — good design.
- Audit logging (`logAudit`) appears to be implemented for key admin operations.

### Issues Found

**No Field-Level Encryption**
- Student biometric data (face descriptors) and RFID codes are stored unencrypted in MongoDB. If the database is ever breached, biometric data is irrecoverable — you cannot change someone's face. Consider encrypting face descriptor arrays at rest using a server-side key.

**No Index Audit**
- Collection access patterns suggest that `student_id` is frequently used as a query filter, but there is no visible index definition ensuring this is indexed. Large collections without proper indexes will result in full collection scans.

**In-Memory Session Data Mixed with Persistent Data**
- The `SessionToken` model (database-backed) is mixed with in-memory Maps for rate limiting. A consistent approach using the database for all stateful data would simplify the security model.

**Missing Soft-Delete for Students**
- Students are hard-deleted (`findOneAndDelete`). Deleted student records cannot be recovered and break any historical attendance/payment data that references them. Soft-delete (`status: 'deleted'`) is safer.

---

## 5. API Design

### Issues Found

**Inconsistent Authentication Patterns**
Three different authentication mechanisms are used across routes:
1. `auth` — JWT + DB session (strong)
2. `studentAuthWithToken` — JWT + DB session for students (strong)
3. `studentAuth` — static shared key (weak — see H-04)

Routes should use only mechanisms 1 and 2.

**Unauthenticated Endpoints**
The following endpoints have no authentication:
- `POST /apis/upload-image` — CRITICAL (see C-02)
- `GET /apis/contributions/transparency` — Leaks student financial data publicly
- `GET /apis/health` — Minor, acceptable

`/apis/contributions/transparency` deserves specific attention: it returns all student names, programs, year levels, and payment amounts with no authentication. This is likely unintentional.

**Route Organization**
Routes are defined throughout the 8,763-line file in no discernible order. Finding all routes that access a given collection, or all routes without auth, requires reading the entire file.

---

## 6. Deployment Architecture

### Current State
- Frontend: Vite dev server on port 5000 (Replit workflow)
- Backend: Express on port 3001 (Replit workflow)
- Database: MongoDB Atlas (external)
- Images: Cloudinary (external)
- Email: Gmail SMTP pool (external)

### Issues
- **Two deployment targets in the codebase:** `vercel.json` (Vercel) and `.replit` / workflow configs (Replit). Only one should exist.
- **`NODE_ENV=development`** is set in the shared Replit env. This means the CORS `development` mode (allowing all origins) will be active even if deployed. Set `NODE_ENV=production` in the production environment.
- **Single process, no clustering:** The backend runs as a single Node.js process. For production, consider PM2 clustering or a process manager to utilize all CPU cores.
- **No health check endpoint security:** The health endpoint is public; consider adding a secret token for monitoring tools to prevent information leakage to arbitrary callers.

---

## 7. Summary Recommendations by Priority

| Priority | Action |
|----------|--------|
| **Immediate** | Apply security fixes in PRIORITY_FIXES.md (P1–P5) |
| **This week** | Apply P6–P10; set `NODE_ENV=production` in production env |
| **Next sprint** | Remove `autoFixStudentIds` from the GET endpoint (run as one-time migration); add database indexes; fix N+1 query in payments |
| **Next quarter** | Begin extracting `Dashboard.vue` into sub-components; modularize backend routes; migrate rate limits to MongoDB |
| **Long term** | Encrypt biometric data at rest; move to HttpOnly cookies; implement proper TOTP 2FA |

---

*End of ARCHITECTURE_REVIEW.md*
