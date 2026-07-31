<template>
  <Transition name="fci-overlay">
    <div v-if="open" class="fci-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" @click.self="closeIfIdle">
      <Transition name="fci-panel" appear>
        <!-- Mobile: full-screen. Desktop (sm+): centered modal card -->
        <div v-if="open" class="fci-panel relative w-full sm:max-w-md flex flex-col">

          <!-- Header -->
          <div class="flex-shrink-0 px-5 pt-5 pb-4 sm:px-6 sm:pt-6 flex items-center justify-between gap-3 border-b border-gray-100">
            <div class="flex items-center gap-3 min-w-0">
              <div class="fci-icon-wrap flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-bold text-gray-900 leading-tight">Face ID Check-In</h3>
                <p class="text-[11px] text-gray-400 truncate mt-0.5">{{ session?.label || 'Session' }} &middot; {{ event?.title || 'Event' }}</p>
              </div>
            </div>
            <button @click="closeIfIdle" :disabled="submitting" class="fci-close-btn flex-shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Camera area — grows to fill available space on mobile -->
          <div class="flex-1 px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 flex flex-col gap-3 sm:gap-4 min-h-0">

            <!-- Camera viewport -->
            <div class="relative rounded-2xl overflow-hidden bg-gray-950 fci-camera-frame" style="aspect-ratio: 4/3;">
              <video ref="videoEl" autoplay muted playsinline
                :class="['w-full h-full object-cover transition-opacity duration-500', cameraReady ? 'opacity-100' : 'opacity-0']"
                style="transform: scaleX(-1);" />

              <!-- Loading overlay -->
              <div v-if="!cameraReady" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-950">
                <div class="fci-spinner mb-3"></div>
                <span class="text-sm text-white/60 font-medium">{{ camStatus }}</span>
              </div>

              <!-- Head-turn cue -->
              <div v-if="cameraReady && (currentChallenge === 'turn_left' || currentChallenge === 'turn_right' || currentChallenge === 'look_center')"
                class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md flex items-center gap-2.5 animate-pulse">
                  <span class="text-white text-3xl font-bold leading-none">
                    {{ currentChallenge === 'turn_left' ? '←' : currentChallenge === 'turn_right' ? '→' : '◎' }}
                  </span>
                  <span class="text-white text-base font-bold tracking-wide">
                    {{ currentChallenge === 'turn_left' ? 'TURN LEFT' : currentChallenge === 'turn_right' ? 'TURN RIGHT' : 'LOOK CENTER' }}
                  </span>
                </div>
              </div>

              <!-- Scan ring (finding phase) -->
              <div v-if="cameraReady && phase === 'finding'" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="fci-scan-ring"></div>
              </div>

              <!-- Face oval guide -->
              <div v-if="cameraReady" class="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
                  <ellipse cx="50" cy="48" rx="22" ry="30" fill="none"
                    :stroke="faceLocked ? '#22c55e' : (faceDetected ? '#f59e0b' : 'rgba(255,255,255,0.3)')"
                    stroke-width="0.6" stroke-dasharray="2 1.5" />
                </svg>
              </div>

              <!-- Yaw debug -->
              <div v-if="cameraReady && phase === 'challenging' && currentChallenge"
                class="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm pointer-events-none">
                <div class="flex items-center gap-2 text-[10px] font-mono text-white/90">
                  <span :class="liveYaw < -0.05 ? 'text-emerald-300 font-bold' : 'opacity-50'">◀ L</span>
                  <span class="tabular-nums w-12 text-center">{{ liveYaw.toFixed(2) }}</span>
                  <span :class="liveYaw > 0.05 ? 'text-emerald-300 font-bold' : 'opacity-50'">R ▶</span>
                </div>
              </div>
            </div>

            <!-- Progress bar -->
            <div v-if="!successMessage && !failed" class="flex flex-col gap-1.5">
              <div class="fci-progress-track">
                <div class="fci-progress-fill" :style="{ width: progressPct + '%' }"></div>
              </div>
              <div class="flex items-center justify-between text-[10px] font-semibold tracking-widest uppercase text-gray-400">
                <span>{{ phase === 'finding' ? 'Scanning' : phase === 'challenging' ? 'Verifying' : phase === 'submitting' ? 'Submitting' : 'Ready' }}</span>
                <span class="tabular-nums">{{ Math.round(progressPct) }}%</span>
              </div>
            </div>

            <!-- Stage banner -->
            <div class="fci-stage-banner rounded-xl px-4 py-3 flex items-start gap-3" :class="stageBannerClass">
              <span class="text-base leading-none mt-0.5 flex-shrink-0 font-bold">{{ stageStyle.icon }}</span>
              <div class="min-w-0">
                <p class="text-sm font-semibold leading-snug" :class="stageStyle.text">{{ stageMessage }}</p>
                <p v-if="stageHint" class="text-xs mt-0.5 leading-snug opacity-70" :class="stageStyle.text">{{ stageHint }}</p>
              </div>
            </div>

            <!-- Challenge chips -->
            <div v-if="challenges.length" class="flex items-center justify-center gap-2 flex-wrap">
              <div v-for="(c, idx) in challenges" :key="c"
                :class="['fci-chip', completed.includes(c) ? 'fci-chip-done' : idx === currentChallengeIndex ? 'fci-chip-active' : 'fci-chip-idle']">
                <span v-if="completed.includes(c)">✓</span>
                <span v-else-if="idx === currentChallengeIndex" class="animate-pulse">●</span>
                <span v-else>○</span>
                {{ challengeLabel(c) }}
              </div>
            </div>

          </div>

          <!-- Footer actions -->
          <div class="flex-shrink-0 px-4 pb-5 pt-2 sm:px-5 sm:pb-6 flex gap-3 border-t border-gray-100">
            <button @click="closeIfIdle" :disabled="submitting" class="fci-btn-cancel flex-1">
              {{ successMessage ? 'Close' : 'Cancel' }}
            </button>
            <button v-if="failed && !successMessage" @click="restart" class="fci-btn-retry flex-1">
              Try Again
            </button>
          </div>

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

// ---- Theme
const accentText = computed(() => props.isCOE ? 'text-orange-900' : props.isSOM ? 'text-green-900' : props.isCNAHS ? 'text-emerald-900' : 'text-blue-900')
const accentBg = computed(() => props.isCOE ? 'bg-orange-600' : props.isSOM ? 'bg-green-600' : props.isCNAHS ? 'bg-emerald-600' : 'bg-blue-600')

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
const boxRatio = ref(0)
const MIN_BOX_RATIO = 0.22
const tooFar = computed(() => faceDetected.value && boxRatio.value > 0 && boxRatio.value < MIN_BOX_RATIO)

// ---- Phases
const phase = ref('finding')
const faceLockedFrames = ref(0)
const FACE_LOCK_FRAMES = 3

// ---- Challenge state
const challengeToken = ref('')
const challenges = ref([])
const completed = ref([])
const currentChallengeIndex = ref(0)
const currentChallenge = computed(() => challenges.value[currentChallengeIndex.value])

const turnState = ref({ neutralFrames: 0, deepTurnFrames: 0, peakYaw: 0, strongStartTime: 0, strongSign: 0, centerStartTime: 0 })
const firstTurnSign = ref(0)

const samplesCount = ref(0)
const captured = ref([])
let lastSampleAt = 0
const TARGET_VALID_FRAMES = 15

// ---- Stage UX
const stageStyle = computed(() => {
  if (successMessage.value) return { text: 'text-emerald-800', icon: '✓' }
  if (errorMessage.value || failed.value) return { text: 'text-red-700', icon: '!' }
  if (submitting.value) return { text: 'text-blue-700', icon: '↻' }
  if (currentChallenge.value === 'turn_left' || currentChallenge.value === 'turn_right') return { text: 'text-violet-700', icon: '↔' }
  if (currentChallenge.value === 'look_center') return { text: 'text-blue-700', icon: '◎' }
  return { text: 'text-gray-600', icon: '•' }
})
const stageMessage = computed(() => {
  if (successMessage.value) return successMessage.value
  if (submitting.value) return 'Verifying with the server…'
  if (errorMessage.value) return errorMessage.value
  if (failed.value) return 'Liveness check failed.'
  if (phase.value === 'finding') {
    if (!faceDetected.value) return 'Position your face in the circle'
    if (tooFar.value) return 'Move closer to the camera'
    return 'Hold still…'
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
    if (!faceDetected.value) return 'Make sure your face is well-lit and centered.'
    if (tooFar.value) return 'Your face looks small — bring the camera closer.'
    return 'Locking on your face…'
  }
  if (currentChallenge.value === 'turn_left') return 'Slowly turn your face to your left.'
  if (currentChallenge.value === 'turn_right') return 'Slowly turn your face to your right.'
  if (currentChallenge.value === 'look_center') return 'Hold your face straight ahead for a moment.'
  return ''
})

const progressPct = computed(() => {
  if (successMessage.value) return 100
  if (submitting.value) return 95
  if (phase.value === 'finding') {
    if (!faceDetected.value) return 5
    if (tooFar.value) return 10
    const lockPct = Math.min(faceLockedFrames.value / FACE_LOCK_FRAMES, 1)
    return 10 + lockPct * 15
  }
  if (phase.value === 'challenging') {
    const total = challenges.value.length || 1
    const challengePct = Math.min(currentChallengeIndex.value / total, 1)
    const samplePct = Math.min(samplesCount.value / 12, 1)
    return 25 + challengePct * 55 + samplePct * 15
  }
  return 0
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
  boxRatio.value = 0
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
    challenges.value = (data.challenges || []).slice()
  } catch (err) {
    errorMessage.value = 'Network error while starting liveness check.'
    failed.value = true
  }
}

// ---- Liveness math
function yawRatio(landmarks) {
  const pts = landmarks.positions
  const nose = pts[30]
  const jawL = pts[0]
  const jawR = pts[16]
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
  const dL = dist(nose, jawL)
  const dR = dist(nose, jawR)
  const total = dL + dR
  if (total === 0) return 0
  return Math.max(-1, Math.min(1, (dR - dL) / total))
}

const liveYaw = ref(0)
function processTurnFrame(yaw) {
  const s = turnState.value
  const DEEP = 0.18
  const STRONG = 0.45
  const HOLD_MS = 500
  const NEUTRAL = 0.08
  const sign = yaw >= 0 ? 1 : -1
  const requiredSign = firstTurnSign.value === 0 ? 0 : -firstTurnSign.value
  const sideOk = requiredSign === 0 ? true : sign === requiredSign
  const strong = Math.abs(yaw) >= STRONG && sideOk
  const deep   = Math.abs(yaw) >= DEEP   && sideOk

  if (Math.abs(yaw) > s.peakYaw) s.peakYaw = Math.abs(yaw)
  if (deep) {
    s.deepTurnFrames++
    if (!s.strongSign) s.strongSign = sign
  }

  const now = Date.now()
  if (strong) {
    if (!s.strongStartTime) s.strongStartTime = now
    if (!s.strongSign) s.strongSign = sign
    if (now - s.strongStartTime >= HOLD_MS) return true
  } else {
    s.strongStartTime = 0
  }

  if (s.deepTurnFrames >= 2 && Math.abs(yaw) < NEUTRAL) s.neutralFrames++
  return s.deepTurnFrames >= 2 && s.neutralFrames >= 1
}

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
  if ((finished === 'turn_left' || finished === 'turn_right') && !firstTurnSign.value) {
    firstTurnSign.value = turnState.value.strongSign || (turnState.value.peakYaw >= 0 ? 1 : -1)
  }
  completed.value.push(finished)
  currentChallengeIndex.value++
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
      const vw = videoEl.value && (videoEl.value.videoWidth || videoEl.value.clientWidth)
      if (vw && det.detection.box && det.detection.box.width) {
        boxRatio.value = det.detection.box.width / vw
      }
    } else {
      boxRatio.value = 0
    }

    if (ok) {
      const now = Date.now()
      if (now - lastSampleAt > 70) {
        lastSampleAt = now
        samplesCount.value++
        if (captured.value.length < TARGET_VALID_FRAMES) {
          captured.value.push({ descriptor: Array.from(det.descriptor), score: det.detection.score })
        }
      }

      if (phase.value === 'finding') {
        if (tooFar.value) {
          faceLockedFrames.value = 0
        } else {
          faceLockedFrames.value++
          if (faceLockedFrames.value >= FACE_LOCK_FRAMES && !challengeToken.value) {
            phase.value = 'challenging'
            await requestChallenge()
            if (failed.value || !challenges.value.length) return
          }
        }
      }

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

        const REQUIRED_SAMPLES = 12
        if (
          currentChallengeIndex.value >= challenges.value.length
          && !submitting.value
          && captured.value.length >= 6
          && samplesCount.value >= REQUIRED_SAMPLES
        ) {
          phase.value = 'submitting'
          await submit()
          return
        }
      }
    } else {
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

  const requestBody = {
    challenge_token: challengeToken.value,
    descriptor: avg,
    completed_challenges: completed.value.filter(c => c !== 'look_center'),
    samples_count: samplesCount.value
  }
  if (props.event?.geofence_enabled) {
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
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ── Panel — full-screen on mobile, card on sm+ ───────────── */
.fci-panel {
  background: #ffffff;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.10), 0 -2px 8px rgba(0, 0, 0, 0.05);
  max-height: 96vh;
  overflow-y: auto;
}
@media (min-width: 640px) {
  .fci-panel {
    border-radius: 24px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.14), 0 4px 16px rgba(0, 0, 0, 0.08);
    max-height: 92vh;
  }
}

/* ── Icon wrap ────────────────────────────────────────────── */
.fci-icon-wrap {
  width: 32px; height: 32px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex; align-items: center; justify-content: center;
  color: #3b82f6;
  border: 1px solid #dbeafe;
}

/* ── Close button ─────────────────────────────────────────── */
.fci-close-btn {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #9ca3af;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  transition: all 0.18s;
  cursor: pointer;
}
.fci-close-btn:hover { color: #374151; background: #f3f4f6; border-color: #d1d5db; }
.fci-close-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Camera frame ─────────────────────────────────────────── */
.fci-camera-frame {
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.12);
}

/* ── Spinner ──────────────────────────────────────────────── */
.fci-spinner {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.12);
  border-top-color: #60a5fa;
  animation: fci-spin 0.8s linear infinite;
}
@keyframes fci-spin { to { transform: rotate(360deg); } }

/* ── Scan ring ────────────────────────────────────────────── */
.fci-scan-ring {
  width: 62%;
  aspect-ratio: 1 / 1;
  max-width: 240px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(59,130,246,0.0) 40deg,
    rgba(59,130,246,0.5) 90deg,
    rgba(99,102,241,0.8) 130deg,
    rgba(59,130,246,0.5) 170deg,
    rgba(59,130,246,0.0) 220deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 56%, #000 58%, #000 64%, transparent 66%);
          mask: radial-gradient(circle, transparent 56%, #000 58%, #000 64%, transparent 66%);
  animation: fci-scan-rotate 2.4s linear infinite;
  filter: drop-shadow(0 0 6px rgba(59,130,246,0.4));
}
@keyframes fci-scan-rotate { to { transform: rotate(360deg); } }

/* ── Stage banners ────────────────────────────────────────── */
.fci-stage-banner { transition: background 0.3s, border-color 0.3s; border: 1px solid; }
.fci-stage-default   { background: #f9fafb; border-color: #e5e7eb; }
.fci-stage-info      { background: #eff6ff; border-color: #bfdbfe; }
.fci-stage-challenge { background: #f5f3ff; border-color: #ddd6fe; }
.fci-stage-success   { background: #f0fdf4; border-color: #bbf7d0; }
.fci-stage-error     { background: #fef2f2; border-color: #fecaca; }

/* ── Progress bar ─────────────────────────────────────────── */
.fci-progress-track {
  height: 5px;
  border-radius: 999px;
  background: #f3f4f6;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.fci-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
  box-shadow: 0 0 8px rgba(99,102,241,0.4);
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Challenge chips ──────────────────────────────────────── */
.fci-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 11px;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid;
  transition: all 0.25s;
}
.fci-chip-idle   { background: #f9fafb; border-color: #e5e7eb; color: #9ca3af; }
.fci-chip-active { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
.fci-chip-done   { background: #f0fdf4; border-color: #86efac; color: #16a34a; }

/* ── Action buttons ───────────────────────────────────────── */
.fci-btn-cancel {
  padding: 13px;
  border-radius: 14px;
  font-size: 0.875rem;
  font-weight: 600;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #374151;
  transition: all 0.18s;
  cursor: pointer;
}
.fci-btn-cancel:hover { background: #e5e7eb; color: #111827; }
.fci-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

.fci-btn-retry {
  padding: 13px;
  border-radius: 14px;
  font-size: 0.875rem;
  font-weight: 600;
  background: #3b82f6;
  border: none;
  color: white;
  transition: all 0.18s;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(59,130,246,0.28);
}
.fci-btn-retry:hover { background: #2563eb; box-shadow: 0 5px 16px rgba(59,130,246,0.36); transform: translateY(-1px); }
.fci-btn-retry:active { transform: translateY(0); }

/* ── Overlay transition ───────────────────────────────────── */
.fci-overlay-enter-active { transition: opacity 0.22s ease-out, backdrop-filter 0.22s ease-out, -webkit-backdrop-filter 0.22s ease-out; }
.fci-overlay-leave-active { transition: opacity 0.28s ease-in,  backdrop-filter 0.28s ease-in,  -webkit-backdrop-filter 0.28s ease-in; }
.fci-overlay-enter-from,
.fci-overlay-leave-to     { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }

/* ── Panel transition ─────────────────────────────────────── */
/* Mobile: slide up from bottom. Desktop: scale up from center. */
.fci-panel-enter-active { transition: opacity 0.28s ease-out, transform 0.34s cubic-bezier(0.34, 1.4, 0.64, 1); }
.fci-panel-leave-active { transition: opacity 0.24s ease-in,  transform 0.28s cubic-bezier(0.55, 0, 0.7, 0.2); }
.fci-panel-enter-from   { opacity: 0; transform: translateY(32px); }
.fci-panel-leave-to     { opacity: 0; transform: translateY(24px); }
@media (min-width: 640px) {
  .fci-panel-enter-from { opacity: 0; transform: scale(0.92) translateY(12px); }
  .fci-panel-leave-to   { opacity: 0; transform: scale(0.94) translateY(8px); }
}
</style>
