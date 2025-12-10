# SSAAM - Student School Activities Attendance Monitoring

## Overview
SSAAM is a Vue 3 + Vite frontend application designed for monitoring student attendance at school activities. This Single Page Application (SPA) integrates with a backend API to provide dual-role authentication (Students and Masters/Teachers), comprehensive student data management with CRUD operations, and features like RFID code support for attendance. The project aims to provide a robust, scalable, and secure system for schools to track student engagement in activities efficiently, addressing performance concerns with large datasets through optimized pagination and server-side filtering.

## User Preferences
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.
- I prefer simple language.
- I like functional programming.

## System Architecture
The application is a Vue 3 SPA utilizing the Composition API and Vite 5 for a modern frontend build. Styling is handled by Tailwind CSS, and routing by Vue Router 4.

**UI/UX Decisions:**
- Professional SVG icon system.
- Mobile-first design with a smooth animated hamburger menu.
- Custom scrollbar styling (purple/pink gradient) for aesthetic consistency.
- Notifications display links with a purple-to-pink gradient.

**Technical Implementations & Feature Specifications:**
- **Authentication:** Dual-role (Students by numeric ID, Masters/Teachers by letter-starting ID) with API-based Bearer token. Encrypted timestamp authentication with XOR+Base64 encoding for all protected API calls, including anti-bot protection (User-Agent validation, bot pattern detection, rate limiting) for registration.
- **Student Management:**
    - Admin/Master dashboard with full CRUD for student records.
    - Search/filter functionality with pagination (10-20 students per page).
    - Student names are automatically converted to uppercase.
    - Student ID validation restricts IDs to `21-A-XXXXX` through `25-A-XXXXX`.
    - Admin-only access for edit/delete student operations.
- **Attendance:** RFID code support for attendance. Students receive email notifications upon RFID verification.
- **Global RFID Scanner Controls:** Admins can enable/disable check-in and check-out globally from the RFID Scanner tab. Includes auto-disable timer functionality that automatically locks check-in or check-out after a specified number of minutes. The timer is enforced server-side during RFID scans.
- **Dashboard Statistics:** Displays aggregate student statistics by program and year level, fetched from a dedicated, non-paginated endpoint for complete data.
- **Image Management:** Integrates with ImgBB for image uploads. For notifications, users can upload images directly (click-to-upload interface) which are **compressed to under 100KB** before being sent to ImgBB via the backend API. The backend handles the ImgBB upload and returns the hosted URL.
- **Form Validation:** Advanced validation with custom error messages (e.g., Student ID format `12-A-12345`, Unicode support for names including Ñ/enye).
- **Notifications System:** Role-based notifications (Admin/MedPub) with fields for title, message, priority, and tracking `posted_by`, `posted_by_name`, `created_at`, `updated_at`, and `was_edited` status. Users can "heart" (like) announcements - liked state persists and shows like count. **Unread notification badge** displays count of unseen announcements in sidebar, cleared when user visits notifications page (tracked via localStorage). **Spam prevention** for likes: frontend 2s cooldown per notification with disabled button state; backend rate limiting (15 attempts/minute per user across all notifications, 2s per-notification cooldown) with HTTP 429 responses.
- **Password Reset:** Three-step email-based password reset with rate limiting, hashed codes, enumeration prevention, and atomic operations. Frontend includes "Forgot Password?" link on login page with full reset flow UI.
- **Admin Settings:** A settings page allows Admins/Masters to toggle user registration and student login, displaying custom messages when features are disabled. Settings are stored in MongoDB.

**System Design Choices:**
- **Efficient Pagination:** Frontend displays only the current page (10-20 students). Statistics are fetched separately to ensure complete dashboard data without performance overhead. All search and filtering operations are performed server-side.
- **Security:** Robust validation and anti-bot measures are implemented, including timestamp-based authentication for API calls.
- **API Integration:** Designed to work with `https://ssaam-api.vercel.app` for all data operations.

## Security Improvements (December 2024)
The following security hardening measures were implemented to prevent website defacement, injection attacks, and unauthorized access:

1. **Protected Admin Creation Endpoint:** The `/apis/masters` POST endpoint now requires:
   - Existing admin authentication (`auth` middleware)
   - Timestamp validation (`timestampAuth` middleware)
   - A secret `MASTER_CREATION_SECRET` environment variable
   - Username validation (4-32 chars, alphanumeric + underscores only)
   - Minimum 12-character password requirement

2. **Restricted CORS Origins:** CORS is now limited to:
   - `https://ssaam.vercel.app`
   - `https://ssaam-api.vercel.app`
   - Configurable `FRONTEND_URL` env var
   - `localhost:5000` and `localhost:3000` (development only)
   - All `*.replit.dev` and `*.repl.co` domains (for Replit development)

3. **Regex Injection Prevention:** Added `escapeRegex()` function to sanitize user input before using in MongoDB `$regex` queries, preventing ReDoS attacks.

4. **XSS Prevention:** Added `sanitizeHtml()` function that escapes HTML entities in notification titles and messages.

5. **Required Environment Secrets:** The following secrets are now required (no hardcoded defaults):
   - `SSAAM_API_KEY`
   - `SSAAM_CRYPTO_KEY`
   - `ADMIN_VERIFICATION_SECRET`
   - `MASTER_CREATION_SECRET` (for creating new admin accounts)

6. **Like Data Cleanup:** When a student is deleted or re-approved after re-registration, their like data is automatically removed from all notifications to prevent stale data issues.

7. **Security Headers:** All responses include:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `Content-Security-Policy: default-src 'self'`

## Recent UI/UX Improvements (December 2024)
The following UI/UX enhancements were implemented to match the SSAAM aesthetic:

1. **Enhanced Time Picker (0-59 Minutes):** Redesigned time picker with clock-face visual design, purple-to-pink gradient theme, and ability to select any minute from 0-59 (previously limited to 5-minute increments). Includes quick-select grid for all 60 minutes.

2. **Clear All Session Tokens:** New admin feature in Settings page that allows force-logout of all users (except current admin session). Includes confirmation modal with warning message.

3. **RFID Scanner Fullscreen Mode:** New fullscreen button that launches an immersive RFID scanning interface with:
   - Full-screen purple gradient background
   - Large centered RFID input field
   - User photo display on successful scan (with fallback to initials)
   - ESC key or X button to exit
   - Smooth animations and transitions

4. **Purple-to-Pink Gradient Theme:** Updated check-in highlighter and scan result displays to use the SSAAM purple-to-pink gradient instead of green.

5. **User Photo in RFID Scanner:** RFID scan results now display the student's photo when available, with elegant fallback to initials.

## External Dependencies
- **Backend API:** `https://ssaam-api.vercel.app` (Vercel deployment)
- **Image Hosting:** ImgBB (for image uploads and storage)
- **Email Service:** Gmail SMTP via Nodemailer (for password reset and RFID verification emails)
- **Database:** MongoDB (for storing application settings and student data)