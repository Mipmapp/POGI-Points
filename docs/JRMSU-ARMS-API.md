# JRMSU ARMS API — Integration Documentation

> **Scope:** This document covers the JRMSU ARMS (Academic Records Management System) API as consumed by SSAAM (Student School Activities Attendance Monitoring).  
> Two SSAAM endpoints wrap the external ARMS API: one for **account creation / registration** and one for **logged-in student self-validation** from the dashboard.

---

## Table of Contents

1. [External ARMS API](#1-external-arms-api)
   - [Step 1 — Request Bearer Token](#step-1--request-bearer-token)
   - [Step 2 — Authenticate Student](#step-2--authenticate-student)
2. [SSAAM Endpoint — Registration Verify](#2-ssaam-endpoint--registration-verify-post-apistudentsarms-verify)
3. [SSAAM Endpoint — Dashboard Self-Validate](#3-ssaam-endpoint--dashboard-self-validate-post-apistudentsself-arms-validate)
4. [Shared Verification Flow](#4-shared-verification-flow)
5. [ARMS Record Field Reference](#5-arms-record-field-reference)
6. [Semester & Year Level Normalization](#6-semester--year-level-normalization)
7. [Error Reference](#7-error-reference)

---

## 1. External ARMS API

SSAAM calls two ARMS endpoints in sequence on every verification. These are internal JRMSU services — SSAAM acts as a proxy/consumer.

### Required Server-Side Environment Variables

| Variable | Description |
|---|---|
| `ARMS_API_KEY` | API key issued by JRMSU ARMS |
| `ARMS_API_SECRET` | API secret issued by JRMSU ARMS |

Both are **server-side only** — never exposed to the frontend.

---

### Step 1 — Request Bearer Token

Obtains a short-lived `JWToken` + `Secret_Key` pair used to authenticate the student login call.

**Request**

```
POST https://jrmsu-arms.online/api/version-2/services/credential/token/request
```

| Header | Value |
|---|---|
| `Api-Key` | `<ARMS_API_KEY>` |
| `Api-Secret` | `<ARMS_API_SECRET>` |
| `User-Agent` | `Coderstation-Protocol` |
| `Referer` | `https://jrmsu-election-system.vercel.app/` |
| `Origin` | `https://jrmsu-election-system.vercel.app` |

_No request body._

**Success Response — `200 OK`**

```json
{
  "JWToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Secret_Key": "some-secret-string"
}
```

> Field name aliases SSAAM also accepts: `Token` / `jwToken` for the token; `SecretKey` / `secretKey` for the secret key.

**Failure Response**

Any non-2xx HTTP status. SSAAM surfaces this as:

```json
{ "message": "ARMS service error. Please try again later." }
```

---

### Step 2 — Authenticate Student

Validates the student's ARMS credentials and returns their enrollment record.

**Request**

```
POST https://jrmsu-arms.online/api/version-2/services/student/account/login
```

| Header | Value |
|---|---|
| `Token` | `<JWToken from Step 1>` |
| `Authorization` | `Bearer <JWToken from Step 1>` |
| `Secret-Key` | `<Secret_Key from Step 1>` |
| `Content-Type` | `application/json` |
| `User-Agent` | `Coderstation-Protocol` |
| `Referer` | `https://jrmsu-election-system.vercel.app/` |
| `Origin` | `https://jrmsu-election-system.vercel.app` |

**Request Body**

```json
{
  "Username": "26-A-02477",
  "Password": "<student's ARMS portal password>"
}
```

| Field | Type | Description |
|---|---|---|
| `Username` | `string` | Student ID in format `YY-A-NNNNN` (e.g. `26-A-02477`) |
| `Password` | `string` | Student's JRMSU ARMS portal password |

**Success Response — `200 OK`**

```json
{
  "Record": {
    "Student_ID":        "26-A-02477",
    "Student_Name":      "ROMER VAL GABRIEL PAYOT CARACOL",
    "Email":             "caracolromer@gmail.com",
    "College":           "College of Computing Studies",
    "College_Code":      "CCS",
    "Program":           "BSCS -BACHELOR OF SCIENCE IN COMPUTER SCIENCE",
    "Major":             "",
    "Year_Level":        "1st Year",
    "Semester":          "1st",
    "School_Year":       "2026-2027",
    "Enrollment_Status": "Enrolled",
    "Sex":               "Male"
  }
}
```

**Failure — Invalid Credentials — `401 Unauthorized`**

```json
{
  "Record": null
}
```

SSAAM surfaces this as:

```json
{
  "message": "Incorrect Student ID or ARMS portal password. Please check and try again."
}
```

---

## 2. SSAAM Endpoint — Registration Verify (`POST /apis/students/arms-verify`)

**Used during:** Account creation / Register page — Step "Verify with ARMS".  
The student enters their Student ID and ARMS password before filling in the registration form. On success, the form is pre-filled with data from ARMS.

### Authentication

| Header | Value |
|---|---|
| `Authorization` | `Bearer SSAAMStudents` |
| `Content-Type` | `application/json` |

> This endpoint is guarded by `studentAuth` — a lightweight shared token used for pre-registration calls.

### Request Body

```json
{
  "student_id": "26-A-02477",
  "password":   "<ARMS portal password>"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `student_id` | `string` | ✅ | Must match `^\d{2}-[A-Z]-\d{5}$` (e.g. `26-A-02477`) |
| `password` | `string` | ✅ | Non-empty |

### Success Response — `200 OK`

```json
{
  "message": "ARMS verification successful.",
  "student": {
    "studentId":        "26-A-02477",
    "studentName":      "ROMER VAL GABRIEL PAYOT CARACOL",
    "email":            "caracolromer@gmail.com",
    "college":          "College of Computing Studies",
    "collegeCode":      "CCS",
    "program":          "BSCS -BACHELOR OF SCIENCE IN COMPUTER SCIENCE",
    "major":            "",
    "yearLevel":        "1st Year",
    "semester":         "1st",
    "schoolYear":       "2026-2027",
    "enrollmentStatus": "Enrolled",
    "sex":              "Male"
  }
}
```

> **Note on `program`:** ARMS returns the value as `"SHORTCODE -FULL NAME"` (e.g. `"BSCS -BACHELOR OF SCIENCE IN COMPUTER SCIENCE"`). The frontend extracts the shortcode prefix (everything before the first `-`) to auto-fill the program dropdown.

### Frontend Behaviour After Success

The Register page auto-fills the form using the returned `student` object:

| ARMS field | Auto-fills form field |
|---|---|
| `studentId` | `student_id` (locked, read-only) |
| `yearLevel` | `year_level` (mapped via `mapArmsYearLevel`) |
| `program` | `program` (shortcode extracted, matched to `BSCS / BSIT / BSIS / BSM`) |

---

## 3. SSAAM Endpoint — Dashboard Self-Validate (`POST /apis/students/self-arms-validate`)

**Used during:** Student dashboard → "Validate Enrollment" card.  
An already-approved, logged-in student re-confirms their current semester enrollment. On success, their `school_year`, `semester`, and `year_level` are stamped onto their database record.

### Authentication

| Header | Value |
|---|---|
| `Authorization` | `Bearer <student JWT session token>` |
| `Content-Type` | `application/json` |
| `X-SSAAM-College` | College code (e.g. `CCS`) |

> This endpoint is guarded by `studentAuthWithToken`. The `student_id` is read directly from the verified JWT — it **cannot be spoofed via the request body**.

### Request Body

```json
{
  "password": "<ARMS portal password>"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `password` | `string` | ✅ | Student's JRMSU ARMS portal password |

> `student_id` is **not** accepted in the body — it is always taken from the authenticated JWT.

### Success Response — `200 OK`

```json
{
  "message":  "Enrollment validated successfully via ARMS.",
  "validated": true,
  "armsStudent": {
    "studentName":      "ROMER VAL GABRIEL PAYOT CARACOL",
    "semester":         "1st Sem",
    "schoolYear":       "2026-2027",
    "program":          "BSCS -BACHELOR OF SCIENCE IN COMPUTER SCIENCE",
    "yearLevel":        "1st Year",
    "enrollmentStatus": "Enrolled"
  },
  "updated": {
    "school_year": "2026-2027",
    "semester":    "1st Sem",
    "year_level":  "1st Year"
  }
}
```

| Field | Description |
|---|---|
| `armsStudent` | Raw (normalized) values returned from ARMS |
| `updated` | The values actually written to the student's database record |

> `semester` and `year_level` in `armsStudent` are **normalized** from the raw ARMS format — see [§ 6 Normalization](#6-semester--year-level-normalization).

### Frontend Behaviour After Success

The dashboard immediately patches `currentUser` in memory and `localStorage` without requiring a page reload:

```
currentUser.school_year  ← updated.school_year
currentUser.semester     ← updated.semester
currentUser.year_level   ← updated.year_level   (if returned)
```

---

## 4. Shared Verification Flow

Both SSAAM endpoints call the same internal `callARMSVerify(student_id, password)` helper. The full sequence is:

```
Client (Register / Dashboard)
        │
        ▼
SSAAM Backend (/apis/students/arms-verify  OR  /apis/students/self-arms-validate)
        │
        ├─ [1] POST https://jrmsu-arms.online/.../credential/token/request
        │         Headers: Api-Key, Api-Secret
        │         Response: { JWToken, Secret_Key }
        │
        ├─ [2] POST https://jrmsu-arms.online/.../student/account/login
        │         Headers: Token, Secret-Key, Authorization
        │         Body:    { Username: student_id, Password: password }
        │         Response: { Record: { ... enrollment data ... } }
        │
        ├─ [3] Enrollment check
        │         Enrollment_Status must contain "enroll" or equal "active"
        │         Anything else → 403 Forbidden
        │
        └─ [4] Return result to client
                 arms-verify       → student data object (for form pre-fill)
                 self-arms-validate → stamp DB record, return updated fields
```

---

## 5. ARMS Record Field Reference

The raw `Record` object returned by the ARMS login endpoint:

| ARMS Field | Type | Example | Notes |
|---|---|---|---|
| `Student_ID` | `string` | `"26-A-02477"` | SSAAM format `YY-A-NNNNN` |
| `Student_Name` | `string` | `"ROMER VAL GABRIEL PAYOT CARACOL"` | Full name, all caps |
| `Email` | `string` | `"caracolromer@gmail.com"` | May be empty |
| `College` | `string` | `"College of Computing Studies"` | Full college name |
| `College_Code` | `string` | `"CCS"` | Short code |
| `Program` | `string` | `"BSCS -BACHELOR OF SCIENCE IN COMPUTER SCIENCE"` | `SHORTCODE -FULL NAME` |
| `Major` | `string` | `""` | Usually empty for undergrad |
| `Year_Level` | `string` | `"1st Year"` | Raw format varies — see § 6 |
| `Semester` | `string` | `"1st"` | Raw format varies — see § 6 |
| `School_Year` | `string` | `"2026-2027"` | Academic year range |
| `Enrollment_Status` | `string` | `"Enrolled"` | Used for eligibility check |
| `Sex` | `string` | `"Male"` | May also appear as `Gender` |

> SSAAM also accepts lowercase/camelCase aliases for all fields (e.g. `student_id`, `student_name`, `college_code`, `enrollment_status`) in case the ARMS API changes its casing.

---

## 6. Semester & Year Level Normalization

ARMS returns raw string values for semester and year level that vary in format. SSAAM normalizes them to its canonical internal values.

### Semester

| Raw ARMS value (examples) | Normalized SSAAM value |
|---|---|
| `"1st"`, `"1st Semester"`, `"1st Sem"`, `"1"` | `"1st Sem"` |
| `"2nd"`, `"2nd Semester"`, `"2nd Sem"`, `"2"` | `"2nd Sem"` |

**Rule:** If the raw value starts with `"2"` → `"2nd Sem"`. If it starts with `"1"` → `"1st Sem"`. Otherwise kept as-is.

### Year Level

Normalized to SSAAM canonical values: `1st Year` / `2nd Year` / `3rd Year` / `4th Year` / `5th Year`.

| Raw ARMS value (examples) | Normalized SSAAM value |
|---|---|
| `"1"`, `"1ST"`, `"1ST YR"`, `"1ST YEAR"`, `"FIRST"`, `"FIRST YEAR"` | `"1st Year"` |
| `"2"`, `"2ND"`, `"2ND YR"`, `"SECOND YEAR"` | `"2nd Year"` |
| `"3"`, `"3RD"`, `"3RD YR"`, `"THIRD YEAR"` | `"3rd Year"` |
| `"4"`, `"4TH"`, `"4TH YR"`, `"FOURTH YEAR"` | `"4th Year"` |
| `"5"`, `"5TH"`, `"5TH YR"`, `"FIFTH YEAR"` | `"5th Year"` |
| `"YEAR 2"`, `"2.0"`, `"2ND YEAR BSIT"` | `"2nd Year"` _(digit fallback)_ |

**Fallback:** If the raw value doesn't match any map entry, SSAAM scans for a lone digit 1–5 and uses it. Unresolved formats are logged as a server-side warning; year level is left unchanged.

---

## 7. Error Reference

All error responses follow the shape `{ "message": "..." }`. Some also include `enrollmentStatus`.

### `POST /apis/students/arms-verify` Errors

| HTTP Status | Condition | `message` |
|---|---|---|
| `400` | Missing `student_id` or `password` | `"Student ID and ARMS password are required."` |
| `400` | Student ID fails format check | `"Invalid Student ID format. Use 25-A-00000 (2 digits, one letter, 5 digits)."` |
| `401` | Wrong Student ID or ARMS password | `"Incorrect Student ID or ARMS portal password. Please check and try again."` |
| `403` | Student not currently enrolled | `"Your enrollment status is \"<status>\". Only currently enrolled students may proceed."` + `enrollmentStatus` field |
| `503` | `ARMS_API_KEY` / `ARMS_API_SECRET` not set | `"ARMS verification is not configured on this server. Please contact your administrator."` |
| `503` | ARMS portal unreachable (network) | `"Could not reach JRMSU ARMS portal. Please try again later."` |
| `503` | ARMS token response malformed | `"ARMS token response was invalid. Please try again."` |
| `500` | Unexpected server error | `"An error occurred during ARMS verification. Please try again."` |

### `POST /apis/students/self-arms-validate` Errors

| HTTP Status | Condition | `message` |
|---|---|---|
| `400` | Missing `password` | `"ARMS portal password is required."` |
| `401` | Wrong ARMS password | `"Incorrect Student ID or ARMS portal password. Please check and try again."` |
| `403` | Student not currently enrolled | `"Your enrollment status is \"<status>\". Only currently enrolled students may proceed."` + `enrollmentStatus` field |
| `404` | Student record not found in DB | `"Student record not found."` |
| `503` | ARMS portal unreachable | `"Could not reach JRMSU ARMS portal. Please try again later."` |
| `500` | Unexpected server error | `"An error occurred during ARMS validation. Please try again."` |

### Client-Side Retry

Both the Register page and the Dashboard validate form implement a **silent one-time retry** on failure:

1. First attempt fires immediately.
2. If it fails (non-2xx or network error), the client waits **2 seconds** then retries once.
3. If the retry also fails, the error message is shown to the user.
