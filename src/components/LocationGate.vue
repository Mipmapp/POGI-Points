<template>
  <Transition name="lg-overlay">
    <!-- z-[800] sits above Leaflet's internal stacking (which goes up to
         ~z-700 for tooltips/popups). Without this the GeofenceMap on the
         Admin > Attendance > Scanner view bleeds in front of the modal. -->
    <div v-if="open" class="fixed inset-0 z-[800] flex items-center justify-center p-4 lg-backdrop" @click.self="closeIfIdle">
      <Transition name="lg-panel" appear>
        <div v-if="open" class="lg-panel relative w-full max-w-md overflow-hidden">

          <!-- Top glow bar -->
          <div class="absolute top-0 left-0 right-0 h-px lg-glow-bar"></div>

          <!-- Header — tightened vertical padding so the whole modal fits
               in 92vh without needing an inner scrollbar even on short
               phone viewports. -->
          <div class="px-5 pt-4 pb-2 flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <div class="lg-icon-wrap flex-shrink-0" :class="iconWrapClass">
                  <svg class="w-4 h-4" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-white tracking-tight">Location Check</h3>
              </div>
              <p class="text-xs text-blue-200/60 ml-11 truncate">{{ event?.title || 'Event' }}</p>
            </div>
            <button @click="closeIfIdle" :disabled="autoAdvancing" class="lg-close-btn flex-shrink-0 ml-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Stage banner -->
          <div class="mx-5 mb-3 rounded-2xl px-3.5 py-2.5 flex items-start gap-3 lg-stage-banner" :class="stageBannerClass">
            <span class="text-xl leading-none mt-0.5 flex-shrink-0">{{ stageIcon }}</span>
            <div class="min-w-0">
              <p class="text-sm font-semibold leading-snug">{{ stageMessage }}</p>
              <p v-if="stageHint" class="text-xs opacity-70 mt-0.5 leading-snug">{{ stageHint }}</p>
            </div>
          </div>

          <!-- Radar visual — capped at ~38vh so it shrinks on short
               viewports (landscape phones, small laptops). The aspect
               stays square but the whole square scales down to fit. -->
          <div class="mx-5 mb-3 flex justify-center">
            <div class="relative rounded-2xl overflow-hidden lg-radar-frame aspect-square w-full max-w-[38vh]">
              <!-- Background grid -->
              <div class="absolute inset-0 lg-radar-grid"></div>

              <!-- Concentric range rings -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="lg-range-ring lg-range-ring-3"></div>
                <div class="absolute lg-range-ring lg-range-ring-2"></div>
                <div class="absolute lg-range-ring lg-range-ring-1"></div>
              </div>

              <!-- Sweeping radar line (only while detecting) -->
              <div v-if="phase === 'detecting'" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="lg-radar-sweep"></div>
              </div>

              <!-- Pulsing sonar pings (only while detecting) -->
              <div v-if="phase === 'detecting'" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="lg-sonar-ping"></div>
                <div class="absolute lg-sonar-ping lg-sonar-ping-delayed"></div>
              </div>

              <!-- Event center dot -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="lg-center-dot"></div>
              </div>

              <!-- Geofence radius circle (visualizes the allowed range) -->
              <div v-if="phase !== 'detecting' && phase !== 'error'" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="lg-fence-circle" :class="phase === 'inside' ? 'lg-fence-inside' : 'lg-fence-outside'"></div>
              </div>

              <!-- User position dot -->
              <div v-if="phase === 'inside' || phase === 'outside'"
                   class="absolute inset-0 pointer-events-none lg-user-dot-wrap"
                   :style="userDotStyle">
                <div class="lg-user-dot" :class="phase === 'inside' ? 'lg-user-dot-inside' : 'lg-user-dot-outside'">
                  <div class="lg-user-dot-pulse"></div>
                </div>
              </div>

              <!-- Big result icon overlay -->
              <Transition name="lg-result">
                <div v-if="phase === 'inside'" class="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  <span class="text-xs font-bold text-emerald-200 tracking-wide">IN RANGE</span>
                </div>
              </Transition>
              <Transition name="lg-result">
                <div v-if="phase === 'outside'" class="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-400/40 backdrop-blur-md flex items-center gap-1.5 lg-shake">
                  <svg class="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                  <span class="text-xs font-bold text-red-200 tracking-wide">OUT OF RANGE</span>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Distance & accuracy stats -->
          <div class="mx-5 mb-3 grid grid-cols-3 gap-2">
            <div class="lg-stat-card">
              <p class="lg-stat-label">Distance</p>
              <p class="lg-stat-value tabular-nums">
                <span v-if="phase === 'detecting' || phase === 'error'">—</span>
                <span v-else>{{ animatedDistance }}<span class="lg-stat-unit">m</span></span>
              </p>
            </div>
            <div class="lg-stat-card">
              <p class="lg-stat-label">Allowed</p>
              <p class="lg-stat-value tabular-nums">{{ radius }}<span class="lg-stat-unit">m</span></p>
            </div>
            <div class="lg-stat-card">
              <p class="lg-stat-label">Accuracy</p>
              <p class="lg-stat-value tabular-nums">
                <span v-if="phase === 'detecting' || phase === 'error' || accuracy == null">—</span>
                <span v-else>±{{ Math.round(accuracy) }}<span class="lg-stat-unit">m</span></span>
              </p>
            </div>
          </div>

          <!-- Auto-advance progress (when inside) -->
          <div v-if="autoAdvancing" class="mx-5 mb-3">
            <div class="lg-advance-bar">
              <div class="lg-advance-bar-fill"></div>
            </div>
            <p class="text-xs text-emerald-200/70 mt-1.5 text-center">{{ advanceCaption }}</p>
          </div>

          <!-- Actions -->
          <div class="px-5 pb-5 flex gap-3">
            <button @click="closeIfIdle" :disabled="autoAdvancing" class="lg-btn-cancel flex-1">
              Cancel
            </button>
            <button v-if="phase === 'outside' || phase === 'error'" @click="restart" class="lg-btn-retry flex-1">
              <svg class="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Re-check
            </button>
          </div>

          <!-- Bottom glow bar -->
          <div class="absolute bottom-0 left-0 right-0 h-px lg-glow-bar-bottom"></div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  event: { type: Object, default: () => ({}) },
  // Theme flags so the Re-check button can match the user's college accent.
  isCOE: { type: Boolean, default: false },
  isSOM: { type: Boolean, default: false },
  isCNAHS: { type: Boolean, default: false },
  // Caption shown under the auto-advance progress bar after a successful
  // detection. Defaults to the Face-ID scanner copy because that's the
  // original use case; admin scanner re-uses this component with a
  // different caption (e.g. "Unlocking RFID scanner…").
  advanceCaption: { type: String, default: 'Opening Face ID scanner…' }
})
const emit = defineEmits(['close', 'pass'])

// ── Phases ────────────────────────────────────────────────
//  'detecting' → asking the browser for GPS
//  'inside'    → coords found, user is inside the geofence
//  'outside'   → coords found, user is outside the geofence
//  'error'     → permission denied / timeout / no GPS
const phase = ref('detecting')
const errorMessage = ref('')
const distance = ref(0)         // meters
const animatedDistance = ref(0) // meters, animates up from 0 for the radar UI
const accuracy = ref(null)      // meters, ± from GPS
const userCoords = ref(null)    // { lat, lng }
const autoAdvancing = ref(false)
let advanceTimer = null
let countTimer = null

const radius = computed(() => Number(props.event?.geofence_radius_meters) || 80)
const eventLat = computed(() => Number(props.event?.geofence_lat))
const eventLng = computed(() => Number(props.event?.geofence_lng))

// ── Stage UX ──────────────────────────────────────────────
const stageBannerClass = computed(() => {
  if (phase.value === 'inside') return 'lg-stage-success'
  if (phase.value === 'outside' || phase.value === 'error') return 'lg-stage-error'
  return 'lg-stage-info'
})
const stageIcon = computed(() => {
  if (phase.value === 'inside') return '✓'
  if (phase.value === 'outside') return '!'
  if (phase.value === 'error') return '⚠'
  return '⌖'
})
const stageMessage = computed(() => {
  if (phase.value === 'detecting') return 'Detecting your location…'
  if (phase.value === 'inside') {
    return `You're inside the event area (~${Math.round(distance.value)}m from center).`
  }
  if (phase.value === 'outside') {
    return `You're ~${Math.round(distance.value)}m from the event, but must be within ${radius.value}m.`
  }
  return errorMessage.value || 'Could not determine your location.'
})
const stageHint = computed(() => {
  if (phase.value === 'detecting') return 'Hold still — pinging your GPS…'
  if (phase.value === 'inside') return 'Face ID scanner will open in a moment.'
  if (phase.value === 'outside') return 'Move closer to the event location, then tap Re-check.'
  if (phase.value === 'error') return 'Make sure GPS is on and you\'ve allowed this site to use your location.'
  return ''
})

const iconWrapClass = computed(() => {
  if (phase.value === 'inside') return 'lg-icon-wrap-success'
  if (phase.value === 'outside' || phase.value === 'error') return 'lg-icon-wrap-error'
  return 'lg-icon-wrap-info'
})
const iconColorClass = computed(() => {
  if (phase.value === 'inside') return 'text-emerald-300'
  if (phase.value === 'outside' || phase.value === 'error') return 'text-red-300'
  return 'text-blue-300'
})

// ── User dot positioning ──────────────────────────────────
// We map distance → radial position on the radar. The middle ring of the
// radar represents the geofence radius, so a user exactly at the radius sits
// on that ring; further away, they sit between the middle and outer rings,
// clamped just inside the outer edge so they're always visible.
const userDotStyle = computed(() => {
  if (!userCoords.value || !Number.isFinite(eventLat.value) || !Number.isFinite(eventLng.value)) return {}
  const lat1 = eventLat.value, lng1 = eventLng.value
  const lat2 = userCoords.value.lat, lng2 = userCoords.value.lng
  // Bearing from event to user, in radians, with 0 = north, increasing clockwise.
  const phi1 = lat1 * Math.PI / 180
  const phi2 = lat2 * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng)
  const bearing = Math.atan2(y, x) // 0 = north, +π/2 = east
  // Map distance to a 0..1 fraction of the radar's outer edge. The middle
  // ring is the geofence boundary at fraction 0.6 (so inside fits comfortably
  // in the inner area). Outside users get pushed toward the edge but never
  // outside the radar so they stay on screen.
  const ratio = distance.value / Math.max(1, radius.value)
  const frac = ratio <= 1
    ? Math.min(0.6, ratio * 0.6)            // inside: 0..0.6
    : Math.min(0.92, 0.6 + (ratio - 1) * 0.18) // outside: 0.6..0.92
  // Polar → Cartesian. Y is screen-down so negate sin component for north-up.
  const dx = Math.sin(bearing) * frac
  const dy = -Math.cos(bearing) * frac
  // Convert to percent offsets from center.
  const left = 50 + dx * 50
  const top  = 50 + dy * 50
  return { left: `${left}%`, top: `${top}%` }
})

// ── Lifecycle ─────────────────────────────────────────────
watch(() => props.open, (val) => {
  if (val) start()
  else cleanupTimers()
}, { immediate: true })

function cleanupTimers() {
  if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null }
  if (countTimer)   { clearInterval(countTimer); countTimer = null }
  autoAdvancing.value = false
}

function resetState() {
  cleanupTimers()
  phase.value = 'detecting'
  errorMessage.value = ''
  distance.value = 0
  animatedDistance.value = 0
  accuracy.value = null
  userCoords.value = null
}

function restart() {
  resetState()
  start()
}

async function start() {
  resetState()
  // Sanity: an event without a configured geofence center should never reach
  // this gate. If it does, just pass through immediately rather than blocking
  // the user with a fake "outside" verdict.
  if (!Number.isFinite(eventLat.value) || !Number.isFinite(eventLng.value)) {
    emit('pass', { lat: null, lng: null, accuracy: null })
    return
  }
  if (!('geolocation' in navigator)) {
    phase.value = 'error'
    errorMessage.value = 'This device does not support GPS, which is required for this event.'
    return
  }
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000
      })
    })
    if (!props.open) return
    const lat = pos.coords.latitude
    const lng = pos.coords.longitude
    const acc = pos.coords.accuracy
    userCoords.value = { lat, lng }
    accuracy.value = acc
    const d = haversineMeters(eventLat.value, eventLng.value, lat, lng)
    distance.value = d
    // Match the backend's allowed slack so the on-screen verdict agrees with
    // what the server will actually accept. Backend uses
    // radius + max(15, accuracy*0.5) (capped at radius).
    const slack = Math.min(radius.value, Math.max(15, (acc || 0) * 0.5))
    const effective = radius.value + slack
    const inside = d <= effective
    animateDistanceTo(d)
    phase.value = inside ? 'inside' : 'outside'
    if (inside) {
      // Auto-advance to the face scanner after a short reveal so the user
      // has a moment to see the green confirmation. ~1.2s feels snappy
      // without skipping the feedback.
      autoAdvancing.value = true
      advanceTimer = setTimeout(() => {
        autoAdvancing.value = false
        emit('pass', { lat, lng, accuracy: acc })
      }, 1200)
    }
  } catch (err) {
    if (!props.open) return
    phase.value = 'error'
    errorMessage.value = err && err.code === 1
      ? 'Location permission denied. Please allow location to check in for this event.'
      : 'Could not get your location. Make sure GPS is on and try again.'
  }
}

// Animate the displayed distance from 0 → real value over ~600ms so the
// number "ticks up" instead of snapping. Pure cosmetic effect.
function animateDistanceTo(target) {
  if (countTimer) { clearInterval(countTimer); countTimer = null }
  const start = 0
  const startTime = Date.now()
  const duration = 650
  countTimer = setInterval(() => {
    const t = Math.min(1, (Date.now() - startTime) / duration)
    // ease-out quad
    const eased = 1 - (1 - t) * (1 - t)
    animatedDistance.value = Math.round(start + (target - start) * eased)
    if (t >= 1) { clearInterval(countTimer); countTimer = null; animatedDistance.value = Math.round(target) }
  }, 30)
}

function closeIfIdle() {
  if (autoAdvancing.value) return
  cleanupTimers()
  emit('close')
}

// ── Geo math ──────────────────────────────────────────────
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (deg) => deg * Math.PI / 180
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dPhi = toRad(lat2 - lat1)
  const dLam = toRad(lng2 - lng1)
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

onBeforeUnmount(() => cleanupTimers())
</script>

<style scoped>
/* ── Backdrop ─────────────────────────────────────────────── */
.lg-backdrop {
  background: rgba(8, 14, 46, 0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ── Panel (matches Face ID modal) ────────────────────────── */
.lg-panel {
  background: linear-gradient(150deg, #0d1a5e 0%, #080e2e 60%, #060b22 100%);
  border: 1px solid rgba(99, 146, 255, 0.18);
  border-radius: 28px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset;
  max-height: 92vh;
  overflow-y: auto;
}

/* ── Glow bars ────────────────────────────────────────────── */
.lg-glow-bar {
  background: linear-gradient(90deg, transparent, rgba(99,146,255,0.6), transparent);
}
.lg-glow-bar-bottom {
  background: linear-gradient(90deg, transparent, rgba(99,146,255,0.2), transparent);
}

/* ── Icon wrap ────────────────────────────────────────────── */
.lg-icon-wrap {
  width: 32px; height: 32px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.4s, border-color 0.4s;
}
.lg-icon-wrap-info    { background: rgba(99, 146, 255, 0.18);  border: 1px solid rgba(99, 146, 255, 0.25); }
.lg-icon-wrap-success { background: rgba(34, 197, 94, 0.18);   border: 1px solid rgba(74, 222, 128, 0.35); }
.lg-icon-wrap-error   { background: rgba(239, 68, 68, 0.18);   border: 1px solid rgba(248, 113, 113, 0.35); }

/* ── Close button ─────────────────────────────────────────── */
.lg-close-btn {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.45);
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  transition: all 0.2s;
  cursor: pointer;
}
.lg-close-btn:hover { color: white; background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
.lg-close-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Stage banner ─────────────────────────────────────────── */
.lg-stage-banner { transition: background 0.4s, border-color 0.4s; }
.lg-stage-info    { background: rgba(59,130,246,0.15);  border: 1px solid rgba(96,165,250,0.35); color: #93c5fd; }
.lg-stage-success { background: rgba(34,197,94,0.15);   border: 1px solid rgba(74,222,128,0.35); color: #86efac; }
.lg-stage-error   { background: rgba(239,68,68,0.15);   border: 1px solid rgba(248,113,113,0.35); color: #fca5a5; }

/* ── Radar frame ──────────────────────────────────────────── */
.lg-radar-frame {
  background: radial-gradient(circle at center, rgba(30,59,219,0.18) 0%, rgba(6,11,34,0.95) 70%);
  box-shadow: 0 0 0 1px rgba(99,146,255,0.2), 0 8px 32px rgba(0,0,0,0.5);
}
.lg-radar-grid {
  background-image:
    linear-gradient(rgba(99,146,255,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,146,255,0.08) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(circle at center, black 50%, transparent 80%);
  -webkit-mask-image: radial-gradient(circle at center, black 50%, transparent 80%);
}

/* ── Concentric range rings ───────────────────────────────── */
.lg-range-ring {
  border-radius: 50%;
  border: 1px dashed rgba(99,146,255,0.25);
}
.lg-range-ring-1 { width: 30%; height: 30%; }
.lg-range-ring-2 { width: 60%; height: 60%; }
.lg-range-ring-3 { width: 90%; height: 90%; }

/* ── Radar sweep (rotating gradient) ──────────────────────── */
.lg-radar-sweep {
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(99,146,255,0.5) 0deg, rgba(99,146,255,0.0) 90deg, transparent 360deg);
  animation: lg-sweep 2.4s linear infinite;
  filter: blur(0.5px);
}
@keyframes lg-sweep { to { transform: rotate(360deg); } }

/* ── Sonar pings ──────────────────────────────────────────── */
.lg-sonar-ping {
  width: 18%; height: 18%;
  border-radius: 50%;
  border: 2px solid rgba(99,146,255,0.5);
  animation: lg-ping 2.2s ease-out infinite;
}
.lg-sonar-ping-delayed { animation-delay: 1.1s; }
@keyframes lg-ping {
  0%   { transform: scale(0.4); opacity: 0.9; border-width: 2px; }
  80%  { opacity: 0.05; }
  100% { transform: scale(4.2); opacity: 0; border-width: 1px; }
}

/* ── Center dot (event location) ──────────────────────────── */
.lg-center-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, #7d2fa3 0%, #3d1154 100%);
  box-shadow: 0 0 12px rgba(125,47,163,0.8), 0 0 24px rgba(125,47,163,0.4);
  position: relative;
}
.lg-center-dot::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px solid rgba(99,146,255,0.4);
  animation: lg-center-pulse 2.4s ease-in-out infinite;
}
@keyframes lg-center-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50%      { transform: scale(1.4); opacity: 0.1; }
}

/* ── Geofence radius circle (revealed after detection) ────── */
.lg-fence-circle {
  width: 60%; height: 60%;
  border-radius: 50%;
  border: 2px solid;
  animation: lg-fence-snap 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.lg-fence-inside  {
  border-color: rgba(74,222,128,0.7);
  box-shadow: 0 0 24px rgba(74,222,128,0.25), inset 0 0 24px rgba(74,222,128,0.12);
}
.lg-fence-outside {
  border-color: rgba(248,113,113,0.7);
  border-style: dashed;
  box-shadow: 0 0 24px rgba(248,113,113,0.25), inset 0 0 24px rgba(248,113,113,0.12);
}
@keyframes lg-fence-snap {
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* ── User dot (the student's position on the radar) ───────── */
.lg-user-dot-wrap {
  /* `top`/`left` are set inline via :style; we shift -50% to center the dot
     on the computed point. transition makes the dot glide into place. */
  transition: top 0.7s cubic-bezier(0.16, 1, 0.3, 1), left 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.lg-user-dot {
  position: absolute;
  width: 14px; height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid white;
}
.lg-user-dot-inside  { background: #22c55e; box-shadow: 0 0 12px rgba(74,222,128,0.9); }
.lg-user-dot-outside { background: #ef4444; box-shadow: 0 0 12px rgba(248,113,113,0.9); }
.lg-user-dot-pulse {
  position: absolute; inset: -4px;
  border-radius: 50%;
  border: 2px solid currentColor;
  color: inherit;
  animation: lg-dot-pulse 1.6s ease-out infinite;
}
.lg-user-dot-inside  .lg-user-dot-pulse { color: rgba(74,222,128,0.7); }
.lg-user-dot-outside .lg-user-dot-pulse { color: rgba(248,113,113,0.7); }
@keyframes lg-dot-pulse {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(2.6); opacity: 0; }
}

/* ── Result chip transitions ──────────────────────────────── */
.lg-result-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.lg-result-enter-from   { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.92); }
.lg-result-enter-to     { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }

/* ── Shake (out-of-range chip) ────────────────────────────── */
.lg-shake { animation: lg-shake-anim 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.2s; }
@keyframes lg-shake-anim {
  10%, 90% { transform: translateX(calc(-50% - 1px)); }
  20%, 80% { transform: translateX(calc(-50% + 2px)); }
  30%, 50%, 70% { transform: translateX(calc(-50% - 4px)); }
  40%, 60% { transform: translateX(calc(-50% + 4px)); }
}

/* ── Stat cards ───────────────────────────────────────────── */
.lg-stat-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(99,146,255,0.15);
  border-radius: 14px;
  padding: 8px 10px;
  text-align: center;
}
.lg-stat-label {
  font-size: 10px;
  color: rgba(147,197,253,0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 2px;
}
.lg-stat-value {
  font-size: 16px;
  font-weight: 700;
  color: white;
}
.lg-stat-unit {
  font-size: 11px;
  font-weight: 500;
  color: rgba(147,197,253,0.6);
  margin-left: 1px;
}

/* ── Auto-advance bar ─────────────────────────────────────── */
.lg-advance-bar {
  height: 4px;
  border-radius: 999px;
  background: rgba(74,222,128,0.18);
  overflow: hidden;
}
.lg-advance-bar-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  transform-origin: left center;
  animation: lg-advance-fill 1.2s linear forwards;
}
@keyframes lg-advance-fill {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

/* ── Buttons ──────────────────────────────────────────────── */
.lg-btn-cancel,
.lg-btn-retry {
  height: 44px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  cursor: pointer;
}
.lg-btn-cancel {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
  border: 1px solid rgba(255,255,255,0.12);
}
.lg-btn-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
.lg-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }
.lg-btn-retry {
  background: linear-gradient(135deg, #3d1154, #7d2fa3);
  color: white;
  border: 1px solid rgba(125,47,163,0.4);
  box-shadow: 0 8px 20px rgba(61,17,84,0.35);
}
.lg-btn-retry:hover { transform: translateY(-1px); box-shadow: 0 12px 24px rgba(61,17,84,0.45); }
.lg-btn-retry:active { transform: translateY(0); }

/* ── Overlay & panel transitions ──────────────────────────── */
.lg-overlay-enter-active,
.lg-overlay-leave-active { transition: opacity 0.3s; }
.lg-overlay-enter-from,
.lg-overlay-leave-to { opacity: 0; }

.lg-panel-enter-active,
.lg-panel-leave-active { transition: opacity 0.4s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.lg-panel-enter-from { opacity: 0; transform: translateY(24px) scale(0.96); }
.lg-panel-leave-to   { opacity: 0; transform: translateY(12px) scale(0.98); }
</style>
