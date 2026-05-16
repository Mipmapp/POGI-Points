# SSAAM Priority Fixes
**Date:** May 16, 2026  
**Status:** ✅ ALL APPROVED FIXES APPLIED (P1–P7, P9–P15)

---

## Summary

The user approved all fixes except P8 (C-03 — client-side admin 2FA is intentional). All others have been applied as of May 16, 2026.

---

## Priority 1 — Apply Immediately (CRITICAL)

---

### ✅ P1 · Add auth middleware to `/apis/upload-image`

**Risk fixed:** C-02 — Anyone on the internet could upload files to your Cloudinary account.  
**Applied:** `auth` middleware added to the upload route.

```
BEFORE: app.post('/apis/upload-image', async (req, res) => {
AFTER:  app.post('/apis/upload-image', auth, async (req, res) => {
```

---

### ✅ P2 · Fix CORS `isLocalhost` logic bug

**Risk fixed:** H-01 — Every HTTP website in the world could make credentialed cross-origin requests.  
**Applied:** `isLocalhost` now uses an explicit allowlist of known local origins.

```
BEFORE: return origin.startsWith('http://') || ...
AFTER:  return ALLOWED_LOCALHOST_ORIGINS.includes(origin);
```

---

### ✅ P3 · Fix raw error messages in 500 responses

**Risk fixed:** M-05 — Database schema details leaked to any caller who triggered an error.  
**Applied:** `internalError(res, err)` helper added; 95 raw `err.message` instances replaced in one pass.

---

### ✅ P4 · Sanitize user input in email HTML templates

**Risk fixed:** M-03 — Student-supplied names injected raw into HTML emails.  
**Applied:** `sanitizeHtml()` wrapped around `studentName`, `rejectionReason`, `rfidCode`, `verifiedBy` in all email functions.

---

### ✅ P5 · Remove/replace `v-html` in Dashboard.vue

**Risk fixed:** M-01 — Stored XSS risk in privacy/terms sections.  
**Applied:** Both `<span v-html="point">` replaced with `<span>{{ point }}</span>`.

---

## Priority 2 — Apply This Week (HIGH)

---

### ✅ P6 · Replace weak JWT secret with a cryptographically strong key

**Risk fixed:** H-02 — JWT secret `SSAAMRegJRMSU` was short and predictable.  
**Applied:** 128-char random hex `JWT_SECRET` generated and stored as shared env var. Backend now uses `JWT_SECRET_KEY = process.env.JWT_SECRET || SSAAM_API_KEY`. All `jwt.sign()` and `jwt.verify()` calls updated.  
**Note:** All active sessions were invalidated. Users must re-login.

---

### ✅ P7 · Remove JWT from query parameter fallback

**Risk fixed:** H-03 — Tokens in URLs get logged in server logs and browser history.  
**Applied:** `if (req.query && req.query.token)` branch removed from `extractToken()`.

---

### ⏭️ P8 · Move admin 2FA verification server-side

**Status:** SKIPPED — User confirmed this is intentional design. The MMDDYY-based code is a deliberate "tricky but simple" secondary check.

---

### ✅ P9 · Remove hardcoded AES encryption key

**Risk fixed:** C-01 — AES key was visible to every browser that loaded the app.  
**Applied:**
- Backend: `encryptPayload()` function and `_EK` constant removed; health and settings endpoints now return plain JSON.
- Frontend: `_EK`, `_hexToBytes()`, `_decrypt()` removed from `apiService.js`; `request()` now returns `response.json()` directly.

---

### ✅ P10 · Upgrade `studentAuth` data routes to `auth`

**Risk fixed:** H-04 — Static bearer token `SSAAMStudents` gave anyone access to student listing routes.  
**Applied:** Three data-access routes upgraded:
- `GET /apis/students` — `studentAuth` → `auth`
- `GET /apis/students/stats` — `studentAuth` → `auth`
- `GET /apis/students/pending` — `studentAuth` → `auth`

Pre-login routes (login, registration, verification, password-reset) kept `studentAuth` as appropriate — those are intentionally accessible without a JWT.

---

## Priority 3 — Plan for Next Sprint (MEDIUM/LOW)

---

### ✅ P11 · Fix npm vulnerabilities

**Applied:** `npm audit fix` run. Remaining issue: `xlsx` has no upstream fix available for Prototype Pollution / ReDoS. Monitor for a future patch or consider replacing with an alternative library.

---

### ✅ P12 · Move rate limiters to MongoDB-backed storage

**Risk fixed:** M-04 — In-memory rate limits reset on server restart, allowing bypass.  
**Applied:** All three rate limiters migrated to a MongoDB `RateLimit` collection with TTL indexes:
- **Login rate limiter** (`_loginCheck`, `_loginRecord`) — now async, MongoDB-backed.
- **Verification code rate limiter** (`verificationCodeRateLimiter`) — now async, MongoDB-backed.
- **Registration anti-bot protection** (`antiBotProtection`) — now async, MongoDB-backed.
- All 8 call sites updated to use `await`.
- TTL index ensures automatic cleanup by MongoDB — no manual `setInterval` sweeps needed.

---

### ✅ P13 · Replace localStorage JWT with HttpOnly session cookies

**Risk fixed:** M-02 — JWTs in localStorage accessible to XSS payloads.  
**Applied (hybrid approach — non-breaking):**
- Backend: `cookie-parser` installed and added as middleware.
- Backend: `HttpOnly; Secure; SameSite=Strict` cookie set on all 3 login endpoints (student, master, admin create-secret).
- Backend: `extractToken()` now checks `req.cookies.ssaam_token` before the Authorization header.
- Frontend: All `fetch()` calls now include `credentials: 'include'` so cookies are automatically sent.
- **Note:** The Authorization header is still sent (for backward compatibility). Full migration to cookies-only (removing localStorage) is a future step once all code paths are confirmed to work with cookies.

---

### ✅ P14 · Remove dead Vercel configuration

**Applied:** `vercel.json` deleted. The Vercel process.exit check in the startup guard was also updated to remove the `!process.env.VERCEL` condition.

---

### ✅ P15 · Remove `KNOWN_CRYPTO_KEYS` hardcoded fallback

**Risk fixed:** H-05 — Hardcoded XOR key `SSAAM2025CCS` in the array defeated the env var protection.  
**Applied:** `KNOWN_CRYPTO_KEYS` array cleared to `[]`. Only `SSAAM_CRYPTO_KEY` env var is now used.

---

## Files Changed

| File | Changes |
|------|---------|
| `SSAAM_VERCEL_BACKEND.js` | P1, P2, P3, P4, P6, P7, P9, P10, P12, P13, P14, P15 |
| `src/services/apiService.js` | P9 (removed _decrypt), P13 (credentials:include) |
| `src/pages/Dashboard.vue` | P5 (v-html → text interpolation) |
| `vercel.json` | Deleted (P14) |
| `package.json` | cookie-parser installed (P13), npm audit fix (P11) |

---

*End of PRIORITY_FIXES.md*
