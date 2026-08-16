// ============================================================
// Legacy serverless entrypoint compatibility shim
// ============================================================
// All live API routes now live in SSAAM_VERCEL_BACKEND.js. This file re-exports
// the same Express app so older Vercel/serverless references still resolve without
// maintaining a separate duplicate API implementation.

import dotenv from 'dotenv';
import app from '../SSAAM_VERCEL_BACKEND.js';

dotenv.config();

export default async function handler(req, res) {
    return app(req, res);
}

export { app };
