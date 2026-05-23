import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import cloudinary from './config/cloudinary.js';
import cookieParser from 'cookie-parser';

// ── Login rate limiter & account lockout ──────────────────────────────────────
// Tracks failed login attempts per IP (and per credential) in memory.
// After LOGIN_MAX_ATTEMPTS failures within LOGIN_WINDOW_MS the IP is locked
// out for LOGIN_LOCKOUT_MS. A successful login clears the counter.
// ── MongoDB-backed Rate Limit model (P12 — persists across restarts) ───────
const rateLimitSchema = new mongoose.Schema({
    key:          { type: String, required: true },
    type:         { type: String, required: true }, // 'login' | 'verif' | 'reg'
    count:        { type: Number, default: 1 },
    firstAttempt: { type: Date, default: Date.now },
    lastAttempt:  { type: Date, default: Date.now },
    lockedUntil:  { type: Date, default: null },
    expireAt:     { type: Date, required: true }
}, { timestamps: false });
rateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
rateLimitSchema.index({ key: 1, type: 1 }, { unique: true });
const RateLimit = mongoose.model('RateLimit', rateLimitSchema);
// ─────────────────────────────────────────────────────────────────────────────

const LOGIN_MAX_ATTEMPTS  = 5;
const LOGIN_WINDOW_MS     = 10 * 60 * 1000; // 10-minute rolling window
const LOGIN_LOCKOUT_MS    = 15 * 60 * 1000; // 15-minute lockout

function _getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';
}

async function _loginCheck(key) {
    try {
        const now = Date.now();
        const doc = await RateLimit.findOne({ key, type: 'login' }).lean();
        if (!doc) return { blocked: false };
        if (doc.lockedUntil && now < doc.lockedUntil.getTime()) {
            return { blocked: true, remainingMins: Math.ceil((doc.lockedUntil.getTime() - now) / 60000) };
        }
        if (now - doc.firstAttempt.getTime() > LOGIN_WINDOW_MS) {
            await RateLimit.deleteOne({ key, type: 'login' });
        }
        return { blocked: false };
    } catch (err) {
        console.error('[RateLimit] _loginCheck DB error:', err.message);
        return { blocked: false }; // fail open — never block legit users on DB error
    }
}

async function _loginRecord(key, success) {
    try {
        if (success) { await RateLimit.deleteOne({ key, type: 'login' }); return; }
        const now = new Date();
        const expireAt = new Date(Date.now() + LOGIN_WINDOW_MS + LOGIN_LOCKOUT_MS);
        const doc = await RateLimit.findOneAndUpdate(
            { key, type: 'login' },
            {
                $inc: { count: 1 },
                $setOnInsert: { firstAttempt: now },
                $set: { lastAttempt: now, expireAt }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (doc.count >= LOGIN_MAX_ATTEMPTS) {
            await RateLimit.updateOne(
                { key, type: 'login' },
                { $set: { lockedUntil: new Date(Date.now() + LOGIN_LOCKOUT_MS) } }
            );
        }
    } catch (err) {
        console.error('[RateLimit] _loginRecord DB error:', err.message);
    }
}
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
dotenv.config();

const ALLOWED_ORIGINS = [
    'https://ssaam.vercel.app',
    // 'http://:5000',
    // 'http://:3000',
    // 'http://127.0.0.1:5000',
    // 'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

const isReplitOrigin = (origin) => {
    if (!origin) return false;
    // Strip port (e.g. https://foo.replit.dev:5000 → https://foo.replit.dev)
    const bare = origin.replace(/:\d+$/, '');
    return bare.endsWith('.replit.dev') || bare.endsWith('.repl.co');
};

const ALLOWED_LOCALHOST_ORIGINS = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];
const isLocalhost = (origin) => {
    if (!origin) return false;
    return ALLOWED_LOCALHOST_ORIGINS.includes(origin);
};

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (same-origin requests, mobile apps, etc.)
        if (!origin) return callback(null, true);

        // Allow if origin is in allowed list, is a Replit origin, or is  (for development)
        if (ALLOWED_ORIGINS.includes(origin) || isReplitOrigin(origin) || isLocalhost(origin)) {
            callback(null, true);
        } else {
            // Log unauthorized origins for debugging but still allow OPTIONS requests (preflight)
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-SSAAM-TS', 'X-SSAAM-College', 'X-SSAAM-Original-Student-Id'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── NoSQL injection sanitizer ─────────────────────────────────────────────────
// Recursively removes any key that starts with '$' or contains '.' from
// req.body / req.query / req.params to block MongoDB operator injection attacks.
function _stripOperators(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else {
            _stripOperators(obj[key]);
        }
    }
}
app.use((req, _res, next) => {
    _stripOperators(req.body);
    _stripOperators(req.query);
    next();
});
// ─────────────────────────────────────────────────────────────────────────────

// Middleware to ensure database connection is active
app.use(async (req, res, next) => {
    // Skip connection check for non-API routes
    if (!req.path.startsWith('/apis')) {
        return next();
    }

    // Check connection state
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
        console.warn('Database connection lost, current state:', mongoose.connection.readyState);
        // Don't block request, let it fail with meaningful error
    }

    next();
});

// Security headers middleware
app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.set('Content-Security-Policy', "default-src 'self'");
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

const PORT = process.env.PORT || 5000;
// Single MongoDB database - all colleges use same DB, separate collections by prefix
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

// Helper to determine college from request and get collection prefix
const VALID_COLLEGES = ['CCS', 'COE', 'SOM', 'CNAHS'];

function normalizeCollege(value) {
    if (!value || typeof value !== 'string') return null;
    const upper = value.toUpperCase().trim();
    if (VALID_COLLEGES.includes(upper)) return upper;
    return null;
}

function getCollegeFromRequest(req) {
    try {
        // 1. Header (most direct — set by frontend on every request)
        const headerCollege = normalizeCollege(req.headers['x-ssaam-college']);
        if (headerCollege) return headerCollege;

        // 2. Theme / department hint headers
        const theme = req.headers['x-ssaam-theme'] || req.headers['x-ssaam-department'];
        const themeCollege = normalizeCollege(theme);
        if (themeCollege) return themeCollege;

        // 3. JWT token payload (before auth middleware has run)
        try {
            const token = extractToken(req);
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET_KEY);
                const tokenCollege = normalizeCollege(decoded.college);
                if (tokenCollege) return tokenCollege;
            }
        } catch (jwtErr) {
            // Token verification failed — continue
        }

        // 4. Already-authenticated master record
        if (req.master && req.master.college) {
            const masterCollege = normalizeCollege(req.master.college);
            if (masterCollege) return masterCollege;
        }

        // 5. Student program-based detection
        if (req.student && req.student.program) {
            const prog = String(req.student.program).toUpperCase();
            if (['BSCE', 'BSEE', 'BSECE', 'BSCPE'].includes(prog)) return 'COE';
            if (['BSM'].includes(prog)) return 'SOM';
            if (['BSN'].includes(prog)) return 'CNAHS';
        }
    } catch (e) {
        console.error('Error determining college from request:', e.message);
    }

    return 'CCS'; // Default
}

// Helper to get collection name with appropriate prefix
function getCollectionName(baseCollectionName) {
    // Masters collection is not prefixed (shared across colleges)
    if (baseCollectionName.toLowerCase() === 'masters') {
        return 'masters';
    }

    // For other collections, get college and apply prefix
    // Note: In middleware context, we need to access req - this function will be called within request handlers
    return baseCollectionName; // Will be prefixed in handlers where req is available
}

// Helper to get prefixed collection name within request context
function getPrefixedCollectionName(baseCollectionName, college) {
    if (baseCollectionName.toLowerCase() === 'masters') {
        return 'masters';
    }
    return `${getPrefix(college)}${baseCollectionName}`;
}

// Single database connection
async function ensureDatabaseConnection(req, res, next) {
    if (mongoose.connection.readyState !== 1) {
        try {
            await mongoose.connect(MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 5,
                retryWrites: true,
                w: 'majority'
            });
            console.log('[DB] Connected to main database');
        } catch (err) {
            console.error('[DB] Failed to connect:', err.message);
            return res.status(500).json({ message: 'Database connection error' });
        }
    }
    next();
}

// Apply before all API routes
app.use('/apis', ensureDatabaseConnection);

// Middleware to attach college to request
app.use('/apis', (req, res, next) => {
    req.college = getCollegeFromRequest(req);
    next();
});

// Apply college context
app.use('/apis', applyCollegeContext);

// Enforce college restrictions for co-admin tokens on every /apis route
app.use('/apis', (req, res, next) => {
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
});

// Extract auth token from header, query, or alternative headers/cookies
function extractToken(req) {
    // Header: "Authorization: Bearer <token>"
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization || req.headers['authorization']);
    if (authHeader) {
        const parts = String(authHeader).split(' ');
        if (parts.length > 1) return parts[1];
        return parts[0];
    }

    // Custom header
    if (req.headers && req.headers['x-ssaam-token']) return req.headers['x-ssaam-token'];

    // Cookie: HttpOnly session cookie (not accessible to XSS)
    if (req.cookies && req.cookies.ssaam_token) return req.cookies.ssaam_token;

    return null;
}

// Helper function to get prefixed collection name
function getPrefix(college) {
    if (college === 'COE') return 'coe_';
    if (college === 'SOM') return 'som_';
    if (college === 'CNAHS') return 'cnahs_';
    return 'ccs_';
}

// Helper to get collection name with prefix (excludes 'masters')
function withPrefix(college, collectionName) {
    if (collectionName === 'masters') return 'masters';
    return `${getPrefix(college)}${collectionName}`;
}

// Cache for dynamically created models (extended below)
const modelCache = {};

// Helper to get a model with the correct prefixed collection name
function getModel(college, baseModelName, baseSchema) {
    const key = `${college}_${baseModelName}`;
    if (!modelCache[key]) {
        const collectionName = withPrefix(college, baseModelName.toLowerCase());
        modelCache[key] = mongoose.model(
            `${college}_${baseModelName}`,
            baseSchema,
            collectionName
        );
    }
    return modelCache[key];
}

// Helper to perform database operations on prefixed collections
async function dbOp(college, collectionName, operation) {
    const prefixedName = withPrefix(college, collectionName);
    const collection = mongoose.connection.db.collection(prefixedName);
    return operation(collection);
}

// Override model collection names based on college (call this at request start)
function applyCollegeContext(req, res, next) {
    // Store college in res.locals for accessing in handlers
    res.locals = res.locals || {};
    res.locals.college = req.college || 'CCS';
    next();
}

if (!process.env.SSAAM_API_KEY || !process.env.SSAAM_CRYPTO_KEY || !process.env.ADMIN_VERIFICATION_SECRET) {
    console.error('CRITICAL: Required security secrets (SSAAM_API_KEY, SSAAM_CRYPTO_KEY, ADMIN_VERIFICATION_SECRET) are not set!');
    // Don't process.exit() on Vercel — it would kill the Lambda cold-start before
    // any response can be sent. Log loudly instead so it shows in Vercel logs.
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

const SSAAM_API_KEY = process.env.SSAAM_API_KEY;
const JWT_SECRET_KEY = process.env.JWT_SECRET || SSAAM_API_KEY;
if (!process.env.JWT_SECRET) {
    console.warn('[Security] JWT_SECRET env var not set — falling back to SSAAM_API_KEY. Set JWT_SECRET for stronger token security.');
}
const SSAAM_CRYPTO_KEY = process.env.SSAAM_CRYPTO_KEY;
const ADMIN_VERIFICATION_SECRET = process.env.ADMIN_VERIFICATION_SECRET;
const PRIMARY_ADMIN_USERNAME = process.env.PRIMARY_ADMIN_USERNAME || 'ssaam';

const VALID_PROGRAMS = ['BSCS', 'BSIT', 'BSIS', 'BSM'];
const VALID_SUFFIXES = ['', 'Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const VALID_SEMESTERS = ['1st Sem', '2nd Sem'];
const VALID_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const VALID_ROLES = ['student', 'treasurer', 'co-admin'];
const VALID_RFID_STATUS = ['verified', 'unverified', 'Unreadable'];


// Gmail accounts array with fallback support (server-side only, never exposed to clients)
const GMAIL_ACCOUNTS = process.env.GMAIL_ACCOUNTS;

// Email service with automatic fallback/rotation
const emailService = {
    currentIndex: 0,
    failedAccounts: new Set(),
    lastResetTime: Date.now(),
    RESET_INTERVAL_MS: 30 * 60 * 1000, // Reset failed accounts after 30 minutes

    getTransporter(accountIndex) {
        const account = GMAIL_ACCOUNTS[accountIndex];
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: account.user,
                pass: account.pass
            }
        });
    },

    getCurrentAccount() {
        return GMAIL_ACCOUNTS[this.currentIndex];
    },

    resetFailedAccountsIfNeeded() {
        const now = Date.now();
        if (now - this.lastResetTime > this.RESET_INTERVAL_MS) {
            this.failedAccounts.clear();
            this.lastResetTime = now;
            console.log('[EmailService] Reset failed accounts list');
        }
    },

    findNextAvailableAccount(startIndex = 0) {
        this.resetFailedAccountsIfNeeded();

        for (let i = 0; i < GMAIL_ACCOUNTS.length; i++) {
            const index = (startIndex + i) % GMAIL_ACCOUNTS.length;
            if (!this.failedAccounts.has(index)) {
                return index;
            }
        }
        return -1; // All accounts failed
    },

    markAccountFailed(index) {
        this.failedAccounts.add(index);
        console.log(`[EmailService] Marked account ${GMAIL_ACCOUNTS[index].user} as failed. Failed accounts: ${this.failedAccounts.size}/${GMAIL_ACCOUNTS.length}`);
    },

    async sendMail(mailOptions) {
        this.resetFailedAccountsIfNeeded();

        let attempts = 0;
        let lastError = null;
        const startIndex = this.findNextAvailableAccount(this.currentIndex);

        if (startIndex === -1) {
            // All accounts have failed recently, reset and try again
            console.log('[EmailService] All accounts failed, resetting and retrying...');
            this.failedAccounts.clear();
            this.lastResetTime = Date.now();
        }

        for (let i = 0; i < GMAIL_ACCOUNTS.length; i++) {
            const accountIndex = (startIndex === -1 ? i : (startIndex + i) % GMAIL_ACCOUNTS.length);

            if (this.failedAccounts.has(accountIndex) && startIndex !== -1) {
                continue; // Skip already failed accounts unless we reset
            }

            const account = GMAIL_ACCOUNTS[accountIndex];
            attempts++;

            try {
                const transporter = this.getTransporter(accountIndex);

                // Update the "from" field to use current account
                const updatedMailOptions = {
                    ...mailOptions,
                    from: mailOptions.from ? mailOptions.from.replace(/<[^>]+>/, `<${account.user}>`) : `SSAAM <${account.user}>`
                };

                console.log(`[EmailService] Attempting to send email via ${account.user} (attempt ${attempts})`);

                const result = await transporter.sendMail(updatedMailOptions);

                // Success! Update current index to this working account
                this.currentIndex = accountIndex;
                console.log(`[EmailService] Email sent successfully via ${account.user}`);

                return result;
            } catch (error) {
                lastError = error;
                console.error(`[EmailService] Failed to send via ${account.user}: ${error.message}`);
                this.markAccountFailed(accountIndex);
            }
        }

        // All accounts failed
        console.error(`[EmailService] All ${GMAIL_ACCOUNTS.length} accounts failed to send email`);
        throw new Error(`Email sending failed after trying all ${GMAIL_ACCOUNTS.length} accounts. Last error: ${lastError?.message}`);
    },

    getStatus() {
        return {
            totalAccounts: GMAIL_ACCOUNTS.length,
            currentAccount: GMAIL_ACCOUNTS[this.currentIndex]?.user,
            failedCount: this.failedAccounts.size,
            availableCount: GMAIL_ACCOUNTS.length - this.failedAccounts.size
        };
    }
};

// Rate limiter for verification code resends — MongoDB-backed (P12)
const verificationCodeRateLimiter = {
    MAX_ATTEMPTS: 4,
    WINDOW_MS:    15 * 60 * 1000,
    MIN_INTERVAL_MS: 60 * 1000,

    async checkAndRecord(email) {
        const now = Date.now();
        const key = email.toLowerCase().trim();
        const expireAt = new Date(now + this.WINDOW_MS);
        try {
            const doc = await RateLimit.findOne({ key, type: 'verif' }).lean();

            if (!doc || (now - doc.firstAttempt.getTime() > this.WINDOW_MS)) {
                await RateLimit.findOneAndUpdate(
                    { key, type: 'verif' },
                    { $set: { count: 1, firstAttempt: new Date(now), lastAttempt: new Date(now), expireAt, lockedUntil: null } },
                    { upsert: true }
                );
                return { allowed: true, attemptsRemaining: this.MAX_ATTEMPTS - 1 };
            }

            const timeSinceLastAttempt = now - doc.lastAttempt.getTime();
            if (timeSinceLastAttempt < this.MIN_INTERVAL_MS) {
                const waitSeconds = Math.ceil((this.MIN_INTERVAL_MS - timeSinceLastAttempt) / 1000);
                return { allowed: false, waitSeconds, message: `Please wait ${waitSeconds} seconds before requesting another code.` };
            }

            if (doc.count >= this.MAX_ATTEMPTS) {
                const waitMinutes = Math.ceil((this.WINDOW_MS - (now - doc.firstAttempt.getTime())) / 60000);
                return { allowed: false, waitMinutes, message: `Maximum resend attempts reached. Please wait ${waitMinutes} minutes before trying again.` };
            }

            await RateLimit.updateOne({ key, type: 'verif' }, { $inc: { count: 1 }, $set: { lastAttempt: new Date(now), expireAt } });
            return { allowed: true, attemptsRemaining: this.MAX_ATTEMPTS - (doc.count + 1) };
        } catch (err) {
            console.error('[RateLimit] verif checkAndRecord error:', err.message);
            return { allowed: true, attemptsRemaining: this.MAX_ATTEMPTS - 1 }; // fail open
        }
    },

    async reset(email) {
        try {
            await RateLimit.deleteOne({ key: email.toLowerCase().trim(), type: 'verif' });
        } catch (err) {
            console.error('[RateLimit] verif reset error:', err.message);
        }
    }
};

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeHtml(str) {
    if (!str) return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function internalError(res, err, userMessage = 'An internal server error occurred.') {
    console.error('[Server Error]', err);
    return res.status(500).json({ message: userMessage });
}

async function sendVerificationEmail(toEmail, code, studentName) {
    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: "SSAAM Email Verification Code",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">SSAAM</h1>
                        <p style="color: white; opacity: 0.9; margin: 5px 0 0 0;">Student School Activities Attendance Monitoring</p>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${sanitizeHtml(studentName)}!</h2>
                        <p style="color: #4b5563;">Your email verification code is:</p>
                        <div style="background: white; border: 2px solid #7c3aed; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${code}</span>
                        </div>
                        <p style="color: #4b5563;">This code will expire in <strong>30 minutes</strong>.</p>
                        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                    </div>
                </div>
            `
    };

    return emailService.sendMail(mailOptions);
}

async function sendApprovalEmail(toEmail, studentName, approved, rejectionReason = '') {
    const subject = approved ? "SSAAM Account Approved - You Can Now Login!" : "SSAAM Account Status Update";
    const statusColor = approved ? "#10b981" : "#ef4444";
    const statusText = approved ? "Approved" : "Not Approved";
    const message = approved
        ? "Congratulations! Your SSAAM account has been approved. You can now login to your account using your Student ID and your Last Name as the temporary password. You may change your password anytime in the Dashboard settings."
        : `Unfortunately, your account registration was not approved.${rejectionReason ? ` Reason: ${sanitizeHtml(rejectionReason)}` : ''}`;

    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: subject,
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">SSAAM</h1>
                        <p style="color: white; opacity: 0.9; margin: 5px 0 0 0;">Student School Activities Attendance Monitoring</p>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${sanitizeHtml(studentName)}!</h2>
                        <div style="background: white; border: 2px solid ${statusColor}; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; color: ${statusColor};">Account ${statusText}</span>
                        </div>
                        <p style="color: #4b5563;">${message}</p>
                        ${approved ? `
                        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 15px 0;">
                            <p style="color: #92400e; margin: 0; font-weight: bold;">Important:</p>
                            <p style="color: #92400e; margin: 5px 0 0 0;">Your temporary password is your <strong>Last Name</strong> (in uppercase). You can change it anytime from your Dashboard settings.</p>
                        </div>
                        <p style="color: #4b5563;">Login at: <a href="https://ssaam.vercel.app" style="color: #7c3aed;">ssaam.vercel.app</a></p>` : ''}
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                    </div>
                </div>
            `
    };

    return emailService.sendMail(mailOptions);
}

async function sendRFIDVerificationEmail(toEmail, studentName, rfidCode, verifiedBy) {
    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: "SSAAM RFID Verified - Your Attendance Card is Now Active!",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">SSAAM</h1>
                        <p style="color: white; opacity: 0.9; margin: 5px 0 0 0;">Student School Activities Attendance Monitoring</p>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${sanitizeHtml(studentName)}!</h2>
                        <div style="background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; color: #10b981;">RFID Verified!</span>
                        </div>
                        <p style="color: #4b5563;">Great news! Your RFID attendance card has been verified and is now active.</p>
                        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="color: #6b7280; margin: 5px 0;"><strong>RFID Code:</strong> ${sanitizeHtml(rfidCode)}</p>
                            <p style="color: #6b7280; margin: 5px 0;"><strong>Verified By:</strong> ${sanitizeHtml(verifiedBy)}</p>
                            <p style="color: #6b7280; margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <p style="color: #4b5563;">You can now use your RFID card to log your attendance at school activities.</p>
                        <p style="color: #4b5563;">Check your status at: <a href="https://ssaam.vercel.app" style="color: #7c3aed;">ssaam.vercel.app</a></p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                    </div>
                </div>
            `
    };

    return emailService.sendMail(mailOptions);
}

const KNOWN_CRYPTO_KEYS = [];

function decodeTimestampWithKey(encodedString, key) {
    try {
        const decoded = Buffer.from(encodedString, 'base64').toString('binary');
        let timestamp = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            timestamp += String.fromCharCode(charCode);
        }
        return timestamp;
    } catch (e) {
        return null;
    }
}

function decodeTimestamp(encodedString) {
    // Try the configured env key first
    const keysToTry = [SSAAM_CRYPTO_KEY, ...KNOWN_CRYPTO_KEYS.filter(k => k !== SSAAM_CRYPTO_KEY)];
    for (const key of keysToTry) {
        if (!key) continue;
        const ts = decodeTimestampWithKey(encodedString, key);
        if (ts && !isNaN(new Date(ts).getTime())) return ts;
    }
    return null;
}

function isValidTimestamp(encodedString, maxAgeMinutes = 30) {
    const timestamp = decodeTimestamp(encodedString);
    if (!timestamp) return false;

    try {
        const requestTime = new Date(timestamp);
        const now = new Date();
        const diffMinutes = (now - requestTime) / (1000 * 60);

        // Allow up to 10 min in the future (client clock ahead) and maxAgeMinutes behind.
        // Wider window handles phones with automatic-time drift or slow networks.
        return diffMinutes >= -10 && diffMinutes <= maxAgeMinutes;
    } catch (e) {
        return false;
    }
}

function timestampAuth(req, res, next) {
    const ssaamTs = req.body?._ssaam_access_token || req.query?._ssaam_access_token || req.headers['x-ssaam-ts'];

    if (!ssaamTs) {
        return res.status(401).json({ message: "Unauthorized: Missing timestamp" });
    }

    if (!isValidTimestamp(ssaamTs)) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired timestamp" });
    }

    if (req.body?._ssaam_access_token) {
        delete req.body._ssaam_access_token;
    }

    next();
}

const REGISTRATION_COOLDOWN_MS = 60000;

async function antiBotProtection(req, res, next) {
    const userAgent = req.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
        return res.status(403).json({ message: "Forbidden: Invalid request source" });
    }

    const botPatterns = /bot|crawler|spider|scraper|curl|wget|python-requests|postman|insomnia|httpie/i;
    if (botPatterns.test(userAgent)) {
        return res.status(403).json({ message: "Forbidden: Automated requests not allowed" });
    }

    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        'unknown';

    const studentId = req.body?.student_id || 'unknown';
    const key = `${clientIP}:${studentId}`;
    const now = Date.now();

    try {
        const doc = await RateLimit.findOne({ key, type: 'reg' }).lean();
        if (doc && (now - doc.lastAttempt.getTime()) < REGISTRATION_COOLDOWN_MS) {
            const remainingSeconds = Math.ceil((REGISTRATION_COOLDOWN_MS - (now - doc.lastAttempt.getTime())) / 1000);
            return res.status(429).json({
                message: `Too many registration attempts. Please wait ${remainingSeconds} seconds before trying again.`
            });
        }
        await RateLimit.findOneAndUpdate(
            { key, type: 'reg' },
            { $set: { lastAttempt: new Date(now), count: 1, firstAttempt: new Date(now), expireAt: new Date(now + REGISTRATION_COOLDOWN_MS * 2) } },
            { upsert: true }
        );
    } catch (err) {
        console.error('[RateLimit] antiBotProtection DB error:', err.message);
        // fail open — never block legitimate users due to DB errors
    }

    next();
}

// Add contribution to student
app.post('/apis/admin/contributions', async (req, res) => {
    try {
        const { student_id, rfid_code, amount, description, admin_username } = req.body;

        let query = {};
        if (student_id) query.student_id = student_id;
        else if (rfid_code) query.rfid_code = rfid_code;
        else return res.status(400).json({ message: "Student ID or RFID required" });

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const student = await StudentModel.findOne(query);
        if (!student) return res.status(404).json({ message: "Student not found" });

        student.contributions.push({
            amount: Number(amount),
            description,
            collected_by: admin_username,
            date: new Date()
        });

        await student.save();
        res.json({ success: true, message: "Contribution added successfully", student });
    } catch (err) {
        internalError(res, err);
    }
});

// Get all contributions for transparency
app.get('/apis/contributions/transparency', async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const students = await StudentModel.find({ "contributions.0": { $exists: true } }, 'full_name first_name last_name program year_level contributions');

        const allContributions = students.map(s => ({
            name: s.full_name || `${s.first_name} ${s.last_name}`,
            program: s.program,
            year_level: s.year_level,
            payments: s.contributions.map(c => ({
                amount: c.amount,
                description: c.description,
                date: c.date
            }))
        }));

        res.json({ success: true, data: allContributions });
    } catch (err) {
        internalError(res, err);
    }
});

// ==================== PAYMENT ENDPOINTS ====================

// Create new payment
app.post('/apis/payments', auth, async (req, res) => {
    try {
        const { title, description, type, amount_due, deadline, target_year_levels, target_programs } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Payment title is required' });
        }
        if (!amount_due || Number(amount_due) <= 0) {
            return res.status(400).json({ message: 'A valid amount greater than 0 is required' });
        }

        // Get creator identifier - could be admin (master) or treasurer (student)
        const createdBy = req.master?.username || req.master?.id || req.student?.student_id || 'admin';

        // Use college-specific Payment model (consistent with all other payment routes)
        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);

        const payment = new PaymentModel({
            title: title.trim(),
            description: description ? description.trim() : '',
            type: type || 'fee',
            amount_due: Number(amount_due),
            deadline: deadline || null,
            created_by: createdBy,
            target_year_levels: Array.isArray(target_year_levels) ? target_year_levels : [],
            target_programs:    Array.isArray(target_programs)    ? target_programs    : [],
        });

        await payment.save();

        logAudit(req.college, req.master, 'PAYMENT_CREATED', 'Payment', payment._id, payment.title, { amount_due: payment.amount_due, type: payment.type }).catch(() => {});

        // Respond immediately so the UI doesn't hang — student assignment runs in the background
        res.json({ success: true, data: payment, message: 'Payment created and records initialized' });

        // Background: assign payment campaign to all approved students (fire-and-forget)
        const college = req.college;
        setImmediate(async () => {
            try {
                const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, college);
                const studentQuery = { status: 'approved' };
                if (payment.target_year_levels && payment.target_year_levels.length > 0)
                    studentQuery.year_level = { $in: payment.target_year_levels };
                if (payment.target_programs && payment.target_programs.length > 0)
                    studentQuery.program = { $in: payment.target_programs };
                const students = await StudentModel.find(studentQuery).lean();

                const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, college);
                if (students.length === 0) return;

                const now = new Date();
                const campaignEntry = {
                    payment_id: payment._id,
                    payment_status: 'pending',
                    created_at: now,
                    updated_at: now
                };

                const existingRecords = await PaymentRecordModel.find(
                    { student_id: { $in: students.map(s => s.student_id) } },
                    { student_id: 1 }
                ).lean();
                const existingIds = new Set(existingRecords.map(r => r.student_id));

                const bulkOps = students.map(student => {
                    if (existingIds.has(student.student_id)) {
                        return {
                            updateOne: {
                                filter: { student_id: student.student_id },
                                update: {
                                    $push: { campaigns: campaignEntry },
                                    $inc: { total_campaigns: 1 },
                                    $set: { updated_at: now }
                                }
                            }
                        };
                    } else {
                        return {
                            insertOne: {
                                document: {
                                    student_id: student.student_id,
                                    student_id_number: student.student_id,
                                    student_name: student.full_name || `${student.first_name} ${student.last_name}`,
                                    program: student.program,
                                    year_level: student.year_level,
                                    campaigns: [campaignEntry],
                                    total_campaigns: 1,
                                    created_at: now,
                                    updated_at: now
                                }
                            }
                        };
                    }
                });

                await PaymentRecordModel.bulkWrite(bulkOps, { ordered: false });
                console.log(`[payments] Background assignment done for "${payment.title}": ${students.length} students updated`);
            } catch (bgErr) {
                console.error('[payments] Background student assignment failed:', bgErr.message);
            }
        });
    } catch (err) {
        console.error('Error creating payment:', err);
        internalError(res, err);
    }
});

// Edit/update a payment event
app.patch('/apis/payments/:paymentId', auth, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { title, description, type, amount_due, deadline, status, target_year_levels, target_programs } = req.body;

        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const payment = await PaymentModel.findById(paymentId);
        if (!payment) return res.status(404).json({ message: 'Payment event not found' });

        if (title      !== undefined) payment.title       = title.trim();
        if (description !== undefined) payment.description = description.trim();
        if (type       !== undefined) payment.type        = type;
        if (amount_due !== undefined) payment.amount_due  = Number(amount_due);
        if (deadline   !== undefined) payment.deadline    = deadline || null;
        if (status     !== undefined) payment.status      = status;
        if (target_year_levels !== undefined) payment.target_year_levels = Array.isArray(target_year_levels) ? target_year_levels : [];
        if (target_programs    !== undefined) payment.target_programs    = Array.isArray(target_programs)    ? target_programs    : [];
        payment.updated_at = new Date();

        await payment.save();
        res.json({ success: true, data: payment, message: 'Payment event updated' });
    } catch (err) {
        console.error('Error updating payment:', err);
        internalError(res, err);
    }
});

// Get all payments
app.get('/apis/payments', auth, async (req, res) => {
    try {
        // Auto-fix any corrupted student IDs on each fetch (college-aware)
        await autoFixStudentIds(req.college);

        const { status } = req.query;
        const query = status ? { status } : {};

        // Filter out invalid payments: amount_due 0, empty title, "Unknown Payment"
        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const payments = await PaymentModel.find({
            ...query,
            amount_due: { $gt: 0 },
            title: { $ne: '', $regex: /^.+$/, $not: /^Unknown Payment$/i }
        }).sort({ created_at: -1 });

        // Get all records once for efficiency (college-aware)
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const allRecords = await PaymentRecordModel.find({});

        // Get all students for enrichment (college-aware)
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        // Get all students for enrichment
        const allStudents = await StudentModel.find({}, 'student_id program year_level');
        const studentMap = {};
        for (const student of allStudents) {
            if (student.student_id) {
                studentMap[student.student_id] = {
                    program: student.program || '',
                    year_level: student.year_level || ''
                };
            }
        }

        // Get statistics and records for each payment
        const paymentsWithStats = payments.map((payment) => {
            const paymentRecords = [];
            let paid = 0, unpaid = 0, pending = 0;

            for (const record of allRecords) {
                const campaign = record.campaigns.find(c => c.payment_id.toString() === payment._id.toString());
                if (campaign) {
                    // Enrich with latest student data
                    const studentData = studentMap[record.student_id] || {};
                    const program = studentData.program || record.program || 'N/A';
                    const year_level = studentData.year_level || record.year_level || 'N/A';

                    paymentRecords.push({
                        _id: record._id,
                        student_id: record.student_id,
                        student_id_number: record.student_id_number || record.student_id,
                        student_name: record.student_name,
                        program: program,
                        year_level: year_level,
                        payment_status: campaign.payment_status,
                        is_paid: campaign.payment_status === 'paid',
                        paid_by_treasurer: campaign.paid_by_treasurer || null,
                        marked_by_first_name: campaign.marked_by_first_name || null,
                        paid_date: campaign.paid_at || null,
                        amount_paid: campaign.amount_paid || 0,
                        notes: campaign.notes || '',
                        // Include discount fields from campaign
                        discount_type: campaign.discount_type || '',
                        discount_percentage: campaign.discount_percentage || 0,
                        discount_fixed_amount: campaign.discount_fixed_amount || 0,
                        discount_reason: campaign.discount_reason || '',
                        discount_applied_at: campaign.discount_applied_at || null,
                        discount_applied_by: campaign.discount_applied_by || null
                    });

                    if (campaign.payment_status === 'paid') paid++;
                    else if (campaign.payment_status === 'unpaid') unpaid++;
                    else if (campaign.payment_status === 'pending') pending++;
                }
            }

            const totalUnpaid = unpaid + pending;
            const total = paymentRecords.length;

            return {
                ...payment.toObject(),
                payment_records: paymentRecords,
                stats: {
                    total_students: total,
                    paid_count: paid,
                    unpaid_count: totalUnpaid,
                    pending_count: pending,
                    completion_percentage: total > 0 ? Math.round((paid / total) * 100) : 0
                }
            };
        });

        res.json({ success: true, data: paymentsWithStats });
    } catch (err) {
        console.error('Error fetching payments:', err);
        internalError(res, err);
    }
});

// Auto-fix function for student IDs (college-aware)
const autoFixStudentIds = async (college) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, college || 'CCS');
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, college || 'CCS');
        const records = await PaymentRecordModel.find({});
        let fixedCount = 0;
        let corruptedCount = 0;

        for (const record of records) {
            // Check if student_id looks like an ObjectId (24 hex characters)
            if (record.student_id && /^[0-9a-f]{24}$/.test(record.student_id)) {
                corruptedCount++;
                // Try to find the student by this ObjectId
                const student = await StudentModel.findById(record.student_id);
                if (student && student.student_id) {
                    // Update the record with the correct student ID
                    record.student_id = student.student_id;
                    await record.save();
                    fixedCount++;
                    console.log(`[AUTO-FIX] Fixed student: ${student.name} (${student.student_id})`);
                } else {
                    console.log(`[AUTO-FIX] Could not find student for ObjectId: ${record.student_id}, student name: ${record.student_name}`);
                }
            }
        }

        if (fixedCount > 0 || corruptedCount > 0) {
            console.log(`[AUTO-FIX] Summary - Found ${corruptedCount} corrupted IDs, fixed ${fixedCount}`);
        }
    } catch (err) {
        console.error('[AUTO-FIX ERROR]', err.message);
    }
};

// Migrate old student IDs (ObjectId) to proper student IDs (like 25-A-XXXXX)
app.post('/apis/payments/migrate/fix-student-ids', auth, async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const records = await PaymentRecordModel.find({});
        let fixedCount = 0;

        for (const record of records) {
            // Check if student_id looks like an ObjectId (24 hex characters)
            if (record.student_id && /^[0-9a-f]{24}$/.test(record.student_id)) {
                // Try to find the student by this ObjectId
                const student = await StudentModel.findById(record.student_id);
                if (student && student.student_id) {
                    // Update the record with the correct student ID
                    record.student_id = student.student_id;
                    await record.save();
                    fixedCount++;
                }
            }
        }

        res.json({ success: true, message: `Fixed ${fixedCount} payment records with correct student IDs` });
    } catch (err) {
        internalError(res, err);
    }
});
// Get payment details with student records
app.get('/apis/payments/:id', auth, async (req, res) => {
    try {
        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const payment = await PaymentModel.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Get all consolidated records and extract this payment's data (college-aware)
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const allRecords = await PaymentRecordModel.find({});

        // Get all students for enrichment (college-aware)
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        // Get all students for enrichment
        const allStudents = await StudentModel.find({}, 'student_id program year_level');
        const studentMap = {};
        for (const student of allStudents) {
            if (student.student_id) {
                studentMap[student.student_id] = {
                    program: student.program || '',
                    year_level: student.year_level || ''
                };
            }
        }

        const paymentRecords = [];
        let paid = 0, unpaid = 0, pending = 0;

        for (const record of allRecords) {
            const campaign = record.campaigns.find(c => c.payment_id.toString() === payment._id.toString());
            if (campaign) {
                // Enrich with latest student data
                const studentData = studentMap[record.student_id] || {};
                const program = studentData.program || record.program || 'N/A';
                const year_level = studentData.year_level || record.year_level || 'N/A';

                paymentRecords.push({
                    _id: record._id,
                    student_id: record.student_id,
                    student_name: record.student_name,
                    program: program,
                    year_level: year_level,
                    payment_status: campaign.payment_status,
                    is_paid: campaign.payment_status === 'paid',
                    paid_by_treasurer: campaign.paid_by_treasurer || null,
                    paid_date: campaign.paid_at || null,
                    amount_paid: campaign.amount_paid || 0,
                    notes: campaign.notes || '',
                    // Include discount fields from campaign
                    discount_type: campaign.discount_type || '',
                    discount_percentage: campaign.discount_percentage || 0,
                    discount_fixed_amount: campaign.discount_fixed_amount || 0,
                    discount_reason: campaign.discount_reason || '',
                    discount_applied_at: campaign.discount_applied_at || null,
                    discount_applied_by: campaign.discount_applied_by || null
                });

                if (campaign.payment_status === 'paid') paid++;
                else if (campaign.payment_status === 'unpaid') unpaid++;
                else if (campaign.payment_status === 'pending') pending++;
            }
        }

        const totalUnpaid = unpaid + pending;

        res.json({
            success: true,
            data: {
                ...payment.toObject(),
                payment_records: paymentRecords,
                stats: {
                    total_students: paymentRecords.length,
                    paid_count: paid,
                    unpaid_count: totalUnpaid,
                    pending_count: pending,
                    completion_percentage: paymentRecords.length > 0 ? Math.round((paid / paymentRecords.length) * 100) : 0
                }
            }
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Mark student as paid using RFID or Student ID
app.put('/apis/payments/:paymentId/mark-paid', auth, async (req, res) => {
    try {
        const { student_id_input, amount_paid, notes, payment_method } = req.body;
        const { paymentId } = req.params;

        if (!student_id_input) {
            return res.status(400).json({ message: 'Student ID or RFID is required' });
        }

        // Find student by student_id or rfid_code
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const student = await StudentModel.findOne({
            $or: [
                { student_id: student_id_input },
                { rfid_code: student_id_input }
            ]
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Fetch campaign title for audit log
        const MarkPaidPaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const markPaidCampaign = await MarkPaidPaymentModel.findById(paymentId).lean().catch(() => null);
        const payment_campaign_title_paid = markPaidCampaign?.title || paymentId;

        // Find or create consolidated payment record (college-aware)
        const CollegePaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        let paymentRecord = await CollegePaymentRecordModel.findOne({ student_id: student.student_id });

        if (!paymentRecord) {
            paymentRecord = new CollegePaymentRecordModel({
                student_id: student.student_id,
                student_id_number: student.student_id,
                student_name: student.full_name || `${student.first_name} ${student.last_name}`,
                program: student.program || '',
                year_level: student.year_level || '',
                campaigns: []
            });
        } else {
            // Always update program and year_level to latest student info
            paymentRecord.program = student.program || paymentRecord.program || '';
            paymentRecord.year_level = student.year_level || paymentRecord.year_level || '';
            paymentRecord.student_name = student.full_name || `${student.first_name} ${student.last_name}`;
        }

        // Check if campaign already exists
        const campaignIndex = paymentRecord.campaigns.findIndex(c => c.payment_id.toString() === paymentId);

        // If already paid, return error instead of overwriting
        if (campaignIndex >= 0 && paymentRecord.campaigns[campaignIndex].payment_status === 'paid') {
            return res.status(400).json({
                message: `${student.first_name} ${student.last_name} is already marked as paid for this payment campaign`,
                alreadyPaid: true,
                paidAt: paymentRecord.campaigns[campaignIndex].paid_at,
                paidBy: paymentRecord.campaigns[campaignIndex].paid_by_treasurer
            });
        }

        const campaignData = {
            payment_id: paymentId,
            payment_status: 'paid',
            amount_paid: amount_paid || 0,
            paid_at: new Date(),
            paid_by_treasurer: req.master?.username || req.student?.student_id || 'admin',
            notes: notes || '',
            payment_method: payment_method || null,
            created_at: campaignIndex >= 0 ? paymentRecord.campaigns[campaignIndex].created_at : new Date(),
            updated_at: new Date()
        };

        if (campaignIndex >= 0) {
            // Update existing campaign (from unpaid/pending to paid)
            paymentRecord.campaigns[campaignIndex] = campaignData;
        } else {
            // Add new campaign
            paymentRecord.campaigns.push(campaignData);
        }

        // Drop any pre-existing orphan campaigns that have a missing/null
        // payment_id — those would otherwise fail required-field validation
        // (e.g. "campaigns.N.payment_id is required") and block this save.
        paymentRecord.campaigns = paymentRecord.campaigns.filter(c => c && c.payment_id);

        // Update summary fields
        paymentRecord.total_campaigns = paymentRecord.campaigns.length;
        paymentRecord.campaigns_paid = paymentRecord.campaigns.filter(c => c.payment_status === 'paid').length;
        paymentRecord.total_amount_paid = paymentRecord.campaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
        paymentRecord.last_payment_at = paymentRecord.campaigns
            .filter(c => c.paid_at)
            .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
        paymentRecord.updated_at = new Date();

        await paymentRecord.save();

        logAudit(req.college, req.master, 'PAYMENT_MARKED_PAID', 'PaymentRecord', paymentId, payment_campaign_title_paid, { student_name: student.full_name || student.student_id, student_id: student.student_id, amount_paid: amount_paid || 0, payment_method: payment_method || null, notes: notes || null }).catch(() => {});

        res.json({
            success: true,
            message: `${student.full_name || student.student_id} marked as paid`,
            data: paymentRecord
        });
    } catch (err) {
        console.error('Error marking payment:', err);
        internalError(res, err);
    }
});

// Mark student as unpaid
app.put('/apis/payments/:paymentId/mark-unpaid', auth, async (req, res) => {
    try {
        const { student_id_input } = req.body;
        const { paymentId } = req.params;

        if (!student_id_input) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const student = await StudentModel.findOne({
            $or: [
                { student_id: student_id_input },
                { rfid_code: student_id_input }
            ]
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Use the college-specific PaymentRecord collection (same as mark-paid).
        // Without this, students in CCS/COE/SOM/CNAHS collections were missed
        // and the endpoint returned "Campaign not found for this student".
        const CollegePaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const paymentRecord = await CollegePaymentRecordModel.findOne({ student_id: student.student_id });

        if (!paymentRecord) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        // Always update program and year_level to latest student info
        paymentRecord.program = student.program || paymentRecord.program || '';
        paymentRecord.year_level = student.year_level || paymentRecord.year_level || '';
        paymentRecord.student_name = student.full_name || `${student.first_name} ${student.last_name}`;

        // Find and update campaign (defensive `?.toString()` in case payment_id is null)
        const campaignIndex = paymentRecord.campaigns.findIndex(
            c => c && c.payment_id && c.payment_id.toString() === String(paymentId)
        );

        if (campaignIndex < 0) {
            return res.status(404).json({ message: 'Campaign not found for this student' });
        }

        paymentRecord.campaigns[campaignIndex] = {
            ...paymentRecord.campaigns[campaignIndex],
            payment_status: 'unpaid',
            paid_at: null,
            amount_paid: 0,
            paid_by_treasurer: null,
            updated_at: new Date()
        };

        // Drop any pre-existing orphan campaigns that have a missing/null
        // payment_id — those would otherwise fail required-field validation
        // (e.g. "campaigns.N.payment_id is required") and block this save.
        paymentRecord.campaigns = paymentRecord.campaigns.filter(c => c && c.payment_id);

        // Update summary fields
        paymentRecord.total_campaigns = paymentRecord.campaigns.length;
        paymentRecord.campaigns_paid = paymentRecord.campaigns.filter(c => c.payment_status === 'paid').length;
        paymentRecord.total_amount_paid = paymentRecord.campaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
        paymentRecord.last_payment_at = paymentRecord.campaigns
            .filter(c => c.paid_at)
            .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
        paymentRecord.updated_at = new Date();

        await paymentRecord.save();

        logAudit(req.college, req.master, 'PAYMENT_MARKED_UNPAID', 'PaymentRecord', paymentId, paymentId, { student_name: student.full_name || student.student_id, student_id: student.student_id }).catch(() => {});

        res.json({
            success: true,
            message: `${student.full_name || student.student_id} marked as unpaid`,
            data: paymentRecord
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Get student's payment status for a specific payment
app.get('/apis/payments/:paymentId/student/:studentId', async (req, res) => {
    try {
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, getCollegeFromRequest(req));
        const paymentRecord = await PaymentRecordModel.findOne({
            payment_id: req.params.paymentId,
            student_id: req.params.studentId
        });

        if (!paymentRecord) {
            return res.json({
                success: true,
                data: { payment_status: 'unpaid', message: 'No record found' }
            });
        }

        res.json({ success: true, data: paymentRecord });
    } catch (err) {
        internalError(res, err);
    }
});

// Apply discount to payment record
app.put('/apis/payments/:paymentId/apply-discount', auth, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { studentId, discountType, discountPercentage, discountFixedAmount, discountReason } = req.body;
        const adminUser = req.user; // From auth middleware

        // Validate input
        if (!paymentId || !studentId) {
            return res.status(400).json({ message: 'Payment ID and Student ID are required' });
        }

        const dType = discountType || 'percentage';

        // Validate discount based on type
        if (dType === 'percentage') {
            const discountPct = parseFloat(discountPercentage) || 0;
            if (discountPct < 0 || discountPct > 100) {
                return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
            }
        } else if (dType === 'fixed') {
            const discountAmount = parseFloat(discountFixedAmount) || 0;
            if (discountAmount < 0) {
                return res.status(400).json({ message: 'Fixed discount amount cannot be negative' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid discount type. Use "percentage" or "fixed"' });
        }

        // Find the payment record (college-specific collection)
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const paymentRecord = await PaymentRecordModel.findOne({ student_id: studentId });
        if (!paymentRecord) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        // Find the campaign to update
        const campaign = paymentRecord.campaigns.find(c => c.payment_id.toString() === paymentId);
        if (!campaign) {
            return res.status(404).json({ message: 'Payment campaign not found for this student' });
        }

        // Update discount fields based on type
        campaign.discount_type = dType;
        if (dType === 'percentage') {
            campaign.discount_percentage = parseFloat(discountPercentage) || 0;
            campaign.discount_fixed_amount = 0; // Clear fixed amount
        } else {
            campaign.discount_fixed_amount = parseFloat(discountFixedAmount) || 0;
            campaign.discount_percentage = 0; // Clear percentage
        }
        campaign.discount_reason = discountReason || '';
        campaign.discount_applied_at = new Date();
        campaign.discount_applied_by = adminUser?.username || adminUser?.email || 'admin';
        campaign.updated_at = new Date();

        // Save the updated record
        await paymentRecord.save();

        res.status(200).json({
            message: 'Discount applied successfully',
            campaign: campaign
        });
    } catch (err) {
        console.error('Error applying discount:', err);
        internalError(res, err);
    }
});

// Update payment status (close/archive)
app.put('/apis/payments/:id', auth, async (req, res) => {
    try {
        const { status, description } = req.body;

        const update = {};
        if (status) update.status = status;
        if (description !== undefined) update.description = description;
        update.updated_at = new Date();

        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const payment = await PaymentModel.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ success: true, data: payment });
    } catch (err) {
        internalError(res, err);
    }
});

// Delete payment record for a student
app.delete('/apis/payments/:paymentId/student/:studentId', auth, async (req, res) => {
    try {
        const { paymentId, studentId } = req.params;

        // Find the consolidated payment record (college-aware)
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const paymentRecord = await PaymentRecordModel.findOne({ student_id: studentId });

        if (!paymentRecord) {
            return res.status(404).json({ message: 'Student record not found' });
        }

        // Find the campaign to remove
        const campaignIndex = paymentRecord.campaigns.findIndex(c => c.payment_id.toString() === paymentId);

        if (campaignIndex < 0) {
            return res.status(404).json({ message: 'Payment campaign not found for this student' });
        }

        const campaign = paymentRecord.campaigns[campaignIndex];
        const amount = campaign.amount_paid || 0;

        // Remove the campaign
        paymentRecord.campaigns.splice(campaignIndex, 1);

        // Update summary fields
        paymentRecord.total_campaigns = paymentRecord.campaigns.length;
        paymentRecord.campaigns_paid = paymentRecord.campaigns.filter(c => c.payment_status === 'paid').length;
        paymentRecord.total_amount_paid = paymentRecord.campaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
        paymentRecord.last_payment_at = paymentRecord.campaigns
            .filter(c => c.paid_at)
            .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
        paymentRecord.updated_at = new Date();

        await paymentRecord.save();

        logAudit(req.college, req.master, 'PAYMENT_STUDENT_REMOVED', 'PaymentRecord', paymentId, paymentId, { student_name: paymentRecord.student_name, student_id: studentId, amount_removed: amount }).catch(() => {});

        res.json({
            success: true,
            message: `Deleted payment campaign for ${paymentRecord.student_name}`,
            data: {
                student_name: paymentRecord.student_name,
                amount: amount,
                payment_id: paymentId,
                student_id: studentId
            }
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Delete entire payment campaign
app.delete('/apis/payments/:paymentId', auth, async (req, res) => {
    try {
        const { paymentId } = req.params;

        // Find the payment campaign
        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const payment = await PaymentModel.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ message: 'Payment campaign not found' });
        }

        const paymentTitle = payment.title;

        // Remove this payment campaign from all consolidated records using a single bulk operation
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);

        // First, find only the records that actually have this campaign
        const affectedRecords = await PaymentRecordModel.find({
            'campaigns.payment_id': new mongoose.Types.ObjectId(paymentId)
        }).lean();

        let recordsModified = 0;
        if (affectedRecords.length > 0) {
            const bulkOps = affectedRecords.map(record => {
                const remaining = record.campaigns.filter(c => c.payment_id.toString() !== paymentId);
                const lastPaid = remaining
                    .filter(c => c.paid_at)
                    .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
                return {
                    updateOne: {
                        filter: { _id: record._id },
                        update: {
                            $set: {
                                campaigns: remaining,
                                total_campaigns: remaining.length,
                                campaigns_paid: remaining.filter(c => c.payment_status === 'paid').length,
                                total_amount_paid: remaining.reduce((sum, c) => sum + (c.amount_paid || 0), 0),
                                last_payment_at: lastPaid,
                                updated_at: new Date()
                            }
                        }
                    }
                };
            });
            await PaymentRecordModel.bulkWrite(bulkOps);
            recordsModified = affectedRecords.length;
        }

        // Delete the payment campaign itself (college-aware)
        await PaymentModel.deleteOne({ _id: paymentId });

        logAudit(req.college, req.master, 'PAYMENT_DELETED', 'Payment', paymentId, paymentTitle, { deleted_records_count: recordsModified }).catch(() => {});

        res.json({
            success: true,
            message: `Deleted payment campaign "${paymentTitle}" and removed from ${recordsModified} student records`,
            data: {
                payment_id: paymentId,
                payment_title: paymentTitle,
                deleted_records_count: recordsModified
            }
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Update payment campaign status (Active/Closed)
app.put('/apis/payments/:paymentId/status', auth, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { status } = req.body;

        // Validate status value
        if (!['active', 'closed', 'archived'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be "active", "closed", or "archived"'
            });
        }

        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const payment = await PaymentModel.findByIdAndUpdate(
            paymentId,
            {
                status: status,
                updated_at: new Date()
            },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment campaign not found' });
        }

        // When closing a campaign, convert all 'pending' campaigns to 'unpaid' for this payment (college-aware)
        if (status === 'closed') {
            const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
            const allRecords = await PaymentRecordModel.find({});
            for (const record of allRecords) {
                const campaignIndex = record.campaigns.findIndex(c =>
                    c.payment_id.toString() === paymentId && c.payment_status === 'pending'
                );
                if (campaignIndex >= 0) {
                    record.campaigns[campaignIndex].payment_status = 'unpaid';
                    record.campaigns[campaignIndex].updated_at = new Date();
                    record.updated_at = new Date();
                    await record.save();
                }
            }
        }

        // When reopening to active, convert 'unpaid' back to 'pending' for this payment
        if (status === 'active') {
            const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
            const allRecords = await PaymentRecordModel.find({});
            for (const record of allRecords) {
                const campaignIndex = record.campaigns.findIndex(c =>
                    c.payment_id.toString() === paymentId && c.payment_status === 'unpaid'
                );
                if (campaignIndex >= 0) {
                    record.campaigns[campaignIndex].payment_status = 'pending';
                    record.campaigns[campaignIndex].updated_at = new Date();
                    record.updated_at = new Date();
                    await record.save();
                }
            }
        }

        logAudit(req.college, req.master, 'PAYMENT_STATUS_UPDATED', 'Payment', paymentId, payment.title, { new_status: status }).catch(() => {});

        res.json({
            success: true,
            message: `Payment campaign status updated to "${status}"`,
            data: payment
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Sync payment campaign with all approved students (add missing students)
app.post('/apis/payments/:paymentId/sync-students', auth, async (req, res) => {
    try {
        const { paymentId } = req.params;

        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const payment = await PaymentModel.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment campaign not found' });
        }

        // Get all approved students
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const allApprovedStudents = await StudentModel.find({ status: 'approved' });

        let addedCount = 0;
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);

        // Sync: add campaign to all students who don't have it yet
        for (const student of allApprovedStudents) {
            let paymentRecord = await PaymentRecordModel.findOne({ student_id: student.student_id });

            if (!paymentRecord) {
                // Create new record with this campaign
                paymentRecord = new PaymentRecordModel({
                    student_id: student.student_id,
                    student_id_number: student.student_id,
                    student_name: student.full_name || `${student.first_name} ${student.last_name}`,
                    program: student.program,
                    year_level: student.year_level,
                    campaigns: [{
                        payment_id: paymentId,
                        payment_status: 'pending',
                        created_at: new Date(),
                        updated_at: new Date()
                    }],
                    total_campaigns: 1,
                    created_at: new Date(),
                    updated_at: new Date()
                });
                await paymentRecord.save();
                addedCount++;
            } else {
                // Check if student already has this campaign
                const hasCampaign = paymentRecord.campaigns.some(c => c.payment_id.toString() === paymentId);
                if (!hasCampaign) {
                    paymentRecord.campaigns.push({
                        payment_id: paymentId,
                        payment_status: 'pending',
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                    paymentRecord.total_campaigns = paymentRecord.campaigns.length;
                    paymentRecord.updated_at = new Date();
                    await paymentRecord.save();
                    addedCount++;
                }
            }
        }

        res.json({
            success: true,
            message: addedCount > 0
                ? `Added ${addedCount} missing students to payment campaign`
                : 'Payment campaign is already synced with all approved students',
            data: {
                added_count: addedCount,
                total_students: allApprovedStudents.length
            }
        });
    } catch (err) {
        internalError(res, err);
    }
});


// Get student's payment records (for student dashboard - shows their contribution receipts)
app.get('/apis/my-payments', auth, async (req, res) => {
    try {
        // Get student ID from the verified JWT token
        const studentId = req.master?.student_id;

        // If no student ID, return empty array (admin users don't have payment records)
        if (!studentId) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Find all payment records for this student (college-aware model)
        const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

        // Try to find by student_id string (common) or by ObjectId string (legacy)
        const possibleStudentIds = [studentId];
        if (req.master && req.master.id) possibleStudentIds.push(String(req.master.id));

        // Load the authenticated student's current year_level/program so we can
        // defensively filter out campaigns whose targeting no longer matches
        // (e.g. legacy campaigns assigned before targeting was introduced, or
        // campaigns later edited to target a different cohort).
        const studentDoc = await StudentModel.findOne({
            $or: possibleStudentIds.map(id => ({ student_id: id }))
        }).select('year_level program').lean();
        const studentYearLevel = studentDoc?.year_level || null;
        const studentProgram = studentDoc?.program || null;

        const paymentRecord = await PaymentRecordModel.findOne({
            $or: possibleStudentIds.map(id => ({ student_id: id }))
        }).populate({ path: 'campaigns.payment_id', model: PaymentModel, select: 'title description type amount_due deadline status created_at target_year_levels target_programs' });

        if (!paymentRecord) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Format the response as a receipt-style list from campaigns array
        // Filter out invalid payments: null payment_id, amount_due 0, empty title,
        // and campaigns whose targeting does not match this student's profile.
        const formattedRecords = paymentRecord.campaigns
            .filter(campaign => {
                const payment = campaign.payment_id;
                // Only include if payment exists, has amount_due > 0, and has a valid title
                if (!payment ||
                    !(payment.amount_due > 0) ||
                    !payment.title ||
                    !payment.title.trim() ||
                    payment.title.toLowerCase() === 'unknown payment') {
                    return false;
                }

                // Defensive targeting filter: when a campaign restricts year levels
                // or programs, exclude it for students who do not match. An empty
                // / missing targeting array means "all students" and is allowed.
                const targetYears = Array.isArray(payment.target_year_levels) ? payment.target_year_levels : [];
                if (targetYears.length > 0 && studentYearLevel && !targetYears.includes(studentYearLevel)) {
                    return false;
                }
                const targetPrograms = Array.isArray(payment.target_programs) ? payment.target_programs : [];
                if (targetPrograms.length > 0 && studentProgram && !targetPrograms.includes(studentProgram)) {
                    return false;
                }

                return true;
            })
            .map(campaign => ({
                _id: campaign._id,
                title: campaign.payment_id?.title || 'Unknown Payment',
                description: campaign.payment_id?.description || '',
                type: campaign.payment_id?.type || 'fee',
                amount_due: campaign.payment_id?.amount_due || 0,
                deadline: campaign.payment_id?.deadline,
                is_paid: campaign.payment_status === 'paid',
                payment_status: campaign.payment_status,
                paid_date: campaign.paid_at,
                amount_paid: campaign.amount_paid || 0,
                payment_method: campaign.payment_method,
                notes: campaign.notes,
                created_at: campaign.created_at,
                // Include discount fields from campaign
                discount_type: campaign.discount_type || '',
                discount_percentage: campaign.discount_percentage || 0,
                discount_fixed_amount: campaign.discount_fixed_amount || 0,
                discount_reason: campaign.discount_reason || '',
                discount_applied_at: campaign.discount_applied_at || null,
                discount_applied_by: campaign.discount_applied_by || null
            }));

        // Sort by date, most recent first
        formattedRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({
            success: true,
            data: formattedRecords
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Note: using main mongoose connection (single database for all colleges) via getConnectionByType()

// Function to get connection (simplified to single database)
// Always uses the main mongoose connection
async function getConnectionByType(type) {
    // If main connection is ready, return it
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // Otherwise, attempt to establish the main connection and return it
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            w: 'majority',
            maxIdleTimeMS: 60000,
            waitQueueTimeoutMS: 10000
        });
        console.log('Connected to main MongoDB via getConnectionByType');
        return mongoose.connection;
    } catch (err) {
        console.error('Failed to connect main mongoose connection in getConnectionByType:', err.message);
        throw err;
    }
}

const connectWithRetry = async (retryCount = 0, maxRetries = 10, retryDelay = 5000) => {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            w: 'majority',
            maxIdleTimeMS: 60000,
            waitQueueTimeoutMS: 10000
        });
        console.log('Connected to MongoDB Atlas');

        // Set up main connection error handling
        mongoose.connection.on('disconnected', () => {
            console.warn('Main MongoDB connection disconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Main MongoDB connection error:', err.message);
        });

        // On Vercel serverless, Vercel owns the HTTP layer — calling app.listen()
        // conflicts with it and causes the function to fail. Only call listen() in
        // the local/traditional server environment.
        if (process.env.VERCEL) {
            console.log('Server running on Vercel serverless');
            if (typeof autoUpdateEventStatuses === 'function') {
                autoUpdateEventStatuses();
            }
        } else {
            app.listen(PORT, () => {
                console.log(`Server running on ${PORT}`);
                if (typeof autoUpdateEventStatuses === 'function') {
                    autoUpdateEventStatuses();
                }
            });
        }
    } catch (err) {
        console.error(`MongoDB connection attempt ${retryCount + 1} failed:`, err.message);
        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => connectWithRetry(retryCount + 1, maxRetries, retryDelay), retryDelay);
        } else {
            console.error('Max retries reached. Could not connect to MongoDB.');
            // Don't process.exit() on Vercel — it terminates the Lambda before the
            // ensureDatabaseConnection middleware can attempt a per-request reconnect.
            if (!process.env.VERCEL) process.exit(1);
        }
    }
};

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

// Drop old problematic unique index on event_id + student_id when connection is fully open
// This allows students to attend multiple sessions of the same event
mongoose.connection.once('open', async () => {
    try {
        const db = mongoose.connection.db;
        if (db) {
            // Check and drop old unique index on both CCS and COE prefixed collections
            const prefixes = ['ccs_', 'coe_'];
            for (const prefix of prefixes) {
                try {
                    const collection = db.collection(prefix + 'attendancelogs');
                    const indexes = await collection.indexes();
                    const problematicIndex = indexes.find(idx =>
                        idx.name === 'event_id_1_student_id_1' && idx.unique === true
                    );
                    if (problematicIndex) {
                        await collection.dropIndex('event_id_1_student_id_1');
                        console.log(`Dropped old unique index event_id_1_student_id_1 on ${prefix}attendancelogs`);
                    }
                } catch (e) {
                    // Ignore missing collection/index errors, log others
                    if (e && e.code && (e.code === 26 || e.code === 27)) {
                        // NamespaceNotFound or IndexNotFound - fine
                    } else {
                        console.log(`Note: Index cleanup for ${prefix}attendancelogs status:`, e?.message || e);
                    }
                }
            }
        }
    } catch (indexErr) {
        // Index might not exist or already dropped, which is fine
        if (indexErr.code !== 27) { // 27 = IndexNotFound
            console.log('Note: Index cleanup status:', indexErr.message);
        }
    }
});

connectWithRetry();

// Mongoose plugin to apply collection prefixes based on req.college context
// This modifies collection names for all queries based on the current request's college
function collegeContextPlugin(schema, options) {
    // Store original collection name
    schema.set('_baseCollection', options._baseCollection);

    // Pre hook for all queries to apply collection prefix
    ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'countDocuments', 'distinct', 'aggregate'].forEach(method => {
        schema.pre(method, function () {
            // Note: This won't work because we don't have request context in schema pre-hooks
            // We'll use a different approach - override in handlers instead
        });
    });
}

// Alternative: Create a wrapper function to get models with correct collection
function getModelForCollege(baseModel, college, baseCollectionName) {
    const prefixedName = withPrefix(college, baseCollectionName);
    if (baseModel.collection.name !== prefixedName) {
        // Create a new mongoose model with the same schema but different collection name
        const schema = baseModel.schema;
        const key = `${college}_${baseModel.modelName}`;
        if (!modelCache[key]) {
            modelCache[key] = mongoose.model(key, schema, prefixedName);
        }
        return modelCache[key];
    }
    return baseModel;
}

const STUDENT_ID_REGEX = /^[0-9]{2}-[A-Z]-[0-9]{5}$/;
const UPPERCASE_ONLY_REGEX = /^[A-ZÑ\s'-]+$/;

// Helper function to get the correct model based on college
// Usage: const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, college);
// Supports CCS, COE, SOM, and CNAHS — SOM/CNAHS models are created on demand using the CCS schema
function getCollegeModel(baseModel, ccsModel, coeModel, college) {
    if (college === 'COE') return coeModel;
    if (college === 'SOM' || college === 'CNAHS') {
        // Use clean key: e.g. SOM_Student, CNAHS_Notification
        const modelBaseName = ccsModel.modelName.replace(/^CCS_/, '');
        const cleanKey = `${college}_${modelBaseName}`;
        if (mongoose.models[cleanKey]) return mongoose.models[cleanKey];
        // Fallback: dynamic creation using ccs collection name as template
        const legacyKey = `${college}_${ccsModel.modelName}`;
        if (!mongoose.models[legacyKey]) {
            const prefix = getPrefix(college);
            const ccsCollectionName = ccsModel.collection.name;
            const newCollectionName = ccsCollectionName.replace(/^ccs_/, prefix);
            mongoose.model(legacyKey, ccsModel.schema, newCollectionName);
        }
        return mongoose.models[legacyKey];
    }
    return ccsModel;
}

const sessionTokenSchema = new mongoose.Schema({
    token_hash: { type: String, required: true, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    user_type: { type: String, enum: ['student', 'master'], required: true },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
    is_revoked: { type: Boolean, default: false },
    last_used_at: { type: Date, default: Date.now }
});

sessionTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
sessionTokenSchema.index({ user_id: 1 });
sessionTokenSchema.index({ last_used_at: 1 });

const SessionToken = mongoose.model("SessionToken", sessionTokenSchema);
const CCS_SessionToken = mongoose.model("CCS_SessionToken", sessionTokenSchema, 'ccs_sessiontokens');
const COE_SessionToken = mongoose.model("COE_SessionToken", sessionTokenSchema, 'coe_sessiontokens');
const SOM_SessionToken = mongoose.model("SOM_SessionToken", sessionTokenSchema, 'som_sessiontokens');
const CNAHS_SessionToken = mongoose.model("CNAHS_SessionToken", sessionTokenSchema, 'cnahs_sessiontokens');
// ─── Audit Trail ──────────────────────────────────────────────────────────
const auditTrailSchema = new mongoose.Schema({
    admin_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
    admin_name:  { type: String, default: '' },
    admin_role:  { type: String, default: '' },
    action:      { type: String, required: true },
    target_type: { type: String, default: '' },
    target_id:   { type: String, default: '' },
    target_label:{ type: String, default: '' },
    details:     { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp:   { type: Date, default: Date.now }
});
auditTrailSchema.index({ timestamp: -1 });
auditTrailSchema.index({ admin_id: 1, timestamp: -1 });
// Auto-delete audit trail documents older than 30 days
auditTrailSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const AuditTrail      = mongoose.model('AuditTrail',       auditTrailSchema);
const CCS_AuditTrail  = mongoose.model('CCS_AuditTrail',   auditTrailSchema, 'ccs_audittrails');
const COE_AuditTrail  = mongoose.model('COE_AuditTrail',   auditTrailSchema, 'coe_audittrails');
const SOM_AuditTrail  = mongoose.model('SOM_AuditTrail',   auditTrailSchema, 'som_audittrails');
const CNAHS_AuditTrail= mongoose.model('CNAHS_AuditTrail', auditTrailSchema, 'cnahs_audittrails');

async function logAudit(college, master, action, target_type, target_id, target_label, details = {}) {
    try {
        // The auth middleware often sets req.master to the decoded JWT payload,
        // which only carries { id, username, email, isMaster } — no full_name or role.
        // Do a lightweight DB lookup so we always store accurate display data.
        let adminName = master?.full_name || master?.username || '';
        let adminRole = master?.role || '';
        const adminDbId = master?._id || master?.id;
        if (adminDbId && (!master?.full_name || !master?.role)) {
            try {
                const freshMaster = await Master.findById(adminDbId).select('full_name username role').lean();
                if (freshMaster) {
                    adminName = freshMaster.full_name || freshMaster.username || adminName;
                    adminRole = freshMaster.role || adminRole;
                }
            } catch (_) { /* non-fatal — fall back to what we already have */ }
        }
        const AuditModel = getCollegeModel(AuditTrail, CCS_AuditTrail, COE_AuditTrail, college);
        await AuditModel.create({
            admin_id:     adminDbId,
            admin_name:   adminName,
            admin_role:   adminRole,
            action,
            target_type,
            target_id:    String(target_id || ''),
            target_label: String(target_label || ''),
            details
        });
    } catch (e) {
        console.error('[Audit] log error:', e.message);
    }
}

// GET /apis/audit-trail — both co-admin and treasurer see all college logs
app.get('/apis/audit-trail', auth, async (req, res) => {
    try {
        const AuditModel = getCollegeModel(AuditTrail, CCS_AuditTrail, COE_AuditTrail, req.college);
        const logs = await AuditModel.find({}).sort({ timestamp: -1 }).limit(300).lean();

        // Enrich logs with admin profile data (photo, student_id/username)
        const uniqueAdminIds = [...new Set(logs.map(l => String(l.admin_id)).filter(Boolean))];
        let adminMap = {};
        if (uniqueAdminIds.length > 0) {
            const admins = await Master.find(
                { _id: { $in: uniqueAdminIds } },
                { _id: 1, photo: 1, username: 1, full_name: 1, role: 1 }
            ).lean();
            admins.forEach(a => {
                adminMap[String(a._id)] = {
                    admin_photo: a.photo || null,
                    admin_student_id: a.username || null,
                    admin_full_name: a.full_name || null,
                    admin_role: a.role || null,
                };
            });
        }

        const enrichedLogs = logs.map(log => ({
            ...log,
            ...(adminMap[String(log.admin_id)] || {}),
        }));

        res.json({ success: true, data: enrichedLogs });
    } catch (err) {
        internalError(res, err);
    }
});
// ─────────────────────────────────────────────────────────────────────────

const SESSION_INACTIVITY_MS = 12 * 60 * 60 * 1000;

async function cleanupInactiveSessionTokens() {
    try {
        const cutoffTime = new Date(Date.now() - SESSION_INACTIVITY_MS);
        const query = {
            $or: [
                { last_used_at: { $lt: cutoffTime } },
                { last_used_at: null, created_at: { $lt: cutoffTime } }
            ]
        };
        let totalDeleted = 0;
        for (const Model of [SessionToken, CCS_SessionToken, COE_SessionToken, SOM_SessionToken, CNAHS_SessionToken]) {
            const result = await Model.deleteMany(query);
            totalDeleted += result.deletedCount;
        }
        if (totalDeleted > 0) {
            console.log(`Cleaned up ${totalDeleted} inactive session tokens across all colleges`);
        }
    } catch (err) {
        console.error('Session token cleanup error:', err.message);
    }
}

setInterval(cleanupInactiveSessionTokens, 60 * 60 * 1000);

const studentSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        unique: true,
        match: [STUDENT_ID_REGEX, "Invalid student_id format. Required: 12-A-12345"]
    },
    rfid_code: { type: String, default: null },
    rfid_status: {
        type: String,
        enum: VALID_RFID_STATUS,
        default: "unverified"
    },
    rfid_verified_at: { type: Date, default: null },
    admin_verification_token: { type: String, default: null },
    full_name: { type: String },
    first_name: {
        type: String,
        required: [true, "First name is required"],
        validate: {
            validator: function (v) {
                return UPPERCASE_ONLY_REGEX.test(v) && v.length <= 64;
            },
            message: "First name must be uppercase letters only and max 64 characters"
        }
    },
    middle_name: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v || v === "") return true;
                return UPPERCASE_ONLY_REGEX.test(v) && v.length <= 64;
            },
            message: "Middle name must be uppercase letters only and max 64 characters"
        },
        default: ""
    },
    last_name: {
        type: String,
        required: [true, "Last name is required"],
        validate: {
            validator: function (v) {
                return UPPERCASE_ONLY_REGEX.test(v) && v.length <= 64;
            },
            message: "Last name must be uppercase letters only and max 64 characters"
        }
    },
    suffix: {
        type: String,
        enum: {
            values: VALID_SUFFIXES,
            message: "Invalid suffix. Allowed: Jr., Sr., I, II, III, IV, V, VI, VII, VIII, IX, X"
        },
        default: ""
    },
    year_level: {
        type: String,
        required: true,
        enum: {
            values: VALID_YEAR_LEVELS,
            message: "Year level must be one of: 1st Year, 2nd Year, 3rd Year, 4th Year, 5th Year"
        }
    },
    school_year: { type: String, required: false, default: null },
    program: {
        type: String,
        required: true,
        enum: {
            values: VALID_PROGRAMS,
            message: "Program must be one of: BSCS, BSIT, BSIS, or BSM"
        }
    },
    photo: { type: String },
    semester: {
        type: String,
        required: false,
        enum: {
            values: VALID_SEMESTERS,
            message: "Semester must be one of: 1st Sem, 2nd Sem"
        },
        default: null
    },
    email: { type: String },
    role: {
        type: String,
        enum: VALID_ROLES,
        default: "student"
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: "pending"
    },
    rejection_reason: { type: String, default: "" },
    created_date: { type: Date, default: Date.now },
    // Custom password field (optional) - if set, user uses this instead of last_name for login
    custom_password: { type: String, default: null },
    contributions: [{
        amount: { type: Number, required: true },
        description: { type: String, required: true },
        date: { type: Date, default: Date.now },
        collected_by: { type: String }
    }],
    // Optional facial recognition profiles for biometric attendance check-in.
    // Each entry holds a 128-float descriptor produced client-side by face-api.js
    // plus an optional photo and label. Students manage these themselves on
    // their own dashboard. We cap to 3 to keep the matching corpus small.
    face_descriptors: {
        type: [{
            label: { type: String, default: 'Face' },
            descriptor: { type: [Number], required: true },
            photo: { type: String, default: null },
            created_at: { type: Date, default: Date.now }
        }],
        default: []
    },
    // Tracks the last time the student enrolled or replaced their face.
    // Used by the weekly cooldown enforcement on `POST /apis/students/face`.
    face_updated_at: { type: Date, default: null }
});

// Pre-save middleware to auto-generate full_name from parts
// Use synchronous middleware (no `next`) to avoid runtime `next is not a function` errors
studentSchema.pre('save', function () {
    if (!this.full_name || this.full_name.trim() === '') {
        const parts = [this.first_name, this.middle_name, this.last_name, this.suffix]
            .filter(p => p && p.trim() !== '');
        this.full_name = parts.join(' ').replace(/\s+/g, ' ').trim();
    }
});

// Strip raw face_descriptors from generic Student JSON responses; the dedicated
// face endpoints are the only place they should ever leave the server.
studentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    if (Array.isArray(obj.face_descriptors)) {
        obj.face_descriptors_count = obj.face_descriptors.length;
        delete obj.face_descriptors;
    }
    return obj;
};

const Student = mongoose.model("Student", studentSchema);
const CCS_Student = mongoose.model("CCS_Student", studentSchema, 'ccs_students');
const COE_Student = mongoose.model("COE_Student", studentSchema, 'coe_students');
const SOM_Student = mongoose.model("SOM_Student", studentSchema, 'som_students');
const CNAHS_Student = mongoose.model("CNAHS_Student", studentSchema, 'cnahs_students');

const verificationCodeSchema = new mongoose.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    student_data: { type: Object, required: true },
    expires_at: { type: Date, required: true },
    created_at: { type: Date, default: Date.now }
});

verificationCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const VerificationCode = mongoose.model("VerificationCode", verificationCodeSchema);

const masterSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // 'administrator' is a legacy alias of 'admin' kept here so old records
    // (created before the enum was tightened) still validate. All
    // role-based checks elsewhere treat it the same as 'admin'.
    role: { type: String, enum: ['admin', 'administrator', 'co-admin', 'treasurer'], default: 'admin' },
    college: { type: String, enum: ['CCS', 'COE', 'SOM', 'CNAHS'], default: 'CCS' },
    full_name: { type: String, default: null },
    phone: { type: String, default: null },
    photo: { type: String, default: null },
    bio: { type: String, default: null },
    // Facial recognition profiles (super admin only). Each entry holds a 128-float
    // descriptor produced by face-api.js plus an optional photo and label so the UI
    // can preview the enrolled face. Co-admins/treasurers never read or write these.
    face_descriptors: {
        type: [{
            label: { type: String, default: 'Face' },
            descriptor: { type: [Number], required: true },
            photo: { type: String, default: null },
            created_at: { type: Date, default: Date.now }
        }],
        default: []
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

masterSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    // Never leak raw face descriptors through generic master responses; they must
    // only be served by the dedicated GET /apis/masters/face endpoint.
    if (Array.isArray(obj.face_descriptors)) {
        obj.face_descriptors_count = obj.face_descriptors.length;
        delete obj.face_descriptors;
    }
    return obj;
};

const Master = mongoose.model("Master", masterSchema);

// Export audit log — tracks who downloaded payment data, when, and with what filters.
const exportLogSchema = new mongoose.Schema({
    exported_by:   { type: String, default: 'Admin' },
    exported_at:   { type: Date,   default: Date.now },
    record_count:  { type: Number, default: 0 },
    format:        { type: String, default: 'xlsx' },
    payment_title: { type: String, default: '' },
    filters: {
        year_levels: { type: [String], default: [] },
        statuses:    { type: [String], default: [] },
        program:     { type: String,   default: '' }
    }
});

const ExportLog      = mongoose.model('ExportLog',      exportLogSchema);
const CCS_ExportLog  = mongoose.model('CCS_ExportLog',  exportLogSchema, 'ccs_exportlogs');
const COE_ExportLog  = mongoose.model('COE_ExportLog',  exportLogSchema, 'coe_exportlogs');

const settingsSchema = new mongoose.Schema({
    userRegister: {
        register: { type: Boolean, default: true },
        message: { type: String, default: "" }
    },
    userLogin: {
        login: { type: Boolean, default: true },
        message: { type: String, default: "" }
    },
    rfidScanner: {
        checkInEnabled: { type: Boolean, default: true },
        checkOutEnabled: { type: Boolean, default: false },
        autoDisableCheckIn: { type: Boolean, default: false },
        autoDisableCheckOut: { type: Boolean, default: false },
        checkInDisableAt: { type: Date, default: null },
        checkOutDisableAt: { type: Date, default: null },
        lateThresholdMinutes: { type: Number, default: 30 }
    },
    semester: { type: String, default: '1st Sem' },
    schoolYear: { type: String, default: '' }
});

const Settings = mongoose.model("Settings", settingsSchema, "settings");
const CCS_Settings = mongoose.model("CCS_Settings", settingsSchema, 'ccs_settings');
const COE_Settings = mongoose.model("COE_Settings", settingsSchema, 'coe_settings');
const SOM_Settings = mongoose.model("SOM_Settings", settingsSchema, 'som_settings');
const CNAHS_Settings = mongoose.model("CNAHS_Settings", settingsSchema, 'cnahs_settings');

// Password Reset Schema
const passwordResetSchema = new mongoose.Schema({
    student_id: { type: String, required: true },
    email: { type: String, required: true },
    code: { type: String, required: true }, // Stored hashed
    expires_at: { type: Date, required: true },
    used: { type: Boolean, default: false },
    used_at: { type: Date, default: null },
    attempts: { type: Number, default: 0 }, // Verification attempts
    verified: { type: Boolean, default: false },
    verified_at: { type: Date, default: null },
    reset_token: { type: String, default: null }, // Stored hashed
    created_at: { type: Date, default: Date.now }
});

passwordResetSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
passwordResetSchema.index({ student_id: 1 });

const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);



// ── Student Change Requests ──────────────────────────────────────────────────
// Single global collection with a `college` field so super-admin can query
// across all colleges and co-admins can filter to their own.
const changeRequestSchema = new mongoose.Schema({
    student_id:   { type: String, required: true },
    student_name: { type: String, default: '' },
    college:      { type: String, required: true },
    type:         { type: String, enum: ['name', 'department'], required: true },
    new_value:    { type: String, required: true },
    first_name:   { type: String, default: '' },
    middle_name:  { type: String, default: '' },
    last_name:    { type: String, default: '' },
    suffix:       { type: String, default: '' },
    reason:       { type: String, required: true, maxlength: 500 },
    status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    admin_note:   { type: String, default: '' },
    reviewed_by:  { type: String, default: '' },
    reviewed_at:  { type: Date, default: null },
    created_at:   { type: Date, default: Date.now }
});
const ChangeRequest = mongoose.model('ChangeRequest', changeRequestSchema, 'change_requests');
// ────────────────────────────────────────────────────────────────────────────


// ==================== ATTENDANCE SCHEMAS ====================

// Attendance Event Schema - Container/Folder for attendance sessions
// An event can contain multiple sessions (Morning, Afternoon, Noon, Night, Dawn)
const attendanceEventSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 2000, default: "" },
    location: { type: String, maxlength: 200, default: "" },
    event_date: { type: Date, required: true },
    year_level: { type: String, default: "" }, // Target year level for the event
    start_time: { type: String, default: "07:00" }, // Event start time e.g., "07:00"
    end_time: { type: String, default: "17:00" }, // Event end time e.g., "17:00"
    status: {
        type: String,
        enum: ['draft', 'active', 'closed'],
        default: 'draft'
    },
    is_custom: { type: Boolean, default: false }, // Whether this is a custom event for specific users
    assigned_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }], // Specific users for custom events
    // Geofence: when enabled, the device performing the check-in must
    // physically sit within `geofence_radius_meters` of (lat, lng).
    // Defaults match the venue-scale tolerance the team agreed on (~80m).
    geofence_enabled: { type: Boolean, default: false },
    geofence_lat: { type: Number, default: null },
    geofence_lng: { type: Number, default: null },
    geofence_radius_meters: { type: Number, default: 80, min: 10, max: 5000 },
    // Face ID Recognition: when disabled, students cannot use the Face ID scanner
    // for this event (they must use RFID or admin manual check-in instead).
    face_id_enabled: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
    created_by_name: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    activated_at: { type: Date, default: null },
    closed_at: { type: Date, default: null },
    rfidScanner: { type: mongoose.Schema.Types.Mixed, default: { checkInEnabled: true, checkOutEnabled: false } }
});

attendanceEventSchema.index({ status: 1, event_date: -1 });
attendanceEventSchema.index({ created_at: -1 });

const AttendanceEvent = mongoose.model("AttendanceEvent", attendanceEventSchema);
const CCS_AttendanceEvent = mongoose.model("CCS_AttendanceEvent", attendanceEventSchema, 'ccs_attendanceevents');
const COE_AttendanceEvent = mongoose.model("COE_AttendanceEvent", attendanceEventSchema, 'coe_attendanceevents');
const SOM_AttendanceEvent = mongoose.model("SOM_AttendanceEvent", attendanceEventSchema, 'som_attendanceevents');
const CNAHS_AttendanceEvent = mongoose.model("CNAHS_AttendanceEvent", attendanceEventSchema, 'cnahs_attendanceevents');

// Attendance Session Schema - Individual check-in/out periods within an event
// Each session has a label (Morning, Afternoon, Noon, Night, Dawn) and its own time window
const attendanceSessionSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceEvent', required: true },
    label: {
        type: String,
        enum: ['Whole Day', 'Morning', 'Afternoon', 'Noon', 'Night', 'Dawn'],
        required: true
    },
    start_time: { type: String, required: true }, // e.g., "08:00"
    end_time: { type: String, required: true }, // e.g., "12:00"
    status: {
        type: String,
        enum: ['draft', 'active', 'closed'],
        default: 'draft'
    },
    check_in_locked: { type: Boolean, default: false },
    check_out_locked: { type: Boolean, default: false },
    late_timer_minutes: { type: Number, default: 0 },
    check_in_only: { type: Boolean, default: false },
    rfidScanner: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

attendanceSessionSchema.index({ event_id: 1, label: 1 });
attendanceSessionSchema.index({ event_id: 1, status: 1 });
attendanceSessionSchema.index({ status: 1 });

const AttendanceSession = mongoose.model("AttendanceSession", attendanceSessionSchema);
const CCS_AttendanceSession = mongoose.model("CCS_AttendanceSession", attendanceSessionSchema, 'ccs_attendancesessions');
const COE_AttendanceSession = mongoose.model("COE_AttendanceSession", attendanceSessionSchema, 'coe_attendancesessions');
const SOM_AttendanceSession = mongoose.model("SOM_AttendanceSession", attendanceSessionSchema, 'som_attendancesessions');
const CNAHS_AttendanceSession = mongoose.model("CNAHS_AttendanceSession", attendanceSessionSchema, 'cnahs_attendancesessions');

// Attendance Log Schema - Individual student attendance records per session
// Each log represents one student's check-in/out for a specific session
const attendanceLogSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceEvent', required: true },
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    student_id_number: { type: String, required: true }, // e.g., "21-A-12345"
    rfid_code: { type: String, default: null },
    student_name: { type: String, required: true },
    program: { type: String },
    year_level: { type: String },
    check_in_at: { type: Date, default: null },
    check_out_at: { type: Date, default: null },
    is_late: { type: Boolean, default: false },
    // Excused flag and reason (optional)
    excused: { type: Boolean, default: false },
    excuse_reason: { type: String, default: null },
    excused_by: { type: String, default: null },
    // Optional reference to who excused (Student or Master)
    excused_by_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    excused_by_model: { type: String, enum: ['Student', 'Master', null], default: null },
    source: { type: String, enum: ['rfid', 'manual', 'face'], default: 'rfid' },
    input_method: { type: String, enum: ['rfid', 'manual_student_id'], default: 'rfid' },
    // Snapshot of the session's check_in_only flag at the time of check-in.
    // Stored here so aggregation pipelines can determine attendance status
    // without needing a $lookup join back to the sessions collection.
    check_in_only: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

attendanceLogSchema.index({ session_id: 1, student_id: 1 }, { unique: true });
attendanceLogSchema.index({ event_id: 1, student_id: 1 });
attendanceLogSchema.index({ session_id: 1, rfid_code: 1 });
attendanceLogSchema.index({ session_id: 1, check_in_at: -1 });

// Virtual for attendance status (present, late, incomplete, absent).
// For check-in-only sessions a single check-in counts as present/late.
attendanceLogSchema.virtual('attendance_status').get(function () {
    if (this.excused) return 'excused';
    if (this.check_in_at && (this.check_out_at || this.check_in_only)) {
        return this.is_late ? 'late' : 'present';
    }
    if (this.check_in_at && !this.check_out_at) return 'incomplete';
    return 'absent';
});

attendanceLogSchema.set('toJSON', { virtuals: true });
attendanceLogSchema.set('toObject', { virtuals: true });

const AttendanceLog = mongoose.model("AttendanceLog", attendanceLogSchema);
const CCS_AttendanceLog = mongoose.model("CCS_AttendanceLog", attendanceLogSchema, 'ccs_attendancelogs');
const COE_AttendanceLog = mongoose.model("COE_AttendanceLog", attendanceLogSchema, 'coe_attendancelogs');
const SOM_AttendanceLog = mongoose.model("SOM_AttendanceLog", attendanceLogSchema, 'som_attendancelogs');
const CNAHS_AttendanceLog = mongoose.model("CNAHS_AttendanceLog", attendanceLogSchema, 'cnahs_attendancelogs');

// ==================== RAFFLE TICKET SCHEMAS ====================

const raffleTicketSchema = new mongoose.Schema({
    student_id_number: { type: String, required: true },
    student_name: { type: String, required: true },
    program: { type: String, default: '' },
    year_level: { type: String, default: '' },
    ticket_type: { type: String, enum: ['red', 'green', 'both'], default: 'both' },
    rural_count: { type: Number, default: 0 },
    evergood_count: { type: Number, default: 0 },
    ticket_count: { type: Number, required: true },
    category: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'none'], default: 'none' },
    submitted_by: { type: String, default: '' },
    submitted_at: { type: Date, default: Date.now }
});

raffleTicketSchema.index({ student_id_number: 1 });
raffleTicketSchema.index({ category: 1 });

const RaffleTicket = mongoose.model("RaffleTicket", raffleTicketSchema);
const CCS_RaffleTicket = mongoose.model("CCS_RaffleTicket", raffleTicketSchema, 'ccs_raffletickets');
const COE_RaffleTicket = mongoose.model("COE_RaffleTicket", raffleTicketSchema, 'coe_raffletickets');
const SOM_RaffleTicket = mongoose.model("SOM_RaffleTicket", raffleTicketSchema, 'som_raffletickets');
const CNAHS_RaffleTicket = mongoose.model("CNAHS_RaffleTicket", raffleTicketSchema, 'cnahs_raffletickets');

function getRaffleCategory(count) {
    if (count >= 20 && count <= 25) return 'bronze';
    if (count >= 26 && count <= 50) return 'silver';
    if (count >= 51 && count <= 80) return 'gold';
    if (count >= 81 && count <= 149) return 'platinum';
    if (count >= 150) return 'diamond';
    return 'none';
}

// ==================== PAYMENT SCHEMAS ====================

// Payment Schema - Create payment periods/campaigns to track contributions
const paymentSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g., "Membership Fee Q1 2026"
    description: { type: String, default: "" },
    type: {
        type: String,
        enum: ['membership', 'donation', 'fee', 'other', 'contribution', 'fundraiser', 'event'],
        default: 'fee'
    },
    amount_due: { type: Number, default: 0 }, // Amount each student should pay (0 if flexible)
    deadline: { type: Date, default: null },
    status: {
        type: String,
        enum: ['active', 'closed', 'archived'],
        default: 'active'
    },
    created_by: { type: String, required: true }, // Username of admin who created it
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    // Targeting: empty array = applies to ALL; non-empty = only matching students
    target_year_levels: { type: [String], default: [] },
    target_programs:    { type: [String], default: [] },
});

paymentSchema.index({ status: 1, created_at: -1 });
paymentSchema.index({ created_by: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
const CCS_Payment = mongoose.model("CCS_Payment", paymentSchema, 'ccs_payments');
const COE_Payment = mongoose.model("COE_Payment", paymentSchema, 'coe_payments');
const SOM_Payment = mongoose.model("SOM_Payment", paymentSchema, 'som_payments');
const CNAHS_Payment = mongoose.model("CNAHS_Payment", paymentSchema, 'cnahs_payments');

// Payment Record Schema - Consolidated: One record per student with multiple campaigns
const paymentRecordSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true }, // e.g., "25-A-01207" - UNIQUE per student
    student_id_number: { type: String, required: true }, // e.g., "21-A-12345"
    student_name: { type: String, required: true },
    program: { type: String },
    year_level: { type: String },

    // Array of payment campaigns for this student
    campaigns: [{
        payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
        payment_status: {
            type: String,
            enum: ['pending', 'unpaid', 'paid', 'partial', 'waived'],
            default: 'pending'
        },
        amount_paid: { type: Number, default: 0 },
        paid_at: { type: Date, default: null },
        paid_by_treasurer: { type: String, default: null },
        notes: { type: String, default: "" },
        payment_method: { type: String, default: null },
        // Discount fields
        discount_type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }, // Type of discount
        discount_percentage: { type: Number, default: 0, min: 0, max: 100 }, // 0-100% (for percentage discount)
        discount_fixed_amount: { type: Number, default: 0, min: 0 }, // Fixed amount discount in peso
        discount_reason: { type: String, default: "" },
        discount_applied_at: { type: Date, default: null },
        discount_applied_by: { type: String, default: null }, // Admin username who applied discount
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
    }],

    // Summary fields for quick queries
    total_campaigns: { type: Number, default: 0 },
    total_amount_paid: { type: Number, default: 0 },
    campaigns_paid: { type: Number, default: 0 }, // Count of 'paid' campaigns
    last_payment_at: { type: Date, default: null },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

paymentRecordSchema.index({ 'campaigns.payment_id': 1 });
paymentRecordSchema.index({ 'campaigns.payment_status': 1 });

const PaymentRecord = mongoose.model("PaymentRecord", paymentRecordSchema);
const CCS_PaymentRecord = mongoose.model("CCS_PaymentRecord", paymentRecordSchema, 'ccs_paymentrecords');
const COE_PaymentRecord = mongoose.model("COE_PaymentRecord", paymentRecordSchema, 'coe_paymentrecords');
const SOM_PaymentRecord = mongoose.model("SOM_PaymentRecord", paymentRecordSchema, 'som_paymentrecords');
const CNAHS_PaymentRecord = mongoose.model("CNAHS_PaymentRecord", paymentRecordSchema, 'cnahs_paymentrecords');

// Send Password Reset Email
async function sendPasswordResetEmail(toEmail, code, studentName) {
    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: "SSAAM Password Reset Code",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">SSAAM</h1>
                        <p style="color: white; opacity: 0.9; margin: 5px 0 0 0;">Student School Activities Attendance Monitoring</p>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${sanitizeHtml(studentName)}!</h2>
                        <p style="color: #4b5563;">You requested a password reset. Your verification code is:</p>
                        <div style="background: white; border: 2px solid #ef4444; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ef4444;">${code}</span>
                        </div>
                        <p style="color: #4b5563;">This code will expire in <strong>15 minutes</strong>.</p>
                        <p style="color: #6b7280; font-size: 14px;">If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                    </div>
                </div>
            `
    };

    return emailService.sendMail(mailOptions);
}

async function getSettings(college = 'CCS') {
    const SettingsModel = getCollegeModel(Settings, CCS_Settings, COE_Settings, college);
    let settings = await SettingsModel.findOne();
    if (!settings) {
        settings = await SettingsModel.create({
            userRegister: { register: true, message: "" },
            userLogin: { login: true, message: "" },
            rfidScanner: {
                checkInEnabled: true,
                checkOutEnabled: true,
                autoDisableCheckIn: false,
                autoDisableCheckOut: false,
                checkInDisableAt: null,
                checkOutDisableAt: null
            },
            semester: '1st Sem',
            schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        });
    } else {
        let needsSave = false;
        if (!settings.rfidScanner) {
            settings.rfidScanner = {
                checkInEnabled: true,
                checkOutEnabled: true,
                autoDisableCheckIn: false,
                autoDisableCheckOut: false,
                checkInDisableAt: null,
                checkOutDisableAt: null
            };
            needsSave = true;
        }
        if (!settings.semester) {
            settings.semester = '1st Sem';
            needsSave = true;
        }
        if (settings.schoolYear === undefined) {
            settings.schoolYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
            needsSave = true;
        }
        if (needsSave) {
            await settings.save();
        }
    }

    // Check auto-disable timers and update if needed
    const now = new Date();
    let needsSaveAfterTimer = false;

    if (settings.rfidScanner.autoDisableCheckIn && settings.rfidScanner.checkInDisableAt) {
        if (new Date(settings.rfidScanner.checkInDisableAt) <= now) {
            settings.rfidScanner.checkInEnabled = false;
            settings.rfidScanner.autoDisableCheckIn = false;
            settings.rfidScanner.checkInDisableAt = null;
            needsSave = true;
        }
    }

    if (settings.rfidScanner.autoDisableCheckOut && settings.rfidScanner.checkOutDisableAt) {
        if (new Date(settings.rfidScanner.checkOutDisableAt) <= now) {
            settings.rfidScanner.checkOutEnabled = false;
            settings.rfidScanner.autoDisableCheckOut = false;
            settings.rfidScanner.checkOutDisableAt = null;
            needsSave = true;
        }
    }

    if (needsSaveAfterTimer) {
        await settings.save();
    }

    return settings;
}

// Helper: search for a session token hash across all college collections in priority order.
async function findSessionTokenAcrossColleges(tokenHash, preferredCollege) {
    const query = { token_hash: tokenHash, is_revoked: false, expires_at: { $gt: new Date() } };
    const update = { last_used_at: new Date() };
    const opts = { new: true };

    // Try preferred college first, then all others
    const order = [preferredCollege, ...VALID_COLLEGES.filter(c => c !== preferredCollege)];
    for (const college of order) {
        const model = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, college);
        const found = await model.findOneAndUpdate(query, update, opts);
        if (found) return { sessionToken: found, foundCollege: college };
    }
    return { sessionToken: null, foundCollege: null };
}

async function auth(req, res, next) {
    const token = extractToken(req);

    if (!token)
        return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        const tokenHash = hashToken(token);

        // For the session lookup, prefer the college in the token first, then the header.
        const preferredCollege = normalizeCollege(decoded.college) || req.college || 'CCS';
        const { sessionToken } = await findSessionTokenAcrossColleges(tokenHash, preferredCollege);

        if (!sessionToken) {
            return res.status(401).json({ message: "Session expired or invalid. Please login again." });
        }

        // For master tokens: preserve the header-derived req.college (the college the admin
        // chose at login / in the UI). Do NOT override it with where the session token was
        // stored — those may differ when admins switch college context.
        // req.college is already correctly set from getCollegeFromRequest (header-first).

        req.master = decoded;
        req.sessionToken = sessionToken;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid token." });
    }
}

async function studentAuthWithToken(req, res, next) {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);

        const tokenHash = hashToken(token);
        const preferredCollege = normalizeCollege(decoded.college) || req.college || 'CCS';
        const { sessionToken, foundCollege } = await findSessionTokenAcrossColleges(tokenHash, preferredCollege);

        if (!sessionToken) {
            return res.status(401).json({ message: "Session expired or invalid. Please login again." });
        }

        // For student tokens: sync req.college with where their session lives
        // so all subsequent data queries hit the right college's collections.
        if (foundCollege) req.college = foundCollege;

        // Fetch the full student document (use college from token/session if available)
        const studentCollege = decoded.college || req.college || 'CCS';
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, studentCollege);
        const student = await StudentModel.findOne({ student_id: decoded.student_id });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        req.user = decoded;
        req.student = student;
        req.sessionToken = sessionToken;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token." });
    }
}

function studentAuth(req, res, next) {
    const token = extractToken(req);
    const validStudentKey = process.env.SSAAM_STUDENT_API_KEY || 'SSAAMStudents';

    if (!token || token !== validStudentKey) {
        return res.status(401).json({ message: "Unauthorized: Invalid key" });
    }

    next();
}

// Middleware to verify the token actually has isMaster: true in the JWT payload
// This prevents localStorage tampering - the JWT signature cannot be forged
// Both full admin and co-admin pass this check
async function requireMaster(req, res, next) {
    if (!req.master) {
        return res.status(401).json({ message: "Authentication required" });
    }

    // Verify isMaster flag from the JWT token itself (cannot be forged)
    if (!req.master.isMaster) {
        return res.status(403).json({
            message: "Access denied. Admin privileges required.",
            code: 'NOT_ADMIN'
        });
    }

    // Also verify the session is for a master user
    if (req.sessionToken && req.sessionToken.user_type !== 'master') {
        return res.status(403).json({
            message: "Access denied. Invalid admin session.",
            code: 'INVALID_ADMIN_SESSION'
        });
    }

    next();
}

// Only full admin (role='admin') — co-admin is blocked from super-admin areas
async function requireSuperAdmin(req, res, next) {
    if (!req.master || !req.master.isMaster) {
        return res.status(401).json({ message: "Authentication required" });
    }
    const role = req.master.role || 'admin';
    if (role !== 'admin') {
        return res.status(403).json({
            message: "Access denied. Only the super admin can perform this action.",
            code: 'NOT_SUPER_ADMIN'
        });
    }
    next();
}

// Enforces that co-admin and treasurer users can only operate on their own college's data.
// Full admins are unrestricted. Apply this after `auth` on any route that manages college data.
function enforceCoAdminCollege(req, res, next) {
    if (req.master && req.master.isMaster && (req.master.role === 'co-admin' || req.master.role === 'treasurer')) {
        req.college = req.master.college || 'CCS';
    }
    next();
}

// Blocks treasurer role from performing co-admin-level or higher operations.
// Apply on routes that co-admins can use but treasurers cannot (attendance, student management, etc.).
function requireCoAdminOrAbove(req, res, next) {
    if (req.master && req.master.isMaster && req.master.role === 'treasurer') {
        return res.status(403).json({
            message: "Access denied. Treasurer accounts cannot perform this action.",
            code: 'NOT_CO_ADMIN'
        });
    }
    next();
}



// Middleware that allows students to search — students can only access their own data
async function studentSearchAuth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);

        const tokenHash = hashToken(token);
        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
        const sessionToken = await SessionTokenModel.findOneAndUpdate(
            {
                token_hash: tokenHash,
                is_revoked: false,
                expires_at: { $gt: new Date() }
            },
            { last_used_at: new Date() },
            { new: true }
        );

        if (!sessionToken) {
            return res.status(401).json({ message: "Session expired or invalid. Please login again." });
        }

        if (decoded.isMaster) {
            const master = await Master.findById(decoded.id);
            if (!master) {
                return res.status(404).json({ message: "Admin user not found" });
            }
            req.user = decoded;
            req.master = master;
            req.sessionToken = sessionToken;
            req.isAdmin = true;
            next();
        } else {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const student = await StudentModel.findOne({ student_id: decoded.student_id });
            if (!student) {
                return res.status(401).json({ message: "Student not found" });
            }

            if (student.student_id !== decoded.student_id) {
                console.warn(`[SECURITY] Token/Database mismatch for student ${decoded.student_id}`);
                return res.status(401).json({ message: "Session validation failed. Please login again." });
            }

            if (!VALID_ROLES.includes(student.role)) {
                return res.status(403).json({
                    message: "Access denied. Valid student role required.",
                    code: 'INSUFFICIENT_ROLE'
                });
            }

            if (sessionToken.user_id) {
                const tokenUserId = sessionToken.user_id.toString();
                const studentId = student._id.toString();
                if (tokenUserId !== studentId) {
                    console.warn(`[SECURITY] Session hijacking attempt detected for student ${decoded.student_id}`);
                    return res.status(401).json({ message: "Invalid session. Please login again." });
                }
            }

            req.user = decoded;
            req.student = student;
            req.sessionToken = sessionToken;
            req.isAdmin = false;
            next();
        }
    } catch (err) {
        return res.status(401).json({ message: "Invalid token." });
    }
}

function timingSafeCompare(a, b) {
    if (!a || !b || a.length !== b.length) {
        const dummy = crypto.randomBytes(32).toString('hex');
        crypto.timingSafeEqual(Buffer.from(dummy), Buffer.from(dummy));
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function validateName(name, fieldName) {
    if (!name || name.trim() === "") {
        return { valid: false, message: `${fieldName} is required` };
    }

    const trimmedName = name.trim().toUpperCase();

    if (trimmedName.length > 64) {
        return { valid: false, message: `${fieldName} must be 64 characters or less` };
    }

    if (!UPPERCASE_ONLY_REGEX.test(trimmedName)) {
        return { valid: false, message: `${fieldName} must contain uppercase letters only` };
    }

    return { valid: true, value: trimmedName };
}

function validateSuffix(suffix) {
    if (!suffix || suffix === "") return { valid: true, value: "" };
    if (!VALID_SUFFIXES.includes(suffix)) {
        return { valid: false, message: `Invalid suffix. Allowed: ${VALID_SUFFIXES.filter(s => s).join(', ')}` };
    }
    return { valid: true, value: suffix };
}

function validateSemester(semester) {
    if (!VALID_SEMESTERS.includes(semester)) {
        return { valid: false, message: `Semester must be one of: ${VALID_SEMESTERS.join(', ')}` };
    }
    return { valid: true, value: semester };
}

function validateYearLevel(yearLevel) {
    if (!VALID_YEAR_LEVELS.includes(yearLevel)) {
        return { valid: false, message: `Year level must be one of: ${VALID_YEAR_LEVELS.join(', ')}` };
    }
    return { valid: true, value: yearLevel };
}

app.get('/', (req, res) => {
    res.status(200).json({
        message: "SSAAM Backend is running!",
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

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


app.get('/apis/students', studentAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Use college-aware Student model
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

        // Select only necessary fields to reduce payload size
        const students = await StudentModel.find({ status: 'approved' })
            .select('student_id first_name middle_name last_name suffix full_name program year_level semester school_year photo email role rfid_status rfid_code created_date')
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        const total = await StudentModel.countDocuments({ status: 'approved' });
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: students,
            pagination: {
                currentPage: page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        internalError(res, err);
    }
});

app.get('/apis/students/stats', auth, async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

        const yearLevelMap = {
            '1ST YEAR': '1st Year', '1ST': '1st Year', '1': '1st Year',
            'FIRST YEAR': '1st Year', 'FIRST': '1st Year',
            '2ND YEAR': '2nd Year', '2ND': '2nd Year', '2': '2nd Year',
            'SECOND YEAR': '2nd Year', 'SECOND': '2nd Year',
            '3RD YEAR': '3rd Year', '3RD': '3rd Year', '3': '3rd Year',
            'THIRD YEAR': '3rd Year', 'THIRD': '3rd Year',
            '4TH YEAR': '4th Year', '4TH': '4th Year', '4': '4th Year',
            'FOURTH YEAR': '4th Year', 'FOURTH': '4th Year'
        };
        const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

        const allStudents = await StudentModel.find({ status: 'approved' });

        // Dynamically discover all programs in this college's data
        const stats = {};
        let verifiedCount = 0;
        let unverifiedCount = 0;
        let unreadableCount = 0;

        allStudents.forEach(student => {
            const rawProgram = (student.program || '').trim().toUpperCase();
            const rawYearLevel = (student.year_level || '').trim().toUpperCase();
            const program = rawProgram || null;
            const yearLevel = yearLevelMap[rawYearLevel] ||
                (YEAR_LEVELS.includes(student.year_level) ? student.year_level : null);

            if (program) {
                if (!stats[program]) {
                    stats[program] = { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, total: 0 };
                }
                if (yearLevel && stats[program][yearLevel] !== undefined) {
                    stats[program][yearLevel]++;
                }
                stats[program].total++;
            }

            const rfidStatus = student.rfid_status;
            if (rfidStatus === 'verified') verifiedCount++;
            else if (rfidStatus === 'Unreadable') unreadableCount++;
            else unverifiedCount++;
        });

        const pendingCount = await StudentModel.countDocuments({ status: 'pending' });
        const totalCount = allStudents.length;

        res.json({
            stats,
            totalStudents: totalCount,
            totalCount,
            pendingCount,
            verifiedCount,
            unverifiedCount,
            unreadableCount
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Get all students from all colleges — super admin only
app.get('/apis/students/all-colleges', auth, async (req, res) => {
    try {
        if (!req.master?.isMaster || req.master?.role === 'co-admin') {
            return res.status(403).json({ message: 'Access denied. Super admin required.' });
        }
        const colleges = ['CCS', 'COE', 'SOM', 'CNAHS'];
        const allStudents = [];
        for (const college of colleges) {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, college);
            const students = await StudentModel.find({ status: 'approved' })
                .select('_id student_id first_name middle_name last_name suffix email program year_level role rfid_code rfid_status photo')
                .lean();
            students.forEach(s => { s.college = college; allStudents.push(s); });
        }
        res.json(allStudents);
    } catch (err) {
        internalError(res, err);
    }
});

// Get all students with full names for custom event selection
app.get('/apis/students/list/all', auth, async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

        const students = await StudentModel.find({ status: 'approved' })
            .select('student_id first_name middle_name last_name suffix program year_level photo email rfid_status rfid_code role college')
            .sort({ first_name: 1, last_name: 1 });

        const formattedStudents = students.map(s => ({
            _id: s._id,
            student_id: s.student_id,
            first_name: s.first_name || '',
            middle_name: s.middle_name || '',
            last_name: s.last_name || '',
            full_name: `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim().toUpperCase(),
            program: s.program || '',
            year_level: s.year_level || '',
            photo: s.photo || '',
            email: s.email || '',
            rfid_status: s.rfid_status || 'unverified',
            rfid_code: s.rfid_code || 'N/A',
            role: s.role || 'student',
            college: s.college || ''
        }));

        res.json({
            data: formattedStudents,
            total: formattedStudents.length
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Search for student by ID or RFID (POST endpoint for payment verification)
app.post('/apis/students/search', auth, async (req, res) => {
    try {
        const { search_query } = req.body;

        if (!search_query || !search_query.trim()) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const escapedSearch = escapeRegex(search_query.trim());

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

        // Search by student_id, rfid_code, or name fields
        const student = await StudentModel.findOne({
            status: 'approved',
            $or: [
                { student_id: { $regex: escapedSearch, $options: 'i' } },
                { rfid_code: { $regex: escapedSearch, $options: 'i' } },
                { first_name: { $regex: escapedSearch, $options: 'i' } },
                { last_name: { $regex: escapedSearch, $options: 'i' } },
                { full_name: { $regex: escapedSearch, $options: 'i' } }
            ]
        }).select('student_id first_name last_name middle_name suffix full_name program year_level email rfid_status role photo college');

        if (!student) {
            return res.status(404).json({
                message: 'Student not found',
                student: null
            });
        }

        res.json({
            message: 'Student found',
            student: student
        });
    } catch (err) {
        console.error('Error searching student:', err);
        internalError(res, err);
    }
});

// Multi-result student search (admins only) — used by Manage > Roles to pick
// from a list when several students match a name. Mirrors the POST /search but
// returns up to 10 candidates instead of a single record.
app.post('/apis/students/search-multi', auth, async (req, res) => {
    try {
        const { search_query } = req.body;
        if (!search_query || !search_query.trim()) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

        // Split the query by whitespace so "REAH GARCIA" finds students
        // where "REAH" matches any name field AND "GARCIA" matches any name field,
        // even when full_name is null or ordered differently.
        const terms = search_query.trim().split(/\s+/).filter(Boolean);

        let nameFilter;
        if (terms.length === 1) {
            const esc = escapeRegex(terms[0]);
            nameFilter = {
                $or: [
                    { student_id: { $regex: esc, $options: 'i' } },
                    { rfid_code: { $regex: esc, $options: 'i' } },
                    { first_name: { $regex: esc, $options: 'i' } },
                    { middle_name: { $regex: esc, $options: 'i' } },
                    { last_name: { $regex: esc, $options: 'i' } },
                    { full_name: { $regex: esc, $options: 'i' } }
                ]
            };
        } else {
            // Every term must appear in at least one of the name fields.
            // This handles "REAH GARCIA", "Garcia Reah", "22-A-12345 Garcia", etc.
            nameFilter = {
                $and: terms.map(t => {
                    const esc = escapeRegex(t);
                    return {
                        $or: [
                            { first_name: { $regex: esc, $options: 'i' } },
                            { middle_name: { $regex: esc, $options: 'i' } },
                            { last_name: { $regex: esc, $options: 'i' } },
                            { full_name: { $regex: esc, $options: 'i' } },
                            { student_id: { $regex: esc, $options: 'i' } }
                        ]
                    };
                })
            };
        }

        const students = await StudentModel.find({
            status: 'approved',
            ...nameFilter
        })
            .select('student_id first_name last_name middle_name suffix full_name program year_level email rfid_status role photo college')
            .sort({ first_name: 1, last_name: 1 })
            .limit(10)
            .lean();

        res.json({ message: 'OK', students, count: students.length });
    } catch (err) {
        console.error('Error in students/search-multi:', err);
        internalError(res, err);
    }
});

app.get('/apis/students/search', studentSearchAuth, async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const program = req.query.program || '';
        const yearLevel = req.query.yearLevel || '';
        const rfidStatus = req.query.rfid_status || '';

        const filter = { status: 'approved' };

        // Students can only access their own data; admins can search all
        if (!req.isAdmin) {
            const userStudentId = req.student?.student_id;
            if (!userStudentId) {
                return res.status(403).json({
                    message: "Access denied. Could not determine your student ID.",
                    code: 'NO_STUDENT_ID'
                });
            }

            // Explicitly set to user's own student_id - cannot be overridden by query parameters
            filter.student_id = userStudentId;

            // Additional security: verify search parameter matches user's student_id
            // This prevents accidental exposure of other students' data
            if (search.trim() && search.trim() !== userStudentId) {
                console.warn(`[SECURITY] Unauthorized search attempt by student ${userStudentId} for ${search}`);
                return res.status(403).json({
                    message: "Access denied. You can only search your own student profile.",
                    code: 'UNAUTHORIZED_SEARCH'
                });
            }
        } else {
            // Admin: apply search filter if provided
            if (search.trim()) {
                const escapedSearch = escapeRegex(search.trim());
                filter.$or = [
                    { student_id: { $regex: escapedSearch, $options: 'i' } },
                    { first_name: { $regex: escapedSearch, $options: 'i' } },
                    { last_name: { $regex: escapedSearch, $options: 'i' } },
                    { email: { $regex: escapedSearch, $options: 'i' } },
                    { rfid_code: { $regex: escapedSearch, $options: 'i' } }
                ];
            }
        }

        if (program) {
            filter.program = program;
        }

        if (yearLevel) {
            filter.year_level = yearLevel;
        }

        if (rfidStatus) {
            if (rfidStatus === 'verified') {
                filter.rfid_status = 'verified';
            } else if (rfidStatus === 'unverified') {
                filter.$and = filter.$and || [];
                filter.$and.push({
                    $or: [
                        { rfid_status: 'unverified' },
                        { rfid_status: { $exists: false } },
                        { rfid_status: null },
                        { rfid_status: '' }
                    ]
                });
            } else if (rfidStatus === 'Unreadable') {
                filter.$and = filter.$and || [];
                filter.$and.push({
                    $or: [
                        { rfid_status: 'Unreadable' },
                        { rfid_code: { $regex: '^UNREADABLE', $options: 'i' } }
                    ]
                });
            }
        }

        // Select only necessary fields to reduce payload size
        const students = await StudentModel.find(filter)
            .select('student_id first_name middle_name last_name suffix full_name program year_level semester school_year photo email role rfid_status rfid_code created_date')
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        // Additional security: for students, verify all returned results belong to them
        if (!req.isAdmin) {
            const userStudentId = req.student?.student_id;
            for (const student of students) {
                if (student.student_id !== userStudentId) {
                    console.error(`[SECURITY CRITICAL] Data leakage prevented for student ${userStudentId}`);
                    return res.status(403).json({
                        message: "Access denied. Data integrity check failed.",
                        code: 'DATA_INTEGRITY_FAILED'
                    });
                }
            }
        }

        const total = await StudentModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: students,
            pagination: {
                currentPage: page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        internalError(res, err);
    }
});

app.get('/apis/students/pending', auth, async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Debug: Log the query and connection state
        console.log('Fetching pending students, page:', page, 'limit:', limit);
        console.log('Connection state:', mongoose.connection.readyState, '(0=disconnected, 1=connected, 2=connecting, 3=disconnecting)');

        // Select only necessary fields to reduce payload size
        const students = await StudentModel.find({ status: 'pending' })
            .select('student_id first_name middle_name last_name suffix full_name program year_level semester school_year photo email role rfid_status created_date')
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        const total = await StudentModel.countDocuments({ status: 'pending' });

        // Debug: Log results
        console.log('Found pending students:', students.length, 'Total:', total);

        const totalPages = Math.ceil(total / limit);

        res.json({
            data: students,
            pagination: {
                currentPage: page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        console.error('Error fetching pending students:', err.message);
        console.error('Connection state when error occurred:', mongoose.connection.readyState);
        internalError(res, err);
    }
});

app.post('/apis/students/send-verification', studentAuth, antiBotProtection, async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const settings = await getSettings(req.college);
        if (!settings.userRegister.register) {
            return res.status(403).json({
                message: settings.userRegister.message || "Registration is currently disabled.",
                registrationDisabled: true
            });
        }

        const data = req.body;

        if (!data.email || !data.email.includes('@')) {
            return res.status(400).json({ message: "Valid email is required" });
        }

        // Validate Gmail-only emails
        const gmailRegex = /^[^\s@]+@gmail\.com$/i;
        if (!gmailRegex.test(data.email)) {
            return res.status(400).json({ message: "Only Gmail addresses (@gmail.com) are allowed for registration" });
        }

        if (!STUDENT_ID_REGEX.test(data.student_id)) {
            return res.status(400).json({ message: "Invalid student_id format. Use 19-A-12345" });
        }

        const yearPrefix = parseInt(data.student_id.substring(0, 2), 10);
        if (yearPrefix < 10 || yearPrefix > 25) {
            return res.status(400).json({ message: "Student ID must start with 10 to 25" });
        }

        const firstNameValidation = validateName(data.first_name, "First name");
        if (!firstNameValidation.valid) {
            return res.status(400).json({ message: firstNameValidation.message });
        }

        const lastNameValidation = validateName(data.last_name, "Last name");
        if (!lastNameValidation.valid) {
            return res.status(400).json({ message: lastNameValidation.message });
        }

        if (data.middle_name && data.middle_name.trim() !== "") {
            const middleNameValidation = validateName(data.middle_name, "Middle name");
            if (!middleNameValidation.valid) {
                return res.status(400).json({ message: middleNameValidation.message });
            }
        }

        const suffixValidation = validateSuffix(data.suffix);
        if (!suffixValidation.valid) {
            return res.status(400).json({ message: suffixValidation.message });
        }

        const yearLevelValidation = validateYearLevel(data.year_level);
        if (!yearLevelValidation.valid) {
            return res.status(400).json({ message: yearLevelValidation.message });
        }

        if (!VALID_PROGRAMS.includes(data.program)) {
            return res.status(400).json({ message: "Program must be one of: BSCS, BSIT, BSIS, or BSM" });
        }

        const existingStudent = await StudentModel.findOne({ student_id: data.student_id });
        if (existingStudent) {
            return res.status(400).json({ message: "Student ID already registered" });
        }

        // Check for duplicate email (case-insensitive, normalized to lowercase)
        const normalizedEmail = data.email.toLowerCase().trim();
        const existingEmail = await StudentModel.findOne({
            email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });
        if (existingEmail) {
            return res.status(400).json({ message: "This email address is already registered" });
        }

        // Check rate limit for verification code requests
        const rateLimitCheck = await verificationCodeRateLimiter.checkAndRecord(data.email);
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                message: rateLimitCheck.message,
                waitSeconds: rateLimitCheck.waitSeconds,
                waitMinutes: rateLimitCheck.waitMinutes
            });
        }

        await VerificationCode.deleteMany({ email: data.email });

        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes instead of 10

        const firstName = firstNameValidation.value;
        const middleName = data.middle_name ? data.middle_name.toUpperCase().trim() : "";
        const lastName = lastNameValidation.value;

        const fullName = `${firstName} ${middleName} ${lastName} ${suffixValidation.value}`.replace(/\s+/g, " ").trim();

        const studentData = {
            student_id: data.student_id,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            suffix: suffixValidation.value,
            full_name: fullName,
            email: data.email,
            year_level: yearLevelValidation.value,
            program: data.program,
            photo: data.photo || "",
            role: "student",
            status: "pending",
            rfid_code: null,
            rfid_status: "unverified"
        };

        await VerificationCode.create({
            email: data.email,
            code,
            student_data: studentData,
            expires_at: expiresAt
        });

        await sendVerificationEmail(data.email, code, data.first_name);

        res.json({
            message: "Verification code sent to your email",
            email: data.email,
            attemptsRemaining: rateLimitCheck.attemptsRemaining
        });

    } catch (err) {
        console.error("Send verification error:", err);
        res.status(500).json({ message: "Failed to send verification code. Please try again." });
    }
});

app.post('/apis/students/verify-and-register', studentAuth, timestampAuth, async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: "Email and verification code are required" });
        }

        const verification = await VerificationCode.findOne({
            email,
            code,
            expires_at: { $gt: new Date() }
        });

        if (!verification) {
            // Check if there's an expired verification for this email (single query approach)
            const anyVerification = await VerificationCode.findOneAndDelete({ email, code });
            if (anyVerification) {
                // Found and deleted an expired verification
                return res.status(400).json({
                    message: "Your verification code has expired. Please go back and register again to receive a new code.",
                    code: "TOKEN_EXPIRED",
                    resetRegistration: true
                });
            }
            return res.status(400).json({ message: "Invalid verification code. Please check and try again." });
        }

        const studentData = verification.student_data;

        studentData.role = "student";
        studentData.rfid_code = null;
        studentData.rfid_status = "unverified";

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const existingStudent = await StudentModel.findOne({ student_id: studentData.student_id });
        if (existingStudent) {
            await VerificationCode.deleteOne({ _id: verification._id });
            return res.status(400).json({ message: "Student ID already registered" });
        }

        const student = new StudentModel(studentData);
        const saved = await student.save();

        await VerificationCode.deleteOne({ _id: verification._id });

        // Reset the rate limiter for this email after successful registration
        await verificationCodeRateLimiter.reset(email);

        res.status(201).json({
            message: "Registration successful! Your account is pending admin approval. You will receive an email when approved.",
            student: saved
        });

    } catch (err) {
        console.error("Verify and register error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "Duplicate student_id" });
        }
        res.status(400).json({ message: err.message });
    }
});

app.put('/apis/students/:student_id/approve', auth, requireCoAdminOrAbove, timestampAuth, async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const student = await StudentModel.findOneAndUpdate(
            { student_id: req.params.student_id, status: 'pending' },
            { status: 'approved' },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: "Pending student not found" });
        }


        if (student.email) {
            try {
                await sendApprovalEmail(student.email, student.first_name, true);
            } catch (emailErr) {
                console.error("Failed to send approval email:", emailErr);
            }
        }

        await logAudit(req.college, req.master, 'STUDENT_APPROVED', 'Student', student.student_id,
            `${student.first_name} ${student.last_name}`.trim(),
            { program: student.program, year_level: student.year_level });
        res.json({
            message: "Student approved successfully",
            student
        });
    } catch (err) {
        internalError(res, err);
    }
});

app.put('/apis/students/:student_id/reject', auth, requireCoAdminOrAbove, timestampAuth, async (req, res) => {
    try {
        const { reason } = req.body;

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);

        const student = await StudentModel.findOne({ student_id: req.params.student_id, status: 'pending' });

        if (!student) {
            return res.status(404).json({ message: "Pending student not found" });
        }

        const studentInfo = {
            student_id: student.student_id,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            program: student.program,
            year_level: student.year_level
        };

        if (student.email) {
            try {
                await sendApprovalEmail(student.email, student.first_name, false, reason);
            } catch (emailErr) {
                console.error("Failed to send rejection email:", emailErr);
            }
        }

        const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);

        await LogModel.deleteMany({ student_id: student._id });
        await SessionTokenModel.deleteMany({ user_id: student._id });
        await StudentModel.deleteOne({ _id: student._id });

        await logAudit(req.college, req.master, 'STUDENT_REJECTED', 'Student', studentInfo.student_id,
            `${studentInfo.first_name} ${studentInfo.last_name}`.trim(),
            { program: studentInfo.program, year_level: studentInfo.year_level, reason: reason || '' });
        res.json({
            message: "Student rejected and removed from database",
            removed_student: studentInfo,
            rejection_reason: reason || ''
        });
    } catch (err) {
        internalError(res, err);
    }
});

app.put('/apis/students/:student_id/rfid', auth, requireCoAdminOrAbove, timestampAuth, async (req, res) => {
    try {
        const { rfid_code, admin_verification_token } = req.body;

        const expectedToken = crypto
            .createHmac('sha256', ADMIN_VERIFICATION_SECRET)
            .update(`${req.master.id}:${req.params.student_id}:${Date.now().toString().slice(0, -4)}`)
            .digest('hex')
            .slice(0, 16);

        if (!admin_verification_token) {
            return res.status(400).json({
                message: "Admin verification token required",
                required_token: expectedToken
            });
        }

        if (!rfid_code || rfid_code.trim() === "") {
            return res.status(400).json({ message: "RFID code is required" });
        }

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const existingRfid = await StudentModel.findOne({
            rfid_code: rfid_code,
            student_id: { $ne: req.params.student_id }
        });
        if (existingRfid) {
            return res.status(400).json({ message: "This RFID code is already assigned to another student" });
        }

        const adminVerifyToken = generateSecureToken();

        const updated = await StudentModel.findOneAndUpdate(
            { student_id: req.params.student_id },
            {
                rfid_code: rfid_code.trim(),
                rfid_status: "verified",
                rfid_verified_at: new Date(),
                admin_verification_token: hashToken(adminVerifyToken)
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Student not found" });
        }

        let emailSent = false;
        if (updated.email) {
            try {
                await sendRFIDVerificationEmail(
                    updated.email,
                    updated.first_name,
                    rfid_code.trim(),
                    req.master.username
                );
                emailSent = true;
            } catch (emailErr) {
                console.error("Failed to send RFID verification email:", emailErr);
                emailSent = false;
            }
        }

        await logAudit(req.college, req.master, 'STUDENT_RFID_UPDATED', 'Student', updated.student_id,
            `${updated.first_name} ${updated.last_name}`.trim(),
            { rfid_code: rfid_code.trim() });
        res.json({
            message: "RFID code assigned and verified successfully",
            student: updated,
            emailSent
        });
    } catch (err) {
        internalError(res, err);
    }
});



app.get('/apis/students/role-members', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const college = req.query.college || req.college;
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, college);
        const members = await StudentModel.find({
            status: 'approved',
            role: { $in: ['treasurer', 'co-admin'] }
        }).select('student_id first_name last_name middle_name suffix photo role program year_level').sort({ role: 1, last_name: 1 });
        res.json({ members, college });
    } catch (err) {
        console.error('Error fetching role members:', err);
        internalError(res, err);
    }
});

app.put('/apis/students/:student_id/role', auth, requireCoAdminOrAbove, timestampAuth, async (req, res) => {
    try {
        const { role } = req.body;

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
        }

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        let updated = await StudentModel.findOneAndUpdate(
            { student_id: req.params.student_id },
            { role },
            { new: true, returnDocument: 'after' }
        );

        if (!updated && req.master?.isMaster) {
            for (const college of ['CCS', 'COE', 'SOM', 'CNAHS']) {
                if (college === req.college) continue;
                const AltModel = getCollegeModel(Student, CCS_Student, COE_Student, college);
                updated = await AltModel.findOneAndUpdate(
                    { student_id: req.params.student_id },
                    { role },
                    { new: true, returnDocument: 'after' }
                );
                if (updated) break;
            }
        }

        if (!updated) {
            return res.status(404).json({ message: "Student not found" });
        }

        await logAudit(req.college, req.master, 'STUDENT_ROLE_UPDATED', 'Student', updated.student_id,
            updated.full_name || `${updated.first_name} ${updated.last_name}`.trim(),
            { new_role: role });
        res.json({
            message: `Role updated to ${role} successfully`,
            student: updated
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Allow students to update their own photo without admin privileges
app.put('/apis/students/:student_id/photo', studentAuthWithToken, async (req, res) => {
    try {
        const { photo } = req.body;

        if (!photo || typeof photo !== 'string') {
            return res.status(400).json({ message: 'Photo URL is required' });
        }

        // Get token data
        const tokenData = req.user;
        const requestedStudentId = req.params.student_id;

        if (!tokenData) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'NOT_AUTHENTICATED'
            });
        }

        // Check if it's a student updating their own photo
        const isOwnPhoto = tokenData.student_id === requestedStudentId;

        if (!isOwnPhoto) {
            return res.status(403).json({
                message: 'Access denied. You can only update your own photo.',
                code: 'PERMISSION_DENIED'
            });
        }

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

        const student = await StudentModel.findOneAndUpdate(
            { student_id: requestedStudentId },
            { photo: photo },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({
            message: 'Photo updated successfully',
            student: {
                student_id: student.student_id,
                photo: student.photo
            }
        });
    } catch (err) {
        console.error('Photo update error:', err);
        internalError(res, err);
    }
});

// Upload image to Cloudinary
app.post('/apis/upload-image', auth, async (req, res) => {
    try {
        const { image } = req.body;

        if (!image || typeof image !== 'string') {
            return res.status(400).json({ message: 'Image data is required' });
        }

        const result = await uploadToCloudinary(image);

        res.json({
            success: true,
            url: result.url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});

// Get student photo - works with or without authentication (for displaying cached photos)
app.get('/apis/students/:student_id/photo', async (req, res) => {
    try {
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const student = await StudentModel.findOne({ student_id: req.params.student_id });

        if (!student || !student.photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Set cache headers: 1 hour browser cache for photos (they don't change frequently)
        res.set('Cache-Control', 'public, max-age=3600');

        // Return photo directly - can be URL or base64
        res.json({ photo: student.photo, student_id: student.student_id });
    } catch (err) {
        console.error('Photo retrieval error:', err);
        res.status(500).json({ message: 'Error retrieving photo' });
    }
});

app.put('/apis/students/:student_id', auth, requireCoAdminOrAbove, timestampAuth, async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates.status;
        delete updates.role;

        // Allow rfid_code and rfid_status updates (for Unreadable marking)
        // Validate rfid_status if provided
        if (updates.rfid_status) {
            if (!VALID_RFID_STATUS.includes(updates.rfid_status)) {
                return res.status(400).json({ message: `RFID status must be one of: ${VALID_RFID_STATUS.join(', ')}` });
            }
        }

        delete updates.rfid_verified_at;
        delete updates.admin_verification_token;

        if (updates.first_name) {
            const validation = validateName(updates.first_name, "First name");
            if (!validation.valid) {
                return res.status(400).json({ message: validation.message });
            }
            updates.first_name = validation.value;
        }

        if (updates.middle_name && updates.middle_name.trim() !== "") {
            const validation = validateName(updates.middle_name, "Middle name");
            if (!validation.valid) {
                return res.status(400).json({ message: validation.message });
            }
            updates.middle_name = validation.value;
        }

        if (updates.last_name) {
            const validation = validateName(updates.last_name, "Last name");
            if (!validation.valid) {
                return res.status(400).json({ message: validation.message });
            }
            updates.last_name = validation.value;
        }

        if (updates.suffix) {
            const validation = validateSuffix(updates.suffix);
            if (!validation.valid) {
                return res.status(400).json({ message: validation.message });
            }
            updates.suffix = validation.value;
        }

        if (updates.semester) {
            const validation = validateSemester(updates.semester);
            if (!validation.valid) {
                return res.status(400).json({ message: validation.message });
            }
            updates.semester = validation.value;
        }

        if (updates.year_level) {
            const validation = validateYearLevel(updates.year_level);
            if (!validation.valid) {
                return res.status(400).json({ message: validation.message });
            }
            updates.year_level = validation.value;
        }

        if (updates.program && !VALID_PROGRAMS.includes(updates.program)) {
            return res.status(400).json({ message: "Program must be one of: BSCS, BSIT, BSIS, or BSM" });
        }

        // If rfid_code is being set and it's not an UNREADABLE code, and rfid_status is not explicitly set, mark as verified
        if (updates.rfid_code) {
            const isUnreadable = typeof updates.rfid_code === 'string' && updates.rfid_code.toUpperCase().startsWith('UNREADABLE');
            if (!isUnreadable && !updates.rfid_status) {
                updates.rfid_status = 'verified';
            }
        }

        if (updates.first_name || updates.middle_name !== undefined || updates.last_name || updates.suffix !== undefined) {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const currentStudent = await StudentModel.findOne({ student_id: req.params.student_id });
            if (currentStudent) {
                const first = updates.first_name || currentStudent.first_name || "";
                const mid = updates.middle_name !== undefined ? updates.middle_name : (currentStudent.middle_name || "");
                const last = updates.last_name || currentStudent.last_name || "";
                const suf = updates.suffix !== undefined ? updates.suffix : (currentStudent.suffix || "");
                updates.full_name = `${first} ${mid} ${last} ${suf}`.replace(/\s+/g, " ").trim();
            }
        }

        // Allow frontend to specify the original student id via header or body when renaming IDs.
        const originalIdHeader = req.headers['x-ssaam-original-student-id'] || req.body?.originalStudentId;
        const lookupId = originalIdHeader || req.params.student_id;

        // First, try updating in the current request college's collection
        let StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        let updated = await StudentModel.findOneAndUpdate(
            { student_id: lookupId },
            updates,
            { new: true, runValidators: true, validateModifiedOnly: true }
        );

        // If not found, attempt to find/update in the other college's collection
        if (!updated) {
            const otherCollege = req.college === 'COE' ? 'CCS' : 'COE';
            const OtherStudentModel = getCollegeModel(Student, CCS_Student, COE_Student, otherCollege);
            updated = await OtherStudentModel.findOneAndUpdate(
                { student_id: lookupId },
                updates,
                { new: true, runValidators: true, validateModifiedOnly: true }
            );
        }

        if (!updated) return res.status(404).json({ message: "Student not found" });

        await logAudit(req.college, req.master, 'STUDENT_UPDATED', 'Student', updated.student_id,
            updated.full_name || `${updated.first_name} ${updated.last_name}`.trim(),
            { fields_changed: Object.keys(updates).join(', ') });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/apis/students/:student_id', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        let foundCollege = req.college;
        let StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, foundCollege);
        let deleted = await StudentModel.findOneAndDelete({ student_id: req.params.student_id });

        // If not found and user is super admin, search across all other colleges
        if (!deleted && req.master?.isMaster && req.master?.role !== 'co-admin') {
            for (const college of ['CCS', 'COE', 'SOM', 'CNAHS']) {
                if (college === foundCollege) continue;
                const AltModel = getCollegeModel(Student, CCS_Student, COE_Student, college);
                const candidate = await AltModel.findOneAndDelete({ student_id: req.params.student_id });
                if (candidate) { deleted = candidate; foundCollege = college; StudentModel = AltModel; break; }
            }
        }

        if (!deleted)
            return res.status(404).json({ message: "Student not found." });

        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, foundCollege);

        // Also revoke any active session tokens for this user
        await SessionTokenModel.updateMany(
            { user_id: deleted._id },
            { is_revoked: true }
        );

        await logAudit(foundCollege, req.master, 'STUDENT_DELETED', 'Student', deleted.student_id,
            deleted.full_name || `${deleted.first_name} ${deleted.last_name}`.trim(),
            { program: deleted.program, year_level: deleted.year_level });
        res.json({ message: "Student deleted successfully." });
    } catch (err) {
        internalError(res, err);
    }
});

// ==================== COLLEGE-BASED COLLECTION PREFIXES ====================
// IMPLEMENTATION GUIDE:
// All non-master models are now available in both CCS and COE variants:
// - CCS_Model (stores in ccs_collectionname)
// - COE_Model (stores in coe_collectionname)
// - Master model (shared across colleges, no prefix)
//
// To use college-specific models in handlers:
//   const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
//   const student = await StudentModel.findOne({...});
//
// The req.college is automatically populated by middleware (CCS or COE)
// EXAMPLE Update Pattern:
//   OLD:  const student = await Student.findOne({ student_id });
//   NEW:  const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
//         const student = await StudentModel.findOne({ student_id });
//
// BULK UPDATE: Use this to find all handler lines that need updating:
//   grep -n "await Student\." SSAAM_VERCEL_BACKEND.js | head -20
//   grep -n "await Payment\." SSAAM_VERCEL_BACKEND.js | head -20
// Then use college-specific models in each identified line.
// ==================== END GUIDE ====================

app.post('/apis/students/login', studentAuth, timestampAuth, async (req, res) => {
    try {
        const { student_id, last_name } = req.body;

        if (!student_id || !last_name)
            return res.status(400).json({ message: "Student ID and Password required" });

        // Rate limit: 5 failed attempts per IP within 10 min → 15-min lockout
        const _ip  = _getClientIP(req);
        const _key = `stulogin:${_ip}`;
        const _chk = await _loginCheck(_key);
        if (_chk.blocked)
            return res.status(429).json({ message: `Too many failed attempts. Try again in ${_chk.remainingMins} minute${_chk.remainingMins === 1 ? '' : 's'}.` });

        // Get the claimed college from the request (what the frontend sent)
        const claimedCollege = req.college; // This comes from headers/theme selection
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, claimedCollege);
        const OtherStudentModel = claimedCollege === 'COE' ? CCS_Student : COE_Student;

        // First try to find student in the CLAIMED college
        let student = await StudentModel.findOne({ student_id })
            .select('-contributions -semester -full_name -school_year');

        // If not found in claimed college, check if they exist in the OTHER college
        if (!student) {
            const otherStudent = await OtherStudentModel.findOne({ student_id })
                .select('-contributions -semester -full_name -school_year');

            if (otherStudent) {
                // Student exists, but in the OTHER college - reject
                const otherCollege = claimedCollege === 'COE' ? 'CCS' : 'COE';
                return res.status(403).json({
                    message: `This student belongs to the ${otherCollege}. Please use ${otherCollege === 'CCS' ? 'the CCS' : 'the COE'} as your college to login portal.`,
                    belongsToCollege: otherCollege
                });
            }

            // Not found in either college
            await _loginRecord(_key, false);
            return res.status(400).json({ message: "Invalid Student ID or Password" });
        }

        // Now check settings for the college this student belongs to
        const settings = await getSettings(claimedCollege);
        if (!settings.userLogin.login) {
            return res.status(403).json({
                message: settings.userLogin.message || "Login is currently disabled.",
                loginDisabled: true
            });
        }

        // Check password: if custom_password is set, use bcrypt compare; otherwise check last_name
        let passwordValid = false;
        if (student.custom_password) {
            // User has set a custom password - compare with bcrypt
            passwordValid = await bcrypt.compare(last_name, student.custom_password);
        } else {
            // Default: compare with last_name (case-insensitive)
            passwordValid = student.last_name.toUpperCase() === last_name.trim().toUpperCase();
        }

        if (!passwordValid) {
            await _loginRecord(_key, false);
            return res.status(400).json({ message: "Invalid Student ID or Password" });
        }

        if (student.status === 'pending') {
            return res.status(403).json({
                message: "Your account is pending admin approval. Please wait for approval.",
                accountPending: true
            });
        }

        if (student.status === 'rejected') {
            return res.status(403).json({
                message: student.rejection_reason
                    ? `Your account was not approved. Reason: ${student.rejection_reason}`
                    : "Your account was not approved. Please contact the admin.",
                accountRejected: true
            });
        }

        const token = jwt.sign(
            { id: student._id, student_id: student.student_id, role: student.role, college: claimedCollege },
            JWT_SECRET_KEY,
            { expiresIn: "7d" }
        );

        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Use college-specific session token model based on the claimed college
        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, claimedCollege);

        await SessionTokenModel.create({
            token_hash: tokenHash,
            user_id: student._id,
            user_type: 'student',
            expires_at: expiresAt
        });

        // Flag to indicate if user should change their password (still using last name as password)
        const requiresPasswordUpdate = !student.custom_password;

        await _loginRecord(_key, true); // clear the counter on success
        res.cookie('ssaam_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            message: "Login successful",
            student,
            token,
            requiresPasswordUpdate
        });

    } catch (err) {
        internalError(res, err);
    }
});

app.post('/apis/students/logout', studentAuthWithToken, async (req, res) => {
    try {
        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
        await SessionTokenModel.updateOne(
            { _id: req.sessionToken._id },
            { is_revoked: true }
        );

        res.json({ message: "Logged out successfully" });
    } catch (err) {
        internalError(res, err);
    }
});

// Change password endpoint - allows setting custom password with symbols/numbers
app.post('/apis/students/change-password', async (req, res) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify JWT token and session
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET_KEY);
            const tokenHash = hashToken(token);
            const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
            const sessionToken = await SessionTokenModel.findOne({
                token_hash: tokenHash,
                is_revoked: false,
                expires_at: { $gt: new Date() }
            });
            if (!sessionToken) {
                return res.status(401).json({ message: "Session expired. Please login again." });
            }
        } catch (jwtError) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const { student_id, current_password, new_password } = req.body;

        if (!student_id || !current_password || !new_password) {
            return res.status(400).json({ message: "Student ID, current password, and new password are required" });
        }

        // Validate new password - allow letters, numbers, and symbols, min 6 chars
        if (new_password.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        if (new_password.length > 128) {
            return res.status(400).json({ message: "Password is too long (max 128 characters)" });
        }

        // Find the student (college-aware) — use college from JWT since this
        // endpoint has no middleware that sets req.college from headers
        const college = decoded.college || getCollegeFromRequest(req) || 'CCS';
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, college);
        const student = await StudentModel.findOne({ student_id });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Verify current password
        let currentPasswordValid = false;
        if (student.custom_password) {
            currentPasswordValid = await bcrypt.compare(current_password, student.custom_password);
        } else {
            currentPasswordValid = student.last_name.toUpperCase() === current_password.trim().toUpperCase();
        }

        if (!currentPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash and save the new password
        const hashedPassword = await bcrypt.hash(new_password, 12);
        await StudentModel.updateOne(
            { student_id },
            { custom_password: hashedPassword }
        );

        res.json({ message: "Password changed successfully!" });

    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ message: "Failed to change password. Please try again." });
    }
});

app.post('/apis/masters', auth, async (req, res) => {
    try {
        const { username, email, password, admin_creation_secret } = req.body;

        const MASTER_CREATION_SECRET = process.env.MASTER_CREATION_SECRET;
        if (!MASTER_CREATION_SECRET) {
            return res.status(500).json({ message: "Admin creation is not configured on this server" });
        }

        if (!admin_creation_secret || admin_creation_secret !== MASTER_CREATION_SECRET) {
            return res.status(403).json({ message: "Invalid admin creation secret" });
        }

        if (!username || !email || !password)
            return res.status(400).json({ message: "Username, email, and password required" });

        if (username.length < 4 || username.length > 32) {
            return res.status(400).json({ message: "Username must be 4-32 characters" });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Valid email address required" });
        }

        if (password.length < 12) {
            return res.status(400).json({ message: "Password must be at least 12 characters" });
        }

        const existing = await Master.findOne({ $or: [{ username }, { email }] });
        if (existing)
            return res.status(400).json({ message: "Username or email already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);

        const master = await Master.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Admin created successfully",
            master
        });

    } catch (err) {
        internalError(res, err);
    }
});

// Secret endpoint to create admin without authentication token
// Only requires secret key (no auth needed, no token validation)
// Returns JWT token encrypted with credentials for easy use
app.post("/apis/admin/create-secret", async (req, res) => {
    try {
        const { username, email, password, admin_secret, type } = req.body;

        // Validate type parameter (for future use - currently both use CCS)
        if (!type || !['CCS', 'COE'].includes(type)) {
            return res.status(400).json({
                message: "Type must be 'CCS' or 'COE'",
                code: 'INVALID_TYPE'
            });
        }

        // Validate admin secret against environment variable
        const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
        if (!ADMIN_SECRET_KEY) {
            return res.status(500).json({
                message: "Admin secret creation is not configured on this server",
                code: 'NOT_CONFIGURED'
            });
        }

        if (!admin_secret || admin_secret !== ADMIN_SECRET_KEY) {
            return res.status(403).json({
                message: "Invalid admin secret key",
                code: 'INVALID_SECRET'
            });
        }

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email, and password are required",
                code: 'MISSING_FIELDS'
            });
        }

        // Validate username format
        if (username.length < 4 || username.length > 32) {
            return res.status(400).json({
                message: "Username must be 4-32 characters",
                code: 'INVALID_USERNAME_LENGTH'
            });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({
                message: "Username can only contain letters, numbers, and underscores",
                code: 'INVALID_USERNAME_FORMAT'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Valid email address required",
                code: 'INVALID_EMAIL'
            });
        }

        // Validate password strength
        if (password.length < 12) {
            return res.status(400).json({
                message: "Password must be at least 12 characters",
                code: 'WEAK_PASSWORD'
            });
        }

        // Check if username or email already exists
        const existing = await Master.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(400).json({
                message: "Username or email already exists",
                code: 'DUPLICATE_CREDENTIALS'
            });
        }

        // Hash password and create master user
        const hashedPassword = await bcrypt.hash(password, 12);

        const master = await Master.create({
            username,
            email,
            password: hashedPassword
        });

        // Generate JWT token with admin credentials
        const token = jwt.sign(
            {
                id: master._id,
                username: master.username,
                email: master.email,
                isMaster: true
            },
            JWT_SECRET_KEY,
            { expiresIn: "7d" }
        );

        // Also create a session token for this admin
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
        await SessionTokenModel.create({
            token_hash: tokenHash,
            user_id: master._id,
            user_type: 'master',
            expires_at: expiresAt
        });

        res.cookie('ssaam_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({
            message: `Admin created successfully in ${type} database`,
            code: 'ADMIN_CREATED',
            token: token,
            admin: {
                id: master._id,
                username: master.username,
                email: master.email
            },
            type: type,
            expiresIn: "7 days"
        });

    } catch (err) {
        console.error('Admin secret creation error:', err);
        res.status(500).json({
            message: 'An internal server error occurred.',
            code: 'SERVER_ERROR'
        });
    }
});

app.post("/apis/masters/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Rate limit: 5 failed attempts per IP within 10 min → 15-min lockout
        const _ip  = _getClientIP(req);
        const _key = `mlogin:${_ip}`;
        const _chk = await _loginCheck(_key);
        if (_chk.blocked)
            return res.status(429).json({ message: `Too many failed attempts. Try again in ${_chk.remainingMins} minute${_chk.remainingMins === 1 ? '' : 's'}.` });

        const master = await Master.findOne({ username });
        if (!master) {
            await _loginRecord(_key, false);
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const valid = await bcrypt.compare(password, master.password);
        if (!valid) {
            await _loginRecord(_key, false);
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // When an admin logs in we honour whatever college was inferred from
        // the request (headers/theme).  Previously the token used the value
        // stored on the master record which is often blank, causing the token
        // to default to CCS and all subsequent queries (notifications, etc.)
        // to hit the CCS collections even if the user selected COE at login.
        //
        // Use req.college first, then fall back to stored value, then CCS.
        const tokenCollege = req.college || master.college || 'CCS';
        const token = jwt.sign(
            { id: master._id, username: master.username, isMaster: true, role: master.role || 'admin', college: tokenCollege },
            JWT_SECRET_KEY,
            { expiresIn: "7d" }
        );

        // if the backend inferred a different college than what's stored on
        // the master record, update it so future tokens (and headers) stay
        // in sync.  This makes the selection "stick" if the admin manually
        // chooses COE/CCS on the login page.
        if (master.college !== tokenCollege) {
            master.college = tokenCollege;
            await master.save();
        }

        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Use college-aware SessionToken model so admin sessions live in the
        // same prefixed collection that `auth` middleware queries.
        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
        await SessionTokenModel.create({
            token_hash: tokenHash,
            user_id: master._id,
            user_type: 'master',
            expires_at: expiresAt
        });

        await _loginRecord(_key, true); // clear the counter on success
        res.cookie('ssaam_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            message: "Login successful",
            token,
            master
        });

    } catch (err) {
        internalError(res, err);
    }
});

app.post('/apis/masters/logout', auth, async (req, res) => {
    try {
        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
        await SessionTokenModel.updateOne(
            { _id: req.sessionToken._id },
            { is_revoked: true }
        );

        res.json({ message: "Logged out successfully" });
    } catch (err) {
        internalError(res, err);
    }
});

// ============================================================
// Facial Recognition (Super Admin only)
// ------------------------------------------------------------
// These endpoints let the active super admin manage their enrolled face
// descriptors. Co-admins/treasurers are blocked by `requireSuperAdmin`.
// Descriptors are 128-float arrays produced client-side by face-api.js;
// the server only stores and returns them, no recognition is done on the
// backend so we never need raw images on the server.
// ============================================================
// Face data is stored per-master on each master's own document, so the only
// gate needed is `requireMaster` (a valid master JWT). The Settings sidebar
// link itself is already hidden from co-admins and treasurers, and each
// admin can only ever see/modify the faces on their OWN account.
app.get('/apis/masters/face', auth, requireMaster, async (req, res) => {
    try {
        const master = await Master.findById(req.master._id || req.master.id).select('face_descriptors');
        if (!master) return res.status(404).json({ message: 'Admin not found' });

        const faces = (master.face_descriptors || []).map(f => ({
            _id: f._id,
            label: f.label,
            descriptor: f.descriptor,
            photo: f.photo || null,
            created_at: f.created_at
        }));
        res.json({ faces, count: faces.length });
    } catch (err) {
        console.error('Face list error:', err);
        internalError(res, err);
    }
});

app.post('/apis/masters/face', auth, requireMaster, async (req, res) => {
    try {
        const { label, descriptor, photo } = req.body || {};

        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({
                message: 'descriptor must be a 128-element float array (face-api.js descriptor)'
            });
        }
        if (!descriptor.every(n => typeof n === 'number' && Number.isFinite(n))) {
            return res.status(400).json({ message: 'descriptor must contain finite numbers' });
        }

        const cleanLabel = (label || 'Face').toString().trim().slice(0, 64) || 'Face';
        const cleanPhoto = typeof photo === 'string' && photo.startsWith('data:image')
            ? photo.slice(0, 250000) // cap base64 thumbnail size
            : null;

        const master = await Master.findById(req.master._id || req.master.id);
        if (!master) return res.status(404).json({ message: 'Admin not found' });

        const existing = master.face_descriptors || [];
        if (existing.length >= 10) {
            return res.status(400).json({
                message: 'You can save up to 10 faces. Remove one before adding another.'
            });
        }

        // Use a direct $push update so we only modify face_descriptors. A
        // plain master.save() would re-validate every field on the document
        // (including legacy `role` values like 'administrator' that predate
        // the current enum) and reject the write.
        const entry = {
            _id: new mongoose.Types.ObjectId(),
            label: cleanLabel,
            descriptor,
            photo: cleanPhoto,
            created_at: new Date(),
        };
        await Master.updateOne(
            { _id: master._id },
            { $push: { face_descriptors: entry }, $set: { updated_at: new Date() } }
        );

        const saved = entry;
        res.json({
            message: 'Face enrolled',
            face: {
                _id: saved._id,
                label: saved.label,
                descriptor: saved.descriptor,
                photo: saved.photo,
                created_at: saved.created_at
            },
            count: master.face_descriptors.length
        });
    } catch (err) {
        console.error('Face enroll error:', err);
        internalError(res, err);
    }
});

app.patch('/apis/masters/face/:faceId', auth, requireMaster, async (req, res) => {
    try {
        const { faceId } = req.params;
        const { label } = req.body || {};

        const cleanLabel = (label || '').toString().trim().slice(0, 64);
        if (!cleanLabel) return res.status(400).json({ message: 'label is required' });

        const master = await Master.findById(req.master._id || req.master.id);
        if (!master) return res.status(404).json({ message: 'Admin not found' });

        const face = (master.face_descriptors || []).find(f => f._id.toString() === faceId);
        if (!face) return res.status(404).json({ message: 'Face not found' });

        await Master.updateOne(
            { _id: master._id, 'face_descriptors._id': new mongoose.Types.ObjectId(faceId) },
            { $set: { 'face_descriptors.$.label': cleanLabel, updated_at: new Date() } }
        );

        res.json({
            message: 'Face label updated',
            face: { _id: face._id, label: cleanLabel }
        });
    } catch (err) {
        console.error('Face rename error:', err);
        internalError(res, err);
    }
});

app.delete('/apis/masters/face/:faceId', auth, requireMaster, async (req, res) => {
    try {
        const { faceId } = req.params;
        const master = await Master.findById(req.master._id || req.master.id);
        if (!master) return res.status(404).json({ message: 'Admin not found' });

        const before = (master.face_descriptors || []).length;
        const remaining = (master.face_descriptors || []).filter(
            f => f._id.toString() !== faceId
        );
        if (remaining.length === before) {
            return res.status(404).json({ message: 'Face not found' });
        }
        // Direct update to avoid full-document validation against legacy
        // fields (e.g. older `role` values not in the current enum).
        await Master.updateOne(
            { _id: master._id },
            { $pull: { face_descriptors: { _id: new mongoose.Types.ObjectId(faceId) } },
              $set: { updated_at: new Date() } }
        );
        res.json({ message: 'Face removed', count: remaining.length });
    } catch (err) {
        console.error('Face delete error:', err);
        internalError(res, err);
    }
});

// ---------------------------------------------------------------------------
// Student Face ID endpoints (self-service biometric enrollment).
// Each student keeps exactly one face profile. To prevent abuse we:
//   1. Enforce a 7-day cooldown between updates.
//   2. Reject any new descriptor that's "too similar" to another student's
//      enrolled face in the same college (so you can't impersonate a
//      classmate by enrolling a photo of them).
// ---------------------------------------------------------------------------
const STUDENT_FACE_LIMIT = 1;
const STUDENT_FACE_COOLDOWN_DAYS = 7;
// Uniqueness threshold for enrollment: reject if a new descriptor is closer
// than this distance to any existing student's descriptor.
// Lowered from 0.45 → 0.35 to eliminate false "already registered" rejections:
// at 0.45 students who merely look similar (same lighting/angle/ethnicity)
// were being blocked. 0.35 only fires when the face is extremely close —
// effectively the same person trying to re-register under a different account.
const STUDENT_FACE_UNIQUENESS_THRESHOLD = 0.35;

// Squared euclidean distance — same shape as the kiosk uses, kept inline so
// we don't hit a function-call cost in the per-student loop.
function _euclid128(a, b) {
    let sum = 0;
    for (let i = 0; i < 128; i++) {
        const d = a[i] - b[i];
        sum += d * d;
    }
    return Math.sqrt(sum);
}

function _faceCooldownInfo(faceUpdatedAt) {
    if (!faceUpdatedAt) return { in_cooldown: false, next_update_allowed_at: null };
    const next = new Date(new Date(faceUpdatedAt).getTime() + STUDENT_FACE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    return { in_cooldown: next.getTime() > Date.now(), next_update_allowed_at: next };
}

app.get('/apis/students/face', studentAuthWithToken, async (req, res) => {
    try {
        const student = req.student;
        const faces = (student.face_descriptors || []).map(f => ({
            _id: f._id,
            label: f.label,
            photo: f.photo,
            created_at: f.created_at
            // descriptor intentionally omitted to keep payloads small
        }));
        const cd = _faceCooldownInfo(student.face_updated_at);
        res.json({
            faces,
            count: faces.length,
            limit: STUDENT_FACE_LIMIT,
            face_updated_at: student.face_updated_at || null,
            cooldown_days: STUDENT_FACE_COOLDOWN_DAYS,
            in_cooldown: cd.in_cooldown,
            next_update_allowed_at: cd.next_update_allowed_at
        });
    } catch (err) {
        console.error('Student face list error:', err);
        internalError(res, err);
    }
});

app.post('/apis/students/face', studentAuthWithToken, async (req, res) => {
    try {
        const { descriptor, label, photo } = req.body || {};
        if (!Array.isArray(descriptor) || descriptor.length !== 128 || !descriptor.every(n => Number.isFinite(n))) {
            return res.status(400).json({ message: "A valid 128-float face descriptor is required." });
        }
        const student = req.student;
        const isReplacement = (student.face_descriptors || []).length > 0;

        // 1. Weekly cooldown: only kicks in for replacements (first enrollment is free).
        if (isReplacement) {
            const cd = _faceCooldownInfo(student.face_updated_at);
            if (cd.in_cooldown) {
                return res.status(429).json({
                    message: `You can only update your Face ID once every ${STUDENT_FACE_COOLDOWN_DAYS} days. Try again on ${cd.next_update_allowed_at.toLocaleDateString()}.`,
                    code: 'FACE_COOLDOWN',
                    next_update_allowed_at: cd.next_update_allowed_at,
                    cooldown_days: STUDENT_FACE_COOLDOWN_DAYS
                });
            }
        }

        // 2. Uniqueness across the same college's other students. We pull only
        // the descriptor field to keep the payload small.
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college || 'CCS');
        const others = await StudentModel.find(
            {
                student_id: { $ne: student.student_id },
                'face_descriptors.0': { $exists: true }
            },
            { student_id: 1, face_descriptors: 1 }
        ).lean();
        let nearest = { distance: Infinity, student_id: null };
        for (const o of others) {
            for (const fd of (o.face_descriptors || [])) {
                if (!Array.isArray(fd.descriptor) || fd.descriptor.length !== 128) continue;
                const dist = _euclid128(descriptor, fd.descriptor);
                if (dist < nearest.distance) nearest = { distance: dist, student_id: o.student_id };
            }
        }
        if (nearest.distance < STUDENT_FACE_UNIQUENESS_THRESHOLD) {
            console.log(`[FaceEnroll] Rejected uniqueness for ${student.student_id}: nearest=${nearest.student_id} dist=${nearest.distance.toFixed(3)}`);
            return res.status(409).json({
                message: "This face appears too similar to another student's registered face. If this is your own face and you believe this is wrong, please contact your admin.",
                code: 'FACE_NOT_UNIQUE',
                nearest_distance: Number(nearest.distance.toFixed(3)),
                threshold: STUDENT_FACE_UNIQUENESS_THRESHOLD
            });
        }

        const entry = {
            label: (label && String(label).trim()) || 'My Face',
            descriptor,
            photo: photo || null,
            created_at: new Date()
        };
        // Replace-or-insert: clear the existing array first, then push the new entry.
        // Done in a single update for atomicity.
        await StudentModel.updateOne(
            { student_id: student.student_id },
            {
                $set: {
                    face_descriptors: [entry],
                    face_updated_at: new Date()
                }
            }
        );
        const updated = await StudentModel.findOne({ student_id: student.student_id }, { face_descriptors: 1, face_updated_at: 1 }).lean();
        const faces = (updated?.face_descriptors || []).map(f => ({
            _id: f._id, label: f.label, photo: f.photo, created_at: f.created_at
        }));
        const cd = _faceCooldownInfo(updated?.face_updated_at);
        res.json({
            message: isReplacement ? 'Face ID updated' : 'Face ID enrolled',
            faces,
            count: faces.length,
            limit: STUDENT_FACE_LIMIT,
            face_updated_at: updated?.face_updated_at || null,
            cooldown_days: STUDENT_FACE_COOLDOWN_DAYS,
            in_cooldown: cd.in_cooldown,
            next_update_allowed_at: cd.next_update_allowed_at
        });
    } catch (err) {
        console.error('Student face enroll error:', err);
        internalError(res, err);
    }
});

app.delete('/apis/students/face/:faceId', studentAuthWithToken, async (req, res) => {
    try {
        const { faceId } = req.params;
        const student = req.student;
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college || 'CCS');
        const result = await StudentModel.updateOne(
            { student_id: student.student_id },
            { $pull: { face_descriptors: { _id: new mongoose.Types.ObjectId(faceId) } } }
        );
        if (!result.modifiedCount) {
            return res.status(404).json({ message: 'Face not found' });
        }
        const updated = await StudentModel.findOne({ student_id: student.student_id }, { face_descriptors: 1, face_updated_at: 1 }).lean();
        const faces = (updated?.face_descriptors || []).map(f => ({
            _id: f._id, label: f.label, photo: f.photo, created_at: f.created_at
        }));
        const cd = _faceCooldownInfo(updated?.face_updated_at);
        res.json({
            message: 'Face removed',
            faces, count: faces.length, limit: STUDENT_FACE_LIMIT,
            face_updated_at: updated?.face_updated_at || null,
            cooldown_days: STUDENT_FACE_COOLDOWN_DAYS,
            in_cooldown: cd.in_cooldown,
            next_update_allowed_at: cd.next_update_allowed_at
        });
    } catch (err) {
        console.error('Student face delete error:', err);
        internalError(res, err);
    }
});

// ---------------------------------------------------------------------------
// Student-scoped face check-in (with liveness challenge token).
// Flow:
//   1. Client calls POST /apis/attendance/sessions/:id/face-challenge to
//      receive a short-lived signed token + a list of liveness challenges
//      (e.g. ['blink', 'turn_left']).
//   2. Client guides the user through the challenges locally using
//      face-api.js landmarks, capturing samples the whole time.
//   3. Client calls POST /apis/attendance/sessions/:id/check-face-student
//      with the token + the freshly computed descriptor. Server verifies
//      the token (signature, expiry, single-use, bound to this student +
//      session), confirms the descriptor matches THIS student's enrolled
//      face, then delegates to the unified attendance handler.
// ---------------------------------------------------------------------------
const FACE_CHALLENGE_TOKEN_TTL_SECONDS = 180;
const FACE_CHALLENGE_TOKEN_PURPOSE = 'face_attendance_challenge_v1';
// In-memory single-use registry. Keys are JWT `jti` strings, values are the
// epoch ms when the entry can be evicted (slightly after token expiry).
const _usedFaceChallengeTokens = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [jti, expiresAt] of _usedFaceChallengeTokens.entries()) {
        if (expiresAt < now) _usedFaceChallengeTokens.delete(jti);
    }
}, 60 * 1000).unref?.();

function _pickFaceChallenges() {
    // ONE random head-turn challenge. A single turn (left OR right, picked
    // randomly per request) still defeats a held-up still photo because the
    // client must show the head actually rotating to that side, but cuts the
    // student-facing dance roughly in half. Combined with the descriptor
    // match against the enrolled face on the backend, this keeps the
    // anti-spoof guarantee while making the check-in feel near-instant.
    return [Math.random() < 0.5 ? 'turn_left' : 'turn_right'];
}

function _signFaceChallengeToken({ student_id, session_id, college, challenges }) {
    const jti = `fct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const token = jwt.sign(
        {
            purpose: FACE_CHALLENGE_TOKEN_PURPOSE,
            student_id,
            session_id,
            college,
            challenges,
            jti
        },
        JWT_SECRET_KEY,
        { expiresIn: FACE_CHALLENGE_TOKEN_TTL_SECONDS }
    );
    return { token, jti, expires_at: new Date(Date.now() + FACE_CHALLENGE_TOKEN_TTL_SECONDS * 1000) };
}

function _verifyFaceChallengeToken(token, { expected_student_id, expected_session_id }) {
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET_KEY);
    } catch (_) {
        return { ok: false, reason: 'invalid_or_expired' };
    }
    if (decoded.purpose !== FACE_CHALLENGE_TOKEN_PURPOSE) return { ok: false, reason: 'wrong_purpose' };
    if (decoded.student_id !== expected_student_id) return { ok: false, reason: 'student_mismatch' };
    if (decoded.session_id !== expected_session_id) return { ok: false, reason: 'session_mismatch' };
    if (!decoded.jti || _usedFaceChallengeTokens.has(decoded.jti)) return { ok: false, reason: 'already_used' };
    return { ok: true, decoded };
}

app.post('/apis/attendance/sessions/:sessionId/face-challenge', studentAuthWithToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const student = req.student;
        if (!(student.face_descriptors || []).length) {
            return res.status(412).json({
                message: 'You have not registered a Face ID yet. Please set up your Face ID first.',
                code: 'FACE_NOT_ENROLLED'
            });
        }
        // Confirm session exists (and is reachable by this college's models).
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college || 'CCS');
        const session = await SessionModel.findById(sessionId).lean();
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        const challenges = _pickFaceChallenges();
        const { token, expires_at } = _signFaceChallengeToken({
            student_id: student.student_id,
            session_id: sessionId,
            college: req.college || 'CCS',
            challenges
        });
        res.json({ challenge_token: token, challenges, expires_at, ttl_seconds: FACE_CHALLENGE_TOKEN_TTL_SECONDS });
    } catch (err) {
        console.error('face-challenge error:', err);
        internalError(res, err);
    }
});

app.post('/apis/attendance/sessions/:sessionId/check-face-student', studentAuthWithToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const student = req.student;
        const {
            challenge_token,
            descriptor,
            completed_challenges,
            samples_count,
            latitude, longitude, accuracy
        } = req.body || {};

        if (!challenge_token) {
            return res.status(400).json({ message: 'Missing liveness challenge token.', code: 'NO_CHALLENGE_TOKEN' });
        }
        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({ message: 'A valid 128-float face descriptor is required.' });
        }
        if (!Array.isArray(completed_challenges) || !completed_challenges.length) {
            return res.status(400).json({ message: 'Liveness challenges were not completed.', code: 'CHALLENGES_INCOMPLETE' });
        }
        if (!Number.isFinite(samples_count) || samples_count < 10) {
            // Anti-static-image floor: a real liveness flow with a single
            // head-turn comfortably produces 12-25 valid frames in ~1.5s.
            // Anything well below 10 is almost certainly a single still
            // image being replayed and is rejected.
            return res.status(400).json({ message: 'Not enough live frames detected. Please try again with the camera held steady.', code: 'INSUFFICIENT_LIVENESS_SAMPLES' });
        }

        const v = _verifyFaceChallengeToken(challenge_token, {
            expected_student_id: student.student_id,
            expected_session_id: sessionId
        });
        if (!v.ok) {
            return res.status(401).json({ message: 'Liveness challenge expired or invalid. Please try again.', code: 'BAD_CHALLENGE_TOKEN', reason: v.reason });
        }
        const issued = v.decoded.challenges || [];
        // The set of completed challenges must cover every issued challenge —
        // we don't care about extra entries the client may report, only that
        // each required one is present.
        const missing = issued.filter(c => !completed_challenges.includes(c));
        if (missing.length) {
            return res.status(400).json({ message: `Required liveness step(s) not completed: ${missing.join(', ')}.`, code: 'CHALLENGES_MISSING', missing });
        }
        // Mark token used. Eviction time mirrors the JWT expiry plus a small
        // grace window so a successful retry doesn't leak the slot.
        _usedFaceChallengeTokens.set(v.decoded.jti, Date.now() + (FACE_CHALLENGE_TOKEN_TTL_SECONDS + 30) * 1000);

        // Verify descriptor matches THIS student's enrolled face. We're the
        // only flow that needs to match; we already know the identity from
        // the JWT, so this is purely a "are you really you?" check.
        const enrolled = (student.face_descriptors || [])[0];
        if (!enrolled || !Array.isArray(enrolled.descriptor)) {
            return res.status(412).json({ message: 'Your Face ID is no longer enrolled. Please set it up again.', code: 'FACE_NOT_ENROLLED' });
        }
        const dist = _euclid128(descriptor, enrolled.descriptor);
        if (dist > STUDENT_FACE_UNIQUENESS_THRESHOLD) {
            console.log(`[FaceCheckIn] Reject student=${student.student_id} dist=${dist.toFixed(3)}`);
            return res.status(401).json({
                message: "We couldn't confirm it's you. Please face the camera in good light and try again.",
                code: 'FACE_MISMATCH',
                distance: Number(dist.toFixed(3))
            });
        }

        // Synthesise the body so the unified handler runs the exact same
        // event-status, geofence, and duplicate-prevention checks as RFID.
        req.body = {
            student_id: student.student_id,
            identifier_type: 'student_id',
            source: 'face',
            face_match_distance: Number(dist.toFixed(3)),
            latitude, longitude, accuracy
        };
        return sessionAttendanceCheck(req, res);
    } catch (err) {
        console.error('check-face-student error:', err);
        internalError(res, err);
    }
});

app.get('/apis/masters', auth, requireMaster, requireSuperAdmin, async (req, res) => {
    try {
        const masters = await Master.find({ role: { $in: ['admin', null] } }).select('-password');
        res.json(masters);
    } catch (err) {
        internalError(res, err);
    }
});

// ==================== CO-ADMIN MANAGEMENT (Super Admin only) ====================

// Create a co-admin account (super admin only)
app.post('/apis/co-admin', auth, requireMaster, requireSuperAdmin, async (req, res) => {
    try {
        const { username, email, password, college } = req.body;

        if (!username || !email || !password || !college) {
            return res.status(400).json({ message: "Username, email, password, and college are required" });
        }

        const validColleges = ['CCS', 'COE', 'SOM', 'CNAHS'];
        if (!validColleges.includes(college)) {
            return res.status(400).json({ message: `College must be one of: ${validColleges.join(', ')}` });
        }

        if (username.length < 4 || username.length > 32) {
            return res.status(400).json({ message: "Username must be 4-32 characters" });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Valid email address required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const existing = await Master.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const coAdmin = await Master.create({
            username,
            email,
            password: hashedPassword,
            role: 'co-admin',
            college
        });

        res.status(201).json({
            message: `Co-admin for ${college} created successfully`,
            co_admin: coAdmin
        });
    } catch (err) {
        internalError(res, err);
    }
});

// List all co-admins and treasurers (super admin only)
app.get('/apis/co-admin', auth, requireMaster, requireSuperAdmin, async (req, res) => {
    try {
        const coAdmins = await Master.find({ role: 'co-admin' }).select('-password');
        const treasurers = await Master.find({ role: 'treasurer' }).select('-password');
        res.json({ co_admins: coAdmins, treasurers });
    } catch (err) {
        internalError(res, err);
    }
});

// Get a specific co-admin (super admin only)
app.get('/apis/co-admin/:id', auth, requireMaster, requireSuperAdmin, async (req, res) => {
    try {
        const coAdmin = await Master.findOne({ _id: req.params.id, role: 'co-admin' }).select('-password');
        if (!coAdmin) return res.status(404).json({ message: "Co-admin not found" });
        res.json({ co_admin: coAdmin });
    } catch (err) {
        internalError(res, err);
    }
});

// Update a co-admin (super admin only)
app.put('/apis/co-admin/:id', auth, requireMaster, requireSuperAdmin, async (req, res) => {
    try {
        const { username, email, password, college } = req.body;

        const coAdmin = await Master.findOne({ _id: req.params.id, role: 'co-admin' });
        if (!coAdmin) return res.status(404).json({ message: "Co-admin not found" });

        if (username) {
            if (username.length < 4 || username.length > 32) {
                return res.status(400).json({ message: "Username must be 4-32 characters" });
            }
            const exists = await Master.findOne({ username, _id: { $ne: coAdmin._id } });
            if (exists) return res.status(400).json({ message: "Username already taken" });
            coAdmin.username = username;
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) return res.status(400).json({ message: "Valid email required" });
            const exists = await Master.findOne({ email, _id: { $ne: coAdmin._id } });
            if (exists) return res.status(400).json({ message: "Email already in use" });
            coAdmin.email = email;
        }

        if (college) {
            const validColleges = ['CCS', 'COE', 'SOM', 'CNAHS'];
            if (!validColleges.includes(college)) {
                return res.status(400).json({ message: `College must be one of: ${validColleges.join(', ')}` });
            }
            coAdmin.college = college;
        }

        if (password) {
            if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
            coAdmin.password = await bcrypt.hash(password, 12);
        }

        await coAdmin.save();

        res.json({
            message: "Co-admin updated successfully",
            co_admin: coAdmin
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Assign an existing Master account as co-admin or treasurer by student_id/username (super admin only)
app.post('/apis/co-admin/assign', auth, requireMaster, requireSuperAdmin, async (req, res) => {
    try {
        const { student_id, college, role: assignedRole } = req.body;
        if (!student_id || !college) {
            return res.status(400).json({ message: "student_id and college are required" });
        }
        const validColleges = ['CCS', 'COE', 'SOM', 'CNAHS'];
        if (!validColleges.includes(college)) {
            return res.status(400).json({ message: `College must be one of: ${validColleges.join(', ')}` });
        }
        const targetRole = assignedRole === 'treasurer' ? 'treasurer' : 'co-admin';
        // Find existing Master account where username matches the student_id
        const master = await Master.findOne({ username: student_id });
        if (!master) {
            return res.status(404).json({ message: `No admin account found with Student ID "${student_id}". The account must already be registered as an admin.` });
        }
        // Check if another account with this same role is already assigned to this college
        const existing = await Master.findOne({ role: targetRole, college, _id: { $ne: master._id } });
        if (existing) {
            const roleName = targetRole === 'treasurer' ? 'treasurer' : 'co-admin';
            return res.status(400).json({ message: `College ${college} already has a ${roleName}. Remove the existing ${roleName} first.` });
        }
        master.role = targetRole;
        master.college = college;
        master.updated_at = new Date();
        await master.save();
        const roleName = targetRole === 'treasurer' ? 'treasurer' : 'co-admin';
        res.json({ message: `${master.username} assigned as ${roleName} for ${college}`, co_admin: master });
    } catch (err) {
        internalError(res, err);
    }
});

// Delete a co-admin or treasurer (super admin only)
app.delete('/apis/co-admin/:id', auth, requireMaster, requireSuperAdmin, async (req, res) => {
    try {
        const target = await Master.findOne({ _id: req.params.id, role: { $in: ['co-admin', 'treasurer'] } });
        if (!target) return res.status(404).json({ message: "Co-admin or treasurer not found" });

        await Master.deleteOne({ _id: req.params.id });

        const roleName = target.role === 'treasurer' ? 'Treasurer' : 'Co-admin';
        res.json({ message: `${roleName} ${target.username} deleted successfully` });
    } catch (err) {
        internalError(res, err);
    }
});

// Transfer co-admin role to another master account (super admin only)
// Allows the super admin to move a college's co-admin assignment to a different account
app.post('/apis/co-admin/:id/transfer', auth, requireMaster, requireSuperAdmin, async (req, res) => {
    try {
        const { target_id, target_username } = req.body;

        const sourceCoAdmin = await Master.findOne({ _id: req.params.id, role: 'co-admin' });
        if (!sourceCoAdmin) return res.status(404).json({ message: "Source co-admin not found" });

        let targetMaster;
        if (target_id) {
            targetMaster = await Master.findById(target_id);
        } else if (target_username) {
            targetMaster = await Master.findOne({ username: target_username });
        }

        if (!targetMaster) return res.status(404).json({ message: "Target account not found" });
        if (targetMaster._id.toString() === sourceCoAdmin._id.toString()) {
            return res.status(400).json({ message: "Source and target accounts are the same" });
        }

        const college = sourceCoAdmin.college;

        // Demote source co-admin (or delete if they have no other purpose)
        await Master.deleteOne({ _id: sourceCoAdmin._id });

        // Assign the co-admin role and college to the target
        targetMaster.role = 'co-admin';
        targetMaster.college = college;
        targetMaster.updated_at = new Date();
        await targetMaster.save();

        res.json({
            message: `Co-admin role for ${college} transferred to ${targetMaster.username}`,
            co_admin: targetMaster
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Co-admin self-transfer: only the co-admin can transfer their own role
app.post('/apis/co-admin/me/transfer', auth, requireMaster, async (req, res) => {
    try {
        const callerId = req.master.id || req.master._id;
        const caller = await Master.findById(callerId);
        if (!caller || caller.role !== 'co-admin') {
            return res.status(403).json({ message: "Only co-admins can self-transfer their role" });
        }

        const { target_username } = req.body;
        if (!target_username) return res.status(400).json({ message: "target_username is required" });

        const target = await Master.findOne({ username: target_username });
        if (!target) return res.status(404).json({ message: "Target account not found" });
        if (target._id.toString() === caller._id.toString()) {
            return res.status(400).json({ message: "Cannot transfer role to yourself" });
        }

        const college = caller.college;

        // Remove source co-admin record
        await Master.deleteOne({ _id: caller._id });

        // Grant co-admin role and college to the target
        target.role = 'co-admin';
        target.college = college;
        target.updated_at = new Date();
        await target.save();

        res.json({ message: `Co-admin role for ${college} transferred to ${target.username}` });
    } catch (err) {
        internalError(res, err);
    }
});

// ==================== ADMIN PROFILE ENDPOINTS ====================

// Get current admin/co-admin own profile
app.get('/apis/admin/me', auth, requireMaster, async (req, res) => {
    try {
        const master = await Master.findById(req.master.id || req.master._id).select('-password');
        if (!master) return res.status(404).json({ message: "Admin account not found" });
        res.json(master);
    } catch (err) {
        internalError(res, err);
    }
});

// Update current admin/co-admin own profile
app.put('/apis/admin/me', auth, requireMaster, async (req, res) => {
    try {
        const { full_name, phone, bio, photo, current_password, new_password } = req.body;

        const master = await Master.findById(req.master.id || req.master._id);
        if (!master) return res.status(404).json({ message: "Admin account not found" });

        if (typeof full_name === 'string') master.full_name = full_name.trim() || null;
        if (typeof phone === 'string') master.phone = phone.trim() || null;
        if (typeof bio === 'string') master.bio = bio.trim() || null;
        if (typeof photo === 'string') master.photo = photo.trim() || null;

        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ message: "Current password is required to set a new password" });
            }
            const passwordMatch = await bcrypt.compare(current_password, master.password);
            if (!passwordMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            if (new_password.length < 8) {
                return res.status(400).json({ message: "New password must be at least 8 characters" });
            }
            master.password = await bcrypt.hash(new_password, 12);
        }

        master.updated_at = new Date();
        await master.save();

        res.json({
            message: "Profile updated successfully",
            profile: master
        });
    } catch (err) {
        internalError(res, err);
    }
});

app.post('/apis/validate-token', async (req, res) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({ valid: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, JWT_SECRET_KEY);

        const tokenHash = hashToken(token);
        const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
        const sessionToken = await SessionTokenModel.findOne({
            token_hash: tokenHash,
            is_revoked: false,
            expires_at: { $gt: new Date() }
        });

        if (!sessionToken) {
            return res.status(401).json({ valid: false, message: "Session expired or invalid" });
        }

        res.json({
            valid: true,
            user: decoded,
            expiresAt: sessionToken.expires_at
        });
    } catch (err) {
        res.status(401).json({ valid: false, message: "Invalid token" });
    }
});

// Verify admin status - checks if the current token is a valid admin token
// This endpoint is used by the frontend to verify admin status on page load
// The isMaster flag in the JWT cannot be forged, so this is secure
app.post('/apis/admin/verify', auth, async (req, res) => {
    try {
        // Check if the JWT token has isMaster flag
        if (!req.master.isMaster) {
            return res.status(403).json({
                isAdmin: false,
                message: "Not an admin token",
                code: 'NOT_ADMIN'
            });
        }

        // Also verify the session is for a master user
        if (req.sessionToken && req.sessionToken.user_type !== 'master') {
            return res.status(403).json({
                isAdmin: false,
                message: "Invalid admin session",
                code: 'INVALID_ADMIN_SESSION'
            });
        }

        // Return admin info from JWT (cannot be forged)
        res.json({
            isAdmin: true,
            username: req.master.username,
            isPrimaryAdmin: req.master.username === PRIMARY_ADMIN_USERNAME,
            sessionExpiresAt: req.sessionToken?.expires_at
        });
    } catch (err) {
        res.status(500).json({ isAdmin: false, message: err.message });
    }
});


app.get('/apis/settings', studentAuth, async (req, res) => {
    try {
        const settings = await getSettings(req.college);
        res.json(settings);
    } catch (err) {
        internalError(res, err);
    }
});

app.put('/apis/settings', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const { userRegister, userLogin, rfidScanner } = req.body;

        const SettingsModel = getCollegeModel(Settings, CCS_Settings, COE_Settings, req.college);
        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({
                userRegister: userRegister || { register: true, message: "" },
                userLogin: userLogin || { login: true, message: "" },
                rfidScanner: rfidScanner || {
                    checkInEnabled: true,
                    checkOutEnabled: false,
                    autoDisableCheckIn: false,
                    autoDisableCheckOut: false,
                    checkInDisableAt: null,
                    checkOutDisableAt: null,
                    lateThresholdMinutes: 30
                }
            });
        } else {
            if (userRegister !== undefined) {
                settings.userRegister = userRegister;
            }
            if (userLogin !== undefined) {
                settings.userLogin = userLogin;
            }
            if (rfidScanner !== undefined) {
                settings.rfidScanner = {
                    ...settings.rfidScanner,
                    ...rfidScanner
                };
            }
            if (req.body.semester !== undefined) {
                settings.semester = req.body.semester;
            }
            if (req.body.schoolYear !== undefined) {
                settings.schoolYear = req.body.schoolYear;
            }
        }

        await settings.save();
        res.json({
            message: "Settings updated successfully",
            settings
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Cleanup Endpoint - Remove unused fields from all students to free up space
app.post('/apis/admin/cleanup-unused-fields', auth, async (req, res) => {
    try {
        // Only allow primary admin
        if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
            return res.status(403).json({
                message: `Only the primary admin can perform database cleanup`,
                code: 'NOT_PRIMARY_ADMIN'
            });
        }

        // Remove unused fields: contributions, semester, full_name, school_year
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const result = await StudentModel.updateMany(
            {},
            { $unset: { contributions: 1, semester: 1, full_name: 1, school_year: 1 } }
        );

        res.json({
            message: "Unused fields removed successfully",
            modifiedCount: result.modifiedCount,
            removedFields: ['contributions', 'semester', 'full_name', 'school_year'],
            details: `${result.modifiedCount} student records updated and cleaned up`
        });

    } catch (err) {
        console.error('Cleanup error:', err);
        internalError(res, err);
    }
});




// [REMOVED] DEBUG endpoint for enriching payment records


// MongoDB Migration Endpoint - Copy all data to another MongoDB instance
app.post('/apis/admin/migrate-database', auth, async (req, res) => {
    try {
        // Only allow primary admin
        if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
            return res.status(403).json({
                message: `Only the primary admin can perform database migration`,
                code: 'NOT_PRIMARY_ADMIN'
            });
        }

        const { destination_uri } = req.body;

        if (!destination_uri || !destination_uri.trim()) {
            return res.status(400).json({ message: "Destination MongoDB URI is required" });
        }

        // Validate that it's a different URI (compare against known configured URIs)
        const trimmedDest = destination_uri.trim();
        if (trimmedDest === MONGO_URI) {
            return res.status(400).json({ message: "Destination URI must be different from source URI" });
        }

        let sourceClient;
        let destClient;

        try {
            // Get source database from current mongoose connection
            const sourceDb = mongoose.connection.db;

            if (!sourceDb) {
                return res.status(500).json({ message: "Source database not connected" });
            }

            // Connect to destination database using MongoDB native driver with SSL options
            destClient = new MongoClient(destination_uri, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 30000,
                connectTimeoutMS: 30000,
                retryWrites: false,
                ssl: true,
                tls: true,
                tlsAllowInvalidCertificates: false,
                maxPoolSize: 10,
                minPoolSize: 2
            });

            console.log('Connecting to destination database...');
            await destClient.connect();
            console.log('Connected to destination database');

            const destDb = destClient.db();

            // Get list of all collections from source database
            const collections = await sourceDb.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);

            let migratedCount = 0;
            let errors = [];

            // Copy each collection
            for (const collectionName of collectionNames) {
                try {
                    const sourceCollection = sourceDb.collection(collectionName);
                    const destCollection = destDb.collection(collectionName);

                    // Get all documents from source
                    const documents = await sourceCollection.find({}).toArray();

                    if (documents.length > 0) {
                        // Clear destination collection first
                        await destCollection.deleteMany({});
                        // Insert all documents
                        await destCollection.insertMany(documents);
                    }

                    migratedCount++;
                } catch (collectionErr) {
                    errors.push({
                        collection: collectionName,
                        error: collectionErr.message
                    });
                    console.error(`Error migrating collection ${collectionName}:`, collectionErr.message);
                }
            }

            // Close destination connection
            await destClient.close();

            res.json({
                message: "Database migration completed successfully",
                migratedCollections: migratedCount,
                totalCollections: collectionNames.length,
                errors: errors.length > 0 ? errors : null,
                success: errors.length === 0
            });
        } catch (migrationErr) {
            if (destClient) {
                await destClient.close().catch(() => { });
            }
            throw migrationErr;
        }
    } catch (err) {
        console.error('Database migration error:', err);
        res.status(500).json({
            message: "Database migration failed: " + err.message,
            error: err.message
        });
    }
});

// [REMOVED] PAYMENT RECORD CONSOLIDATION endpoints


// ==================== PASSWORD RESET ENDPOINTS ====================

// Rate limiting for password reset requests
const passwordResetAttempts = new Map();
const PASSWORD_RESET_COOLDOWN_MS = 60000; // 1 minute between requests
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPTS_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout after 5 failed attempts

function cleanupPasswordResetAttempts() {
    const now = Date.now();
    for (const [key, data] of passwordResetAttempts.entries()) {
        if (now - data.lastAttempt > FAILED_ATTEMPTS_LOCKOUT_MS) {
            passwordResetAttempts.delete(key);
        }
    }
}
setInterval(cleanupPasswordResetAttempts, 60000);

// Request Password Reset - Send verification code to email
app.post('/apis/password-reset/request', studentAuth, timestampAuth, async (req, res) => {
    try {
        const { student_id, email } = req.body;

        if (!student_id || !email) {
            return res.status(400).json({ message: "Student ID and email are required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Rate limiting by IP
        const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            'unknown';
        const rateLimitKey = `reset:${clientIP}:${student_id}`;
        const attemptData = passwordResetAttempts.get(rateLimitKey) || { count: 0, lastAttempt: 0 };
        const now = Date.now();

        // Check if locked out
        if (attemptData.count >= MAX_FAILED_ATTEMPTS && (now - attemptData.lastAttempt) < FAILED_ATTEMPTS_LOCKOUT_MS) {
            const remainingMs = FAILED_ATTEMPTS_LOCKOUT_MS - (now - attemptData.lastAttempt);
            const remainingMins = Math.ceil(remainingMs / 60000);
            return res.status(429).json({ message: `Too many attempts. Please try again in ${remainingMins} minutes.` });
        }

        // Check cooldown
        if ((now - attemptData.lastAttempt) < PASSWORD_RESET_COOLDOWN_MS) {
            const remainingSeconds = Math.ceil((PASSWORD_RESET_COOLDOWN_MS - (now - attemptData.lastAttempt)) / 1000);
            return res.status(429).json({ message: `Please wait ${remainingSeconds} seconds before requesting again.` });
        }

        // Find the student - MUST match BOTH student_id AND email exactly
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const student = await StudentModel.findOne({
            student_id,
            email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });

        // Always return same message to prevent enumeration
        if (!student || student.status !== 'approved') {
            passwordResetAttempts.set(rateLimitKey, { count: attemptData.count + 1, lastAttempt: now });
            return res.status(200).json({ message: "If an account exists with this Student ID and email, a reset code has been sent." });
        }

        // Delete any existing reset codes for this student
        await PasswordReset.deleteMany({ student_id });

        // Generate new code and hash it for storage
        const code = generateVerificationCode();
        const codeHash = hashToken(code);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await PasswordReset.create({
            student_id,
            email: student.email,
            code: codeHash, // Store hashed code
            expires_at: expiresAt,
            attempts: 0 // Track verification attempts
        });

        // Send email with plain code
        await sendPasswordResetEmail(student.email, code, student.first_name);

        // Reset attempt counter on success
        passwordResetAttempts.set(rateLimitKey, { count: 0, lastAttempt: now });

        res.json({
            message: "If an account exists with this Student ID and email, a reset code has been sent."
        });

    } catch (err) {
        console.error("Password reset request error:", err);
        res.status(500).json({ message: "Failed to process request. Please try again." });
    }
});

// Verify Password Reset Code
app.post('/apis/password-reset/verify', studentAuth, timestampAuth, async (req, res) => {
    try {
        const { student_id, code } = req.body;

        if (!student_id || !code) {
            return res.status(400).json({ message: "Student ID and verification code are required" });
        }

        // Hash the provided code for comparison
        const codeHash = hashToken(code);

        // Find the reset record - use findOneAndUpdate for atomicity
        const resetRecord = await PasswordReset.findOneAndUpdate(
            {
                student_id,
                code: codeHash,
                used: false,
                expires_at: { $gt: new Date() },
                attempts: { $lt: 5 } // Max 5 verification attempts
            },
            { $inc: { attempts: 1 } },
            { new: true }
        );

        if (!resetRecord) {
            // Check if there's a record with too many attempts
            const lockedRecord = await PasswordReset.findOne({
                student_id,
                used: false,
                expires_at: { $gt: new Date() },
                attempts: { $gte: 5 }
            });

            if (lockedRecord) {
                return res.status(429).json({ message: "Too many failed attempts. Please request a new reset code." });
            }

            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        // Generate a temporary reset token and mark as verified
        const resetToken = generateSecureToken();
        resetRecord.reset_token = hashToken(resetToken);
        resetRecord.verified = true;
        resetRecord.verified_at = new Date();
        await resetRecord.save();

        res.json({
            message: "Code verified successfully",
            reset_token: resetToken
        });

    } catch (err) {
        console.error("Password reset verify error:", err);
        res.status(500).json({ message: "Verification failed. Please try again." });
    }
});

// Complete Password Reset - Set custom_password (allows symbols/numbers)
app.post('/apis/password-reset/complete', studentAuth, timestampAuth, async (req, res) => {
    try {
        const { student_id, reset_token, new_password } = req.body;

        if (!student_id || !reset_token || !new_password) {
            return res.status(400).json({ message: "Student ID, reset token, and new password are required" });
        }

        // Validate new password - allow letters, numbers, and symbols, min 6 chars
        if (new_password.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        if (new_password.length > 128) {
            return res.status(400).json({ message: "Password is too long (max 128 characters)" });
        }

        // Hash the reset token for comparison
        const tokenHash = hashToken(reset_token);

        // Atomically find and mark as used
        const resetRecord = await PasswordReset.findOneAndUpdate(
            {
                student_id,
                reset_token: tokenHash,
                verified: true,
                used: false,
                expires_at: { $gt: new Date() }
            },
            { used: true, used_at: new Date() },
            { new: true }
        );

        if (!resetRecord) {
            return res.status(400).json({ message: "Invalid or expired reset session. Please request a new password reset." });
        }

        // Verify the email still matches
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const student = await StudentModel.findOne({ student_id, email: resetRecord.email });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Hash and save the new password as custom_password (doesn't change last_name)
        // Must use the college-specific StudentModel — NOT the base Student model —
        // otherwise the update lands in the wrong MongoDB collection and login
        // never sees the new password.
        const hashedPassword = await bcrypt.hash(new_password, 12);
        await StudentModel.updateOne(
            { student_id },
            { custom_password: hashedPassword }
        );

        res.json({ message: "Password reset successful! You can now login with your new password." });

    } catch (err) {
        console.error("Password reset complete error:", err);
        res.status(500).json({ message: "Password reset failed. Please try again." });
    }
});


// ==================== ATTENDANCE API ENDPOINTS ====================

// Compute the start/end of "today" anchored to Asia/Manila (UTC+8, no DST).
// Events are created by admins in Philippine local time, but the server may
// run in UTC. Using server-local midnight caused events scheduled for "today
// in Manila" to stay in draft until UTC caught up. Anchoring to Manila keeps
// activation aligned with the school's calendar day.
function getManilaTodayBounds(daysOffset = 0) {
    const PH_OFFSET_MS = 8 * 60 * 60 * 1000;
    const nowPh = new Date(Date.now() + PH_OFFSET_MS);
    const y = nowPh.getUTCFullYear();
    const m = nowPh.getUTCMonth();
    const d = nowPh.getUTCDate() + daysOffset;
    const todayStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - PH_OFFSET_MS);
    const todayEnd = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - PH_OFFSET_MS);
    return { todayStart, todayEnd };
}

async function autoUpdateEventStatuses() {
    try {
        const now = new Date();
        const { todayStart, todayEnd } = getManilaTodayBounds();

        // Update events for both CCS and COE colleges
        const colleges = ['CCS', 'COE'];

        for (const college of colleges) {
            const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, college);
            const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, college);

            // AUTO-ACTIVATE: Activate draft events whose date is today
            const draftEventsToActivate = await EventModel.find({
                status: 'draft',
                event_date: { $gte: todayStart, $lte: todayEnd }
            });

            let activatedCount = 0;
            for (const event of draftEventsToActivate) {
                event.status = 'active';
                event.activated_at = now;
                event.updated_at = now;
                await event.save();

                // Also activate all draft sessions within this event
                await SessionModel.updateMany(
                    { event_id: event._id, status: 'draft' },
                    { $set: { status: 'active', updated_at: now } }
                );
                activatedCount++;
            }

            if (activatedCount > 0) {
                console.log(`[${college}] Auto-activated ${activatedCount} events for today`);
            }

            // Close active events whose date has passed
            const activeClosedResult = await EventModel.updateMany(
                {
                    status: 'active',
                    event_date: { $lt: todayStart }
                },
                {
                    $set: {
                        status: 'closed',
                        closed_at: now
                    }
                }
            );

            // Close sessions of closed events
            if (activeClosedResult.modifiedCount > 0) {
                const closedEventIds = await EventModel.find({
                    status: 'closed',
                    closed_at: now
                }).distinct('_id');

                await SessionModel.updateMany(
                    { event_id: { $in: closedEventIds }, status: 'active' },
                    { $set: { status: 'closed', updated_at: now } }
                );
            }

            // Also close draft events whose date has passed (they were never activated)
            const draftEventsToClose = await EventModel.find({
                status: 'draft',
                event_date: { $lt: todayStart }
            }).distinct('_id');

            const draftClosedResult = await EventModel.updateMany(
                {
                    status: 'draft',
                    event_date: { $lt: todayStart }
                },
                {
                    $set: {
                        status: 'closed',
                        closed_at: now
                    }
                }
            );

            // Close all sessions of draft events that were just closed
            if (draftEventsToClose.length > 0) {
                await SessionModel.updateMany(
                    { event_id: { $in: draftEventsToClose } },
                    { $set: { status: 'closed', updated_at: now } }
                );
            }

            const totalClosed = activeClosedResult.modifiedCount + draftClosedResult.modifiedCount;
            if (totalClosed > 0) {
                console.log(`[${college}] Auto-closed ${totalClosed} past events (${activeClosedResult.modifiedCount} active, ${draftClosedResult.modifiedCount} draft)`);
            }
        }
    } catch (err) {
        console.error('Auto-update event status error:', err.message);
    }
}

// Run every 15 minutes for responsive status updates (initial run is triggered after DB connection in connectWithRetry)
setInterval(autoUpdateEventStatuses, 15 * 60 * 1000);

function getEventAutoStatus(eventDate) {
    // Anchor "today" to Asia/Manila so events scheduled for today PH time
    // are classified as active even when the server clock is in UTC.
    const { todayStart, todayEnd } = getManilaTodayBounds();

    // Convert eventDate to Date object if it's a string
    const eventDay = new Date(eventDate);

    // Compare dates: if event is today, it's active; if in future, it's draft; if in past, it's closed
    if (eventDay >= todayStart && eventDay <= todayEnd) {
        return 'active';
    } else if (eventDay > todayEnd) {
        return 'draft';
    } else {
        return 'closed';
    }
}

// ==================== GEOFENCE HELPERS ====================
// Used by event create/update endpoints and the unified attendance check
// handler. Centralised so behaviour stays consistent if we ever change the
// rules (e.g. tighten the radius bounds or add altitude later).

// ── VPN / Proxy detection ────────────────────────────────────────────────────
// Results are cached per IP for 5 minutes so a classroom of students checking
// in simultaneously doesn't hammer the free ip-api.com rate limit (45 req/min).
// On any external-API error we fail OPEN — a downed lookup service should never
// lock out a legitimate student.
const _vpnCache = new Map(); // ip → { ts, isVpn, reason }
const VPN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// CIDR ranges that are definitively private / local — skip the external lookup.
const PRIVATE_IP_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd)/i;

async function isVpnOrProxy(ip) {
    if (!ip || ip === 'unknown' || PRIVATE_IP_RE.test(ip)) {
        return { isVpn: false, reason: 'private' };
    }

    const now = Date.now();
    const cached = _vpnCache.get(ip);
    if (cached && (now - cached.ts) < VPN_CACHE_TTL_MS) {
        return { isVpn: cached.isVpn, reason: cached.reason };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000); // 4 s hard limit

        const resp = await fetch(
            `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,proxy,hosting,query,countryCode`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!resp.ok) throw new Error(`ip-api HTTP ${resp.status}`);
        const data = await resp.json();

        const isVpn = data.status === 'success' && (data.proxy === true || data.hosting === true);
        const reason = data.proxy ? 'proxy/vpn' : data.hosting ? 'datacenter/hosting' : 'clean';

        // Evict stale entries when the cache grows large
        if (_vpnCache.size >= 1000) {
            const cutoff = now - VPN_CACHE_TTL_MS;
            for (const [k, v] of _vpnCache) {
                if (v.ts < cutoff) _vpnCache.delete(k);
            }
        }
        _vpnCache.set(ip, { ts: now, isVpn, reason });

        console.log(`[VPN Check] ip=${ip} proxy=${data.proxy} hosting=${data.hosting} country=${data.countryCode} → ${reason}`);
        return { isVpn, reason };

    } catch (err) {
        console.warn(`[VPN Check] lookup failed for ${ip} (fail-open): ${err.message}`);
        return { isVpn: false, reason: 'api_error' };
    }
}
// ─────────────────────────────────────────────────────────────────────────────

// Haversine distance between two lat/lng pairs, in metres.
function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in metres
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Coerces incoming geofence input into safe, schema-compatible values.
// If `enabled` is true but coordinates are missing/invalid, we force enabled
// back to false so the database never holds a half-configured fence.
function sanitiseGeofencePayload({ geofence_enabled, geofence_lat, geofence_lng, geofence_radius_meters }) {
    const lat = (geofence_lat === null || geofence_lat === undefined || geofence_lat === '')
        ? null : Number(geofence_lat);
    const lng = (geofence_lng === null || geofence_lng === undefined || geofence_lng === '')
        ? null : Number(geofence_lng);
    let radius = (geofence_radius_meters === null || geofence_radius_meters === undefined || geofence_radius_meters === '')
        ? 80 : Number(geofence_radius_meters);

    const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
    const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180;
    if (!Number.isFinite(radius) || radius < 10) radius = 80;
    if (radius > 5000) radius = 5000;

    const enabled = !!geofence_enabled && validLat && validLng;

    return {
        geofence_enabled: enabled,
        geofence_lat: validLat ? lat : null,
        geofence_lng: validLng ? lng : null,
        geofence_radius_meters: radius
    };
}

// Get all attendance events (admin only) - returns ALL events regardless of is_custom
app.get('/apis/attendance/events', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 100 } = req.query;
        const filter = {};
        // Only filter by status if provided in query params
        if (status) filter.status = status;
        // DO NOT filter by is_custom - admin should see all events

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Use college-specific AttendanceEvent model
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);

        // Get all events matching the filter (no is_custom filtering)
        const events = await EventModel.find(filter)
            .populate('assigned_users', 'full_name name student_id program year_level')
            .sort({ event_date: -1, created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await EventModel.countDocuments(filter);

        // Log for debugging - show breakdown of event types
        const customCount = events.filter(e => e.is_custom === true).length;
        const regularCount = events.filter(e => e.is_custom !== true).length;
        const unknownCount = events.filter(e => e.is_custom === undefined || e.is_custom === null).length;

        console.log(`[Attendance Events] Admin request - filter: ${JSON.stringify(filter)}`);
        console.log(`[Attendance Events] Returned: ${customCount} custom, ${regularCount} regular, ${unknownCount} unknown | Total returned: ${events.length}/${total}`);
        if (events.length > 0) {
            console.log(`[Attendance Events] Sample events:`, events.slice(0, 3).map(e => ({ title: e.title, is_custom: e.is_custom, status: e.status, created_at: e.created_at })));
        }

        // Ensure assigned_users are consistently full objects with names
        try {
            // Collect all student ids that need enrichment
            const idsToFetch = new Set();
            events.forEach(ev => {
                if (Array.isArray(ev.assigned_users)) {
                    ev.assigned_users.forEach(u => {
                        if (!u) return;
                        if (typeof u === 'string') idsToFetch.add(u);
                        else if (u._id && !u.full_name) idsToFetch.add(u._id.toString());
                    })
                }
            })

            if (idsToFetch.size > 0) {
                const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
                const students = await StudentModel.find({ _id: { $in: Array.from(idsToFetch) } })
                    .select('first_name middle_name last_name student_id program year_level photo full_name');
                const studentMap = {};
                students.forEach(s => {
                    studentMap[s._id.toString()] = s;
                });

                // Merge/enrich assigned_users
                events.forEach(ev => {
                    if (Array.isArray(ev.assigned_users)) {
                        ev.assigned_users = ev.assigned_users.map(u => {
                            if (!u) return null;
                            if (typeof u === 'string') {
                                const s = studentMap[u];
                                if (s) return {
                                    _id: s._id,
                                    student_id: s.student_id,
                                    full_name: s.full_name || `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim().toUpperCase(),
                                    program: s.program || '',
                                    year_level: s.year_level || '',
                                    photo: s.photo || ''
                                };
                                return { _id: u };
                            } else if (u._id) {
                                const sid = u._id.toString();
                                const s = studentMap[sid];
                                if (s) return {
                                    _id: s._id,
                                    student_id: s.student_id,
                                    full_name: s.full_name || `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim().toUpperCase(),
                                    program: s.program || u.program || '',
                                    year_level: s.year_level || u.year_level || '',
                                    photo: s.photo || u.photo || ''
                                };
                                // If no student found, keep original object but ensure _id
                                return { _id: u._id, student_id: u.student_id, program: u.program, year_level: u.year_level };
                            }
                            return u;
                        }).filter(Boolean);
                    }
                });
            }
        } catch (enrichErr) {
            console.error('[Attendance Events] enrichment error:', enrichErr.message);
        }

        res.json({
            data: events,
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('[Attendance Events] Error:', err.message);
        internalError(res, err);
    }
});

// Get active attendance events (for students)
app.get('/apis/attendance/events/active', studentAuthWithToken, async (req, res) => {
    try {
        // Ensure event statuses are up-to-date before querying
        if (typeof autoUpdateEventStatuses === 'function') {
            await autoUpdateEventStatuses();
        }

        const studentId = req.student._id;

        // Get active events that are either:
        // 1. Not custom (for all students)
        // 2. Custom and this student is assigned
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);

        const events = await EventModel.find({
            status: 'active',
            $or: [
                { is_custom: false },
                { is_custom: { $exists: false } },  // Events created before is_custom field
                { is_custom: null },  // Events with null is_custom
                { is_custom: true, assigned_users: { $in: [studentId] } }
            ]
        })
            .populate('assigned_users', 'full_name name student_id')
            .sort({ event_date: -1 });

        res.json({ data: events });
    } catch (err) {
        internalError(res, err);
    }
});

// Get upcoming (draft) attendance events (for students)
app.get('/apis/attendance/events/upcoming', studentAuthWithToken, async (req, res) => {
    try {
        // Ensure event statuses are up-to-date before querying
        if (typeof autoUpdateEventStatuses === 'function') {
            await autoUpdateEventStatuses();
        }

        const studentId = req.student._id;

        // Get draft events that are either:
        // 1. Not custom (for all students)
        // 2. Custom and this student is assigned
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);

        const events = await EventModel.find({
            status: 'draft',
            $or: [
                { is_custom: false },
                { is_custom: { $exists: false } },  // Events created before is_custom field
                { is_custom: null },  // Events with null is_custom
                { is_custom: true, assigned_users: { $in: [studentId] } }
            ]
        })
            .populate('assigned_users', 'full_name name student_id')
            .sort({ event_date: 1 });

        // Enrich assigned_users objects for consistent full_name
        try {
            const idsToFetch = new Set();
            events.forEach(ev => {
                if (Array.isArray(ev.assigned_users)) {
                    ev.assigned_users.forEach(u => {
                        if (!u) return;
                        if (typeof u === 'string') idsToFetch.add(u);
                        else if (u._id && !u.full_name) idsToFetch.add(u._id.toString());
                    });
                }
            });

            if (idsToFetch.size > 0) {
                const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
                const students = await StudentModel.find({ _id: { $in: Array.from(idsToFetch) } })
                    .select('first_name middle_name last_name student_id program year_level photo full_name');
                const studentMap = {};
                students.forEach(s => { studentMap[s._id.toString()] = s; });

                events.forEach(ev => {
                    if (Array.isArray(ev.assigned_users)) {
                        ev.assigned_users = ev.assigned_users.map(u => {
                            if (!u) return null;
                            if (typeof u === 'string') {
                                const s = studentMap[u];
                                if (s) return {
                                    _id: s._id,
                                    student_id: s.student_id,
                                    full_name: s.full_name || `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim().toUpperCase(),
                                    program: s.program || '',
                                    year_level: s.year_level || '',
                                    photo: s.photo || ''
                                };
                                return { _id: u };
                            } else if (u._id) {
                                const sid = u._id.toString();
                                const s = studentMap[sid];
                                if (s) return {
                                    _id: s._id,
                                    student_id: s.student_id,
                                    full_name: s.full_name || `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim().toUpperCase(),
                                    program: s.program || u.program || '',
                                    year_level: s.year_level || u.year_level || '',
                                    photo: s.photo || u.photo || ''
                                };
                                return { _id: u._id, student_id: u.student_id, program: u.program, year_level: u.year_level };
                            }
                            return u;
                        }).filter(Boolean);
                    }
                });
            }
        } catch (err) {
            console.error('[Draft Events] enrichment error:', err.message);
        }

        res.json({ data: events });
    } catch (err) {
        internalError(res, err);
    }
});

// Get single attendance event (admin or student with JWT)
app.get('/apis/attendance/events/:id', auth, async (req, res) => {
    try {
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
        const event = await EventModel.findById(req.params.id)
            .populate('assigned_users', 'full_name name student_id program year_level');
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        // Enrich assigned_users to ensure consistent object shape (in case some are IDs)
        try {
            if (Array.isArray(event.assigned_users)) {
                const idsToFetch = [];
                event.assigned_users.forEach(u => {
                    if (!u) return;
                    if (typeof u === 'string') idsToFetch.push(u);
                    else if (u._id && !u.full_name) idsToFetch.push(u._id.toString());
                });

                if (idsToFetch.length > 0) {
                    const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
                    const students = await StudentModel.find({ _id: { $in: idsToFetch } })
                        .select('first_name middle_name last_name student_id program year_level photo full_name');
                    const studentMap = {};
                    students.forEach(s => { studentMap[s._id.toString()] = s; });

                    event.assigned_users = event.assigned_users.map(u => {
                        if (!u) return null;
                        if (typeof u === 'string') {
                            const s = studentMap[u];
                            if (s) return {
                                _id: s._id,
                                student_id: s.student_id,
                                full_name: s.full_name || `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim().toUpperCase(),
                                program: s.program || '',
                                year_level: s.year_level || '',
                                photo: s.photo || ''
                            };
                            return { _id: u };
                        } else if (u._id) {
                            const sid = u._id.toString();
                            const s = studentMap[sid];
                            if (s) return {
                                _id: s._id,
                                student_id: s.student_id,
                                full_name: s.full_name || `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim().toUpperCase(),
                                program: s.program || u.program || '',
                                year_level: s.year_level || u.year_level || '',
                                photo: s.photo || u.photo || ''
                            };
                            return { _id: u._id, student_id: u.student_id, program: u.program, year_level: u.year_level };
                        }
                        return u;
                    }).filter(Boolean);
                }
            }
        } catch (enrichErr) {
            console.error('[Single Event] enrichment error:', enrichErr.message);
        }

        res.json(event);
    } catch (err) {
        internalError(res, err);
    }
});

// Create attendance event (admin only)
app.post('/apis/attendance/events', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const {
            title, description, location, event_date, year_level, status,
            start_time, end_time, is_custom, assigned_users,
            geofence_enabled, geofence_lat, geofence_lng, geofence_radius_meters,
            face_id_enabled
        } = req.body;

        if (!title || !event_date) {
            return res.status(400).json({ message: "Title and event date are required" });
        }

        // Auto-determine status based on event date if not provided
        let eventStatus = status;
        if (!eventStatus) {
            eventStatus = getEventAutoStatus(new Date(event_date));
        }

        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);

        // Sanitise geofence values up front so we don't persist a partial /
        // contradictory state (e.g. enabled=true but missing coordinates).
        const sanitisedGeofence = sanitiseGeofencePayload({
            geofence_enabled, geofence_lat, geofence_lng, geofence_radius_meters
        });

        const event = new EventModel({
            title,
            description: description || "",
            location: location || "",
            event_date: new Date(event_date),
            year_level: year_level || "",
            start_time: start_time || null,
            end_time: end_time || null,
            status: eventStatus,
            created_by: req.master.id,
            created_by_name: req.master.username || req.master.full_name || req.master.email || 'Admin',
            activated_at: eventStatus === 'active' ? new Date() : null,
            is_custom: is_custom || false,
            assigned_users: assigned_users && Array.isArray(assigned_users) ? assigned_users : [],
            rfidScanner: { checkInEnabled: true, checkOutEnabled: false },
            face_id_enabled: face_id_enabled === undefined ? true : !!face_id_enabled,
            ...sanitisedGeofence
        });

        const saved = await event.save();
        await logAudit(req.college, req.master, 'EVENT_CREATED', 'AttendanceEvent', String(saved._id),
            saved.title, { event_date: saved.event_date, location: saved.location || '' });
        res.status(201).json({ message: "Event created successfully", event: saved });
    } catch (err) {
        internalError(res, err);
    }
});

// Update attendance event (admin only)
app.put('/apis/attendance/events/:id', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const {
            title, description, location, event_date, year_level, status,
            start_time, end_time, is_custom, assigned_users, rfidScanner,
            geofence_enabled, geofence_lat, geofence_lng, geofence_radius_meters,
            face_id_enabled
        } = req.body;

        console.log(`[Event Update] ID: ${req.params.id}, assigned_users received:`, assigned_users);

        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
        const event = await EventModel.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (title) event.title = title;
        if (description !== undefined) event.description = description;
        if (location !== undefined) event.location = location;
        if (event_date) event.event_date = new Date(event_date);
        if (year_level !== undefined) event.year_level = year_level;
        if (start_time !== undefined) event.start_time = start_time;
        if (end_time !== undefined) event.end_time = end_time;
        if (is_custom !== undefined) event.is_custom = is_custom;
        if (face_id_enabled !== undefined) event.face_id_enabled = !!face_id_enabled;
        if (assigned_users !== undefined) {
            console.log(`[Event Update] Before save - assigned_users:`, event.assigned_users);
            event.assigned_users = assigned_users || [];
            console.log(`[Event Update] After assignment - assigned_users:`, event.assigned_users);
        }
        if (rfidScanner !== undefined && typeof rfidScanner === 'object' && rfidScanner !== null) {
            event.rfidScanner = Object.assign({}, event.rfidScanner || {}, rfidScanner);
            event.markModified('rfidScanner');
        }

        // Geofence: only touch fields the client actually sent so partial PUTs
        // (e.g. just toggling) keep coordinates intact.
        if (geofence_enabled !== undefined || geofence_lat !== undefined ||
            geofence_lng !== undefined || geofence_radius_meters !== undefined) {
            const merged = sanitiseGeofencePayload({
                geofence_enabled: geofence_enabled !== undefined ? geofence_enabled : event.geofence_enabled,
                geofence_lat: geofence_lat !== undefined ? geofence_lat : event.geofence_lat,
                geofence_lng: geofence_lng !== undefined ? geofence_lng : event.geofence_lng,
                geofence_radius_meters: geofence_radius_meters !== undefined ? geofence_radius_meters : event.geofence_radius_meters
            });
            event.geofence_enabled = merged.geofence_enabled;
            event.geofence_lat = merged.geofence_lat;
            event.geofence_lng = merged.geofence_lng;
            event.geofence_radius_meters = merged.geofence_radius_meters;
        }

        if (status && status !== event.status) {
            event.status = status;
            if (status === 'active' && !event.activated_at) {
                event.activated_at = new Date();
                // Also activate all draft sessions within this event
                const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
                await SessionModel.updateMany(
                    { event_id: req.params.id, status: 'draft' },
                    { $set: { status: 'active', updated_at: new Date() } }
                );
            } else if (status === 'closed') {
                event.closed_at = new Date();
                // Also close all active sessions within this event
                const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
                await SessionModel.updateMany(
                    { event_id: req.params.id, status: 'active' },
                    { $set: { status: 'closed', updated_at: new Date() } }
                );
            }
        }

        event.updated_at = new Date();
        const updated = await event.save();

        console.log(`[Event Update] After save - assigned_users:`, updated.assigned_users);

        // Populate assigned_users before returning
        await updated.populate('assigned_users', 'full_name name student_id program year_level');

        console.log(`[Event Update] After populate - assigned_users:`, updated.assigned_users);

        await logAudit(req.college, req.master, 'EVENT_UPDATED', 'AttendanceEvent', String(updated._id),
            updated.title, { status: updated.status });
        res.json({ message: "Event updated successfully", event: updated });
    } catch (err) {
        console.error(`[Event Update] Error:`, err.message);
        internalError(res, err);
    }
});

// Delete attendance event (admin only)
app.delete('/apis/attendance/events/:id', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
        const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);

        const event = await EventModel.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Delete all sessions and logs associated with this event
        await LogModel.deleteMany({ event_id: req.params.id });
        await SessionModel.deleteMany({ event_id: req.params.id });
        await EventModel.deleteOne({ _id: req.params.id });

        await logAudit(req.college, req.master, 'EVENT_DELETED', 'AttendanceEvent', req.params.id,
            event.title, {});
        res.json({ message: "Event, sessions, and all related attendance logs deleted successfully" });
    } catch (err) {
        internalError(res, err);
    }
});

// Create custom event for specific users
app.post('/apis/attendance/events/custom/create', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const { title, event_date, date, start_time, end_time, description, location, assigned_users } = req.body;

        const eventDate = event_date || date;
        if (!title || !eventDate || !assigned_users || assigned_users.length === 0) {
            return res.status(400).json({ message: "Missing required fields: title, date, and assigned_users" });
        }

        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);

        const customEvent = new EventModel({
            title,
            description: description || "",
            location: location || "",
            event_date: new Date(eventDate),
            start_time: start_time || null,
            end_time: end_time || null,
            is_custom: true,
            assigned_users: assigned_users.map(u => u._id || u.id),
            status: 'active',
            created_by: req.master ? req.master.id : req.student._id,
            created_by_name: req.master
                ? (req.master.username || req.master.full_name || req.master.email || 'Admin')
                : (req.student.full_name || req.student.student_id || 'Student'),
            activated_at: new Date()
        });

        await customEvent.save();

        // Automatically create a default session for custom events so students can check-in
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);

        const defaultSession = new SessionModel({
            event_id: customEvent._id,
            label: 'Event Attendance',
            start_time: start_time || '08:00',
            end_time: end_time || '17:00',
            late_timer_minutes: 30,
            status: 'active'
        });

        await defaultSession.save();

        await customEvent.populate('assigned_users', 'full_name name student_id program year_level');

        res.json({
            success: true,
            message: "Custom event created successfully",
            data: customEvent
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Update custom event
app.put('/apis/attendance/events/custom/:id', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const { title, event_date, date, start_time, end_time, description, location, assigned_users } = req.body;

        const eventDate = event_date || date;
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);

        const event = await EventModel.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description: description || "",
                location: location || "",
                event_date: new Date(eventDate),
                start_time: start_time || null,
                end_time: end_time || null,
                assigned_users: assigned_users.map(u => u._id || u.id),
                updated_at: new Date()
            },
            { new: true }
        ).populate('assigned_users', 'full_name name student_id program year_level');

        // Also update the default session if it exists
        const session = await SessionModel.findOne({ event_id: req.params.id });
        if (session) {
            session.start_time = start_time || '08:00';
            session.end_time = end_time || '17:00';
            await session.save();
        }

        res.json({
            success: true,
            message: "Custom event updated successfully",
            data: event
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Get event statistics including total assigned students
app.get('/apis/events/:id/stats', auth, async (req, res) => {
    try {
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
        const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);

        const event = await EventModel.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        const totalAssignedStudents = Array.isArray(event.assigned_users) ? event.assigned_users.length : 0;
        const totalLogs = await LogModel.countDocuments({ event_id: req.params.id });
        const uniqueStudents = await LogModel.distinct('student_id', { event_id: req.params.id });

        res.json({
            totalAssignedStudents,
            totalLogs,
            uniqueStudentsAttended: uniqueStudents.length
        });
    } catch (err) {
        console.error('[Event Stats] Error:', err);
        internalError(res, err);
    }
});

// Get attendance export as Excel with custom columns
app.get('/apis/attendance/events/:eventId/export-excel', auth, async (req, res) => {
    try {
        const logs = await AttendanceLog.find({ event_id: req.params.eventId })
            .populate('student_id', 'full_name student_id')
            .sort({ check_in_at: -1 });

        const data = logs.map(log => ({
            'Name': log.student_id?.full_name || log.student_name,
            'Student ID': log.student_id?.student_id || log.student_id_number,
            'Status': log.is_late || !log.check_in_at ? 'Absent' : log.check_out_at ? 'Present' : 'Incomplete'
        }));

        // Create CSV
        const headers = Object.keys(data[0] || {});
        const csv = [headers, ...data.map(row => headers.map(h => row[h]))].map(row =>
            row.map(cell => `"${cell || ''}"`).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (err) {
        internalError(res, err);
    }
});

// ==================== SESSION CRUD ENDPOINTS ====================

// Create session for an event (admin only)
app.post('/apis/attendance/events/:eventId/sessions', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const { label, start_time, end_time, status, late_timer_minutes } = req.body;

        if (!label || !start_time || !end_time) {
            return res.status(400).json({ message: "Label, start time, and end time are required" });
        }

        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);

        const event = await EventModel.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if session with same label already exists for this event
        const existingSession = await SessionModel.findOne({
            event_id: req.params.eventId,
            label
        });
        if (existingSession) {
            return res.status(400).json({ message: `A ${label} session already exists for this event` });
        }

        const session = new SessionModel({
            event_id: req.params.eventId,
            label,
            start_time,
            end_time,
            late_timer_minutes: late_timer_minutes || 0,
            status: status || (event.status === 'active' ? 'active' : 'draft'),
            rfidScanner: { checkInEnabled: true, checkOutEnabled: false }
        });

        const saved = await session.save();
        await logAudit(req.college, req.master, 'SESSION_CREATED', 'AttendanceSession', String(saved._id),
            `${label} — ${event.title}`, { event_id: req.params.eventId });
        res.status(201).json({ message: "Session created successfully", session: saved });
    } catch (err) {
        internalError(res, err);
    }
});

// Get all sessions for an event (admin with JWT)
app.get('/apis/attendance/events/:eventId/sessions', auth, async (req, res) => {
    // Make sure the cascade that activates draft sessions when their parent
    // event becomes active has run before we hand the list back. Without this
    // the admin (and the student-facing Face ID UI) can see an "active"
    // event whose sessions still report status='draft', which makes the
    // self-service check-in button stay locked.
    try {
        if (typeof autoUpdateEventStatuses === 'function') {
            await autoUpdateEventStatuses();
        }
    } catch (_) {}
    try {
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
        const sessions = await SessionModel.find({ event_id: req.params.eventId })
            .sort({ start_time: 1 });
        res.json({ data: sessions });
    } catch (err) {
        internalError(res, err);
    }
});

// Update session (admin only)
app.put('/apis/attendance/sessions/:id', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const { label, start_time, end_time, status, check_in_locked, check_out_locked, late_timer_minutes, rfidScanner } = req.body;

        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
        const session = await SessionModel.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (label) {
            // Check if another session with this label exists for the same event
            const existingSession = await SessionModel.findOne({
                event_id: session.event_id,
                label,
                _id: { $ne: req.params.id }
            });
            if (existingSession) {
                return res.status(400).json({ message: `A ${label} session already exists for this event` });
            }
            session.label = label;
        }
        if (start_time) session.start_time = start_time;
        if (end_time) session.end_time = end_time;
        if (status) session.status = status;
        if (check_in_locked !== undefined) session.check_in_locked = check_in_locked;
        if (check_out_locked !== undefined) session.check_out_locked = check_out_locked;
        if (late_timer_minutes !== undefined) session.late_timer_minutes = late_timer_minutes;
        // rfidScanner is a Mongoose Mixed type, so we must merge (not replace)
        // and explicitly call markModified — otherwise Mongoose silently drops
        // the change on save, which makes the admin's check-in/check-out
        // toggle appear to revert. The client only sends the fields it wants
        // to change (e.g. just { checkInEnabled, checkOutEnabled }).
        if (rfidScanner !== undefined && typeof rfidScanner === 'object' && rfidScanner !== null) {
            session.rfidScanner = Object.assign({}, session.rfidScanner || {}, rfidScanner);
            session.markModified('rfidScanner');
        }

        session.updated_at = new Date();
        const updated = await session.save();

        console.log('[SESSION UPDATE] saved session', updated._id ? updated._id.toString() : 'unknown', 'rfidScanner=', updated.rfidScanner);

        // Only audit meaningful session edits — skip pure RFID-scanner toggle
        // updates (which fire on every check-in/check-out toggle and flood the
        // audit trail with duplicates).
        const isRfidOnlyUpdate = Object.keys(req.body).length === 1 && req.body.rfidScanner !== undefined;
        if (!isRfidOnlyUpdate) {
            await logAudit(req.college, req.master, 'SESSION_UPDATED', 'AttendanceSession', req.params.id,
                updated.label, { status: updated.status });
        }
        res.json({ message: "Session updated successfully", session: updated });
    } catch (err) {
        internalError(res, err);
    }
});

// Delete session (admin only)
app.delete('/apis/attendance/sessions/:id', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
        const session = await SessionModel.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        // Delete all logs for this session
        const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);
        await LogModel.deleteMany({ session_id: req.params.id });
        await SessionModel.deleteOne({ _id: req.params.id });

        await logAudit(req.college, req.master, 'SESSION_DELETED', 'AttendanceSession', req.params.id,
            session.label, {});
        res.json({ message: "Session and related attendance logs deleted successfully" });
    } catch (err) {
        internalError(res, err);
    }
});

// Get logs for a specific session
app.get('/apis/attendance/sessions/:id/logs', auth, async (req, res) => {
    try {
        const { search, yearLevel, program, page = 1, limit = 50 } = req.query;
        let sessionObjectId;

        try {
            sessionObjectId = new mongoose.Types.ObjectId(req.params.id);
        } catch (e) {
            console.error(`[Session Logs] INVALID SESSION ID: ${req.params.id}`)
            return res.status(400).json({ message: "Invalid session ID format" });
        }

        console.log(`[Session Logs] Fetching logs for session: ${req.params.id}`)
        console.log(`[Session Logs] Converted ObjectId: ${sessionObjectId}`)
        console.log(`[Session Logs] Query: yearLevel=${yearLevel}, program=${program}, search=${search}, page=${page}, limit=${limit}`)

        const filter = { session_id: sessionObjectId };

        if (yearLevel) filter.year_level = yearLevel;
        if (program) filter.program = program;

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { student_name: { $regex: escapedSearch, $options: 'i' } },
                { student_id_number: { $regex: escapedSearch, $options: 'i' } },
                { rfid_code: { $regex: escapedSearch, $options: 'i' } }
            ];
        }

        console.log(`[Session Logs] Filter: ${JSON.stringify(filter)}`)

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);
        let logs = await LogModel.find(filter)
            .sort({ check_in_at: -1, created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Populate excused_by_name from referenced Student or Master when available
        const refIds = [...new Set(logs.filter(l => l.excused_by_id).map(l => l.excused_by_id.toString()))]
        if (refIds.length > 0) {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const students = await StudentModel.find({ _id: { $in: refIds } }, 'full_name')
            const masters = await Master.find({ _id: { $in: refIds } }, 'username')
            const refMap = {}
            students.forEach(s => { refMap[s._id.toString()] = s.full_name })
            masters.forEach(m => { refMap[m._id.toString()] = m.username })
            logs = logs.map(l => {
                const obj = l.toObject ? l.toObject() : { ...l }
                obj.excused_by_name = refMap[(l.excused_by_id || '')?.toString()] || l.excused_by || null
                return obj
            })
        } else {
            logs = logs.map(l => {
                const obj = l.toObject ? l.toObject() : { ...l }
                obj.excused_by_name = l.excused_by || null
                return obj
            })
        }

        console.log(`[Session Logs] Found ${logs.length} logs`)
        console.log(`[Session Logs] First log sample:`, logs[0] || 'NO LOGS')

        const total = await LogModel.countDocuments(filter);
        console.log(`[Session Logs] Total count: ${total}`)

        // Stats for this session
        const stats = await LogModel.aggregate([
            { $match: { session_id: new mongoose.Types.ObjectId(req.params.id) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $or: [{ $and: [{ $ne: ["$check_in_at", null] }, { $ne: ["$check_out_at", null] }, { $eq: ["$is_late", false] }] }, { $and: [{ $ne: ["$check_in_at", null] }, { $eq: ["$check_in_only", true] }, { $eq: ["$is_late", false] }] }] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $or: [{ $and: [{ $ne: ["$check_in_at", null] }, { $ne: ["$check_out_at", null] }, { $eq: ["$is_late", true] }] }, { $and: [{ $ne: ["$check_in_at", null] }, { $eq: ["$check_in_only", true] }, { $eq: ["$is_late", true] }] }] }, 1, 0] } },
                    incomplete: { $sum: { $cond: [{ $and: [{ $ne: ["$check_in_at", null] }, { $eq: ["$check_out_at", null] }, { $ne: ["$check_in_only", true] }] }, 1, 0] } }
                }
            }
        ]);

        console.log(`[Session Logs] Stats:`, stats[0])

        const responseData = {
            data: logs,
            stats: stats[0] || { total: 0, present: 0, late: 0, incomplete: 0 },
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        }
        console.log(`[Session Logs] Sending response:`, JSON.stringify(responseData).substring(0, 200))
        res.json(responseData);
    } catch (err) {
        console.error(`[Session Logs] ERROR:`, err)
        internalError(res, err);
    }
});

// Get attendance logs for an event (admin only) - aggregated across all sessions
// When no session_id is provided, aggregates logs by student to show one record per student
// with their best status across all sessions (present > late > incomplete > absent)
app.get('/apis/attendance/events/:id/logs', auth, async (req, res) => {
    try {
        const { search, yearLevel, program, session_id, page = 1, limit = 50 } = req.query;
        const filter = { event_id: new mongoose.Types.ObjectId(req.params.id) };

        // If session_id is provided, filter by specific session (non-aggregated view)
        if (session_id) {
            filter.session_id = new mongoose.Types.ObjectId(session_id);
        }

        // Get all sessions for this event (college-aware)
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
        const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);
        const sessions = await SessionModel.find({ event_id: req.params.id })
            .sort({ start_time: 1 });

        // If viewing a specific session, return raw logs (original behavior)
        if (session_id) {
            const sessionFilter = { ...filter };
            if (yearLevel) sessionFilter.year_level = yearLevel;
            if (program) sessionFilter.program = program;

            if (search) {
                const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                sessionFilter.$or = [
                    { student_name: { $regex: escapedSearch, $options: 'i' } },
                    { student_id_number: { $regex: escapedSearch, $options: 'i' } },
                    { rfid_code: { $regex: escapedSearch, $options: 'i' } }
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            let logs = await LogModel.find(sessionFilter)
                .sort({ check_in_at: -1, created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Populate excused_by_name from referenced Student or Master when available
            const refIds = [...new Set(logs.filter(l => l.excused_by_id).map(l => l.excused_by_id.toString()))]
            if (refIds.length > 0) {
                const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
                const students = await StudentModel.find({ _id: { $in: refIds } }, 'full_name')
                const masters = await Master.find({ _id: { $in: refIds } }, 'username')
                const refMap = {}
                students.forEach(s => { refMap[s._id.toString()] = s.full_name })
                masters.forEach(m => { refMap[m._id.toString()] = m.username })
                logs = logs.map(l => {
                    const obj = l.toObject ? l.toObject() : { ...l }
                    obj.excused_by_name = refMap[(l.excused_by_id || '')?.toString()] || l.excused_by || null
                    return obj
                })
            } else {
                logs = logs.map(l => {
                    const obj = l.toObject ? l.toObject() : { ...l }
                    obj.excused_by_name = l.excused_by || null
                    return obj
                })
            }

            const total = await LogModel.countDocuments(sessionFilter);

            const stats = await LogModel.aggregate([
                { $match: { session_id: new mongoose.Types.ObjectId(session_id) } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        present: { $sum: { $cond: [{ $and: [{ $ne: ["$check_in_at", null] }, { $ne: ["$check_out_at", null] }, { $eq: ["$is_late", false] }] }, 1, 0] } },
                        late: { $sum: { $cond: [{ $and: [{ $ne: ["$check_in_at", null] }, { $ne: ["$check_out_at", null] }, { $eq: ["$is_late", true] }] }, 1, 0] } },
                        incomplete: { $sum: { $cond: [{ $and: [{ $ne: ["$check_in_at", null] }, { $eq: ["$check_out_at", null] }] }, 1, 0] } }
                    }
                }
            ]);

            return res.json({
                data: logs,
                sessions,
                stats: stats[0] || { total: 0, present: 0, late: 0, incomplete: 0 },
                pagination: {
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        }

        // Aggregate logs by student for event-level view
        // This ensures each student appears only once with their best status
        const matchStage = { event_id: new mongoose.Types.ObjectId(req.params.id) };

        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: '$student_id_number',
                    student_id: { $first: '$student_id' },
                    student_id_number: { $first: '$student_id_number' },
                    student_name: { $first: '$student_name' },
                    program: { $first: '$program' },
                    year_level: { $first: '$year_level' },
                    rfid_code: { $first: '$rfid_code' },
                    check_in_at: { $min: '$check_in_at' },
                    check_out_at: { $max: '$check_out_at' },
                    has_present: {
                        $max: {
                            $cond: [
                                { $or: [
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $ne: ['$check_out_at', null] }, { $eq: ['$is_late', false] }] },
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $eq: ['$check_in_only', true] }, { $eq: ['$is_late', false] }] }
                                ] },
                                1,
                                0
                            ]
                        }
                    },
                    has_late: {
                        $max: {
                            $cond: [
                                { $or: [
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $ne: ['$check_out_at', null] }, { $eq: ['$is_late', true] }] },
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $eq: ['$check_in_only', true] }, { $eq: ['$is_late', true] }] }
                                ] },
                                1,
                                0
                            ]
                        }
                    },
                    has_incomplete: {
                        $max: {
                            $cond: [
                                { $and: [{ $ne: ['$check_in_at', null] }, { $eq: ['$check_out_at', null] }, { $ne: ['$check_in_only', true] }] },
                                1,
                                0
                            ]
                        }
                    },
                    session_count: { $sum: 1 },
                    sessions_attended: {
                        $push: {
                            session_id: '$session_id',
                            check_in_at: '$check_in_at',
                            check_out_at: '$check_out_at',
                            is_late: '$is_late'
                        }
                    },
                    created_at: { $min: '$created_at' }
                }
            },
            {
                $addFields: {
                    is_late: {
                        $cond: [
                            { $eq: ['$has_present', 1] },
                            false,
                            { $eq: ['$has_late', 1] }
                        ]
                    },
                    event_status: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$has_present', 1] }, then: 'present' },
                                { case: { $eq: ['$has_late', 1] }, then: 'late' },
                                { case: { $eq: ['$has_incomplete', 1] }, then: 'incomplete' }
                            ],
                            default: 'absent'
                        }
                    }
                }
            }
        ];

        // Apply filters after grouping
        const postGroupMatch = {};
        if (yearLevel) postGroupMatch.year_level = yearLevel;
        if (program) postGroupMatch.program = program;
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            postGroupMatch.$or = [
                { student_name: { $regex: escapedSearch, $options: 'i' } },
                { student_id_number: { $regex: escapedSearch, $options: 'i' } },
                { rfid_code: { $regex: escapedSearch, $options: 'i' } }
            ];
        }
        if (Object.keys(postGroupMatch).length > 0) {
            pipeline.push({ $match: postGroupMatch });
        }

        // Sort by check_in_at descending, then created_at
        pipeline.push({ $sort: { check_in_at: -1, created_at: -1 } });

        // Get total count before pagination
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await LogModel.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Apply pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        const aggregatedLogs = await LogModel.aggregate(pipeline);

        // Stats aggregated by unique students (not session logs)
        const statsPipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: '$student_id_number',
                    has_present: {
                        $max: {
                            $cond: [
                                { $or: [
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $ne: ['$check_out_at', null] }, { $eq: ['$is_late', false] }] },
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $eq: ['$check_in_only', true] }, { $eq: ['$is_late', false] }] }
                                ] },
                                1,
                                0
                            ]
                        }
                    },
                    has_late: {
                        $max: {
                            $cond: [
                                { $or: [
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $ne: ['$check_out_at', null] }, { $eq: ['$is_late', true] }] },
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $eq: ['$check_in_only', true] }, { $eq: ['$is_late', true] }] }
                                ] },
                                1,
                                0
                            ]
                        }
                    },
                    has_incomplete: {
                        $max: {
                            $cond: [
                                { $and: [{ $ne: ['$check_in_at', null] }, { $eq: ['$check_out_at', null] }, { $ne: ['$check_in_only', true] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: { $sum: '$has_present' },
                    late: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$has_present', 0] }, { $eq: ['$has_late', 1] }] },
                                1,
                                0
                            ]
                        }
                    },
                    incomplete: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$has_present', 0] }, { $eq: ['$has_late', 0] }, { $eq: ['$has_incomplete', 1] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ];

        const stats = await LogModel.aggregate(statsPipeline);

        res.json({
            data: aggregatedLogs,
            sessions,
            stats: stats[0] || { total: 0, present: 0, late: 0, incomplete: 0 },
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            aggregated: true
        });
    } catch (err) {
        internalError(res, err);
    }
});

// PATCH endpoint to update individual attendance log (supports is_late, excused, excuse_reason)
app.patch('/apis/attendance/logs/:id', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const { is_late, excused, excuse_reason, excused_by, excused_by_id, excused_by_model } = req.body;

        const log = await AttendanceLog.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ message: "Attendance log not found" });
        }

        let changed = false
        if (typeof is_late === 'boolean') {
            log.is_late = is_late;
            changed = true
        }

        if (typeof excused === 'boolean') {
            log.excused = excused;
            // if excused, clear check-in/check-out to avoid contradictions (optional)
            if (excused) {
                // keep existing check-in/out but excused takes precedence in status
            }
            changed = true
        }

        if (typeof excuse_reason === 'string') {
            log.excuse_reason = excuse_reason || null
            changed = true
        }

        if (typeof excused_by === 'string') {
            log.excused_by = excused_by || null
            changed = true
        }

        if (excused_by_id) {
            try {
                log.excused_by_id = mongoose.Types.ObjectId(excused_by_id)
                changed = true
            } catch (e) {
                // ignore invalid id
            }
        } else if (excused_by_id === null) {
            log.excused_by_id = null
            changed = true
        }

        if (typeof excused_by_model === 'string') {
            log.excused_by_model = excused_by_model || null
            changed = true
        }

        if (changed) {
            log.updated_at = new Date();
            await log.save();
        }

        res.json({
            message: "Attendance log updated successfully",
            data: log
        });
    } catch (err) {
        internalError(res, err);
    }
});

// RFID Check-in/Check-out endpoint with 1-minute duplicate prevention
const DUPLICATE_PREVENTION_MS = 1 * 60 * 1000; // 1 minute in milliseconds

// Session-based attendance check-in/check-out handler.
// Extracted into a named function so both the RFID endpoint and the new
// face-recognition endpoint can run the exact same logic after each
// resolves the scanning student. The face endpoint pre-resolves the
// descriptor to a student_id and then delegates here.
const sessionAttendanceCheck = async (req, res) => {
    try {
        const { rfid_code, student_id, identifier_type = 'rfid', source = 'rfid', latitude, longitude, accuracy } = req.body;

        const identifier = rfid_code || student_id;
        const isManualStudentId = identifier_type === 'student_id' || (!rfid_code && student_id);

        if (!identifier) {
            return res.status(400).json({ message: isManualStudentId ? "Student ID is required" : "RFID code is required" });
        }

        // Get global RFID scanner settings (default)
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        const globalRfidSettings = settings.rfidScanner || { checkInEnabled: true, checkOutEnabled: true };

        const now = new Date();

        // Use college-aware models for session/event/student/log
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);

        // Get session and its parent event
        const session = await SessionModel.findById(req.params.sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        const event = await EventModel.findById(session.event_id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Resolve effective RFID settings with the following priority:
        // session.rfidScanner (highest) -> event.rfidScanner -> global settings (fallback)
        let rfidSettings = Object.assign({}, globalRfidSettings);
        try {
            if (event && event.rfidScanner && typeof event.rfidScanner === 'object') {
                rfidSettings = Object.assign({}, rfidSettings, event.rfidScanner);
            }
        } catch (e) {
            console.warn('[RFID] malformed event.rfidScanner settings, falling back to global', e);
        }
        try {
            if (session && session.rfidScanner && typeof session.rfidScanner === 'object') {
                rfidSettings = Object.assign({}, rfidSettings, session.rfidScanner);
            }
        } catch (e) {
            console.warn('[RFID] malformed session.rfidScanner settings, falling back to higher-level settings', e);
        }

        // Ensure boolean flags default to enabled when missing (avoid undefined blocking scans)
        const checkInEnabled = (typeof rfidSettings.checkInEnabled === 'boolean') ? rfidSettings.checkInEnabled : true;
        const checkOutEnabled = (typeof rfidSettings.checkOutEnabled === 'boolean') ? rfidSettings.checkOutEnabled : true;

        // Debug log to help trace settings during scans
        console.log('[RFID CHECK] session=', session._id ? session._id.toString() : req.params.sessionId, 'event=', event._id ? event._id.toString() : 'unknown', 'rfidSettings=', rfidSettings, 'computed=', { checkInEnabled, checkOutEnabled });

        // Fix: Be more lenient with status check or log the actual status for debugging
        if (event.status !== 'active' && event.status !== 'upcoming' && event.status !== 'draft') {
            console.log(`[Attendance] Blocked scan for event ${event._id}: status is ${event.status}`);
            return res.status(400).json({ message: `Event is ${event.status || 'not active'}` });
        }

        // === GEOFENCE ENFORCEMENT ===
        // If the admin enabled a geofence on this event, the device performing
        // the check-in must be within radius. We allow GPS accuracy (capped) to
        // be added to the radius so a slightly noisy fix doesn't unfairly block
        // someone standing at the venue. Applies to RFID, manual, and face flows
        // because all three funnel through this handler.
        if (event.geofence_enabled && Number.isFinite(event.geofence_lat) && Number.isFinite(event.geofence_lng)) {
            // ── VPN / Proxy guard ──────────────────────────────────────────
            // Block check-ins that arrive through a VPN, proxy, or datacenter
            // IP so that a student cannot spoof their GPS coordinates from a
            // remote network. Private/LAN IPs are always allowed (on-campus Wi-Fi).
            const clientIP = (req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-real-ip'] ||
                req.connection?.remoteAddress ||
                'unknown');
            const vpnResult = await isVpnOrProxy(clientIP);
            if (vpnResult.isVpn) {
                console.log(`[Geofence] VPN/proxy blocked: ip=${clientIP} reason=${vpnResult.reason}`);
                return res.status(403).json({
                    message: "VPN or proxy usage detected. Please disable your VPN and try again — a real GPS location from the event venue is required.",
                    geofence_blocked: true,
                    code: 'GEOFENCE_VPN_DETECTED'
                });
            }
            // ──────────────────────────────────────────────────────────────

            const lat = Number(latitude);
            const lng = Number(longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return res.status(403).json({
                    message: "Location is required for this event. Please enable GPS / location services and try again.",
                    geofence_required: true,
                    code: 'GEOFENCE_LOCATION_REQUIRED'
                });
            }

            const distance = haversineMeters(event.geofence_lat, event.geofence_lng, lat, lng);
            const accuracyMeters = Number(accuracy);
            // Cap the GPS-accuracy slack at 50m so a wildly inaccurate fix
            // (common indoors) can't be used to silently bypass the fence.
            const allowedSlack = Number.isFinite(accuracyMeters) ? Math.min(Math.max(accuracyMeters, 0), 50) : 0;
            const effectiveRadius = (event.geofence_radius_meters || 80) + allowedSlack;

            console.log(`[Geofence] event=${event._id} dist=${distance.toFixed(1)}m radius=${event.geofence_radius_meters}m slack=${allowedSlack.toFixed(1)}m effective=${effectiveRadius.toFixed(1)}m`);

            if (distance > effectiveRadius) {
                return res.status(403).json({
                    message: `You are ~${Math.round(distance)}m from the event location, but must be within ${event.geofence_radius_meters}m to check in.`,
                    geofence_blocked: true,
                    code: 'GEOFENCE_OUT_OF_RANGE',
                    distance_meters: Math.round(distance),
                    allowed_radius_meters: event.geofence_radius_meters
                });
            }
        }

        // Helper function to calculate if session is currently active based on time
        // This matches the frontend's getSessionDisplayStatus logic
        const isSessionActiveByTime = () => {
            if (!session.start_time || !session.end_time || !event.event_date) {
                return session.status === 'active';
            }

            const [startH, startM] = session.start_time.split(':').map(Number);
            const [endH, endM] = session.end_time.split(':').map(Number);

            // Extract date string from event_date (handles both ISO string and Date object)
            let eventDateStr;
            const eventDateValue = event.event_date;
            if (typeof eventDateValue === 'string') {
                eventDateStr = eventDateValue.includes('T') ? eventDateValue.split('T')[0] : eventDateValue;
            } else {
                const d = new Date(eventDateValue);
                eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }

            // Create session start and end times in Philippine timezone (UTC+8)
            const sessionStartPH = new Date(`${eventDateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00+08:00`);
            const sessionEndPH = new Date(`${eventDateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00+08:00`);

            const nowUTC = now.getTime();
            const sessionStartUTC = sessionStartPH.getTime();
            const sessionEndUTC = sessionEndPH.getTime();

            return nowUTC >= sessionStartUTC && nowUTC <= sessionEndUTC;
        };

        // Check if session is active - either by stored status OR by current time within session window
        // This allows scanning when the event is active and current time is within the session's time window
        const sessionIsActive = session.status === 'active' || session.status === 'draft' || (event.status === 'active' && isSessionActiveByTime());

        if (!sessionIsActive) {
            return res.status(400).json({ message: "Session is not active" });
        }

        // Find student
        let student;
        if (isManualStudentId) {
            student = await StudentModel.findOne({
                student_id: identifier.trim().toUpperCase(),
                status: 'approved'
            });
            if (!student) {
                return res.status(404).json({ message: "No approved student found with this Student ID" });
            }
        } else {
            student = await StudentModel.findOne({
                rfid_code: identifier.trim(),
                rfid_status: 'verified',
                status: 'approved'
            });
            if (!student) {
                return res.status(404).json({ message: "No verified student found with this RFID code" });
            }
        }

        // Calculate student full name
        const studentFullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.replace(/\s+/g, ' ').trim();

        // Validate if event is custom - only assigned users can check in
        if (event.is_custom && event.assigned_users && Array.isArray(event.assigned_users)) {
            const isUserAssigned = event.assigned_users.some(userId =>
                userId.toString() === student._id.toString()
            );

            if (!isUserAssigned) {
                return res.status(403).json({
                    message: "You are not assigned to this custom event. Only assigned students can check in.",
                    student_name: studentFullName,
                    error: 'not_assigned_to_custom_event'
                });
            }
        }

        // Note: Previously blocked students registered after event activation.
        // Removed this restriction to allow all approved students to attend any active event.

        // Calculate late threshold - prioritize session's late_timer_minutes over global setting
        const lateThreshold = session.late_timer_minutes !== undefined && session.late_timer_minutes !== null
            ? session.late_timer_minutes
            : (rfidSettings.lateThresholdMinutes !== undefined && rfidSettings.lateThresholdMinutes !== null
                ? rfidSettings.lateThresholdMinutes
                : 30);

        const calculateIsLate = (startTime) => {
            if (!startTime || !event.event_date) return false;
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const eventDate = new Date(event.event_date);
            const eventStartUTC = new Date(Date.UTC(
                eventDate.getUTCFullYear(),
                eventDate.getUTCMonth(),
                eventDate.getUTCDate(),
                startHour - 8,
                startMinute,
                0,
                0
            ));
            const lateThresholdUTC = new Date(eventStartUTC.getTime() + (lateThreshold * 60 * 1000));
            return now > lateThresholdUTC;
        };

        // Find or create log for this session
        let log = await LogModel.findOne({
            session_id: req.params.sessionId,
            student_id: student._id
        });

        let action = '';

        if (!log) {
            // New check-in
            // Global checkInEnabled must be true for check-in to work
            // Session check_in_locked only applies when global setting is off
            if (!rfidSettings.checkInEnabled) {
                return res.status(403).json({
                    message: `${session.label} check-in is currently disabled.`,
                    student_name: studentFullName,
                    locked: 'check_in'
                });
            }

            const isLate = calculateIsLate(session.start_time);

            log = new LogModel({
                event_id: event._id,
                session_id: session._id,
                student_id: student._id,
                student_id_number: student.student_id,
                rfid_code: student.rfid_code || '',
                student_name: studentFullName,
                program: student.program,
                year_level: student.year_level,
                check_in_at: now,
                is_late: isLate,
                check_in_only: session.check_in_only || false,
                source,
                input_method: isManualStudentId ? 'manual_student_id' : 'rfid'
            });
            action = 'check_in';
        } else if (!log.check_out_at) {
            // Block check-out if session is check-in only — check FIRST before
            // any cooldown logic so the student always gets the right message.
            if (session.check_in_only) {
                return res.status(200).json({
                    message: `${studentFullName} is already checked in. This session is check-in only — no check-out required.`,
                    action: 'already_checked_in',
                    success: true,
                    check_in_only: true,
                    student_name: log.student_name,
                    student: {
                        full_name: log.student_name,
                        photo: student.photo,
                        student_id: student.student_id,
                        program: log.program || student.program,
                        year_level: log.year_level || student.year_level
                    }
                });
            }

            // Already checked in - user scanned again while in check-in mode
            const timeSinceCheckIn = now - new Date(log.check_in_at);

            // Duplicate check-in attempt within cooldown period
            if (timeSinceCheckIn < DUPLICATE_PREVENTION_MS) {
                const remainingSeconds = Math.ceil((DUPLICATE_PREVENTION_MS - timeSinceCheckIn) / 1000);
                return res.status(200).json({
                    message: `You have already checked in. Please wait ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s before checking out.`,
                    action: 'already_checked_in',
                    success: true,
                    student_name: log.student_name,
                    cooldown_remaining: remainingSeconds,
                    warning: 'duplicate_check_in_attempt',
                    student: {
                        full_name: log.student_name,
                        photo: student.photo,
                        student_id: student.student_id,
                        program: log.program || student.program,
                        year_level: log.year_level || student.year_level
                    }
                });
            }

            // Check-out
            // Global checkOutEnabled must be true for check-out to work
            if (!checkOutEnabled) {
                return res.status(403).json({
                    message: `${session.label} Already checked-in and check-out is currently disabled.`,
                    student_name: log.student_name,
                    locked: 'check_out',
                    student: {
                        full_name: log.student_name,
                        photo: student.photo,
                        student_id: student.student_id,
                        program: log.program || student.program,
                        year_level: log.year_level || student.year_level
                    }
                });
            }

            log.check_out_at = now;
            log.updated_at = now;
            action = 'check_out';
        } else {
            // Already complete
            const timeSinceCheckOut = now - new Date(log.check_out_at);
            if (timeSinceCheckOut < DUPLICATE_PREVENTION_MS) {
                const remainingSeconds = Math.ceil((DUPLICATE_PREVENTION_MS - timeSinceCheckOut) / 1000);
                return res.status(429).json({
                    message: `Already completed for this session.`,
                    student_name: log.student_name,
                    cooldown_remaining: remainingSeconds,
                    action: 'already_checked_out',
                    student: {
                        full_name: log.student_name,
                        photo: student.photo,
                        student_id: student.student_id,
                        program: log.program || student.program,
                        year_level: log.year_level || student.year_level
                    }
                });
            }
            return res.status(400).json({
                message: `Student already completed ${session.label} session attendance`,
                student_name: log.student_name,
                check_in_at: log.check_in_at,
                check_out_at: log.check_out_at,
                action: 'already_completed',
                student: {
                    full_name: log.student_name,
                    photo: student.photo,
                    student_id: student.student_id,
                    program: log.program || student.program,
                    year_level: log.year_level || student.year_level
                }
            });
        }

        await log.save();

        const message = action === 'check_in'
            ? (log.is_late ? `${session.label} Check-in successful (Late)` : `${session.label} Check-in successful`)
            : `${session.label} Check-out successful`;

        res.json({
            message,
            action,
            is_late: log.is_late,
            session_label: session.label,
            log: log.toJSON(),
            student_name: log.student_name,
            student_photo: student.photo,
            student: {
                full_name: studentFullName,
                photo: student.photo,
                student_id: student.student_id,
                program: student.program,
                year_level: student.year_level
            }
        });
    } catch (err) {
        // Handle duplicate key error gracefully - this can happen if there's still an old unique index
        if (err.code === 11000 && err.message.includes('event_id')) {
            return res.status(409).json({
                message: "Database index conflict. Please try again - the system is updating. If this persists, contact support.",
                error_type: 'index_conflict'
            });
        }
        internalError(res, err);
    }
};

app.post('/apis/attendance/sessions/:sessionId/check', auth, sessionAttendanceCheck);

// Face-recognition based attendance check. Admin sends a 128-float descriptor
// captured by the kiosk camera; we compare against every enrolled student in
// the active college, pick the closest match below threshold, then delegate
// to the same handler used by RFID so behaviour stays in lockstep.
app.post('/apis/attendance/sessions/:sessionId/check-face', auth, async (req, res) => {
    try {
        const { descriptor } = req.body || {};
        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({ message: "A 128-float face descriptor is required." });
        }

        const college = req.college || 'CCS';
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, college);
        const candidates = await StudentModel.find(
            { 'face_descriptors.0': { $exists: true } },
            { student_id: 1, full_name: 1, first_name: 1, middle_name: 1, last_name: 1, suffix: 1, photo: 1, program: 1, year_level: 1, face_descriptors: 1 }
        ).lean();

        // Stricter threshold than enrollment match (0.42) so we don't false-trigger
        // a check-in on a similar-looking student. Tune in tandem with the kiosk UI.
        const MATCH_THRESHOLD = 0.45;
        let best = { distance: Infinity, student: null };
        for (const s of candidates) {
            for (const fd of (s.face_descriptors || [])) {
                if (!Array.isArray(fd.descriptor) || fd.descriptor.length !== 128) continue;
                let sumSq = 0;
                for (let i = 0; i < 128; i++) {
                    const d = descriptor[i] - fd.descriptor[i];
                    sumSq += d * d;
                }
                const dist = Math.sqrt(sumSq);
                if (dist < best.distance) {
                    best = { distance: dist, student: s };
                }
            }
        }

        if (!best.student || best.distance > MATCH_THRESHOLD) {
            return res.status(404).json({
                message: "No matching face found. Please try again or use RFID.",
                no_match: true,
                best_distance: best.student ? Number(best.distance.toFixed(3)) : null
            });
        }

        // Delegate to the unified handler with a synthesised body so all the
        // duplicate-prevention / session-state logic is identical to RFID.
        // Preserve any GPS fields from the original request so geofence
        // enforcement still applies to face check-ins.
        const { latitude, longitude, accuracy } = req.body || {};
        req.body = {
            student_id: best.student.student_id,
            identifier_type: 'student_id',
            source: 'face',
            face_match_distance: Number(best.distance.toFixed(3)),
            latitude,
            longitude,
            accuracy
        };
        return sessionAttendanceCheck(req, res);
    } catch (err) {
        internalError(res, err);
    }
});

// Get student's own attendance records - now session-based
app.get('/apis/attendance/my-records', studentAuthWithToken, async (req, res) => {
    try {
        const student = req.student;
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Run the auto-cascade so any session whose parent event has just
        // become active is reported as 'active' here too. The student-facing
        // Attendance page only treats sessions with status='active' as
        // available for self check-in, so without this the Face ID button
        // would stay locked even after the admin activates the event.
        try {
            if (typeof autoUpdateEventStatuses === 'function') {
                await autoUpdateEventStatuses();
            }
        } catch (_) {}

        // Fetch all events - students can view all regular events, but only assigned custom events
        // Regular events: visible to all students
        // Custom events: only visible to assigned students
        const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
        const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
        const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

        const events = await EventModel.find({
            $or: [
                { is_custom: false },  // All regular events visible to everyone
                { is_custom: { $exists: false } },  // Events created before is_custom field existed
                { is_custom: null },  // Events with null is_custom
                { is_custom: true, assigned_users: { $in: [student._id] } }  // Custom events only for assigned students
            ]
        }).sort({ event_date: -1 });

        // Debug logging
        console.log(`[My Records] Student ${student.student_id} (${student._id}) requested records`);
        console.log(`[My Records] Query found ${events.length} total events - regular: ${events.filter(e => !e.is_custom).length}, custom: ${events.filter(e => e.is_custom).length}`);
        console.log(`[My Records] Sample events:`, events.slice(0, 3).map(e => ({ title: e.title, is_custom: e.is_custom, assigned: e.assigned_users.some(u => u.toString() === student._id.toString()) })));

        // Treat the student's account creation moment as the cutoff. Any event
        // whose date is strictly before the student registered cannot belong to
        // their attendance history — they literally couldn't have shown up. We
        // compare on calendar date (PH) rather than full timestamps so an event
        // happening *on* the same day the student registered is still kept.
        const toDateOnly = (d) => {
            if (!d) return null;
            const dt = new Date(d);
            if (isNaN(dt.getTime())) return null;
            // Convert to PH (UTC+8) for the date-only comparison so a late-night
            // sign-up doesn't accidentally bury same-day events.
            const ph = new Date(dt.getTime() + 8 * 60 * 60 * 1000);
            return `${ph.getUTCFullYear()}-${String(ph.getUTCMonth() + 1).padStart(2, '0')}-${String(ph.getUTCDate()).padStart(2, '0')}`;
        };
        const studentRegisteredOn = toDateOnly(student.created_date);

        const records = await Promise.all(events.map(async (event) => {
            // Skip events that happened before the student registered. They
            // shouldn't appear in the student's history as "Absent" — the
            // student wasn't a member of the system yet.
            if (studentRegisteredOn) {
                const eventOn = toDateOnly(event.event_date);
                if (eventOn && eventOn < studentRegisteredOn) {
                    return null;
                }
            }

            // Get all sessions for this event
            const sessions = await SessionModel.find({ event_id: event._id })
                .sort({ start_time: 1 });

            // Get all logs for this student in this event
            let logs = await LogModel.find({
                event_id: event._id,
                student_id: student._id
            });

            // Populate excused_by_name if references exist
            const refIds = [...new Set(logs.filter(l => l.excused_by_id).map(l => l.excused_by_id.toString()))]
            if (refIds.length > 0) {
                const studentsMap = await StudentModel.find({ _id: { $in: refIds } }, 'full_name')
                const mastersMap = await Master.find({ _id: { $in: refIds } }, 'username')
                const refMap = {}
                studentsMap.forEach(s => { refMap[s._id.toString()] = s.full_name })
                mastersMap.forEach(m => { refMap[m._id.toString()] = m.username })
                logs = logs.map(l => {
                    const obj = l.toObject ? l.toObject() : { ...l }
                    obj.excused_by_name = refMap[(l.excused_by_id || '')?.toString()] || l.excused_by || null
                    return obj
                })
            } else {
                logs = logs.map(l => {
                    const obj = l.toObject ? l.toObject() : { ...l }
                    obj.excused_by_name = l.excused_by || null
                    return obj
                })
            }

            console.log(`[My Records] Processing event "${event.title}" - is_custom: ${event.is_custom}, sessions: ${sessions.length}, logs: ${logs.length}`);

            // Map sessions with their attendance status
            const sessionRecords = sessions.map(session => {
                const log = logs.find(l => l.session_id?.toString() === session._id.toString());

                let status = 'absent';
                if (log) {
                    if (log.excused) {
                        status = 'excused';
                    } else if (log.check_in_at && (log.check_out_at || session.check_in_only)) {
                        // Check-in only sessions: having checked in is enough for 'present'
                        status = log.is_late ? 'late' : 'present';
                    } else if (log.check_in_at) {
                        status = 'incomplete';
                    }
                }

                // If event is closed and student didn't complete attendance, override session status to 'closed'
                let sessionStatus = session.status;
                if (event.status === 'closed' && (status === 'absent' || status === 'incomplete')) {
                    sessionStatus = 'closed';
                }

                return {
                    session: {
                        _id: session._id,
                        label: session.label,
                        start_time: session.start_time,
                        end_time: session.end_time,
                        status: sessionStatus,
                        check_in_only: session.check_in_only || false,
                        late_timer_minutes: session.late_timer_minutes || 0
                    },
                    attendance: log ? {
                        check_in_at: log.check_in_at,
                        check_out_at: log.check_out_at,
                        is_late: log.is_late,
                        excused: log.excused || false,
                        excuse_reason: log.excuse_reason || null,
                        excused_by: log.excused_by || null,
                        excused_by_id: log.excused_by_id || null,
                        excused_by_model: log.excused_by_model || null,
                        status
                    } : {
                        check_in_at: null,
                        check_out_at: null,
                        excused: false,
                        excuse_reason: null,
                        excused_by: null,
                        excused_by_id: null,
                        excused_by_model: null,
                        status: 'absent'
                    }
                };
            });

            // Calculate overall event attendance status
            let overallStatus = 'absent';
            let excuseReason = null;
            const completedSessions = sessionRecords.filter(s => s.attendance.status === 'present' || s.attendance.status === 'late' || s.attendance.status === 'excused');
            const excusedSessions = sessionRecords.filter(s => s.attendance.status === 'excused');
            const lateSessions = sessionRecords.filter(s => s.attendance.status === 'late');
            const incompleteSessions = sessionRecords.filter(s => s.attendance.status === 'incomplete');

            if (sessions.length > 0) {
                // If any session is excused, overall status is excused (with reason from first excused session)
                if (excusedSessions.length > 0) {
                    overallStatus = 'excused';
                    excuseReason = excusedSessions[0].attendance.excuse_reason;
                } else if (completedSessions.length === sessions.length) {
                    overallStatus = lateSessions.length > 0 ? 'late' : 'present';
                } else if (completedSessions.length > 0 || incompleteSessions.length > 0) {
                    // If event is already closed/ended, mark as absent (not incomplete)
                    overallStatus = event.status === 'closed' ? 'absent' : 'incomplete';
                }
            } else if (event.status === 'closed') {
                // Event is closed and student has no attendance records → absent
                overallStatus = 'absent';
            }

            // Show all active events and closed events (with or without attendance records)
            // Students should see the full history of events available to them

            return {
                event: {
                    _id: event._id,
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    event_date: event.event_date,
                    year_level: event.year_level,
                    status: event.status,
                    is_custom: event.is_custom
                },
                sessions: sessionRecords,
                overall_status: overallStatus,
                excuse_reason: excuseReason
            };
        }));

        const filteredRecords = records.filter(r => r !== null);

        console.log(`[My Records] Final result: returning ${filteredRecords.length}/${records.length} records to student ${student.student_id}`);

        res.json({ data: filteredRecords });
    } catch (err) {
        internalError(res, err);
    }
});

// ==================== CONTRIBUTION TRACKING ENDPOINTS ====================

// Enhanced search for contributions with RFID support
app.get('/apis/contributions/search', auth, async (req, res) => {
    try {
        const { query, year_level, program, status, limit = 1000, page = 1, payment_id, year_levels = '', statuses = '' } = req.query;

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const CollegePaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const CollegePaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);

        // Use the specified payment event, or fall back to the latest
        let latestPayment;
        if (payment_id) {
            latestPayment = await CollegePaymentModel.findById(payment_id).lean();
        }
        if (!latestPayment) {
            latestPayment = await CollegePaymentModel.findOne({ amount_due: { $gt: 0 } }).sort({ created_at: -1 }).lean();
        }

        // Build a map of student_id -> campaign status from PaymentRecord
        const paymentRecords = await CollegePaymentRecordModel.find({}).lean();
        const paymentStatusMap = {};
        for (const rec of paymentRecords) {
            if (!latestPayment) break;
            const campaign = rec.campaigns?.find(c => c.payment_id?.toString() === latestPayment._id?.toString());
            if (campaign) {
                paymentStatusMap[rec.student_id] = {
                    payment_status: campaign.payment_status || 'unpaid',
                    amount_paid: campaign.amount_paid || 0,
                    paid_at: campaign.paid_at || null,
                    paid_by_treasurer: campaign.paid_by_treasurer || null
                };
            }
        }

        // Fetch all approved students
        const studentFilter = { status: 'approved' };
        const allStudents = await StudentModel.find(studentFilter, {
            student_id: 1, first_name: 1, last_name: 1, full_name: 1,
            program: 1, year_level: 1, photo: 1
        }).lean();

        // Build records for every student, using PaymentRecord status when available
        const merged_records = allStudents.map(s => {
            const pr = paymentStatusMap[s.student_id] || {};
            return {
                _id: `rec_${s.student_id}`,
                student_id: s.student_id,
                student_id_number: s.student_id,
                student_name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                photo: s.photo || '',
                program: s.program,
                year_level: s.year_level,
                payment_status: pr.payment_status || 'unpaid',
                original_amount: latestPayment?.amount_due || 0,
                discount_value: 0,
                target_amount: latestPayment?.amount_due || 0,
                amount_paid: pr.amount_paid || 0,
                paid_at: pr.paid_at || null,
                paid_by_treasurer: pr.paid_by_treasurer || null,
                created_at: new Date()
            };
        });

        // Merge real records + synthetic entries
        let merged = merged_records;

        // Apply filters
        const ylArr = year_levels ? year_levels.split(',').map(y => y.trim()).filter(Boolean) : [];
        const stArr = statuses ? statuses.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

        if (ylArr.length) {
            merged = merged.filter(r => ylArr.includes(r.year_level));
        } else if (year_level) {
            merged = merged.filter(r => r.year_level === year_level);
        }

        if (stArr.length) {
            const wantPaid   = stArr.includes('paid');
            const wantUnpaid = stArr.includes('unpaid');
            if (wantPaid && !wantUnpaid) {
                merged = merged.filter(r => (r.payment_status || '').toLowerCase() === 'paid');
            } else if (wantUnpaid && !wantPaid) {
                merged = merged.filter(r => !r.payment_status || ['unpaid', 'pending'].includes((r.payment_status || '').toLowerCase()));
            }
            // both or neither → no filter
        } else if (status) {
            const s = status.toLowerCase();
            if (s === 'unpaid') {
                merged = merged.filter(r => !r.payment_status || ['unpaid', 'pending'].includes((r.payment_status || '').toLowerCase()));
            } else {
                merged = merged.filter(r => (r.payment_status || '').toLowerCase() === s);
            }
        }

        if (program) merged = merged.filter(r => r.program === program);
        if (query) {
            const q = query.toLowerCase();
            merged = merged.filter(r =>
                (r.student_id_number || '').toLowerCase().includes(q) ||
                (r.student_name || '').toLowerCase().includes(q)
            );
        }

        const total = merged.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginated = merged.slice(skip, skip + parseInt(limit));

        console.log(`[CONTRIB SEARCH] total: ${total}, paid: ${merged_records.filter(r => r.payment_status === 'paid').length}, unpaid: ${merged_records.filter(r => r.payment_status !== 'paid').length}`);

        res.json({
            success: true,
            data: paginated,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        internalError(res, err);
    }
});

// Export audit log: record a download
app.post('/apis/export-logs', auth, async (req, res) => {
    try {
        const { record_count, format, payment_title, filters } = req.body;
        const LogModel = getCollegeModel(ExportLog, CCS_ExportLog, COE_ExportLog, req.college);
        const log = new LogModel({
            exported_by:   req.master.full_name || req.master.username || 'Admin',
            record_count:  record_count  || 0,
            format:        format        || 'xlsx',
            payment_title: payment_title || '',
            filters:       filters       || {}
        });
        await log.save();
        res.json({ message: 'Logged', log });
    } catch (err) {
        internalError(res, err);
    }
});

// Export audit log: retrieve recent downloads (most recent 50)
app.get('/apis/export-logs', auth, async (req, res) => {
    try {
        const LogModel = getCollegeModel(ExportLog, CCS_ExportLog, COE_ExportLog, req.college);
        const logs = await LogModel.find({}).sort({ exported_at: -1 }).limit(50).lean();
        res.json({ logs });
    } catch (err) {
        internalError(res, err);
    }
});

// Download payment records as Excel
app.get('/apis/contributions/download/excel', auth, async (req, res) => {
    try {
        const { status, year_level = '', program = '', payment_id, year_levels = '', statuses = '' } = req.query;

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const CollegePaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
        const CollegePaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);

        // Resolve which payment event to export
        let activePayment;
        if (payment_id) {
            activePayment = await CollegePaymentModel.findById(payment_id).lean();
        }
        if (!activePayment) {
            activePayment = await CollegePaymentModel.findOne({ amount_due: { $gt: 0 } }).sort({ created_at: -1 }).lean();
        }

        // Build student_id -> campaign status map from PaymentRecord
        const paymentRecords = await CollegePaymentRecordModel.find({}).lean();
        const paymentStatusMap = {};
        for (const rec of paymentRecords) {
            if (!activePayment) break;
            const campaign = rec.campaigns?.find(c => c.payment_id?.toString() === activePayment._id?.toString());
            if (campaign) {
                paymentStatusMap[rec.student_id] = {
                    payment_status: campaign.payment_status || 'unpaid',
                    amount_paid: campaign.amount_paid || 0,
                    paid_at: campaign.paid_at || null,
                    paid_by_treasurer: campaign.paid_by_treasurer || null
                };
            }
        }

        // Fetch all approved students
        const allStudents = await StudentModel.find({ status: 'approved' }, {
            student_id: 1, first_name: 1, last_name: 1, full_name: 1, program: 1, year_level: 1
        }).lean();

        // Merge student list with payment status
        let merged = allStudents.map(s => {
            const pr = paymentStatusMap[s.student_id] || {};
            return {
                student_id_number: s.student_id,
                student_name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                program: s.program || '',
                year_level: s.year_level || '',
                payment_status: pr.payment_status || 'unpaid',
                amount_due: activePayment?.amount_due || 0,
                amount_paid: pr.amount_paid || 0,
                paid_at: pr.paid_at || null,
                paid_by_treasurer: pr.paid_by_treasurer || null
            };
        });

        // Apply filters — support both single-value and multi-value params
        const dlYlArr = year_levels ? year_levels.split(',').map(y => y.trim()).filter(Boolean) : [];
        const dlStArr = statuses ? statuses.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

        if (dlYlArr.length) {
            merged = merged.filter(r => dlYlArr.includes(r.year_level));
        } else if (year_level) {
            merged = merged.filter(r => r.year_level === year_level);
        }

        if (dlStArr.length) {
            const wantPaid   = dlStArr.includes('paid');
            const wantUnpaid = dlStArr.includes('unpaid');
            if (wantPaid && !wantUnpaid) {
                merged = merged.filter(r => (r.payment_status || '').toLowerCase() === 'paid');
            } else if (wantUnpaid && !wantPaid) {
                merged = merged.filter(r => !r.payment_status || ['unpaid', 'pending'].includes((r.payment_status || '').toLowerCase()));
            }
        } else if (status) {
            const s = String(status).toLowerCase();
            if (s === 'unpaid') {
                merged = merged.filter(r => !r.payment_status || ['unpaid', 'pending'].includes((r.payment_status || '').toLowerCase()));
            } else {
                merged = merged.filter(r => (r.payment_status || '').toLowerCase() === s);
            }
        }

        if (program) merged = merged.filter(r => r.program === program);

        // Sort: paid first, then alphabetically
        merged.sort((a, b) => {
            const ap = a.payment_status === 'paid' ? 0 : 1;
            const bp = b.payment_status === 'paid' ? 0 : 1;
            if (ap !== bp) return ap - bp;
            return (a.student_name || '').localeCompare(b.student_name || '');
        });

        console.log('[CONTRIB DOWNLOAD] exporting records:', merged.length, '| event:', activePayment?.title || 'none');

        const exportHeaders = ['Student ID', 'Name', 'Program', 'Year Level', 'Amount Due', 'Amount Paid', 'Status', 'Date Paid', 'Recorded By'];

        const formatPaidBy = (r) => {
            if (r.payment_status !== 'paid') return '';
            if (!r.paid_by_treasurer) return 'Admin';
            if (typeof r.paid_by_treasurer === 'string') return r.paid_by_treasurer || 'Admin';
            const fn = (r.paid_by_treasurer.first_name || '').trim();
            const ln = (r.paid_by_treasurer.last_name || '').trim();
            return [fn, ln].filter(Boolean).join(' ') || 'Admin';
        };

        const exportRows = merged.map(r => [
            r.student_id_number,
            r.student_name,
            r.program,
            r.year_level,
            r.amount_due,
            r.payment_status === 'paid' ? r.amount_paid : '',
            (r.payment_status || 'unpaid').toUpperCase(),
            r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-PH') : '',
            formatPaidBy(r)
        ]);

        const exportCsv = [exportHeaders, ...exportRows].map(row =>
            row.map(cell => `"${String(cell ?? '')}"`).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="payment-records-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(exportCsv);
    } catch (err) {
        console.error('[CONTRIB DOWNLOAD] error:', err);
        internalError(res, err);
    }
});


// ==================== RAFFLE TICKET ENDPOINTS ====================

// Submit raffle tickets for a student
app.post('/apis/admin/raffle-tickets', auth, async (req, res) => {
    try {
        const { student_id, rfid_code, rural_count, evergood_count, admin_username } = req.body;

        const ruralCount = parseInt(rural_count) || 0;
        const evergoodCount = parseInt(evergood_count) || 0;
        const totalCount = ruralCount + evergoodCount;

        if (ruralCount > 500 || evergoodCount > 500) {
            return res.status(400).json({ message: 'Each ticket type cannot exceed 500' });
        }
        if (totalCount < 1) {
            return res.status(400).json({ message: 'Total ticket count must be at least 1' });
        }

        let query = {};
        if (student_id) query.student_id = student_id;
        else if (rfid_code) query.rfid_code = rfid_code;
        else return res.status(400).json({ message: 'Student ID or RFID required' });

        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
        const student = await StudentModel.findOne(query);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const category = getRaffleCategory(totalCount);
        const RaffleTicketModel = getCollegeModel(RaffleTicket, CCS_RaffleTicket, COE_RaffleTicket, req.college);

        const entry = new RaffleTicketModel({
            student_id_number: student.student_id,
            student_name: student.full_name || `${student.first_name} ${student.last_name}`,
            program: student.program || '',
            year_level: student.year_level || '',
            ticket_type: 'both',
            rural_count: ruralCount,
            evergood_count: evergoodCount,
            ticket_count: totalCount,
            category,
            submitted_by: admin_username || '',
            submitted_at: new Date()
        });
        await entry.save();
        res.json({ success: true, message: 'Raffle ticket entry recorded', entry, category });
    } catch (err) {
        internalError(res, err);
    }
});

// Get all raffle ticket entries
app.get('/apis/admin/raffle-tickets', auth, async (req, res) => {
    try {
        const RaffleTicketModel = getCollegeModel(RaffleTicket, CCS_RaffleTicket, COE_RaffleTicket, req.college);
        const entries = await RaffleTicketModel.find({}).sort({ submitted_at: -1 });
        res.json({ success: true, data: entries });
    } catch (err) {
        internalError(res, err);
    }
});

// Delete a raffle ticket entry
app.delete('/apis/admin/raffle-tickets/:id', auth, async (req, res) => {
    try {
        const RaffleTicketModel = getCollegeModel(RaffleTicket, CCS_RaffleTicket, COE_RaffleTicket, req.college);
        const deleted = await RaffleTicketModel.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Entry not found' });
        res.json({ success: true, message: 'Raffle ticket entry deleted' });
    } catch (err) {
        internalError(res, err);
    }
});

// Get the logged-in student's own raffle ticket entries
app.get('/apis/student/raffle-ticket', studentAuthWithToken, async (req, res) => {
    try {
        const RaffleTicketModel = getCollegeModel(RaffleTicket, CCS_RaffleTicket, COE_RaffleTicket, req.college);
        const entries = await RaffleTicketModel.find({
            student_id_number: req.student.student_id
        }).sort({ submitted_at: -1 });
        res.json({ success: true, data: entries });
    } catch (err) {
        internalError(res, err);
    }
});

// ════════════════════════════════════════════════════════════════════════════
// STUDENT CHANGE REQUESTS
// ════════════════════════════════════════════════════════════════════════════

// Student: submit a new change request
app.post('/apis/requests', studentAuthWithToken, async (req, res) => {
    try {
        const student = req.student;
        const { type, new_value, first_name, middle_name, last_name, suffix, reason } = req.body;

        if (!type || !['name', 'department'].includes(type))
            return res.status(400).json({ message: 'Invalid request type.' });
        if (!reason || !reason.trim())
            return res.status(400).json({ message: 'Reason is required.' });
        if (!new_value || !new_value.trim())
            return res.status(400).json({ message: 'New value is required.' });

        // Block duplicate pending requests of the same type
        const existing = await ChangeRequest.findOne({ student_id: student.student_id, type, status: 'pending' });
        if (existing)
            return res.status(409).json({ message: 'You already have a pending request of this type. Wait for it to be reviewed first.' });

        const request = new ChangeRequest({
            student_id:   student.student_id,
            student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim().toUpperCase(),
            college:      req.college || student.college || 'CCS',
            type,
            new_value:    new_value.trim(),
            first_name:   (first_name || '').trim(),
            middle_name:  (middle_name || '').trim(),
            last_name:    (last_name || '').trim(),
            suffix:       (suffix || '').trim(),
            reason:       reason.trim().slice(0, 500)
        });
        await request.save();
        res.status(201).json({ message: 'Request submitted successfully.', request });
    } catch (err) {
        internalError(res, err);
    }
});

// Student: view their own requests
app.get('/apis/requests/my', studentAuthWithToken, async (req, res) => {
    try {
        const requests = await ChangeRequest.find({ student_id: req.student.student_id })
            .sort({ created_at: -1 })
            .limit(50);
        res.json(requests);
    } catch (err) {
        internalError(res, err);
    }
});

// Admin / Co-admin: list requests
// - Co-admin sees only their own college
// - Super-admin sees all (or filtered by ?college=)
app.get('/apis/requests', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const { status, college } = req.query;
        const filter = {};

        const isSuperAdminRole = req.master && req.master.role === 'admin';
        if (!isSuperAdminRole) {
            filter.college = req.college;
        } else if (college && VALID_COLLEGES.includes(college.toUpperCase())) {
            filter.college = college.toUpperCase();
        }

        if (status && ['pending', 'approved', 'rejected'].includes(status))
            filter.status = status;

        const requests = await ChangeRequest.find(filter).sort({ created_at: -1 }).limit(300);
        const pendingFilter = { ...filter, status: 'pending' };
        delete pendingFilter.status; // re-count all pending (regardless of the status filter)
        if (!isSuperAdminRole) pendingFilter.college = req.college;
        const pending_count = await ChangeRequest.countDocuments({ ...pendingFilter, status: 'pending' });

        res.json({ requests, pending_count });
    } catch (err) {
        internalError(res, err);
    }
});

// Admin: approve a request — auto-applies name changes to the student record
app.put('/apis/requests/:id/approve', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const request = await ChangeRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found.' });
        if (request.status !== 'pending')
            return res.status(409).json({ message: 'This request has already been reviewed.' });

        if (request.type === 'name') {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, request.college);
            const student = await StudentModel.findOne({ student_id: request.student_id });
            if (student) {
                if (request.first_name)  student.first_name  = request.first_name;
                if (request.last_name)   student.last_name   = request.last_name;
                student.middle_name = request.middle_name;
                student.suffix      = request.suffix;
                student.full_name   = [student.first_name, student.middle_name, student.last_name, student.suffix]
                    .filter(Boolean).join(' ').toUpperCase();
                await student.save();
            }
        }
        // Department changes: approved status is recorded but the admin must
        // manually reassign the student via Manage — cross-collection moves are complex.

        request.status      = 'approved';
        request.reviewed_by = req.master ? (req.master.name || req.master.username || 'Admin') : 'Admin';
        request.reviewed_at = new Date();
        await request.save();

        res.json({ message: 'Request approved.', request });
    } catch (err) {
        internalError(res, err);
    }
});

// Admin: reject a request with an optional note
app.put('/apis/requests/:id/reject', auth, requireCoAdminOrAbove, async (req, res) => {
    try {
        const { admin_note } = req.body;
        const request = await ChangeRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found.' });
        if (request.status !== 'pending')
            return res.status(409).json({ message: 'This request has already been reviewed.' });

        request.status      = 'rejected';
        request.admin_note  = (admin_note || '').trim().slice(0, 300);
        request.reviewed_by = req.master ? (req.master.name || req.master.username || 'Admin') : 'Admin';
        request.reviewed_at = new Date();
        await request.save();

        res.json({ message: 'Request rejected.', request });
    } catch (err) {
        internalError(res, err);
    }
});

export default app;