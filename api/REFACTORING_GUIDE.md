# SSAAM Backend Refactoring Guide

## Current State
- **SSAAM_VERCEL_BACKEND.js**: 8487 lines (monolithic)
- **Problem**: Hard to maintain, difficult to test, poor separation of concerns

## Target Architecture

```
api/
├── app.js                    (Main Express app with middleware setup)
├── index.js                  (Export app)
├── REFACTORING_GUIDE.md     (This file)
│
├── middleware/
│   ├── auth.js              (JWT validation, requireMaster, requireCoAdmin, etc.)
│   ├── rateLimit.js         (Login rate limiting, verification code throttling)
│   ├── validation.js        (Timestamp validation, NoSQL injection prevention)
│   ├── security.js          (Security headers, CORS configuration)
│   └── errorHandler.js      (Centralized error handling)
│
├── routes/
│   ├── index.js             (Route registration)
│   ├── students.js          (Registration, login, profile, RFID, photo)
│   ├── masters.js           (Admin login, facial recognition)
│   ├── coAdmins.js          (Co-admin management - super admin only)
│   ├── payments.js          (Payment campaigns, student payments, discounts)
│   ├── contributions.js     (Admin contributions, transparency reports)
│   ├── attendance.js        (Events, sessions, check-in/out logging, face verification)
│   ├── auth.js              (Password reset, token validation, logout)
│   └── admin.js             (Settings, migrations, health checks, ARMS verification)
│
├── models/
│   ├── index.js             (Centralized model exports)
│   ├── schemas.js           (All database schemas with proper organization)
│   └── college-models.js    (College-aware model getters)
│
├── services/
│   ├── emailService.js      (Gmail account rotation, email sending)
│   ├── armsService.js       (JRMSU ARMS API integration)
│   ├── studentService.js    (Student business logic - registration, approval)
│   ├── paymentService.js    (Payment campaign logic)
│   ├── attendanceService.js (Attendance recording logic)
│   └── auditService.js      (Audit trail logging)
│
└── utils/
    ├── constants.js         (Magic numbers, valid values, regex patterns)
    ├── crypto.js            (Token generation, hashing, timestamp encryption)
    ├── validators.js        (Name, suffix, semester, year level validation)
    ├── formatters.js        (Data formatting and sanitization)
    ├── errorMessages.js     (Centralized error message constants)
    └── college.js           (College detection, prefixes, college helpers)
```

## Migration Strategy

### Phase 1: Foundation (No Changes to API)
1. Create directory structure
2. Extract all middleware to `middleware/` 
3. Extract all utilities to `utils/`
4. Export schemas and college models
5. Create `api/app.js` that imports all middleware but DOESN'T attach routes yet

### Phase 2: Route Organization (Gradual)
1. Create route files in `routes/` directory
2. Migrate routes one feature at a time:
   - Start with health check and simple endpoints
   - Move to student endpoints
   - Then payments, attendance, etc.
3. Each route file imports its own services and middleware

### Phase 3: Cleanup
1. Delete `SSAAM_VERCEL_BACKEND.js` (only after all routes migrated and tested)
2. Remove dead code
3. Update imports in `server.js` and `api/index.js`

## Key Files to Extract

### middleware/auth.js
- `extractToken()`
- `auth()` - JWT verification with college awareness
- `studentAuthWithToken()`
- `studentAuth()`
- `requireMaster()` - Super admin gate
- `requireSuperAdmin()` - Full admin only
- `requireCoAdminOrAbove()` - Block treasurer
- `studentSearchAuth()`

### middleware/rateLimit.js
- `RateLimit` schema and model
- `_getClientIP()`
- `_loginCheck()`
- `_loginRecord()`
- `verificationCodeRateLimiter` object
- `antiBotProtection()` middleware

### middleware/validation.js
- `timestampAuth()` middleware
- `isValidTimestamp()`
- `decodeTimestamp()` functions

### middleware/security.js
- CORS configuration and helper functions
- `_stripOperators()` - NoSQL injection prevention
- Security headers middleware

### utils/constants.js
- `VALID_COLLEGES`
- `VALID_PROGRAMS`
- `VALID_SUFFIXES`
- `VALID_SEMESTERS`
- `VALID_YEAR_LEVELS`
- `VALID_ROLES`
- `VALID_RFID_STATUS`
- `ALLOWED_ORIGINS` and related
- `GMAIL_ACCOUNTS` parsing
- All regex patterns

### utils/crypto.js
- `generateVerificationCode()`
- `generateSecureToken()`
- `hashToken()`
- `decodeTimestampWithKey()`
- `encodeTimestamp()` (if used)

### utils/validators.js
- `validateName()`
- `validateSuffix()`
- `validateSemester()`
- `validateYearLevel()`

### models/college-models.js
- `getModel()`
- `getCollegeModel()`
- `normalizeCollege()`
- `getCollegeFromRequest()`
- `withPrefix()`
- `getPrefix()`

### services/emailService.js
- `emailService` object with all methods
- Email helper functions:
  - `sendVerificationEmail()`
  - `sendApprovalEmail()`
  - `sendRFIDVerificationEmail()`
  - `sendPasswordResetEmail()`

### services/armsService.js
- `callARMSVerify()` - Shared ARMS verification
- ARMS constants and URLs
- ARMS helper functions

## Migration Checklist

Before deleting SSAAM_VERCEL_BACKEND.js:
- [ ] All 126 routes migrated to route files
- [ ] All middleware functions extracted
- [ ] All utility functions exported from utils/
- [ ] All email functions in services/emailService.js
- [ ] All ARMS functions in services/armsService.js
- [ ] College model helpers properly exported
- [ ] server.js imports from `api/app.js` instead
- [ ] api/index.js imports from `api/app.js`
- [ ] All imports updated in route files
- [ ] No references to SSAAM_VERCEL_BACKEND.js remain
- [ ] All tests pass
- [ ] Application deployed successfully

## Risk Mitigation

### Keep Working During Refactor
1. **Don't touch SSAAM_VERCEL_BACKEND.js** while migrating - keep it as fallback
2. **Create parallel imports** - middleware, utils, models work independently
3. **Test incrementally** - each route file can be tested independently
4. **Gradual route migration** - migrate one endpoint at a time, not all at once
5. **Run full test suite** after each phase

### Rollback Plan
If something breaks:
1. Keep git history - can revert individual commits
2. Keep SSAAM_VERCEL_BACKEND.js as reference until all migrations complete
3. api/index.js currently just re-exports the monolithic file - it can stay that way

## Dead Code to Remove (After Migration)

These should be removed once routes are migrated:
- Duplicate model definitions (once centralized)
- Commented-out endpoints
- Unused utility functions
- Debug logging that's not in production use
- Legacy endpoint variants (if any)

## Example: Migrating One Endpoint

### Before (in SSAAM_VERCEL_BACKEND.js)
```javascript
app.get('/apis/health', (req, res) => {
    const now = new Date();
    res.set('X-SSAAM-Server-Time', now.toISOString());
    res.set('Date', now.toUTCString());
    res.status(200).json({
        message: "SSAAM API Health Check",
        status: "operational",
        timestamp: now.toISOString()
    });
});
```

### After (in routes/admin.js)
```javascript
// routes/admin.js
import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
    const now = new Date();
    res.set('X-SSAAM-Server-Time', now.toISOString());
    res.set('Date', now.toUTCString());
    res.status(200).json({
        message: "SSAAM API Health Check",
        status: "operational",
        timestamp: now.toISOString()
    });
});

export default router;
```

### Register in routes/index.js
```javascript
// routes/index.js
import adminRoutes from './admin.js';

export function registerRoutes(app) {
    app.use('/apis', adminRoutes);
}
```

### Use in app.js
```javascript
// app.js
import { registerRoutes } from './routes/index.js';

registerRoutes(app);
```

## Expected Benefits

✅ **Maintainability**: Each route in its own file with clear dependencies  
✅ **Testability**: Services can be unit tested independently  
✅ **Scalability**: Easy to add new features/routes  
✅ **Debugging**: Clear separation makes bugs easier to find  
✅ **Team Collaboration**: Multiple developers can work on different routes simultaneously  
✅ **Performance**: No change, same monolithic file loads just organized differently  

## Timeline Estimate

- Phase 1 (Foundation): 30 minutes
- Phase 2 (Routes): 2-4 hours (depends on thoroughness)
- Phase 3 (Cleanup): 30 minutes
- Testing: 1+ hours

**Total: 4-6 hours for complete refactoring**

