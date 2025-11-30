# SSAAM - Student School Activities Attendance Monitoring

## Overview
A Vue 3 + Vite frontend application for monitoring student attendance at school activities. This is a Single Page Application (SPA) integrated with a backend API for user authentication and student data management.

## Project Structure
- **Framework**: Vue 3 with Composition API (script setup)
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Routing**: Vue Router 4
- **Backend API**: https://ssaam-api.vercel.app

## Key Features
- Dual-role authentication: Students (numeric IDs) and Masters/Teachers (letter-starting IDs)
- API-based student data management with Bearer token authentication
- Admin/Master dashboard with full CRUD operations on student records
- User statistics by program and year level (fetched separately from dedicated endpoint)
- Search/filter with pagination (10-20 students per page)
- RFID code support for attendance
- Professional SVG icon system throughout
- Help/Contact modal accessible from Login and Dashboard
- Mobile hamburger menu with smooth animations
- Advanced form validation with custom error messages
- Image management via ImgBB with 200KB compression and 3-attempt retry
- Team member photos in developer popup

## Configuration
- **Dev Server**: Port 5000, host 0.0.0.0
- **Vite Config**: Configured with `allowedHosts: true` for Replit proxy compatibility
- **API Base**: `https://ssaam-api.vercel.app`

## Backend Endpoints (Latest - 2025-11-30)

### Existing Endpoints
- **GET** `/apis/students` - Paginated list (10-20 per page)
- **POST** `/apis/students` - Create new student
- **PUT** `/apis/students/{student_id}` - Update student
- **DELETE** `/apis/students/{student_id}` - Delete student
- **POST** `/apis/students/login` - Student login
- **POST** `/apis/masters/login` - Master/admin login

### New Endpoints (Pagination Architecture - Latest)
- **GET** `/apis/students/stats` - Dashboard statistics (all students by program/year)
- **GET** `/apis/students/search` - Search/filter with pagination
  - Query params: `search`, `program`, `yearLevel`, `page`, `limit`
  - Returns paginated results only (10-20 per page)

## Pagination Architecture

### Why Pagination?
- Prevents lag with thousands of students in database
- Only loads 10-20 students per page for optimal performance
- Statistics fetched separately without pagination for complete data

### Frontend Logic
1. **Page Load**: Fetch page 1 (10 students) + fetch stats separately
2. **Search**: Call `/apis/students/search` with filters, reset to page 1
3. **Navigation**: Click Next/Previous to fetch other pages
4. **Filters**: Dropdown changes trigger new search query

### Backend Logic
- `/apis/students` - Returns only current page (limit 10-20)
- `/apis/students/stats` - Returns aggregated counts for all students
- `/apis/students/search` - Filters and returns paginated results

## Authentication & API Integration

### Login Flow
- **Students** (ID starts with number): POST `/apis/students/login` 
- **Masters/Teachers** (ID starts with letter): POST `/apis/masters/login`

### Admin Dashboard Features
- **Greeting**: Shows "Welcome back, Admin!" for both admin and master users
- **Manage Tab**: Access available to both admin and master users
- **Student Pagination**: Shows 10 students per page with Next/Previous buttons
- **Search/Filter**: 
  - Search by Name, Email, Student ID, RFID Code
  - Filter by Program (BSCS, BSIS, BSIT)
  - Filter by School Level (1st-4th year)
  - Pagination resets to page 1 on filter change
- **Statistics Dashboard**: Shows all students by program/year (fetched from `/apis/students/stats`)
- **Full CRUD**: Edit (name, email, program, year level) or delete students

### API Keys & Secrets
- **SSAAM_API_KEY**: Bearer token for master login (stored as Replit secret)
- **SSAAM_STUDENTS_API_KEY**: Bearer token for student operations (hardcoded: SSAAMStudents)

## Image Management
- **Compression**: Images compressed from 600KB to 200KB using progressive quality reduction
- **Upload Service**: ImgBB with random API key distribution
- **Retry Logic**: 3-attempt automatic retry if upload fails (1 second delay between attempts)
- **Supported Formats**: JPEG (optimized for size)

## Development Notes
- Form validation: Student ID format (`12-A-12345`), name validation (Unicode support: ñ, á, é, etc.)
- Error notifications styled in red for clear visibility
- Mobile responsive design with hamburger menu
- Cross-browser password field styling (hidden native controls, custom visibility toggle)
- Dashboard statistics show COMPLETE count of all students (not just current page)
- Pagination UI shows: "Page X of Y (Total: Z students)"

## Architecture
Frontend SPA with efficient pagination:
- Displays current page only (10-20 students)
- Fetches statistics separately for complete dashboard data
- Uses dedicated search endpoint for filtered results
- Backend aggregates all student data for statistics
- No client-side filtering - all search/filter done server-side

## Latest Updates (2025-11-30)

### Pagination & Statistics Separation (LATEST)
- **New Endpoint**: `/apis/students/stats` for dashboard statistics
- **New Endpoint**: `/apis/students/search` for search/filter with pagination
- **Frontend Changes**: 
  - Only fetches current page (10 students) on load
  - Fetches statistics from separate endpoint
  - Search/filter uses dedicated search endpoint
  - Pagination buttons: Next/Previous to navigate pages
  - All filtering done server-side for performance
- **Performance**: No longer loads all pages - reduces load time and database queries
- **Image Compression**: 200KB target with 3-attempt retry on upload failure
