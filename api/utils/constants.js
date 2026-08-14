// ============================================================
// CONSTANTS - Global Configuration Values
// ============================================================

/**
 * Valid college codes in the system
 */
export const VALID_COLLEGES = ['CCS', 'COE', 'SOM', 'CNAHS'];

/**
 * Valid student programs - CCS programs
 */
export const VALID_PROGRAMS = ['BSCS', 'BSIT', 'BSIS', 'BSM'];

/**
 * Valid name suffixes (Jr., Sr., etc.)
 */
export const VALID_SUFFIXES = ['', 'Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * Valid semesters in academic calendar
 */
export const VALID_SEMESTERS = ['1st Sem', '2nd Sem'];

/**
 * Valid year levels for students
 */
export const VALID_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

/**
 * Valid student role assignments
 */
export const VALID_ROLES = ['student', 'treasurer', 'co-admin'];

/**
 * Valid RFID status values
 */
export const VALID_RFID_STATUS = ['verified', 'unverified', 'Unreadable'];

// ============================================================
// LOGIN RATE LIMITING
// ============================================================

export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10-minute rolling window
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15-minute lockout after max attempts

// ============================================================
// VERIFICATION CODE RATE LIMITING
// ============================================================

export const VERIFICATION_CODE_MAX_ATTEMPTS = 4;
export const VERIFICATION_CODE_WINDOW_MS = 15 * 60 * 1000; // 15-minute window
export const VERIFICATION_CODE_MIN_INTERVAL_MS = 60 * 1000; // 60-second minimum between attempts
export const VERIFICATION_CODE_EXPIRY_MS = 30 * 60 * 1000; // 30-minute expiration

// ============================================================
// REGISTRATION RATE LIMITING
// ============================================================

export const REGISTRATION_COOLDOWN_MS = 60 * 1000; // 1 minute between registration attempts

// ============================================================
// FACIAL RECOGNITION
// ============================================================

export const MAX_FACE_DESCRIPTORS = 10; // Max faces per admin
export const FACE_DESCRIPTOR_LENGTH = 128; // face-api.js descriptor size

// ============================================================
// STUDENT ID FORMAT VALIDATION
// ============================================================

// Format: NN-A-NNNNN (e.g., 25-A-00000, 22-A-12345)
export const STUDENT_ID_REGEX = /^\d{2}-[A-Z]-\d{5}$/;

// Uppercase letters only (for name validation)
export const UPPERCASE_ONLY_REGEX = /^[A-Z\s'-]+$/;

// Gmail validation
export const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

// ============================================================
// JRMSU ARMS API ENDPOINTS
// ============================================================

export const ARMS_TOKEN_URL = 'https://jrmsu-arms.online/api/version-2/services/credential/token/request';
export const ARMS_LOGIN_URL = 'https://jrmsu-arms.online/api/version-2/services/student/account/login';
export const ARMS_SEARCH_URL = 'https://jrmsu-arms.online/api/version-2/services/student/enrollment/search';

export const ARMS_BASE_HEADERS = {
    'User-Agent': 'Coderstation-Protocol',
    'Referer': 'https://jrmsu-election-system.vercel.app/',
    'Origin': 'https://jrmsu-election-system.vercel.app',
};

// ============================================================
// CORS CONFIGURATION
// ============================================================

export const ALLOWED_ORIGINS = [
    'https://ssaam.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

export const ALLOWED_LOCALHOST_ORIGINS = [
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

// ============================================================
// YEAR LEVEL MAPPING (from ARMS formats to canonical)
// ============================================================

export const ARMS_YEAR_LEVEL_MAP = {
    // 1st Year variants
    '1': '1st Year', '1ST': '1st Year', '1ST YR': '1st Year', '1ST YEAR': '1st Year',
    'FIRST': '1st Year', 'FIRST YEAR': '1st Year', 'FIRST YR': '1st Year',
    // 2nd Year variants
    '2': '2nd Year', '2ND': '2nd Year', '2ND YR': '2nd Year', '2ND YEAR': '2nd Year',
    'SECOND': '2nd Year', 'SECOND YEAR': '2nd Year', 'SECOND YR': '2nd Year',
    // 3rd Year variants
    '3': '3rd Year', '3RD': '3rd Year', '3RD YR': '3rd Year', '3RD YEAR': '3rd Year',
    'THIRD': '3rd Year', 'THIRD YEAR': '3rd Year', 'THIRD YR': '3rd Year',
    // 4th Year variants
    '4': '4th Year', '4TH': '4th Year', '4TH YR': '4th Year', '4TH YEAR': '4th Year',
    'FOURTH': '4th Year', 'FOURTH YEAR': '4th Year', 'FOURTH YR': '4th Year',
    // 5th Year variants (graduate/irregular)
    '5': '5th Year', '5TH': '5th Year', '5TH YR': '5th Year', '5TH YEAR': '5th Year',
    'FIFTH': '5th Year', 'FIFTH YEAR': '5th Year', 'FIFTH YR': '5th Year',
};

export const YEAR_CANONICAL = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

// ============================================================
// EMAIL CONFIGURATION
// ============================================================

export const PRIMARY_ADMIN_USERNAME = process.env.PRIMARY_ADMIN_USERNAME || 'ssaam';

// Parse Gmail accounts from environment (server-side only, never exposed to clients)
export function parseGmailAccounts() {
    let accounts = [];
    try {
        const raw = process.env.GMAIL_ACCOUNTS;
        if (!raw || !raw.trim()) {
            console.warn('[EmailService] GMAIL_ACCOUNTS env var not set — email sending disabled');
            return accounts;
        }

        let parsed = null;

        // Attempt 1: standard JSON
        try {
            parsed = JSON.parse(raw);
        } catch (_) {}

        // Attempt 2: fix unquoted keys (e.g. {user:"x",pass:"y"})
        if (parsed === null) {
            try {
                parsed = JSON.parse(raw.replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3'));
            } catch (_) {}
        }

        // Attempt 3: newline-delimited "email:password" pairs
        if (parsed === null) {
            const lines = raw.split(/[\n,]+/).map(l => l.trim()).filter(Boolean);
            const pairs = lines.map(l => {
                const i = l.indexOf(':');
                return i > 0 ? { user: l.slice(0, i).trim(), pass: l.slice(i + 1).trim() } : null;
            }).filter(Boolean);
            if (pairs.length) parsed = pairs;
        }

        if (Array.isArray(parsed)) {
            accounts = parsed.filter(a => a && typeof a.user === 'string' && a.user.includes('@') && typeof a.pass === 'string' && a.pass.length > 0);
        }

        if (accounts.length === 0) {
            console.warn('[EmailService] GMAIL_ACCOUNTS is set but no valid {user, pass} entries found. Expected JSON: [{"user":"x@gmail.com","pass":"app-password"}]');
        } else {
            console.log(`[EmailService] Loaded ${accounts.length} Gmail account(s)`);
        }
    } catch (e) {
        console.warn('[EmailService] Unexpected error loading GMAIL_ACCOUNTS:', e.message);
    }
    return accounts;
}

// ============================================================
// DATABASE CONFIGURATION
// ============================================================

export const MONGO_OPTS = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,  // detect dead connections every 10s
    maxPoolSize: 10,
    minPoolSize: 1,               // keep only 1 idle; Atlas drops many idle connections
    maxIdleTimeMS: 30000,         // close idle connections before Atlas does (~60s)
    retryWrites: true,
    retryReads: true,
    w: 'majority'
};

export const PORT = process.env.PORT || 3001;
export const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

// ============================================================
// BOT DETECTION
// ============================================================

export const BOT_PATTERNS = /bot|crawler|spider|scraper|curl|wget|python-requests|postman|insomnia|httpie/i;

// ============================================================
// ROLE MAPPING
// ============================================================

// Map programs to colleges
export const PROGRAM_TO_COLLEGE = {
    'BSCE': 'COE',
    'BSEE': 'COE',
    'BSECE': 'COE',
    'BSCPE': 'COE',
    'BSM': 'SOM',
    'BSN': 'CNAHS',
};

// Default college
export const DEFAULT_COLLEGE = 'CCS';
