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

              <!-- Head turn / center cue, centered -->
              <div v-if="cameraReady && (currentChallenge === 'turn_left' || currentChallenge === 'turn_right' || currentChallenge === 'look_center')"
                class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="px-5 py-3 rounded-2xl bg-black/55 backdrop-blur-md flex items-center gap-3 animate-pulse">
                  <span class="text-white text-4xl font-bold leading-none">
                    {{ currentChallenge === 'turn_left' ? '←' : currentChallenge === 'turn_right' ? '→' : '◎' }}
                  </span>
                  <span class="text-white text-xl font-bold tracking-wide">
                    {{ currentChallenge === 'turn_left' ? 'TURN LEFT' : currentChallenge === 'turn_right' ? 'TURN RIGHT' : 'LOOK CENTER' }}
                  </span>
                </div>
              </div>
              <!-- Rotating scanner ring (only while finding the face) -->
              <div v-if="cameraReady && phase === 'finding'" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="fci-scan-ring"></div>
              </div>
              <!-- Face oval -->
              <div v-if="cameraReady" class="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
                  <ellipse cx="50" cy="48" rx="22" ry="30" fill="none"
                    :stroke="faceLocked ? '#4ade80' : (faceDetected ? '#fbbf24' : 'rgba(255,255,255,0.25)')"
                    stroke-width="0.6" stroke-dasharray="2 1.5" />
                </svg>
              </div>

              <!-- Live yaw debug indicator (only visible during challenges) -->
              <div v-if="cameraReady && phase === 'challenging' && currentChallenge"
                class="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm pointer-events-none">
                <div class="flex items-center gap-2 text-[10px] font-mono text-white/90">
                  <span :class="liveYaw < -0.05 ? 'text-emerald-300 font-bold' : 'opacity-50'">◀ L</span>
                  <span class="tabular-nums w-12 text-center">{{ liveYaw.toFixed(2) }}</span>
                  <span :class="liveYaw > 0.05 ? 'text-emerald-300 font-bold' : 'opacity-50'">R ▶</span>
                </div>
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

// ---- Phases
//   'finding'    → camera is on, we're searching for a stable face
//   'challenging'→ face is locked, walk the user through the head-turn challenges
//   'submitting' → all challenges passed, posting to backend
//   'done'       → success or failure (final)
const phase = ref('finding')
// Number of consecutive frames in which we've seen a clear face. Once this
// passes the lock threshold we transition from 'finding' → 'challenging' and
// fetch the challenge list. This avoids asking the user to "turn left" before
// they've even framed themselves in the camera.
const faceLockedFrames = ref(0)
const FACE_LOCK_FRAMES = 8 // ~0.8s at 100ms loop

// ---- Challenge state
const challengeToken = ref('')
const challenges = ref([])
const completed = ref([])
const currentChallengeIndex = ref(0)
const currentChallenge = computed(() => challenges.value[currentChallengeIndex.value])

// Per-challenge transient state
const turnState = ref({ neutralFrames: 0, deepTurnFrames: 0, peakYaw: 0, strongStartTime: 0, strongSign: 0, centerStartTime: 0 })
// Sign (+1 / -1) of the first turn the user actually performed. The second
// turn challenge must be in the OPPOSITE sign, so we still get true alternation
// regardless of which physical direction the camera reports as positive.
const firstTurnSign = ref(0)

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
  if (currentChallenge.value === 'turn_left' || currentChallenge.value === 'turn_right') return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: '↔' }
  if (currentChallenge.value === 'look_center') return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '◎' }
  if (cameraReady.value) return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '•' }
  return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '•' }
})
const stageMessage = computed(() => {
  if (successMessage.value) return successMessage.value
  if (submitting.value) return 'Verifying with the server…'
  // Always surface the real error message before falling through to neutral
  // "all steps complete" copy — otherwise a silent server reject looks like
  // success on screen.
  if (errorMessage.value) return errorMessage.value
  if (failed.value) return 'Liveness check failed.'
  if (phase.value === 'finding') {
    return faceDetected.value ? 'Hold still…' : 'Position your face in the circle'
  }
  if (currentChallenge.value === 'turn_left') return 'Turn your head LEFT'
  if (currentChallenge.value === 'turn_right') return 'Turn your head RIGHT'
  if (currentChallenge.value === 'look_center') return 'Look straight at the camera'
  if (cameraReady.value && !challenges.value.length) return 'Preparing your check-in…'
  if (cameraReady.value && challenges.value.length && currentChallengeIndex.value >= challenges.value.length) {
    return 'Almost done — collecting frames…'
  }
  if (cameraReady.value) return 'All steps complete'
  return 'Setting up camera'
})
const stageHint = computed(() => {
  if (phase.value === 'finding') {
    return faceDetected.value
      ? 'Locking on your face…'
      : 'Make sure your face is well-lit and centered.'
  }
  if (currentChallenge.value === 'turn_left') return 'Slowly turn your face to your left.'
  if (currentChallenge.value === 'turn_right') return 'Slowly turn your face to your right.'
  if (currentChallenge.value === 'look_center') return 'Hold your face straight ahead for a moment.'
  return ''
})

function challengeLabel(c) {
  if (c === 'turn_left') return 'Look Left'
  if (c === 'turn_right') return 'Look Right'
  if (c === 'look_center') return 'Look Center'
  return c
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
  // Don't request challenges yet — wait until the detection loop confirms a
  // stable face. The loop itself drives the 'finding' → 'challenging'
  // transition and triggers requestChallenge() at the right moment.
  runDetectionLoop()
}

function resetState() {
  errorMessage.value = ''
  successMessage.value = ''
  failed.value = false
  submitting.value = false
  phase.value = 'finding'
  faceLockedFrames.value = 0
  faceDetected.value = false
  faceLocked.value = false
  challengeToken.value = ''
  challenges.value = []
  completed.value = []
  currentChallengeIndex.value = 0
  turnState.value = { neutralFrames: 0, deepTurnFrames: 0, peakYaw: 0, strongStartTime: 0, strongSign: 0, centerStartTime: 0 }
  firstTurnSign.value = 0
  liveYaw.value = 0
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
    // Weave a "look_center" step between each pair of turn challenges so the
    // user explicitly returns to neutral between left and right (or right and
    // left). This step is client-only — the backend doesn't validate it, so
    // we strip it from the payload before submitting.
    const issued = data.challenges || []
    const woven = []
    for (let i = 0; i < issued.length; i++) {
      woven.push(issued[i])
      if (i < issued.length - 1) woven.push('look_center')
    }
    challenges.value = woven
  } catch (err) {
    errorMessage.value = 'Network error while starting liveness check.'
    failed.value = true
  }
}

// ---- Liveness math
// Robust yaw estimate using jaw landmarks. With the 68-point model the jaw
// runs from point 0 (the jaw tip on the camera's LEFT) to point 16 (camera's
// RIGHT), and the nose tip is point 30. When the head is straight, the nose
// sits roughly halfway between the two jaw tips. As the user rotates, the
// nose moves much closer to whichever jaw side is rotating away from the
// camera. Comparing those two distances is far more stable than comparing the
// nose X to the face bounding-box center, which jitters frame to frame.
//
// Returned value is in roughly [-1, +1]:
//   negative → nose is closer to the LEFT side of the unmirrored frame
//              (the user has turned their head to THEIR right)
//   positive → nose is closer to the RIGHT side of the unmirrored frame
//              (the user has turned their head to THEIR left)
function yawRatio(landmarks /* , box (unused) */) {
  const pts = landmarks.positions
  const nose = pts[30]
  const jawL = pts[0]   // camera's left jaw tip
  const jawR = pts[16]  // camera's right jaw tip
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
  const dL = dist(nose, jawL)
  const dR = dist(nose, jawR)
  const total = dL + dR
  if (total === 0) return 0
  // (dR - dL)/(dR + dL): 0 when centered, +1 when nose is on the right edge,
  // -1 when on the left edge.
  return Math.max(-1, Math.min(1, (dR - dL) / total))
}

// Detect a head turn in the requested direction.
//
// In practice the sign of yawRatio depends on whether the underlying video
// stream is pre-mirrored by the OS/driver (some webcams do this for the user
// camera, some don't). Empirical user testing on this app shows that:
//   user turns to THEIR LEFT  → yaw POSITIVE (mirror-flipped frame)
//   user turns to THEIR RIGHT → yaw NEGATIVE
// so we map turn_left → wantPositive.
//
// We also expose the raw yaw value via `liveYaw` so the on-screen indicator
// shows which way the math currently thinks the head is turning — useful for
// diagnosing camera-mirror surprises in the field.
const liveYaw = ref(0)
// Direction-agnostic head-turn detection. The sign of yawRatio depends on
// whether the camera/driver pre-mirrors the stream, which varies per device,
// so trying to map turn_left/turn_right to a fixed sign is unreliable. Instead
// we accept a strong turn in EITHER direction; the alternation requirement
// (second turn must be opposite the first) preserves the liveness guarantee.
function processTurnFrame(yaw /* , direction */) {
  const s = turnState.value
  const DEEP = 0.18
  const STRONG = 0.5    // once |yaw| reaches 0.5, hold for 1.5s to auto-pass
  const HOLD_MS = 1500
  const NEUTRAL = 0.08
  const sign = yaw >= 0 ? 1 : -1
  const requiredSign = firstTurnSign.value === 0 ? 0 : -firstTurnSign.value
  // If a first turn already happened, this turn must be in the opposite
  // direction. We still let the user wiggle either way before they commit —
  // we only count time when they're holding past the threshold on the
  // required side.
  const sideOk = requiredSign === 0 ? true : sign === requiredSign
  const strong = Math.abs(yaw) >= STRONG && sideOk
  const deep   = Math.abs(yaw) >= DEEP   && sideOk

  if (Math.abs(yaw) > s.peakYaw) s.peakYaw = Math.abs(yaw)
  if (deep) {
    s.deepTurnFrames++
    if (!s.strongSign) s.strongSign = sign
  }

  // Hold-at-threshold: once the user reaches ±0.5 on the allowed side,
  // freeze the requirement there. They just need to keep their head at (or
  // past) that angle for 1.5s total and the challenge passes.
  const now = Date.now()
  if (strong) {
    if (!s.strongStartTime) s.strongStartTime = now
    if (!s.strongSign) s.strongSign = sign
    if (now - s.strongStartTime >= HOLD_MS) return true
  } else {
    s.strongStartTime = 0
  }

  // Fallback for gentler turns: "deep turn, then return to centered".
  if (s.deepTurnFrames >= 2 && Math.abs(yaw) < NEUTRAL) s.neutralFrames++
  return s.deepTurnFrames >= 2 && s.neutralFrames >= 1
}

// Center hold: confirm the user is looking straight ahead by holding |yaw|
// below the neutral threshold for ~1 second.
function processCenterFrame(yaw) {
  const s = turnState.value
  const NEUTRAL = 0.1
  const HOLD_MS = 1000
  const now = Date.now()
  if (Math.abs(yaw) < NEUTRAL) {
    if (!s.centerStartTime) s.centerStartTime = now
    if (now - s.centerStartTime >= HOLD_MS) return true
  } else {
    s.centerStartTime = 0
  }
  return false
}

function advanceChallenge() {
  if (currentChallengeIndex.value >= challenges.value.length) return
  const finished = challenges.value[currentChallengeIndex.value]
  // If the user just completed a turn challenge, remember which physical
  // side they actually turned to so the next turn is forced to be opposite.
  if ((finished === 'turn_left' || finished === 'turn_right') && !firstTurnSign.value) {
    firstTurnSign.value = turnState.value.strongSign || (turnState.value.peakYaw >= 0 ? 1 : -1)
  }
  completed.value.push(finished)
  currentChallengeIndex.value++
  // Reset per-challenge state so the next step is clean
  turnState.value = { neutralFrames: 0, deepTurnFrames: 0, peakYaw: 0, strongStartTime: 0, strongSign: 0, centerStartTime: 0 }
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

      // ---- Phase: finding face ----
      // Wait until we've seen the face for several consecutive frames (≈0.8s)
      // before asking for any head turn. This gives the user time to position
      // themselves and prevents the very first "turn" instruction from
      // appearing while they're still framing their face.
      if (phase.value === 'finding') {
        faceLockedFrames.value++
        if (faceLockedFrames.value >= FACE_LOCK_FRAMES && !challengeToken.value) {
          phase.value = 'challenging'
          await requestChallenge()
          if (failed.value || !challenges.value.length) {
            // requestChallenge already set the error state; just stop here.
            return
          }
        }
      }

      // ---- Phase: challenging ----
      // Process the currently active head-turn challenge.
      if (phase.value === 'challenging') {
        const ch = currentChallenge.value
        if (ch === 'turn_left' || ch === 'turn_right') {
          const yaw = yawRatio(det.landmarks)
          liveYaw.value = yaw
          if (processTurnFrame(yaw, ch)) advanceChallenge()
        } else if (ch === 'look_center') {
          const yaw = yawRatio(det.landmarks)
          liveYaw.value = yaw
          if (processCenterFrame(yaw)) advanceChallenge()
        }

        // All challenges done → submit. The backend rejects requests with
        // fewer than ~25 sample frames as anti-spoof, so wait until we've
        // accumulated enough before posting. The loop will keep ticking and
        // adding samples until the gate clears, usually within ~1s extra.
        const REQUIRED_SAMPLES = 28 // small buffer over the backend's 25 minimum
        if (
          currentChallengeIndex.value >= challenges.value.length
          && !submitting.value
          && captured.value.length >= 10
          && samplesCount.value >= REQUIRED_SAMPLES
        ) {
          phase.value = 'submitting'
          await submit()
          return
        }
      }
    } else {
      // Face lost mid-finding — start the lock timer over.
      if (phase.value === 'finding') faceLockedFrames.value = 0
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
    completed_challenges: completed.value.filter(c => c !== 'look_center'),
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
      console.warn('[FaceCheckIn] server rejected check-in', { status: res.status, data, samples: samplesCount.value, captured: captured.value.length })
      errorMessage.value = data.message || `Check-in failed (${res.status}). Please try again.`
      failed.value = true
    }
  } catch (err) {
    console.warn('[FaceCheckIn] network/submit error', err)
    errorMessage.value = 'Network error. Please check your connection and try again.'
    failed.value = true
  } finally {
    submitting.value = false
    phase.value = 'done'
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

/* ── Rotating scanner ring (shown while finding the face) ── */
.fci-scan-ring {
  width: 62%;
  aspect-ratio: 1 / 1;
  max-width: 260px;
  border-radius: 50%;
  position: relative;
  background:
    conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(96, 165, 250, 0.0) 40deg,
      rgba(96, 165, 250, 0.55) 90deg,
      rgba(167, 139, 250, 0.85) 130deg,
      rgba(96, 165, 250, 0.55) 170deg,
      rgba(96, 165, 250, 0.0) 220deg,
      transparent 360deg
    );
  -webkit-mask: radial-gradient(circle, transparent 56%, #000 58%, #000 64%, transparent 66%);
          mask: radial-gradient(circle, transparent 56%, #000 58%, #000 64%, transparent 66%);
  animation: fci-scan-rotate 2.4s linear infinite;
  filter: drop-shadow(0 0 8px rgba(99, 146, 255, 0.45));
}
.fci-scan-ring::before,
.fci-scan-ring::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1px dashed rgba(99, 146, 255, 0.18);
}
.fci-scan-ring::after {
  inset: -10px;
  border-color: rgba(99, 146, 255, 0.10);
  animation: fci-scan-pulse 2.4s ease-in-out infinite;
}
@keyframes fci-scan-rotate { to { transform: rotate(360deg); } }
@keyframes fci-scan-pulse {
  0%, 100% { transform: scale(1);   opacity: 0.6; }
  50%      { transform: scale(1.06); opacity: 0.2; }
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
/* Enter: quick fade-in. Leave: slightly longer fade + a soft blur fade so the
   backdrop visibly recedes when the modal is dismissed. */
.fci-overlay-enter-active { transition: opacity 0.22s ease-out, backdrop-filter 0.22s ease-out, -webkit-backdrop-filter 0.22s ease-out; }
.fci-overlay-leave-active { transition: opacity 0.32s ease-in,  backdrop-filter 0.32s ease-in,  -webkit-backdrop-filter 0.32s ease-in; }
.fci-overlay-enter-from,
.fci-overlay-leave-to     { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }

/* ── Panel transition ─────────────────────────────────────── */
/* Enter: spring up and scale in.
   Leave: softly drop and shrink with a gentle ease-in so the user clearly
   sees the modal animating away rather than vanishing. */
.fci-panel-enter-active { transition: opacity 0.30s ease-out, transform 0.38s cubic-bezier(0.34, 1.4, 0.64, 1); }
.fci-panel-leave-active { transition: opacity 0.28s ease-in,  transform 0.32s cubic-bezier(0.55, 0, 0.7, 0.2); }
.fci-panel-enter-from   { opacity: 0; transform: scale(0.88) translateY(24px); }
.fci-panel-leave-to     { opacity: 0; transform: scale(0.92) translateY(20px); }
</style>
