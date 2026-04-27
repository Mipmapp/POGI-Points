<template>
  <Transition name="fci-overlay">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 fci-backdrop" @click.self="closeIfIdle">
      <Transition name="fci-panel" appear>
        <div v-if="open" class="fci-panel relative w-full max-w-md overflow-hidden">

          <!-- Top glow bar -->
          <div class="absolute top-0 left-0 right-0 h-px fci-glow-bar"></div>

          <!-- Header -->
          <div class="px-6 pt-6 pb-4 flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <div class="fci-icon-wrap flex-shrink-0">
                  <svg class="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-white tracking-tight">Face ID Check-In</h3>
              </div>
              <p class="text-xs text-blue-200/60 ml-11 truncate">{{ session?.label || 'Session' }} &middot; {{ event?.title || 'Event' }}</p>
            </div>
            <button @click="closeIfIdle" :disabled="submitting" class="fci-close-btn flex-shrink-0 ml-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Stage banner -->
          <div class="mx-6 mb-4 rounded-2xl px-4 py-3 flex items-start gap-3 fci-stage-banner" :class="stageBannerClass">
            <span class="text-xl leading-none mt-0.5 flex-shrink-0">{{ stageStyle.icon }}</span>
            <div class="min-w-0">
              <p class="text-sm font-semibold leading-snug">{{ stageMessage }}</p>
              <p v-if="stageHint" class="text-xs opacity-70 mt-0.5 leading-snug">{{ stageHint }}</p>
            </div>
          </div>

          <!-- Camera area -->
          <div class="mx-6 mb-4">
            <div class="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] fci-camera-frame">
              <video ref="videoEl" autoplay muted playsinline
                :class="['w-full h-full object-cover transition-opacity duration-500', cameraReady ? 'opacity-100' : 'opacity-0']"
                style="transform: scaleX(-1);" />

              <!-- Loading state -->
              <div v-if="!cameraReady" class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="fci-spinner mb-3"></div>
                <span class="text-sm text-blue-200/70 font-medium">{{ camStatus }}</span>
              </div>

              <!-- Head turn cues -->
              <div v-if="cameraReady && currentChallenge === 'turn_left'" class="absolute inset-0 flex items-center justify-start pointer-events-none">
                <div class="text-white/80 text-7xl font-bold animate-pulse pl-4">←</div>
              </div>
              <div v-if="cameraReady && currentChallenge === 'turn_right'" class="absolute inset-0 flex items-center justify-end pointer-events-none">
                <div class="text-white/80 text-7xl font-bold animate-pulse pr-4">→</div>
              </div>
              <div v-if="cameraReady && currentChallenge === 'blink'" class="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
                <div class="fci-blink-pill">Blink twice</div>
              </div>

              <!-- Face oval -->
              <div v-if="cameraReady" class="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
                  <ellipse cx="50" cy="48" rx="22" ry="30" fill="none"
                    :stroke="faceLocked ? '#4ade80' : (faceDetected ? '#fbbf24' : 'rgba(255,255,255,0.25)')"
                    stroke-width="0.6" stroke-dasharray="2 1.5" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Challenge chips -->
          <div v-if="challenges.length" class="mx-6 mb-4 flex items-center gap-2 flex-wrap">
            <div v-for="(c, idx) in challenges" :key="c"
              :class="['fci-chip', completed.includes(c) ? 'fci-chip-done' : idx === currentChallengeIndex ? 'fci-chip-active' : 'fci-chip-idle']">
              <span v-if="completed.includes(c)">✓</span>
              <span v-else-if="idx === currentChallengeIndex" class="animate-pulse">●</span>
              <span v-else>○</span>
              {{ challengeLabel(c) }}
            </div>
          </div>

          <!-- Actions -->
          <div class="px-6 pb-6 flex gap-3">
            <button @click="closeIfIdle" :disabled="submitting" class="fci-btn-cancel flex-1">
              {{ successMessage ? 'Close' : 'Cancel' }}
            </button>
            <button v-if="failed && !successMessage" @click="restart" class="fci-btn-retry flex-1">
              Try Again
            </button>
          </div>

          <!-- Bottom glow bar -->
          <div class="absolute bottom-0 left-0 right-0 h-px fci-glow-bar-bottom"></div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { ensureModelsLoaded, getFaceApi } from '../utils/faceapi.js'
import { buildAPIUrl } from '../config/api.js'
import { encodeTimestamp } from '../utils/ssaamCrypto.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  event: { type: Object, default: () => ({}) },
  session: { type: Object, default: () => ({}) },
  isCOE: { type: Boolean, default: false },
  isSOM: { type: Boolean, default: false },
  isCNAHS: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'success'])

// ---- Theme (kept for backwards compat)
const accentText = computed(() => props.isCOE ? 'text-orange-900' : props.isSOM ? 'text-green-900' : props.isCNAHS ? 'text-emerald-900' : 'text-purple-900')
const accentBg = computed(() => props.isCOE ? 'bg-orange-600' : props.isSOM ? 'bg-green-600' : props.isCNAHS ? 'bg-emerald-600' : 'bg-purple-600')
const accentBorder = computed(() => props.isCOE ? 'border-orange-100' : props.isSOM ? 'border-green-100' : props.isCNAHS ? 'border-emerald-100' : 'border-purple-100')

const stageBannerClass = computed(() => {
  if (successMessage.value) return 'fci-stage-success'
  if (errorMessage.value || failed.value) return 'fci-stage-error'
  if (submitting.value) return 'fci-stage-info'
  if (currentChallenge.value) return 'fci-stage-challenge'
  return 'fci-stage-default'
})

// ---- Camera + state
const videoEl = ref(null)
let mediaStream = null
let detectionLoopHandle = null
const cameraReady = ref(false)
const camStatus = ref('Loading camera…')
const faceDetected = ref(false)
const faceLocked = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const submitting = ref(false)
const failed = ref(false)

// ---- Challenge state
const challengeToken = ref('')
const challenges = ref([])
const completed = ref([])
const currentChallengeIndex = ref(0)
const currentChallenge = computed(() => challenges.value[currentChallengeIndex.value])

// Per-challenge transient state
const blinkState = ref({ wasOpen: true, blinkCount: 0 })
const turnState = ref({ neutralFrames: 0, deepTurnFrames: 0 })

// Capture / sampling
const samplesCount = ref(0)
const captured = ref([])  // { descriptor, score }
let lastSampleAt = 0
const TARGET_VALID_FRAMES = 30 // for descriptor averaging

// ---- Stage UX
const stageStyle = computed(() => {
  if (successMessage.value) return { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', icon: '✓' }
  if (errorMessage.value || failed.value) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '!' }
  if (submitting.value) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '↻' }
  if (currentChallenge.value === 'blink') return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: '👁' }
  if (currentChallenge.value === 'turn_left' || currentChallenge.value === 'turn_right') return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: '↔' }
  if (cameraReady.value) return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '•' }
  return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '•' }
})
const stageMessage = computed(() => {
  if (successMessage.value) return successMessage.value
  if (submitting.value) return 'Verifying with the server…'
  if (failed.value && !errorMessage.value) return 'Liveness check failed.'
  if (currentChallenge.value === 'blink') return 'Blink twice'
  if (currentChallenge.value === 'turn_left') return 'Turn your head LEFT'
  if (currentChallenge.value === 'turn_right') return 'Turn your head RIGHT'
  if (cameraReady.value && !challenges.value.length) return 'Preparing your check-in…'
  if (cameraReady.value) return 'All steps complete'
  return 'Setting up camera'
})
const stageHint = computed(() => {
  if (currentChallenge.value === 'blink') return 'Look at the camera and close your eyes briefly, twice.'
  if (currentChallenge.value === 'turn_left') return 'Slowly turn your face to your left, then back.'
  if (currentChallenge.value === 'turn_right') return 'Slowly turn your face to your right, then back.'
  return ''
})

function challengeLabel(c) {
  return c === 'blink' ? 'Blink' : c === 'turn_left' ? 'Look Left' : c === 'turn_right' ? 'Look Right' : c
}

// ---- Lifecycle
watch(() => props.open, async (val) => {
  if (val) await start()
  else stopCamera()
}, { immediate: true })

async function start() {
  resetState()
  await openCamera()
  if (!cameraReady.value) return
  await requestChallenge()
  if (challenges.value.length) runDetectionLoop()
}

function resetState() {
  errorMessage.value = ''
  successMessage.value = ''
  failed.value = false
  submitting.value = false
  challengeToken.value = ''
  challenges.value = []
  completed.value = []
  currentChallengeIndex.value = 0
  blinkState.value = { wasOpen: true, blinkCount: 0 }
  turnState.value = { neutralFrames: 0, deepTurnFrames: 0 }
  samplesCount.value = 0
  captured.value = []
  lastSampleAt = 0
}

function restart() {
  if (submitting.value) return
  resetState()
  start()
}

async function openCamera() {
  cameraReady.value = false
  try {
    camStatus.value = 'Loading face models…'
    await ensureModelsLoaded()
    camStatus.value = 'Requesting camera…'
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    })
    if (!props.open) {
      mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; return
    }
    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream
      await videoEl.value.play().catch(() => {})
    }
    cameraReady.value = true
    camStatus.value = ''
  } catch (err) {
    console.error('[FaceCheckIn] camera error', err)
    errorMessage.value = err && err.name === 'NotAllowedError'
      ? 'Camera permission was denied. Please allow camera access to check in with Face ID.'
      : 'Could not start the camera. Make sure no other app is using it and try again.'
    failed.value = true
  }
}

function stopCamera() {
  cameraReady.value = false
  if (detectionLoopHandle) { clearTimeout(detectionLoopHandle); detectionLoopHandle = null }
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
  if (videoEl.value) videoEl.value.srcObject = null
}

async function requestChallenge() {
  errorMessage.value = ''
  const token = localStorage.getItem('authToken') || localStorage.getItem('studentToken')
  try {
    const res = await fetch(buildAPIUrl(`/apis/attendance/sessions/${props.session._id}/face-challenge`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp()
      },
      body: JSON.stringify({})
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      errorMessage.value = data.message || 'Could not start liveness check.'
      failed.value = true
      return
    }
    challengeToken.value = data.challenge_token
    challenges.value = data.challenges || []
  } catch (err) {
    errorMessage.value = 'Network error while starting liveness check.'
    failed.value = true
  }
}

// ---- Liveness math
// Eye Aspect Ratio: tiny landmark model gives 68 points; eye landmarks 36-41 (right) and 42-47 (left).
function eyeAspectRatio(pts) {
  // pts: array of 6 {x,y}
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
  const v = (dist(pts[1], pts[5]) + dist(pts[2], pts[4])) / 2
  const h = dist(pts[0], pts[3])
  return h === 0 ? 0 : v / h
}

// Yaw estimate: compare nose tip (landmark 30) horizontal position to face box midpoint.
// Returns -1 (full left) … 0 (center) … +1 (full right) in screen coordinates.
// Note: video is mirrored via CSS transform but landmark coords are in unmirrored video space,
// so a 'turn_left' from the user's POV reads as nose moving toward the LEFT side of the
// unmirrored frame, which is positive X relative to face center on most cameras after mirror.
// We treat both directions symmetrically by checking absolute offset and the requested side.
function yawRatio(landmarks, box) {
  const noseTip = landmarks.positions[30]
  const faceCenterX = box.x + box.width / 2
  const offset = (noseTip.x - faceCenterX) / (box.width / 2)
  return Math.max(-1.5, Math.min(1.5, offset))
}

// Detect a blink: EAR drops below low threshold then recovers above high threshold.
function processBlinkFrame(ear) {
  const LOW = 0.20, HIGH = 0.27
  const s = blinkState.value
  if (s.wasOpen && ear < LOW) {
    s.wasOpen = false
  } else if (!s.wasOpen && ear > HIGH) {
    s.wasOpen = true
    s.blinkCount++
  }
  return s.blinkCount >= 2
}

// Detect a head turn: must reach a deep turn in the requested direction
// (>= 0.45 absolute yaw on the right side) AND return to near-neutral.
// Because the video is mirrored on screen, the user's "left" is the
// negative-X direction of the unmirrored frame (yaw < -0.35), and their
// "right" is the positive-X direction (yaw > +0.35).
function processTurnFrame(yaw, direction) {
  const s = turnState.value
  const wantPositive = direction === 'turn_right' // user's right == positive yaw in unmirrored frame
  const deep = wantPositive ? yaw > 0.35 : yaw < -0.35
  const neutral = Math.abs(yaw) < 0.15
  if (deep) s.deepTurnFrames++
  if (neutral) s.neutralFrames++
  // Need a sustained deep turn (~3 frames ≈ 360ms) AND a return to neutral (~2 frames).
  return s.deepTurnFrames >= 3 && s.neutralFrames >= 2
}

function advanceChallenge() {
  if (currentChallengeIndex.value >= challenges.value.length) return
  completed.value.push(challenges.value[currentChallengeIndex.value])
  currentChallengeIndex.value++
  // Reset per-challenge state so the next step is clean
  blinkState.value = { wasOpen: true, blinkCount: 0 }
  turnState.value = { neutralFrames: 0, deepTurnFrames: 0 }
}

async function runDetectionLoop() {
  if (!cameraReady.value || !videoEl.value) return
  try {
    const fa = await getFaceApi()
    const det = await fa
      .detectSingleFace(videoEl.value, new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
      .withFaceLandmarks(true)
      .withFaceDescriptor()

    const ok = !!det && det.detection && det.detection.score > 0.6
    faceDetected.value = ok
    faceLocked.value = ok

    if (ok) {
      // Sample descriptor at most every ~150ms — gives us a clean buffer for averaging.
      const now = Date.now()
      if (now - lastSampleAt > 130) {
        lastSampleAt = now
        samplesCount.value++
        if (captured.value.length < TARGET_VALID_FRAMES) {
          captured.value.push({ descriptor: Array.from(det.descriptor), score: det.detection.score })
        }
      }

      // Process the active challenge
      const ch = currentChallenge.value
      if (ch) {
        const lm = det.landmarks
        const rightEye = lm.positions.slice(36, 42)
        const leftEye = lm.positions.slice(42, 48)
        const ear = (eyeAspectRatio(rightEye) + eyeAspectRatio(leftEye)) / 2
        const yaw = yawRatio(lm, det.detection.box)

        if (ch === 'blink') {
          if (processBlinkFrame(ear)) advanceChallenge()
        } else if (ch === 'turn_left' || ch === 'turn_right') {
          if (processTurnFrame(yaw, ch)) advanceChallenge()
        }

        // All challenges done → submit
        if (currentChallengeIndex.value >= challenges.value.length && !submitting.value && captured.value.length >= 8) {
          await submit()
          return
        }
      }
    }
  } catch (err) {
    console.warn('[FaceCheckIn] detect error', err)
  }
  if (cameraReady.value) {
    detectionLoopHandle = setTimeout(runDetectionLoop, 100)
  }
}

async function submit() {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ''

  // Build a final descriptor by averaging the top-N samples.
  const top = [...captured.value].sort((a, b) => b.score - a.score).slice(0, Math.min(20, captured.value.length))
  if (!top.length) {
    submitting.value = false
    errorMessage.value = 'Not enough valid face frames captured.'
    failed.value = true
    return
  }
  const avg = new Array(128).fill(0)
  for (const t of top) for (let i = 0; i < 128; i++) avg[i] += t.descriptor[i]
  for (let i = 0; i < 128; i++) avg[i] /= top.length

  // Geofence: only ask for GPS when the event has it enabled.
  const requestBody = {
    challenge_token: challengeToken.value,
    descriptor: avg,
    completed_challenges: completed.value,
    samples_count: samplesCount.value
  }
  if (props.event?.geofence_enabled) {
    // Use pre-fetched coords if available (set by parent before opening modal)
    if (props.event._pendingLat != null && props.event._pendingLng != null) {
      requestBody.latitude = props.event._pendingLat
      requestBody.longitude = props.event._pendingLng
      requestBody.accuracy = props.event._pendingAccuracy || 0
    } else {
      if (!('geolocation' in navigator)) {
        submitting.value = false
        errorMessage.value = 'This event needs your location, but your device does not support GPS.'
        failed.value = true
        return
      }
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 })
        })
        requestBody.latitude = pos.coords.latitude
        requestBody.longitude = pos.coords.longitude
        requestBody.accuracy = pos.coords.accuracy
      } catch (gErr) {
        submitting.value = false
        errorMessage.value = gErr && gErr.code === 1
          ? 'Location permission denied. Please allow location to check in for this event.'
          : 'Could not get your location. Make sure GPS is on and try again.'
        failed.value = true
        return
      }
    }
  }

  const token = localStorage.getItem('authToken') || localStorage.getItem('studentToken')
  try {
    const res = await fetch(buildAPIUrl(`/apis/attendance/sessions/${props.session._id}/check-face-student`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp()
      },
      body: JSON.stringify(requestBody)
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success !== false) {
      const action = data.action === 'check_in' ? 'Checked in' : data.action === 'check_out' ? 'Checked out' : 'Recorded'
      successMessage.value = `${action} successfully`
      stopCamera()
      emit('success', data)
    } else {
      errorMessage.value = data.message || 'Check-in failed. Please try again.'
      failed.value = true
    }
  } catch (err) {
    errorMessage.value = 'Network error. Please check your connection and try again.'
    failed.value = true
  } finally {
    submitting.value = false
  }
}

function closeIfIdle() {
  if (submitting.value) return
  stopCamera()
  emit('close')
}

onBeforeUnmount(() => stopCamera())
</script>

<style scoped>
/* ── Backdrop ─────────────────────────────────────────────── */
.fci-backdrop {
  background: rgba(8, 14, 46, 0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ── Panel ────────────────────────────────────────────────── */
.fci-panel {
  background: linear-gradient(150deg, #0d1a5e 0%, #080e2e 60%, #060b22 100%);
  border: 1px solid rgba(99, 146, 255, 0.18);
  border-radius: 28px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset;
  max-height: 92vh;
  overflow-y: auto;
}

/* ── Glow bars ────────────────────────────────────────────── */
.fci-glow-bar {
  background: linear-gradient(90deg, transparent, rgba(99,146,255,0.6), transparent);
}
.fci-glow-bar-bottom {
  background: linear-gradient(90deg, transparent, rgba(99,146,255,0.2), transparent);
}

/* ── Icon wrap ────────────────────────────────────────────── */
.fci-icon-wrap {
  width: 32px; height: 32px;
  border-radius: 10px;
  background: rgba(99, 146, 255, 0.18);
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(99, 146, 255, 0.25);
}

/* ── Close button ─────────────────────────────────────────── */
.fci-close-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.45);
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  transition: all 0.2s;
  cursor: pointer;
}
.fci-close-btn:hover { color: white; background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
.fci-close-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Stage banner ─────────────────────────────────────────── */
.fci-stage-banner { transition: background 0.4s, border-color 0.4s; }
.fci-stage-default  { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
.fci-stage-info     { background: rgba(59,130,246,0.15);  border: 1px solid rgba(96,165,250,0.35); color: #93c5fd; }
.fci-stage-challenge{ background: rgba(139,92,246,0.15);  border: 1px solid rgba(167,139,250,0.35); color: #c4b5fd; }
.fci-stage-success  { background: rgba(34,197,94,0.15);   border: 1px solid rgba(74,222,128,0.35); color: #86efac; }
.fci-stage-error    { background: rgba(239,68,68,0.15);   border: 1px solid rgba(248,113,113,0.35); color: #fca5a5; }

/* ── Camera frame ─────────────────────────────────────────── */
.fci-camera-frame {
  box-shadow: 0 0 0 1px rgba(99,146,255,0.2), 0 8px 32px rgba(0,0,0,0.5);
}

/* ── Spinner ──────────────────────────────────────────────── */
.fci-spinner {
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(96,165,250,0.2);
  border-top-color: #60a5fa;
  animation: fci-spin 0.8s linear infinite;
}
@keyframes fci-spin { to { transform: rotate(360deg); } }

/* ── Blink pill ───────────────────────────────────────────── */
.fci-blink-pill {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.18);
}

/* ── Challenge chips ──────────────────────────────────────── */
.fci-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid;
  transition: all 0.3s;
}
.fci-chip-idle   { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.35); }
.fci-chip-active { background: rgba(99,146,255,0.22); border-color: rgba(99,146,255,0.5); color: #a5b4fc; }
.fci-chip-done   { background: rgba(74,222,128,0.15); border-color: rgba(74,222,128,0.4); color: #86efac; }

/* ── Action buttons ───────────────────────────────────────── */
.fci-btn-cancel {
  padding: 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 600;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.75);
  transition: all 0.2s;
  cursor: pointer;
}
.fci-btn-cancel:hover { background: rgba(255,255,255,0.12); color: white; }
.fci-btn-cancel:disabled { opacity: 0.35; cursor: not-allowed; }

.fci-btn-retry {
  padding: 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 600;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  color: white;
  transition: all 0.2s;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(245,158,11,0.3);
}
.fci-btn-retry:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(245,158,11,0.4); }
.fci-btn-retry:active { transform: translateY(0); }

/* ── Overlay transition ───────────────────────────────────── */
.fci-overlay-enter-active,
.fci-overlay-leave-active { transition: opacity 0.25s ease; }
.fci-overlay-enter-from,
.fci-overlay-leave-to   { opacity: 0; }

/* ── Panel transition ─────────────────────────────────────── */
.fci-panel-enter-active { transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1); }
.fci-panel-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fci-panel-enter-from   { opacity: 0; transform: scale(0.88) translateY(24px); }
.fci-panel-leave-to     { opacity: 0; transform: scale(0.94) translateY(12px); }
</style>
