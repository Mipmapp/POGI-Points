# SSAAM Dead Code Audit Report
**Generated:** 2026-05-04  
**Scope:** Full project scan — Dashboard.vue, AdminContributionPanel.vue, Login.vue, Register.vue, all components  
**Auditor:** AI Static Analysis

---

## PART 1 — BUG FIX (Applied)

### Contributions collected amount mismatch (Statistics vs Event cards)
- **File:** `src/components/AdminContributionPanel.vue`
- **Root cause:** `collectedByEvent` computed summed from `paymentEvents[].payment_records[]` (embedded snapshot in the events-list API response) while `statsOverall.totalCollected` (the Statistics bar) summed from `filteredContributions` (the full live contributions API response). Different data sources, different field fallbacks, different paid checks.
- **Fix applied:** For the active event, `collectedByEvent` now reads directly from `filteredContributions` — identical source and field priority (`amount_paid || original_amount`) to `statsOverall.totalCollected`. Non-active event cards still use `payment_records` since only the active event's full contributions are loaded.
- **Status:** ✅ Fixed

---

## PART 2 — Dead Code Removed (Already Applied)

### AnnouncementPopup component — CONFIRMED DEAD
- **File:** `src/views/Dashboard.vue`
- **Code removed:**
  - `import AnnouncementPopup from '../components/AnnouncementPopup.vue'` (line ~7929)
  - `showAnnouncementPopup`, `announcementPopupData`, `ANNOUNCEMENT_POPUP_STORAGE_KEY` refs
  - Functions: `getLatestAnnouncementsForPopup`, `hasRecentAnnouncement`, `checkAndShowAnnouncementPopup`, `closeAnnouncementPopup`, `handlePopupLike`
  - Call: `checkAndShowAnnouncementPopup()` (was running on mount, setting a ref that drives nothing)
- **Reason:** `<AnnouncementPopup>` was never present in the template (0 results). The component was imported and its state was managed but nothing ever rendered it. The popup logic ran silently and wasted cycles on every student login.
- **Dynamic check:** No dynamic `component :is` references. No `v-if` binding to the show ref anywhere in the 7,920-line template.
- **Risk Level:** NONE — component was invisible to users
- **Safe to Delete?** Yes — ✅ Removed. `AnnouncementPopup.vue` component file can also be deleted from `src/components/` if the popup feature is permanently dropped.

---

## PART 3 — Notifications System (ACTIVE — Do NOT Remove)

The "Notifications / Announcements" feature is **fully live** and actively used:
- Admin posts notifications → `POST /apis/notifications`
- Edit Notification Modal (line ~5582 in template) — `showEditNotificationModal` drives it
- Delete Notification Confirm Modal (line ~66 in template) — `showDeleteNotificationConfirm` drives it
- Notification Toast (line ~7319) — `notification.show` drives it
- `fetchNotifications()` is called on mount and during dashboard refresh
- Students receive and can like notifications

**Decision:** Keep the notifications system entirely. It is a core feature.

---

## PART 4 — Inline AI Warnings Added (Not Yet Deleted)

The following items have `// [AI WARNING]` comments added at their definition sites. Review before deleting.

| # | File | Variable / Symbol | Reason | Confidence | Safe to Delete? |
|---|------|-------------------|--------|------------|-----------------|
| 1 | Dashboard.vue | `showImagePreviewModal` | Defined, set in script, but `v-if="showImagePreviewModal"` never appears in template | HIGH | Needs Review |
| 2 | Dashboard.vue | `imagePreviewUrl` | Set in script logic, but never bound in template (`v-if`, `:src`, etc.) | HIGH | Needs Review |
| 3 | Dashboard.vue | `notifImageRetries` | Image retry map, no template `@error` or `v-if` binding found | MEDIUM | Needs Review |
| 4 | Dashboard.vue | `notifImageFailed` | Failure flag map, no template usage found | MEDIUM | Needs Review |
| 5 | Dashboard.vue | `notifImageLoaded` | Loaded flag map, no template usage found | MEDIUM | Needs Review |
| 6 | Dashboard.vue | `MAX_NOTIF_IMAGE_RETRIES` | Used with notifImageRetries which itself is unused | MEDIUM | Needs Review |
| 7 | Dashboard.vue | `announcementTextareaRef` | Ref for textarea auto-focus; function using it may be dead since no `ref="announcementTextareaRef"` in template | MEDIUM | Needs Review |
| 8 | Dashboard.vue | `selectedEventForPaymentTab` | Defined only (1 reference = definition), never read or written anywhere else | HIGH | Yes |
| 9 | Dashboard.vue | `paymentScanMode` | Defined only, never read | HIGH | Yes |
| 10 | Dashboard.vue | `activePaymentsCarouselRef` | Template ref attribute never assigned | HIGH | Yes |
| 11 | Dashboard.vue | `closedPaymentsCarouselRef` | Template ref attribute never assigned | HIGH | Yes |
| 12 | Dashboard.vue | `paymentTab` | Defined only, never read in template or script logic | HIGH | Yes |
| 13 | Dashboard.vue | `termsExpanded` | Defined only, never read | HIGH | Yes |
| 14 | Dashboard.vue | `pendingEditUser` | Defined only, never read | HIGH | Yes |
| 15 | Dashboard.vue | `isSearching` | Defined only, never read (distinct from `isSearchingStudent`) | HIGH | Yes |
| 16 | Dashboard.vue | `profileImageRetries` | Defined only, never read | HIGH | Yes |
| 17 | Dashboard.vue | `fullscreenLogoRef` | Template ref attribute never assigned | HIGH | Yes |
| 18 | Dashboard.vue | `showNotificationModal` | Never in template; `showEditNotificationModal` is the active modal ref | HIGH | Yes |
| 19 | Dashboard.vue | `editingNotification` | Never in template; `editNotificationData` is the active editing ref | HIGH | Yes |
| 20 | Dashboard.vue | `attendanceDataFetched` | Defined only, never read | HIGH | Yes |
| 21 | Dashboard.vue | `eventEndedNotifications` | Defined only (Set), never populated or read | HIGH | Yes |
| 22 | Dashboard.vue | `notifiedActiveEventIds` | Defined only (Set), never populated or read | HIGH | Yes |
| 23 | Dashboard.vue | `FastAverageColor` import | `fac` instance used inside profile color extraction; result usage may not produce visible output | LOW | Needs Review |

---

## PART 5 — Component Files (All Active)

All components in `src/components/` are imported and used somewhere in the project:

| Component | Used In |
|-----------|---------|
| `AdminContributionPanel.vue` | Dashboard.vue |
| `AdminRaffleTicketPanel.vue` | Dashboard.vue |
| `AnnouncementPopup.vue` | ~~Dashboard.vue~~ — now dead, can delete file |
| `ContributionReceipt.vue` | StudentContributionsView.vue |
| `ContributionsModal.vue` | Dashboard.vue |
| `FaceRecognitionSettings.vue` | Dashboard.vue |
| `GeofenceMap.vue` | Dashboard.vue |
| `LoadingScreen.vue` | App.vue |
| `LocationGate.vue` | Dashboard.vue |
| `LoyversePOSPanel.vue` | AdminContributionPanel.vue |
| `Manage.vue` | Dashboard.vue |
| `ParticleBackground.vue` | Login.vue, Register.vue |
| `ProgrammerLoadingEffect.vue` | Dashboard.vue |
| `RFIDLoadingEffect.vue` | Dashboard.vue |
| `SessionExpiredModal.vue` | Dashboard.vue |
| `StudentContributionsView.vue` | Dashboard.vue |
| `StudentFaceCheckIn.vue` | Dashboard.vue |
| `StudentFaceEnroll.vue` | Dashboard.vue |
| `StudentRaffleResultsView.vue` | Dashboard.vue |

**Conclusion:** Only `AnnouncementPopup.vue` is safe to delete.

---

## PART 6 — Safe Cleanup Plan

### Step 1 — Already done ✅
Remove `AnnouncementPopup` import + all popup state/functions from Dashboard.vue.

### Step 2 — Safe to delete now (HIGH confidence, no functionality)
Delete these refs from Dashboard.vue `<script setup>` — they are only ever defined, never read:
```
selectedEventForPaymentTab, paymentScanMode, activePaymentsCarouselRef,
closedPaymentsCarouselRef, paymentTab, termsExpanded, pendingEditUser,
isSearching, profileImageRetries, fullscreenLogoRef, showNotificationModal,
editingNotification, attendanceDataFetched, eventEndedNotifications, notifiedActiveEventIds
```
**Test after:** Open Dashboard as admin and student. Verify all panels render, login/logout works, notifications load.

### Step 3 — Review before deleting (MEDIUM confidence)
- `showImagePreviewModal` + `imagePreviewUrl`: Search template for any image modal — if no `v-if="showImagePreviewModal"` exists anywhere, safe to delete both.
- `notifImageRetries/Failed/Loaded + MAX_NOTIF_IMAGE_RETRIES`: Check if any notification `<img>` tag has `@error` handlers that reference these. If not, safe to delete.
- `announcementTextareaRef`: Check if the function at line ~11960 (`textarea = announcementTextareaRef.value; textarea.focus()`) is ever triggered from a button. If no button calls it, delete.

### Step 4 — Optional
- Delete `src/components/AnnouncementPopup.vue` file (it has no callers after Step 1).
- If `FastAverageColor` color extraction result is never used to drive any visible style, remove the import and the `fac` instance.

### Rollback Strategy
All changes can be reverted using the git checkpoint created before this audit session. Run a rollback to commit `c9f803e2d6e82a25b9f1d23d8158f4437f1c240c` to restore the pre-audit state.

---

## PART 7 — Dependencies Map

```
Dashboard.vue (script setup)
├── ProgrammerLoadingEffect  → src/components/ProgrammerLoadingEffect.vue  [ACTIVE]
├── RFIDLoadingEffect        → src/components/RFIDLoadingEffect.vue         [ACTIVE]
├── SessionExpiredModal      → src/components/SessionExpiredModal.vue       [ACTIVE]
├── ContributionsModal       → src/components/ContributionsModal.vue        [ACTIVE]
├── StudentContributionsView → src/components/StudentContributionsView.vue  [ACTIVE]
│   └── ContributionReceipt  → src/components/ContributionReceipt.vue      [ACTIVE via SCV]
├── StudentRaffleResultsView → src/components/StudentRaffleResultsView.vue  [ACTIVE]
├── AdminContributionPanel   → src/components/AdminContributionPanel.vue    [ACTIVE]
│   └── LoyversePOSPanel     → src/components/LoyversePOSPanel.vue         [ACTIVE via ACP]
├── AdminRaffleTicketPanel   → src/components/AdminRaffleTicketPanel.vue    [ACTIVE]
├── FaceRecognitionSettings  → src/components/FaceRecognitionSettings.vue   [ACTIVE]
├── Manage                   → src/components/Manage.vue                    [ACTIVE]
├── GeofenceMap              → src/components/GeofenceMap.vue               [ACTIVE]
├── StudentFaceEnroll        → src/components/StudentFaceEnroll.vue         [ACTIVE]
├── StudentFaceCheckIn       → src/components/StudentFaceCheckIn.vue        [ACTIVE]
├── LocationGate             → src/components/LocationGate.vue              [ACTIVE]
└── AnnouncementPopup        → src/components/AnnouncementPopup.vue         [DEAD - removed]

App.vue
└── LoadingScreen            → src/components/LoadingScreen.vue             [ACTIVE]

Login.vue / Register.vue
└── ParticleBackground       → src/components/ParticleBackground.vue        [ACTIVE]
```

---

*Report generated by AI static analysis. All deletions require manual verification and testing.*
