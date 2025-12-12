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
- **Notifications System:** Role-based notifications (Admin/MedPub) with fields for title, message, priority, and tracking `posted_by`, `posted_by_name`, `created_at`, `updated_at`, and `was_edited` status. Users can "heart" (like) announcements - liked state persists and shows like count. **Unread notification badge** displays count of unseen announcements in sidebar, cleared when user visits notifications page (tracked via MongoDB using `NotificationSeen` collection for persistent cross-device read status). **Spam prevention** for likes: frontend 2s cooldown per notification with disabled button state; backend rate limiting (15 attempts/minute per user across all notifications, 2s per-notification cooldown) with HTTP 429 responses.
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

1. **Enhanced Custom Calendar Picker:** Replaced native date input with a modern custom calendar picker featuring:
   - Purple-to-pink gradient theme matching SSAAM aesthetic
   - Month/year navigation with smooth transitions
   - Today highlighting with ring accent
   - Selected date with gradient background and scale animation
   - "Today" and "Clear" quick action buttons
   - Selected date preview display
   - Proper timezone handling

2. **Enhanced Time Picker (Any Minute Selection):** Redesigned time picker with:
   - Clock-face visual design with gradient theme
   - 2-digit format display for both hours and minutes (e.g., "08:31" instead of "8:31")
   - Minute selection allows any value from 0-59 (not restricted to 30-minute intervals)
   - Auto-set end time feature: when setting start time, end time is automatically set to +30 minutes if empty

3. **Automated Event Status:** Event status is now calculated automatically based on date/time:
   - **Upcoming** - If the current date/time is before the event starts
   - **Active** - If the current date/time is within the event period (accepting check-ins)
   - **Completed** - If the event has ended
   - Status is recalculated when events are created or updated

4. **Clear All Session Tokens:** New admin feature in Settings page that allows force-logout of all users (except current admin session). Includes confirmation modal with warning message.

5. **RFID Scanner Fullscreen Mode:** New fullscreen button that launches an immersive RFID scanning interface with:
   - Full-screen purple gradient background
   - Large centered RFID input field
   - User photo display on successful scan (with fallback to initials)
   - ESC key or X button to exit
   - Smooth animations and transitions

6. **Purple-to-Pink Gradient Theme:** Updated check-in highlighter and scan result displays to use the SSAAM purple-to-pink gradient instead of green.

7. **User Photo in RFID Scanner:** RFID scan results now display the student's photo when available, with elegant fallback to initials.

## Recent Updates (December 2024)

1. **Enhanced RFID Verification Stats with Expandable Lists:** The admin statistics section now displays three RFID status categories with accurate counts:
   - **Verified** - Users with rfid_status set to 'verified'
   - **Unverified** - Users with rfid_status set to 'unverified' or null/empty
   - **Unreadable** - Users with any other rfid_status value (neither verified nor unverified)
   - Each stat card is clickable and expands to show a full list of users in that category
   - Lists display Student ID, Name, Program, RFID Code, and Status
   - Backend stats endpoint now returns all three counts directly for accurate display

2. **RFID Status Filter:** Added a new filter dropdown in the admin user management section that allows filtering students by RFID verification status (All, Verified, Unverified). The filter is sent as `rfid_status` query parameter to the backend.

3. **RFID Status Column:** Added a new column in the user management table showing each student's RFID verification status with visual badges (green for verified, yellow for unverified).

4. **Refresh My Data Button:** Added a "Refresh My Data" button in the user profile section that fetches the latest user data from the API and updates localStorage without requiring logout/login. This keeps the session synchronized with server-side changes.

## Previous Updates (December 2024)

1. **Improved Attendance Status Display:** The user dashboard attendance history now displays proper status labels:
   - **Present** - When both check-in AND check-out are recorded
   - **Incomplete** - When only check-in OR only check-out is recorded
   - **Absent** - When the event has ended and neither check-in nor check-out was recorded
   - **Pending** - When the event is still active and attendance hasn't been recorded yet

2. **MongoDB-Based Notification Read Tracking:** Replaced localStorage-based notification read status with MongoDB storage using the `NotificationSeen` collection. This ensures read status persists across devices and browser sessions.

## Feature Improvements (December 2024)

1. **Manual-Only Attendance Refresh:** Removed automatic 30-second attendance refresh for students. Users now must use the manual Refresh button to update attendance data, reducing server load and giving users control.

2. **Event Ended Notification (Dismissible):** When an event ends, a modal notification appears showing the event has ended. The notification:
   - Only shows once per event (tracked in localStorage)
   - Can be dismissed with "Got it, don't show again" button
   - Never shows again for that specific event after dismissal

3. **Duplicate Records Search (Admin Settings):** New admin feature to search for duplicate records:
   - Search by RFID code, Student ID, or Email address
   - Shows all matching records with categorized match types (RFID/Email/ID/Name)
   - Flags true duplicates with a red "DUPLICATE!" badge when multiple records share the same value
   - Displays notification when duplicates are found

4. **Gmail-Only Registration:** Registration is now restricted to Gmail addresses only:
   - Frontend validation: Only `@gmail.com` emails accepted
   - Backend validation: Same restriction enforced server-side
   - Clear error message: "Only Gmail addresses (@gmail.com) are allowed for registration"

5. **Duplicate Email Prevention:** Backend now checks for duplicate email addresses during registration:
   - Case-insensitive comparison (normalized to lowercase)
   - Prevents the same email from being registered twice
   - Error message: "This email address is already registered"

6. **Notification Badge (Verified):** The notification badge correctly shows unread count using server-side tracking via MongoDB. Read status persists across devices and sessions.

7. **Dual-Mode Attendance Scanner:** RFID scanner now supports two input modes:
   - **RFID Scan Mode** (default) - For scanning RFID cards
   - **Student ID Mode** - For manual entry of Student IDs (for students without RFID)
   - Mode toggle button in scanner interface
   - Backend tracks input method via `input_method` field in attendance logs

8. **Duplicate Records Edit/Delete:** Auto-scan duplicate results now include action buttons:
   - **Edit** - Opens student edit modal with pre-filled data
   - **Delete** - Removes duplicate record with confirmation
   - Respects admin action token flow to prevent "invalid token" errors
   - Auto-refreshes scan results after delete

9. **Responsive Calendar Picker:** Event creation calendar modal is now fully responsive:
   - Properly sized on narrow mobile screens
   - No overlapping elements
   - Day headers use single letters on mobile
   - Scaled buttons and spacing for touch-friendly interaction

## External Dependencies
- **Backend API:** `https://ssaam-api.vercel.app` (Vercel deployment)
- **Image Hosting:** ImgBB (for image uploads and storage)
- **Email Service:** Gmail SMTP via Nodemailer (for password reset and RFID verification emails)
- **Database:** MongoDB (for storing application settings and student data)