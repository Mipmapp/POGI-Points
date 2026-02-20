    import express from 'express';
    import mongoose from 'mongoose';
    import dotenv from 'dotenv';
    import cors from 'cors';
    import bcrypt from 'bcrypt';
    import jwt from 'jsonwebtoken';
    import nodemailer from 'nodemailer';
    import crypto from 'crypto';
    import { MongoClient } from 'mongodb';

    const app = express();
    dotenv.config();

    const ALLOWED_ORIGINS = [
    'https://ssaam.vercel.app',
    'https://ssaam-api.vercel.app',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
    ].filter(Boolean);

    const isReplitOrigin = (origin) => {
    if (!origin) return false;
    return origin.endsWith('.replit.dev') || origin.endsWith('.repl.co');
    };

    const isLocalhost = (origin) => {
    if (!origin) return false;
    return origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
    };

    const corsOptions = {
    origin: function(origin, callback) {
        // Allow requests with no origin (same-origin requests, mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Allow if origin is in allowed list, is a Replit origin, or is localhost (for development)
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-SSAAM-TS', 'X-SSAAM-College'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
    };

    app.use(cors(corsOptions));
    app.use(express.json());

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
    const MONGO_URI = 'mongodb+srv://SSAAM:ssaam.admin.jrmsu@cluster0.bnwy9iy.mongodb.net/dbconnect?retryWrites=true&w=majority';

    // Helper to determine college from request and get collection prefix
    function getCollegeFromRequest(req) {
        try {
            // Try header first (most direct - set by frontend)
            const collegeHeader = req.headers['x-ssaam-college'];
            if (collegeHeader && typeof collegeHeader === 'string') {
                if (collegeHeader.toUpperCase() === 'COE') return 'COE';
                if (collegeHeader.toUpperCase() === 'CCS') return 'CCS';
            }

            // Try other headers/theme indicators
            const theme = req.headers['x-ssaam-theme'] || req.headers['x-ssaam-department'];
            if (theme && typeof theme === 'string') {
                if (theme.toLowerCase().includes('coe')) return 'COE';
                if (theme.toLowerCase().includes('ccs')) return 'CCS';
            }
            
            // Try to extract college from JWT token directly (before auth middleware sets req.master)
            try {
                const token = extractToken(req);
                if (token) {
                    const decoded = jwt.verify(token, SSAAM_API_KEY);
                    if (decoded.college) {
                        if (decoded.college === 'COE') return 'COE';
                        if (decoded.college === 'CCS') return 'CCS';
                    }
                }
            } catch (jwtErr) {
                // Token verification failed, continue to next method
            }

            // Fallback to req.master if it's already set (from other auth paths)
            if (req.master && req.master.college) {
                if (req.master.college === 'COE') return 'COE';
                if (req.master.college === 'CCS') return 'CCS';
            }
            if (req.student && req.student.program) {
                // Check if student program is COE-based
                const coePrograms = ['BSECE', 'BSEE', 'BSME'];
                if (coePrograms.includes(req.student.program)) return 'COE';
            }
        } catch (e) {
            console.error('Error determining college from request:', e.message);
        }
        
        return 'CCS'; // Default to CCS
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
        const prefix = college === 'COE' ? 'coe_' : 'ccs_';
        return `${prefix}${baseCollectionName}`;
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

        // Query param
        if (req.query && req.query.token) return req.query.token;

        // Cookie (if cookie-parser is used)
        if (req.cookies && req.cookies.ssaam_token) return req.cookies.ssaam_token;

        return null;
    }

    // Helper function to get prefixed collection name
    function getPrefix(college) {
        return college === 'COE' ? 'coe_' : 'ccs_';
    }

    // Helper to get collection name with prefix (excludes 'masters')
    function withPrefix(college, collectionName) {
        if (collectionName === 'masters') return 'masters';
        return `${getPrefix(college)}${collectionName}`;
    }

    // Cache for dynamically created models
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
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }

    const SSAAM_API_KEY = process.env.SSAAM_API_KEY;
    const SSAAM_CRYPTO_KEY = process.env.SSAAM_CRYPTO_KEY;
    const ADMIN_VERIFICATION_SECRET = process.env.ADMIN_VERIFICATION_SECRET;
    const PRIMARY_ADMIN_USERNAME = process.env.PRIMARY_ADMIN_USERNAME || 'ssaam';

    const VALID_PROGRAMS = ['BSCS', 'BSIT', 'BSIS'];
    const VALID_SUFFIXES = ['', 'Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    const VALID_SEMESTERS = ['1st Sem', '2nd Sem'];
    const VALID_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const VALID_ROLES = ['student', 'medpub', 'treasurer'];
    const VALID_RFID_STATUS = ['verified', 'unverified', 'Unreadable'];

    // Rate limiting for likes (in-memory, resets on serverless cold start)
    const likeRateLimiter = {
        notificationCooldowns: new Map(),
        userAttempts: new Map(),
        COOLDOWN_MS: 2000,
        MAX_ATTEMPTS_PER_MINUTE: 15,
        WINDOW_MS: 60000,

        checkAndRecordAttempt(userId, notificationId) {
            const now = Date.now();
            const notifKey = `${userId}:${notificationId}`;

            // Periodic cleanup (runs on all requests, ~1% chance)
            if (Math.random() < 0.01) this.cleanup(now);

            // First, clean and get the user's attempt history (sliding window)
            let attempts = this.userAttempts.get(userId) || [];
            // Remove attempts older than 60 seconds
            attempts = attempts.filter(ts => now - ts < this.WINDOW_MS);

            // Record this attempt NOW (before any checks) to count ALL attempts
            attempts.push(now);
            this.userAttempts.set(userId, attempts);

            // Check per-user rate limit (too many attempts in window)
            if (attempts.length > this.MAX_ATTEMPTS_PER_MINUTE) {
                const oldestInWindow = attempts[0];
                const retryAfter = Math.ceil((this.WINDOW_MS - (now - oldestInWindow)) / 1000);
                return { allowed: false, retryAfter: Math.max(1, retryAfter) };
            }

            // Check per-notification cooldown
            const lastNotifAction = this.notificationCooldowns.get(notifKey);
            if (lastNotifAction && now - lastNotifAction < this.COOLDOWN_MS) {
                return { allowed: false, retryAfter: Math.ceil((this.COOLDOWN_MS - (now - lastNotifAction)) / 1000) };
            }

            // Allowed - update notification cooldown
            this.notificationCooldowns.set(notifKey, now);

            return { allowed: true };
        },

        cleanup(now) {
            for (const [k, ts] of this.notificationCooldowns.entries()) {
                if (now - ts > 120000) this.notificationCooldowns.delete(k);
            }
            for (const [k, attempts] of this.userAttempts.entries()) {
                const filtered = attempts.filter(ts => now - ts < this.WINDOW_MS);
                if (filtered.length === 0) {
                    this.userAttempts.delete(k);
                } else {
                    this.userAttempts.set(k, filtered);
                }
            }
        }
    };

    // Gmail accounts array with fallback support (server-side only, never exposed to clients)
    const GMAIL_ACCOUNTS = [
        { user: "pabbly.bot.1@gmail.com", pass: "ofmuqxxtxktmflpe" },
        { user: "acchelp283@gmail.com", pass: "lpnkmuszdpstqfkj" },
        { user: "holdacc31@gmail.com", pass: "akirzhsqplridphz" },
        { user: "ssaamjrmsu@gmail.com", pass: "cwkqguvsgyrzrnba" },
        { user: "keny46514@gmail.com", pass: "lcketsitjhuxekqd" },
        { user: "pabbly.bot.2@gmail.com", pass: "yjmglrbnftmvxkov" },
        { user: "kencath0@gmail.com", pass: "rflwxmdmopcsskks" },
        { user: "kencath139@gmail.com", pass: "uxoxmbddqvlsatim" }
    ];

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

    // Rate limiter for verification code resends (prevents email abuse)
    const verificationCodeRateLimiter = {
        attempts: new Map(), // email -> { count, firstAttemptTime, lastAttemptTime }
        MAX_ATTEMPTS: 4, // Maximum 4 resend attempts (original + 3 resends)
        WINDOW_MS: 15 * 60 * 1000, // 15 minute window
        MIN_INTERVAL_MS: 60 * 1000, // Minimum 60 seconds between attempts

        checkAndRecord(email) {
            const now = Date.now();
            const normalizedEmail = email.toLowerCase().trim();
            let data = this.attempts.get(normalizedEmail);

            // Cleanup old entries periodically
            if (Math.random() < 0.05) this.cleanup(now);

            // No previous attempts or window expired - allow and start fresh
            if (!data || (now - data.firstAttemptTime > this.WINDOW_MS)) {
                this.attempts.set(normalizedEmail, {
                    count: 1,
                    firstAttemptTime: now,
                    lastAttemptTime: now
                });
                return { allowed: true, attemptsRemaining: this.MAX_ATTEMPTS - 1 };
            }

            // Check minimum interval between attempts
            const timeSinceLastAttempt = now - data.lastAttemptTime;
            if (timeSinceLastAttempt < this.MIN_INTERVAL_MS) {
                const waitSeconds = Math.ceil((this.MIN_INTERVAL_MS - timeSinceLastAttempt) / 1000);
                return { 
                    allowed: false, 
                    waitSeconds,
                    message: `Please wait ${waitSeconds} seconds before requesting another code.`
                };
            }

            // Check if max attempts reached within window
            if (data.count >= this.MAX_ATTEMPTS) {
                const windowRemainingMs = this.WINDOW_MS - (now - data.firstAttemptTime);
                const waitMinutes = Math.ceil(windowRemainingMs / 60000);
                return { 
                    allowed: false, 
                    waitMinutes,
                    message: `Maximum resend attempts reached. Please wait ${waitMinutes} minutes before trying again.`
                };
            }

            // Allow and increment
            data.count++;
            data.lastAttemptTime = now;
            this.attempts.set(normalizedEmail, data);

            return { 
                allowed: true, 
                attemptsRemaining: this.MAX_ATTEMPTS - data.count 
            };
        },

        // Reset attempts for an email (call after successful verification)
        reset(email) {
            this.attempts.delete(email.toLowerCase().trim());
        },

        cleanup(now) {
            for (const [email, data] of this.attempts.entries()) {
                if (now - data.firstAttemptTime > this.WINDOW_MS) {
                    this.attempts.delete(email);
                }
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
                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${studentName}!</h2>
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
            : `Unfortunately, your account registration was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;

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
                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${studentName}!</h2>
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
                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${studentName}!</h2>
                        <div style="background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; color: #10b981;">RFID Verified!</span>
                        </div>
                        <p style="color: #4b5563;">Great news! Your RFID attendance card has been verified and is now active.</p>
                        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="color: #6b7280; margin: 5px 0;"><strong>RFID Code:</strong> ${rfidCode}</p>
                            <p style="color: #6b7280; margin: 5px 0;"><strong>Verified By:</strong> ${verifiedBy}</p>
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

    function decodeTimestamp(encodedString) {
        try {
            const decoded = Buffer.from(encodedString, 'base64').toString('binary');
            let timestamp = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ SSAAM_CRYPTO_KEY.charCodeAt(i % SSAAM_CRYPTO_KEY.length);
                timestamp += String.fromCharCode(charCode);
            }
            return timestamp;
        } catch (e) {
            return null;
        }
    }

    function isValidTimestamp(encodedString, maxAgeMinutes = 5) {
        const timestamp = decodeTimestamp(encodedString);
        if (!timestamp) return false;

        try {
            const requestTime = new Date(timestamp);
            const now = new Date();
            const diffMinutes = (now - requestTime) / (1000 * 60);

            return diffMinutes >= -2 && diffMinutes <= maxAgeMinutes;
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

    const registrationAttempts = new Map();
    const REGISTRATION_COOLDOWN_MS = 60000;

    function cleanupOldAttempts() {
        const now = Date.now();
        for (const [key, timestamp] of registrationAttempts.entries()) {
            if (now - timestamp > REGISTRATION_COOLDOWN_MS) {
                registrationAttempts.delete(key);
            }
        }
    }

    setInterval(cleanupOldAttempts, 60000);

    function antiBotProtection(req, res, next) {
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
        const rateLimitKey = `${clientIP}:${studentId}`;

        const lastAttempt = registrationAttempts.get(rateLimitKey);
        const now = Date.now();

        if (lastAttempt && (now - lastAttempt) < REGISTRATION_COOLDOWN_MS) {
            const remainingSeconds = Math.ceil((REGISTRATION_COOLDOWN_MS - (now - lastAttempt)) / 1000);
            return res.status(429).json({ 
                message: `Too many registration attempts. Please wait ${remainingSeconds} seconds before trying again.` 
            });
        }

        registrationAttempts.set(rateLimitKey, now);

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
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
        }
    });

    // ==================== PAYMENT ENDPOINTS ====================

    // Create new payment
    app.post('/apis/payments', adminOrTreasurerAuth, async (req, res) => {
        try {
            const { title, description, type, amount_due, deadline } = req.body;
            
            if (!title) {
                return res.status(400).json({ message: 'Payment title is required' });
            }
            
            // Get creator identifier - could be admin (master) or treasurer (student)
            const createdBy = req.master ? req.master.username : req.student.student_id;
            
            const payment = new Payment({
                title,
                description: description || '',
                type: type || 'fee',
                amount_due: amount_due || 0,
                deadline: deadline || null,
                created_by: createdBy
            });
            
            await payment.save();
            
            // Initialize payment campaigns for all approved students (consolidated approach)
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const students = await StudentModel.find({ status: 'approved' });
            
            // Create or update payment records for existing students (college-aware)
            const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
            for (const student of students) {
                let paymentRecord = await PaymentRecordModel.findOne({ student_id: student.student_id });
                
                if (!paymentRecord) {
                    // Create new consolidated record
                    paymentRecord = new PaymentRecordModel({
                        student_id: student.student_id,
                        student_id_number: student.student_id,
                        student_name: student.full_name || `${student.first_name} ${student.last_name}`,
                        program: student.program,
                        year_level: student.year_level,
                        campaigns: [{
                            payment_id: payment._id,
                            payment_status: 'pending',
                            created_at: new Date(),
                            updated_at: new Date()
                        }],
                        total_campaigns: 1,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                    await paymentRecord.save();
                } else {
                    // Add campaign to existing record
                    paymentRecord.campaigns.push({
                        payment_id: payment._id,
                        payment_status: 'pending',
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                    paymentRecord.total_campaigns = paymentRecord.campaigns.length;
                    paymentRecord.updated_at = new Date();
                    await paymentRecord.save();
                }
            }
            
            res.json({ success: true, data: payment, message: 'Payment created and records initialized' });
        } catch (err) {
            console.error('Error creating payment:', err);
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
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
    app.post('/apis/payments/migrate/fix-student-ids', adminOrTreasurerAuth, async (req, res) => {
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
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
        }
    });

    // Mark student as paid using RFID or Student ID
    app.put('/apis/payments/:paymentId/mark-paid', adminOrTreasurerAuth, async (req, res) => {
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
            
            // Find or create consolidated payment record
            let paymentRecord = await PaymentRecordModel.findOne({ student_id: student.student_id });
            
            if (!paymentRecord) {
                paymentRecord = new PaymentRecordModel({
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
                paid_by_treasurer: req.master ? req.master.username : req.user.username,
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
            
            // Update summary fields
            paymentRecord.total_campaigns = paymentRecord.campaigns.length;
            paymentRecord.campaigns_paid = paymentRecord.campaigns.filter(c => c.payment_status === 'paid').length;
            paymentRecord.total_amount_paid = paymentRecord.campaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
            paymentRecord.last_payment_at = paymentRecord.campaigns
                .filter(c => c.paid_at)
                .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
            paymentRecord.updated_at = new Date();
            
            await paymentRecord.save();
            
            res.json({ 
                success: true, 
                message: `${student.full_name || student.student_id} marked as paid`,
                data: paymentRecord 
            });
        } catch (err) {
            console.error('Error marking payment:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Mark student as unpaid
    app.put('/apis/payments/:paymentId/mark-unpaid', adminOrTreasurerAuth, async (req, res) => {
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
            
            const paymentRecord = await PaymentRecord.findOne({ student_id: student.student_id });
            
            if (!paymentRecord) {
                return res.status(404).json({ message: 'Payment record not found' });
            }
            
            // Always update program and year_level to latest student info
            paymentRecord.program = student.program || paymentRecord.program || '';
            paymentRecord.year_level = student.year_level || paymentRecord.year_level || '';
            paymentRecord.student_name = student.full_name || `${student.first_name} ${student.last_name}`;
            
            // Find and update campaign
            const campaignIndex = paymentRecord.campaigns.findIndex(c => c.payment_id.toString() === paymentId);
            
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
            
            // Update summary fields
            paymentRecord.total_campaigns = paymentRecord.campaigns.length;
            paymentRecord.campaigns_paid = paymentRecord.campaigns.filter(c => c.payment_status === 'paid').length;
            paymentRecord.total_amount_paid = paymentRecord.campaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
            paymentRecord.last_payment_at = paymentRecord.campaigns
                .filter(c => c.paid_at)
                .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
            paymentRecord.updated_at = new Date();
            
            await paymentRecord.save();
            
            res.json({ 
                success: true, 
                message: `${student.full_name || student.student_id} marked as unpaid`,
                data: paymentRecord 
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Get student's payment status for a specific payment
    app.get('/apis/payments/:paymentId/student/:studentId', async (req, res) => {
        try {
            const paymentRecord = await PaymentRecord.findOne({
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
            res.status(500).json({ message: err.message });
        }
    });

    // Apply discount to payment record
    app.put('/apis/payments/:paymentId/apply-discount', adminOrTreasurerAuth, async (req, res) => {
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
            
            // Find the payment record
            const paymentRecord = await PaymentRecord.findOne({ student_id: studentId });
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
            res.status(500).json({ message: err.message });
        }
    });

    // Update payment status (close/archive)
    app.put('/apis/payments/:id', adminOrTreasurerAuth, async (req, res) => {
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
            res.status(500).json({ message: err.message });
        }
    });

    // Delete payment record for a student
    app.delete('/apis/payments/:paymentId/student/:studentId', adminOrTreasurerAuth, async (req, res) => {
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
            res.status(500).json({ message: err.message });
        }
    });

    // Delete entire payment campaign
    app.delete('/apis/payments/:paymentId', adminOrTreasurerAuth, async (req, res) => {
        try {
            const { paymentId } = req.params;
            
            // Find the payment campaign
            const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
            const payment = await PaymentModel.findById(paymentId);
            
            if (!payment) {
                return res.status(404).json({ message: 'Payment campaign not found' });
            }
            
            const paymentTitle = payment.title;
            
            // Remove this payment campaign from all consolidated records (college-aware)
            const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
            let recordsModified = 0;
            const allRecords = await PaymentRecordModel.find({});
            
            for (const record of allRecords) {
                const campaignIndex = record.campaigns.findIndex(c => c.payment_id.toString() === paymentId);
                if (campaignIndex >= 0) {
                    record.campaigns.splice(campaignIndex, 1);
                    
                    // Update summary fields
                    record.total_campaigns = record.campaigns.length;
                    record.campaigns_paid = record.campaigns.filter(c => c.payment_status === 'paid').length;
                    record.total_amount_paid = record.campaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
                    record.last_payment_at = record.campaigns
                        .filter(c => c.paid_at)
                        .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
                    record.updated_at = new Date();
                    
                    await record.save();
                    recordsModified++;
                }
            }
            
            // Delete the payment campaign itself (college-aware)
            await PaymentModel.deleteOne({ _id: paymentId });
            
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
            res.status(500).json({ message: err.message });
        }
    });

    // Update payment campaign status (Active/Closed)
    app.put('/apis/payments/:paymentId/status', adminOrTreasurerAuth, async (req, res) => {
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
            
            res.json({ 
                success: true, 
                message: `Payment campaign status updated to "${status}"`,
                data: payment 
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Sync payment campaign with all approved students (add missing students)
    app.post('/apis/payments/:paymentId/sync-students', adminOrTreasurerAuth, async (req, res) => {
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
            
            // Sync: add campaign to all students who don't have it yet
            for (const student of allApprovedStudents) {
                let paymentRecord = await PaymentRecord.findOne({ student_id: student.student_id });
                
                if (!paymentRecord) {
                    // Create new record with this campaign
                    paymentRecord = new PaymentRecord({
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
            res.status(500).json({ message: err.message });
        }
    });

    // Deduplicate payment records (remove duplicate campaigns within consolidated records)
    app.post('/apis/payments/:paymentId/deduplicate', adminOrTreasurerAuth, async (req, res) => {
        try {
            const { paymentId } = req.params;
            
            const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
            const payment = await PaymentModel.findById(paymentId);
            if (!payment) {
                return res.status(404).json({ message: 'Payment campaign not found' });
            }
            
            // Check all consolidated records for duplicate campaigns of this payment
            const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
            const allRecords = await PaymentRecordModel.find({});
            let duplicatesRemoved = 0;
            let recordsModified = 0;
            
            for (const record of allRecords) {
                const campaignsForPayment = record.campaigns.filter(c => c.payment_id.toString() === paymentId);
                
                if (campaignsForPayment.length > 1) {
                    // Keep the oldest paid campaign, or oldest campaign overall
                    const paidCampaigns = campaignsForPayment.filter(c => c.payment_status === 'paid');
                    const campaignToKeep = paidCampaigns.length > 0
                        ? paidCampaigns[0]
                        : campaignsForPayment.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
                    
                    // Remove all other campaigns for this payment
                    record.campaigns = record.campaigns.filter(c => {
                        if (c.payment_id.toString() === paymentId) {
                            if (c === campaignToKeep) return true; // Keep this one
                            duplicatesRemoved++;
                            return false; // Remove duplicate
                        }
                        return true; // Keep other payments' campaigns
                    });
                    
                    // Update summary fields
                    record.total_campaigns = record.campaigns.length;
                    record.campaigns_paid = record.campaigns.filter(c => c.payment_status === 'paid').length;
                    record.total_amount_paid = record.campaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
                    record.last_payment_at = record.campaigns
                        .filter(c => c.paid_at)
                        .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
                    record.updated_at = new Date();
                    
                    await record.save();
                    recordsModified++;
                }
            }
            
            if (duplicatesRemoved === 0) {
                return res.json({ 
                    success: true, 
                    message: 'No duplicates found',
                    data: {
                        duplicates_removed: 0,
                        records_modified: 0
                    }
                });
            }
            
            res.json({ 
                success: true, 
                message: `Removed ${duplicatesRemoved} duplicate campaign(s) from ${recordsModified} student record(s)`,
                data: {
                    duplicates_removed: duplicates.length,
                    total_records_remaining: remainingRecords.length
                }
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
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

            // Try to find by student_id string (common) or by ObjectId string (legacy)
            const possibleStudentIds = [studentId];
            if (req.master && req.master.id) possibleStudentIds.push(String(req.master.id));

            const paymentRecord = await PaymentRecordModel.findOne({ 
                $or: possibleStudentIds.map(id => ({ student_id: id }))
            }).populate({ path: 'campaigns.payment_id', model: PaymentModel, select: 'title description type amount_due deadline status created_at' });
            
            if (!paymentRecord) {
                return res.json({ 
                    success: true, 
                    data: []
                });
            }
            
            // Format the response as a receipt-style list from campaigns array
            // Filter out invalid payments: null payment_id, amount_due 0, empty title
            const formattedRecords = paymentRecord.campaigns
                .filter(campaign => {
                    const payment = campaign.payment_id;
                    // Only include if payment exists, has amount_due > 0, and has a valid title
                    return payment && 
                        payment.amount_due > 0 && 
                        payment.title && 
                        payment.title.trim() && 
                        payment.title.toLowerCase() !== 'unknown payment';
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
            res.status(500).json({ message: err.message });
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
            
            app.listen(PORT, () => {
                console.log(`Server running on ${PORT}`);
                // Run auto-update after server starts and DB is connected
                if (typeof autoUpdateEventStatuses === 'function') {
                    autoUpdateEventStatuses();
                }
            });
        } catch (err) {
            console.error(`MongoDB connection attempt ${retryCount + 1} failed:`, err.message);
            if (retryCount < maxRetries) {
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                setTimeout(() => connectWithRetry(retryCount + 1, maxRetries, retryDelay), retryDelay);
            } else {
                console.error('Max retries reached. Could not connect to MongoDB.');
                process.exit(1);
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
            schema.pre(method, function() {
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
    function getCollegeModel(baseModel, ccsModel, coeModel, college) {
        return college === 'COE' ? coeModel : ccsModel;
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
    // Create college-specific variants
    const CCS_SessionToken = mongoose.model("CCS_SessionToken", sessionTokenSchema, 'ccs_sessiontokens');
    const COE_SessionToken = mongoose.model("COE_SessionToken", sessionTokenSchema, 'coe_sessiontokens');

    const SESSION_INACTIVITY_MS = 12 * 60 * 60 * 1000;

    async function cleanupInactiveSessionTokens() {
        try {
            const cutoffTime = new Date(Date.now() - SESSION_INACTIVITY_MS);
            const result = await SessionToken.deleteMany({
                $or: [
                    { last_used_at: { $lt: cutoffTime } },
                    { last_used_at: null, created_at: { $lt: cutoffTime } }
                ]
            });
            if (result.deletedCount > 0) {
                console.log(`Cleaned up ${result.deletedCount} inactive session tokens`);
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
                validator: function(v) {
                    return UPPERCASE_ONLY_REGEX.test(v) && v.length <= 64;
                },
                message: "First name must be uppercase letters only and max 64 characters"
            }
        },
        middle_name: {
            type: String,
            validate: {
                validator: function(v) {
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
                validator: function(v) {
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
                message: "Program must be one of: BSCS, BSIT, or BSIS"
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
        }]
    });

    // Pre-save middleware to auto-generate full_name from parts
    // Use synchronous middleware (no `next`) to avoid runtime `next is not a function` errors
    studentSchema.pre('save', function() {
        if (!this.full_name || this.full_name.trim() === '') {
            const parts = [this.first_name, this.middle_name, this.last_name, this.suffix]
                .filter(p => p && p.trim() !== '');
            this.full_name = parts.join(' ').replace(/\s+/g, ' ').trim();
        }
    });

    const Student = mongoose.model("Student", studentSchema);
    const CCS_Student = mongoose.model("CCS_Student", studentSchema, 'ccs_students');
    const COE_Student = mongoose.model("COE_Student", studentSchema, 'coe_students');

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
        college: { type: String, enum: ['CCS', 'COE'], default: 'CCS' },
        created_at: { type: Date, default: Date.now }
    });

    masterSchema.methods.toJSON = function () {
        const obj = this.toObject();
        delete obj.password;
        return obj;
    };

    const Master = mongoose.model("Master", masterSchema);

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

    // Notifications Schema
    const notificationSchema = new mongoose.Schema({
        title: { type: String, required: true, maxlength: 200 },
        image_url: { type: String, default: null },
        message: { type: String, required: true, maxlength: 2000 },
        posted_by: { type: String, required: true, enum: ['admin', 'medpub'] },
        posted_by_name: { type: String, required: true },
        posted_by_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        was_edited: { type: Boolean, default: false },
        liked_by: [{ type: String }],
        edit_count: { type: Number, default: 0 },
        last_edit_date: { type: Date, default: null }
    });

    notificationSchema.index({ created_at: -1 });

    const Notification = mongoose.model("Notification", notificationSchema);
    const CCS_Notification = mongoose.model("CCS_Notification", notificationSchema, 'ccs_notifications');
    const COE_Notification = mongoose.model("COE_Notification", notificationSchema, 'coe_notifications');

    const notificationSeenSchema = new mongoose.Schema({
        user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        notification_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Notification' },
        seen_at: { type: Date, default: Date.now }
    });

    notificationSeenSchema.index({ user_id: 1, notification_id: 1 }, { unique: true });
    notificationSeenSchema.index({ notification_id: 1 });

    const NotificationSeen = mongoose.model("NotificationSeen", notificationSeenSchema);
    // Note: some deployments previously used the pluralized collection name
    // 'ccs_notificationseens' (and 'coe_notificationseens'). Use those names
    // to read existing data created before the model was standardized.
    const CCS_NotificationSeen = mongoose.model("CCS_NotificationSeen", notificationSeenSchema, 'ccs_notificationseens');
    const COE_NotificationSeen = mongoose.model("COE_NotificationSeen", notificationSeenSchema, 'coe_notificationseens');

    // ==================== APPLICATION SCHEMAS ====================

    // Application Form Configuration - Admin-managed application settings
    const applicationFormSchema = new mongoose.Schema({
        title: { type: String, required: true, maxlength: 200 },
        description: { type: String, maxlength: 2000, default: "" },
        status: { 
            type: String, 
            enum: ['active', 'closed'],
            default: 'active'
        },
        // Eligibility criteria - empty means all students can apply
        eligible_programs: { type: [String], default: [] }, // e.g., ['BSCS', 'BSIS']
        eligible_year_levels: { type: [String], default: [] }, // e.g., ['1st Year', '2nd Year']
        max_applicants: { type: Number, default: null }, // null = unlimited
        allow_one_per_student: { type: Boolean, default: true }, // Students can only apply once
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
        created_by_name: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        opened_at: { type: Date, default: null },
        closed_at: { type: Date, default: null }
    });

    applicationFormSchema.index({ status: 1, created_at: -1 });

    const ApplicationForm = mongoose.model("ApplicationForm", applicationFormSchema);
    const CCS_ApplicationForm = mongoose.model("CCS_ApplicationForm", applicationFormSchema, 'ccs_applicationforms');
    const COE_ApplicationForm = mongoose.model("COE_ApplicationForm", applicationFormSchema, 'coe_applicationforms');

    // Student Application Records - Individual student applications
    const studentApplicationSchema = new mongoose.Schema({
        form_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ApplicationForm', required: true },
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        student_id_number: { type: String, required: true }, // e.g., "21-A-12345"
        student_name: { type: String, required: true },
        program: { type: String, required: true },
        year_level: { type: String, required: true },
        email: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        application_data: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible for custom form fields
        notes: { type: String, maxlength: 1000, default: "" },
        reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', default: null },
        reviewed_by_name: { type: String, default: "" },
        applied_at: { type: Date, default: Date.now },
        reviewed_at: { type: Date, default: null }
    });

    studentApplicationSchema.index({ form_id: 1, student_id: 1 }, { unique: true });
    studentApplicationSchema.index({ form_id: 1, status: 1 });
    studentApplicationSchema.index({ student_id: 1 });
    studentApplicationSchema.index({ form_id: 1 });

    const StudentApplication = mongoose.model("StudentApplication", studentApplicationSchema);
    const CCS_StudentApplication = mongoose.model("CCS_StudentApplication", studentApplicationSchema, 'ccs_studentapplications');
    const COE_StudentApplication = mongoose.model("COE_StudentApplication", studentApplicationSchema, 'coe_studentapplications');

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
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
        created_by_name: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        activated_at: { type: Date, default: null },
        closed_at: { type: Date, default: null }
    });

    attendanceEventSchema.index({ status: 1, event_date: -1 });
    attendanceEventSchema.index({ created_at: -1 });

    const AttendanceEvent = mongoose.model("AttendanceEvent", attendanceEventSchema);
    const CCS_AttendanceEvent = mongoose.model("CCS_AttendanceEvent", attendanceEventSchema, 'ccs_attendanceevents');
    const COE_AttendanceEvent = mongoose.model("COE_AttendanceEvent", attendanceEventSchema, 'coe_attendanceevents');

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
        source: { type: String, enum: ['rfid', 'manual'], default: 'rfid' },
        input_method: { type: String, enum: ['rfid', 'manual_student_id'], default: 'rfid' },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
    });

    attendanceLogSchema.index({ session_id: 1, student_id: 1 }, { unique: true });
    attendanceLogSchema.index({ event_id: 1, student_id: 1 });
    attendanceLogSchema.index({ session_id: 1, rfid_code: 1 });
    attendanceLogSchema.index({ session_id: 1, check_in_at: -1 });

    // Virtual for attendance status (present, late, incomplete, absent)
    attendanceLogSchema.virtual('attendance_status').get(function() {
        // Excused has priority over other statuses
        if (this.excused) return 'excused';
        if (this.check_in_at && this.check_out_at) {
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

    // ==================== CONTRIBUTION SCHEMAS ====================

    // Event Contribution Schema - Track student payments for specific events
    // Used by treasurer to record which students have paid their event contributions
    const eventContributionSchema = new mongoose.Schema({
        event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceEvent', required: true },
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        student_id_number: { type: String, required: true }, // e.g., "21-A-12345"
        student_name: { type: String, required: true },
        program: { type: String },
        year_level: { type: String },
        payment_status: { 
            type: String, 
            enum: ['unpaid', 'pending', 'paid'], // include 'pending' to match UI status
            default: 'unpaid'
        },
        original_amount: { type: Number, default: 0 },
        discount_type: { type: String, enum: ['amount', 'percentage'], default: null },
        discount_value: { type: Number, default: 0 },
        target_amount: { type: Number, default: 0 },
        paid_at: { type: Date, default: null },
        paid_by_treasurer: { type: String, default: null }, // Username of treasurer who recorded payment
        notes: { type: String, default: "" },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
    });

    eventContributionSchema.index({ event_id: 1, student_id: 1 }, { unique: true });
    eventContributionSchema.index({ event_id: 1, payment_status: 1 });
    eventContributionSchema.index({ student_id: 1, payment_status: 1 });
    eventContributionSchema.index({ event_id: 1, student_id_number: 1 });

    const EventContribution = mongoose.model("EventContribution", eventContributionSchema);
    const CCS_EventContribution = mongoose.model("CCS_EventContribution", eventContributionSchema, 'ccs_eventcontributions');
    const COE_EventContribution = mongoose.model("COE_EventContribution", eventContributionSchema, 'coe_eventcontributions');

    // ==================== PAYMENT SCHEMAS ====================

    // Payment Schema - Create payment periods/campaigns to track contributions
    const paymentSchema = new mongoose.Schema({
        title: { type: String, required: true }, // e.g., "Membership Fee Q1 2026"
        description: { type: String, default: "" },
        type: { 
            type: String, 
            enum: ['membership', 'donation', 'fee', 'other'],
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
        updated_at: { type: Date, default: Date.now }
    });

    paymentSchema.index({ status: 1, created_at: -1 });
    paymentSchema.index({ created_by: 1 });

    const Payment = mongoose.model("Payment", paymentSchema);
    const CCS_Payment = mongoose.model("CCS_Payment", paymentSchema, 'ccs_payments');
    const COE_Payment = mongoose.model("COE_Payment", paymentSchema, 'coe_payments');

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
                        <h2 style="color: #1f2937; margin-top: 0;">Hello ${studentName}!</h2>
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

    async function auth(req, res, next) {
        const token = extractToken(req);

        if (!token)
            return res.status(401).json({ message: "Access denied. No token provided." });

        try {
            const decoded = jwt.verify(token, SSAAM_API_KEY);

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
            const decoded = jwt.verify(token, SSAAM_API_KEY);

            const tokenHash = hashToken(token);
            // Use college-aware SessionToken model
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

            // Fetch the full student document (college-aware)
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const student = await StudentModel.findOne({ student_id: decoded.student_id });
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }

            if (decoded.role === 'medpub') {
                if (student.role !== 'medpub') {
                    await SessionTokenModel.updateOne({ _id: sessionToken._id }, { is_revoked: true });
                    return res.status(403).json({ 
                        message: "Your MedPub access has been revoked. Please login again.",
                        code: 'MEDPUB_ACCESS_REVOKED'
                    });
                }
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
            return res.status(401).json({ message: "Unauthorized: Invalid key"});
        }

        next();
    }

    // Middleware to verify the token actually has isMaster: true in the JWT payload
    // This prevents localStorage tampering - the JWT signature cannot be forged
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



    // Middleware for treasurer role authorization
    async function treasurerAuth(req, res, next) {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        try {
            const decoded = jwt.verify(token, SSAAM_API_KEY);

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

            // Fetch the full student document (college-aware)
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const student = await StudentModel.findOne({ student_id: decoded.student_id });
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }

            // Check if user has treasurer role
            if (student.role !== 'treasurer') {
                return res.status(403).json({ 
                    message: "Access denied. Treasurer role required.",
                    code: 'TREASURER_ACCESS_REQUIRED'
                });
            }

            req.user = decoded;
            req.student = student;
            req.sessionToken = sessionToken;
            next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid token." });
        }
    }

    // Middleware for both admin and treasurer authorization
    async function adminOrTreasurerAuth(req, res, next) {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        try {
            const decoded = jwt.verify(token, SSAAM_API_KEY);

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

            // Check if this is an admin/master login
            if (decoded.isMaster) {
                // For admin/master users, verify from Master collection
                const master = await Master.findById(decoded.id);
                if (!master) {
                    return res.status(404).json({ message: "Admin user not found" });
                }
                req.user = decoded;
                req.master = master;
                req.sessionToken = sessionToken;
                next();
            } else {
                // For treasurer logins, verify from Student collection (college-aware)
                const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
                const student = await StudentModel.findOne({ student_id: decoded.student_id });
                if (!student) {
                    return res.status(404).json({ message: "Student not found" });
                }

                // Check if user has treasurer role
                if (student.role !== 'treasurer' && student.role !== 'admin') {
                    return res.status(403).json({ 
                        message: "Access denied. Treasurer role required.",
                        code: 'TREASURER_ACCESS_REQUIRED'
                    });
                }

                req.user = decoded;
                req.student = student;
                req.sessionToken = sessionToken;
                next();
            }
        } catch (err) {
            return res.status(401).json({ message: "Invalid token." });
        }
    }

    // Middleware that allows student, medpub, and treasurer roles to search
    // Non-treasurers can only search for their own student_id
    async function studentMedpubTreasurerAuth(req, res, next) {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        try {
            const decoded = jwt.verify(token, SSAAM_API_KEY);

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

            // Check if this is an admin/master login
            if (decoded.isMaster) {
                // For admin/master users, verify from Master collection
                const master = await Master.findById(decoded.id);
                if (!master) {
                    return res.status(404).json({ message: "Admin user not found" });
                }
                req.user = decoded;
                req.master = master;
                req.sessionToken = sessionToken;
                req.isTreasurer = true;
                next();
            } else {
                // For non-admin logins, verify from Student collection (college-aware)
                const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
                const student = await StudentModel.findOne({ student_id: decoded.student_id });
                if (!student) {
                    return res.status(401).json({ message: "Student not found" });
                }

                // Verify token student_id matches database record
                // This prevents token tampering or session hijacking
                if (student.student_id !== decoded.student_id) {
                    console.warn(`[SECURITY] Token/Database mismatch for student ${decoded.student_id}`);
                    return res.status(401).json({ message: "Session validation failed. Please login again." });
                }

                // Check if user has student, medpub, or treasurer role
                const allowedRoles = ['student', 'medpub', 'treasurer', 'admin'];
                if (!allowedRoles.includes(student.role)) {
                    return res.status(403).json({ 
                        message: "Access denied. Student, medpub, or treasurer role required.",
                        code: 'INSUFFICIENT_ROLE'
                    });
                }

                // Verify session token belongs to this student
                // Compare as strings to handle ObjectId properly
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
                req.isTreasurer = student.role === 'treasurer' || student.role === 'admin';
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
        res.status(200).json({ 
            message: "SSAAM API Health Check",
            status: "operational",
            database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
            timestamp: new Date().toISOString()
        });
    });

    // Debug endpoint to preview students with non-uppercase names (without deleting)
    app.get('/apis/debug/non-uppercase-names', async (req, res) => {
        try {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const allStudents = await StudentModel.find({});
            // Allow A-Z, accented uppercase (Ñ, É, etc.), spaces, hyphens, apostrophes
            const uppercaseRegex = /^[A-ZÑÉÍÓÚÀÈÌÒÙÄËÏÖÜ\s'-]+$/;

            const invalidStudents = allStudents.filter(s => {
                const firstName = s.first_name || '';
                const lastName = s.last_name || '';
                return !uppercaseRegex.test(firstName) || !uppercaseRegex.test(lastName);
            });

            res.json({
                message: "Students with non-uppercase first/last names (preview - not deleted)",
                invalidCount: invalidStudents.length,
                validCount: allStudents.length - invalidStudents.length,
                invalidStudents: invalidStudents.map(s => ({
                    student_id: s.student_id,
                    first_name: s.first_name,
                    last_name: s.last_name,
                    issue: `First: "${s.first_name}" | Last: "${s.last_name}"`
                }))
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Fix endpoint to remove students with non-uppercase first/last names
    app.get('/apis/fix/remove-non-uppercase-names', async (req, res) => {
        try {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const allStudents = await StudentModel.find({});
            // Allow A-Z, accented uppercase (Ñ, É, etc.), spaces, hyphens, apostrophes
            const uppercaseRegex = /^[A-ZÑÉÍÓÚÀÈÌÒÙÄËÏÖÜ\s'-]+$/;

            const invalidStudents = allStudents.filter(s => {
                const firstName = s.first_name || '';
                const lastName = s.last_name || '';
                return !uppercaseRegex.test(firstName) || !uppercaseRegex.test(lastName);
            });

            const idsToDelete = invalidStudents.map(s => s._id);

            const result = await StudentModel.deleteMany({ _id: { $in: idsToDelete } });

            res.json({
                message: "Removed students with non-uppercase names",
                deletedCount: result.deletedCount,
                deletedStudents: invalidStudents.map(s => ({
                    student_id: s.student_id,
                    first_name: s.first_name,
                    last_name: s.last_name
                }))
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Debug/Fix endpoint to remove users with invalid programs (not BSCS, BSIT, BSIS)
    app.get('/apis/fix/remove-invalid-programs', async (req, res) => {
        try {
            // First, find all students with invalid programs
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const invalidStudents = await StudentModel.find({
                program: { $nin: ['BSCS', 'BSIT', 'BSIS'] }
            });

            // Get list of what will be deleted
            const toDelete = invalidStudents.map(s => ({
                student_id: s.student_id,
                name: s.full_name || `${s.first_name} ${s.last_name}`,
                program: s.program
            }));

            // Delete them
            const result = await StudentModel.deleteMany({
                program: { $nin: ['BSCS', 'BSIT', 'BSIS'] }
            });

            res.json({
                message: "Removed students with invalid programs",
                deletedCount: result.deletedCount,
                deletedStudents: toDelete
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Debug endpoint to preview users with invalid programs (without deleting)
    app.get('/apis/debug/invalid-programs', async (req, res) => {
        try {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const invalidStudents = await StudentModel.find({
                program: { $nin: ['BSCS', 'BSIT', 'BSIS'] }
            });

            const validCount = await StudentModel.countDocuments({
                program: { $in: ['BSCS', 'BSIT', 'BSIS'] }
            });

            res.json({
                message: "Students with invalid programs (preview - not deleted)",
                invalidCount: invalidStudents.length,
                validCount: validCount,
                invalidStudents: invalidStudents.map(s => ({
                    student_id: s.student_id,
                    name: s.full_name || `${s.first_name} ${s.last_name}`,
                    program: s.program
                }))
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Fix endpoint to add missing status field to all students
    app.get('/apis/fix/add-status', async (req, res) => {
        try {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            // Find all students without a status field and set it to 'pending'
            const result = await StudentModel.updateMany(
                { status: { $exists: false } },
                { $set: { status: 'pending' } }
            );

            // Also fix any null/undefined status values
            const result2 = await StudentModel.updateMany(
                { status: null },
                { $set: { status: 'pending' } }
            );

            res.json({
                message: "Fix applied: Added status field to students",
                studentsWithMissingStatus: result.modifiedCount,
                studentsWithNullStatus: result2.modifiedCount,
                totalFixed: result.modifiedCount + result2.modifiedCount
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Debug endpoint to test the exact pending query
    app.get('/apis/debug/pending', async (req, res) => {
        try {
            // Test the exact same query as the pending endpoint
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const pendingQuery = await StudentModel.find({ status: 'pending' }).limit(5);
            const pendingCount = await StudentModel.countDocuments({ status: 'pending' });

            // Also get all unique status values in the database
            const allStatuses = await StudentModel.distinct('status');

            // Get a sample of raw documents to see actual field values
            const rawSample = await StudentModel.find({}).limit(3).lean();

            res.json({
                message: "Debug: Testing pending query",
                pendingQueryResult: pendingQuery.length,
                pendingCountResult: pendingCount,
                allUniqueStatuses: allStatuses,
                sampleDocuments: rawSample.map(doc => ({
                    student_id: doc.student_id,
                    status: doc.status,
                    statusType: typeof doc.status,
                    rawStatus: JSON.stringify(doc.status)
                }))
            });
        } catch (err) {
            res.status(500).json({ message: err.message, stack: err.stack });
        }
    });

    // Debug endpoint to view and clear session tokens
    app.get('/apis/debug/session-tokens', auth, async (req, res) => {
        try {
            if (!req.master.isMaster) {
                return res.status(403).json({ message: "Admin access required" });
            }

            const totalTokens = await SessionToken.countDocuments({});
            const activeTokens = await SessionToken.countDocuments({ 
                is_revoked: false, 
                expires_at: { $gt: new Date() } 
            });
            const expiredTokens = await SessionToken.countDocuments({
                $or: [
                    { expires_at: { $lte: new Date() } },
                    { is_revoked: true }
                ]
            });

            const cutoffTime = new Date(Date.now() - SESSION_INACTIVITY_MS);
            const inactiveTokens = await SessionToken.countDocuments({
                $or: [
                    { last_used_at: { $lt: cutoffTime } },
                    { last_used_at: null, created_at: { $lt: cutoffTime } }
                ]
            });

            res.json({
                message: "Session token statistics",
                stats: {
                    total: totalTokens,
                    active: activeTokens,
                    expired_or_revoked: expiredTokens,
                    inactive_12hrs: inactiveTokens
                }
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Debug endpoint to check all students in database regardless of status
    app.get('/apis/debug/students', async (req, res) => {
        try {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const allStudents = await StudentModel.find({});
            const statusCounts = {
                total: allStudents.length,
                approved: allStudents.filter(s => s.status === 'approved').length,
                pending: allStudents.filter(s => s.status === 'pending').length,
                rejected: allStudents.filter(s => s.status === 'rejected').length,
                other: allStudents.filter(s => !['approved', 'pending', 'rejected'].includes(s.status)).length
            };

            res.json({
                message: "Debug: All students in database",
                counts: statusCounts,
                students: allStudents.map(s => ({
                    student_id: s.student_id,
                    name: s.full_name || `${s.first_name} ${s.last_name}`,
                    status: s.status,
                    program: s.program,
                    created_date: s.created_date
                }))
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
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
            res.status(500).json({ message: err.message });
        }
    });

    app.get('/apis/students/stats', studentAuth, async (req, res) => {
        try {
            const stats = {
                BSCS: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, total: 0 },
                BSIS: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, total: 0 },
                BSIT: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, total: 0 }
            };

            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

            const yearLevelMap = {
                '1ST YEAR': '1st Year',
                '1ST': '1st Year',
                '1': '1st Year',
                'FIRST YEAR': '1st Year',
                'FIRST': '1st Year',
                '2ND YEAR': '2nd Year',
                '2ND': '2nd Year',
                '2': '2nd Year',
                'SECOND YEAR': '2nd Year',
                'SECOND': '2nd Year',
                '3RD YEAR': '3rd Year',
                '3RD': '3rd Year',
                '3': '3rd Year',
                'THIRD YEAR': '3rd Year',
                'THIRD': '3rd Year',
                '4TH YEAR': '4th Year',
                '4TH': '4th Year',
                '4': '4th Year',
                'FOURTH YEAR': '4th Year',
                'FOURTH': '4th Year'
            };

            const allStudents = await StudentModel.find({ status: 'approved' });

            let verifiedCount = 0;
            let unverifiedCount = 0;
            let unreadableCount = 0;

            allStudents.forEach(student => {
                const rawProgram = (student.program || '').trim().toUpperCase();
                const rawYearLevel = (student.year_level || '').trim().toUpperCase();

                const program = VALID_PROGRAMS.includes(rawProgram) ? rawProgram : null;
                const yearLevel = yearLevelMap[rawYearLevel] || 
                                (VALID_YEAR_LEVELS.includes(student.year_level) ? student.year_level : null);

                if (program && stats[program] && yearLevel && stats[program][yearLevel] !== undefined) {
                    stats[program][yearLevel]++;
                    stats[program].total++;
                }

                const rfidStatus = student.rfid_status;
                if (rfidStatus === 'verified') {
                    verifiedCount++;
                } else if (rfidStatus === 'Unreadable') {
                    unreadableCount++;
                } else if (rfidStatus === 'unverified' || !rfidStatus || rfidStatus === '' || rfidStatus === null) {
                    unverifiedCount++;
                }
            });

            const pendingCount = await StudentModel.countDocuments({ status: 'pending' });

            res.json({
                stats,
                totalStudents: allStudents.length,
                pendingCount,
                verifiedCount,
                unverifiedCount,
                unreadableCount
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Get all students with full names for custom event selection
    app.get('/apis/students/list/all', adminOrTreasurerAuth, async (req, res) => {
        try {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

            const students = await StudentModel.find({ status: 'approved' })
                .select('student_id first_name middle_name last_name suffix program year_level photo email rfid_status rfid_code')
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
                rfid_code: s.rfid_code || 'N/A'
            }));

            res.json({
                data: formattedStudents,
                total: formattedStudents.length
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Search for student by ID or RFID (POST endpoint for payment verification)
    app.post('/apis/students/search', adminOrTreasurerAuth, async (req, res) => {
        try {
            const { search_query } = req.body;

            if (!search_query || !search_query.trim()) {
                return res.status(400).json({ message: 'Search query is required' });
            }

            const escapedSearch = escapeRegex(search_query.trim());

            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            
            // Search by student_id or rfid_code
            const student = await StudentModel.findOne({
                status: 'approved',
                $or: [
                    { student_id: { $regex: escapedSearch, $options: 'i' } },
                    { rfid_code: { $regex: escapedSearch, $options: 'i' } }
                ]
            }).select('student_id first_name last_name middle_name suffix full_name program year_level email rfid_status');

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
            res.status(500).json({ message: err.message });
        }
    });

    app.get('/apis/students/search', studentMedpubTreasurerAuth, async (req, res) => {
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

            // If user is not a treasurer, restrict to their own student_id
            if (!req.isTreasurer) {
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
                // For treasurers, apply search filter if provided
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

            // Additional security: for non-treasurers, verify all returned results belong to them
            if (!req.isTreasurer) {
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
            res.status(500).json({ message: err.message });
        }
    });

    app.get('/apis/students/pending', studentAuth, async (req, res) => {
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
            res.status(500).json({ message: err.message });
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
                return res.status(400).json({ message: "Program must be one of: BSCS, BSIT, or BSIS" });
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
            const rateLimitCheck = verificationCodeRateLimiter.checkAndRecord(data.email);
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
            verificationCodeRateLimiter.reset(email);

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

    app.put('/apis/students/:student_id/approve', auth, timestampAuth, async (req, res) => {
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

            // Clean up: Remove any old likes from this student_id (in case they were previously deleted and re-registered)
            // This ensures a fresh start for re-accepted users
            const userId = student._id.toString();
            const studentId = student.student_id;
            const NotificationModel = getCollegeModel(Notification, CCS_Notification, COE_Notification, req.college);
            await NotificationModel.updateMany(
                { liked_by: { $in: [userId, studentId] } },
                { $pull: { liked_by: { $in: [userId, studentId] } } }
            );

            if (student.email) {
                try {
                    await sendApprovalEmail(student.email, student.first_name, true);
                } catch (emailErr) {
                    console.error("Failed to send approval email:", emailErr);
                }
            }

            res.json({
                message: "Student approved successfully",
                student
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    app.put('/apis/students/:student_id/reject', auth, timestampAuth, async (req, res) => {
        try {
            const { reason } = req.body;

            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const NotificationSeenModel = getCollegeModel(NotificationSeen, CCS_NotificationSeen, COE_NotificationSeen, req.college);
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
            await NotificationSeenModel.deleteMany({ user_id: student._id });
            await SessionTokenModel.deleteMany({ user_id: student._id });
            await StudentModel.deleteOne({ _id: student._id });

            res.json({
                message: "Student rejected and removed from database",
                removed_student: studentInfo,
                rejection_reason: reason || ''
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    app.put('/apis/students/:student_id/rfid', auth, timestampAuth, async (req, res) => {
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

            res.json({
                message: "RFID code assigned and verified successfully",
                student: updated,
                emailSent
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });



    app.put('/apis/students/:student_id/role', auth, timestampAuth, async (req, res) => {
        try {
            const { role } = req.body;

            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
            }

            const updated = await Student.findOneAndUpdate(
                { student_id: req.params.student_id },
                { role },
                { new: true }
            );

            if (!updated) {
                return res.status(404).json({ message: "Student not found" });
            }

            res.json({
                message: `Role updated to ${role} successfully`,
                student: updated
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
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
            
            const student = await Student.findOneAndUpdate(
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
            res.status(500).json({ message: err.message });
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

    app.put('/apis/students/:student_id', auth, timestampAuth, async (req, res) => {
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
                return res.status(400).json({ message: "Program must be one of: BSCS, BSIT, or BSIS" });
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

            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const updated = await StudentModel.findOneAndUpdate(
                { student_id: req.params.student_id },
                updates,
                { new: true, runValidators: true, validateModifiedOnly: true }
            );

            if (!updated) return res.status(404).json({ message: "Student not found" });

            res.json(updated);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    app.delete('/apis/students/:student_id', auth, async (req, res) => {
        try {
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const NotificationModel = getCollegeModel(Notification, CCS_Notification, COE_Notification, req.college);
            const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);
            
            const deleted = await StudentModel.findOneAndDelete({ student_id: req.params.student_id });

            if (!deleted)
                return res.status(404).json({ message: "Student not found." });

            // Clean up: Remove this user's likes from all notifications
            const userId = deleted._id.toString();
            const studentId = deleted.student_id;
            await NotificationModel.updateMany(
                { liked_by: { $in: [userId, studentId] } },
                { $pull: { liked_by: { $in: [userId, studentId] } } }
            );

            // Also revoke any active session tokens for this user
            await SessionTokenModel.updateMany(
                { user_id: deleted._id },
                { is_revoked: true }
            );

            // Clean up: Remove all contribution records for this student
            await EventContributionModel.deleteMany({ student_id: deleted._id });

            res.json({ message: "Student deleted successfully." });
        } catch (err) {
            res.status(500).json({ message: err.message });
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
                        message: `This student account belongs to the ${otherCollege} college. Please use ${otherCollege === 'CCS' ? 'the CCS' : 'the COE'} login portal.`,
                        belongsToCollege: otherCollege
                    });
                }

                // Not found in either college
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

            if (!passwordValid)
                return res.status(400).json({ message: "Invalid Student ID or Password" });

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
                SSAAM_API_KEY,
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

            res.json({
                message: "Login successful",
                student,
                token,
                requiresPasswordUpdate
            });

        } catch (err) {
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
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
                decoded = jwt.verify(token, SSAAM_API_KEY);
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

            // Find the student (college-aware)
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
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
            res.status(500).json({ message: err.message });
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
                SSAAM_API_KEY,
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
                message: err.message,
                code: 'SERVER_ERROR'
            });
        }
    });

    app.post("/apis/masters/login", async (req, res) => {
        try {
            const { username, password } = req.body;

            const master = await Master.findOne({ username });
            if (!master)
                return res.status(400).json({ message: "Invalid username or password" });

            const valid = await bcrypt.compare(password, master.password);
            if (!valid)
                return res.status(400).json({ message: "Invalid username or password" });

            const token = jwt.sign(
                { id: master._id, username: master.username, isMaster: true, college: master.college || 'CCS' },
                SSAAM_API_KEY,
                { expiresIn: "7d" }
            );

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

            res.json({
                message: "Login successful",
                token,
                master
            });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    app.post('/apis/masters/logout', auth, async (req, res) => {
        try {
            await SessionToken.updateOne(
                { _id: req.sessionToken._id },
                { is_revoked: true }
            );

            res.json({ message: "Logged out successfully" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });







    app.get('/apis/masters', auth, requireMaster, async (req, res) => {
        try {
            const masters = await Master.find();
            res.json(masters);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    app.post('/apis/validate-token', async (req, res) => {
        try {
            const token = extractToken(req);

            if (!token) {
                return res.status(401).json({ valid: false, message: "No token provided" });
            }

            const decoded = jwt.verify(token, SSAAM_API_KEY);

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

    // DEBUG ENDPOINT - temporary for troubleshooting collection mismatch
    // Remove this after confirming college-aware session creation works
    app.post('/debug/auth', async (req, res) => {
        try {
            const token = extractToken(req);
            if (!token) {
                return res.json({ 
                    error: 'no token',
                    college: req.college,
                    headers: {
                        'x-ssaam-college': req.headers['x-ssaam-college'],
                        'authorization': req.headers.authorization ? 'present' : 'missing'
                    }
                });
            }
            
            const decoded = jwt.verify(token, SSAAM_API_KEY);
            const tokenHash = hashToken(token);
            const college = req.college || 'CCS';
            
            // Check which collection the session lookup will query
            const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, college);
            const sessionToken = await SessionTokenModel.findOne({ token_hash: tokenHash });
            
            res.json({ 
                decodedToken: decoded,
                req_college: college,
                will_use_collection: college === 'COE' ? 'coe_sessiontokens' : 'ccs_sessiontokens',
                sessionFound: !!sessionToken,
                sessionToken: sessionToken ? { user_type: sessionToken.user_type, expires_at: sessionToken.expires_at, is_revoked: sessionToken.is_revoked } : null,
                message: `Using ${college} college · Will query ${college === 'COE' ? 'coe_sessiontokens' : 'ccs_sessiontokens'}`
            });
        } catch (err) {
            res.json({ error: err.message, stack: err.stack });
        }
    });

    app.get('/apis/settings', studentAuth, async (req, res) => {
        try {
            const settings = await getSettings(req.college);
            res.json(settings);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    app.put('/apis/settings', auth, async (req, res) => {
        try {
            const { userRegister, userLogin, rfidScanner } = req.body;

            let settings = await Settings.findOne();
            if (!settings) {
                settings = new Settings({
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
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
        }
    });

    // Cleanup Endpoint - Remove duplicate campaigns within payment records
    app.post('/apis/admin/cleanup-duplicate-payments', auth, async (req, res) => {
        try {
            // Only allow primary admin
            if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
                return res.status(403).json({ 
                    message: `Only the primary admin can perform database cleanup`,
                    code: 'NOT_PRIMARY_ADMIN'
                });
            }

            // Check for duplicate campaigns within each student's record
            const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
            const allRecords = await PaymentRecordModel.find({});
            
            let totalDuplicateCampaigns = 0;
            let recordsModified = 0;

            for (const record of allRecords) {
                const groupedByCampaign = {};
                
                // Group campaigns by payment_id
                for (const campaign of record.campaigns) {
                    const paymentId = campaign.payment_id.toString();
                    if (!groupedByCampaign[paymentId]) {
                        groupedByCampaign[paymentId] = [];
                    }
                    groupedByCampaign[paymentId].push(campaign);
                }
                
                // Check for duplicates and clean up
                let hasChanges = false;
                const cleanedCampaigns = [];
                
                for (const paymentId in groupedByCampaign) {
                    const campaigns = groupedByCampaign[paymentId];
                    if (campaigns.length > 1) {
                        totalDuplicateCampaigns += campaigns.length - 1;
                        
                        // Keep the oldest paid record if exists, otherwise oldest record
                        const paidCampaigns = campaigns.filter(c => c.payment_status === 'paid');
                        const campaignToKeep = paidCampaigns.length > 0 
                            ? paidCampaigns[0]
                            : campaigns.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
                        
                        cleanedCampaigns.push(campaignToKeep);
                        hasChanges = true;
                    } else {
                        cleanedCampaigns.push(campaigns[0]);
                    }
                }
                
                if (hasChanges) {
                    record.campaigns = cleanedCampaigns;
                    record.total_campaigns = cleanedCampaigns.length;
                    record.campaigns_paid = cleanedCampaigns.filter(c => c.payment_status === 'paid').length;
                    record.total_amount_paid = cleanedCampaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
                    record.last_payment_at = cleanedCampaigns
                        .filter(c => c.paid_at)
                        .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
                    record.updated_at = new Date();
                    
                    await record.save();
                    recordsModified++;
                }
            }

            res.json({
                message: "Duplicate payment campaigns cleaned up successfully",
                totalRecords: allRecords.length,
                duplicatesFound: totalDuplicateCampaigns,
                recordsModified: recordsModified,
                details: `Removed ${totalDuplicateCampaigns} duplicate campaign(s) from ${recordsModified} student record(s). Smart logic prioritized keeping paid campaigns.`
            });

        } catch (err) {
            console.error('Duplicate cleanup error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Cleanup Endpoint - Remove rfid_verified_by field from all users
    app.post('/apis/admin/cleanup-rfid-verified-by', auth, async (req, res) => {
        try {
            // Only allow primary admin
            if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
                return res.status(403).json({ 
                    message: `Only the primary admin can perform database cleanup`,
                    code: 'NOT_PRIMARY_ADMIN'
                });
            }

            // Remove rfid_verified_by field from all student records
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const result = await StudentModel.updateMany(
                { rfid_verified_by: { $exists: true } },
                { $unset: { rfid_verified_by: "" } }
            );

            res.json({
                message: "rfid_verified_by field removed successfully",
                modifiedCount: result.modifiedCount || 0,
                removedField: 'rfid_verified_by',
                details: `${result.modifiedCount || 0} student records updated and cleaned up`
            });

        } catch (err) {
            console.error('RFID verified_by cleanup error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // DEBUG Endpoint - Add program and year_level to payment records
    app.post('/apis/debug/enrich-payment-records', auth, async (req, res) => {
        try {
            // Only allow admin
            if (req.master.role !== 'admin' && req.master.username !== PRIMARY_ADMIN_USERNAME) {
                return res.status(403).json({ 
                    message: 'Only admin users can use this debug endpoint',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            const { paymentId } = req.body;
            
            if (!paymentId) {
                return res.status(400).json({ message: 'paymentId is required in request body' });
            }

            // Find the payment
            const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
            const payment = await PaymentModel.findById(paymentId);
            if (!payment) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            // Get all payment records
            const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);
            const paymentRecords = await PaymentRecordModel.find({});
            let updatedCount = 0;
            const enrichmentLog = [];
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

            for (const record of paymentRecords) {
                // Find the campaign for this payment
                const campaign = record.campaigns.find(c => c.payment_id.toString() === paymentId);
                if (!campaign) {
                    continue;
                }

                // Find the student to get program and year_level
                const student = await StudentModel.findOne({ student_id: record.student_id });
                
                if (student) {
                    const oldProgram = campaign.program;
                    const oldYearLevel = campaign.year_level;
                    
                    // Update campaign with student's program and year_level
                    campaign.program = student.program || 'N/A';
                    campaign.year_level = student.year_level || 'N/A';
                    
                    await record.save();
                    updatedCount++;
                    
                    enrichmentLog.push({
                        student_id: record.student_id,
                        student_name: record.student_name,
                        program: campaign.program,
                        year_level: campaign.year_level,
                        status: 'updated'
                    });
                } else {
                    enrichmentLog.push({
                        student_id: record.student_id,
                        student_name: record.student_name,
                        status: 'student_not_found'
                    });
                }
            }

            res.json({
                success: true,
                message: `Enriched ${updatedCount} payment records with program and year_level data`,
                paymentId,
                updatedCount,
                enrichmentLog: enrichmentLog.slice(0, 10) // Return first 10 for brevity
            });

        } catch (err) {
            console.error('Error enriching payment records:', err);
            res.status(500).json({ message: err.message });
        }
    });

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
                    await destClient.close().catch(() => {});
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

    // ==================== PAYMENT RECORD CONSOLIDATION ====================

    // Consolidate old payment records into new format (one record per student with campaigns array)
    app.post('/apis/admin/consolidate-payments', auth, async (req, res) => {
        try {
            // Only allow primary admin
            if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
                return res.status(403).json({ 
                    message: `Only the primary admin can consolidate payment records`,
                    code: 'NOT_PRIMARY_ADMIN'
                });
            }

            const startTime = Date.now();
            const ts = Date.now();

            const colleges = ['CCS', 'COE'];
            let totalOldRecords = 0;
            let totalInserted = 0;
            let totalSkipped = 0;

            for (const college of colleges) {
                const prefix = getPrefix(college);
                const backupCollName = `${prefix}paymentrecords_backup_${ts}`;
                const currentCollName = `${prefix}paymentrecords`;

                // Backup current documents into a backup collection
                try {
                    const currentCollection = mongoose.connection.collection(currentCollName);
                    const docs = await currentCollection.find({}).toArray();
                    if (docs && docs.length > 0) {
                        await mongoose.connection.db.collection(backupCollName).insertMany(docs);
                        console.log(`Created backup ${backupCollName} with ${docs.length} documents`);
                    }
                } catch (e) {
                    console.log(`Backup for ${currentCollName} skipped or failed:`, e?.message || e);
                }

                // Use college-specific PaymentRecord model
                const PRModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, college);
                const oldRecords = await PRModel.find({});
                totalOldRecords += oldRecords.length;

                if (oldRecords.length === 0) continue;

                // Group records by student_id
                const groupedByStudent = {};
                let skippedInvalidRecords = 0;

                for (const record of oldRecords) {
                    const sid = record.student_id;
                    if (!record.payment_id) {
                        skippedInvalidRecords++;
                        continue;
                    }
                    if (!groupedByStudent[sid]) {
                        groupedByStudent[sid] = {
                            student_id: record.student_id,
                            student_id_number: record.student_id_number,
                            student_name: record.student_name,
                            program: record.program,
                            year_level: record.year_level,
                            campaigns: []
                        };
                    }
                    groupedByStudent[sid].campaigns.push({
                        payment_id: record.payment_id,
                        payment_status: record.payment_status || 'pending',
                        amount_paid: record.amount_paid || 0,
                        paid_at: record.paid_at || null,
                        paid_by_treasurer: record.paid_by_treasurer || null,
                        notes: record.notes || '',
                        payment_method: record.payment_method || null,
                        created_at: record.created_at || new Date(),
                        updated_at: record.updated_at || new Date()
                    });
                }

                // Calculate summary fields
                for (const studentId in groupedByStudent) {
                    const record = groupedByStudent[studentId];
                    record.total_campaigns = record.campaigns.length;
                    record.campaigns_paid = record.campaigns.filter(c => c.payment_status === 'paid').length;
                    record.total_amount_paid = record.campaigns.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
                    record.last_payment_at = record.campaigns
                        .filter(c => c.paid_at)
                        .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0]?.paid_at || null;
                    record.created_at = new Date();
                    record.updated_at = new Date();
                }

                // Delete old records and insert consolidated ones
                await PRModel.deleteMany({});
                const consolidatedRecords = Object.values(groupedByStudent);
                const inserted = await PRModel.insertMany(consolidatedRecords);

                totalInserted += inserted.length;
                totalSkipped += skippedInvalidRecords;
            }

            const duration = Date.now() - startTime;

            res.json({
                message: "Payment records consolidated successfully (per-college)",
                totalOldRecords,
                totalInserted,
                totalSkipped,
                processingTime: `${duration}ms`,
                success: true
            });

        } catch (err) {
            console.error('Payment consolidation error:', err);
            res.status(500).json({ message: err.message });
        }
    });

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
            const hashedPassword = await bcrypt.hash(new_password, 12);
            await Student.updateOne(
                { student_id },
                { custom_password: hashedPassword }
            );

            res.json({ message: "Password reset successful! You can now login with your new password." });

        } catch (err) {
            console.error("Password reset complete error:", err);
            res.status(500).json({ message: "Password reset failed. Please try again." });
        }
    });

    // ==================== IMAGE UPLOAD ENDPOINT ====================

    // Upload image to ImgBB (separate endpoint for frontend upload)
    // Uses canPostNotification middleware for consistent authentication
    app.post('/apis/upload-image', canPostNotification, async (req, res) => {
        try {
            const { image } = req.body;

            if (!image) {
                return res.status(400).json({ message: "Image data is required" });
            }

            const imageUrl = await uploadToImgBB(image);

            res.json({ 
                success: true, 
                url: imageUrl 
            });

        } catch (err) {
            console.error("Image upload error:", err);
            res.status(500).json({ message: err.message || "Failed to upload image" });
        }
    });

    // ==================== NOTIFICATIONS ENDPOINTS ====================

    // Get all notifications (requires authentication - student or admin token)
    app.get('/apis/notifications', studentAuth, async (req, res) => {
        try {
            const NotificationModel = getCollegeModel(Notification, CCS_Notification, COE_Notification, req.college);
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);

            const notifications = await NotificationModel.find()
                .select('title message priority image_url posted_by posted_by_id posted_by_name liked_by was_edited created_at updated_at')
                .sort({ created_at: -1 })
                .limit(50)
                .lean();

            const medpubPosterIds = notifications
                .filter(n => n.posted_by === 'medpub' && n.posted_by_id)
                .map(n => n.posted_by_id);

            let posterPhotos = {};
            if (medpubPosterIds.length > 0) {
                const posters = await StudentModel.find({ _id: { $in: medpubPosterIds } })
                    .select('_id photo')
                    .lean();
                posterPhotos = posters.reduce((acc, p) => {
                    acc[p._id.toString()] = p.photo || null;
                    return acc;
                }, {});
            }

            const cleanNotifications = notifications.map(notif => ({
                _id: notif._id,
                title: notif.title,
                message: notif.message,
                priority: notif.priority || 'normal',
                image_url: notif.image_url || null,
                posted_by: notif.posted_by,
                posted_by_name: notif.posted_by_name,
                posted_by_id: notif.posted_by_id,
                poster_photo: notif.posted_by === 'medpub' && notif.posted_by_id 
                    ? posterPhotos[notif.posted_by_id.toString()] || null 
                    : null,
                liked_by: notif.liked_by || [],
                was_edited: notif.was_edited || false,
                created_at: notif.created_at,
                updated_at: notif.updated_at
            }));

            res.json({ data: cleanNotifications });
        } catch (err) {
            console.error("Fetch notifications error:", err);
            res.status(500).json({ message: err.message });
        }
    });

    // Middleware to check if user can post notifications (admin or medpub)
    async function canPostNotification(req, res, next) {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        try {
            const decoded = jwt.verify(token, SSAAM_API_KEY);

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
                req.poster = {
                    id: decoded.id,
                    name: decoded.username,
                    type: 'admin'
                };
                return next();
            }

            if (decoded.student_id) {
                const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
                const student = await StudentModel.findOne({ student_id: decoded.student_id });
                if (!student) {
                    await SessionToken.updateOne({ _id: sessionToken._id }, { is_revoked: true });
                    return res.status(403).json({ 
                        message: "Student account not found. Please login again.",
                        code: 'STUDENT_NOT_FOUND'
                    });
                }

                if (student.role !== 'medpub') {
                    await SessionToken.updateOne({ _id: sessionToken._id }, { is_revoked: true });
                    return res.status(403).json({ 
                        message: "Your MedPub access has been revoked. Please login again.",
                        code: 'MEDPUB_ACCESS_REVOKED'
                    });
                }

                req.poster = {
                    id: decoded.id,
                    studentId: student._id,
                    name: student.first_name + ' ' + student.last_name,
                    type: 'medpub'
                };
                return next();
            }

            return res.status(403).json({ message: "Only admins and MedPub users can post notifications" });

        } catch (err) {
            return res.status(401).json({ message: "Invalid token." });
        }
    }

    // Helper function to upload image to ImgBB
    async function uploadToImgBB(base64Image) {
        // Get API keys from environment variable (comma-separated)
        const apiKeysStr = process.env.IMGBB_API_KEYS || '';
        const apiKeys = apiKeysStr.split(',').map(k => k.trim()).filter(k => k);

        if (apiKeys.length === 0) {
            throw new Error('ImgBB API keys not configured');
        }

        // Use random API key for load distribution
        const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

        // Remove data URL prefix if present
        const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('image', imageData);

        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to upload image');
        }

        return result.data.url;
    }

    // Create notification (admin or medpub only)
    app.post('/apis/notifications', canPostNotification, async (req, res) => {
        try {
            const { title, message, priority, image, image_url } = req.body;

            if (!title || !message) {
                return res.status(400).json({ message: "Title and message are required" });
            }

            if (title.length > 200) {
                return res.status(400).json({ message: "Title must be 200 characters or less" });
            }

            if (message.length > 2000) {
                return res.status(400).json({ message: "Message must be 2000 characters or less" });
            }

            // MedPub rate limiting: 1 post per day
            const NotificationModel = getCollegeModel(Notification, CCS_Notification, COE_Notification, req.college);
            if (req.poster.type === 'medpub') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Convert poster id to ObjectId for proper comparison
                let posterId;
                try {
                    posterId = new mongoose.Types.ObjectId(req.poster.id);
                } catch (e) {
                    posterId = req.poster.id;
                }

                const todayPostCount = await NotificationModel.countDocuments({
                    posted_by_id: posterId,
                    posted_by: 'medpub',
                    created_at: { $gte: today, $lt: tomorrow }
                });

                if (todayPostCount >= 1) {
                    return res.status(429).json({ 
                        message: "MedPub users can only post once per day. Please try again tomorrow.",
                        limit_type: "post",
                        remaining: 0
                    });
                }
            }

            // Only admin can set urgent priority
            let finalPriority = priority || 'normal';
            if (finalPriority === 'urgent' && req.poster.type !== 'admin') {
                finalPriority = 'important'; // Downgrade to important for non-admin
            }

            // Use provided image_url or upload base64 image to ImgBB
            let imageUrl = image_url || null;
            if (!imageUrl && image) {
                try {
                    imageUrl = await uploadToImgBB(image);
                } catch (imgErr) {
                    console.error('Image upload failed:', imgErr);
                    // Continue without image if upload fails
                }
            }

            // Derive all poster info from authenticated session (not from request body)
            // Sanitize title and message to prevent XSS
            const notification = await NotificationModel.create({
                title: sanitizeHtml(title.trim()),
                message: sanitizeHtml(message.trim()),
                image_url: imageUrl,
                posted_by: req.poster.type, // From JWT/session
                posted_by_name: req.poster.name, // From JWT/session
                posted_by_id: req.poster.id, // From JWT/session
                priority: finalPriority
            });

            res.status(201).json({
                message: "Notification posted successfully",
                notification
            });

        } catch (err) {
            console.error("Create notification error:", err);
            res.status(500).json({ message: err.message });
        }
    });

    // Update notification (only the poster or admin can update)
    app.put('/apis/notifications/:id', canPostNotification, async (req, res) => {
        try {
            const { title, message, priority } = req.body;

            const NotificationModel = getCollegeModel(Notification, CCS_Notification, COE_Notification, req.college);
            const notification = await NotificationModel.findById(req.params.id);

            if (!notification) {
                return res.status(404).json({ message: "Notification not found" });
            }

            // Only allow admin or the original poster to update
            const isAdmin = req.poster.type === 'admin';
            const isOwner = notification.posted_by_id.toString() === req.poster.id;

            if (!isAdmin && !isOwner) {
                return res.status(403).json({ message: "You can only edit your own notifications" });
            }

            // MedPub rate limiting: 3 edits per day per post
            if (req.poster.type === 'medpub' && isOwner) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Check if the last edit was today (within today's date range)
                const lastEditDate = notification.last_edit_date ? new Date(notification.last_edit_date) : null;
                const lastEditWasToday = lastEditDate && lastEditDate >= today && lastEditDate < tomorrow;

                // If last edit was not today, reset the counter
                if (!lastEditWasToday) {
                    notification.edit_count = 0;
                }

                // Check if we've reached the limit
                if (notification.edit_count >= 3) {
                    return res.status(429).json({ 
                        message: "MedPub users can only edit each post 3 times per day. Please try again tomorrow.",
                        limit_type: "edit",
                        remaining: 0
                    });
                }

                // Increment edit count and update last edit date
                notification.edit_count = (notification.edit_count || 0) + 1;
                notification.last_edit_date = new Date();
            }

            if (title) {
                if (title.length > 200) {
                    return res.status(400).json({ message: "Title must be 200 characters or less" });
                }
                notification.title = sanitizeHtml(title.trim());
            }

            if (message) {
                if (message.length > 2000) {
                    return res.status(400).json({ message: "Message must be 2000 characters or less" });
                }
                notification.message = sanitizeHtml(message.trim());
            }

            if (priority) {
                // Only admin can set urgent priority
                if (priority === 'urgent' && !isAdmin) {
                    notification.priority = 'important'; // Downgrade
                } else {
                    notification.priority = priority;
                }
            }

            notification.updated_at = new Date();
            notification.was_edited = true;
            await notification.save();

            const remainingEdits = req.poster.type === 'medpub' ? Math.max(0, 3 - notification.edit_count) : null;

            res.json({
                message: "Notification updated successfully",
                notification,
                remaining_edits: remainingEdits
            });

        } catch (err) {
            console.error("Update notification error:", err);
            res.status(500).json({ message: err.message });
        }
    });

    // Delete notification (only the poster or admin can delete)
    app.delete('/apis/notifications/:id', canPostNotification, async (req, res) => {
        try {
            const NotificationModel = getCollegeModel(Notification, CCS_Notification, COE_Notification, req.college);
            const notification = await NotificationModel.findById(req.params.id);

            if (!notification) {
                return res.status(404).json({ message: "Notification not found" });
            }

            // Only allow admin or the original poster to delete
            const isAdmin = req.poster.type === 'admin';
            const isOwner = notification.posted_by_id.toString() === req.poster.id;

            if (!isAdmin && !isOwner) {
                return res.status(403).json({ message: "You can only delete your own notifications" });
            }

            // MedPub cannot delete admin notifications
            if (!isAdmin && notification.posted_by === 'admin') {
                return res.status(403).json({ message: "Only admins can delete admin notifications" });
            }

            await Notification.deleteOne({ _id: req.params.id });

            res.json({ message: "Notification deleted successfully" });

        } catch (err) {
            console.error("Delete notification error:", err);
            res.status(500).json({ message: err.message });
        }
    });

    // Mark notifications as seen (stores in database, not localStorage)
    app.post('/apis/notifications/mark-seen', async (req, res) => {
        try {
            const token = extractToken(req);
            if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

            let userId;
            try {
                const decoded = jwt.verify(token, SSAAM_API_KEY);
                const tokenHash = hashToken(token);
                const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
                const sessionToken = await SessionTokenModel.findOne({ 
                    token_hash: tokenHash,
                    is_revoked: false,
                    expires_at: { $gt: new Date() }
                });

                if (!sessionToken) return res.status(401).json({ message: "Session expired or invalid. Please login again." });

                userId = decoded.id || decoded._id || decoded.student_id;
            } catch (jwtError) {
                return res.status(401).json({ message: "Invalid or expired token" });
            }

            const { notification_ids } = req.body;
            if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
                return res.status(400).json({ message: "notification_ids array is required" });
            }

            const seenRecords = notification_ids.map(notifId => ({
                user_id: userId,
                notification_id: notifId,
                seen_at: new Date()
            }));

            const NotificationSeenModel = getCollegeModel(NotificationSeen, CCS_NotificationSeen, COE_NotificationSeen, req.college);

            await NotificationSeenModel.bulkWrite(
                seenRecords.map(record => ({
                    updateOne: {
                        filter: { user_id: record.user_id, notification_id: record.notification_id },
                        update: { $setOnInsert: record },
                        upsert: true
                    }
                }))
            );

            res.json({ 
                message: "Notifications marked as seen",
                marked_count: notification_ids.length
            });
        } catch (err) {
            console.error("Mark notifications seen error:", err);
            res.status(500).json({ message: err.message });
        }
    });

    // Get seen notification IDs for current user
    app.get('/apis/notifications/seen', async (req, res) => {
        try {
            const token = extractToken(req);
            if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

            let userId;
            try {
                const decoded = jwt.verify(token, SSAAM_API_KEY);
                const tokenHash = hashToken(token);
                const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
                const sessionToken = await SessionTokenModel.findOne({ 
                    token_hash: tokenHash,
                    is_revoked: false,
                    expires_at: { $gt: new Date() }
                });

                if (!sessionToken) return res.status(401).json({ message: "Session expired or invalid. Please login again." });

                userId = decoded.id || decoded._id || decoded.student_id;
            } catch (jwtError) {
                return res.status(401).json({ message: "Invalid or expired token" });
            }

            const NotificationSeenModel = getCollegeModel(NotificationSeen, CCS_NotificationSeen, COE_NotificationSeen, req.college);

            const seenRecords = await NotificationSeenModel.find({ user_id: userId })
                .select('notification_id seen_at')
                .lean();

            res.json({
                seen_notification_ids: seenRecords.map(r => r.notification_id.toString()),
                seen_records: seenRecords
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Toggle like on notification (requires valid JWT authentication with session validation)
    app.post('/apis/notifications/:id/like', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ message: "No token provided" });
            }

            // Verify JWT token and extract user identity - NO fallback to request body
            let userId;
            try {
                const decoded = jwt.verify(token, SSAAM_API_KEY);

                // Validate session token in database (college-aware)
                const tokenHash = hashToken(token);
                const SessionTokenModel = getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, req.college);
                const sessionToken = await SessionTokenModel.findOne({ 
                    token_hash: tokenHash,
                    is_revoked: false,
                    expires_at: { $gt: new Date() }
                });

                if (!sessionToken) {
                    return res.status(401).json({ message: "Session expired or invalid. Please login again." });
                }

                // Get user ID from decoded token - support both student and admin/master tokens
                userId = decoded.student_id || decoded.id || decoded.username;
                if (!userId) {
                    return res.status(401).json({ message: "Invalid token: no user identifier found" });
                }
            } catch (jwtError) {
                return res.status(401).json({ message: "Invalid or expired token" });
            }

            // Check rate limit before processing (also records the attempt)
            const rateLimitResult = likeRateLimiter.checkAndRecordAttempt(userId, req.params.id);
            if (!rateLimitResult.allowed) {
                res.set('Retry-After', rateLimitResult.retryAfter.toString());
                return res.status(429).json({ 
                    message: "Too many requests. Please wait before trying again.",
                    retryAfter: rateLimitResult.retryAfter
                });
            }

            const NotificationModel = getCollegeModel(Notification, CCS_Notification, COE_Notification, req.college);
            const notification = await NotificationModel.findById(req.params.id);
            if (!notification) {
                return res.status(404).json({ message: "Notification not found" });
            }

            // Initialize liked_by if it doesn't exist
            if (!notification.liked_by) {
                notification.liked_by = [];
            }

            // Toggle like using the verified user ID from token
            const userIndex = notification.liked_by.indexOf(userId);
            let liked = false;

            if (userIndex > -1) {
                // User already liked, remove like
                notification.liked_by.splice(userIndex, 1);
                liked = false;
            } else {
                // Add like
                notification.liked_by.push(userId);
                liked = true;
            }

            await notification.save();

            res.json({
                message: liked ? "Liked successfully" : "Unliked successfully",
                liked,
                like_count: notification.liked_by.length,
                liked_by: notification.liked_by,
                user_id: userId
            });

        } catch (err) {
            console.error("Toggle like error:", err);
            res.status(500).json({ message: err.message });
        }
    });

    // ==================== APPLICATIONS API ENDPOINTS ====================

    // Admin: Create new application form
    app.post('/apis/admin/applications', adminOrTreasurerAuth, async (req, res) => {
        try {
            const { title, description, eligible_programs, eligible_year_levels, max_applicants, allow_one_per_student } = req.body;

            if (!title || title.trim() === '') {
                return res.status(400).json({ message: 'Application title is required' });
            }

            // Get creator info
            const creatorName = req.master ? req.master.username : req.student.first_name + ' ' + req.student.last_name;

            const ApplicationFormModel = getCollegeModel(ApplicationForm, CCS_ApplicationForm, COE_ApplicationForm, req.college);
            const StudentApplicationModel = getCollegeModel(StudentApplication, CCS_StudentApplication, COE_StudentApplication, req.college);

            const form = new ApplicationFormModel({
                title: title.trim(),
                description: description || '',
                eligible_programs: Array.isArray(eligible_programs) ? eligible_programs : [],
                eligible_year_levels: Array.isArray(eligible_year_levels) ? eligible_year_levels : [],
                max_applicants: max_applicants || null,
                allow_one_per_student: allow_one_per_student !== false, // default true
                created_by: req.master ? req.master.id : req.student._id,
                created_by_name: creatorName,
                status: 'active'
            });

            await form.save();

            res.status(201).json({
                success: true,
                message: 'Application form created successfully',
                data: form
            });
        } catch (err) {
            console.error('Create application error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Admin: Get all application forms
    app.get('/apis/admin/applications', adminOrTreasurerAuth, async (req, res) => {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            let filter = {};
            if (status) {
                filter.status = status;
            }

            const ApplicationFormModel = getCollegeModel(ApplicationForm, CCS_ApplicationForm, COE_ApplicationForm, req.college);
            const StudentApplicationModel = getCollegeModel(StudentApplication, CCS_StudentApplication, COE_StudentApplication, req.college);

            const forms = await ApplicationFormModel.find(filter)
                .populate('created_by', 'username email')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit);

            // Get stats for each form
            const formsWithStats = await Promise.all(forms.map(async (form) => {
                const applications = await StudentApplicationModel.find({ form_id: form._id });
                const stats = {
                    total: applications.length,
                    pending: applications.filter(a => a.status === 'pending').length,
                    approved: applications.filter(a => a.status === 'approved').length,
                    rejected: applications.filter(a => a.status === 'rejected').length
                };

                return {
                    ...form.toObject(),
                    stats
                };
            }));

            const total = await ApplicationFormModel.countDocuments(filter);
            const totalPages = Math.ceil(total / limit);

            res.json({
                success: true,
                data: formsWithStats,
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
            console.error('Get applications error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Admin: Get single application form with all student applications
    app.get('/apis/admin/applications/:id', adminOrTreasurerAuth, async (req, res) => {
        try {
            const ApplicationFormModel = getCollegeModel(ApplicationForm, CCS_ApplicationForm, COE_ApplicationForm, req.college);
            const StudentApplicationModel = getCollegeModel(StudentApplication, CCS_StudentApplication, COE_StudentApplication, req.college);

            const form = await ApplicationFormModel.findById(req.params.id)
                .populate('created_by', 'username email');

            if (!form) {
                return res.status(404).json({ message: 'Application form not found' });
            }

            const applications = await StudentApplicationModel.find({ form_id: req.params.id })
                .sort({ applied_at: -1 });

            res.json({
                success: true,
                data: {
                    form,
                    applications,
                    stats: {
                        total: applications.length,
                        pending: applications.filter(a => a.status === 'pending').length,
                        approved: applications.filter(a => a.status === 'approved').length,
                        rejected: applications.filter(a => a.status === 'rejected').length
                    }
                }
            });
        } catch (err) {
            console.error('Get application detail error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Admin: Update application form (eligibility, title, description)
    app.put('/apis/admin/applications/:id', adminOrTreasurerAuth, async (req, res) => {
        try {
            const { title, description, status, eligible_programs, eligible_year_levels, max_applicants, allow_one_per_student } = req.body;

            const update = {};
            
            if (title !== undefined) update.title = title;
            if (description !== undefined) update.description = description;
            if (status !== undefined) {
                if (!['active', 'closed'].includes(status)) {
                    return res.status(400).json({ message: 'Status must be "active" or "closed"' });
                }
                update.status = status;
            }
            if (eligible_programs !== undefined) update.eligible_programs = Array.isArray(eligible_programs) ? eligible_programs : [];
            if (eligible_year_levels !== undefined) update.eligible_year_levels = Array.isArray(eligible_year_levels) ? eligible_year_levels : [];
            if (max_applicants !== undefined) update.max_applicants = max_applicants;
            if (allow_one_per_student !== undefined) update.allow_one_per_student = allow_one_per_student;

            update.updated_at = new Date();

            const ApplicationFormModel = getCollegeModel(ApplicationForm, CCS_ApplicationForm, COE_ApplicationForm, req.college);

            const form = await ApplicationFormModel.findByIdAndUpdate(
                req.params.id,
                update,
                { new: true }
            );

            if (!form) {
                return res.status(404).json({ message: 'Application form not found' });
            }

            res.json({
                success: true,
                message: 'Application form updated successfully',
                data: form
            });
        } catch (err) {
            console.error('Update application error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Admin: Delete application form and all associated applications
    app.delete('/apis/admin/applications/:id', adminOrTreasurerAuth, async (req, res) => {
        try {
            const ApplicationFormModel = getCollegeModel(ApplicationForm, CCS_ApplicationForm, COE_ApplicationForm, req.college);
            const StudentApplicationModel = getCollegeModel(StudentApplication, CCS_StudentApplication, COE_StudentApplication, req.college);

            const form = await ApplicationFormModel.findById(req.params.id);
            if (!form) {
                return res.status(404).json({ message: 'Application form not found' });
            }

            const formTitle = form.title;

            // Delete all student applications for this form
            const deleteResult = await StudentApplicationModel.deleteMany({ form_id: req.params.id });

            // Delete the form itself
            await ApplicationFormModel.deleteOne({ _id: req.params.id });

            res.json({
                success: true,
                message: `Application form "${formTitle}" deleted successfully`,
                data: {
                    deleted_form: form.title,
                    deleted_applications: deleteResult.deletedCount
                }
            });
        } catch (err) {
            console.error('Delete application error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Admin: Review and approve/reject student application
    app.put('/apis/admin/applications/:formId/review/:applicationId', adminOrTreasurerAuth, async (req, res) => {
        try {
            const { status, notes } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
            }

            const StudentApplicationModel = getCollegeModel(StudentApplication, CCS_StudentApplication, COE_StudentApplication, req.college);

            const application = await StudentApplicationModel.findById(req.body.applicationId || req.params.applicationId);
            if (!application) {
                return res.status(404).json({ message: 'Application not found' });
            }

            const reviewerName = req.master ? req.master.username : req.student.first_name + ' ' + req.student.last_name;

            application.status = status;
            application.notes = notes || '';
            application.reviewed_by = req.master ? req.master.id : req.student._id;
            application.reviewed_by_name = reviewerName;
            application.reviewed_at = new Date();

            await application.save();

            res.json({
                success: true,
                message: `Application ${status} successfully`,
                data: application
            });
        } catch (err) {
            console.error('Review application error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Student: Get list of available applications to apply for
    app.get('/apis/applications/available', studentAuthWithToken, async (req, res) => {
        try {
            const student = req.student;
            const ApplicationFormModel = getCollegeModel(ApplicationForm, CCS_ApplicationForm, COE_ApplicationForm, req.college);
            const StudentApplicationModel = getCollegeModel(StudentApplication, CCS_StudentApplication, COE_StudentApplication, req.college);

            // Find active applications where student is eligible
            const applications = await ApplicationFormModel.find({
                status: 'active',
                $or: [
                    // Empty arrays mean "all students can apply"
                    { eligible_programs: { $size: 0 }, eligible_year_levels: { $size: 0 } },
                    // Student program is in eligible list AND student year is in eligible list
                    { 
                        $and: [
                            { $or: [
                                { eligible_programs: { $size: 0 } },
                                { eligible_programs: student.program }
                            ]},
                            { $or: [
                                { eligible_year_levels: { $size: 0 } },
                                { eligible_year_levels: student.year_level }
                            ]}
                        ]
                    }
                ]
            }).sort({ created_at: -1 });

            // For each application, check if student already applied
            const applicationsWithStatus = await Promise.all(applications.map(async (app) => {
                const existing = await StudentApplicationModel.findOne({
                    form_id: app._id,
                    student_id: student._id
                });

                return {
                    ...app.toObject(),
                    alreadyApplied: !!existing,
                    applicationStatus: existing ? existing.status : null
                };
            }));

            res.json({
                success: true,
                data: applicationsWithStatus
            });
        } catch (err) {
            console.error('Get available applications error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Student: Submit application for a form
    app.post('/apis/applications/:formId/apply', studentAuthWithToken, async (req, res) => {
        try {
            const { formId } = req.params;
            const { applicationData } = req.body;
            const student = req.student;

            const ApplicationFormModel = getCollegeModel(ApplicationForm, CCS_ApplicationForm, COE_ApplicationForm, req.college);
            const StudentApplicationModel = getCollegeModel(StudentApplication, CCS_StudentApplication, COE_StudentApplication, req.college);

            // Verify form exists and is active
            const form = await ApplicationFormModel.findById(formId);
            if (!form) {
                return res.status(404).json({ message: 'Application form not found' });
            }

            if (form.status !== 'active') {
                return res.status(400).json({ message: 'This application is no longer accepting submissions' });
            }

            // Check eligibility
            const isEligible = this.checkApplicationEligibility(student, form);
            if (!isEligible) {
                return res.status(403).json({ 
                    message: 'You do not meet the eligibility requirements for this application',
                    required: {
                        programs: form.eligible_programs.length > 0 ? form.eligible_programs : 'All programs',
                        year_levels: form.eligible_year_levels.length > 0 ? form.eligible_year_levels : 'All year levels'
                    }
                });
            }

            // Check if student already applied (if allow_one_per_student is true)
            if (form.allow_one_per_student) {
                const existing = await StudentApplicationModel.findOne({
                    form_id: formId,
                    student_id: student._id
                });

                if (existing) {
                    return res.status(400).json({ 
                        message: 'You have already applied for this application',
                        existingApplication: existing
                    });
                }
            }

            // Check max applicants limit
            if (form.max_applicants) {
                const currentCount = await StudentApplicationModel.countDocuments({ form_id: formId });
                if (currentCount >= form.max_applicants) {
                    return res.status(400).json({ message: 'Maximum number of applicants reached for this application' });
                }
            }

            // Create application record
            const newApplication = new StudentApplicationModel({
                form_id: formId,
                student_id: student._id,
                student_id_number: student.student_id,
                student_name: student.full_name || `${student.first_name} ${student.last_name}`,
                program: student.program,
                year_level: student.year_level,
                email: student.email,
                status: 'pending',
                application_data: applicationData || {},
                applied_at: new Date()
            });

            await newApplication.save();

            res.status(201).json({
                success: true,
                message: 'Application submitted successfully. Please wait for review.',
                data: newApplication
            });
        } catch (err) {
            console.error('Submit application error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Student: Get their own applications
    app.get('/apis/applications/user/my', studentAuthWithToken, async (req, res) => {
        try {
            const student = req.student;

            const StudentApplicationModel = getCollegeModel(StudentApplication, CCS_StudentApplication, COE_StudentApplication, req.college);
            const applications = await StudentApplicationModel.find({ student_id: student._id })
                .populate('form_id', 'title description status eligible_programs eligible_year_levels')
                .sort({ applied_at: -1 });

            const formattedApplications = applications.map(app => ({
                _id: app._id,
                form: {
                    _id: app.form_id._id,
                    title: app.form_id.title,
                    description: app.form_id.description,
                    status: app.form_id.status
                },
                status: app.status,
                appliedAt: app.applied_at,
                reviewedAt: app.reviewed_at,
                notes: app.notes,
                reviewedByName: app.reviewed_by_name
            }));

            res.json({
                success: true,
                data: formattedApplications,
                message: formattedApplications.length === 0 ? 'You have not applied for any applications yet' : undefined
            });
        } catch (err) {
            console.error('Get user applications error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Student: Get single application details
    app.get('/apis/applications/:applicationId', studentAuthWithToken, async (req, res) => {
        try {
            const student = req.student;

            const application = await StudentApplication.findById(req.params.applicationId)
                .populate('form_id');

            if (!application) {
                return res.status(404).json({ message: 'Application not found' });
            }

            // Verify student owns this application
            if (application.student_id.toString() !== student._id.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }

            res.json({
                success: true,
                data: application
            });
        } catch (err) {
            console.error('Get application detail error:', err);
            res.status(500).json({ message: err.message });
        }
    });

    // Helper function to check application eligibility
    function checkApplicationEligibility(student, form) {
        // If no eligibility criteria set, all students are eligible
        if (form.eligible_programs.length === 0 && form.eligible_year_levels.length === 0) {
            return true;
        }

        // Check program eligibility
        if (form.eligible_programs.length > 0) {
            if (!form.eligible_programs.includes(student.program)) {
                return false;
            }
        }

        // Check year level eligibility
        if (form.eligible_year_levels.length > 0) {
            if (!form.eligible_year_levels.includes(student.year_level)) {
                return false;
            }
        }

        return true;
    }

    // ==================== ATTENDANCE API ENDPOINTS ====================

    async function autoUpdateEventStatuses() {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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
        const now = new Date();
        
        // Get today's date in local timezone (midnight to end of day)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
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
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
        }
    });

    // Create attendance event (admin only)
    app.post('/apis/attendance/events', auth, async (req, res) => {
        try {
            const { title, description, location, event_date, year_level, status, start_time, end_time, is_custom, assigned_users } = req.body;

            if (!title || !event_date) {
                return res.status(400).json({ message: "Title and event date are required" });
            }

            // Auto-determine status based on event date if not provided
            let eventStatus = status;
            if (!eventStatus) {
                eventStatus = getEventAutoStatus(new Date(event_date));
            }

            const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);

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
                created_by_name: req.master.username,
                activated_at: eventStatus === 'active' ? new Date() : null,
                is_custom: is_custom || false,
                assigned_users: assigned_users && Array.isArray(assigned_users) ? assigned_users : []
            });

            const saved = await event.save();
            res.status(201).json({ message: "Event created successfully", event: saved });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Update attendance event (admin only)
    app.put('/apis/attendance/events/:id', auth, async (req, res) => {
        try {
            const { title, description, location, event_date, year_level, status, start_time, end_time, is_custom, assigned_users } = req.body;

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
            if (assigned_users !== undefined) {
                console.log(`[Event Update] Before save - assigned_users:`, event.assigned_users);
                event.assigned_users = assigned_users || [];
                console.log(`[Event Update] After assignment - assigned_users:`, event.assigned_users);
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

            res.json({ message: "Event updated successfully", event: updated });
        } catch (err) {
            console.error(`[Event Update] Error:`, err.message);
            res.status(500).json({ message: err.message });
        }
    });

    // Delete attendance event (admin only)
    app.delete('/apis/attendance/events/:id', auth, async (req, res) => {
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

            res.json({ message: "Event, sessions, and all related attendance logs deleted successfully" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Create custom event for specific users
    app.post('/apis/attendance/events/custom/create', adminOrTreasurerAuth, async (req, res) => {
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
                created_by_name: req.master ? req.master.username : req.student.full_name,
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
            res.status(500).json({ message: err.message });
        }
    });

    // Update custom event
    app.put('/apis/attendance/events/custom/:id', adminOrTreasurerAuth, async (req, res) => {
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
            res.status(500).json({ message: err.message });
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
            res.status(500).json({ message: err.message });
        }
    });

    // Get attendance export as Excel with custom columns
    app.get('/apis/attendance/events/:eventId/export-excel', treasurerAuth, async (req, res) => {
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
            res.status(500).json({ message: err.message });
        }
    });

    // ==================== SESSION CRUD ENDPOINTS ====================

    // Create session for an event (admin only)
    app.post('/apis/attendance/events/:eventId/sessions', auth, async (req, res) => {
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
                status: status || (event.status === 'active' ? 'active' : 'draft')
            });

            const saved = await session.save();
            res.status(201).json({ message: "Session created successfully", session: saved });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Get all sessions for an event (admin with JWT)
    app.get('/apis/attendance/events/:eventId/sessions', auth, async (req, res) => {
        try {
            const SessionModel = getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, req.college);
            const sessions = await SessionModel.find({ event_id: req.params.eventId })
                .sort({ start_time: 1 });
            res.json({ data: sessions });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Update session (admin only)
    app.put('/apis/attendance/sessions/:id', auth, async (req, res) => {
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
            if (rfidScanner !== undefined) session.rfidScanner = rfidScanner;

            session.updated_at = new Date();
            const updated = await session.save();

            console.log('[SESSION UPDATE] saved session', updated._id ? updated._id.toString() : 'unknown', 'rfidScanner=', updated.rfidScanner);

            res.json({ message: "Session updated successfully", session: updated });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Delete session (admin only)
    app.delete('/apis/attendance/sessions/:id', auth, async (req, res) => {
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

            res.json({ message: "Session and related attendance logs deleted successfully" });
        } catch (err) {
            res.status(500).json({ message: err.message });
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
                        present: { $sum: { $cond: [{ $and: [{ $ne: ["$check_in_at", null] }, { $ne: ["$check_out_at", null] }, { $eq: ["$is_late", false] }] }, 1, 0] } },
                        late: { $sum: { $cond: [{ $and: [{ $ne: ["$check_in_at", null] }, { $ne: ["$check_out_at", null] }, { $eq: ["$is_late", true] }] }, 1, 0] } },
                        incomplete: { $sum: { $cond: [{ $and: [{ $ne: ["$check_in_at", null] }, { $eq: ["$check_out_at", null] }] }, 1, 0] } }
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
            res.status(500).json({ message: err.message });
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
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $ne: ['$check_out_at', null] }, { $eq: ['$is_late', false] }] }, 
                                    1, 
                                    0
                                ] 
                            } 
                        },
                        has_late: { 
                            $max: { 
                                $cond: [
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $ne: ['$check_out_at', null] }, { $eq: ['$is_late', true] }] }, 
                                    1, 
                                    0
                                ] 
                            } 
                        },
                        has_incomplete: { 
                            $max: { 
                                $cond: [
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $eq: ['$check_out_at', null] }] }, 
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
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $ne: ['$check_out_at', null] }, { $eq: ['$is_late', false] }] }, 
                                    1, 
                                    0
                                ] 
                            } 
                        },
                        has_late: { 
                            $max: { 
                                $cond: [
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $ne: ['$check_out_at', null] }, { $eq: ['$is_late', true] }] }, 
                                    1, 
                                    0
                                ] 
                            } 
                        },
                        has_incomplete: { 
                            $max: { 
                                $cond: [
                                    { $and: [{ $ne: ['$check_in_at', null] }, { $eq: ['$check_out_at', null] }] }, 
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
            res.status(500).json({ message: err.message });
        }
    });

    // PATCH endpoint to update individual attendance log (supports is_late, excused, excuse_reason)
    app.patch('/apis/attendance/logs/:id', auth, async (req, res) => {
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
            res.status(500).json({ message: err.message });
        }
    });

    // RFID Check-in/Check-out endpoint with 1-minute duplicate prevention
    const DUPLICATE_PREVENTION_MS = 1 * 60 * 1000; // 1 minute in milliseconds

    // Session-based RFID Check-in/Check-out endpoint
    app.post('/apis/attendance/sessions/:sessionId/check', auth, async (req, res) => {
        try {
            const { rfid_code, student_id, identifier_type = 'rfid', source = 'rfid' } = req.body;

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
                    source,
                    input_method: isManualStudentId ? 'manual_student_id' : 'rfid'
                });
                action = 'check_in';
            } else if (!log.check_out_at) {
                // Already checked in - user scanned again while in check-in mode
                const timeSinceCheckIn = now - new Date(log.check_in_at);
                
                // Duplicate check-in attempt within cooldown period
                if (timeSinceCheckIn < DUPLICATE_PREVENTION_MS) {
                    const remainingSeconds = Math.ceil((DUPLICATE_PREVENTION_MS - timeSinceCheckIn) / 1000);
                    return res.status(200).json({ 
                        message: `You have already checked in. Please check out first. Wait ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s before checking out.`,
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
            res.status(500).json({ message: err.message });
        }
    });

    // Get student's own attendance records - now session-based
    app.get('/apis/attendance/my-records', studentAuthWithToken, async (req, res) => {
        try {
            const student = req.student;
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }

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

            const records = await Promise.all(events.map(async (event) => {
                // Note: Previously filtered out events where student was registered after activation.
                // Removed this restriction to allow students to see all events they attended.

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
                        } else if (log.check_in_at && log.check_out_at) {
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
            res.status(500).json({ message: err.message });
        }
    });

    // ==================== CONTRIBUTION TRACKING ENDPOINTS ====================

    // Initialize contributions for an event (Treasurer Only)
    // Creates contribution records for all registered students in an event
    app.post('/apis/contributions/initialize/:eventId', treasurerAuth, async (req, res) => {
        try {
            const eventId = req.params.eventId;
            const EventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
            const LogModel = getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, req.college);
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);

            const event = await EventModel.findById(eventId);
            
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }

            // Get all attendance logs (registered students) for this event
            const registeredStudents = await LogModel.find({ event_id: eventId })
                .distinct('student_id');

            // Get student details for each registered student
            const students = await StudentModel.find({ _id: { $in: registeredStudents } });

            // Create contribution records for each student
            const contributionRecords = [];
            for (const student of students) {
                try {
                    const record = await EventContributionModel.findOneAndUpdate(
                        { event_id: eventId, student_id: student._id },
                        {
                            event_id: eventId,
                            student_id: student._id,
                            student_id_number: student.student_id,
                            student_name: `${student.first_name} ${student.last_name}`,
                            program: student.program,
                            year_level: student.year_level,
                            payment_status: 'unpaid'
                        },
                        { upsert: true, new: true }
                    );
                    contributionRecords.push(record);
                } catch (err) {
                    // Skip duplicate key errors
                    if (err.code !== 11000) {
                        console.error(`Error creating contribution for student ${student._id}:`, err);
                    }
                }
            }

            res.json({ 
                success: true, 
                message: `Initialized ${contributionRecords.length} contribution records for event "${event.title}"`,
                count: contributionRecords.length
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Get all contributions for an event (Treasurer Only)
    app.get('/apis/contributions/event/:eventId', treasurerAuth, async (req, res) => {
        try {
            const { search, paymentStatus, program, yearLevel, page = 1, limit = 50 } = req.query;
            
            const filter = { event_id: new mongoose.Types.ObjectId(req.params.eventId) };
            
            if (paymentStatus) {
                filter.payment_status = paymentStatus;
            }
            
            if (program) {
                filter.program = program;
            }
            
            if (yearLevel) {
                filter.year_level = yearLevel;
            }
            
            if (search) {
                const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                filter.$or = [
                    { student_name: { $regex: escapedSearch, $options: 'i' } },
                    { student_id_number: { $regex: escapedSearch, $options: 'i' } }
                ];
            }

            const total = await EventContribution.countDocuments(filter);
            const skip = (page - 1) * parseInt(limit);
            
            const contributions = await EventContribution.find(filter)
                .sort({ student_name: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Get summary stats
            const stats = await EventContribution.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        paid: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, 1, 0] } },
                        unpaid: { $sum: { $cond: [{ $eq: ['$payment_status', 'unpaid'] }, 1, 0] } }
                    }
                }
            ]);

            res.json({
                success: true,
                data: contributions,
                stats: stats[0] || { total: 0, paid: 0, unpaid: 0 },
                pagination: {
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Mark student payment as paid (Treasurer Only)
    // Can be called with student_id or rfid_code
    app.post('/apis/contributions/event/:eventId/mark-paid', treasurerAuth, async (req, res) => {
        try {
            const { student_id_number, rfid_code, notes } = req.body;
            
            if (!student_id_number && !rfid_code) {
                return res.status(400).json({ message: "Student ID or RFID code required" });
            }

            // Find the student
            let studentQuery = {};
            if (student_id_number) {
                studentQuery.student_id = student_id_number;
            } else if (rfid_code) {
                studentQuery.rfid_code = rfid_code;
            }

            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);

            const student = await StudentModel.findOne(studentQuery);
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }

            // Update contribution status
            const contribution = await EventContributionModel.findOneAndUpdate(
                { 
                    event_id: new mongoose.Types.ObjectId(req.params.eventId),
                    student_id: student._id
                },
                {
                    payment_status: 'paid',
                    paid_at: new Date(),
                    paid_by_treasurer: req.student.student_id,
                    notes: notes || ''
                },
                { new: true }
            );

            if (!contribution) {
                return res.status(404).json({ message: "Contribution record not found for this event" });
            }

            // Also attempt to reflect this payment in consolidated payment records
            try {
                const AttendanceEventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);
                const PaymentModel = getCollegeModel(Payment, CCS_Payment, COE_Payment, req.college);
                const PaymentRecordModel = getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, req.college);

                const event = await AttendanceEventModel.findById(req.params.eventId);
                if (event) {
                    // Try to find a payment campaign with the same title as the event
                    const payment = await PaymentModel.findOne({ title: event.title, amount_due: { $gt: 0 } });
                    if (payment) {
                        const pr = await PaymentRecordModel.findOne({ student_id: student.student_id });
                        if (pr) {
                            const campaignIndex = pr.campaigns.findIndex(c => c.payment_id && c.payment_id.toString() === payment._id.toString());
                            if (campaignIndex >= 0) {
                                pr.campaigns[campaignIndex].payment_status = 'paid';
                                pr.campaigns[campaignIndex].paid_at = new Date();
                                pr.campaigns[campaignIndex].amount_paid = pr.campaigns[campaignIndex].amount_paid || payment.amount_due || 0;
                                pr.campaigns[campaignIndex].paid_by_treasurer = req.student?.student_id || (req.master && req.master.username) || null;
                                pr.updated_at = new Date();
                                await pr.save();
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error syncing EventContribution to PaymentRecord:', e);
            }

            res.json({
                success: true,
                message: `Payment recorded for ${student.first_name} ${student.last_name}`,
                data: contribution
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Mark student payment as unpaid (Treasurer Only)
    app.post('/apis/contributions/event/:eventId/mark-unpaid', treasurerAuth, async (req, res) => {
        try {
            const { student_id_number } = req.body;
            
            if (!student_id_number) {
                return res.status(400).json({ message: "Student ID required" });
            }

            // Find the student
            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);

            const student = await StudentModel.findOne({ student_id: student_id_number });
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }

            // Update contribution status
            const contribution = await EventContributionModel.findOneAndUpdate(
                { 
                    event_id: new mongoose.Types.ObjectId(req.params.eventId),
                    student_id: student._id
                },
                {
                    payment_status: 'unpaid',
                    paid_at: null,
                    paid_by_treasurer: null
                },
                { new: true }
            );

            if (!contribution) {
                return res.status(404).json({ message: "Contribution record not found for this event" });
            }

            res.json({
                success: true,
                message: `Payment status reset for ${student.first_name} ${student.last_name}`,
                data: contribution
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Get student's payment status for an event (Students can only view their own)
    app.get('/apis/contributions/student/:eventId', studentAuthWithToken, async (req, res) => {
        try {
            const eventId = req.params.eventId;
            
            // Student can only view their own contribution status
            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);
            const AttendanceEventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);

            const contribution = await EventContributionModel.findOne({
                event_id: new mongoose.Types.ObjectId(eventId),
                student_id: req.student._id
            });

            if (!contribution) {
                return res.status(404).json({ message: "No contribution record found for this event" });
            }

            const event = await AttendanceEventModel.findById(eventId);

            res.json({
                success: true,
                data: {
                    event_title: event?.title,
                    event_date: event?.event_date,
                    payment_status: contribution.payment_status,
                    paid_at: contribution.paid_at,
                    paid_by_treasurer: contribution.paid_by_treasurer,
                    notes: contribution.notes
                }
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Export contributions as CSV/JSON (Treasurer Only)
    app.get('/apis/contributions/event/:eventId/export', treasurerAuth, async (req, res) => {
        try {
            const { format = 'json' } = req.query;
            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);
            const AttendanceEventModel = getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, req.college);

            const contributions = await EventContributionModel.find({ 
                event_id: new mongoose.Types.ObjectId(req.params.eventId)
            }).sort({ student_name: 1 });

            const event = await AttendanceEventModel.findById(req.params.eventId);

            if (format === 'csv') {
                // Generate CSV
                const headers = ['Student ID', 'Name', 'Program', 'Year Level', 'Payment Status', 'Paid At', 'Paid By'];
                const rows = contributions.map(c => [
                    c.student_id_number,
                    c.student_name,
                    c.program,
                    c.year_level,
                    c.payment_status,
                    c.paid_at ? new Date(c.paid_at).toLocaleString() : '',
                    c.paid_by_treasurer || ''
                ]);

                const csv = [headers, ...rows].map(row => 
                    row.map(cell => `"${cell}"`).join(',')
                ).join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="contributions-${event?.title || 'export'}-${Date.now()}.csv"`);
                res.send(csv);
            } else {
                // Return JSON
                const stats = {
                    total: contributions.length,
                    paid: contributions.filter(c => c.payment_status === 'paid').length,
                    unpaid: contributions.filter(c => c.payment_status === 'unpaid').length
                };

                res.json({
                    success: true,
                    event: {
                        _id: event._id,
                        title: event.title,
                        date: event.event_date
                    },
                    stats,
                    data: contributions
                });
            }
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Apply discount to contribution
    app.post('/apis/contributions/event/:eventId/apply-discount', treasurerAuth, async (req, res) => {
        try {
            const { student_id_number, discount_type, discount_value, original_amount } = req.body;
            
            if (!student_id_number || !discount_type || discount_value === undefined) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, req.college);
            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);

            const student = await StudentModel.findOne({ student_id: student_id_number });
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }

            let finalDiscountValue = 0;
            let targetAmount = original_amount;

            if (discount_type === 'percentage') {
                finalDiscountValue = (original_amount * discount_value) / 100;
                targetAmount = original_amount - finalDiscountValue;
            } else if (discount_type === 'amount') {
                finalDiscountValue = Math.min(discount_value, original_amount);
                targetAmount = original_amount - finalDiscountValue;
            }

            const contribution = await EventContributionModel.findOneAndUpdate(
                { 
                    event_id: new mongoose.Types.ObjectId(req.params.eventId),
                    student_id_number: student_id_number
                },
                {
                    original_amount,
                    discount_type,
                    discount_value: finalDiscountValue,
                    target_amount: Math.max(0, targetAmount),
                    updated_at: new Date()
                },
                { new: true }
            );

            if (!contribution) {
                return res.status(404).json({ message: "Contribution record not found" });
            }

            res.json({
                success: true,
                message: "Discount applied successfully",
                data: contribution
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Enhanced search for contributions with RFID support
    app.get('/apis/contributions/search', treasurerAuth, async (req, res) => {
        try {
            const { query, year_level, program, status, limit = 50, page = 1 } = req.query;
            
            const filter = {};
            if (year_level) filter.year_level = year_level;
            if (program) filter.program = program;

            // Build clauses to combine status and query without overwriting
            const clauses = [];
            if (status) {
                const s = String(status).toLowerCase();
                if (s === 'unpaid') {
                    // Include unpaid, pending, and records with missing/null payment_status
                    clauses.push({ $or: [
                        { payment_status: { $regex: '^unpaid$', $options: 'i' } },
                        { payment_status: { $regex: '^pending$', $options: 'i' } },
                        { payment_status: { $exists: false } },
                        { payment_status: null }
                    ]});
                } else {
                    clauses.push({ payment_status: { $regex: `^${s}$`, $options: 'i' } });
                }
            }

            if (query) {
                const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                clauses.push({ $or: [
                    { student_id_number: { $regex: escapedQuery, $options: 'i' } },
                    { student_name: { $regex: escapedQuery, $options: 'i' } }
                ]});
            }

            if (clauses.length) {
                filter.$and = clauses;
            }
            // Log computed filter for debugging export/search mismatches
            console.log('[CONTRIB SEARCH] computed filter:', JSON.stringify(filter), 'page:', page, 'limit:', limit);

            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const total = await EventContributionModel.countDocuments(filter);
            console.log('[CONTRIB SEARCH] matched total:', total);
            const contributions = await EventContributionModel.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: contributions,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Download payment records as Excel
    app.get('/apis/contributions/download/excel', treasurerAuth, async (req, res) => {
        try {
            const { status, year_level = '', program = '' } = req.query;
            
            const filter = {};
            if (status) {
                const s = String(status).toLowerCase();
                if (s === 'unpaid') {
                    // Include unpaid, pending, and records with missing/null payment_status
                    filter.$or = [
                        { payment_status: { $regex: '^unpaid$', $options: 'i' } },
                        { payment_status: { $regex: '^pending$', $options: 'i' } },
                        { payment_status: { $exists: false } },
                        { payment_status: null }
                    ];
                } else {
                    filter.payment_status = { $regex: `^${s}$`, $options: 'i' };
                }
            }
            if (year_level) filter.year_level = year_level;
            if (program) filter.program = program;

            // Log computed filter for download debug
            console.log('[CONTRIB DOWNLOAD] computed filter:', JSON.stringify(filter));

            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);

            const contributions = await EventContributionModel.find(filter)
                .sort({ student_name: 1 })
                .select('student_id_number student_name program year_level payment_status original_amount discount_value target_amount paid_at');

            console.log('[CONTRIB DOWNLOAD] found records:', contributions.length);

            // Format data for Excel - ensure headers even when empty
            const data = contributions.map(c => ({
                'Student ID': c.student_id_number || '',
                'Name': c.student_name || '',
                'Program': c.program || '',
                'Year Level': c.year_level || '',
                'Original Amount': typeof c.original_amount === 'number' ? c.original_amount : 0,
                'Discount': typeof c.discount_value === 'number' ? c.discount_value : 0,
                'Final Amount': typeof c.target_amount === 'number' ? c.target_amount : (typeof c.original_amount === 'number' ? c.original_amount : 0),
                'Status': (c.payment_status || '').toString().toUpperCase(),
                'Date Paid': c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-PH') : ''
            }));

            const exportHeaders = ['Student ID','Name','Program','Year Level','Original Amount','Discount','Final Amount','Status','Date Paid'];
            const exportRows = data.length ? data.map(row => exportHeaders.map(h => row[h] || '')) : [];

            // Create CSV
            const exportCsv = [exportHeaders, ...exportRows].map(row => 
                row.map(cell => `"${String(cell || '')}"`).join(',')
            ).join('\n');

            // Use exportCsv for response below

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="payment-records-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(exportCsv);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Get contribution statistics by level and program
    app.get('/apis/contributions/stats', treasurerAuth, async (req, res) => {
        try {
            const EventContributionModel = getCollegeModel(EventContribution, CCS_EventContribution, COE_EventContribution, req.college);

            const stats = await EventContributionModel.aggregate([
                {
                    $group: {
                        _id: {
                            year_level: '$year_level',
                            program: '$program',
                            status: '$payment_status'
                        },
                        count: { $sum: 1 },
                        total_amount: { $sum: '$target_amount' }
                    }
                },
                { $sort: { '_id.year_level': 1, '_id.program': 1 } }
            ]);

            res.json({ success: true, data: stats });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    export default app;