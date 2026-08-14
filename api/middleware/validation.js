// ============================================================
// VALIDATION MIDDLEWARE - Timestamp validation, input validation
// ============================================================

import { isValidTimestamp, decodeTimestampWithKey } from '../utils/crypto.js';

/**
 * Timestamp authentication middleware
 * Verifies that requests include a valid, recent timestamp
 * Used to prevent replay attacks and validate request timing
 * @param {string} cryptoKey - The crypto key for timestamp decryption
 * @param {number} maxAgeMinutes - Maximum age of timestamp in minutes (default 30)
 * @returns {Function} Express middleware
 */
export function timestampAuth(cryptoKey, maxAgeMinutes = 30) {
    return (req, res, next) => {
        const ssaamTs = req.body?._ssaam_access_token 
            || req.query?._ssaam_access_token 
            || req.headers['x-ssaam-ts'];

        if (!ssaamTs) {
            return res.status(401).json({ message: "Unauthorized: Missing timestamp" });
        }

        if (!isValidTimestamp(ssaamTs, cryptoKey, maxAgeMinutes)) {
            return res.status(401).json({ message: "Unauthorized: Invalid or expired timestamp" });
        }

        // Remove the token from body if it was there (clean up)
        if (req.body?._ssaam_access_token) {
            delete req.body._ssaam_access_token;
        }

        next();
    };
}

/**
 * Validate and parse timestamp from request
 * Useful for logging and audit trails
 * @param {string} encodedTs - Encoded timestamp string
 * @param {string} cryptoKey - Crypto key for decryption
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseTimestamp(encodedTs, cryptoKey) {
    try {
        const decoded = decodeTimestampWithKey(encodedTs, cryptoKey);
        if (!decoded) return null;
        
        const date = new Date(decoded);
        if (isNaN(date.getTime())) return null;
        
        return date;
    } catch (e) {
        return null;
    }
}
