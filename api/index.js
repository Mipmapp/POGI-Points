// ============================================================
// SSAAM API EXPORT - Vercel Serverless Function Entry Point
// ============================================================
// For Vercel deployment, we use the original backend which includes
// all 114+ routes. The modular api/app.js structure is used for
// the standalone server.js.

import app from '../SSAAM_VERCEL_BACKEND.js';
import dotenv from 'dotenv';

dotenv.config();

// For Vercel serverless environment
// Ensure database is connected before handling requests
export default async function handler(req, res) {
    // Database connection is handled by SSAAM_VERCEL_BACKEND.js middleware
    return app(req, res);
}

// Export the app for other uses
export { app };
