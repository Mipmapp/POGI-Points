#!/usr/bin/env node
/**
 * Debug CORS Logic
 * Tests the CORS allow/block logic directly
 */

const ALLOWED_LOCALHOST_ORIGINS = [
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

const ALLOWED_ORIGINS = [
    'https://ssaam.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

console.log('ALLOWED_ORIGINS:', ALLOWED_ORIGINS);
console.log('ALLOWED_LOCALHOST_ORIGINS:', ALLOWED_LOCALHOST_ORIGINS);
console.log('');

const isReplitOrigin = (origin) => {
    if (!origin) return false;
    return /^https?:\/\/[^/]+(\.replit\.dev|\.repl\.co|\.replit\.app)(:\d+)?$/.test(origin);
};

const isLocalhost = (origin) => {
    if (!origin) return false;
    return ALLOWED_LOCALHOST_ORIGINS.includes(origin);
};

const testOrigins = [
    'http://localhost:5001',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://example.com',
];

console.log('CORS Logic Test Results:\n');

for (const origin of testOrigins) {
    const inAllowedOrigins = ALLOWED_ORIGINS.includes(origin);
    const isReplit = isReplitOrigin(origin);
    const isLocal = isLocalhost(origin);
    const shouldAllow = inAllowedOrigins || isReplit || isLocal;
    
    console.log(`Origin: ${origin}`);
    console.log(`  In ALLOWED_ORIGINS: ${inAllowedOrigins}`);
    console.log(`  Is Replit Origin: ${isReplit}`);
    console.log(`  Is Localhost: ${isLocal}`);
    console.log(`  Should Allow: ${shouldAllow ? '✅ YES' : '❌ NO'}`);
    console.log('');
}
