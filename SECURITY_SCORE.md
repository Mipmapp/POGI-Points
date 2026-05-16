# SSAAM Security Score
**Date:** May 16, 2026  
**Auditor:** Senior Web Application Security Analyst

---

## Overall Security Score: 52 / 100

> **Rating: NEEDS SIGNIFICANT IMPROVEMENT**  
> The application has meaningful security controls in place (bcrypt, JWT session validation, NoSQL injection filtering, security headers, rate limiting) but is undermined by several critical flaws — most importantly a publicly exposed encryption key, an unauthenticated upload endpoint, and a trivially bypassed 2FA. These critical issues bring the overall score down significantly.

---

## Score Breakdown

| Layer | Score | Grade | Summary |
|-------|-------|-------|---------|
| **Backend** | 55 / 100 | D+ | Good structure, but CORS bug, weak JWT key, unauthenticated upload, static student auth, and raw error exposure |
| **Frontend** | 42 / 100 | F | Hardcoded encryption key, predictable admin 2FA, XSS risk, all auth in localStorage |
| **Database** | 68 / 100 | C+ | NoSQL injection filtering present, bcrypt hashing, schema validation — but no field-level encryption or audit logging |
| **Dependency** | 40 / 100 | F | 1 CRITICAL + 4 HIGH npm vulnerabilities unpatched |
| **Deployment** | 55 / 100 | D+ | HTTPS present, security headers set — but dead Vercel config, in-memory rate limits, CORS logic flaw |

---

## What is Working Well

| Control | Location | Notes |
|---------|----------|-------|
| Password hashing | `SSAAM_VERCEL_BACKEND.js` | bcrypt with 12 salt rounds — good |
| NoSQL injection filtering | `SSAAM_VERCEL_BACKEND.js` line 124 | `_stripOperators` removes `$` and `.` keys |
| Session token validation | `auth` middleware | JWTs are cross-checked against DB session records |
| Security headers | `SSAAM_VERCEL_BACKEND.js` line 158 | X-Frame-Options, HSTS, X-Content-Type-Options set |
| Login rate limiting | `_loginMap` | 5 attempts / 10 min lockout implemented |
| Email verification | Registration flow | OTP-based email verification before account approval |
| Timing-safe comparison | `timingSafeCompare` helper | Prevents timing attacks on secret comparisons |
| Input sanitization helper | `sanitizeHtml()` | Exists — but not applied everywhere it should be |
| Role-based middleware | `requireMaster`, `requireSuperAdmin`, `requireCoAdminOrAbove` | Layered role checks for admin routes |
| Cloudinary lifecycle | Delete on notification remove/replace | Orphaned image cleanup handled |

---

## Issues Summary by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| CRITICAL | 4 | C-01 Hardcoded AES key, C-02 Unauthenticated upload, C-03 Client-side 2FA bypass, C-04 Critical npm CVE |
| HIGH | 6 | H-01 CORS logic bug, H-02 Weak JWT secret, H-03 Token in query param, H-04 Static student auth, H-05 Hardcoded XOR key, H-06 High npm CVEs |
| MEDIUM | 8 | M-01 v-html XSS, M-02 localStorage JWT, M-03 Email HTML injection, M-04 In-memory rate limits, M-05 Raw error messages, M-06 10MB body limit, M-07 UA bypass, M-08 No CSRF tokens |
| LOW | 4 | L-01 Console logging, L-02 Health endpoint info, L-03 Hardcoded admin username, L-04 Dead Vercel config |
| **Total** | **22** | |

---

## Score Impact If Critical Issues Are Fixed

| Fix Applied | Score Impact | New Score |
|-------------|-------------|-----------|
| Fix C-01 (remove hardcoded AES key) | +8 | 60 |
| Fix C-02 (auth on upload endpoint) | +6 | 66 |
| Fix C-03 (server-side 2FA) | +7 | 73 |
| Fix H-01 (CORS localhost bug) | +5 | 78 |
| Fix H-02 (strong JWT secret) | +5 | 83 |
| Fix H-04 (remove static student auth) | +4 | 87 |
| Fix M-01 (remove v-html) | +3 | 90 |
| Fix M-05 (generic error messages) | +2 | 92 |
| Fix npm vulnerabilities | +4 | 96 |

**Projected score after all critical + high fixes: ~85–90 / 100**

---

## OWASP Top 10 Mapping

| OWASP Category | Status | Issues |
|----------------|--------|--------|
| A01 Broken Access Control | FAIL | C-02, H-04, M-08 |
| A02 Cryptographic Failures | FAIL | C-01, H-02, H-05 |
| A03 Injection | PARTIAL | NoSQL filter exists; email HTML injection (M-03) |
| A04 Insecure Design | FAIL | C-03 client-side 2FA, H-04 static key auth |
| A05 Security Misconfiguration | FAIL | H-01 CORS, M-06 body limit, L-04 dead config |
| A06 Vulnerable Components | FAIL | C-04, H-06 — critical/high npm CVEs |
| A07 Auth Failures | FAIL | H-02 weak JWT, H-03 token in URL, H-04 |
| A08 Integrity Failures | PARTIAL | JWT verified against DB session (good); no SRI |
| A09 Logging Failures | PARTIAL | Some logging present; sensitive data in logs (L-01) |
| A10 SSRF | PASS | No user-controlled URL fetching detected |

---

*End of SECURITY_SCORE.md*
