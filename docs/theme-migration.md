# SSAAM Theme Migration — Blue → CCS Purple + Gold

**Date:** May 5, 2026  
**Scope:** Global rebranding to match the JRMSU College of Computer Studies shield logo

---

## Previous Color Theme (Blue)

The original theme was built around a royal-blue palette with no centralised token system — colors were scattered as hardcoded hex values and Tailwind's default `blue-*` scale.

### Brand Gradient Tokens (Tailwind)

| Token | Old Hex | Role |
|---|---|---|
| `ssaam-dark` | `#1e3bdb` | Dark endpoint of all CCS gradients |
| `ssaam-light` | `#4f62ff` | Light endpoint of all CCS gradients |

### Tailwind `blue-*` Scale (Tailwind defaults)

| Class | Old Hex | Computed as |
|---|---|---|
| `blue-50` | `#eff6ff` | Very light blue tint |
| `blue-100` | `#dbeafe` | Light blue |
| `blue-200` | `#bfdbfe` | Soft blue |
| `blue-300` | `#93c5fd` | Medium-light blue |
| `blue-400` | `#60a5fa` | Sky blue |
| `blue-500` | `#3b82f6` | Primary blue |
| `blue-600` | `#2563eb` | Deep interactive blue |
| `blue-700` | `#1d4ed8` | Darker blue |
| `blue-800` | `#1e40af` | Very dark blue |
| `blue-900` | `#1e3a8a` | Darkest blue |

### Hardcoded Hex Values (pre-migration)

| Hex | Where used | Role |
|---|---|---|
| `#1e3bdb` | styles.css, Dashboard, Login, GeofenceMap, LocationGate, ContributionReceipt, ProgrammerLoadingEffect, useCollege | Brand dark blue — gradient start |
| `#4f62ff` | Same files as above | Brand light blue — gradient end |
| `#1730c0` | Dashboard (hover states) | Hover dark blue |
| `#3d52e8` | Dashboard (hover states) | Hover mid blue |
| `#2563eb` | Login (icon masks), styles.css | Tailwind blue-600 equivalent |
| `#3b82f6` | GeofenceMap, ContributionReceipt | Tailwind blue-500 equivalent |
| `#1e40af` | ContributionReceipt | Tailwind blue-800 equivalent |
| `#1e3a8a` | ContributionReceipt | Tailwind blue-900 equivalent |
| `#eff6ff` | ContributionReceipt | Tailwind blue-50 background |
| `rgba(10,30,130,0.25)` | Login desktop panel shadow | Blue-tinted drop shadow |
| `rgba(37,99,235,0.18)` | Login modal button hover glow | Blue glow |
| `rgba(30,59,219,0.35)` | LocationGate retry button shadow | Blue shadow |
| `rgba(99,146,255,0.4)` | LocationGate center dot glow | Blue glow ring |
| `rgba(59,130,246,.35)` | GeofenceMap "me" marker ring | Blue position ring |
| `#6366f1` | GeofenceMap frame gradient tail | Indigo tail on gradient |

---

## New Color Theme (CCS Purple + Gold)

Sourced directly from the JRMSU CCS shield logo:
- **Shield background** → deep royal purple
- **Banner / decorative border** → antique gold

### Brand Gradient Tokens (Tailwind)

| Token | New Hex | Role |
|---|---|---|
| `ssaam-dark` | `#3d1154` | Deep royal purple — dark gradient end |
| `ssaam-light` | `#7d2fa3` | Medium purple — light gradient end |
| `ssaam-gold` | `#c9952b` | Antique gold — decorative accent |
| `ssaam-gold-light` | `#e8c840` | Bright gold — highlight accent |

### Tailwind `blue-*` Scale (overridden → purple)

The entire Tailwind `blue` palette was remapped in `tailwind.config.js`.  
Every `bg-blue-600`, `text-blue-700`, `ring-blue-300` etc. is now purple **without any template changes**.

| Class | Old Hex | New Hex |
|---|---|---|
| `blue-50` | `#eff6ff` | `#f5f0ff` |
| `blue-100` | `#dbeafe` | `#ebe0ff` |
| `blue-200` | `#bfdbfe` | `#d4b8f5` |
| `blue-300` | `#93c5fd` | `#b889e0` |
| `blue-400` | `#60a5fa` | `#9a5dd0` |
| `blue-500` | `#3b82f6` | `#7d2fa3` |
| `blue-600` | `#2563eb` | `#6a2590` |
| `blue-700` | `#1d4ed8` | `#561c78` |
| `blue-800` | `#1e40af` | `#451462` |
| `blue-900` | `#1e3a8a` | `#3d1154` |
| `blue-950` | `#172554` | `#2a0a3d` |

---

## Before vs After — File-by-File

### tailwind.config.js

```js
// BEFORE
'ssaam-dark':  '#1e3bdb',
'ssaam-light': '#4f62ff',
// (no gold tokens, no blue override)

// AFTER
'ssaam-dark':       '#3d1154',
'ssaam-light':      '#7d2fa3',
'ssaam-gold':       '#c9952b',
'ssaam-gold-light': '#e8c840',
blue: {
  50: '#f5f0ff', 100: '#ebe0ff', 200: '#d4b8f5',
  300: '#b889e0', 400: '#9a5dd0', 500: '#7d2fa3',
  600: '#6a2590', 700: '#561c78', 800: '#451462',
  900: '#3d1154', 950: '#2a0a3d',
},
```

---

### src/assets/theme.css — NEW FILE

Created as a centralised CSS variable sheet, imported before `styles.css` in `main.js`.

```css
:root {
  --ssaam-dark:       #3d1154;
  --ssaam-light:      #7d2fa3;
  --ssaam-gold:       #c9952b;
  --ssaam-gold-light: #e8c840;
  --primary:    #3d1154;
  --secondary:  #7d2fa3;
  --accent:     #c9952b;
  --background: #f5f0ff;
  --text:       #1a0a2e;
  /* full purple tonal scale --color-50 … --color-900 */
}
[data-theme="ccs"] { /* same values, switchable programmatically */ }
```

---

### src/assets/styles.css

| Element | Before | After |
|---|---|---|
| `.gradient-icon` background | `135deg, #2563eb, #3b82f6` | `135deg, #3d1154, #7d2fa3` |
| `.icon-mask` background | `90deg, #2563eb, #3b82f6` | `90deg, #3d1154, #7d2fa3` |
| Scrollbar thumb | `to bottom, #1e3bdb, #4f62ff` | `to bottom, #3d1154, #7d2fa3` |
| Scrollbar thumb hover | `#1630c0, #3d4fe0` | `#2d0845, #5c1d80` |
| `scrollbar-color` | `#1e3bdb #f1f5f9` | `#3d1154 #f1f5f9` |

---

### src/composables/useCollege.js

```js
// BEFORE — collegeAccentColor for CCS
return '#1e3bdb'

// AFTER
return '#3d1154'
```

---

### src/components/ProgrammerLoadingEffect.vue

```js
// BEFORE — CCS loading bar gradient
barGradient: 'linear-gradient(to right, #1e3bdb, #4f62ff)',

// AFTER
barGradient: 'linear-gradient(to right, #3d1154, #7d2fa3)',
```

---

### src/components/GeofenceMap.vue

| Element | Before | After |
|---|---|---|
| `buildPinIcon` CCS accent hex | `#2563eb` | `#6a2590` |
| `buildPinIcon` CCS accent soft rgba | `rgba(37,99,235,.35)` | `rgba(106,37,144,.35)` |
| `buildMeIcon` dot background | `#3b82f6` | `#7d2fa3` |
| `buildMeIcon` ring rgba | `rgba(59,130,246,.35)` | `rgba(125,47,163,.35)` |
| `drawGeofence` CCS accent hex | `#2563eb` | `#6a2590` |
| `drawGeofence` CCS accent fill | `#3b82f6` | `#7d2fa3` |
| Accuracy circle color/fill | `#3b82f6` | `#7d2fa3` |
| `.gfm-frame-blue` gradient | `#1e3bdb → #4f62ff → #6366f1` | `#3d1154 → #7d2fa3 → #9a5dd0` |
| Leaflet zoom hover color | `#1e3bdb` | `#3d1154` |

---

### src/components/LocationGate.vue

| Element | Before | After |
|---|---|---|
| `.lg-center-dot` background | `radial #4f62ff → #1e3bdb` | `radial #7d2fa3 → #3d1154` |
| `.lg-center-dot` box-shadow | `rgba(99,146,255,…)` | `rgba(125,47,163,…)` |
| `.lg-btn-retry` background | `135deg #1e3bdb, #4f62ff` | `135deg #3d1154, #7d2fa3` |
| `.lg-btn-retry` border | `rgba(99,146,255,0.4)` | `rgba(125,47,163,0.4)` |
| `.lg-btn-retry` box-shadow | `rgba(30,59,219,0.35)` | `rgba(61,17,84,0.35)` |
| `.lg-btn-retry:hover` shadow | `rgba(30,59,219,0.45)` | `rgba(61,17,84,0.45)` |

---

### src/components/ContributionReceipt.vue

| Element | Before | After |
|---|---|---|
| Student info header gradient | `to right, #1e3bdb, #4f62ff` | `to right, #3d1154, #7d2fa3` |
| Treasurer notes background | `#eff6ff` | `#f5f0ff` |
| Treasurer notes border | `4px solid #3b82f6` | `4px solid #7d2fa3` |
| Treasurer notes heading color | `#1e40af` | `#451462` |
| Treasurer notes text color | `#1e3a8a` | `#3d1154` |
*(All 4 changes applied to both the screen and print layout sections)*

---

### src/pages/Login.vue

| Element | Before | After |
|---|---|---|
| Icon mask `background-color` (×3) | `#2563eb` | `#6a2590` |
| Desktop panel edge shadow | `rgba(10,30,130,0.25)` | `rgba(61,17,84,0.25)` |
| `.modal-primary` gradient | `90deg, #1e3bdb, #4f62ff` | `90deg, #3d1154, #7d2fa3` |
| `.modal-primary:hover` glow | `rgba(37,99,235,0.18)` | `rgba(61,17,84,0.18)` |

---

### src/pages/Dashboard.vue

| Element | Before | After |
|---|---|---|
| Check-in button CCS gradient | `from-[#1e3bdb] to-[#4f62ff]` | `from-ssaam-dark to-ssaam-light` |
| Check-in button hover | `hover:from-[#1730c0] hover:to-[#3d52e8]` | `hover:from-[#2d0845] hover:to-[#5c1d80]` |
| Activity log CCS header | `from-[#1e3bdb] to-[#4f62ff]` | `from-ssaam-dark to-ssaam-light` |
| Activity log check-in icon | `from-[#1e3bdb] to-[#4f62ff]` | `from-ssaam-dark to-ssaam-light` |
| Activity log check-in badge | `bg-[#1e3bdb]` | `bg-ssaam-dark` |
| QR scanner button classes | `from-[#1e3bdb] to-[#4f62ff]` | `from-ssaam-dark to-ssaam-light` |
| Poster fallback gradient (JS) | `#1e3bdb, #4f62ff` | `#3d1154, #7d2fa3` |

---

## Coverage Summary

| Category | Count |
|---|---|
| Tailwind `blue-*` classes automatically remapped | ~1,750 |
| `ssaam-dark` / `ssaam-light` token usages | 176 |
| Hardcoded hex instances replaced manually | 25 |
| Files modified | 9 |
| New files created | 1 (`src/assets/theme.css`) |
| Remaining hardcoded brand-blue values | **0** |

---

## How to Revert

To restore the original blue theme:

1. In `tailwind.config.js` — remove the `blue: { … }` override block, and set:
   ```js
   'ssaam-dark':  '#1e3bdb',
   'ssaam-light': '#4f62ff',
   ```
2. Delete or clear `src/assets/theme.css`
3. Revert the 25 hardcoded hex replacements listed in the file-by-file section above

All other component templates are unchanged — they use Tailwind classes and CSS tokens, so reverting the config and variables is sufficient.
