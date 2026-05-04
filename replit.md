# SSAAM - Student School Activities Attendance Monitoring

## Overview
SSAAM is a Vue 3 + Vite frontend application designed for monitoring student attendance at school activities. It includes features for contribution management and raffle ticket tracking. This Single Page Application (SPA) integrates with a backend API to provide dual-role authentication (Students and Masters/Teachers), comprehensive student data management with CRUD operations, and support for RFID codes for attendance. The project aims to deliver a robust, scalable, and secure system for schools to efficiently track student engagement, with optimized pagination and server-side filtering to handle large datasets.

## User Preferences
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.
- I prefer simple language.
- I like functional programming.

## System Architecture
The application is a Vue 3 SPA built with the Composition API and Vite 5. Styling is handled by Tailwind CSS, and routing by Vue Router 4. The backend is an Express.js server (`SSAAM_VERCEL_BACKEND.js`) using MongoDB/Mongoose, with `server.js` as its entry point. All backend routes are under `/apis/*`.

**UI/UX Decisions:**
- Professional SVG icon system.
- Mobile-first design with an animated hamburger menu.
- Custom scrollbar styling and notifications display with purple/pink gradients.
- Enhanced custom calendar and time pickers with SSAAM aesthetics.
- Fullscreen RFID scanner mode with a purple gradient background, two-column layout, and smart photo caching for student displays.

**Technical Implementations & Feature Specifications:**
- **POS Receipt Panel:** Auto-receipt composer, generating line items from active payment campaigns. Cashier is auto-filled and editable. Receipt header is editable and persisted. Supports ESC/POS printing with logo rendering.
- **Authentication:** Dual-role system for Students and Master accounts (Admin/Co-Admin) with JWT tokens. Co-admin tokens are college-scoped. Encrypted timestamp authentication and anti-bot protection for registration.
- **Student Management:** Admin/Master dashboard with full CRUD operations for student records, including search, filter, and pagination. Admin-only access for edit/delete.
- **Attendance:** RFID code support for attendance with email notifications. Supports "Single Session" and "Dual Session" tracking modes. RFID scanner includes manual Student ID input. Admins can mark RFID cards as 'Unreadable'. Features session-level logs, stats, late thresholds, and global RFID scanner controls.
- **Notifications System:** Merged global and per-college notifications with like/seen tracking.
- **Multi-College Architecture:** Uses a single MongoDB database with prefixed collections per college. College identification via `X-SSAAM-College` header or JWT payload.
- **Image Management:** Integration with ImgBB for image uploads, with client-side compression.
- **GPS Geofencing:** Admin-configurable per-event geofence using Leaflet+OpenStreetMap.
- **Self-Service Face ID:** Browser-based face enrollment and check-in for students using `@vladmandic/face-api` with geolocation pre-check for geofenced events.
- **Session Check-In/Out Mode:** Sessions default to check-in only, with manual admin enablement for check-out.
- **Password Reset:** Three-step email-based password reset with rate limiting and server-time clock synchronization.
- **Admin Contributions UX:** Enhanced student search for contributions, "Paid On" date filtering, and live summary cards.
- **GeofenceMap:** Improved UI with centered marker, custom zoom control, live tracking, and a read-only mode for student-side viewing of active event geofences.

**System Design Choices:**
- **Efficient Pagination:** Server-side search, filtering, and pagination.
- **Security:** Robust validation, anti-bot measures, timestamp-based authentication, restricted CORS, and security headers.
- **Email:** Nodemailer with a rotating pool of Gmail app-password accounts for OTP/verification.

## External Dependencies
- **Database:** MongoDB Atlas
- **Image Hosting:** ImgBB
- **Email Service:** Gmail SMTP via Nodemailer