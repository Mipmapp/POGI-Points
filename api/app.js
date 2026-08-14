// ============================================================
// SSAAM BACKEND APPLICATION - Main entry point
// ============================================================
// This file initializes the Express app with middleware and configuration
// Routes will be added separately in routes/index.js

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';

// Configuration
import {
    PORT,
    MONGO_URI,
    MONGO_OPTS,
} from './utils/constants.js';

// Middleware
import { corsOptions, stripOperatorsMiddleware, securityHeaders, ensureDatabaseConnection, attachCollegeMiddleware } from './middleware/security.js';
import { antiBotProtection } from './middleware/rateLimit.js';

// Utilities
import { getCollegeFromRequest } from './utils/college.js';

// Feature Routes
import healthRoutes from './routes/health.js';
import passwordResetRoutes from './routes/passwordReset.js';
import authRoutes from './routes/auth.js';

// Initialize Express app
const app = express();

// ============================================================
// DATABASE CONNECTION
// ============================================================

/**
 * Connect to MongoDB
 * Used by application startup
 */
export async function connectDatabase() {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('[DB] Already connected to MongoDB');
            return;
        }

        await mongoose.connect(MONGO_URI, MONGO_OPTS);
        console.log('[DB] Connected to MongoDB successfully');
    } catch (err) {
        console.error('[DB] Failed to connect to MongoDB:', err.message);
        throw err;
    }
}

/**
 * Disconnect from MongoDB
 * Used during graceful shutdown
 */
export async function disconnectDatabase() {
    try {
        await mongoose.disconnect();
        console.log('[DB] Disconnected from MongoDB');
    } catch (err) {
        console.error('[DB] Failed to disconnect from MongoDB:', err.message);
    }
}

// ============================================================
// MIDDLEWARE SETUP
// ============================================================

// CORS - Allow cross-origin requests
app.use(cors(corsOptions));

// Cookie parser - Parse cookies for session management
app.use(cookieParser());

// Body parsing - JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport initialization - OAuth support
app.use(passport.initialize());

// NoSQL injection prevention - Strip MongoDB operators
app.use(stripOperatorsMiddleware);

// Database connection check - Ensure DB is connected for /apis routes
app.use(ensureDatabaseConnection(mongoose));

// Security headers - Set security-related HTTP headers
app.use(securityHeaders);

// College detection - Determine college from request context
app.use('/apis', attachCollegeMiddleware(getCollegeFromRequest));

// Anti-bot protection - Rate limit registration attempts
app.use('/apis/students/send-verification', antiBotProtection);

// ============================================================
// FEATURE ROUTES
// ============================================================

// Health check and status routes
app.use(healthRoutes);

// Authentication routes (login, logout, token validation)
app.use(authRoutes);

// Password Reset routes
app.use(passwordResetRoutes);

// ============================================================
// ROUTE REGISTRATION
// Will be added by routes/index.js when application starts
// ============================================================

/**
 * Register routes from the routes/ directory
 * This function is called by the server initialization
 * @param {Function} registerRoutes - Routes registration function
 */
export function attachRoutes(registerRoutes) {
    if (typeof registerRoutes === 'function') {
        registerRoutes(app);
        console.log('[App] Routes registered successfully');
    }
}

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * 404 Not Found handler
 */
app.use((req, res) => {
    res.status(404).json({
        message: 'Not Found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

/**
 * Global error handler
 * Catches all errors and returns appropriate response
 */
app.use((err, req, res, next) => {
    console.error('[Error Handler]', err);

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
});

// ============================================================
// EXPORTS
// ============================================================

export default app;
export { app };
