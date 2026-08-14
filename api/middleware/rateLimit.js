// ============================================================
// RATE LIMITING MIDDLEWARE
// ============================================================

import mongoose from 'mongoose';
import {
    LOGIN_MAX_ATTEMPTS,
    LOGIN_WINDOW_MS,
    LOGIN_LOCKOUT_MS,
    VERIFICATION_CODE_MAX_ATTEMPTS,
    VERIFICATION_CODE_WINDOW_MS,
    VERIFICATION_CODE_MIN_INTERVAL_MS,
    REGISTRATION_COOLDOWN_MS,
    BOT_PATTERNS
} from '../utils/constants.js';

/**
 * MongoDB-backed Rate Limit model (persists across restarts)
 * Tracks failed login attempts, verification codes, and registration attempts
 */
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

/**
 * Extract client IP address from request headers
 * Respects X-Forwarded-For and X-Real-IP headers (for proxies)
 * @param {Object} req - Express request
 * @returns {string} Client IP address
 */
export function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';
}

/**
 * Check if a login attempt key is rate-limited
 * @param {string} key - Unique identifier for the login (e.g., IP or "IP:username")
 * @returns {Promise<Object>} {blocked: boolean, remainingMins?: number}
 */
export async function loginCheck(key) {
    try {
        const now = Date.now();
        const doc = await RateLimit.findOne({ key, type: 'login' }).lean();
        
        if (!doc) {
            return { blocked: false };
        }
        
        if (doc.lockedUntil && now < doc.lockedUntil.getTime()) {
            return {
                blocked: true,
                remainingMins: Math.ceil((doc.lockedUntil.getTime() - now) / 60000)
            };
        }
        
        // Window expired — reset
        if (now - doc.firstAttempt.getTime() > LOGIN_WINDOW_MS) {
            await RateLimit.deleteOne({ key, type: 'login' });
        }
        
        return { blocked: false };
    } catch (err) {
        console.error('[RateLimit] loginCheck DB error:', err.message);
        return { blocked: false }; // fail open — never block legit users on DB error
    }
}

/**
 * Record a login attempt (success or failure)
 * On failure: increments counter and locks if max attempts reached
 * On success: clears the counter
 * @param {string} key - Unique identifier for the login
 * @param {boolean} success - Whether login was successful
 */
export async function loginRecord(key, success) {
    try {
        if (success) {
            await RateLimit.deleteOne({ key, type: 'login' });
            return;
        }
        
        const now = new Date();
        const expireAt = new Date(Date.now() + LOGIN_WINDOW_MS + LOGIN_LOCKOUT_MS);
        
        const doc = await RateLimit.findOneAndUpdate(
            { key, type: 'login' },
            {
                $inc: { count: 1 },
                $setOnInsert: { firstAttempt: now },
                $set: { lastAttempt: now, expireAt }
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        
        if (doc.count >= LOGIN_MAX_ATTEMPTS) {
            await RateLimit.updateOne(
                { key, type: 'login' },
                { $set: { lockedUntil: new Date(Date.now() + LOGIN_LOCKOUT_MS) } }
            );
        }
    } catch (err) {
        console.error('[RateLimit] loginRecord DB error:', err.message);
    }
}

/**
 * Verification code rate limiter object
 * Tracks email-based requests for verification codes
 */
export const verificationCodeRateLimiter = {
    MAX_ATTEMPTS: VERIFICATION_CODE_MAX_ATTEMPTS,
    WINDOW_MS: VERIFICATION_CODE_WINDOW_MS,
    MIN_INTERVAL_MS: VERIFICATION_CODE_MIN_INTERVAL_MS,

    async checkAndRecord(email) {
        const now = Date.now();
        const key = email.toLowerCase().trim();
        const expireAt = new Date(now + this.WINDOW_MS);
        
        try {
            const doc = await RateLimit.findOne({ key, type: 'verif' }).lean();

            if (!doc || (now - doc.firstAttempt.getTime() > this.WINDOW_MS)) {
                await RateLimit.findOneAndUpdate(
                    { key, type: 'verif' },
                    {
                        $set: {
                            count: 1,
                            firstAttempt: new Date(now),
                            lastAttempt: new Date(now),
                            expireAt,
                            lockedUntil: null
                        }
                    },
                    { upsert: true }
                );
                return { allowed: true, attemptsRemaining: this.MAX_ATTEMPTS - 1 };
            }

            const timeSinceLastAttempt = now - doc.lastAttempt.getTime();
            if (timeSinceLastAttempt < this.MIN_INTERVAL_MS) {
                const waitSeconds = Math.ceil((this.MIN_INTERVAL_MS - timeSinceLastAttempt) / 1000);
                return {
                    allowed: false,
                    waitSeconds,
                    message: `Please wait ${waitSeconds} seconds before requesting another code.`
                };
            }

            if (doc.count >= this.MAX_ATTEMPTS) {
                const waitMinutes = Math.ceil((this.WINDOW_MS - (now - doc.firstAttempt.getTime())) / 60000);
                return {
                    allowed: false,
                    waitMinutes,
                    message: `Maximum resend attempts reached. Please wait ${waitMinutes} minutes before trying again.`
                };
            }

            await RateLimit.updateOne(
                { key, type: 'verif' },
                { $inc: { count: 1 }, $set: { lastAttempt: new Date(now), expireAt } }
            );
            
            return {
                allowed: true,
                attemptsRemaining: this.MAX_ATTEMPTS - (doc.count + 1)
            };
        } catch (err) {
            console.error('[RateLimit] verif checkAndRecord error:', err.message);
            return { allowed: true, attemptsRemaining: this.MAX_ATTEMPTS - 1 }; // fail open
        }
    },

    async reset(email) {
        try {
            await RateLimit.deleteOne({
                key: email.toLowerCase().trim(),
                type: 'verif'
            });
        } catch (err) {
            console.error('[RateLimit] verif reset error:', err.message);
        }
    }
};

/**
 * Anti-bot protection middleware
 * Checks user agent and rate limits registration by IP + student_id
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
export async function antiBotProtection(req, res, next) {
    const userAgent = req.headers['user-agent'];
    
    if (!userAgent || userAgent.length < 10) {
        return res.status(403).json({ message: "Forbidden: Invalid request source" });
    }

    if (BOT_PATTERNS.test(userAgent)) {
        return res.status(403).json({ message: "Forbidden: Automated requests not allowed" });
    }

    const clientIP = getClientIP(req);
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
            {
                $set: {
                    lastAttempt: new Date(now),
                    count: 1,
                    firstAttempt: new Date(now),
                    expireAt: new Date(now + REGISTRATION_COOLDOWN_MS * 2)
                }
            },
            { upsert: true }
        );
    } catch (err) {
        console.error('[RateLimit] antiBotProtection DB error:', err.message);
        // fail open — never block legitimate users due to DB errors
    }

    next();
}

export { RateLimit };
