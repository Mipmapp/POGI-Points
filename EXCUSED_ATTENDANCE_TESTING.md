# EXCUSED ATTENDANCE FEATURE - TESTING GUIDE

## Overview
This guide provides step-by-step instructions to test the new **Excused Attendance** feature that allows admins to mark students as excused for completed events with an optional reason.

---

## IMPLEMENTATION SUMMARY

### ✅ What Was Implemented

1. **Backend Schema**
   - Added `excused: Boolean` field to AttendanceLog
   - Added `excuse_reason: String` field to AttendanceLog
   - Updated virtual `attendance_status` to prioritize excused over other states

2. **Backend Endpoints**
   - `PATCH /apis/attendance/logs/:id` – accepts `{ excused, excuse_reason }` to update logs
   - `GET /apis/attendance/my-records` – returns `excuse_reason` in attendance objects and overall status

3. **Frontend UI**
   - **Edit Attendance Modal** – modal to mark attendance as excused with optional reason
   - **Edit Button** – appears in session logs table only for:
     - Admin or Master users
     - Closed/completed events
     - Closed sessions
   - **Status Display** – shows "Excused" in green (same styling as Present)
   - **User Dashboard** – displays "Reason: {excuse_reason}" below status badge for excused records

4. **Custom Event Filtering**
   - Session logs for custom events now fetch only `event.assigned_users` instead of all students
   - Regular events still fetch all students based on year level/program filters

---

## PREREQUISITES FOR TESTING

- ✅ Dev server running on http://localhost:5001
- ✅ At least 2 test accounts (1 admin, 1 student)
- ✅ A custom event that is **closed/completed** (not active or upcoming)
- ✅ The event should have recorded attendance (some students marked absent)
- ✅ Browser DevTools open (F12) to check for console errors

### Setting Up Test Data

If you need to create test data:

1. **As Admin**: Create a custom event with past date and closed status
2. **As Students**: Check in to record attendance
3. **As Admin**: Mark session as closed
4. **As Admin**: Go to Attendance > Events > Select event > Select session
5. Proceed to testing steps below

---

## TEST CASE 1: VIEW STUDENT DATA IN SESSION LOGS

**Objective**: Verify that session logs display all student information clearly.

### Steps:

1. **Login as Admin**
   - Navigate to http://localhost:5001
   - Enter admin credentials

2. **Go to Attendance > Events**
   - Click "Attendance" in sidebar
   - Select an event (preferably custom event with closed session)

3. **Select a Session**
   - Click a session to view logs
   - Observe the session logs table

### Expected Results:

✅ **Table should show**:
- Student avatar/photo (circular with initials or image)
- Student name (full name or "First Last")
- Student ID (e.g., "21-A-12345")
- Program (e.g., "BSCS", "BSIT", "BSIS")
- Year Level (e.g., "3rd Year")
- Check In time (or "-" if not checked in)
- Check Out time (or "-" if not checked out)
- Status badge (Present, Absent, Late, Incomplete, or **Excused**)

✅ **For Custom Events**:
- Only assigned students should appear in logs (not all students)
- Count should match number of assigned users

✅ **No Console Errors**:
- Open DevTools (F12)
- Check Console tab
- Should be clean with no red error messages

---

## TEST CASE 2: EDIT ATTENDANCE - MARK AS EXCUSED

**Objective**: Verify that admins can mark a student as excused with a reason.

### Steps:

1. **Find an Absent Student**
   - In session logs table
   - Look for a row with "Absent" status badge (red)

2. **Verify Edit Button Visibility**
   - Check if an **Edit** button appears next to the status badge
   - Button should only appear if:
     - Current user is admin/master
     - Event has ended (past date/time)
     - Session status is "closed"

3. **Click Edit Button**
   - Modal opens titled "Edit Attendance (Excuse)"
   - Should show:
     - Checkbox: "Mark as Excused"
     - Textarea: "Reason (optional)"
     - Buttons: "Cancel" and "Save"

4. **Fill in the Form**
   - Check the "Mark as Excused" checkbox
   - Enter a reason, e.g.: "Medical exemption - provided doctor's note"

5. **Save Changes**
   - Click "Save" button
   - Should see success notification: "Attendance updated"
   - Modal closes

### Expected Results:

✅ **Status Updates Immediately**:
- Status badge changes from "Absent" (red) to "Excused" (green)
- Green badge looks identical to "Present" badge

✅ **Page Refreshes**:
- Logs table refreshes automatically
- Excused student appears with green status

✅ **No Console Errors**:
- DevTools should show no errors

✅ **Data Persists**:
- Navigate away and come back
- Excused status should still be there
- Reason should be saved

---

## TEST CASE 3: VERIFY EDIT BUTTON CONSTRAINTS

**Objective**: Ensure Edit button only appears for closed/completed events.

### Steps:

1. **Find an Active/Upcoming Event**
   - Navigate to Attendance > Events
   - Select an event that is NOT closed (status is "active", "draft", or future date)

2. **Select a Session**
   - Open session logs
   - Find an absent student row

3. **Check Edit Button**
   - Button should NOT appear next to status badge
   - Only status badge visible, no Edit link

4. **Check a Closed Event**
   - Go back to event list
   - Select a closed/completed event

5. **Select a Session**
   - Open session logs
   - Find an absent student row

6. **Check Edit Button**
   - Button SHOULD appear next to status badge
   - Button is blue text with "Edit" label

### Expected Results:

✅ **Edit button only visible when**:
- Current user is admin or master
- Event has ended (hasEventEndedPH check)
- Session status is "closed"

✅ **Edit button hidden when**:
- Event is upcoming or active
- Session is not closed
- User is not admin/master

---

## TEST CASE 4: USER DASHBOARD - DISPLAY EXCUSED STATUS AND REASON

**Objective**: Verify that students see excused status with reason in their dashboard.

### Steps:

1. **Logout as Admin**
   - Click logout or open incognito/new browser window

2. **Login as the Excused Student**
   - Use credentials of the student you marked as excused
   - Navigate to http://localhost:5001

3. **Go to My Attendance**
   - Click "Dashboard" in sidebar
   - Scroll down to "My Attendance History"
   - Find the event where you marked the student as excused

4. **Expand the Event**
   - Click on the event card to expand it
   - Should show:
     - Event title
     - Sessions list
     - Status badge

5. **Check Status Display**
   - Look at the Overall Status section (right side of card)
   - Should show:
     - Status badge: "Excused" in green
     - Below badge: "Reason: Medical exemption - provided doctor's note"
     - Reason text should be small gray italic text

### Expected Results:

✅ **Status Badge**:
- Shows "Excused" 
- Green background (bg-green-100) with green text (text-green-800)
- Identical styling to "Present" badge

✅ **Reason Display**:
- Shows directly below status badge
- Format: "Reason: {excuse_reason}"
- Styled as small (text-xs), gray (text-gray-600), italic
- Only shows if status is excused AND reason exists

✅ **No Reason Reason**:
- If you marked as excused without entering reason
- No reason text should appear below status
- Just the "Excused" badge

✅ **Data Persistence**:
- Refresh page
- Excused status still shows
- Reason still displays

---

## TEST CASE 5: CUSTOM EVENT STUDENT FILTERING

**Objective**: Verify custom events only fetch assigned students.

### Steps:

1. **Create a Custom Event**
   - As Admin, go to Attendance
   - Click "+ Add Custom Event"
   - Create event for date 2-3 days ago (so it's completed)
   - **Assign 2-3 specific students** (don't assign everyone)
   - Mark as closed

2. **View Session Logs**
   - Select the custom event
   - Select a session
   - Open Session Logs

3. **Count Students**
   - Count rows in session logs table
   - Should equal number of assigned students (e.g., 3)

4. **Compare with Regular Event**
   - Select a regular (non-custom) event
   - Select a session
   - Open Session Logs
   - Count should be much higher (all eligible students)

5. **Check Terminal Output**
   - Look at dev server terminal
   - No error messages should appear
   - API calls should complete successfully

### Expected Results:

✅ **Custom Event Logs**:
- Only shows assigned students
- Count matches number of selected users
- Not fetching all students

✅ **Regular Event Logs**:
- Shows all eligible students based on filters
- Large number of records

✅ **API Calls**:
- Terminal shows successful API requests
- No 404 or 500 errors
- No "Cannot fetch student" errors

---

## TROUBLESHOOTING

### Issue: Edit Button Doesn't Appear

**Possible Causes**:
1. User is not admin/master → Check user role in sidebar
2. Event hasn't ended → Check event date/time
3. Session not closed → Check session status in dropdown
4. Browser cache → Clear cache (Ctrl+Shift+Del)

**Fix**:
- Verify all three conditions are met
- Hard refresh browser (Ctrl+Shift+R)
- Try with a different closed event

### Issue: Excused Status Not Saving

**Possible Causes**:
1. API endpoint not responding → Check backend
2. Invalid token → Try logout/login again
3. Database error → Check terminal logs

**Fix**:
- Open DevTools Network tab
- Click Edit again
- Check PATCH request status (should be 200)
- Check response body for errors
- See terminal for error details

### Issue: Reason Not Showing in Dashboard

**Possible Causes**:
1. Reason field was empty → Try editing with a reason
2. Student dashboard not refreshing → Refresh page
3. Wrong student logged in → Verify student email

**Fix**:
- Go back to admin logs
- Edit the record again
- Verify reason is filled in
- Save
- Login as student
- Hard refresh dashboard (Ctrl+Shift+R)

### Issue: Console Shows Errors

**Debugging Steps**:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Note the full error text
5. Check the file and line number in error
6. Review the code at that location
7. Check backend terminal for related API errors

---

## VERIFICATION CHECKLIST

Complete this checklist to confirm all features are working:

- [ ] **Test 1**: Student data displays correctly in logs (name, ID, program, year, photo)
- [ ] **Test 1**: Custom events show only assigned students, not all students
- [ ] **Test 2**: Can find and click Edit button for closed events
- [ ] **Test 2**: Edit modal opens with checkbox and reason textarea
- [ ] **Test 2**: Can mark as excused and save
- [ ] **Test 2**: Status changes to green "Excused" immediately
- [ ] **Test 3**: Edit button visible for closed events only
- [ ] **Test 3**: Edit button hidden for active/upcoming events
- [ ] **Test 4**: Student sees excused status in dashboard (green)
- [ ] **Test 4**: Student sees reason text below status badge
- [ ] **Test 5**: Custom events fetch only assigned students
- [ ] **Test 5**: No console errors when editing
- [ ] **Test 5**: No API errors in terminal logs
- [ ] **All Tests**: Data persists after refresh/navigate away

---

## WHAT'S NEW IN THIS RELEASE

### Backend Changes (SSAAM_Vercel_Backend.js)
- AttendanceLog schema: added `excused` and `excuse_reason` fields
- Virtual `attendance_status`: prioritizes excused over other states
- PATCH `/apis/attendance/logs/:id`: accepts excused + reason updates
- GET `/apis/attendance/my-records`: returns excuse fields and calculates status

### Frontend Changes (src/views/Dashboard.vue)
- Session logs table: displays full student data (photo, name, ID, program, year)
- Edit button: gated to admin-only, closed events only
- Edit Attendance modal: checkbox for excused, textarea for reason
- Status helpers: recognize excused status, render green badge
- User dashboard: display excuse_reason below status badge
- Custom event filtering: fetchSessionLogs uses assigned_users for custom events

---

## NEXT STEPS

After testing:

1. **If All Tests Pass** ✅
   - Document final confirmation
   - Ready for production deployment
   - Consider adding automated tests

2. **If Issues Found** ⚠️
   - Document exact steps to reproduce
   - Check browser DevTools console errors
   - Check terminal for backend errors
   - Review code changes in relevant sections

---

## CONTACT & SUPPORT

For issues or questions during testing:
1. Check the "TROUBLESHOOTING" section above
2. Review the implementation summary to understand expected behavior
3. Check DevTools console and backend terminal for error details
4. Refer to code comments in Dashboard.vue and backend for implementation details

---

**Date Created**: January 2024
**Feature**: Excused Attendance Status with Optional Reason
**Status**: Ready for Testing
