#!/usr/bin/env node
/**
 * CORS Fix Verification Test
 * Verifies that localhost:5001 is now allowed
 */

import http from 'http';

function testCORS(origin) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/apis/health',
            method: 'GET',
            headers: {
                'Origin': origin
            },
            timeout: 3000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const corsHeader = res.headers['access-control-allow-origin'];
                resolve({
                    statusCode: res.statusCode,
                    corsHeader,
                    allowed: corsHeader === origin || corsHeader === '*'
                });
            });
        });

        req.on('error', (err) => {
            resolve({ error: err.message });
        });

        req.end();
    });
}

async function runTest() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   CORS FIX VERIFICATION TEST               ║');
    console.log('╚════════════════════════════════════════════╝\n');

    const origins = [
        'http://localhost:5001',
        'http://localhost:5000',
        'http://localhost:3000',
        'http://example.com'
    ];

    for (const origin of origins) {
        const result = await testCORS(origin);
        
        if (result.error) {
            console.log(`❌ ${origin}`);
            console.log(`   Error: ${result.error}`);
        } else {
            const allowed = result.allowed ? '✅ ALLOWED' : '❌ BLOCKED';
            console.log(`${allowed} - ${origin}`);
            if (result.corsHeader) {
                console.log(`   CORS Header: ${result.corsHeader}`);
            }
        }
        console.log('');
    }

    console.log('╔════════════════════════════════════════════╗');
    console.log('║   TEST COMPLETE                            ║');
    console.log('╚════════════════════════════════════════════╝\n');
}

runTest().catch(console.error);
