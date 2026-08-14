// ============================================================
// CRYPTO UTILITIES - Token generation, hashing, encryption
// ============================================================

import crypto from 'crypto';

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code (e.g., "123456")
 */
export function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a cryptographically secure random token
 * @returns {string} 64-character hex string
 */
export function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} SHA-256 hash in hex format
 */
export function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Timing-safe comparison of two strings to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings match
 */
export function timingSafeCompare(a, b) {
    if (!a || !b || a.length !== b.length) {
        const dummy = crypto.randomBytes(32).toString('hex');
        crypto.timingSafeEqual(Buffer.from(dummy), Buffer.from(dummy));
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Decode a timestamp that was encrypted with XOR and base64
 * Used to validate request timestamps
 * @param {string} encodedString - Base64-encoded XOR-encrypted timestamp
 * @param {string} key - Decryption key
 * @returns {string|null} Decoded timestamp ISO string or null if invalid
 */
export function decodeTimestampWithKey(encodedString, key) {
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

/**
 * Encode a timestamp using XOR and base64
 * Used to create signed timestamps in requests
 * @param {Date} date - Date to encode
 * @param {string} key - Encryption key
 * @returns {string} Base64-encoded XOR-encrypted timestamp
 */
export function encodeTimestampWithKey(date, key) {
    const timestamp = date.toISOString();
    let encoded = '';
    for (let i = 0; i < timestamp.length; i++) {
        const charCode = timestamp.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encoded += String.fromCharCode(charCode);
    }
    return Buffer.from(encoded, 'binary').toString('base64');
}

/**
 * Try to decode a timestamp using multiple keys
 * Falls back through a list of known crypto keys
 * @param {string} encodedString - Base64-encoded XOR-encrypted timestamp
 * @param {string} primaryKey - Primary decryption key to try first
 * @param {string[]} fallbackKeys - Additional keys to try if primary fails
 * @returns {string|null} Decoded timestamp ISO string or null if all attempts fail
 */
export function decodeTimestamp(encodedString, primaryKey, fallbackKeys = []) {
    const keysToTry = [primaryKey, ...fallbackKeys.filter(k => k !== primaryKey)];
    
    for (const key of keysToTry) {
        if (!key) continue;
        const ts = decodeTimestampWithKey(encodedString, key);
        if (ts && !isNaN(new Date(ts).getTime())) {
            return ts;
        }
    }
    return null;
}

/**
 * Validate that an encoded timestamp is within acceptable age
 * @param {string} encodedString - Base64-encoded XOR-encrypted timestamp
 * @param {string} key - Decryption key
 * @param {number} maxAgeMinutes - Maximum age in minutes (default 30)
 * @returns {boolean} True if timestamp is valid and within age limit
 */
export function isValidTimestamp(encodedString, key, maxAgeMinutes = 30) {
    const timestamp = decodeTimestampWithKey(encodedString, key);
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
