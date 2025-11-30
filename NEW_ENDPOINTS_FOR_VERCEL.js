// ===================================================
// ADD ONLY THESE TWO NEW ENDPOINTS TO YOUR EXISTING BACKEND
// Copy and paste these into your ssaam-api.vercel.app backend
// Place them in your existing routes file after the current /apis/students GET endpoint
// ===================================================

// ============================================================================
// NEW ENDPOINT 1: GET /apis/students/stats
// Purpose: Returns dashboard statistics (all students by program/year)
// Called once when admin dashboard loads
// ============================================================================
app.get('/apis/students/stats', studentAuth, async (req, res) => {
    try {
        const stats = {
            BSCS: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 },
            BSIS: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 },
            BSIT: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 }
        };

        const allStudents = await Student.find();

        allStudents.forEach(student => {
            const program = student.program;
            const yearLevel = student.year_level;
            
            if (stats[program] && stats[program][yearLevel] !== undefined) {
                stats[program][yearLevel]++;
                stats[program].total++;
            }
        });

        res.json({
            stats,
            totalStudents: allStudents.length
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============================================================================
// NEW ENDPOINT 2: GET /apis/students/search
// Purpose: Search/filter students with pagination
// Called when admin searches or filters students in dashboard
// Query params: search, program, yearLevel, page, limit
// ============================================================================
app.get('/apis/students/search', studentAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const program = req.query.program || '';
        const yearLevel = req.query.yearLevel || '';

        // Build query filter
        const filter = {};

        // Text search - search in multiple fields
        if (search.trim()) {
            filter.$or = [
                { student_id: { $regex: search, $options: 'i' } },
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { rfid_code: { $regex: search, $options: 'i' } }
            ];
        }

        // Program filter
        if (program) {
            filter.program = program;
        }

        // Year level filter
        if (yearLevel) {
            filter.year_level = yearLevel;
        }

        // Execute query with pagination
        const students = await Student.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        const total = await Student.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: students,
            pagination: {
                currentPage: page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============================================================================
// END OF NEW ENDPOINTS
// ============================================================================
