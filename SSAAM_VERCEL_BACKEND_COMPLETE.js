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

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-SSAAM-TS'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Disable caching for all API responses to prevent 304 issues
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SSAAM_API_KEY = process.env.SSAAM_API_KEY || "SECRET_iKALAT_PALANG_NIMO";
const SSAAM_CRYPTO_KEY = process.env.SSAAM_CRYPTO_KEY || "SSAAM2025CCS";
const ADMIN_VERIFICATION_SECRET = process.env.ADMIN_VERIFICATION_SECRET || "SSAAM_ADMIN_VERIFY_2025";

const VALID_PROGRAMS = ['BSCS', 'BSIT', 'BSIS'];
const VALID_SUFFIXES = ['', 'Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const VALID_SEMESTERS = ['1st Sem', '2nd Sem'];
const VALID_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const VALID_ROLES = ['student', 'medpub'];
const VALID_RFID_STATUS = ['verified', 'unverified'];

const emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "pabbly.bot.2@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendVerificationEmail(toEmail, code, studentName) {
    const mailOptions = {
        from: "SSAAM <pabbly.bot.2@gmail.com>",
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
                    <p style="color: #4b5563;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                </div>
            </div>
        `
    };
    
    return emailTransporter.sendMail(mailOptions);
}

async function sendApprovalEmail(toEmail, studentName, approved, rejectionReason = '') {
    const subject = approved ? "SSAAM Account Approved - You Can Now Login!" : "SSAAM Account Status Update";
    const statusColor = approved ? "#10b981" : "#ef4444";
    const statusText = approved ? "Approved" : "Not Approved";
    const message = approved 
        ? "Congratulations! Your SSAAM account has been approved. You can now login to your account."
        : `Unfortunately, your account registration was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;
    
    const mailOptions = {
        from: "SSAAM <pabbly.bot.2@gmail.com>",
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
                    ${approved ? '<p style="color: #4b5563;">Login at: <a href="https://ssaam.vercel.app" style="color: #7c3aed;">ssaam.vercel.app</a></p>' : ''}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                </div>
            </div>
        `
    };
    
    return emailTransporter.sendMail(mailOptions);
}

async function sendRFIDVerificationEmail(toEmail, studentName, rfidCode, verifiedBy) {
    const mailOptions = {
        from: "SSAAM <pabbly.bot.2@gmail.com>",
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
    
    return emailTransporter.sendMail(mailOptions);
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

function isValidTimestamp(encodedString, maxAgeMinutes = 1) {
    const timestamp = decodeTimestamp(encodedString);
    if (!timestamp) return false;

    try {
        const requestTime = new Date(timestamp);
        const now = new Date();
        const diffMinutes = (now - requestTime) / (1000 * 60);

        return diffMinutes >= -0.5 && diffMinutes <= maxAgeMinutes;
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

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
.then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => console.error('MongoDB error:', err));

const STUDENT_ID_REGEX = /^[0-9]{2}-[A-Z]-[0-9]{5}$/;
const NAME_REGEX = /^[A-Z\s'-]+$/;
const UPPERCASE_ONLY_REGEX = /^[A-Z\s'-]+$/;

const sessionTokenSchema = new mongoose.Schema({
    token_hash: { type: String, required: true, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    user_type: { type: String, enum: ['student', 'master'], required: true },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
    is_revoked: { type: Boolean, default: false }
});

sessionTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
sessionTokenSchema.index({ user_id: 1 });

const SessionToken = mongoose.model("SessionToken", sessionTokenSchema);

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
    created_date: { type: Date, default: Date.now }
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
    was_edited: { type: Boolean, default: false }
});

notificationSchema.index({ created_at: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

// Send Password Reset Email
async function sendPasswordResetEmail(toEmail, code, studentName) {
    const mailOptions = {
        from: "SSAAM <pabbly.bot.2@gmail.com>",
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
    
    return emailTransporter.sendMail(mailOptions);
}

async function getSettings() {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({
            userRegister: { register: true, message: "" },
            userLogin: { login: true, message: "" }
        });
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
        const sessionToken = await SessionToken.findOne({ 
            token_hash: tokenHash,
            is_revoked: false,
            expires_at: { $gt: new Date() }
        });

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
        const sessionToken = await SessionToken.findOne({ 
            token_hash: tokenHash,
            is_revoked: false,
            expires_at: { $gt: new Date() }
        });

        if (!sessionToken) {
            return res.status(401).json({ message: "Session expired or invalid. Please login again." });
        }

        req.user = decoded;
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

        const students = await Student.find({ status: 'approved' })
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
            BSCS: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, '5th Year': 0, total: 0 },
            BSIS: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, '5th Year': 0, total: 0 },
            BSIT: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, '5th Year': 0, total: 0 }
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
            'FOURTH': '4th Year',
            '5TH YEAR': '5th Year',
            '5TH': '5th Year',
            '5': '5th Year',
            'FIFTH YEAR': '5th Year',
            'FIFTH': '5th Year'
        };

        const allStudents = await Student.find({ status: 'approved' });

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
        });

        const pendingCount = await Student.countDocuments({ status: 'pending' });

        res.json({
            stats,
            totalStudents: allStudents.length,
            pendingCount
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

        const filter = { status: 'approved' };

        if (search.trim()) {
            filter.$or = [
                { student_id: { $regex: search, $options: 'i' } },
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { rfid_code: { $regex: search, $options: 'i' } }
            ];
        }

        if (program) {
            filter.program = program;
        }

        if (yearLevel) {
            filter.year_level = yearLevel;
        }

        const students = await Student.find(filter)
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

        const students = await Student.find({ status: 'pending' })
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

        if (!STUDENT_ID_REGEX.test(data.student_id)) {
            return res.status(400).json({ message: "Invalid student_id format. Use 21-A-12345" });
        }

        const yearPrefix = parseInt(data.student_id.substring(0, 2), 10);
        if (yearPrefix < 21 || yearPrefix > 25) {
            return res.status(400).json({ message: "Student ID must start with 21 to 25" });
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

        await VerificationCode.deleteMany({ email: data.email });

        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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
            email: data.email
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
            return res.status(400).json({ message: "Invalid or expired verification code" });
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

app.put('/apis/students/:student_id/approve', auth, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { student_id: req.params.student_id, status: 'pending' },
            { status: 'approved' },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: "Pending student not found" });
        }

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

app.put('/apis/students/:student_id/reject', auth, async (req, res) => {
    try {
        const { reason } = req.body;
        
        const student = await Student.findOneAndUpdate(
            { student_id: req.params.student_id, status: 'pending' },
            { 
                status: 'rejected',
                rejection_reason: reason || ''
            },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: "Pending student not found" });
        }

        if (student.email) {
            try {
                await sendApprovalEmail(student.email, student.first_name, false, reason);
            } catch (emailErr) {
                console.error("Failed to send rejection email:", emailErr);
            }
        }

        res.json({
            message: "Student rejected",
            student
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

app.delete('/apis/students/:student_id/rfid', auth, timestampAuth, async (req, res) => {
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

app.put('/apis/students/:student_id', auth, timestampAuth, async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates.student_id;
        delete updates.status;
        delete updates.role;
        delete updates.rfid_code;
        delete updates.rfid_status;
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

app.delete('/apis/students/:student_id', auth, timestampAuth, async (req, res) => {
    try {
        const deleted = await Student.findOneAndDelete({ student_id: req.params.student_id });

        if (!deleted)
            return res.status(404).json({ message: "Student not found." });

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
            return res.status(400).json({ message: "Student ID and Last Name required" });

        const student = await Student.findOne({ 
            student_id,
            last_name: { $regex: `^${last_name}$`, $options: 'i' }
        });

        if (!student)
            return res.status(400).json({ message: "Invalid Student ID or Last Name" });

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

        res.json({
            message: "Login successful",
            student,
            token
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

app.post('/apis/masters', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ message: "Username and password required" });

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

app.get('/apis/masters', auth, async (req, res) => {
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

app.delete('/apis/students/cleanup-invalid-programs', auth, async (req, res) => {
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

app.put('/apis/settings', auth, async (req, res) => {
    try {
        const { userRegister, userLogin } = req.body;
        
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({
                userRegister: userRegister || { register: true, message: "" },
                userLogin: userLogin || { login: true, message: "" }
            });
        } else {
            if (userRegister !== undefined) {
                settings.userRegister = userRegister;
            }
            if (userLogin !== undefined) {
                settings.userLogin = userLogin;
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

// Complete Password Reset - Update the student's last_name (used as password)
app.post('/apis/password-reset/complete', studentAuth, timestampAuth, async (req, res) => {
    try {
        const { student_id, reset_token, new_password } = req.body;

        if (!student_id || !reset_token || !new_password) {
            return res.status(400).json({ message: "Student ID, reset token, and new password are required" });
        }

        // Validate new password (last name format)
        const trimmedPassword = new_password.trim().toUpperCase();
        if (!trimmedPassword || trimmedPassword.length < 2 || trimmedPassword.length > 64) {
            return res.status(400).json({ message: "New password must be between 2 and 64 characters" });
        }

        if (!/^[A-Z\s'-]+$/.test(trimmedPassword)) {
            return res.status(400).json({ message: "Password must contain only letters, spaces, hyphens, or apostrophes" });
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

        // Update student's last_name (which is the password)
        const full_name = `${student.first_name} ${student.middle_name || ''} ${trimmedPassword} ${student.suffix || ''}`
            .replace(/\s+/g, " ")
            .trim();

        await Student.updateOne(
            { student_id },
            { last_name: trimmedPassword, full_name }
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
            .sort({ created_at: -1 })
            .limit(50);
        
        res.json({ data: notifications });
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
        const sessionToken = await SessionToken.findOne({ 
            token_hash: tokenHash,
            is_revoked: false,
            expires_at: { $gt: new Date() }
        });

        if (!sessionToken) {
            return res.status(401).json({ message: "Session expired or invalid. Please login again." });
        }

        // Check if master/admin
        if (decoded.isMaster) {
            req.poster = {
                id: decoded.id,
                name: decoded.username,
                type: 'admin'
            };
            return next();
        }

        // Check if student with medpub role
        if (decoded.student_id) {
            const student = await Student.findOne({ student_id: decoded.student_id });
            if (student && student.role === 'medpub') {
                req.poster = {
                    id: decoded.id,
                    name: student.first_name + ' ' + student.last_name,
                    type: 'medpub'
                };
                return next();
            }
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
        const notification = await Notification.create({
            title: title.trim(),
            message: message.trim(),
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

        if (title) {
            if (title.length > 200) {
                return res.status(400).json({ message: "Title must be 200 characters or less" });
            }
            notification.title = title.trim();
        }

        if (message) {
            if (message.length > 2000) {
                return res.status(400).json({ message: "Message must be 2000 characters or less" });
            }
            notification.message = message.trim();
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

        res.json({
            message: "Notification updated successfully",
            notification
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

export default app;
