// ============================================================
// MODEL FACTORY - Create Mongoose models for all colleges
// ============================================================

import mongoose from 'mongoose';
import * as schemas from './schemas.js';

// Model cache to avoid recreating the same models
const modelCache = {};

// ============================================================
// MODEL CREATION
// ============================================================

/**
 * Create or retrieve a model for a specific college
 * Automatically handles collection name prefixing (ccs_, coe_, som_, cnahs_)
 * @param {string} college - College code: CCS, COE, SOM, CNAHS
 * @param {string} baseModelName - Base model name (e.g., 'Student', 'Payment')
 * @param {Schema} schema - Mongoose schema
 * @param {string} baseCollectionName - Base collection name (defaults to lowercase baseModelName)
 * @returns {Model} Mongoose model
 */
function createCollegeModel(college, baseModelName, schema, baseCollectionName) {
    const collectionName = baseCollectionName || baseModelName.toLowerCase();
    const modelName = `${college}_${baseModelName}`;
    const cacheKey = `${college}_${baseModelName}`;

    if (modelCache[cacheKey]) {
        return modelCache[cacheKey];
    }

    // Get prefixed collection name
    const prefixedCollection = getCollectionNameForCollege(college, collectionName);

    // Create model with prefixed collection name
    const model = mongoose.model(
        modelName,
        schema,
        prefixedCollection
    );

    modelCache[cacheKey] = model;
    return model;
}

/**
 * Get collection name with appropriate prefix for college
 * Special case: masters collection is not prefixed
 * @param {string} college - College code
 * @param {string} baseCollectionName - Base collection name
 * @returns {string} Collection name (possibly prefixed)
 */
function getCollectionNameForCollege(college, baseCollectionName) {
    // Masters collection is shared across all colleges
    if (baseCollectionName.toLowerCase() === 'masters') {
        return 'masters';
    }

    const prefixes = {
        'COE': 'coe_',
        'SOM': 'som_',
        'CNAHS': 'cnahs_',
        'CCS': 'ccs_'
    };

    const prefix = prefixes[college] || 'ccs_';
    return prefix + baseCollectionName;
}

// ============================================================
// RATE LIMIT MODELS (Shared across all colleges)
// ============================================================

export const RateLimit = createCollegeModel('CCS', 'RateLimit', schemas.rateLimitSchema);

// ============================================================
// SESSION TOKEN MODELS (College-specific)
// ============================================================

export const SessionToken = createCollegeModel('CCS', 'SessionToken', schemas.sessionTokenSchema);
export const CCS_SessionToken = createCollegeModel('CCS', 'SessionToken', schemas.sessionTokenSchema);
export const COE_SessionToken = createCollegeModel('COE', 'SessionToken', schemas.sessionTokenSchema);
export const SOM_SessionToken = createCollegeModel('SOM', 'SessionToken', schemas.sessionTokenSchema);
export const CNAHS_SessionToken = createCollegeModel('CNAHS', 'SessionToken', schemas.sessionTokenSchema);

// ============================================================
// AUDIT TRAIL MODELS (College-specific)
// ============================================================

export const AuditTrail = createCollegeModel('CCS', 'AuditTrail', schemas.auditTrailSchema);
export const CCS_AuditTrail = createCollegeModel('CCS', 'AuditTrail', schemas.auditTrailSchema);
export const COE_AuditTrail = createCollegeModel('COE', 'AuditTrail', schemas.auditTrailSchema);
export const SOM_AuditTrail = createCollegeModel('SOM', 'AuditTrail', schemas.auditTrailSchema);
export const CNAHS_AuditTrail = createCollegeModel('CNAHS', 'AuditTrail', schemas.auditTrailSchema);

// ============================================================
// STUDENT MODELS (College-specific)
// ============================================================

export const Student = createCollegeModel('CCS', 'Student', schemas.studentSchema);
export const CCS_Student = createCollegeModel('CCS', 'Student', schemas.studentSchema);
export const COE_Student = createCollegeModel('COE', 'Student', schemas.studentSchema);
export const SOM_Student = createCollegeModel('SOM', 'Student', schemas.studentSchema);
export const CNAHS_Student = createCollegeModel('CNAHS', 'Student', schemas.studentSchema);

// ============================================================
// GOOGLE EXCHANGE CODE MODEL (Shared)
// ============================================================

export const GoogleExchangeCode = mongoose.model(
    'GoogleExchangeCode',
    schemas.googleExchangeCodeSchema
);

// ============================================================
// VERIFICATION CODE MODEL (Shared)
// ============================================================

export const VerificationCode = mongoose.model(
    'VerificationCode',
    schemas.verificationCodeSchema
);

// ============================================================
// MASTER MODEL (Shared across colleges)
// ============================================================

export const Master = mongoose.model(
    'Master',
    schemas.masterSchema
);

// ============================================================
// EXPORT LOG MODELS (College-specific)
// ============================================================

export const ExportLog = createCollegeModel('CCS', 'ExportLog', schemas.exportLogSchema);
export const CCS_ExportLog = createCollegeModel('CCS', 'ExportLog', schemas.exportLogSchema);
export const COE_ExportLog = createCollegeModel('COE', 'ExportLog', schemas.exportLogSchema);
export const SOM_ExportLog = createCollegeModel('SOM', 'ExportLog', schemas.exportLogSchema);
export const CNAHS_ExportLog = createCollegeModel('CNAHS', 'ExportLog', schemas.exportLogSchema);

// ============================================================
// SETTINGS MODELS (College-specific)
// ============================================================

export const Settings = createCollegeModel('CCS', 'Settings', schemas.settingsSchema, 'settings');
export const CCS_Settings = createCollegeModel('CCS', 'Settings', schemas.settingsSchema, 'ccs_settings');
export const COE_Settings = createCollegeModel('COE', 'Settings', schemas.settingsSchema, 'coe_settings');
export const SOM_Settings = createCollegeModel('SOM', 'Settings', schemas.settingsSchema, 'som_settings');
export const CNAHS_Settings = createCollegeModel('CNAHS', 'Settings', schemas.settingsSchema, 'cnahs_settings');

// ============================================================
// PASSWORD RESET MODEL (Shared)
// ============================================================

export const PasswordReset = mongoose.model(
    'PasswordReset',
    schemas.passwordResetSchema
);

// ============================================================
// ATTENDANCE EVENT MODELS (College-specific)
// ============================================================

export const AttendanceEvent = createCollegeModel('CCS', 'AttendanceEvent', schemas.attendanceEventSchema);
export const CCS_AttendanceEvent = createCollegeModel('CCS', 'AttendanceEvent', schemas.attendanceEventSchema);
export const COE_AttendanceEvent = createCollegeModel('COE', 'AttendanceEvent', schemas.attendanceEventSchema);
export const SOM_AttendanceEvent = createCollegeModel('SOM', 'AttendanceEvent', schemas.attendanceEventSchema);
export const CNAHS_AttendanceEvent = createCollegeModel('CNAHS', 'AttendanceEvent', schemas.attendanceEventSchema);

// ============================================================
// ATTENDANCE SESSION MODELS (College-specific)
// ============================================================

export const AttendanceSession = createCollegeModel('CCS', 'AttendanceSession', schemas.attendanceSessionSchema);
export const CCS_AttendanceSession = createCollegeModel('CCS', 'AttendanceSession', schemas.attendanceSessionSchema);
export const COE_AttendanceSession = createCollegeModel('COE', 'AttendanceSession', schemas.attendanceSessionSchema);
export const SOM_AttendanceSession = createCollegeModel('SOM', 'AttendanceSession', schemas.attendanceSessionSchema);
export const CNAHS_AttendanceSession = createCollegeModel('CNAHS', 'AttendanceSession', schemas.attendanceSessionSchema);

// ============================================================
// ATTENDANCE LOG MODELS (College-specific)
// ============================================================

export const AttendanceLog = createCollegeModel('CCS', 'AttendanceLog', schemas.attendanceLogSchema);
export const CCS_AttendanceLog = createCollegeModel('CCS', 'AttendanceLog', schemas.attendanceLogSchema);
export const COE_AttendanceLog = createCollegeModel('COE', 'AttendanceLog', schemas.attendanceLogSchema);
export const SOM_AttendanceLog = createCollegeModel('SOM', 'AttendanceLog', schemas.attendanceLogSchema);
export const CNAHS_AttendanceLog = createCollegeModel('CNAHS', 'AttendanceLog', schemas.attendanceLogSchema);

// ============================================================
// PAYMENT MODELS (College-specific)
// ============================================================

export const Payment = createCollegeModel('CCS', 'Payment', schemas.paymentSchema);
export const CCS_Payment = createCollegeModel('CCS', 'Payment', schemas.paymentSchema);
export const COE_Payment = createCollegeModel('COE', 'Payment', schemas.paymentSchema);
export const SOM_Payment = createCollegeModel('SOM', 'Payment', schemas.paymentSchema);
export const CNAHS_Payment = createCollegeModel('CNAHS', 'Payment', schemas.paymentSchema);

// ============================================================
// PAYMENT RECORD MODELS (College-specific)
// ============================================================

export const PaymentRecord = createCollegeModel('CCS', 'PaymentRecord', schemas.paymentRecordSchema);
export const CCS_PaymentRecord = createCollegeModel('CCS', 'PaymentRecord', schemas.paymentRecordSchema);
export const COE_PaymentRecord = createCollegeModel('COE', 'PaymentRecord', schemas.paymentRecordSchema);
export const SOM_PaymentRecord = createCollegeModel('SOM', 'PaymentRecord', schemas.paymentRecordSchema);
export const CNAHS_PaymentRecord = createCollegeModel('CNAHS', 'PaymentRecord', schemas.paymentRecordSchema);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the appropriate model variant for a specific college
 * Usage: const StudentModel = getCollegeModel(Student, CCS_Student, COE_Student, 'COE');
 * Automatically creates SOM/CNAHS variants if they don't exist
 * @param {Model} baseModel - Base model (typically CCS)
 * @param {Model} ccsModel - CCS-specific model
 * @param {Model} coeModel - COE-specific model
 * @param {string} college - College code (CCS, COE, SOM, CNAHS)
 * @returns {Model} College-specific model
 */
export function getCollegeModel(baseModel, ccsModel, coeModel, college) {
    if (college === 'COE') return coeModel;
    if (college === 'SOM') {
        const modelName = `SOM_${baseModel.modelName.replace(/^CCS_/, '')}`;
        if (mongoose.models[modelName]) return mongoose.models[modelName];
        return SOM_Student || SOM_Payment || SOM_AttendanceEvent; // Fallback
    }
    if (college === 'CNAHS') {
        const modelName = `CNAHS_${baseModel.modelName.replace(/^CCS_/, '')}`;
        if (mongoose.models[modelName]) return mongoose.models[modelName];
        return CNAHS_Student || CNAHS_Payment || CNAHS_AttendanceEvent; // Fallback
    }
    return ccsModel;
}

/**
 * Clear the model cache (useful for testing)
 */
export function clearModelCache() {
    Object.keys(modelCache).forEach(key => {
        delete modelCache[key];
    });
}

/**
 * Get all models for a specific college
 * @param {string} college - College code
 * @returns {Object} Object with all college-specific models
 */
export function getCollegeModels(college) {
    return {
        SessionToken: getCollegeModel(SessionToken, CCS_SessionToken, COE_SessionToken, college),
        AuditTrail: getCollegeModel(AuditTrail, CCS_AuditTrail, COE_AuditTrail, college),
        Student: getCollegeModel(Student, CCS_Student, COE_Student, college),
        ExportLog: getCollegeModel(ExportLog, CCS_ExportLog, COE_ExportLog, college),
        Settings: getCollegeModel(Settings, CCS_Settings, COE_Settings, college),
        AttendanceEvent: getCollegeModel(AttendanceEvent, CCS_AttendanceEvent, COE_AttendanceEvent, college),
        AttendanceSession: getCollegeModel(AttendanceSession, CCS_AttendanceSession, COE_AttendanceSession, college),
        AttendanceLog: getCollegeModel(AttendanceLog, CCS_AttendanceLog, COE_AttendanceLog, college),
        Payment: getCollegeModel(Payment, CCS_Payment, COE_Payment, college),
        PaymentRecord: getCollegeModel(PaymentRecord, CCS_PaymentRecord, COE_PaymentRecord, college),
        // Shared models
        RateLimit,
        GoogleExchangeCode,
        VerificationCode,
        Master,
        PasswordReset
    };
}
