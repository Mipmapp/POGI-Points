import 'dotenv/config';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function armsLogin(studentId, password) {
    const res  = await fetch(`${BACKEND_URL}/apis/students/arms-verify`, {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer SSAAMStudents',
        },
        body: JSON.stringify({ student_id: studentId, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);

    return data;
}

// ── Run ───────────────────────────────────────────────────────────────────────
const studentId = process.argv[2];
const password  = process.argv[3];

if (!studentId || !password) {
    console.error('Usage: node index.js <student_id> <password>');
    process.exit(1);
}

armsLogin(studentId, password)
    .then(data => {
        console.log('\nARMS Login Successful:');
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
        console.error('\nARMS Login Failed:', err.message);
        process.exit(1);
    });
