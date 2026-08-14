// ============================================================
// SECURITY MIDDLEWARE - CORS, Headers, NoSQL injection prevention
// ============================================================

import { ALLOWED_ORIGINS, ALLOWED_LOCALHOST_ORIGINS } from '../utils/constants.js';

/**
 * Check if origin is a valid Replit-hosted origin
 * Matches any Replit-hosted origin with or without a port
 * @param {string} origin - Origin to check
 * @returns {boolean} True if origin is Replit-hosted
 */
function isReplitOrigin(origin) {
    if (!origin) return false;
    return /^https?:\/\/[^/]+(\.replit\.dev|\.repl\.co|\.replit\.app)(:\d+)?$/.test(origin);
}

/**
 * Check if origin is localhost
 * @param {string} origin - Origin to check
 * @returns {boolean} True if origin is localhost
 */
function isLocalhost(origin) {
    if (!origin) return false;
    return ALLOWED_LOCALHOST_ORIGINS.includes(origin);
}

/**
 * CORS options for Express
 * Allows requests from registered origins, Replit, and localhost (dev)
 */
export const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (same-origin requests, mobile apps, etc.)
        if (!origin) return callback(null, true);

        // Allow if origin is in allowed list, is a Replit origin, or is localhost (for development)
        if (ALLOWED_ORIGINS.includes(origin) || isReplitOrigin(origin) || isLocalhost(origin)) {
            callback(null, true);
        } else {
            // Log unauthorized origins for debugging
            console.log(`[CORS] Blocked origin: ${origin}`);
            
            // For development, allow all origins. For production, be strict.
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-SSAAM-TS',
        'X-SSAAM-College',
        'X-SSAAM-Theme',
        'X-SSAAM-Department',
        'X-SSAAM-Token',
        'X-SSAAM-Original-Student-Id'
    ],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
};

/**
 * Recursively strip MongoDB operators from request data
 * Removes any key starting with '$' or containing '.'
 * Prevents NoSQL injection attacks
 * @param {Object} obj - Object to sanitize
 */
export function stripOperators(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else {
            stripOperators(obj[key]);
        }
    }
}

/**
 * Middleware to strip operators from request body, query, and params
 * Prevents NoSQL injection attacks via MongoDB operators
 * @param {Object} req - Express request
 * @param {Object} _res - Express response
 * @param {Function} next - Express next
 */
export function stripOperatorsMiddleware(req, _res, next) {
    stripOperators(req.body);
    stripOperators(req.query);
    stripOperators(req.params);
    next();
}

/**
 * Middleware to ensure database connection is active
 * Allows requests to continue but logs connection issues
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
export function ensureDatabaseConnection(mongoose) {
    return async (req, res, next) => {
        // Skip connection check for non-API routes
        if (!req.path.startsWith('/apis')) {
            return next();
        }

        // Check connection state
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
            console.warn('Database connection lost, current state:', mongoose.connection.readyState);
            // Don't block request, let it fail with meaningful error
        }

        next();
    };
}

/**
 * Security headers middleware
 * Sets security-related HTTP headers
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
export function securityHeaders(req, res, next) {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.set('Content-Security-Policy', "default-src 'self'");
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
}

/**
 * Middleware to attach college to request context
 * Reads from headers and infers if needed
 * @param {Function} getCollegeFromRequest - Function to determine college
 * @returns {Function} Express middleware
 */
export function attachCollegeMiddleware(getCollegeFromRequest) {
    return (req, res, next) => {
        req.college = getCollegeFromRequest(req);
        
        // Store in res.locals for view rendering if needed
        res.locals = res.locals || {};
        res.locals.college = req.college;
        
        next();
    };
}

/**
 * Middleware to enforce college restrictions for co-admin tokens
 * Co-admins and treasurers can only access their assigned college's data
 * @param {Function} extractToken - Function to extract token from request
 * @param {Function} jwt - JWT module
 * @param {string} JWT_SECRET_KEY - Secret for JWT verification
 * @returns {Function} Express middleware
 */
export function enforceCoAdminCollegMiddleware(extractToken, jwt, JWT_SECRET_KEY) {
    return (req, res, next) => {
        try {
            const token = extractToken(req);
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET_KEY);
                if (decoded && decoded.isMaster && (decoded.role === 'co-admin' || decoded.role === 'treasurer') && decoded.college) {
                    req.college = decoded.college;
                }
            }
        } catch (e) {
            // not a valid token — let downstream auth handle it
        }
        next();
    };
}
