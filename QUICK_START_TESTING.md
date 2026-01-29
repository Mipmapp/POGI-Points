# QUICK START - TESTING CUSTOM EVENTS

## Prerequisites
- ✅ Latest code deployed (both frontend & backend)
- ✅ Browser console open (F12)
- ✅ At least 2-3 test student accounts
- ✅ Admin account access

---

## STEP-BY-STEP TESTING

### PART 1: ADMIN - CREATE EVENT (5 minutes)

1. **Login as Admin**
   - Go to dashboard
   - Verify you see "Admin" role

2. **Navigate to Attendance**
   - Sidebar > Attendance
   - Should see "Attendance Management" title
   - Should see "+ Add Custom Event" button (top right)

3. **Click "+ Add Custom Event"**
   - Modal opens
   - Header shows "Create Custom Event"
   - Form appears with fields:
     - Event Title
     - Date (with calendar picker)
     - Start Time
     - End Time
     - Description
     - Location
     - Select Users section

4. **Fill in Event Form**
   ```
   Title: "Team Building Activity"
   Date: [Pick date 2-3 days from now]
   Start Time: 09:00
   End Time: 11:00
   Description: "Fun team building for all seniors"
   Location: "Sports Center"
   ```

5. **Select Users**
   - Type in search box: "2" (or any partial name/ID)
   - Users matching search appear
   - Click checkbox next to 2-3 users
   - They appear as purple pills at top
   - Should show "3 Selected" message

6. **Create Event**
   - Verify "Create Event" button is blue (enabled)
   - Click "Create Event"
   - Alert shows "Event created successfully"
   - Modal closes
   - You're back to event list

7. **Verify Event Created**
   - Event appears in list
   - Has purple "✓ Custom" badge
   - Shows your selected users
   - Shows "Team Building Activity" title
   - Date displays correctly

✅ **TEST 1 PASSED**

---

### PART 2: ADMIN - VIEW TABS (3 minutes)

1. **Check Tab Navigation**
   - See "All Events" and "Custom Events" tabs
   - "All Events" shows all events (custom + regular)
   - Count badge shows total

2. **Click "Custom Events" Tab**
   - Only custom events shown
   - Count shows fewer events
   - Your created event visible

3. **Click "All Events" Tab**
   - More events visible
   - Regular events included
   - Custom event still there

✅ **TEST 2 PASSED**

---

### PART 3: ADMIN - EDIT EVENT (5 minutes)

1. **Find Your Custom Event**
   - In "Custom Events" tab
   - Look for "Team Building Activity"

2. **Click "Edit" Button**
   - Modal opens with "Edit Custom Event" header
   - All fields pre-filled:
     - Title: "Team Building Activity"
     - Date: [your date]
     - Your selected users as pills

3. **Change Some Details**
   - Title: Add " 2025" at end
   - Location: Change to "Main Gymnasium"
   - Add 1 more user to selection
   - Remove 1 user (click × on pill)

4. **Click "Update Event"**
   - Alert: "Event updated successfully"
   - Modal closes
   - Event list updates
   - Changes visible immediately

✅ **TEST 3 PASSED**

---

### PART 4: ADMIN - DELETE EVENT (2 minutes)

1. **Find a Custom Event to Delete**
   - Look for one you don't need
   - Or create a test event to delete

2. **Click "Delete" Button**
   - Confirmation dialog appears
   - Message: "Are you sure you want to delete this custom event? This action cannot be undone."

3. **Click "OK" in Dialog**
   - Event disappears from list
   - Alert: "Event deleted successfully"
   - Refresh page - event still gone

✅ **TEST 4 PASSED**

---

### PART 5: STUDENT - SEE CUSTOM EVENT (10 minutes)

1. **Note Assigned Users**
   - Go back to your custom event
   - Note which students are assigned
   - Example: "Student A" and "Student B"

2. **Login as Student A**
   - Logout from admin
   - Login with Student A account

3. **Go to Dashboard**
   - Check Attendance section
   - Look for your custom event
   - **Should see it!** ✅

4. **Login as Different Student**
   - Logout
   - Login as "Student C" (NOT assigned to your event)

5. **Go to Dashboard**
   - Check Attendance section
   - Look for your custom event
   - **Should NOT see it!** ✅

6. **Verify Regular Events Still Show**
   - Both students should see regular events
   - Events filtered by their year level
   - Custom event only for assigned students

✅ **TEST 5 PASSED**

---

### PART 6: MOBILE RESPONSIVENESS (3 minutes)

1. **Open DevTools** (F12)
   - Bottom or side panel opens

2. **Toggle Device Toolbar** (Ctrl+Shift+M)
   - Screen becomes mobile size

3. **Test Mobile View**
   - Logo/header responsive? ✅
   - "+ Add Custom Event" button visible? ✅
   - Event cards stack vertically? ✅
   - Modal fills screen? ✅
   - Can scroll through form? ✅
   - User list scrollable? ✅
   - No horizontal scroll? ✅

4. **Test Tablet View**
   - DevTools > Dimensions > iPad
   - 2-column layout? ✅
   - Everything readable? ✅

5. **Back to Desktop**
   - DevTools > Toggle off
   - 3-column grid? ✅

✅ **TEST 6 PASSED**

---

### PART 7: ERROR HANDLING (2 minutes)

1. **Test Form Validation**
   - Click "+ Add Custom Event"
   - Try to click "Create Event" without title
   - Button should be DISABLED ❌
   - Add title
   - Try without date
   - Button still DISABLED ❌
   - Add date
   - Try without selecting users
   - Button still DISABLED ❌
   - Select a user
   - Button NOW ENABLED ✅

2. **Test Delete Confirmation**
   - Try to delete event
   - Click "Cancel"
   - Event still there ✅
   - Try delete again
   - Click "OK"
   - Event gone ✅

✅ **TEST 7 PASSED**

---

## ALL TESTS SUMMARY

| Test | Feature | Status |
|------|---------|--------|
| 1 | Create Custom Event | ✅ PASS |
| 2 | Tab Navigation | ✅ PASS |
| 3 | Edit Custom Event | ✅ PASS |
| 4 | Delete Custom Event | ✅ PASS |
| 5 | Student See Only Assigned | ✅ PASS |
| 6 | Mobile Responsive | ✅ PASS |
| 7 | Error Handling | ✅ PASS |

---

## BROWSER CONSOLE CHECKS

1. **Open Console** (F12)
2. **Perform Each Test Above**
3. **Check for Errors:**
   - ❌ Red errors?
   - ❌ Yellow warnings?
   - ❌ Network failures?

If you see errors, note:
- Error message
- When it occurred
- What action caused it

---

## WHAT TO REPORT IF SOMETHING FAILS

**Example Issue Report:**
```
TEST: Create Custom Event
STEP: Click "Create Event" button
EXPECTED: Event created, modal closes, success alert shows
ACTUAL: Console shows "TypeError: assigned_users is undefined"
ERROR: Check browser console (F12)
REPRODUCIBLE: Yes, every time
SEVERITY: Critical - Feature completely broken
```

---

## SUCCESS CRITERIA

All tests should show:
- ✅ Admin can create events for specific users
- ✅ Admin can edit event details and user list
- ✅ Admin can delete events
- ✅ Students only see events they're assigned to
- ✅ UI is responsive (mobile to desktop)
- ✅ No console errors
- ✅ All alerts/messages clear

**If all 7 tests pass:** FEATURE IS WORKING CORRECTLY ✅

---

## NEXT STEPS

If all tests pass:
1. Test on production API
2. Load test with many events
3. Test with multiple concurrent users
4. Test on various browsers
5. Have QA team run full test suite

If any tests fail:
1. Check browser console for errors
2. Note the exact failure
3. Report using format above
4. Do NOT proceed until fixed

---

## SUPPORT

If you need help:
1. Check CUSTOM_EVENTS_TEST_PLAN.md for detailed tests
2. Check IMPLEMENTATION_VERIFICATION.md for technical details
3. Review the code comments in Attendance.vue
4. Check backend error logs

Good luck with testing! 🚀
