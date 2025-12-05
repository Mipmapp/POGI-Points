import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SSAAM_API_KEY = process.env.SSAAM_API_KEY || "SECRET_iKALAT_PALANG_NIMO";
const SSAAM_CRYPTO_KEY = process.env.SSAAM_CRYPTO_KEY || "SSAAM2025CCS";

const VALID_PROGRAMS = ['BSCS', 'BSIT', 'BSIS'];

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
const NAME_REGEX = /^[\p{L}\s'-]+$/u;

const studentSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        unique: true,
        match: [STUDENT_ID_REGEX, "Invalid student_id format. Required: 12-A-12345"]
    },
    rfid_code: { type: String, default: "N/A" },
    full_name: { type: String },
    first_name: {
        type: String,
        required: true,
        match: [NAME_REGEX, "First name must contain letters only"]
    },
    middle_name: {
        type: String,
        match: [NAME_REGEX, "Middle name must contain letters only"],
        default: ""
    },
    last_name: {
        type: String,
        required: true,
        match: [NAME_REGEX, "Last name must contain letters only"]
    },
    suffix: { type: String },
    year_level: { type: String, required: true },
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
    semester: { type: String, required: true },
    email: { type: String },
    role: { type: String, default: "student" },
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

function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
        return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, SSAAM_API_KEY);
        req.master = decoded;
        next();
    } catch {
        res.status(400).json({ message: "invalid token." });
    }
}

function studentAuth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token || token !== process.env.SSAAM_STUDENT_API_KEY) {
        return res.status(401).json({ message: "Unauthorized: Invalid key"});
    }

    next();
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
            BSCS: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 },
            BSIS: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 },
            BSIT: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 }
        };

        const allStudents = await Student.find({ status: 'approved' });

        allStudents.forEach(student => {
            const program = student.program;
            const yearLevel = student.year_level;

            if (stats[program] && stats[program][yearLevel] !== undefined) {
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

        const students = await Student.find({ status: 'pending' })
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        const total = await Student.countDocuments({ status: 'pending' });
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

        if (!NAME_REGEX.test(data.first_name) || !NAME_REGEX.test(data.last_name)) {
            return res.status(400).json({ message: "Names must contain letters only" });
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

        const full_name = `${data.first_name} ${data.middle_name || ""} ${data.last_name} ${data.suffix || ""}`
            .replace(/\s+/g, " ")
            .trim();

        const studentData = {
            ...data,
            full_name,
            role: "student",
            status: "pending"
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

app.post('/apis/students', studentAuth, antiBotProtection, timestampAuth, async (req, res) => {
    try {
        const settings = await getSettings();
        if (!settings.userRegister.register) {
            return res.status(403).json({ 
                message: settings.userRegister.message || "Registration is currently disabled.",
                registrationDisabled: true
            });
        }
    } catch (settingsErr) {
        console.error("Error checking settings:", settingsErr);
    }

    const data = req.body;

    if (!STUDENT_ID_REGEX.test(data.student_id))
        return res.status(400).json({ message: "Invalid student_id format. Use 21-A-12345" });

    const yearPrefix = parseInt(data.student_id.substring(0, 2), 10);
    if (yearPrefix < 21 || yearPrefix > 25)
        return res.status(400).json({ message: "Student ID must start with 21 to 25 (e.g., 21-A-12345 to 25-A-12345)" });

    if (!NAME_REGEX.test(data.first_name) || !NAME_REGEX.test(data.last_name))
        return res.status(400).json({ message: "Names must contain letters only" });

    if (!VALID_PROGRAMS.includes(data.program)) {
        return res.status(400).json({ message: "Program must be one of: BSCS, BSIT, or BSIS" });
    }

    const full_name =
        `${data.first_name} ${data.middle_name || ""} ${data.last_name} ${data.suffix || ""}`
            .replace(/\s+/g, " ")
            .trim();

    try {
        const student = new Student({ 
            ...data, 
            full_name,
            role: "student",
            status: "pending"
        });
        const saved = await student.save();
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000)
            return res.status(400).json({ message: "Duplicate student_id" });

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

app.put('/apis/students/:student_id', studentAuth, timestampAuth, async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates.student_id;
        delete updates.status;
        delete updates.role;

        updates.first_name = updates.first_name?.trim();
        updates.middle_name = updates.middle_name?.trim();
        updates.last_name = updates.last_name?.trim();

        if (updates.first_name && !NAME_REGEX.test(updates.first_name))
            return res.status(400).json({ message: "Invalid first_name" });

        if (updates.last_name && !NAME_REGEX.test(updates.last_name))
            return res.status(400).json({ message: "Invalid last_name" });

        if (updates.program && !VALID_PROGRAMS.includes(updates.program)) {
            return res.status(400).json({ message: "Program must be one of: BSCS, BSIT, or BSIS" });
        }

        if (updates.first_name || updates.middle_name || updates.last_name || updates.suffix) {
            const first = updates.first_name || "";
            const mid = updates.middle_name || "";
            const last = updates.last_name || "";
            const suf = updates.suffix || "";
            updates.full_name = `${first} ${mid} ${last} ${suf}`.trim();
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

app.delete('/apis/students/:student_id', studentAuth, timestampAuth, async (req, res) => {
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

        res.json({
            message: "Login successful",
            student
        });

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
            { id: master._id, username: master.username },
            SSAAM_API_KEY,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            master
        });

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

export default app;
