import express from 'express';
import bcrypt from 'bcrypt';
import { 
  generateVerificationCode, 
  generateSecureToken, 
  hashToken 
} from '../utils/crypto.js';
import { sanitizeHtml } from '../utils/validators.js';
import { getCollegeModel } from '../models/index.js';
import { 
  Student, CCS_Student, COE_Student,
  PasswordReset
} from '../models/index.js';
import { studentAuth, timestampAuth } from '../middleware/auth.js';
import { EmailService } from '../services/emailService.js';
import { formatError } from '../utils/formatters.js';

const router = express.Router();
const emailService = new EmailService();

// ── Password Reset Rate Limiting ─────────────────────────────────────────────
// In-memory tracking of password reset attempts per IP + student_id
const passwordResetAttempts = new Map();
const PASSWORD_RESET_COOLDOWN_MS = 60000; // 1 minute between requests
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPTS_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout after 5 failed attempts

// Cleanup old attempts every minute
function cleanupPasswordResetAttempts() {
    const now = Date.now();
    for (const [key, data] of passwordResetAttempts.entries()) {
        if (now - data.lastAttempt > FAILED_ATTEMPTS_LOCKOUT_MS) {
            passwordResetAttempts.delete(key);
        }
    }
}
setInterval(cleanupPasswordResetAttempts, 60000);

// ── Helper: Send Password Reset Email ────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, code, studentName) {
    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: "SSAAM Password Reset Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-family: Arial, sans-serif; font-size: 28px; letter-spacing: 2px;">SSAAM</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 13px;">Student School Activities Attendance Monitoring</p>
                </div>
                <div style="background: #ffffff; padding: 32px 30px; border-radius: 0 0 10px 10px; border: 1px solid #dbeafe; border-top: none;">
                    <h2 style="color: #1e3a8a; margin-top: 0; font-size: 20px;">Hello ${sanitizeHtml(studentName)}!</h2>
                    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 16px 0;">
                        We received a request to reset your SSAAM password. Use the code below to complete your password reset:
                    </p>
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0; border: 2px solid #bfdbfe;">
                        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                        <p style="margin: 8px 0 0 0; color: #1e3a8a; font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 4px;">${code}</p>
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin: 20px 0 0 0;">
                        <strong>This code expires in 15 minutes.</strong> If you didn't request this reset, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 16px 0 0 0;">
                        © 2026 JRMSU College of Computing Studies<br>
                        Need help? Contact your admin
                    </p>
                </div>
            </div>
        `
    };
    return await emailService.sendMail(mailOptions);
}

// ── Helper: Format error response ────────────────────────────────────────────
function internalError(res, err) {
    console.error('[PasswordReset] Error:', err);
    return res.status(500).json(formatError('Failed to process password reset. Please try again.'));
}

// ────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET ROUTES
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /apis/password-reset/request
 * Request a password reset code via email
 * Requires: student_id, email
 * Returns: confirmation message (generic for security)
 */
router.post('/apis/password-reset/request', studentAuth, timestampAuth, async (req, res) => {
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

        // Rate limiting by IP + student_id
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

        // Check cooldown (minimum 1 minute between requests)
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

        // Return generic message for security (don't reveal if student exists)
        if (!student || student.status !== 'approved') {
            passwordResetAttempts.set(rateLimitKey, { count: attemptData.count + 1, lastAttempt: now });
            return res.status(200).json({ 
                message: "If an account exists with this Student ID and email, a reset code has been sent." 
            });
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
            code: codeHash, // Store hashed code (never store plaintext)
            expires_at: expiresAt,
            attempts: 0 // Track verification attempts
        });

        // Send email with plain code
        const displayName = [student.first_name, student.middle_name, student.last_name]
            .filter(Boolean)
            .join(' ') || student.full_name || 'Student';
        await sendPasswordResetEmail(student.email, code, displayName);

        // Reset attempt counter on success
        passwordResetAttempts.set(rateLimitKey, { count: 0, lastAttempt: now });

        res.json({
            message: "If an account exists with this Student ID and email, a reset code has been sent."
        });

    } catch (err) {
        internalError(res, err);
    }
});

/**
 * POST /apis/password-reset/verify
 * Verify the reset code sent to email
 * Requires: student_id, code
 * Returns: reset_token (temporary token for next step)
 */
router.post('/apis/password-reset/verify', studentAuth, timestampAuth, async (req, res) => {
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
            { returnDocument: 'after' }
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
        internalError(res, err);
    }
});

/**
 * POST /apis/password-reset/complete
 * Complete the password reset with new password
 * Requires: student_id, reset_token, new_password
 * Returns: success message
 */
router.post('/apis/password-reset/complete', studentAuth, timestampAuth, async (req, res) => {
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
            { returnDocument: 'after' }
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

        // Hash and save the new password as custom_password
        // MUST use the college-specific StudentModel, otherwise the update
        // lands in the wrong MongoDB collection and login never sees the password.
        const hashedPassword = await bcrypt.hash(new_password, 12);
        await StudentModel.updateOne(
            { student_id },
            { custom_password: hashedPassword }
        );

        res.json({ message: "Password reset successful! You can now login with your new password." });

    } catch (err) {
        internalError(res, err);
    }
});

export default router;
