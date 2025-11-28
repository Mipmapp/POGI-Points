# SSAAM - Student School Activities Attendance Monitoring

## Overview
A Vue 3 + Vite frontend application for monitoring student attendance at school activities. This is a Single Page Application (SPA) that uses localStorage for data persistence.

## Project Structure
- **Framework**: Vue 3 with Composition API (script setup)
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Routing**: Vue Router 4
- **Data Storage**: Browser localStorage (no backend)

## Key Features
- User authentication (Login/Register)
- Admin account auto-initialization
- Student dashboard with responsive design
- RFID code support for attendance
- Professional SVG icon system throughout
- Help/Contact modal accessible from Login and Dashboard
- Mobile hamburger menu with smooth animations
- Anti-copy protection and styled error notifications
- Image preloading before login form appears
- Optional field labels for better UX
- Advanced form validation with custom error messages
- RED error notifications for clear error visibility
- **Admin User Management** - Edit and delete user accounts
- Team member photos in developer popup

## Configuration
- **Dev Server**: Port 5000, host 0.0.0.0
- **Vite Config**: Configured with `allowedHosts: true` for Replit proxy compatibility
- **Default Admin**: 
  - Email: admin@ssaam.edu
  - Student ID: admin
  - RFID: admin0000

## Development
The application is configured to run on Replit with:
- Automatic dependency installation via npm
- Dev server configured for Replit's proxy environment
- Static deployment configuration for production

## Latest Updates (2025-11-28)

### Admin Dashboard Enhancements (LATEST)
- **Icon Buttons**: Edit and Delete buttons replaced with professional icon buttons (pencil/trash) with hover animations
- **Help Button Repositioned**: "Need Help" button moved to bottom-right corner with proper spacing from scrollbar
- **Logout Animation**: Added scale and rotate animation when clicking logout button
- **Renamed Navigation**: "User Management" renamed to "Manage" throughout the app
- **Advanced Search Filter**: Dropdown to filter search by specific fields:
  - All Fields, Student ID, First Name, Middle Name, Last Name
  - Email, RFID Code, Program, School Level
- **Dynamic Placeholder**: Search input placeholder updates based on selected filter
- **Mobile Responsive**: Filter dropdown and search stack vertically on mobile

### Admin User Management
- **User List**: Admin can view all registered users in a table format
- **Edit User**: Click edit icon to modify user details (name, email, program, year level)
- **Delete User**: Click delete icon with confirmation modal to remove users
- **Menu Item**: "Manage" appears in sidebar only for admin users
- **Storage**: Changes are saved to localStorage
- **Desktop & Mobile**: Full responsive design with mobile menu support

### Kenzen's Photo
- **Developer Profile**: Kenzen's photo displays in "Meet Our Developers" from `/team/kenzen.jpg`
- **Fallback System**: Other developers show initials when photos aren't available yet
- **Ready for Expansion**: Other team members' photos can be added to `public/team/` folder

### RED Error Notifications
- **Error Modal Styling**: Red border, red heading, red message text
- **Applied To**: Login page, Register page (all validation errors)
- **Clear Visibility**: Errors stand out with prominent red styling
- **Error Icon**: Dark red X icon for attention
- **Try Again Button**: Red gradient button matching error theme

### Advanced Form Validation
- **Student ID Format**: Must follow format `12-A-12345` (2 digits, hyphen, 1 uppercase letter, hyphen, 5 digits)
- **Name Fields**: Only letters and spaces allowed in First Name, Middle Name, and Last Name (no symbols)
- **Custom Error Messages**: All validation errors displayed in professional modals matching app theme
- **Removed Browser Validation**: Replaced default "Please fill in this field" with SSAAM-branded messages

### Optional Field Indicators
- **Middle Name**: Shows "(optional)" in gray text
- **RFID Code**: Shows "(optional)" in gray text
- **Suffix**: Shows "(optional)" in gray text
- Applied across both desktop and mobile versions

### Image Preloading & Mobile Contact Modal
- **Loading Screen Image Preload**: All images preload before proceeding to login
- **Mobile Contact Modal**: Fixed "Need help?" button on mobile to open Contact modal
- **Professional Validation**: All forms use `novalidate` for custom SSAAM-branded messages

### Professional SVG Icon System (Complete)
- **All Icons**: user.svg, key.svg, mail.svg, register_user.svg, arrow_down.svg, course.svg, book.svg, detector.svg, calendar.svg, event_note.svg, home.svg, logout.svg, help.svg
- **White Icon Filter**: `filter: brightness(0) invert(1);` for modals
- **Consistent Across All Pages**
- **Mobile Icons**: All icons properly displayed in white on mobile register screen

## Form Validation Messages
- **Login Page**: 
  - "Please enter your Student ID to proceed."
  - "Please enter your password to continue."

- **Register Step 1**:
  - "Please provide your first name to continue."
  - "First name can only contain letters and spaces."
  - "Please provide your last name to proceed."
  - "Last name can only contain letters and spaces."
  - "Middle name can only contain letters and spaces."
  - "Please provide your email address."
  - "Please enter a valid email address."

- **Register Step 2**:
  - "Please enter your Student ID to continue."
  - "Student ID must follow format: 12-A-12345 (2 digits, hyphen, 1 letter, hyphen, 5 digits)."
  - "Please select your Year Level."
  - "Please select your Program."

## Admin Features
- **Dashboard View**: Displays statistics of registered students by program and year level
- **User Management View**: Full table of all users with edit/delete actions
- **Navigation**: Sidebar menu shows "Dashboard" and "User Management" options for admins only

## Architecture
Pure frontend application with no backend. All user data stored in browser's localStorage. Enhanced with professional form validation, image preloading, RED error notifications, and complete admin user management system for optimal user experience and administrative control.
