# Custom Events Feature - Test Plan

## Overview
Testing the custom events feature where admins can create events for specific users, and students only see events they're assigned to.

---

## ADMIN TESTS (Admin > Attendance)

### Test 1: Create Custom Event
**Steps:**
1. Go to Admin > Attendance
2. Click "+ Add Custom Event" button
3. Fill in form:
   - Title: "Senior Class Orientation"
   - Date: Pick a future date
   - Start Time: 08:00
   - End Time: 10:00
   - Description: "Orientation for senior students"
   - Location: "Gymnasium"
4. Search and select 2-3 students
5. Click "Create Event"

**Expected Results:**
- ✅ Modal opens with all fields
- ✅ User search works (search by name, ID, program)
- ✅ Selected users show as pills with remove button
- ✅ Button disabled until title, date, and at least 1 user selected
- ✅ Event created successfully
- ✅ Success message appears
- ✅ Modal closes
- ✅ New event appears in "Custom Events" tab
- ✅ Event marked with purple "✓ Custom" badge

---

### Test 2: View Custom Event Details
**Steps:**
1. In "Custom Events" tab, click "Details" button on custom event
2. Review displayed information

**Expected Results:**
- ✅ Event details display correctly
- ✅ Assigned users listed
- ✅ Time and location visible
- ✅ Description shows

---

### Test 3: Edit Custom Event
**Steps:**
1. Click "Edit" button on a custom event
2. Modal opens with pre-filled data
3. Change title to "Updated Senior Class Orientation"
4. Remove 1 user and add a different user
5. Change location to "Auditorium"
6. Click "Update Event"

**Expected Results:**
- ✅ Modal opens with all fields pre-filled
- ✅ Current users shown in pills
- ✅ Can add/remove users
- ✅ Other details editable
- ✅ Update button shows "Update Event" text
- ✅ Changes saved successfully
- ✅ Event list refreshes with new data
- ✅ Edit appears to apply immediately

---

### Test 4: Delete Custom Event
**Steps:**
1. Click "Delete" button on custom event
2. Confirm deletion in dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Dialog shows "Are you sure?" message
- ✅ After confirmation, event disappears from list
- ✅ Success message shows
- ✅ Event removed from both "All Events" and "Custom Events" tabs

---

### Test 5: Tab Navigation
**Steps:**
1. Check "All Events" tab - should show all events (regular + custom)
2. Check "Custom Events" tab - should show only custom events
3. Count badges match actual events

**Expected Results:**
- ✅ "All Events" tab shows all events
- ✅ "Custom Events" tab shows only custom events
- ✅ Event counters accurate
- ✅ Tab switching smooth
- ✅ Mobile: tabs scroll horizontally

---

### Test 6: Responsive Design (Admin)
**Steps:**
1. Test on desktop (1920px)
2. Test on tablet (768px)
3. Test on mobile (375px)
4. Open event creation modal on each

**Expected Results:**
- ✅ Desktop: 3-column grid
- ✅ Tablet: 2-column grid  
- ✅ Mobile: 1-column stack
- ✅ Modal buttons stack on mobile
- ✅ Input fields fully accessible
- ✅ User selection list scrollable on mobile
- ✅ No horizontal scrolling needed

---

## STUDENT TESTS (Dashboard)

### Test 7: Student Only Sees Assigned Custom Events
**Steps:**
1. Admin creates 2 custom events:
   - Event A: Assign to Student 1 + Student 2
   - Event B: Assign to Student 3 only
2. Log in as Student 1
3. Go to Dashboard > Attendance
4. Check visible events

**Expected Results:**
- ✅ Student 1 sees:
  - Event A (assigned) ✅
  - Event B (not shown) ✅
  - Regular events for their year level ✅
- ✅ Student 3 sees:
  - Event A (not shown) ✅
  - Event B (assigned) ✅
  - Regular events for their year level ✅

---

### Test 8: Student Views Regular Events by Year Level
**Steps:**
1. Admin creates regular event (non-custom) for "3rd Year"
2. Log in as 3rd year student
3. Go to Dashboard > Attendance
4. Log in as 1st year student
5. Check same page

**Expected Results:**
- ✅ 3rd year student sees the event
- ✅ 1st year student does NOT see the event
- ✅ Custom event filtering doesn't affect regular events

---

### Test 9: Multiple Student Assignments
**Steps:**
1. Create custom event assigned to 5 students
2. Log in as each student
3. Verify they can see the event

**Expected Results:**
- ✅ All 5 students can see their assigned event
- ✅ Event shows with correct details
- ✅ They can check in/check out normally

---

### Test 10: Student Check-in to Custom Event
**Steps:**
1. Create active custom event assigned to a student
2. Log in as that student
3. Go to attendance
4. Check in using RFID/Student ID

**Expected Results:**
- ✅ Custom event appears in check-in options
- ✅ Check-in records correctly
- ✅ Attendance tracked properly
- ✅ Status updates in admin view

---

## BACKEND API TESTS

### Test 11: Create Custom Event API
**Endpoint:** `POST /apis/attendance/events/custom/create`

**Payload:**
```json
{
  "title": "Test Event",
  "event_date": "2025-02-15",
  "start_time": "09:00",
  "end_time": "11:00",
  "description": "Test description",
  "location": "Test Location",
  "assigned_users": ["userid1", "userid2"]
}
```

**Expected Results:**
- ✅ Returns 201 or 200 with created event
- ✅ Event has `is_custom: true`
- ✅ assigned_users populated with student details
- ✅ Status set to 'active'
- ✅ Returns event ID for future reference

---

### Test 12: Update Custom Event API
**Endpoint:** `PUT /apis/attendance/events/custom/:id`

**Payload:** (same as create, with changes)

**Expected Results:**
- ✅ Event updated with new data
- ✅ Returns updated event object
- ✅ assigned_users list updated
- ✅ Other fields preserved/updated

---

### Test 13: Delete Custom Event API
**Endpoint:** `DELETE /apis/attendance/events/:id`

**Expected Results:**
- ✅ Returns success message
- ✅ Event removed from database
- ✅ Associated sessions deleted
- ✅ Associated logs deleted

---

### Test 14: Get Active Events (Student Filter)
**Endpoint:** `GET /apis/attendance/events/active`

**Auth:** Student token

**Expected Results:**
- ✅ Only returns:
  - Non-custom events (for all students)
  - Custom events where student is in assigned_users
- ✅ assigned_users populated with full details
- ✅ No custom events they're not assigned to

---

### Test 15: Get All Events (Admin)
**Endpoint:** `GET /apis/attendance/events`

**Auth:** Admin token

**Expected Results:**
- ✅ Returns ALL events (custom + regular)
- ✅ assigned_users populated with full details
- ✅ is_custom flag accurate
- ✅ Pagination works if applicable

---

### Test 16: Authentication & Authorization
**Scenarios:**
1. Create event as non-admin student (should fail)
2. Create event as treasurer (should succeed)
3. Create event as admin (should succeed)
4. Delete event as different admin (should succeed)

**Expected Results:**
- ✅ Only admin/treasurer can create/edit/delete
- ✅ Students get 403 Forbidden
- ✅ Proper error messages returned

---

## EDGE CASE TESTS

### Test 17: Create Event with No Users
**Steps:**
1. Try to create event with 0 users selected

**Expected Results:**
- ✅ Button disabled on frontend
- ✅ If submitted, backend returns error
- ✅ Clear error message shown

---

### Test 18: User Search Works Correctly
**Steps:**
1. Search for "John" - finds users with John in name
2. Search for "21-A-001" - finds by student ID
3. Search for "BSCS" - finds by program
4. Search for gibberish

**Expected Results:**
- ✅ Case-insensitive search
- ✅ Partial matches work
- ✅ Finds users correctly
- ✅ No results shows "No users found"

---

### Test 19: Event with Special Characters
**Steps:**
1. Create event with title: "Year-End Ceremony 2025 (Online & Offline)"
2. Location: "Room #101 / Building A"
3. Description: "Meet & Greet @ 3:00 PM"

**Expected Results:**
- ✅ Special characters saved correctly
- ✅ Display correctly in UI
- ✅ No encoding issues

---

### Test 20: Database Constraints
**Steps:**
1. Try to create duplicate event (same title, date, users)
2. Try to assign same user twice to one event

**Expected Results:**
- ✅ Duplicate events allowed (different events)
- ✅ Same user can't be assigned twice
- ✅ Backend handles gracefully

---

## PERFORMANCE TESTS

### Test 21: Large User Selection
**Steps:**
1. Create event with 100+ users assigned
2. Check rendering and performance
3. Edit event and modify user list

**Expected Results:**
- ✅ All users load without lag
- ✅ Search still fast with many users
- ✅ Selected pills render smoothly
- ✅ No memory leaks

---

### Test 22: Many Events
**Steps:**
1. Admin view with 50+ events
2. Student view with 20+ assigned custom events

**Expected Results:**
- ✅ Events load in reasonable time
- ✅ Filtering tabs responsive
- ✅ No performance degradation
- ✅ Pagination if needed

---

## SUMMARY CHECKLIST

- [ ] Admin can create custom events ✅
- [ ] Admin can edit custom events ✅  
- [ ] Admin can delete custom events ✅
- [ ] Events show title, date, time, location, description ✅
- [ ] Assigned users visible to admin ✅
- [ ] Tab navigation works (All/Custom) ✅
- [ ] Students only see assigned custom events ✅
- [ ] Students see all regular events by year ✅
- [ ] User search works in form ✅
- [ ] Selected users show as removable pills ✅
- [ ] Responsive design (mobile/tablet/desktop) ✅
- [ ] API endpoints all working ✅
- [ ] Authentication/authorization correct ✅
- [ ] No console errors ✅
- [ ] No database errors ✅

---

## Test Environment Setup

**Browser:** Chrome/Firefox (Latest)
**Device:** Desktop, Tablet, Mobile
**API Base URL:** https://ssaam-api.vercel.app
**Frontend URL:** http://localhost:5000 (dev) or production URL

**Test Users Needed:**
- 1 Admin account
- 3-5 Student accounts with different year levels
- 1 Treasurer account (optional)

---

## Issue Reporting Format

If any test fails, report as:

```
Test #: [Number and Title]
Status: FAILED
Expected: [What should happen]
Actual: [What actually happened]
Steps to Reproduce: [Numbered steps]
Screenshots: [If applicable]
Console Errors: [Any error messages]
```
