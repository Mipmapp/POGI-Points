import 'dotenv/config';
import express    from 'express';
import bodyParser from 'body-parser';

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(bodyParser.json());

// ─── JRMSU ARMS API ──────────────────────────────────────────────────────────
const ARMS_TOKEN_URL = 'https://jrmsu-arms.online/api/version-2/services/credential/token/request';
const ARMS_LOGIN_URL = 'https://jrmsu-arms.online/api/version-2/services/student/account/login';
const ARMS_BASE_HEADERS = {
    'User-Agent': 'Coderstation-Protocol',
    'Referer':    'https://jrmsu-election-system.vercel.app/',
    'Origin':     'https://jrmsu-election-system.vercel.app',
};

// POST /arms/login
// Body: { "username": "<student_id>", "password": "<arms_password>" }
app.post('/arms/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const armsApiKey    = process.env.ARMS_API_KEY;
        const armsApiSecret = process.env.ARMS_API_SECRET;

        if (!armsApiKey || !armsApiSecret) {
            return res.status(503).json({ message: 'ARMS credentials are not configured. Set ARMS_API_KEY and ARMS_API_SECRET in .env.' });
        }

        // Step 1: Request ARMS bearer token
        let tokenRes, tokenData;
        try {
            tokenRes  = await fetch(ARMS_TOKEN_URL, {
                method:  'POST',
                headers: { ...ARMS_BASE_HEADERS, 'Api-Key': armsApiKey, 'Api-Secret': armsApiSecret },
            });
            tokenData = await tokenRes.json();
        } catch {
            return res.status(503).json({ message: 'Could not reach JRMSU ARMS portal. Please try again later.' });
        }

        if (!tokenRes.ok) {
            return res.status(503).json({ message: 'ARMS service error. Please try again later.', detail: tokenData });
        }

        const secretKey = tokenData.Secret_Key ?? tokenData.SecretKey ?? tokenData.secretKey ?? null;
        const jwToken   = tokenData.JWToken    ?? tokenData.Token     ?? tokenData.jwToken   ?? null;

        if (!secretKey || !jwToken) {
            return res.status(503).json({ message: 'ARMS token response was invalid. Please try again.' });
        }

        // Step 2: Authenticate the student
        let loginRes, loginData;
        try {
            loginRes  = await fetch(ARMS_LOGIN_URL, {
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
            loginData = await loginRes.json();
        } catch {
            return res.status(503).json({ message: 'Could not reach JRMSU ARMS portal. Please try again later.' });
        }

        if (!loginRes.ok || !loginData?.Record) {
            return res.status(401).json({ message: 'Incorrect username or password. Please check and try again.' });
        }

        const record = loginData.Record;
        console.log(record)

        return res.json({
            message: 'ARMS login successful.',
            student: {
                studentId:        record.Student_ID       ?? record.student_id   ?? username,
                studentName:      record.Student_Name     ?? record.student_name ?? '',
                email:            record.Email            ?? '',
                college:          record.College          ?? '',
                collegeCode:      record.College_Code     ?? record.college_code ?? '',
                programEnrolled:  record.Program_Enrolled ?? record.program      ?? '',
                programCode:      record.Program_Code     ?? record.program_code ?? '',
                yearLevel:        record.Year_Level       ?? record.year_level   ?? '',
                semester:         record.Semester         ?? '',
                schoolYear:       record.School_Year      ?? '',
                enrollmentStatus: record.Enrollment_Status ?? record.enrollment_status ?? record.EnrollmentStatus ?? '',
                sex:              record.Sex              ?? record.Gender       ?? '',
            },
        });

    } catch (err) {
        console.error('ARMS login error:', err);
        return res.status(500).json({ message: 'An unexpected error occurred. Please try again.' });
    }
});

app.listen(PORT, () => {
    console.log(`ARMS login server running on http://localhost:${PORT}`);
    console.log(`POST http://localhost:${PORT}/arms/login`);
});
