// ============================================================
// VALIDATORS - Input validation functions
// ============================================================

import {
    UPPERCASE_ONLY_REGEX,
    VALID_SUFFIXES,
    VALID_SEMESTERS,
    VALID_YEAR_LEVELS,
} from './constants.js';

/**
 * Validate a name field (must be uppercase letters only)
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {{valid: boolean, value?: string, message?: string}}
 */
export function validateName(name, fieldName) {
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

/**
 * Validate a name suffix (Jr., Sr., I, II, III, etc.)
 * @param {string} suffix - Suffix to validate
 * @returns {{valid: boolean, value?: string, message?: string}}
 */
export function validateSuffix(suffix) {
    if (!suffix || suffix === "") {
        return { valid: true, value: "" };
    }

    if (!VALID_SUFFIXES.includes(suffix)) {
        return {
            valid: false,
            message: `Invalid suffix. Allowed: ${VALID_SUFFIXES.filter(s => s).join(', ')}`
        };
    }

    return { valid: true, value: suffix };
}

/**
 * Validate a semester value
 * @param {string} semester - Semester to validate
 * @returns {{valid: boolean, value?: string, message?: string}}
 */
export function validateSemester(semester) {
    if (!VALID_SEMESTERS.includes(semester)) {
        return {
            valid: false,
            message: `Semester must be one of: ${VALID_SEMESTERS.join(', ')}`
        };
    }
    return { valid: true, value: semester };
}

/**
 * Validate a year level value
 * @param {string} yearLevel - Year level to validate
 * @returns {{valid: boolean, value?: string, message?: string}}
 */
export function validateYearLevel(yearLevel) {
    if (!VALID_YEAR_LEVELS.includes(yearLevel)) {
        return {
            valid: false,
            message: `Year level must be one of: ${VALID_YEAR_LEVELS.join(', ')}`
        };
    }
    return { valid: true, value: yearLevel };
}

/**
 * Escape special regex characters in a string
 * Used to safely search MongoDB with user input
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for regex
 */
export function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize HTML/special characters to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHtml(str) {
    if (!str) return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Normalize ARMS semester format to SSAAM canonical format
 * ARMS returns raw values like '1st', '2nd', '1st Semester', etc.
 * @param {string} rawSemester - Raw semester value from ARMS or user input
 * @returns {string|null} Normalized semester ('1st Sem', '2nd Sem') or null
 */
export function normalizeARMSSemester(rawSemester) {
    if (!rawSemester) return null;

    const raw = String(rawSemester).trim();
    
    // Check for 2nd semester variants
    if (raw.startsWith('2') || raw.toLowerCase().includes('second')) {
        return '2nd Sem';
    }

    // Check for 1st semester variants
    if (raw.startsWith('1') || raw.toLowerCase().includes('first')) {
        return '1st Sem';
    }

    // Already in canonical format
    if (VALID_SEMESTERS.includes(raw)) {
        return raw;
    }

    return null;
}

/**
 * Normalize ARMS year level to SSAAM canonical format
 * Handles various ARMS formats: '1', '1ST', '1ST YR', '1st Year', etc.
 * @param {string} rawYearLevel - Raw year level value from ARMS
 * @param {Object} yearLevelMap - Optional custom mapping (defaults to ARMS_YEAR_LEVEL_MAP)
 * @returns {string|null} Normalized year level or null if unrecognized
 */
export function normalizeARMSYearLevel(rawYearLevel, yearLevelMap = {}) {
    if (!rawYearLevel) return null;

    const raw = String(rawYearLevel).trim().toUpperCase();

    // Primary lookup: exact match in the map
    if (yearLevelMap[raw]) {
        return yearLevelMap[raw];
    }

    // Fallback: extract the leading digit
    // Handles formats like 'YEAR 2', '2.0', '2ND YEAR BSIT', etc.
    const YEAR_CANONICAL = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
    const digitMatch = raw.match(/\b([1-5])\b/);
    if (digitMatch) {
        return YEAR_CANONICAL[parseInt(digitMatch[1], 10) - 1] || null;
    }

    return null;
}
