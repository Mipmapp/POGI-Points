# SSAAM - Student School Activities Attendance Monitoring

## Overview
SSAAM is a Vue 3 + Vite frontend application for monitoring student attendance at school activities. This Single Page Application (SPA) integrates with a backend API to provide dual-role authentication (Students and Masters/Teachers), comprehensive student data management with CRUD operations, and features like RFID code support for attendance. The project aims to provide a robust, scalable, and secure system for schools to track student engagement in activities efficiently, addressing performance concerns with large datasets through optimized pagination and server-side filtering.

## User Preferences
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.
- I prefer simple language.
- I like functional programming.

## System Architecture
The application is a Vue 3 SPA utilizing the Composition API and Vite 5. Styling is handled by Tailwind CSS, and routing by Vue Router 4.

**UI/UX Decisions:**
- Professional SVG icon system.
- Mobile-first design with an animated hamburger menu.
- Custom scrollbar styling (purple/pink gradient).
- Notifications display links with a purple-to-pink gradient.
- Enhanced custom calendar and time pickers with SSAAM aesthetic.
- Fullscreen RFID scanner mode with purple gradient background, two-column layout (scanner left, results right), and student photo display in Recent Logs with smart photo caching across multiple student identifiers.

**Technical Implementations & Feature Specifications:**
- **Authentication:** Dual-role (Students by numeric ID, Masters/Teachers by letter-starting ID) with API-based Bearer token. Encrypted timestamp authentication with XOR+Base64 encoding for all protected API calls. Includes anti-bot protection (User-Agent validation, bot pattern detection, rate limiting) for registration.
- **Student Management:** Admin/Master dashboard with full CRUD for student records, search/filter, and pagination. Student names are uppercase, and IDs are validated. Admin-only access for edit/delete.
- **Attendance:** RFID code support for attendance. Students receive email notifications upon RFID verification. Supports both "Single Session" (2-in-a-day) and "Dual Session" (4-in-a-day) attendance tracking modes. RFID scanner supports both RFID scan and manual Student ID input modes. Admins can mark RFID cards as 'Unreadable'.
- **Global RFID Scanner Controls:** Admins can enable/disable check-in/check-out globally with auto-disable timers enforced server-side.
- **Dashboard Statistics:** Displays aggregate student statistics by program and year level. Enhanced RFID verification stats with expandable user lists.
- **Image Management:** Integration with ImgBB for image uploads, with client-side compression to under 100KB before upload via backend.
- **Form Validation:** Advanced validation with custom error messages, including Unicode support.
- **Notifications System:** Role-based notifications (Admin/MedPub) with title, message, priority, tracking info, and "heart" (like) functionality. Unread notification badge tracks unseen announcements via MongoDB (`NotificationSeen` collection). Spam prevention for likes with frontend cooldown and backend rate limiting.
- **Password Reset:** Three-step email-based password reset with rate limiting, hashed codes, and enumeration prevention.
- **Admin Settings:** Allows Admins/Masters to toggle user registration and student login status, with custom messages for disabled features. Settings are stored in MongoDB. Includes a feature to clear all user session tokens (force logout).
- **Duplicate Records Search:** Admin feature to search for duplicate student records by RFID, Student ID, or Email, with categorized matches and options to edit/delete duplicates.
- **Registration Restrictions:** Registration is restricted to Gmail addresses only, with case-insensitive duplicate email prevention.

**System Design Choices:**
- **Efficient Pagination:** Frontend displays current page only, with all search and filtering server-side. Statistics fetched separately for complete data.
- **Security:** Robust validation, anti-bot measures, timestamp-based authentication, restricted CORS origins, Regex injection prevention, XSS prevention, and required environment secrets. Implemented security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`).
- **API Integration:** Designed to work with `https://ssaam-api.vercel.app`.

## External Dependencies
- **Backend API:** `https://ssaam-api.vercel.app` (Vercel deployment)
- **Image Hosting:** ImgBB
- **Email Service:** Gmail SMTP via Nodemailer
- **Database:** MongoDB