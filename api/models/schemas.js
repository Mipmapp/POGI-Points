// ============================================================
// DATABASE SCHEMAS - All Mongoose schema definitions
// ============================================================
// This file contains all schema definitions used throughout the SSAAM backend.
// Models are exported by college variant in models/index.js

import mongoose from 'mongoose';

// ============================================================
// CONSTANTS & VALIDATORS
// ============================================================

const STUDENT_ID_REGEX = /^[0-9]{2}-[A-Z]-[0-9]{5}$/;
const UPPERCASE_ONLY_REGEX = /^[A-ZÑ\s'.\-]+$/;
const VALID_SUFFIXES = ['', 'Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const VALID_SEMESTERS = ['1st Sem', '2nd Sem'];
const VALID_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const VALID_PROGRAMS = ['BSCS', 'BSIT', 'BSIS', 'BSM'];
const VALID_ROLES = ['student', 'treasurer', 'co-admin'];
const VALID_RFID_STATUS = ['verified', 'unverified', 'Unreadable'];

// ============================================================
// RATE LIMIT SCHEMA
// ============================================================

export const rateLimitSchema = new mongoose.Schema({
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

// ============================================================
// SESSION TOKEN SCHEMA
// ============================================================

export const sessionTokenSchema = new mongoose.Schema({
    token_hash: { type: String, required: true, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    user_type: { type: String, enum: ['student', 'master'], required: true },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
    is_revoked: { type: Boolean, default: false },
    last_used_at: { type: Date, default: Date.now }
});

sessionTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
sessionTokenSchema.index({ user_id: 1 });
sessionTokenSchema.index({ last_used_at: 1 });

// ============================================================
// AUDIT TRAIL SCHEMA
// ============================================================

export const auditTrailSchema = new mongoose.Schema({
    admin_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
    admin_name:  { type: String, default: '' },
    admin_role:  { type: String, default: '' },
    action:      { type: String, required: true },
    target_type: { type: String, default: '' },
    target_id:   { type: String, default: '' },
    target_label:{ type: String, default: '' },
    details:     { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp:   { type: Date, default: Date.now }
});

auditTrailSchema.index({ timestamp: -1 });
auditTrailSchema.index({ admin_id: 1, timestamp: -1 });
auditTrailSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // 30 days

// ============================================================
// STUDENT SCHEMA
// ============================================================

export const studentSchema = new mongoose.Schema({
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
    admin_verification_token: { type: String, default: null },
    full_name: {
        type: String,
        required: [true, "Full name is required"],
        validate: {
            validator: function (v) {
                return UPPERCASE_ONLY_REGEX.test(v.trim()) && v.trim().length <= 128;
            },
            message: "Full name must be uppercase letters only and max 128 characters"
        }
    },
    last_name: {
        type: String,
        required: [true, "Last name is required"],
        validate: {
            validator: function (v) {
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
    school_year: { type: String, required: false, default: null },
    program: {
        type: String,
        required: true,
        enum: {
            values: VALID_PROGRAMS,
            message: "Program must be one of: BSCS, BSIT, BSIS, or BSM"
        }
    },
    photo: { type: String },
    semester: {
        type: String,
        required: false,
        enum: {
            values: VALID_SEMESTERS,
            message: "Semester must be one of: 1st Sem, 2nd Sem"
        },
        default: null
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
    created_date: { type: Date, default: Date.now },
    revalidated_at: { type: Date, default: null },
    custom_password: { type: String, default: null },
    contributions: [{
        amount: { type: Number, required: true },
        description: { type: String, required: true },
        date: { type: Date, default: Date.now },
        collected_by: { type: String }
    }],
    face_descriptors: {
        type: [{
            label: { type: String, default: 'Face' },
            descriptor: { type: [Number], required: true },
            photo: { type: String, default: null },
            created_at: { type: Date, default: Date.now }
        }],
        default: []
    },
    face_updated_at: { type: Date, default: null }
});

studentSchema.pre('save', function () {
    const firstName  = (this.first_name  || '').trim().toUpperCase();
    const middleName = (this.middle_name || '').trim().toUpperCase();
    const computed   = middleName ? `${firstName} ${middleName}` : firstName;
    if (computed) {
        this.full_name = computed;
    } else if (!this.full_name || this.full_name.trim() === '') {
        this.full_name = (this.last_name || '').trim().toUpperCase();
    }
});

studentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    if (Array.isArray(obj.face_descriptors)) {
        obj.face_descriptors_count = obj.face_descriptors.length;
        delete obj.face_descriptors;
    }
    return obj;
};

// ============================================================
// GOOGLE EXCHANGE CODE SCHEMA
// ============================================================

export const googleExchangeCodeSchema = new mongoose.Schema({
    code:       { type: String, required: true, unique: true, index: true },
    token:      { type: String, required: true },
    student:    { type: Object, required: true },
    college:    { type: String, required: true },
    expires_at: { type: Date,   required: true },
});

googleExchangeCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// ============================================================
// VERIFICATION CODE SCHEMA
// ============================================================

export const verificationCodeSchema = new mongoose.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    student_data: { type: Object, required: true },
    expires_at: { type: Date, required: true },
    created_at: { type: Date, default: Date.now }
});

verificationCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// ============================================================
// MASTER SCHEMA
// ============================================================

export const masterSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'administrator', 'co-admin', 'treasurer'], default: 'admin' },
    college: { type: String, enum: ['CCS', 'COE', 'SOM', 'CNAHS'], default: 'CCS' },
    full_name: { type: String, default: null },
    phone: { type: String, default: null },
    photo: { type: String, default: null },
    bio: { type: String, default: null },
    face_descriptors: {
        type: [{
            label: { type: String, default: 'Face' },
            descriptor: { type: [Number], required: true },
            photo: { type: String, default: null },
            created_at: { type: Date, default: Date.now }
        }],
        default: []
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

masterSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    if (Array.isArray(obj.face_descriptors)) {
        obj.face_descriptors_count = obj.face_descriptors.length;
        delete obj.face_descriptors;
    }
    return obj;
};

// ============================================================
// EXPORT LOG SCHEMA
// ============================================================

export const exportLogSchema = new mongoose.Schema({
    exported_by:   { type: String, default: 'Admin' },
    exported_at:   { type: Date,   default: Date.now },
    record_count:  { type: Number, default: 0 },
    format:        { type: String, default: 'xlsx' },
    payment_title: { type: String, default: '' },
    filters: {
        year_levels: { type: [String], default: [] },
        statuses:    { type: [String], default: [] },
        program:     { type: String,   default: '' }
    }
});

// ============================================================
// SETTINGS SCHEMA
// ============================================================

export const settingsSchema = new mongoose.Schema({
    userRegister: {
        register: { type: Boolean, default: true },
        message: { type: String, default: "" }
    },
    userLogin: {
        login: { type: Boolean, default: true },
        message: { type: String, default: "" }
    },
    rfidScanner: {
        checkInEnabled: { type: Boolean, default: true },
        checkOutEnabled: { type: Boolean, default: false },
        autoDisableCheckIn: { type: Boolean, default: false },
        autoDisableCheckOut: { type: Boolean, default: false },
        checkInDisableAt: { type: Date, default: null },
        checkOutDisableAt: { type: Date, default: null },
        lateThresholdMinutes: { type: Number, default: 30 }
    },
    semester: { type: String, default: '1st Sem' },
    schoolYear: { type: String, default: '' }
});

// ============================================================
// PASSWORD RESET SCHEMA
// ============================================================

export const passwordResetSchema = new mongoose.Schema({
    student_id: { type: String, required: true },
    email: { type: String, required: true },
    code: { type: String, required: true },
    expires_at: { type: Date, required: true },
    used: { type: Boolean, default: false },
    used_at: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verified_at: { type: Date, default: null },
    reset_token: { type: String, default: null },
    created_at: { type: Date, default: Date.now }
});

passwordResetSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
passwordResetSchema.index({ student_id: 1 });

// ============================================================
// ATTENDANCE EVENT SCHEMA
// ============================================================

export const attendanceEventSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 2000, default: "" },
    location: { type: String, maxlength: 200, default: "" },
    event_date: { type: Date, required: true },
    year_level: { type: String, default: "" },
    start_time: { type: String, default: "07:00" },
    end_time: { type: String, default: "17:00" },
    status: {
        type: String,
        enum: ['draft', 'active', 'closed'],
        default: 'draft'
    },
    is_custom: { type: Boolean, default: false },
    assigned_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    geofence_enabled: { type: Boolean, default: false },
    geofence_lat: { type: Number, default: null },
    geofence_lng: { type: Number, default: null },
    geofence_radius_meters: { type: Number, default: 80, min: 10, max: 5000 },
    face_id_enabled: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
    created_by_name: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    activated_at: { type: Date, default: null },
    closed_at: { type: Date, default: null },
    rfidScanner: { type: mongoose.Schema.Types.Mixed, default: { checkInEnabled: true, checkOutEnabled: false } },
    school_year: { type: String, default: '' },
    semester: { type: String, default: '' }
});

attendanceEventSchema.index({ status: 1, event_date: -1 });
attendanceEventSchema.index({ created_at: -1 });

// ============================================================
// ATTENDANCE SESSION SCHEMA
// ============================================================

export const attendanceSessionSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceEvent', required: true },
    label: {
        type: String,
        enum: ['Whole Day', 'Morning', 'Afternoon', 'Noon', 'Night', 'Dawn'],
        required: true
    },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    status: {
        type: String,
        enum: ['draft', 'active', 'closed'],
        default: 'draft'
    },
    check_in_locked: { type: Boolean, default: false },
    check_out_locked: { type: Boolean, default: false },
    late_timer_minutes: { type: Number, default: 0 },
    check_in_only: { type: Boolean, default: false },
    rfidScanner: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

attendanceSessionSchema.index({ event_id: 1, label: 1 });
attendanceSessionSchema.index({ event_id: 1, status: 1 });
attendanceSessionSchema.index({ status: 1 });

// ============================================================
// ATTENDANCE LOG SCHEMA
// ============================================================

export const attendanceLogSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceEvent', required: true },
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    student_id_number: { type: String, required: true },
    rfid_code: { type: String, default: null },
    student_name: { type: String, required: true },
    program: { type: String },
    year_level: { type: String },
    check_in_at: { type: Date, default: null },
    check_out_at: { type: Date, default: null },
    is_late: { type: Boolean, default: false },
    excused: { type: Boolean, default: false },
    excuse_reason: { type: String, default: null },
    excused_by: { type: String, default: null },
    excused_by_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    excused_by_model: { type: String, enum: ['Student', 'Master', null], default: null },
    source: { type: String, enum: ['rfid', 'manual', 'face'], default: 'rfid' },
    input_method: { type: String, enum: ['rfid', 'manual_student_id'], default: 'rfid' },
    check_in_only: { type: Boolean, default: false },
    school_year: { type: String, default: '' },
    semester: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

attendanceLogSchema.index({ session_id: 1, student_id: 1 }, { unique: true });
attendanceLogSchema.index({ event_id: 1, student_id: 1 });
attendanceLogSchema.index({ session_id: 1, rfid_code: 1 });
attendanceLogSchema.index({ session_id: 1, check_in_at: -1 });

attendanceLogSchema.virtual('attendance_status').get(function () {
    if (this.excused) return 'excused';
    if (this.check_in_at && (this.check_out_at || this.check_in_only)) {
        return this.is_late ? 'late' : 'present';
    }
    if (this.check_in_at && !this.check_out_at) return 'incomplete';
    return 'absent';
});

attendanceLogSchema.set('toJSON', { virtuals: true });
attendanceLogSchema.set('toObject', { virtuals: true });

// ============================================================
// PAYMENT SCHEMA
// ============================================================

export const paymentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: {
        type: String,
        enum: ['membership', 'donation', 'fee', 'other', 'contribution', 'fundraiser', 'event'],
        default: 'fee'
    },
    amount_due: { type: Number, default: 0 },
    deadline: { type: Date, default: null },
    status: {
        type: String,
        enum: ['active', 'closed', 'archived'],
        default: 'active'
    },
    created_by: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    target_year_levels: { type: [String], default: [] },
    target_programs:    { type: [String], default: [] },
    school_year: { type: String, default: '' },
    semester: { type: String, default: '' },
    addons: [{
        name:        { type: String, required: true },
        description: { type: String, default: '' },
        price:       { type: Number, required: true, default: 0 },
        unit:        { type: String, default: 'piece' },
        max_qty:     { type: Number, default: null },
    }],
});

paymentSchema.index({ status: 1, created_at: -1 });
paymentSchema.index({ created_by: 1 });

// ============================================================
// PAYMENT RECORD SCHEMA
// ============================================================

export const paymentRecordSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true },
    student_id_number: { type: String, required: true },
    student_name: { type: String, required: true },
    program: { type: String },
    year_level: { type: String },

    campaigns: [{
        payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
        payment_status: {
            type: String,
            enum: ['pending', 'unpaid', 'paid', 'partial', 'waived'],
            default: 'pending'
        },
        amount_paid: { type: Number, default: 0 },
        paid_at: { type: Date, default: null },
        paid_by_treasurer: { type: String, default: null },
        notes: { type: String, default: "" },
        payment_method: { type: String, default: null },
        discount_type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        discount_percentage: { type: Number, default: 0, min: 0, max: 100 },
        discount_fixed_amount: { type: Number, default: 0, min: 0 },
        discount_reason: { type: String, default: "" },
        discount_applied_at: { type: Date, default: null },
        discount_applied_by: { type: String, default: null },
        addon_purchases: [{
            addon_id:   { type: mongoose.Schema.Types.ObjectId },
            addon_name: { type: String, default: '' },
            quantity:   { type: Number, default: 1 },
            price_each: { type: Number, default: 0 },
            subtotal:   { type: Number, default: 0 },
        }],
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
    }],

    total_campaigns: { type: Number, default: 0 },
    total_amount_paid: { type: Number, default: 0 },
    campaigns_paid: { type: Number, default: 0 },
    last_payment_at: { type: Date, default: null },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

paymentRecordSchema.index({ 'campaigns.payment_id': 1 });
paymentRecordSchema.index({ 'campaigns.payment_status': 1 });
