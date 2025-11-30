# SSAAM Backend Setup

## New Endpoints Added

This file documents the new endpoints added to support the pagination and statistics architecture.

### 1. **GET `/apis/students/stats`** (NEW)
Fetches complete dashboard statistics for all registered students without pagination.

**Request:**
```
GET /apis/students/stats
Authorization: Bearer SSAAMStudents
```

**Response:**
```json
{
  "stats": {
    "BSCS": { "1st year": 5, "2nd year": 3, "3rd year": 2, "4th year": 1, "total": 11 },
    "BSIS": { "1st year": 4, "2nd year": 2, "3rd year": 3, "4th year": 2, "total": 11 },
    "BSIT": { "1st year": 6, "2nd year": 4, "3rd year": 1, "4th year": 2, "total": 13 }
  },
  "totalStudents": 35
}
```

**Usage:**
- Called once when admin dashboard loads
- Shows total registered students by program and year level
- No pagination needed - returns complete aggregated data

---

### 2. **GET `/apis/students/search`** (NEW)
Fetches filtered/searched students with pagination support.

**Request:**
```
GET /apis/students/search?search=query&program=BSCS&yearLevel=1st year&page=1&limit=10
Authorization: Bearer SSAAMStudents
```

**Query Parameters:**
- `search` (optional): Search in student_id, first_name, last_name, email, rfid_code
- `program` (optional): Filter by program (BSCS, BSIS, BSIT)
- `yearLevel` (optional): Filter by year level (1st year, 2nd year, 3rd year, 4th year)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "student_id": "24-A-12345",
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "email": "juan@example.com",
      "program": "BSCS",
      "year_level": "1st year",
      "rfid_code": "ABC123",
      "photo": "https://...",
      ...
    }
  ],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Usage:**
- Called when admin searches/filters students
- Supports combined filters (search + program + year level)
- Returns only 10-20 students per page for performance
- Reset to page 1 when filters change

---

### 3. **GET `/apis/students`** (EXISTING - UNCHANGED)
Fetches paginated list of all students without search/filter.

**Request:**
```
GET /apis/students?page=1&limit=10
Authorization: Bearer SSAAMStudents
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Backend Implementation

See `backend/server.js` for the complete updated implementation with all three endpoints.

### Key Changes:
1. Added `/apis/students/stats` endpoint - calculates all program/year statistics
2. Added `/apis/students/search` endpoint - supports text search and filtering
3. All endpoints protected with `studentAuth` middleware
4. Uses MongoDB aggregation for efficient counting and filtering

---

## Environment Variables Required

```
MONGO_URI=your_mongodb_connection_string
SSAAM_STUDENT_API_KEY=SSAAMStudents
JWT_SECRET=your_jwt_secret
```

---

## Integration with Frontend

The frontend in `src/views/Dashboard.vue` now:
- Fetches only 10 students per page from `/apis/students`
- Fetches complete statistics separately from `/apis/students/stats`
- Uses `/apis/students/search` when admin searches or filters
- Implements pagination with Next/Previous buttons
- No longer loads all pages at once for performance
