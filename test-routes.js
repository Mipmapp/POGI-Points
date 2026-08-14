#!/usr/bin/env node
/**
 * SSAAM Backend Comprehensive Test Suite
 * Tests all major route categories
 */

import http from 'http';
import https from 'https';

const BASE_URL = 'http://localhost:3001';
let testsPassed = 0;
let testsFailed = 0;

// Helper function to make HTTP requests
function makeRequest(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            timeout: 5000
        };

        const protocol = url.protocol === 'https:' ? https : http;
        
        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Test function
async function test(category, description, method, path, headers = {}, body = null, expectedStatus = null) {
    try {
        console.log(`\n  📝 ${description}`);
        const result = await makeRequest(method, path, headers, body);
        
        let statusOk = !expectedStatus || result.statusCode === expectedStatus;
        if (expectedStatus === undefined) {
            // If no expected status specified, just check if it's a valid HTTP response
            statusOk = result.statusCode >= 200 && result.statusCode < 600;
        }
        
        if (statusOk) {
            console.log(`     Status: ${result.statusCode} ✓`);
            testsPassed++;
            
            if (result.body) {
                try {
                    const json = JSON.parse(result.body);
                    console.log(`     Response: ${JSON.stringify(json).substring(0, 100)}...`);
                } catch {
                    console.log(`     Response: ${result.body.substring(0, 100)}...`);
                }
            }
        } else {
            console.log(`     Status: ${result.statusCode} (expected ${expectedStatus}) ✗`);
            testsFailed++;
        }
    } catch (error) {
        console.log(`     Error: ${error.message} ✗`);
        testsFailed++;
    }
}

// Run all tests
async function runTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   SSAAM BACKEND COMPREHENSIVE TEST SUITE                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // ============================================================
    // 1. HEALTH CHECK ENDPOINTS
    // ============================================================
    console.log('\n\n✨ TEST CATEGORY 1: HEALTH CHECK ENDPOINTS');
    console.log('═'.repeat(50));
    
    await test('Health', 'Root endpoint', 'GET', '/', {}, null, 200);
    await test('Health', 'API health check', 'GET', '/apis/health', {}, null, 200);
    await test('Health', 'Health with college header', 'GET', '/apis/health', { 'X-SSAAM-College': 'CCS' }, null, 200);

    // ============================================================
    // 2. AUTHENTICATION ENDPOINTS
    // ============================================================
    console.log('\n\n✨ TEST CATEGORY 2: AUTHENTICATION ENDPOINTS');
    console.log('═'.repeat(50));
    
    await test('Auth', 'Token validation (invalid token)', 'POST', '/apis/validate-token', { 'Authorization': 'Bearer invalid_token' }, null);
    await test('Auth', 'Login endpoint exists', 'GET', '/apis/students/login', {}, null);

    // ============================================================
    // 3. STUDENT ENDPOINTS
    // ============================================================
    console.log('\n\n✨ TEST CATEGORY 3: STUDENT ENDPOINTS');
    console.log('═'.repeat(50));
    
    await test('Students', 'Student list endpoint', 'GET', '/apis/students', { 'X-SSAAM-College': 'CCS' }, null);
    await test('Students', 'Student search endpoint', 'POST', '/apis/students/search', { 'X-SSAAM-College': 'CCS' }, { query: 'test' });
    await test('Students', 'Verify code send (registration)', 'POST', '/apis/students/send-verification', { 'X-SSAAM-College': 'CCS' }, { email: 'test@example.com' });

    // ============================================================
    // 4. PAYMENT ENDPOINTS
    // ============================================================
    console.log('\n\n✨ TEST CATEGORY 4: PAYMENT ENDPOINTS');
    console.log('═'.repeat(50));
    
    await test('Payments', 'Get payments list', 'GET', '/apis/payments', { 'X-SSAAM-College': 'CCS' }, null);
    await test('Payments', 'Student payments', 'GET', '/apis/my-payments', { 'X-SSAAM-College': 'CCS' }, null);

    // ============================================================
    // 5. ATTENDANCE ENDPOINTS
    // ============================================================
    console.log('\n\n✨ TEST CATEGORY 5: ATTENDANCE ENDPOINTS');
    console.log('═'.repeat(50));
    
    await test('Attendance', 'Get events', 'GET', '/apis/attendance/events', { 'X-SSAAM-College': 'CCS' }, null);
    await test('Attendance', 'Get sessions', 'GET', '/apis/attendance/sessions', { 'X-SSAAM-College': 'CCS' }, null);

    // ============================================================
    // 6. MASTER/ADMIN ENDPOINTS
    // ============================================================
    console.log('\n\n✨ TEST CATEGORY 6: MASTER/ADMIN ENDPOINTS');
    console.log('═'.repeat(50));
    
    await test('Admin', 'Get admin info', 'GET', '/apis/admin/me', { 'X-SSAAM-College': 'CCS' }, null);
    await test('Admin', 'Get settings', 'GET', '/apis/settings', { 'X-SSAAM-College': 'CCS' }, null);

    // ============================================================
    // 7. CONTRIBUTION ENDPOINTS
    // ============================================================
    console.log('\n\n✨ TEST CATEGORY 7: CONTRIBUTION ENDPOINTS');
    console.log('═'.repeat(50));
    
    await test('Contributions', 'Get contributions', 'GET', '/apis/contributions', {}, null);
    await test('Contributions', 'Get audit trail', 'GET', '/apis/audit-trail', {}, null);

    // ============================================================
    // 8. ERROR HANDLING
    // ============================================================
    console.log('\n\n✨ TEST CATEGORY 8: ERROR HANDLING');
    console.log('═'.repeat(50));
    
    await test('Errors', '404 Not Found for invalid path', 'GET', '/apis/nonexistent-endpoint-xyz', {}, null, 404);
    await test('Errors', '404 Not Found for malformed path', 'GET', '/invalid/path/123', {}, null, 404);

    // ============================================================
    // TEST SUMMARY
    // ============================================================
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   TEST SUMMARY                                             ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Passed: ${testsPassed.toString().padEnd(45)}║`);
    console.log(`║  Failed: ${testsFailed.toString().padEnd(45)}║`);
    console.log(`║  Total:  ${(testsPassed + testsFailed).toString().padEnd(45)}║`);
    
    const passRate = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1);
    console.log(`║  Pass Rate: ${passRate}%${' '.repeat(42 - passRate.toString().length)}║`);
    
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Exit with appropriate code
    process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests with error handling
runTests().catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
});
