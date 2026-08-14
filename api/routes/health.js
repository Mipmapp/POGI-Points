import express from 'express';

const router = express.Router();

/**
 * GET /
 * Root endpoint - verify backend is running
 */
router.get('/', (req, res) => {
    res.status(200).json({
        message: "SSAAM Backend is running!",
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /apis/health
 * Health check endpoint - with server time header
 */
router.get('/apis/health', (req, res) => {
    const now = new Date();
    res.set('X-SSAAM-Server-Time', now.toISOString());
    res.set('Date', now.toUTCString());
    res.status(200).json({
        message: "SSAAM API Health Check",
        status: "operational",
        timestamp: now.toISOString()
    });
});

export default router;
