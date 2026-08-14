# Backend Route Migration Guide

## Overview
This guide documents the process of migrating the 114+ routes from `SSAAM_VERCEL_BACKEND.js` to modular feature-based files in `api/routes/`.

**Current Status:**
- ✅ Foundation extracted (utils, middleware, services, models)
- ✅ CORS & API routing fixed (frontend-backend communication working)
- 🔄 **Starting: Route migration (one feature at a time)**

## Route Categories (114 total endpoints)

### 1. Authentication Routes (12 routes)
- `/apis/students/login` - Student login
- `/apis/students/logout` - Student logout
- `/apis/students/change-password` - Password change
- `/apis/masters/login` - Admin login
- `/apis/masters/logout` - Admin logout
- `/apis/validate-token` - Token validation
- `/apis/password-reset/request` - Password reset request
- `/apis/password-reset/verify` - Reset code verification
- `/apis/password-reset/complete` - Complete reset
- `/api/auth/google` - Google OAuth start
- `/api/auth/callback/google` - Google OAuth callback
- `/api/auth/google/exchange` - Google token exchange

### 2. Student Routes (24 routes)
Covers student search, verification, registration, approval, RFID, and profile management

### 3. Masters/Admin Routes (12 routes)
Covers admin account management, co-admin assignment, role transfers

### 4. Payments Routes (18 routes)
Covers payment creation, updates, student sync, discounts, addons

### 5. Attendance Routes (25 routes)
Covers events, sessions, logs, exports, statistics

### 6. Contributions Routes (5 routes)
Covers admin contributions, transparency reports, exports

### 7. Face Recognition Routes (9 routes)
Covers facial enrollment, verification, liveness checks

### 8. Admin Utilities Routes (9 routes)
Covers ARMS verification, settings, migrations, audit trails

---

## Migration Strategy

### Step 1: Create Feature Route File
Create a new file in `api/routes/{feature}.js`:

```javascript
// api/routes/passwordReset.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { extractToken, hashToken } from '../utils/crypto.js';
import { getCollegeModel } from '../models/index.js';
import { 
  Student, CCS_Student, COE_Student,
  PasswordReset, Master, SessionToken,
  CCS_SessionToken, COE_SessionToken 
} from '../models/index.js';
import { auth, studentAuth, timestampAuth } from '../middleware/auth.js';
import { JWT_SECRET_KEY, EMAIL_FROM } from '../utils/constants.js';
import { formatError } from '../utils/formatters.js';
import { EmailService } from '../services/emailService.js';

const router = express.Router();
const emailService = new EmailService();

// Helper function
function internalError(res, err) {
  console.error('[PasswordReset] Error:', err);
  return res.status(500).json(formatError('Internal server error'));
}

// Route handlers below...
router.post('/apis/password-reset/request', studentAuth, timestampAuth, async (req, res) => {
  // Handler code extracted from monolithic file
});

export default router;
```

### Step 2: Extract Route Handlers
Copy the route handler code from `SSAAM_VERCEL_BACKEND.js` into the new file.

**Important:** Include all helper functions and dependencies needed for those specific routes.

### Step 3: Import Dependencies
Ensure all required imports are at the top:
- Express, JWT, bcrypt, mongoose
- Custom utilities, middleware, models, services
- Constants, validators, formatters

### Step 4: Register in app.js
Update `api/app.js` to import and register the routes:

```javascript
import passwordResetRoutes from './routes/passwordReset.js';

// After middleware setup, before 404 handler:
app.use(passwordResetRoutes);
```

### Step 5: Test Routes
Run the test suite to verify routes still work:

```bash
npm run test  # If using Vite with tests
# Or manually test with:
curl -X POST http://localhost:3001/apis/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"student_id": "25-A-12345", "email": "test@jrmsu.edu.ph"}'
```

### Step 6: Remove from Monolithic File
Delete the migrated route handlers from `SSAAM_VERCEL_BACKEND.js` once confirmed working.

---

## Migration Checklist

For each feature, verify:
- [ ] All endpoint handlers copied
- [ ] All helper functions included (e.g., `_loginCheck()`)
- [ ] All imports correct
- [ ] Route registrations added to app.js
- [ ] Middleware guards preserved (`auth`, `studentAuth`, `requireCoAdminOrAbove`, etc.)
- [ ] College-aware models used correctly
- [ ] Error handling consistent (`internalError`, `formatError`)
- [ ] Tested manually (API call works)
- [ ] Removed from SSAAM_VERCEL_BACKEND.js

---

## Common Issues & Solutions

### Issue: "Model not found"
**Solution:** Ensure correct import from `api/models/index.js`. Use college-specific variants (CCS_Student, COE_Student, etc.) where needed.

### Issue: "Middleware not recognized"
**Solution:** Import middleware from `api/middleware/` and apply in route definition:
```javascript
router.post('/apis/students/login', studentAuth, timestampAuth, async (req, res) => {...});
```

### Issue: "College not detected"
**Solution:** Use `req.college` which is set by `attachCollegeMiddleware` in app.js. For specific college-aware queries:
```javascript
const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college || 'CCS');
```

### Issue: "Circular dependency"
**Solution:** Avoid importing models that import the same route file. Keep imports one-directional: routes → models → schemas.

---

## File Structure After Complete Migration

```
api/
  routes/
    auth.js                    # Login, logout, token validation
    passwordReset.js          # Password reset flow
    students.js               # Student management
    masters.js                # Admin/co-admin management
    payments.js               # Payment management
    attendance.js             # Events, sessions, check-in
    contributions.js          # Contributions tracking
    faceRecognition.js        # Face enrollment & verification
    adminUtilities.js         # ARMS, settings, migrations
    index.js                  # Route registration orchestrator
  middleware/
    auth.js                   # ✅ Already extracted
    rateLimit.js              # ✅ Already extracted
    security.js               # ✅ Already extracted
    validation.js             # ✅ Already extracted
  services/
    emailService.js           # ✅ Already extracted
  models/
    schemas.js                # ✅ Already extracted
    index.js                  # ✅ Already extracted
  utils/
    constants.js              # ✅ Already extracted
    crypto.js                 # ✅ Already extracted
    validators.js             # ✅ Already extracted
    college.js                # ✅ Already extracted
    formatters.js             # ✅ Already extracted
  app.js                      # ✅ Already extracted
SSAAM_VERCEL_BACKEND.js       # ⚠️ To be deleted (currently active)
server.js                     # ✅ Already updated
api/index.js                  # ✅ Already updated
```

---

## Recommended Migration Order

1. **Password Reset** (3 routes) - Small, self-contained, no complex dependencies
2. **Google OAuth** (3 routes) - Standalone, good pattern for auth flows
3. **Face Recognition** (9 routes) - Larger, but self-contained
4. **Admin Utilities** (9 routes) - ARMS, settings, migrations
5. **Masters/Admin** (12 routes) - Co-admin management
6. **Payments** (18 routes) - Complex, many helpers
7. **Attendance** (25 routes) - Largest, most complex
8. **Students** (24 routes) - Largest by endpoint count
9. **Core Health** (GET /, /apis/health) - Move last, kept minimal

---

## Timeline Estimate

- Password Reset: ~15 minutes (simple)
- Google OAuth: ~15 minutes (simple)
- Face Recognition: ~30 minutes (medium)
- Each large feature (Payments, Attendance, Students): ~45-60 minutes
- **Total: ~4 hours to migrate all features**

---

## Key Implementation Notes

### Always use college-aware models
```javascript
// ❌ Don't do this
const student = await Student.findOne({ student_id });

// ✅ Do this
const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
const student = await StudentModel.findOne({ student_id });
```

### Preserve middleware order
```javascript
// ❌ Wrong
router.post('/apis/route', timestampAuth, studentAuth, async (req, res) => {});

// ✅ Correct (auth first, then timestamp)
router.post('/apis/route', studentAuth, timestampAuth, async (req, res) => {});
```

### Use consistent error handling
```javascript
// All route files should use this pattern
function internalError(res, err) {
  console.error('[FeatureName] Error:', err);
  return res.status(500).json(formatError('Internal server error'));
}

try {
  // handler logic
} catch (err) {
  internalError(res, err);
}
```

### Keep helper functions with routes
If a helper like `_loginCheck()` is only used by password reset routes, define it in `passwordReset.js`. If used by multiple features, consider moving to `utils/helpers.js`.

---

## Verification Steps

After migrating all routes:

1. **Frontend login test** - Should work end-to-end
2. **Run test suite** - All 114+ endpoints should respond
3. **Check logs** - No errors for modular routes
4. **Delete monolithic file** - SSAAM_VERCEL_BACKEND.js can be archived/deleted
5. **Update documentation** - Update API docs if applicable

---

## Support Resources

- **Test endpoint:** Check coverage in conversation history
- **Line numbers:** Use `grep -n` to find specific routes in SSAAM_VERCEL_BACKEND.js
- **Import patterns:** See `api/app.js` for middleware chain examples
- **Model usage:** See `api/models/index.js` for factory pattern

---

**Next Step:** Start with Password Reset routes (3 routes, ~15 min) to establish the pattern, then proceed with other features.
