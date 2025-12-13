import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const app = express();
dotenv.config();

const ALLOWED_ORIGINS = [
  'https://ssaam.vercel.app',
  'https://ssaam-api.vercel.app',
  process.env.FRONTEND_URL,
  process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : null,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean);

const isReplitOrigin = (origin) => {
  if (!origin) return false;
  return origin.endsWith('.replit.dev') || origin.endsWith('.repl.co');
};

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || isReplitOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-SSAAM-TS', 'X-Admin-Action-Token'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

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
const MONGO_URI = process.env.MONGO_URI;

if (!process.env.SSAAM_API_KEY || !process.env.SSAAM_CRYPTO_KEY || !process.env.ADMIN_VERIFICATION_SECRET) {
    console.error('CRITICAL: Required security secrets (SSAAM_API_KEY, SSAAM_CRYPTO_KEY, ADMIN_VERIFICATION_SECRET) are not set!');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

const SSAAM_API_KEY = process.env.SSAAM_API_KEY;
const SSAAM_CRYPTO_KEY = process.env.SSAAM_CRYPTO_KEY;
const ADMIN_VERIFICATION_SECRET = process.env.ADMIN_VERIFICATION_SECRET;
const ADMIN_ACTION_KEY = process.env.ADMIN_ACTION_KEY;
const PRIMARY_ADMIN_USERNAME = process.env.PRIMARY_ADMIN_USERNAME || 'ssaam';

const VALID_PROGRAMS = ['BSCS', 'BSIT', 'BSIS'];
const VALID_SUFFIXES = ['', 'Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const VALID_SEMESTERS = ['1st Sem', '2nd Sem'];
const VALID_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const VALID_ROLES = ['student', 'medpub'];
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
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
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

const connectWithRetry = async (retryCount = 0, maxRetries = 10, retryDelay = 5000) => {
    try {
        await mongoose.connect(MONGO_URI, { 
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            w: 'majority'
        });
        console.log('Connected to MongoDB Atlas');
        app.listen(PORT, () => console.log(`Server running on ${PORT}`));
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

connectWithRetry();

const STUDENT_ID_REGEX = /^[0-9]{2}-[A-Z]-[0-9]{5}$/;
const UPPERCASE_ONLY_REGEX = /^[A-ZÑ\s'-]+$/;

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

const adminActionTokenSchema = new mongoose.Schema({
    token_hash: { type: String, required: true, unique: true },
    admin_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    admin_username: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
    used_count: { type: Number, default: 0 },
    max_uses: { type: Number, default: 50 },
    is_revoked: { type: Boolean, default: false }
});

adminActionTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
adminActionTokenSchema.index({ admin_id: 1 });

const AdminActionToken = mongoose.model("AdminActionToken", adminActionTokenSchema);

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
    rfid_verified_by: { type: String, default: null },
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
    school_year: { type: String, required: true },
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
        required: true,
        enum: {
            values: VALID_SEMESTERS,
            message: "Semester must be one of: 1st Sem, 2nd Sem"
        }
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
    custom_password: { type: String, default: null }
});

const Student = mongoose.model("Student", studentSchema);

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
    password: { type: String, required: true },
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
    }
});

const Settings = mongoose.model("Settings", settingsSchema, "settings");

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

const notificationSeenSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    notification_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Notification' },
    seen_at: { type: Date, default: Date.now }
});

notificationSeenSchema.index({ user_id: 1, notification_id: 1 }, { unique: true });
notificationSeenSchema.index({ notification_id: 1 });

const NotificationSeen = mongoose.model("NotificationSeen", notificationSeenSchema);

// ==================== ATTENDANCE SCHEMAS ====================

// Attendance Event Schema - Events created by admin for attendance tracking
const attendanceEventSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 2000, default: "" },
    location: { type: String, maxlength: 200, default: "" },
    event_date: { type: Date, required: true },
    start_time: { type: String, required: true }, // e.g., "08:00"
    end_time: { type: String, required: true }, // e.g., "17:00"
    // Session type: 'single' for 2-in-a-day (check-in/out), 'dual' for 4-in-a-day (morning/afternoon)
    session_type: {
        type: String,
        enum: ['single', 'dual'],
        default: 'single'
    },
    // For dual session: afternoon start time (morning ends at this time)
    afternoon_start_time: { type: String, default: '13:00' }, // e.g., "13:00"
    status: { 
        type: String, 
        enum: ['draft', 'active', 'closed'],
        default: 'draft'
    },
    check_in_locked: { type: Boolean, default: false },
    check_out_locked: { type: Boolean, default: false },
    // For dual session: separate locks for each session
    morning_check_in_locked: { type: Boolean, default: false },
    morning_check_out_locked: { type: Boolean, default: false },
    afternoon_check_in_locked: { type: Boolean, default: false },
    afternoon_check_out_locked: { type: Boolean, default: false },
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

// Attendance Log Schema - Individual student attendance records
// Supports 4-in-a-day attendance (morning check-in/out, afternoon check-in/out)
// Or 2-in-a-day attendance (single check-in/out)
const attendanceLogSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceEvent', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    student_id_number: { type: String, required: true }, // e.g., "21-A-12345"
    rfid_code: { type: String, default: null },
    student_name: { type: String, required: true },
    program: { type: String },
    year_level: { type: String },
    // Morning session (AM)
    morning_check_in_at: { type: Date, default: null },
    morning_check_out_at: { type: Date, default: null },
    // Afternoon session (PM)
    afternoon_check_in_at: { type: Date, default: null },
    afternoon_check_out_at: { type: Date, default: null },
    // Legacy single session fields (for backward compatibility)
    check_in_at: { type: Date, default: null },
    check_out_at: { type: Date, default: null },
    is_late: { type: Boolean, default: false },
    is_morning_late: { type: Boolean, default: false },
    is_afternoon_late: { type: Boolean, default: false },
    source: { type: String, enum: ['rfid', 'manual'], default: 'rfid' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

attendanceLogSchema.index({ event_id: 1, student_id: 1 }, { unique: true });
attendanceLogSchema.index({ event_id: 1, rfid_code: 1 });
attendanceLogSchema.index({ event_id: 1, check_in_at: -1 });
attendanceLogSchema.index({ event_id: 1, morning_check_in_at: -1 });

// Virtual for attendance status (present, late, incomplete, absent)
attendanceLogSchema.virtual('attendance_status').get(function() {
    // Check if using morning/afternoon sessions
    const hasMorningSession = this.morning_check_in_at || this.morning_check_out_at;
    const hasAfternoonSession = this.afternoon_check_in_at || this.afternoon_check_out_at;
    
    if (hasMorningSession || hasAfternoonSession) {
        // 4-in-a-day mode
        const morningComplete = this.morning_check_in_at && this.morning_check_out_at;
        const afternoonComplete = this.afternoon_check_in_at && this.afternoon_check_out_at;
        
        if (morningComplete && afternoonComplete) {
            return (this.is_morning_late || this.is_afternoon_late) ? 'late' : 'present';
        }
        if (morningComplete || afternoonComplete || this.morning_check_in_at || this.afternoon_check_in_at) {
            return 'incomplete';
        }
        return 'absent';
    }
    
    // Legacy 2-in-a-day mode
    if (this.check_in_at && this.check_out_at) {
        return this.is_late ? 'late' : 'present';
    }
    if (this.check_in_at && !this.check_out_at) return 'incomplete';
    return 'absent';
});

attendanceLogSchema.set('toJSON', { virtuals: true });
attendanceLogSchema.set('toObject', { virtuals: true });

const AttendanceLog = mongoose.model("AttendanceLog", attendanceLogSchema);

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

async function getSettings() {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({
            userRegister: { register: true, message: "" },
            userLogin: { login: true, message: "" },
            rfidScanner: { 
                checkInEnabled: true, 
                checkOutEnabled: true,
                autoDisableCheckIn: false,
                autoDisableCheckOut: false,
                checkInDisableAt: null,
                checkOutDisableAt: null
            }
        });
    } else if (!settings.rfidScanner) {
        settings.rfidScanner = { 
            checkInEnabled: true, 
            checkOutEnabled: true,
            autoDisableCheckIn: false,
            autoDisableCheckOut: false,
            checkInDisableAt: null,
            checkOutDisableAt: null
        };
        await settings.save();
    }

    // Check auto-disable timers and update if needed
    const now = new Date();
    let needsSave = false;

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

    if (needsSave) {
        await settings.save();
    }

    return settings;
}

async function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
        return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, SSAAM_API_KEY);

        const tokenHash = hashToken(token);
        const sessionToken = await SessionToken.findOneAndUpdate(
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
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, SSAAM_API_KEY);

        const tokenHash = hashToken(token);
        const sessionToken = await SessionToken.findOneAndUpdate(
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

        // Fetch the full student document
        const student = await Student.findOne({ student_id: decoded.student_id });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        if (decoded.role === 'medpub') {
            if (student.role !== 'medpub') {
                await SessionToken.updateOne({ _id: sessionToken._id }, { is_revoked: true });
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
    const token = req.headers.authorization?.split(" ")[1];

    if (!token || token !== process.env.SSAAM_STUDENT_API_KEY) {
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

async function adminActionAuth(req, res, next) {
    if (!req.master) {
        return res.status(401).json({ message: "Authentication required" });
    }

    // First verify this is actually an admin token
    if (!req.master.isMaster) {
        return res.status(403).json({ 
            message: "Access denied. Admin privileges required.",
            code: 'NOT_ADMIN'
        });
    }

    if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
        return res.status(403).json({ 
            message: `Only the primary admin (${PRIMARY_ADMIN_USERNAME}) can perform this action`,
            code: 'NOT_PRIMARY_ADMIN'
        });
    }

    const actionToken = req.headers['x-admin-action-token'];

    if (!actionToken) {
        return res.status(403).json({ 
            message: "Admin action token required. Please verify your admin key first.",
            code: 'ACTION_TOKEN_REQUIRED'
        });
    }

    try {
        const tokenHash = hashToken(actionToken);
        const adminActionRecord = await AdminActionToken.findOneAndUpdate(
            {
                token_hash: tokenHash,
                admin_id: req.master.id,
                is_revoked: false,
                expires_at: { $gt: new Date() },
                $expr: { $lt: ['$used_count', '$max_uses'] }
            },
            { $inc: { used_count: 1 } },
            { new: true }
        );

        if (!adminActionRecord) {
            return res.status(403).json({ 
                message: "Invalid or expired admin action token. Please verify your admin key again.",
                code: 'INVALID_ACTION_TOKEN'
            });
        }

        req.adminActionToken = adminActionRecord;
        next();
    } catch (err) {
        console.error("Admin action auth error:", err);
        return res.status(500).json({ message: "Authentication error" });
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
        const allStudents = await Student.find({});
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
        const allStudents = await Student.find({});
        // Allow A-Z, accented uppercase (Ñ, É, etc.), spaces, hyphens, apostrophes
        const uppercaseRegex = /^[A-ZÑÉÍÓÚÀÈÌÒÙÄËÏÖÜ\s'-]+$/;

        const invalidStudents = allStudents.filter(s => {
            const firstName = s.first_name || '';
            const lastName = s.last_name || '';
            return !uppercaseRegex.test(firstName) || !uppercaseRegex.test(lastName);
        });

        const idsToDelete = invalidStudents.map(s => s._id);

        const result = await Student.deleteMany({ _id: { $in: idsToDelete } });

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
        const invalidStudents = await Student.find({
            program: { $nin: ['BSCS', 'BSIT', 'BSIS'] }
        });

        // Get list of what will be deleted
        const toDelete = invalidStudents.map(s => ({
            student_id: s.student_id,
            name: s.full_name || `${s.first_name} ${s.last_name}`,
            program: s.program
        }));

        // Delete them
        const result = await Student.deleteMany({
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
        const invalidStudents = await Student.find({
            program: { $nin: ['BSCS', 'BSIT', 'BSIS'] }
        });

        const validCount = await Student.countDocuments({
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
        // Find all students without a status field and set it to 'pending'
        const result = await Student.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'pending' } }
        );

        // Also fix any null/undefined status values
        const result2 = await Student.updateMany(
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
        const pendingQuery = await Student.find({ status: 'pending' }).limit(5);
        const pendingCount = await Student.countDocuments({ status: 'pending' });

        // Also get all unique status values in the database
        const allStatuses = await Student.distinct('status');

        // Get a sample of raw documents to see actual field values
        const rawSample = await Student.find({}).limit(3).lean();

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

app.delete('/apis/debug/session-tokens/clear', auth, adminActionAuth, async (req, res) => {
    try {
        const { type } = req.query;
        let result;

        if (type === 'all') {
            result = await SessionToken.deleteMany({});
        } else if (type === 'inactive') {
            const cutoffTime = new Date(Date.now() - SESSION_INACTIVITY_MS);
            result = await SessionToken.deleteMany({
                $or: [
                    { last_used_at: { $lt: cutoffTime } },
                    { last_used_at: null, created_at: { $lt: cutoffTime } }
                ]
            });
        } else if (type === 'expired') {
            result = await SessionToken.deleteMany({
                $or: [
                    { expires_at: { $lte: new Date() } },
                    { is_revoked: true }
                ]
            });
        } else {
            return res.status(400).json({ 
                message: "Invalid type. Use: 'all', 'inactive', or 'expired'" 
            });
        }

        res.json({
            message: `Cleared ${result.deletedCount} session tokens`,
            type,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Debug endpoint to check all students in database regardless of status
app.get('/apis/debug/students', async (req, res) => {
    try {
        const allStudents = await Student.find({});
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

        // Select only necessary fields to reduce payload size
        const students = await Student.find({ status: 'approved' })
            .select('student_id first_name middle_name last_name suffix full_name program year_level semester school_year photo email role rfid_status rfid_code created_date')
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        const total = await Student.countDocuments({ status: 'approved' });
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

        const allStudents = await Student.find({ status: 'approved' });

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
            } else if (rfidStatus === 'unverified') {
                unverifiedCount++;
            } else if (rfidStatus && rfidStatus !== '' && rfidStatus !== null && rfidStatus !== undefined) {
                unreadableCount++;
            } else {
                unverifiedCount++;
            }
        });

        const pendingCount = await Student.countDocuments({ status: 'pending' });

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

app.get('/apis/students/search', studentAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const program = req.query.program || '';
        const yearLevel = req.query.yearLevel || '';
        const rfidStatus = req.query.rfid_status || '';

        const filter = { status: 'approved' };

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
        const students = await Student.find(filter)
            .select('student_id first_name middle_name last_name suffix full_name program year_level semester school_year photo email role rfid_status rfid_code created_date')
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        const total = await Student.countDocuments(filter);
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Debug: Log the query
        console.log('Fetching pending students, page:', page, 'limit:', limit);

        // Select only necessary fields to reduce payload size
        const students = await Student.find({ status: 'pending' })
            .select('student_id first_name middle_name last_name suffix full_name program year_level semester school_year photo email role rfid_status created_date')
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        const total = await Student.countDocuments({ status: 'pending' });

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
        console.error('Error fetching pending students:', err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/apis/students/send-verification', studentAuth, antiBotProtection, async (req, res) => {
    try {
        const settings = await getSettings();
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
        if (yearPrefix < 18 || yearPrefix > 25) {
            return res.status(400).json({ message: "Student ID must start with 18 to 25" });
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

        const semesterValidation = validateSemester(data.semester);
        if (!semesterValidation.valid) {
            return res.status(400).json({ message: semesterValidation.message });
        }

        const yearLevelValidation = validateYearLevel(data.year_level);
        if (!yearLevelValidation.valid) {
            return res.status(400).json({ message: yearLevelValidation.message });
        }

        if (!VALID_PROGRAMS.includes(data.program)) {
            return res.status(400).json({ message: "Program must be one of: BSCS, BSIT, or BSIS" });
        }

        const existingStudent = await Student.findOne({ student_id: data.student_id });
        if (existingStudent) {
            return res.status(400).json({ message: "Student ID already registered" });
        }
        
        // Check for duplicate email (case-insensitive, normalized to lowercase)
        const normalizedEmail = data.email.toLowerCase().trim();
        const existingEmail = await Student.findOne({ 
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

        const full_name = `${firstName} ${middleName} ${lastName} ${data.suffix || ""}`
            .replace(/\s+/g, " ")
            .trim();

        const studentData = {
            student_id: data.student_id,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            suffix: suffixValidation.value,
            full_name,
            email: data.email,
            year_level: yearLevelValidation.value,
            semester: semesterValidation.value,
            school_year: data.school_year,
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

        const existingStudent = await Student.findOne({ student_id: studentData.student_id });
        if (existingStudent) {
            await VerificationCode.deleteOne({ _id: verification._id });
            return res.status(400).json({ message: "Student ID already registered" });
        }

        const student = new Student(studentData);
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

app.put('/apis/students/:student_id/approve', auth, adminActionAuth, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
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
        await Notification.updateMany(
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

app.put('/apis/students/:student_id/reject', auth, adminActionAuth, async (req, res) => {
    try {
        const { reason } = req.body;

        const student = await Student.findOne({ student_id: req.params.student_id, status: 'pending' });

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

        await AttendanceLog.deleteMany({ student_id: student._id });
        await NotificationSeen.deleteMany({ user_id: student._id });
        await SessionToken.deleteMany({ user_id: student._id });
        await Student.deleteOne({ _id: student._id });

        res.json({
            message: "Student rejected and removed from database",
            removed_student: studentInfo,
            rejection_reason: reason || ''
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/apis/students/:student_id/rfid', auth, adminActionAuth, timestampAuth, async (req, res) => {
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

        const existingRfid = await Student.findOne({ 
            rfid_code: rfid_code,
            student_id: { $ne: req.params.student_id }
        });
        if (existingRfid) {
            return res.status(400).json({ message: "This RFID code is already assigned to another student" });
        }

        const adminVerifyToken = generateSecureToken();

        const updated = await Student.findOneAndUpdate(
            { student_id: req.params.student_id },
            { 
                rfid_code: rfid_code.trim(),
                rfid_status: "verified",
                rfid_verified_at: new Date(),
                rfid_verified_by: req.master.username,
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

app.delete('/apis/students/:student_id/rfid', auth, adminActionAuth, timestampAuth, async (req, res) => {
    try {
        const updated = await Student.findOneAndUpdate(
            { student_id: req.params.student_id },
            { 
                rfid_code: null,
                rfid_status: "unverified",
                rfid_verified_at: null,
                rfid_verified_by: null,
                admin_verification_token: null
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({
            message: "RFID code removed successfully",
            student: updated
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/apis/students/:student_id/role', auth, adminActionAuth, timestampAuth, async (req, res) => {
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

app.put('/apis/students/:student_id', auth, adminActionAuth, timestampAuth, async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates.student_id;
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
        delete updates.rfid_verified_by;
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

        if (updates.first_name || updates.middle_name !== undefined || updates.last_name || updates.suffix !== undefined) {
            const currentStudent = await Student.findOne({ student_id: req.params.student_id });
            if (currentStudent) {
                const first = updates.first_name || currentStudent.first_name || "";
                const mid = updates.middle_name !== undefined ? updates.middle_name : (currentStudent.middle_name || "");
                const last = updates.last_name || currentStudent.last_name || "";
                const suf = updates.suffix !== undefined ? updates.suffix : (currentStudent.suffix || "");
                updates.full_name = `${first} ${mid} ${last} ${suf}`.replace(/\s+/g, " ").trim();
            }
        }

        const updated = await Student.findOneAndUpdate(
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

app.delete('/apis/students/:student_id', auth, adminActionAuth, timestampAuth, async (req, res) => {
    try {
        const deleted = await Student.findOneAndDelete({ student_id: req.params.student_id });

        if (!deleted)
            return res.status(404).json({ message: "Student not found." });

        // Clean up: Remove this user's likes from all notifications
        const userId = deleted._id.toString();
        const studentId = deleted.student_id;
        await Notification.updateMany(
            { liked_by: { $in: [userId, studentId] } },
            { $pull: { liked_by: { $in: [userId, studentId] } } }
        );

        // Also revoke any active session tokens for this user
        await SessionToken.updateMany(
            { user_id: deleted._id },
            { is_revoked: true }
        );

        res.json({ message: "Student deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/apis/students/login', studentAuth, timestampAuth, async (req, res) => {
    try {
        const settings = await getSettings();
        if (!settings.userLogin.login) {
            return res.status(403).json({ 
                message: settings.userLogin.message || "Login is currently disabled.",
                loginDisabled: true
            });
        }

        const { student_id, last_name } = req.body;

        if (!student_id || !last_name)
            return res.status(400).json({ message: "Student ID and Password required" });

        // First find student by ID
        const student = await Student.findOne({ student_id });

        if (!student)
            return res.status(400).json({ message: "Invalid Student ID or Password" });

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
            { id: student._id, student_id: student.student_id, role: student.role },
            SSAAM_API_KEY,
            { expiresIn: "7d" }
        );

        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await SessionToken.create({
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
        await SessionToken.updateOne(
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
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify JWT token and session
        let decoded;
        try {
            decoded = jwt.verify(token, SSAAM_API_KEY);
            const tokenHash = hashToken(token);
            const sessionToken = await SessionToken.findOne({ 
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

        // Find the student
        const student = await Student.findOne({ student_id });
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
        await Student.updateOne(
            { student_id },
            { custom_password: hashedPassword }
        );

        res.json({ message: "Password changed successfully!" });

    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ message: "Failed to change password. Please try again." });
    }
});

app.post('/apis/masters', auth, timestampAuth, async (req, res) => {
    try {
        const { username, password, admin_creation_secret } = req.body;

        const MASTER_CREATION_SECRET = process.env.MASTER_CREATION_SECRET;
        if (!MASTER_CREATION_SECRET) {
            return res.status(500).json({ message: "Admin creation is not configured on this server" });
        }

        if (!admin_creation_secret || admin_creation_secret !== MASTER_CREATION_SECRET) {
            return res.status(403).json({ message: "Invalid admin creation secret" });
        }

        if (!username || !password)
            return res.status(400).json({ message: "Username and password required" });

        if (username.length < 4 || username.length > 32) {
            return res.status(400).json({ message: "Username must be 4-32 characters" });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
        }

        if (password.length < 12) {
            return res.status(400).json({ message: "Password must be at least 12 characters" });
        }

        const existing = await Master.findOne({ username });
        if (existing)
            return res.status(400).json({ message: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);

        const master = await Master.create({
            username,
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
            { id: master._id, username: master.username, isMaster: true },
            SSAAM_API_KEY,
            { expiresIn: "7d" }
        );

        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await SessionToken.create({
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

app.post('/apis/admin-actions/token', auth, timestampAuth, async (req, res) => {
    try {
        const { admin_key } = req.body;

        if (!ADMIN_ACTION_KEY) {
            return res.status(500).json({ message: "Admin action key is not configured on this server" });
        }

        if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
            return res.status(403).json({ 
                message: `Only the primary admin (${PRIMARY_ADMIN_USERNAME}) can request action tokens`,
                code: 'NOT_PRIMARY_ADMIN'
            });
        }

        if (!admin_key) {
            return res.status(400).json({ message: "Admin key is required" });
        }

        if (!timingSafeCompare(admin_key, ADMIN_ACTION_KEY)) {
            return res.status(403).json({ message: "Invalid admin key" });
        }

        await AdminActionToken.updateMany(
            { admin_id: req.master.id, is_revoked: false },
            { is_revoked: true }
        );

        const actionToken = generateSecureToken();
        const tokenHash = hashToken(actionToken);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await AdminActionToken.create({
            token_hash: tokenHash,
            admin_id: req.master.id,
            admin_username: req.master.username,
            expires_at: expiresAt,
            max_uses: 50
        });

        res.json({
            message: "Admin action token generated successfully",
            action_token: actionToken,
            expires_at: expiresAt,
            expires_in_seconds: 300
        });

    } catch (err) {
        console.error("Admin action token error:", err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/apis/admin-actions/revoke', auth, async (req, res) => {
    try {
        if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
            return res.status(403).json({ message: "Only the primary admin can revoke action tokens" });
        }

        const result = await AdminActionToken.updateMany(
            { admin_id: req.master.id, is_revoked: false },
            { is_revoked: true }
        );

        res.json({ 
            message: "All action tokens revoked",
            revoked_count: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/apis/admin-actions/status', auth, async (req, res) => {
    try {
        if (req.master.username !== PRIMARY_ADMIN_USERNAME) {
            return res.status(403).json({ 
                message: "Only the primary admin can check action token status",
                is_primary_admin: false
            });
        }

        const activeToken = await AdminActionToken.findOne({
            admin_id: req.master.id,
            is_revoked: false,
            expires_at: { $gt: new Date() },
            $expr: { $lt: ['$used_count', '$max_uses'] }
        });

        res.json({
            is_primary_admin: true,
            has_active_token: !!activeToken,
            token_expires_at: activeToken?.expires_at || null,
            uses_remaining: activeToken ? (activeToken.max_uses - activeToken.used_count) : 0
        });
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
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ valid: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, SSAAM_API_KEY);

        const tokenHash = hashToken(token);
        const sessionToken = await SessionToken.findOne({ 
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

app.delete('/apis/students/cleanup-invalid-programs', auth, adminActionAuth, async (req, res) => {
    try {
        const result = await Student.deleteMany({
            program: { $nin: VALID_PROGRAMS }
        });

        res.json({
            message: `Deleted ${result.deletedCount} students with invalid programs`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/apis/settings', studentAuth, async (req, res) => {
    try {
        const settings = await getSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/apis/settings', auth, adminActionAuth, async (req, res) => {
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
        const student = await Student.findOne({ 
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
        const student = await Student.findOne({ student_id, email: resetRecord.email });
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
        const notifications = await Notification.find()
            .select('title message priority image_url posted_by posted_by_id posted_by_name liked_by was_edited created_at updated_at')
            .sort({ created_at: -1 })
            .limit(50)
            .lean();

        const medpubPosterIds = notifications
            .filter(n => n.posted_by === 'medpub' && n.posted_by_id)
            .map(n => n.posted_by_id);

        let posterPhotos = {};
        if (medpubPosterIds.length > 0) {
            const posters = await Student.find({ _id: { $in: medpubPosterIds } })
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
        const sessionToken = await SessionToken.findOneAndUpdate(
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
            const student = await Student.findOne({ student_id: decoded.student_id });
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

            const todayPostCount = await Notification.countDocuments({
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
        const notification = await Notification.create({
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

        const notification = await Notification.findById(req.params.id);

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
        const notification = await Notification.findById(req.params.id);

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
app.post('/apis/notifications/mark-seen', studentAuthWithToken, async (req, res) => {
    try {
        const { notification_ids } = req.body;

        if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
            return res.status(400).json({ message: "notification_ids array is required" });
        }

        const userId = req.user.id || req.user._id;
        const seenRecords = notification_ids.map(notifId => ({
            user_id: userId,
            notification_id: notifId,
            seen_at: new Date()
        }));

        await NotificationSeen.bulkWrite(
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
app.get('/apis/notifications/seen', studentAuthWithToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const seenRecords = await NotificationSeen.find({ user_id: userId })
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

            // Validate session token in database
            const tokenHash = hashToken(token);
            const sessionToken = await SessionToken.findOne({ 
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

        const notification = await Notification.findById(req.params.id);
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

// ==================== ATTENDANCE API ENDPOINTS ====================

async function autoUpdateEventStatuses() {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const completedResult = await AttendanceEvent.updateMany(
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

        if (completedResult.modifiedCount > 0) {
            console.log(`Auto-closed ${completedResult.modifiedCount} past events`);
        }
    } catch (err) {
        console.error('Auto-update event status error:', err.message);
    }
}

setInterval(autoUpdateEventStatuses, 60 * 60 * 1000);

function getEventAutoStatus(eventDate) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const eventDay = new Date(eventDate);

    if (eventDay >= todayStart && eventDay <= todayEnd) {
        return 'active';
    } else if (eventDay > todayEnd) {
        return 'draft';
    } else {
        return 'closed';
    }
}

// Get all attendance events (admin only)
app.get('/apis/attendance/events', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const events = await AttendanceEvent.find(filter)
            .sort({ event_date: -1, created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await AttendanceEvent.countDocuments(filter);

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
        res.status(500).json({ message: err.message });
    }
});

// Get active attendance events (for students)
app.get('/apis/attendance/events/active', studentAuthWithToken, async (req, res) => {
    try {
        const events = await AttendanceEvent.find({ status: 'active' })
            .sort({ event_date: -1 });
        res.json({ data: events });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get upcoming (draft) attendance events (for students)
app.get('/apis/attendance/events/upcoming', studentAuthWithToken, async (req, res) => {
    try {
        const events = await AttendanceEvent.find({ status: 'draft' })
            .sort({ event_date: 1 });
        res.json({ data: events });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single attendance event
app.get('/apis/attendance/events/:id', studentAuth, async (req, res) => {
    try {
        const event = await AttendanceEvent.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create attendance event (admin only)
app.post('/apis/attendance/events', auth, adminActionAuth, async (req, res) => {
    try {
        const { title, description, location, event_date, start_time, end_time, status } = req.body;

        if (!title || !event_date || !start_time || !end_time) {
            return res.status(400).json({ message: "Title, event date, start time, and end time are required" });
        }

        const event = new AttendanceEvent({
            title,
            description: description || "",
            location: location || "",
            event_date: new Date(event_date),
            start_time,
            end_time,
            status: status || 'draft',
            created_by: req.master.id,
            created_by_name: req.master.username,
            activated_at: status === 'active' ? new Date() : null
        });

        const saved = await event.save();
        res.status(201).json({ message: "Event created successfully", event: saved });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update attendance event (admin only)
app.put('/apis/attendance/events/:id', auth, adminActionAuth, async (req, res) => {
    try {
        const { title, description, location, event_date, start_time, end_time, status, check_in_locked, check_out_locked } = req.body;

        const event = await AttendanceEvent.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (title) event.title = title;
        if (description !== undefined) event.description = description;
        if (location !== undefined) event.location = location;
        if (event_date) event.event_date = new Date(event_date);
        if (start_time) event.start_time = start_time;
        if (end_time) event.end_time = end_time;
        if (check_in_locked !== undefined) event.check_in_locked = check_in_locked;
        if (check_out_locked !== undefined) event.check_out_locked = check_out_locked;

        if (status && status !== event.status) {
            event.status = status;
            if (status === 'active' && !event.activated_at) {
                event.activated_at = new Date();
            } else if (status === 'closed') {
                event.closed_at = new Date();
            }
        }

        event.updated_at = new Date();
        const updated = await event.save();

        res.json({ message: "Event updated successfully", event: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete attendance event (admin only)
app.delete('/apis/attendance/events/:id', auth, adminActionAuth, async (req, res) => {
    try {
        const event = await AttendanceEvent.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        await AttendanceLog.deleteMany({ event_id: req.params.id });
        await AttendanceEvent.deleteOne({ _id: req.params.id });

        res.json({ message: "Event and all related attendance logs deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get attendance logs for an event (admin only)
app.get('/apis/attendance/events/:id/logs', auth, async (req, res) => {
    try {
        const { search, yearLevel, program, page = 1, limit = 50 } = req.query;
        const filter = { event_id: req.params.id };
        
        // Get the event to check session type
        const event = await AttendanceEvent.findById(req.params.id);
        const isDualSession = event && event.session_type === 'dual';

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

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Sort based on session type
        const sortField = isDualSession 
            ? { morning_check_in_at: -1, afternoon_check_in_at: -1, created_at: -1 }
            : { check_in_at: -1, created_at: -1 };
            
        const logs = await AttendanceLog.find(filter)
            .sort(sortField)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await AttendanceLog.countDocuments(filter);

        // Stats aggregation based on session type
        let stats;
        if (isDualSession) {
            // Dual session (4-in-a-day) stats
            stats = await AttendanceLog.aggregate([
                { $match: { event_id: new mongoose.Types.ObjectId(req.params.id) } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        // Present: both morning and afternoon complete (with or without late)
                        present: { $sum: { $cond: [{ $and: [
                            { $ne: ["$morning_check_in_at", null] }, 
                            { $ne: ["$morning_check_out_at", null] },
                            { $ne: ["$afternoon_check_in_at", null] }, 
                            { $ne: ["$afternoon_check_out_at", null] },
                            { $eq: ["$is_morning_late", false] },
                            { $eq: ["$is_afternoon_late", false] }
                        ] }, 1, 0] } },
                        // Late: both sessions complete but at least one late
                        late: { $sum: { $cond: [{ $and: [
                            { $ne: ["$morning_check_in_at", null] }, 
                            { $ne: ["$morning_check_out_at", null] },
                            { $ne: ["$afternoon_check_in_at", null] }, 
                            { $ne: ["$afternoon_check_out_at", null] },
                            { $or: [{ $eq: ["$is_morning_late", true] }, { $eq: ["$is_afternoon_late", true] }] }
                        ] }, 1, 0] } },
                        // Partial: one session complete, other not
                        partial: { $sum: { $cond: [{ $or: [
                            { $and: [
                                { $ne: ["$morning_check_in_at", null] }, 
                                { $ne: ["$morning_check_out_at", null] },
                                { $or: [{ $eq: ["$afternoon_check_in_at", null] }, { $eq: ["$afternoon_check_out_at", null] }] }
                            ] },
                            { $and: [
                                { $ne: ["$afternoon_check_in_at", null] }, 
                                { $ne: ["$afternoon_check_out_at", null] },
                                { $or: [{ $eq: ["$morning_check_in_at", null] }, { $eq: ["$morning_check_out_at", null] }] }
                            ] }
                        ] }, 1, 0] } },
                        // Incomplete: checked in but not out in any session
                        incomplete: { $sum: { $cond: [{ $or: [
                            { $and: [{ $ne: ["$morning_check_in_at", null] }, { $eq: ["$morning_check_out_at", null] }] },
                            { $and: [{ $ne: ["$afternoon_check_in_at", null] }, { $eq: ["$afternoon_check_out_at", null] }] }
                        ] }, 1, 0] } }
                    }
                }
            ]);
        } else {
            // Single session (2-in-a-day) stats
            stats = await AttendanceLog.aggregate([
                { $match: { event_id: new mongoose.Types.ObjectId(req.params.id) } },
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
        }

        res.json({
            data: logs,
            stats: stats[0] || { total: 0, present: 0, late: 0, incomplete: 0, partial: 0 },
            session_type: isDualSession ? 'dual' : 'single',
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

// RFID Check-in/Check-out endpoint with 5-minute duplicate prevention
const DUPLICATE_PREVENTION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

app.post('/apis/attendance/events/:id/check', auth, async (req, res) => {
    try {
        const { rfid_code, student_id, identifier_type = 'rfid', source = 'rfid' } = req.body;

        // Support both RFID and Student ID for manual entry
        const identifier = rfid_code || student_id;
        const isManualStudentId = identifier_type === 'student_id' || (!rfid_code && student_id);

        if (!identifier) {
            return res.status(400).json({ message: isManualStudentId ? "Student ID is required" : "RFID code is required" });
        }

        // Get global RFID scanner settings
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        const rfidSettings = settings.rfidScanner || { checkInEnabled: true, checkOutEnabled: true };

        // Check if auto-disable timers have expired
        const now = new Date();
        let settingsChanged = false;

        if (rfidSettings.autoDisableCheckIn && rfidSettings.checkInDisableAt) {
            const disableAt = new Date(rfidSettings.checkInDisableAt);
            if (now >= disableAt) {
                rfidSettings.checkInEnabled = false;
                rfidSettings.autoDisableCheckIn = false;
                rfidSettings.checkInDisableAt = null;
                settingsChanged = true;
            }
        }

        if (rfidSettings.autoDisableCheckOut && rfidSettings.checkOutDisableAt) {
            const disableAt = new Date(rfidSettings.checkOutDisableAt);
            if (now >= disableAt) {
                rfidSettings.checkOutEnabled = false;
                rfidSettings.autoDisableCheckOut = false;
                rfidSettings.checkOutDisableAt = null;
                settingsChanged = true;
            }
        }

        // Save settings if timers expired
        if (settingsChanged) {
            settings.rfidScanner = rfidSettings;
            await settings.save();
        }

        const event = await AttendanceEvent.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.status !== 'active') {
            return res.status(400).json({ message: "Event is not active" });
        }

        // Find student by either RFID code or Student ID
        let student;
        if (isManualStudentId) {
            // Manual entry by Student ID - allow students without RFID
            student = await Student.findOne({ 
                student_id: identifier.trim().toUpperCase(),
                status: 'approved'
            });
            if (!student) {
                return res.status(404).json({ message: "No approved student found with this Student ID" });
            }
        } else {
            // RFID scan - require verified RFID
            student = await Student.findOne({ 
                rfid_code: identifier.trim(),
                rfid_status: 'verified',
                status: 'approved'
            });
            if (!student) {
                return res.status(404).json({ message: "No verified student found with this RFID code" });
            }
        }

        // Check if student was registered before or on the event activation date
        // Only apply this check if the event has an activated_at timestamp
        if (event.activated_at) {
            const eventActivatedDate = new Date(event.activated_at);
            eventActivatedDate.setHours(23, 59, 59, 999); // End of the activation day

            const studentCreatedDate = new Date(student.created_date);

            if (studentCreatedDate > eventActivatedDate) {
                return res.status(403).json({ 
                    message: "Student was registered after this attendance event was activated. Only students registered before or on the event activation day can check in.",
                    student_name: `${student.first_name} ${student.last_name}`,
                    student_registered: student.created_date,
                    event_activated: event.activated_at
                });
            }
        }

        let log = await AttendanceLog.findOne({
            event_id: req.params.id,
            student_id: student._id
        });

        let action = '';
        const studentFullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.replace(/\s+/g, ' ').trim();
        
        // Helper function to check if we're in afternoon based on event settings
        const isAfternoonSession = () => {
            if (event.session_type !== 'dual') return false;
            const afternoonTime = event.afternoon_start_time || '13:00';
            const [afternoonHour, afternoonMinute] = afternoonTime.split(':').map(Number);
            
            // Get current time in Philippine timezone (UTC+8)
            const nowPH = new Date(now.getTime() + (8 * 60 * 60 * 1000));
            const currentHour = nowPH.getUTCHours();
            const currentMinute = nowPH.getUTCMinutes();
            
            return currentHour > afternoonHour || (currentHour === afternoonHour && currentMinute >= afternoonMinute);
        };
        
        // Helper function to calculate if late (uses configurable late threshold)
        // lateThresholdMinutes: minutes after start time before marking as late (default 30)
        // Uses nullish coalescing to allow 0 as a valid value (no grace period)
        const lateThreshold = rfidSettings.lateThresholdMinutes !== undefined && rfidSettings.lateThresholdMinutes !== null 
            ? rfidSettings.lateThresholdMinutes 
            : 30;
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
            // Add late threshold (grace period) to the start time
            const lateThresholdUTC = new Date(eventStartUTC.getTime() + (lateThreshold * 60 * 1000));
            return now > lateThresholdUTC;
        };

        // Dual session mode (4-in-a-day: morning check-in/out, afternoon check-in/out)
        if (event.session_type === 'dual') {
            const isAfternoon = isAfternoonSession();
            
            if (!log) {
                // First scan - create new log
                const checkInField = isAfternoon ? 'afternoon_check_in_at' : 'morning_check_in_at';
                const lateField = isAfternoon ? 'is_afternoon_late' : 'is_morning_late';
                const lockCheck = isAfternoon ? event.afternoon_check_in_locked : event.morning_check_in_locked;
                
                if (lockCheck || !rfidSettings.checkInEnabled) {
                    return res.status(403).json({ 
                        message: `${isAfternoon ? 'Afternoon' : 'Morning'} check-in is currently disabled.`,
                        student_name: studentFullName,
                        locked: 'check_in'
                    });
                }
                
                const startTime = isAfternoon ? event.afternoon_start_time : event.start_time;
                const isLate = calculateIsLate(startTime);
                
                log = new AttendanceLog({
                    event_id: req.params.id,
                    student_id: student._id,
                    student_id_number: student.student_id,
                    rfid_code: student.rfid_code || '',
                    student_name: studentFullName,
                    program: student.program,
                    year_level: student.year_level,
                    [checkInField]: now,
                    [lateField]: isLate,
                    source,
                    input_method: isManualStudentId ? 'manual_student_id' : 'rfid'
                });
                action = isAfternoon ? 'afternoon_check_in' : 'morning_check_in';
            } else {
                // Existing log - determine next action
                if (isAfternoon) {
                    // Afternoon session logic
                    if (!log.afternoon_check_in_at) {
                        // Afternoon check-in
                        if (event.afternoon_check_in_locked || !rfidSettings.checkInEnabled) {
                            return res.status(403).json({ 
                                message: "Afternoon check-in is currently disabled.",
                                student_name: log.student_name,
                                locked: 'check_in'
                            });
                        }
                        log.afternoon_check_in_at = now;
                        log.is_afternoon_late = calculateIsLate(event.afternoon_start_time);
                        action = 'afternoon_check_in';
                    } else if (!log.afternoon_check_out_at) {
                        // Afternoon check-out
                        if (event.afternoon_check_out_locked || !rfidSettings.checkOutEnabled) {
                            return res.status(403).json({ 
                                message: "Afternoon check-out is currently disabled.",
                                student_name: log.student_name,
                                locked: 'check_out'
                            });
                        }
                        const timeSinceCheckIn = now - new Date(log.afternoon_check_in_at);
                        if (timeSinceCheckIn < DUPLICATE_PREVENTION_MS) {
                            const remainingSeconds = Math.ceil((DUPLICATE_PREVENTION_MS - timeSinceCheckIn) / 1000);
                            return res.status(200).json({ 
                                message: `Already checked in! Wait ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s before checking out.`,
                                action: 'already_checked_in',
                                success: true,
                                student_name: log.student_name,
                                cooldown_remaining: remainingSeconds
                            });
                        }
                        log.afternoon_check_out_at = now;
                        action = 'afternoon_check_out';
                    } else {
                        return res.status(400).json({ 
                            message: "Student already completed afternoon attendance",
                            student_name: log.student_name
                        });
                    }
                } else {
                    // Morning session logic
                    if (!log.morning_check_in_at) {
                        // Morning check-in
                        if (event.morning_check_in_locked || !rfidSettings.checkInEnabled) {
                            return res.status(403).json({ 
                                message: "Morning check-in is currently disabled.",
                                student_name: log.student_name,
                                locked: 'check_in'
                            });
                        }
                        log.morning_check_in_at = now;
                        log.is_morning_late = calculateIsLate(event.start_time);
                        action = 'morning_check_in';
                    } else if (!log.morning_check_out_at) {
                        // Morning check-out
                        if (event.morning_check_out_locked || !rfidSettings.checkOutEnabled) {
                            return res.status(403).json({ 
                                message: "Morning check-out is currently disabled.",
                                student_name: log.student_name,
                                locked: 'check_out'
                            });
                        }
                        const timeSinceCheckIn = now - new Date(log.morning_check_in_at);
                        if (timeSinceCheckIn < DUPLICATE_PREVENTION_MS) {
                            const remainingSeconds = Math.ceil((DUPLICATE_PREVENTION_MS - timeSinceCheckIn) / 1000);
                            return res.status(200).json({ 
                                message: `Already checked in! Wait ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s before checking out.`,
                                action: 'already_checked_in',
                                success: true,
                                student_name: log.student_name,
                                cooldown_remaining: remainingSeconds
                            });
                        }
                        log.morning_check_out_at = now;
                        action = 'morning_check_out';
                    } else {
                        return res.status(400).json({ 
                            message: "Morning session complete. Afternoon session starts at " + (event.afternoon_start_time || '13:00'),
                            student_name: log.student_name
                        });
                    }
                }
                log.updated_at = now;
            }
        } else {
            // Single session mode (2-in-a-day: check-in/out)
            if (!log) {
                // Check if check-in is enabled globally
                if (!rfidSettings.checkInEnabled) {
                    return res.status(403).json({ 
                        message: "Check-in is currently disabled. Please wait for the admin to enable it.",
                        student_name: studentFullName,
                        locked: 'check_in'
                    });
                }
                
                const isLate = calculateIsLate(event.start_time);
                
                log = new AttendanceLog({
                    event_id: req.params.id,
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
                // Check if check-out is enabled globally
                if (!rfidSettings.checkOutEnabled) {
                    return res.status(403).json({ 
                        message: "Check-out is currently disabled. Student is already checked in.",
                        student_name: log.student_name,
                        check_in_at: log.check_in_at,
                        locked: 'check_out'
                    });
                }
                const timeSinceCheckIn = now - new Date(log.check_in_at);
                if (timeSinceCheckIn < DUPLICATE_PREVENTION_MS) {
                    const remainingSeconds = Math.ceil((DUPLICATE_PREVENTION_MS - timeSinceCheckIn) / 1000);
                    const remainingMinutes = Math.floor(remainingSeconds / 60);
                    const remainingSecs = remainingSeconds % 60;
                    return res.status(200).json({ 
                        message: `Already checked in! Wait ${remainingMinutes}m ${remainingSecs}s before checking out.`,
                        action: 'already_checked_in',
                        success: true,
                        student_name: log.student_name,
                        check_in_at: log.check_in_at,
                        cooldown_remaining: remainingSeconds,
                        note: 'This prevents accidental immediate check-outs. Student is already marked as checked in.'
                    });
                }
                log.check_out_at = now;
                log.updated_at = now;
                action = 'check_out';
            } else {
                // Prevent duplicate scan after already checked in and out
                const timeSinceCheckOut = now - new Date(log.check_out_at);
                if (timeSinceCheckOut < DUPLICATE_PREVENTION_MS) {
                    const remainingSeconds = Math.ceil((DUPLICATE_PREVENTION_MS - timeSinceCheckOut) / 1000);
                    return res.status(429).json({ 
                        message: `Already checked in and out. Please wait before scanning again.`,
                        student_name: log.student_name,
                        check_in_at: log.check_in_at,
                        check_out_at: log.check_out_at,
                        cooldown_remaining: remainingSeconds
                    });
                }
                return res.status(400).json({ 
                    message: "Student already checked in and out for this event",
                    student_name: log.student_name,
                    check_in_at: log.check_in_at,
                    check_out_at: log.check_out_at
                });
            }
        }

        await log.save();
        
        // Determine message based on action
        let message = '';
        const lateStatus = log.is_late || log.is_morning_late || log.is_afternoon_late;
        if (action.includes('check_in')) {
            message = lateStatus ? `${action.replace('_', ' ').replace('check in', 'Check-in')} successful (Late)` : `${action.replace('_', ' ').replace('check in', 'Check-in')} successful`;
        } else {
            message = `${action.replace('_', ' ').replace('check out', 'Check-out')} successful`;
        }

        res.json({
            message,
            action,
            is_late: lateStatus,
            session_type: event.session_type,
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
        res.status(500).json({ message: err.message });
    }
});

// Get student's own attendance records
app.get('/apis/attendance/my-records', studentAuthWithToken, async (req, res) => {
    try {
        // Use the hydrated student object from studentAuthWithToken middleware
        const student = req.student;
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const studentCreatedDate = new Date(student.created_date);

        const events = await AttendanceEvent.find({ 
            status: { $in: ['active', 'closed'] },
            $or: [
                { status: 'active' },
                { 
                    status: 'closed',
                    $or: [
                        { activated_at: { $gte: studentCreatedDate } },
                        { closed_at: { $gte: studentCreatedDate } }
                    ]
                }
            ]
        }).sort({ event_date: -1 });

        const records = await Promise.all(events.map(async (event) => {
            const eventActivatedDate = event.activated_at ? new Date(event.activated_at) : null;

            if (event.status === 'closed' && eventActivatedDate) {
                const eventEndOfDay = new Date(eventActivatedDate);
                eventEndOfDay.setHours(23, 59, 59, 999);

                if (studentCreatedDate > eventEndOfDay) {
                    return null;
                }
            }

            const log = await AttendanceLog.findOne({
                event_id: event._id,
                student_id: student._id
            });

            let status = 'absent';
            let checkInTime = null;
            let checkOutTime = null;
            
            if (log) {
                // Check for session-specific fields first, then legacy fields
                const hasMorningSession = log.morning_check_in_at || log.morning_check_out_at;
                const hasAfternoonSession = log.afternoon_check_in_at || log.afternoon_check_out_at;
                
                if (hasMorningSession || hasAfternoonSession) {
                    // Dual session mode - get earliest check-in and latest check-out
                    checkInTime = log.morning_check_in_at || log.afternoon_check_in_at;
                    checkOutTime = log.afternoon_check_out_at || log.morning_check_out_at;
                    
                    const morningComplete = log.morning_check_in_at && log.morning_check_out_at;
                    const afternoonComplete = log.afternoon_check_in_at && log.afternoon_check_out_at;
                    
                    if (morningComplete && afternoonComplete) {
                        status = (log.is_morning_late || log.is_afternoon_late) ? 'late' : 'present';
                    } else if (morningComplete || afternoonComplete || log.morning_check_in_at || log.afternoon_check_in_at) {
                        status = 'incomplete';
                    }
                } else {
                    // Legacy single session mode
                    checkInTime = log.check_in_at;
                    checkOutTime = log.check_out_at;
                    
                    if (log.check_in_at && log.check_out_at) {
                        status = log.is_late ? 'late' : 'present';
                    } else if (log.check_in_at) {
                        status = 'incomplete';
                    }
                }
            }

            if (event.status === 'closed' && !log) {
                return null;
            }

            return {
                event: {
                    _id: event._id,
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    event_date: event.event_date,
                    start_time: event.start_time,
                    end_time: event.end_time,
                    status: event.status
                },
                attendance: log ? {
                    check_in_at: checkInTime,
                    check_out_at: checkOutTime,
                    morning_check_in_at: log.morning_check_in_at,
                    morning_check_out_at: log.morning_check_out_at,
                    afternoon_check_in_at: log.afternoon_check_in_at,
                    afternoon_check_out_at: log.afternoon_check_out_at,
                    is_late: log.is_late || log.is_morning_late || log.is_afternoon_late,
                    status
                } : {
                    check_in_at: null,
                    check_out_at: null,
                    status: 'absent'
                }
            };
        }));

        const filteredRecords = records.filter(r => r !== null);

        res.json({ data: filteredRecords });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default app;