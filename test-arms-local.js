#!/usr/bin/env node
/**
 * Local ARMS verification test
 * Tests the credentials: 25-A-01207 / Maglinte@102006
 */

const testData = {
    student_id: '25-A-01207',
    password: 'Maglinte@102006'
};

console.log('\n=== Local ARMS Verification Test ===\n');
console.log('Student ID:', testData.student_id);
console.log('Password:', testData.password);
console.log('\nSending request to http://localhost:3001/apis/students/arms-verify\n');

fetch('http://localhost:3001/apis/students/arms-verify', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'SSAAMStudents'
    },
    body: JSON.stringify(testData)
})
.then(res => res.json().then(data => ({ status: res.status, body: data })))
.then(({ status, body }) => {
    console.log('Status:', status);
    console.log('\nResponse:');
    console.log(JSON.stringify(body, null, 2));
    
    if (status === 200) {
        console.log('\n✅ ARMS verification SUCCESS!');
        console.log('Student record retrieved:');
        console.log(JSON.stringify(body.record || {}, null, 2));
    } else {
        console.log('\n❌ Verification failed:', body.message);
    }
})
.catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
