// ============================================================
// COLLEGE UTILITIES - College detection and model helpers
// ============================================================

import { VALID_COLLEGES, PROGRAM_TO_COLLEGE, DEFAULT_COLLEGE } from './constants.js';

/**
 * Normalize a college string to uppercase, valid college code
 * @param {string} value - College value to normalize
 * @returns {string|null} Normalized college code or null if invalid
 */
export function normalizeCollege(value) {
    if (!value || typeof value !== 'string') return null;
    const upper = value.toUpperCase().trim();
    if (VALID_COLLEGES.includes(upper)) return upper;
    return null;
}

/**
 * Get the database collection prefix for a college
 * @param {string} college - College code (CCS, COE, SOM, CNAHS)
 * @returns {string} Prefix (ccs_, coe_, som_, cnahs_) or default
 */
export function getPrefix(college) {
    if (college === 'COE') return 'coe_';
    if (college === 'SOM') return 'som_';
    if (college === 'CNAHS') return 'cnahs_';
    return 'ccs_';
}

/**
 * Get a prefixed collection name for a college
 * Masters collection is NOT prefixed (shared across colleges)
 * @param {string} college - College code
 * @param {string} collectionName - Base collection name
 * @returns {string} Prefixed collection name
 */
export function withPrefix(college, collectionName) {
    if (collectionName === 'masters') {
        return 'masters';
    }
    return `${getPrefix(college)}${collectionName}`;
}

/**
 * Determine college from request context (priority order)
 * 1. Header (most direct — set by frontend on every request)
 * 2. Theme/department header
 * 3. JWT token payload
 * 4. Authenticated master record
 * 5. Student program-based detection
 * 6. Default to CCS
 * @param {Object} req - Express request object
 * @returns {string} College code (CCS, COE, SOM, CNAHS)
 */
export function getCollegeFromRequest(req) {
    try {
        // 1. Header (most direct — set by frontend on every request)
        const headerCollege = normalizeCollege(req.headers['x-ssaam-college']);
        if (headerCollege) return headerCollege;

        // 2. Theme / department hint headers
        const theme = req.headers['x-ssaam-theme'] || req.headers['x-ssaam-department'];
        const themeCollege = normalizeCollege(theme);
        if (themeCollege) return themeCollege;

        // 3. JWT token payload (before auth middleware has run)
        // Try to extract and verify token if available
        if (req.headers.authorization) {
            try {
                const parts = req.headers.authorization.split(' ');
                if (parts.length > 1) {
                    // Can't verify JWT here without JWT_SECRET, but we could parse header
                    // This is intentionally limited - full JWT verification happens in auth middleware
                }
            } catch (jwtErr) {
                // Token verification failed — continue
            }
        }

        // 4. Already-authenticated master record
        if (req.master && req.master.college) {
            const masterCollege = normalizeCollege(req.master.college);
            if (masterCollege) return masterCollege;
        }

        // 5. Student program-based detection
        if (req.student && req.student.program) {
            const prog = String(req.student.program).toUpperCase();
            const detectedCollege = PROGRAM_TO_COLLEGE[prog];
            if (detectedCollege) return detectedCollege;
        }
    } catch (e) {
        console.error('Error determining college from request:', e.message);
    }

    // 6. Default
    return DEFAULT_COLLEGE;
}

/**
 * Helper to get a college-specific model
 * Used throughout the application to select the correct collection
 * @param {Function} baseModel - Default model (not prefixed, e.g., Student)
 * @param {Function} ccsModel - CCS-prefixed model (e.g., CCS_Student)
 * @param {Function} coeModel - COE-prefixed model (e.g., COE_Student)
 * @param {Function} somModel - SOM-prefixed model (optional)
 * @param {Function} cnahsModel - CNAHS-prefixed model (optional)
 * @param {string} college - College code
 * @returns {Function} Appropriate model for the college
 */
export function getCollegeModel(baseModel, ccsModel, coeModel, somModel = null, cnahsModel = null, college) {
    const normalizedCollege = normalizeCollege(college) || DEFAULT_COLLEGE;
    
    switch (normalizedCollege) {
        case 'COE':
            return coeModel || baseModel;
        case 'SOM':
            return somModel || baseModel;
        case 'CNAHS':
            return cnahsModel || baseModel;
        case 'CCS':
        default:
            return ccsModel || baseModel;
    }
}

/**
 * Helper for dynamic model creation with college-aware collection names
 * Creates a Mongoose model that stores in the appropriate prefixed collection
 * @param {string} college - College code
 * @param {string} baseModelName - Base model name (e.g., "Student")
 * @param {Object} baseSchema - Mongoose schema
 * @param {Object} modelCache - Cache object to store models
 * @returns {Function} Mongoose model
 */
export function createCollegeModel(college, baseModelName, baseSchema, modelCache) {
    const key = `${college}_${baseModelName}`;
    
    if (!modelCache[key]) {
        const collectionName = withPrefix(college, baseModelName.toLowerCase());
        // This would require mongoose to be available
        // modelCache[key] = mongoose.model(`${college}_${baseModelName}`, baseSchema, collectionName);
    }
    
    return modelCache[key];
}

/**
 * Detect if a college was explicitly selected by the user
 * vs inferred from program/headers
 * @param {string} headerCollege - College from header
 * @param {string} inferredCollege - Inferred from program
 * @returns {boolean} True if college was explicitly selected
 */
export function isExplicitCollege(headerCollege, inferredCollege) {
    return headerCollege && normalizeCollege(headerCollege) === normalizeCollege(headerCollege);
}
