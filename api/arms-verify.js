export const config = { runtime: 'edge' }

const ARMS_TOKEN_URL = 'https://jrmsu-arms.online/api/version-2/services/credential/token/request'
const ARMS_LOGIN_URL = 'https://jrmsu-arms.online/api/version-2/services/student/account/login'
const ARMS_BASE_HEADERS = {
    'User-Agent': 'Coderstation-Protocol',
    'Referer':    'https://jrmsu-election-system.vercel.app/',
    'Origin':     'https://jrmsu-election-system.vercel.app',
}

export default async function handler(request) {
    const origin = request.headers.get('origin') || 'https://ssaam.vercel.app'
    const cors = {
        'Access-Control-Allow-Origin':      origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods':     'POST, OPTIONS',
        'Access-Control-Allow-Headers':     'Content-Type, Authorization, X-SSAAM-College',
        'Content-Type':                     'application/json',
    }

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'POST')
        return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405, headers: cors })

    const fail = (status, message, extra = {}) =>
        new Response(JSON.stringify({ message, ...extra }), { status, headers: cors })

    try {
        const { student_id, password } = await request.json()

        if (!student_id || !password)
            return fail(400, 'Student ID and ARMS password are required.')

        if (!/^\d{2}-[A-Z]-\d{5}$/.test(student_id))
            return fail(400, 'Invalid Student ID format. Use YY-A-NNNNN (e.g. 25-A-01207).')

        const armsApiKey    = 'asaguin.jr@gmail.com'
        const armsApiSecret = 'D43m0nCh41N'

        // Step 1: Request bearer token
        let tokenData
        try {
            const tokenRes  = await fetch(ARMS_TOKEN_URL, {
                method:  'POST',
                headers: { ...ARMS_BASE_HEADERS, 'Api-Key': armsApiKey, 'Api-Secret': armsApiSecret },
            })
            const text = await tokenRes.text()
            if (text.trimStart().startsWith('<'))
                return fail(503, 'Could not reach JRMSU ARMS portal. Please try again later.')
            tokenData = JSON.parse(text)
            if (!tokenRes.ok) return fail(503, 'ARMS service error. Please try again later.')
        } catch {
            return fail(503, 'Could not reach JRMSU ARMS portal. Please try again later.')
        }

        const secretKey = tokenData.Secret_Key ?? tokenData.SecretKey ?? tokenData.secretKey ?? null
        const jwToken   = tokenData.JWToken    ?? tokenData.Token     ?? tokenData.jwToken   ?? null
        if (!secretKey || !jwToken) return fail(503, 'ARMS token response was invalid. Please try again.')

        // Step 2: Authenticate student
        let loginData
        try {
            const loginRes  = await fetch(ARMS_LOGIN_URL, {
                method:  'POST',
                headers: {
                    ...ARMS_BASE_HEADERS,
                    'Secret-Key':    secretKey,
                    'Token':         jwToken,
                    'Authorization': `Bearer ${jwToken}`,
                    'Content-Type':  'application/json',
                },
                body: JSON.stringify({ Username: student_id, Password: password }),
            })
            const text = await loginRes.text()
            if (text.trimStart().startsWith('<'))
                return fail(503, 'Could not reach JRMSU ARMS portal. Please try again later.')
            loginData = JSON.parse(text)
            if (!loginRes.ok || !loginData?.Record)
                return fail(401, 'Incorrect Student ID or ARMS portal password. Please check and try again.')
        } catch {
            return fail(503, 'Could not reach JRMSU ARMS portal. Please try again later.')
        }

        const record    = loginData.Record
        const rawStatus = record.Enrollment_Status ?? record.enrollment_status ?? record.EnrollmentStatus ?? null
        const statusStr = rawStatus ? String(rawStatus).toLowerCase().trim() : null
        const isEnrolled = !statusStr || statusStr.includes('enroll') || statusStr === 'active'

        if (!isEnrolled)
            return fail(403, `Your enrollment status is "${rawStatus}". Only currently enrolled students may register.`, { enrollmentStatus: rawStatus })

        return new Response(JSON.stringify({
            message: 'ARMS verification successful.',
            student: {
                studentId:        record.Student_ID        ?? record.student_id   ?? student_id,
                studentName:      record.Student_Name      ?? record.student_name ?? '',
                email:            record.Email             ?? '',
                college:          record.College           ?? '',
                collegeCode:      record.College_Code      ?? record.college_code ?? '',
                programEnrolled:  record.Program_Enrolled  ?? record.program      ?? '',
                programCode:      record.Program_Code      ?? record.program_code ?? '',
                yearLevel:        record.Year_Level        ?? record.year_level   ?? '',
                semester:         record.Semester          ?? '',
                schoolYear:       record.School_Year       ?? '',
                enrollmentStatus: rawStatus                ?? '',
                sex:              record.Sex               ?? record.Gender       ?? '',
            },
        }), { status: 200, headers: cors })

    } catch {
        return fail(500, 'An unexpected error occurred. Please try again.')
    }
}
