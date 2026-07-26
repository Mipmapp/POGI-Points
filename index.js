import 'dotenv/config';

const ARMS_TOKEN_URL = 'https://jrmsu-arms.online/api/version-2/services/credential/token/request';
const ARMS_LOGIN_URL = 'https://jrmsu-arms.online/api/version-2/services/student/account/login';
const ARMS_BASE_HEADERS = {
    'User-Agent': 'Coderstation-Protocol',
    'Referer':    'https://jrmsu-election-system.vercel.app/',
    'Origin':     'https://jrmsu-election-system.vercel.app',
};

async function armsLogin(username, password) {
    const armsApiKey    = process.env.ARMS_API_KEY;
    const armsApiSecret = process.env.ARMS_API_SECRET;

    if (!armsApiKey || !armsApiSecret) {
        throw new Error('ARMS_API_KEY and ARMS_API_SECRET must be set in .env');
    }

    // Step 1: Request bearer token
    console.log('Requesting ARMS token...');
    const tokenRes  = await fetch(ARMS_TOKEN_URL, {
        method:  'POST',
        headers: { ...ARMS_BASE_HEADERS, 'Api-Key': armsApiKey, 'Api-Secret': armsApiSecret },
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) throw new Error(`Token request failed (${tokenRes.status}): ${JSON.stringify(tokenData)}`);

    const secretKey = tokenData.Secret_Key ?? tokenData.SecretKey ?? tokenData.secretKey ?? null;
    const jwToken   = tokenData.JWToken    ?? tokenData.Token     ?? tokenData.jwToken   ?? null;

    if (!secretKey || !jwToken) throw new Error('Invalid token response from ARMS.');

    // Step 2: Log in with student credentials
    console.log('Logging in to ARMS...');
    const loginRes  = await fetch(ARMS_LOGIN_URL, {
        method:  'POST',
        headers: {
            ...ARMS_BASE_HEADERS,
            'Secret-Key':    secretKey,
            'Token':         jwToken,
            'Authorization': `Bearer ${jwToken}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify({ Username: username, Password: password }),
    });
    const loginData = await loginRes.json();

    if (!loginRes.ok || !loginData?.Record) {
        throw new Error(`Login failed (${loginRes.status}): ${JSON.stringify(loginData)}`);
    }

    return loginData.Record;
}

// ── Run ───────────────────────────────────────────────────────────────────────
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.error('Usage: node index.js <username> <password>');
    process.exit(1);
}

armsLogin(username, password)
    .then(record => {
        console.log('\nARMS Login Successful:');
        console.log(JSON.stringify(record, null, 2));
    })
    .catch(err => {
        console.error('\nARMS Login Failed:', err.message);
        process.exit(1);
    });
