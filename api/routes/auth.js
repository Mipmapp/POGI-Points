import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { extractToken, hashToken } from '../utils/crypto.js';
import { getCollegeModel } from '../models/index.js';
import { 
  Student, CCS_Student, COE_Student,
  Master, SessionToken,
  CCS_SessionToken, COE_SessionToken 
} from '../models/index.js';
import { auth, studentAuth, studentAuthWithToken, timestampAuth } from '../middleware/auth.js';
import { loginCheck, loginRecord, getClientIP } from '../middleware/rateLimit.js';
import { JWT_SECRET_KEY } from '../utils/constants.js';
import { formatError } from '../utils/formatters.js';
import { getCollegeFromRequest } from '../utils/college.js';

const router = express.Router();

// ── Helper: Internal error response ──────────────────────────────────────────
function internalError(res, err) {
  console.error('[Auth] Error:', err);
  return res.status(500).json(formatError('Internal server error'));
}

// ────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION ROUTES
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /apis/students/login
 * Student login with student ID and password (last name or custom password)
 */
router.post('/apis/students/login', studentAuth, timestampAuth, async (req, res) => {
    try {
        const { student_id, last_name } = req.body;

        if (!student_id || !last_name)
            return res.status(400).json({ message: "Student ID and Password required" });

        // Rate limit: 5 failed attempts per IP within 10 min → 15-min lockout
        const _ip  = getClientIP(req);
        const _key = `stulogin:${_ip}`;
        const _chk = await loginCheck(_key);
        if (_chk.blocked)
            return res.status(429).json({ message: `Too many failed attempts. Try again in ${_chk.remainingMins} minute${_chk.remainingMins === 1 ? '' : 's'}.` });

        // Get the claimed college from the request (what the frontend sent)
        const claimedCollege = req.college; // This comes from headers/theme selection
        const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, claimedCollege);
        const OtherStudentModel = claimedCollege === 'COE' ? CCS_Student : COE_Student;

        // First try to find student in the CLAIMED college
        let student = await StudentModel.findOne({ student_id })
            .select('-contributions');

        // If not found in claimed college, check if they exist in the OTHER college
        if (!student) {
            const otherStudent = await OtherStudentModel.findOne({ student_id })
                .select('-contributions');

            if (otherStudent) {
                // Student exists, but in the OTHER college - reject
                const otherCollege = claimedCollege === 'COE' ? 'CCS' : 'COE';
                return res.status(403).json({
                    message: `This student belongs to the ${otherCollege}. Please use ${otherCollege === 'CCS' ? 'the CCS' : 'the COE'} as your college to login portal.`,
                    belongsToCollege: otherCollege
                });
            }

            // Not found in either college
        await loginRecord(_key, false);
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

        if (!passwordValid) {
            await loginRecord(_key, false);
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

        await loginRecord(_key, true); // clear the counter on success

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

/**
 * POST /apis/students/logout
 * Student logout - revoke session token
 */
router.post('/apis/students/logout', studentAuthWithToken, async (req, res) => {
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

/**
 * POST /apis/masters/login
 * Admin/co-admin login with username and password
 */
router.post("/apis/masters/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Rate limit: 5 failed attempts per IP within 10 min → 15-min lockout
        const _ip  = getClientIP(req);
        const _key = `mlogin:${_ip}`;
        const _chk = await loginCheck(_key);
        if (_chk.blocked)
            return res.status(429).json({ message: `Too many failed attempts. Try again in ${_chk.remainingMins} minute${_chk.remainingMins === 1 ? '' : 's'}.` });

        const master = await Master.findOne({ username });
        if (!master) {
            await loginRecord(_key, false);
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const valid = await bcrypt.compare(password, master.password);
        if (!valid) {
            await loginRecord(_key, false);
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // Use req.college first, then fall back to stored value, then CCS
        const tokenCollege = req.college || master.college || 'CCS';
        const token = jwt.sign(
            { id: master._id, username: master.username, isMaster: true, role: master.role || 'admin', college: tokenCollege },
            JWT_SECRET_KEY,
            { expiresIn: "7d" }
        );

        // Update master's college if inferred differently
        if (master.college !== tokenCollege) {
            master.college = tokenCollege;
            await master.save();
        }

        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Use college-aware SessionToken model
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

/**
 * POST /apis/masters/logout
 * Admin logout - revoke session token
 */
router.post('/apis/masters/logout', auth, async (req, res) => {
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

/**
 * POST /apis/validate-token
 * Validate JWT token and session
 */
router.post('/apis/validate-token', async (req, res) => {
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

export default router;
