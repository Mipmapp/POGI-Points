<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" @click.self="closeIfIdle">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[94vh] overflow-y-auto">
      <!-- Header -->
      <div :class="['px-5 py-4 flex items-center justify-between border-b', accentBorder]">
        <div>
          <h3 :class="['text-lg font-bold', accentText]">Face ID Check-In</h3>
          <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">{{ session?.label || 'Session' }} • {{ event?.title || 'Event' }}</p>
        </div>
        <button @click="closeIfIdle" :disabled="submitting" class="text-gray-400 hover:text-gray-700 disabled:opacity-40 text-2xl leading-none">&times;</button>
      </div>

      <div class="p-5 space-y-4">
        <!-- Stage banner -->
        <div :class="['text-sm rounded-xl p-3 border-2 flex items-start gap-2', stageStyle.bg, stageStyle.border, stageStyle.text]">
          <span class="text-xl leading-none">{{ stageStyle.icon }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold">{{ stageMessage }}</p>
            <p v-if="stageHint" class="text-xs opacity-80 mt-0.5">{{ stageHint }}</p>
          </div>
        </div>

        <!-- Camera -->
        <div class="relative bg-black rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
          <video ref="videoEl" autoplay muted playsinline :class="['w-full h-full object-cover', cameraReady ? 'opacity-100' : 'opacity-0', 'transition-opacity']" style="transform: scaleX(-1);" />
          <div v-if="!cameraReady" class="absolute inset-0 flex flex-col items-center justify-center text-white text-sm">
            <svg class="animate-spin w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span>{{ camStatus }}</span>
          </div>

          <!-- Liveness arrow overlay (left/right turn cue) -->
          <div v-if="cameraReady && currentChallenge === 'turn_left'" class="absolute inset-0 flex items-center justify-start pointer-events-none">
            <div class="text-white/80 text-7xl font-bold animate-pulse pl-3">←</div>
          </div>
          <div v-if="cameraReady && currentChallenge === 'turn_right'" class="absolute inset-0 flex items-center justify-end pointer-events-none">
            <div class="text-white/80 text-7xl font-bold animate-pulse pr-3">→</div>
          </div>
          <div v-if="cameraReady && currentChallenge === 'blink'" class="absolute top-2 left-2 right-2 text-center pointer-events-none">
            <div class="inline-block bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full">Blink twice</div>
          </div>

          <!-- Face oval -->
          <div v-if="cameraReady" class="absolute inset-0 pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
              <ellipse cx="50" cy="48" rx="22" ry="30" fill="none"
                :stroke="faceLocked ? '#22c55e' : (faceDetected ? '#fbbf24' : '#ffffff80')"
                stroke-width="0.6" stroke-dasharray="2 1.5" />
            </svg>
          </div>
        </div>

        <!-- Challenge progress chips -->
        <div v-if="challenges.length" class="flex items-center gap-2 flex-wrap">
          <div v-for="(c, idx) in challenges" :key="c"
            :class="['px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5',
              completed.includes(c) ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
              idx === currentChallengeIndex ? (accentBg + ' text-white border-transparent') :
              'bg-gray-50 border-gray-200 text-gray-500']">
            <span v-if="completed.includes(c)">✓</span>
            <span v-else-if="idx === currentChallengeIndex" class="animate-pulse">●</span>
            <span v-else>○</span>
            {{ challengeLabel(c) }}
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMessage" class="text-sm bg-red-50 border-2 border-red-200 text-red-800 rounded-xl p-3">
          {{ errorMessage }}
        </div>

        <!-- Result -->
        <div v-if="successMessage" class="text-sm bg-emerald-50 border-2 border-emerald-300 text-emerald-800 rounded-xl p-3 text-center font-semibold">
          ✓ {{ successMessage }}
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-1">
          <button @click="closeIfIdle" :disabled="submitting" class="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 disabled:opacity-50">
            {{ successMessage ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="failed && !successMessage" @click="restart" class="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600">
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
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

// ---- Theme
const accentText = computed(() => props.isCOE ? 'text-orange-900' : props.isSOM ? 'text-green-900' : props.isCNAHS ? 'text-emerald-900' : 'text-purple-900')
const accentBg = computed(() => props.isCOE ? 'bg-orange-600' : props.isSOM ? 'bg-green-600' : props.isCNAHS ? 'bg-emerald-600' : 'bg-purple-600')
const accentBorder = computed(() => props.isCOE ? 'border-orange-100' : props.isSOM ? 'border-green-100' : props.isCNAHS ? 'border-emerald-100' : 'border-purple-100')

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
})

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
