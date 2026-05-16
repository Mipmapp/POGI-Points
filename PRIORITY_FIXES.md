# SSAAM Priority Fixes
**Date:** May 16, 2026  
**Status:** AWAITING YOUR APPROVAL — Nothing has been changed yet.

Please review each fix below and tell me which ones to apply. You can approve:
- Individual fixes by number (e.g., "Apply P1, P3, P5")
- All critical fixes ("Apply all critical")
- Everything ("Apply all")

I will explain every change before making it and will not touch anything until you confirm.

---

## Priority 1 — Apply Immediately (CRITICAL)

---

### P1 · Add auth middleware to `/apis/upload-image`

**Risk being fixed:** C-02 — Anyone on the internet can upload files to your Cloudinary account.  
**Change:** Add `auth` as middleware on the upload route.  
**Estimated time:** 2 minutes.  
**Risk of breaking something:** Very low — only unauthenticated callers are affected (none should exist).

```
BEFORE: app.post('/apis/upload-image', async (req, res) => {
AFTER:  app.post('/apis/upload-image', auth, async (req, res) => {
```

---

### P2 · Fix CORS `isLocalhost` logic bug

**Risk being fixed:** H-01 — Every HTTP website in the world can make credentialed cross-origin requests to your API.  
**Change:** Restrict the localhost check to specific known local origins only.  
**Estimated time:** 5 minutes.  
**Risk of breaking something:** Low — only development environments using non-standard ports are affected.

```
BEFORE: return origin.startsWith('http://') || origin.startsWith('http://127.0.0.1');
AFTER:  Explicit allowlist: ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000']
```

---

### P3 · Fix raw error messages in 500 responses

**Risk being fixed:** M-05 — Database schema details are leaked to any caller who triggers an error.  
**Change:** Replace `res.status(500).json({ message: err.message })` with a generic message. Log full error server-side.  
**Estimated time:** 30 minutes (many instances throughout the file).  
**Risk of breaking something:** None — only changes what the client sees on error; logging is unchanged.

---

### P4 · Sanitize user input in email HTML templates

**Risk being fixed:** M-03 — Student-supplied names and other fields are injected raw into HTML emails.  
**Change:** Wrap `studentName`, `rejectionReason`, `rfidCode`, `verifiedBy` in the existing `sanitizeHtml()` call.  
**Estimated time:** 10 minutes.  
**Risk of breaking something:** None.

---

### P5 · Remove/replace `v-html` in Dashboard.vue

**Risk being fixed:** M-01 — Stored XSS risk in privacy/terms sections.  
**Change:** Replace `<span v-html="point">` with `<span>{{ point }}</span>` — or install DOMPurify if HTML formatting is required.  
**Estimated time:** 5 minutes.  
**Risk of breaking something:** Visual only — if the text currently renders HTML tags as formatting, they will appear as literal text instead. Review the content first.

---

## Priority 2 — Apply This Week (HIGH)

---

### P6 · Replace weak JWT secret with a cryptographically strong key

**Risk being fixed:** H-02 — JWT secret `SSAAMRegJRMSU` is short, predictable, and visible in env config.  
**Change:**  
1. Generate a new secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.  
2. Store as `JWT_SECRET` in Replit Secrets (not in `.replit` shared env).  
3. Update backend to use `process.env.JWT_SECRET` for JWT sign/verify.  
**Estimated time:** 15 minutes.  
**Risk of breaking something:** All active sessions will be invalidated. All logged-in users must re-login. Plan a brief maintenance window.

---

### P7 · Remove JWT from query parameter fallback

**Risk being fixed:** H-03 — Tokens in URLs are logged everywhere.  
**Change:** Remove the `if (req.query && req.query.token)` branch from `extractToken()`.  
**Estimated time:** 5 minutes.  
**Risk of breaking something:** Only if any frontend code currently passes tokens as query parameters. Audit first.

---

### P8 · Move admin 2FA verification server-side

**Risk being fixed:** C-03 — The admin 2FA code (date-based MMDDYY) is computed entirely in the browser and trivially bypassed.  
**Change:**  
1. Create a backend endpoint `POST /apis/admin/verify-2fa` that checks the code server-side.  
2. Remove the code computation from `Login.vue`.  
**Estimated time:** 45 minutes.  
**Risk of breaking something:** Admin login flow changes. Thorough testing required.  
**Note:** Consider upgrading to TOTP (Google Authenticator compatible) for true 2FA — we can implement this instead if you prefer.

---

### P9 · Remove hardcoded AES encryption key from frontend (C-01)

**Risk being fixed:** C-01 — The encryption key is in every visitor's browser.  
**Change:** Remove `encryptPayload()` from the backend and `_decrypt()` from `apiService.js`. HTTPS already provides transport encryption — payload encryption with a client-side key adds nothing.  
**Estimated time:** 30 minutes (remove server-side encrypt, remove client-side decrypt, test all endpoints).  
**Risk of breaking something:** Yes — requires coordinated removal from both files at the same time. All API responses will stop being wrapped in `{ _ssaam: 1, iv: ..., d: ... }`.

---

### P10 · Upgrade `studentAuth` routes to per-user JWT (`studentAuthWithToken`)

**Risk being fixed:** H-04 — The static bearer token `SSAAMStudents` is shared by all students and gives access to student-level routes for anyone who discovers it.  
**Change:** Audit every route using `studentAuth` and upgrade to `studentAuthWithToken`.  
**Estimated time:** 1–2 hours (many routes to audit).  
**Risk of breaking something:** Yes — the frontend must be sending real JWT tokens on all those calls. Confirm this before proceeding.

---

## Priority 3 — Plan for Next Sprint (MEDIUM/LOW)

---

### P11 · Fix npm vulnerabilities

**Change:** `npm audit fix` then review and test. For remaining issues: `npm audit fix --force` with careful testing.  
**Estimated time:** 30 minutes + testing.

---

### P12 · Move rate limiters to MongoDB-backed storage

**Risk being fixed:** M-04 — In-memory rate limits reset on server restart.  
**Change:** Implement rate-limit documents in MongoDB with TTL indexes.  
**Estimated time:** 2–3 hours.

---

### P13 · Replace localStorage JWT with HttpOnly session cookies

**Risk being fixed:** M-02 — JWTs in localStorage are accessible to XSS payloads.  
**Change:** Backend sets `HttpOnly; Secure; SameSite=Strict` cookies. Frontend removes all `localStorage.getItem('authToken')` references.  
**Estimated time:** Half a day — significant refactor.  
**Risk of breaking something:** High — requires full auth flow redesign. Do P6 and P10 first.

---

### P14 · Remove dead Vercel configuration

**Change:** Delete `vercel.json` and update `.env.production`.  
**Estimated time:** 5 minutes.

---

### P15 · Remove `KNOWN_CRYPTO_KEYS` hardcoded fallback

**Risk being fixed:** H-05 — Hardcoded XOR key `SSAAM2025CCS` defeats the purpose of using an env var.  
**Change:** Remove the `KNOWN_CRYPTO_KEYS` array. Only use `SSAAM_CRYPTO_KEY` from env.  
**Estimated time:** 10 minutes.

---

## Approval Checklist

Please reply with which fixes to apply. Example responses:
- "Apply P1, P2, P4, P5" — I'll apply those specific ones.
- "Apply all Priority 1 fixes" — I'll apply P1 through P5.
- "Apply everything" — I'll apply all 15 in order, explaining each one as I go.
- "Skip P9, apply everything else" — fine too.

I will **not** make any changes until you tell me which ones to proceed with.

---

*End of PRIORITY_FIXES.md*
