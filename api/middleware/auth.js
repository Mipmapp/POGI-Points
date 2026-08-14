// ============================================================
// AUTHENTICATION MIDDLEWARE - JWT verification, role checks
// ============================================================

import jwt from 'jsonwebtoken';
import { hashToken } from '../utils/crypto.js';
import { getCollegeFromRequest, normalizeCollege } from '../utils/college.js';

/**
 * Extract authentication token from request
 * Checks: Authorization header, custom header, cookie
 * @param {Object} req - Express request
 * @returns {string|null} JWT token or null
 */
export function extractToken(req) {
    // Header: "Authorization: Bearer <token>"
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization || req.headers['authorization']);
    if (authHeader) {
        const parts = String(authHeader).split(' ');
        if (parts.length > 1) return parts[1];
        return parts[0];
    }

    // Custom header
    if (req.headers && req.headers['x-ssaam-token']) {
        return req.headers['x-ssaam-token'];
    }

    // Cookie: HttpOnly session cookie (not accessible to XSS)
    if (req.cookies && req.cookies.ssaam_token) {
        return req.cookies.ssaam_token;
    }

    return null;
}

/**
 * Helper to search for a session token across all college collections
 * Tries preferred college first, then all others
 * @param {Object} SessionTokenModel - Mongoose model
 * @param {string} tokenHash - Hashed token to find
 * @returns {Promise<Object|null>} Found session token or null
 */
export async function findSessionToken(SessionTokenModel, tokenHash) {
    const query = {
        token_hash: tokenHash,
        is_revoked: false,
        expires_at: { $gt: new Date() }
    };

    const sessionToken = await SessionTokenModel.findOneAndUpdate(
        query,
        { last_used_at: new Date() },
        { returnDocument: 'after' }
    );

    return sessionToken;
}

/**
 * Master/Admin authentication middleware
 * Verifies JWT token for master users and checks session validity
 * Sets req.master and req.sessionToken if successful
 * @param {Object} deps - Dependencies object
 * @param {string} deps.JWT_SECRET_KEY - Secret for JWT verification
 * @param {Function} deps.getCollegeModel - Function to get college-specific model
 * @returns {Function} Express middleware
 */
export function masterAuth(deps) {
    const { JWT_SECRET_KEY, getCollegeModel } = deps;

    return async (req, res, next) => {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET_KEY);
            const tokenHash = hashToken(token);

            // Prefer the college in the token first, then the header
            const preferredCollege = normalizeCollege(decoded.college) || req.college || 'CCS';
            
            // Try to find session token in the preferred college first
            const SessionTokenModel = getCollegeModel(null, null, null, preferredCollege);
            const sessionToken = await findSessionToken(SessionTokenModel, tokenHash);

            if (!sessionToken) {
                return res.status(401).json({ message: "Session expired or invalid. Please login again." });
            }

            req.master = decoded;
            req.sessionToken = sessionToken;
            next();
        } catch (err) {
            return res.status(400).json({ message: "Invalid token." });
        }
    };
}

/**
 * Student authentication middleware (token-based)
 * Verifies JWT token for student users and checks session validity
 * Sets req.student and req.sessionToken if successful
 * @param {Object} deps - Dependencies object
 * @param {string} deps.JWT_SECRET_KEY - Secret for JWT verification
 * @param {Function} deps.getCollegeModel - Function to get college-specific model
 * @returns {Function} Express middleware
 */
export function studentAuthWithToken(deps) {
    const { JWT_SECRET_KEY, getCollegeModel } = deps;

    return async (req, res, next) => {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET_KEY);
            const tokenHash = hashToken(token);

            // For student tokens: sync req.college with where their session lives
            const preferredCollege = normalizeCollege(decoded.college) || req.college || 'CCS';
            const SessionTokenModel = getCollegeModel(null, null, null, preferredCollege);
            
            const sessionToken = await findSessionToken(SessionTokenModel, tokenHash);
            if (!sessionToken) {
                return res.status(401).json({ message: "Session expired or invalid. Please login again." });
            }

            // Sync request college with session location
            req.college = preferredCollege;

            // Fetch the full student document
            const StudentModel = getCollegeModel(null, null, null, preferredCollege);
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
    };
}

/**
 * Basic student authentication (API key only)
 * Used for registration endpoints
 * @param {string} STUDENT_API_KEY - Expected API key
 * @returns {Function} Express middleware
 */
export function studentAuth(STUDENT_API_KEY) {
    return (req, res, next) => {
        const token = extractToken(req);
        const validStudentKey = STUDENT_API_KEY || 'SSAAMStudents';

        if (!token || token !== validStudentKey) {
            return res.status(401).json({ message: "Unauthorized: Invalid key" });
        }

        next();
    };
}

/**
 * Require master (admin) privileges
 * Verifies that req.master exists and has isMaster flag set
 * Both full admin and co-admin pass this check
 * @returns {Function} Express middleware
 */
export function requireMaster(req, res, next) {
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

/**
 * Require super admin privileges (full admin only)
 * Co-admins and treasurers are blocked from super-admin areas
 * @returns {Function} Express middleware
 */
export function requireSuperAdmin(req, res, next) {
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

/**
 * Enforce college restrictions for co-admin users
 * Co-admins and treasurers can only operate on their assigned college
 * Full admins are unrestricted
 * @returns {Function} Express middleware
 */
export function enforceCoAdminCollege(req, res, next) {
    if (req.master && req.master.isMaster && (req.master.role === 'co-admin' || req.master.role === 'treasurer')) {
        req.college = req.master.college || 'CCS';
    }
    next();
}

/**
 * Require co-admin or above (blocks treasurer role)
 * Treasurers cannot perform attendance or student management actions
 * @returns {Function} Express middleware
 */
export function requireCoAdminOrAbove(req, res, next) {
    if (req.master && req.master.isMaster && req.master.role === 'treasurer') {
        return res.status(403).json({
            message: "Access denied. Treasurer accounts cannot perform this action.",
            code: 'NOT_CO_ADMIN'
        });
    }
    next();
}

/**
 * Middleware for student data searches
 * Students can only access their own data; admins can search all
 * @param {Object} deps - Dependencies
 * @param {string} deps.JWT_SECRET_KEY - Secret for JWT verification
 * @param {Function} deps.getCollegeModel - Function to get college-specific model
 * @returns {Function} Express middleware
 */
export function studentSearchAuth(deps) {
    const { JWT_SECRET_KEY, getCollegeModel } = deps;

    return async (req, res, next) => {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET_KEY);
            const tokenHash = hashToken(token);

            const SessionTokenModel = getCollegeModel(null, null, null, req.college);
            const sessionToken = await findSessionToken(SessionTokenModel, tokenHash);

            if (!sessionToken) {
                return res.status(401).json({ message: "Session expired or invalid. Please login again." });
            }

            if (decoded.isMaster) {
                // Admin user
                const master = await require('mongoose').model('Master').findById(decoded.id);
                if (!master) {
                    return res.status(404).json({ message: "Admin user not found" });
                }
                req.user = decoded;
                req.master = master;
                req.sessionToken = sessionToken;
                req.isAdmin = true;
            } else {
                // Student user
                const StudentModel = getCollegeModel(null, null, null, req.college);
                const student = await StudentModel.findOne({ student_id: decoded.student_id });
                
                if (!student) {
                    return res.status(401).json({ message: "Student not found" });
                }

                if (student.student_id !== decoded.student_id) {
                    console.warn(`[SECURITY] Token/Database mismatch for student ${decoded.student_id}`);
                    return res.status(401).json({ message: "Session validation failed. Please login again." });
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
            }
            
            next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid token." });
        }
    };
}
