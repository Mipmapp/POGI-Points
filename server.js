import dotenv from 'dotenv';

// Load environment variables IMMEDIATELY
dotenv.config();
process.env.LOCAL_SERVER = 'true';
process.env.PORT = process.env.PORT || '3001';

console.log('[server] Booting SSAAM backend in local development mode...');

// Import the original backend which has all 114+ routes.
// The backend itself owns the local listen() call so we avoid starting twice.
await import('./SSAAM_VERCEL_BACKEND.js');

