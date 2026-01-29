# DEBUG API Documentation - Attendance Custom Events

## Overview
The DEBUG API provides endpoints for enriching custom event attendance data with complete student information including name, student ID, program, and year level.

---

## Endpoints

### 1. **Get Enriched Single Custom Event Data**
**Endpoint:** `GET /apis/debug/attendance/events/:eventId/enrich`

**Authentication:** Admin or Treasurer required

**Purpose:** Retrieves a specific custom event with all assigned users and their attendance logs, enriched with student information.

**Parameters:**
- `eventId` (path parameter): MongoDB ID of the custom event

**Response Format:**
```json
{
  "success": true,
  "message": "Custom event data enriched with student information",
  "data": {
    "event": {
      "_id": "...",
      "title": "Event Name",
      "description": "...",
      "location": "...",
      "event_date": "2026-01-29T...",
      "start_time": "08:00",
      "end_time": "17:00",
      "status": "active",
      "created_at": "..."
    },
    "assigned_users": [
      {
        "_id": "...",
        "name": "Student Name",
        "student_id": "21-A-12345",
        "program": "BSCS",
        "year": "2nd Year"
      }
    ],
    "attendance_logs": [
      {
        "_id": "...",
        "name": "Student Name",
        "student_id": "21-A-12345",
        "program": "BSCS",
        "year": "2nd Year",
        "check_in_at": "2026-01-29T08:15:30Z",
        "check_out_at": "2026-01-29T17:45:20Z",
        "status": "present",
        "session_id": "..."
      }
    ],
    "summary": {
      "total_assigned": 50,
      "total_attended": 48,
      "total_absent": 2,
      "total_logs": 48
    }
  }
}
```

**Fields Included:**
- **name**: Student full name
- **student_id**: Unique student ID (e.g., "21-A-12345")
- **program**: Student program (BSCS, BSIT, BSIS)
- **year**: Year level (1st Year, 2nd Year, 3rd Year, 4th Year)
- **check_in_at**: Timestamp when student checked in
- **check_out_at**: Timestamp when student checked out
- **status**: Attendance status (present, absent, late)

---

### 2. **Get All Custom Events with Enriched Data**
**Endpoint:** `GET /apis/debug/attendance/custom-events/all`

**Authentication:** Admin or Treasurer required

**Purpose:** Retrieves all custom events with assigned users and attendance summary, sorted by latest first.

**Response Format:**
```json
{
  "success": true,
  "message": "Retrieved all custom events with enriched student data",
  "total": 5,
  "data": [
    {
      "event": {
        "_id": "...",
        "title": "Event Name",
        "description": "...",
        "event_date": "2026-01-29T...",
        "status": "active"
      },
      "assigned_users": [
        {
          "_id": "...",
          "name": "Student Name",
          "student_id": "21-A-12345",
          "program": "BSCS",
          "year": "2nd Year"
        }
      ],
      "attendance_summary": {
        "total_assigned": 50,
        "total_attended": 48,
        "total_absent": 2
      }
    }
  ]
}
```

---

### 3. **Export Custom Event Data as CSV**
**Endpoint:** `GET /apis/debug/attendance/events/:eventId/export-enriched`

**Authentication:** Admin or Treasurer required

**Purpose:** Exports custom event attendance data as a CSV file with complete student information.

**Parameters:**
- `eventId` (path parameter): MongoDB ID of the custom event

**CSV Format:**
```
Name,Student ID,Program,Year,Check-in Time,Check-out Time,Status
"Student Name","21-A-12345","BSCS","2nd Year","1/29/2026, 8:15:30 AM","1/29/2026, 5:45:20 PM","present"
"Another Student","21-A-12346","BSIT","3rd Year","N/A","N/A","absent"
```

**File Output:**
- Downloads as `attendance-{EventTitle}-{eventId}.csv`
- All assigned users are included, with "N/A" for no-show entries

---

## Data Fields Reference

### Student Information Fields Added:
| Field | Description | Example |
|-------|-------------|---------|
| `name` | Full name of student | "Juan Dela Cruz" |
| `student_id` | Unique student identifier | "21-A-12345" |
| `program` | Degree program | "BSCS", "BSIT", "BSIS" |
| `year` | Year level | "1st Year", "2nd Year", "3rd Year", "4th Year" |

### Attendance Fields Included:
| Field | Description | Example |
|-------|-------------|---------|
| `check_in_at` | Check-in timestamp | "2026-01-29T08:15:30Z" |
| `check_out_at` | Check-out timestamp | "2026-01-29T17:45:20Z" |
| `status` | Attendance status | "present", "absent", "late" |
| `session_id` | Related session ID | MongoDB ObjectId |

---

## Usage Examples

### Using cURL

**Example 1: Get enriched event data**
```bash
curl -X GET \
  'http://localhost:5000/apis/debug/attendance/events/660a1b2c3d4e5f6g7h8i9j0k/enrich' \
  -H 'Authorization: Bearer <your-token>'
```

**Example 2: Get all custom events**
```bash
curl -X GET \
  'http://localhost:5000/apis/debug/attendance/custom-events/all' \
  -H 'Authorization: Bearer <your-token>'
```

**Example 3: Export to CSV**
```bash
curl -X GET \
  'http://localhost:5000/apis/debug/attendance/events/660a1b2c3d4e5f6g7h8i9j0k/export-enriched' \
  -H 'Authorization: Bearer <your-token>' \
  -o attendance-report.csv
```

### Using JavaScript/Fetch

```javascript
// Get enriched event data
const response = await fetch(
  '/apis/debug/attendance/events/{eventId}/enrich',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data.data.assigned_users); // Array with name, student_id, program, year
console.log(data.data.attendance_logs); // Array with attendance data
```

---

## Authentication Requirements

All DEBUG endpoints require:
- **Admin** role OR
- **Treasurer** role

Requests without proper authentication will return a 401 Unauthorized error.

---

## Error Responses

### 404 - Event Not Found
```json
{
  "success": false,
  "message": "Event not found"
}
```

### 400 - Not a Custom Event
```json
{
  "success": false,
  "message": "This endpoint only works with custom events"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Error message details"
}
```

---

## Implementation Notes

1. **Data Enrichment**: The API automatically populates all student fields from either the assigned users list or attendance logs, whichever has the data.

2. **Attendance Summary**: Automatically calculates:
   - Total assigned users
   - Total attended (students with check-in or present status)
   - Total absent (assigned - attended)

3. **CSV Export**: Includes all assigned users for the event, marking absent students with "N/A" for timestamps.

4. **Performance**: These are DEBUG endpoints and should be used for reporting/analysis, not for real-time operations.

---

## Testing Checklist

- [ ] Test with a valid custom event ID
- [ ] Verify all student fields are populated (name, student_id, program, year)
- [ ] Verify attendance fields are included (check_in_at, check_out_at, status)
- [ ] Test CSV export generates correct file format
- [ ] Test with non-custom events (should return 400)
- [ ] Test with invalid event ID (should return 404)
- [ ] Verify authentication is enforced
- [ ] Check data accuracy against database

---

## Future Enhancements

1. Add filtering options (by program, year level, status)
2. Add date range filtering for attendance logs
3. Add sorting options for API responses
4. Add pagination for large datasets
5. Add Excel export format
6. Add JSON-to-PDF conversion for reports
