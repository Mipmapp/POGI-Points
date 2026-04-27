<template>
  <!-- Backdrop fade -->
  <Transition name="face-backdrop">
    <div v-if="open" class="face-modal-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040820]/70 backdrop-blur-md" @click.self="closeIfIdle">
      <!-- Modal pop -->
      <Transition name="face-modal" appear>
        <div v-if="open" class="face-modal-shell relative w-full max-w-lg max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-gradient-to-b from-[#080e2e] to-[#0f1f6e] text-white">
          <!-- Decorative orbs (sidebar vibe) -->
          <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 face-modal-orb-a" :class="orbAColor"></div>
          <div class="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 face-modal-orb-b" :class="orbBColor"></div>
          <!-- subtle dot grid sheen -->
          <div class="absolute inset-0 opacity-[0.06] pointer-events-none" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 22px 22px;"></div>

          <div class="relative z-10 flex flex-col max-h-[92vh]">
            <!-- Header -->
            <div class="px-5 py-4 flex items-center justify-between border-b border-white/10">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-sm flex-shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0M4 7v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7a3 3 0 00-3 3z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <h3 class="text-lg font-bold text-white leading-tight truncate">{{ hasExistingFace ? 'Update your Face ID' : 'Set up your Face ID' }}</h3>
                  <p class="text-[11px] text-white/60 mt-0.5">Used to mark your own attendance with a face scan.</p>
                </div>
              </div>
              <button @click="closeIfIdle" :disabled="capturing"
                class="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Scroll body -->
            <div class="p-5 space-y-4 overflow-y-auto face-modal-scroll">
              <!-- Cooldown banner -->
              <div v-if="cooldownActive"
                class="text-sm rounded-xl p-3 border border-amber-300/40 bg-amber-400/15 text-amber-100">
                <p class="font-semibold mb-0.5">Face ID is locked until {{ formatDate(nextUpdateAllowedAt) }}</p>
                <p class="text-xs opacity-90">You can only change your Face ID once every {{ cooldownDays }} days. This protects your account from being changed without your knowledge.</p>
              </div>

              <!-- Stage banner (glass) -->
              <Transition name="face-stage" mode="out-in">
                <div v-if="!cooldownActive" :key="stageMessage"
                  :class="['text-sm rounded-xl p-3 border backdrop-blur-sm', stageStyle.bg, stageStyle.border, stageStyle.text]">
                  <p class="font-semibold mb-0.5 flex items-center gap-2">
                    <span class="inline-block w-2 h-2 rounded-full" :class="stageStyle.dot"></span>
                    {{ stageMessage }}
                  </p>
                  <p v-if="stageHint" class="text-xs opacity-80 mt-0.5">{{ stageHint }}</p>
                </div>
              </Transition>

              <!-- Camera -->
              <div class="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center ring-1 ring-white/10 shadow-inner">
                <video ref="videoEl" autoplay muted playsinline
                  :class="['w-full h-full object-cover transition-opacity duration-500', cameraReady ? 'opacity-100' : 'opacity-0']"
                  style="transform: scaleX(-1);" />

                <!-- Loading overlay -->
                <Transition name="face-fade">
                  <div v-if="!cameraReady" class="absolute inset-0 flex flex-col items-center justify-center text-white text-sm bg-[#040820]/60 backdrop-blur-sm">
                    <svg class="animate-spin w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>{{ camStatus }}</span>
                  </div>
                </Transition>

                <!-- Face oval overlay -->
                <div v-if="cameraReady" class="absolute inset-0 pointer-events-none">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
                    <ellipse cx="50" cy="48" rx="22" ry="30" fill="none"
                      :stroke="faceLocked ? '#34d399' : (faceDetected ? '#fbbf24' : '#ffffff80')"
                      stroke-width="0.6" stroke-dasharray="2 1.5">
                      <animate attributeName="stroke-dashoffset" from="0" to="14" dur="2.5s" repeatCount="indefinite"/>
                    </ellipse>
                  </svg>
                  <!-- corner brackets -->
                  <div class="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white/60 rounded-tl-md"></div>
                  <div class="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white/60 rounded-tr-md"></div>
                  <div class="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white/60 rounded-bl-md"></div>
                  <div class="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-white/60 rounded-br-md"></div>
                </div>

                <!-- Live status pill -->
                <Transition name="face-fade">
                  <div v-if="cameraReady" class="absolute top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/55 text-white border border-white/15 backdrop-blur-sm">
                    <span :class="['w-1.5 h-1.5 rounded-full', faceLocked ? 'bg-emerald-400 animate-ping-once-slow' : faceDetected ? 'bg-amber-400 animate-pulse' : 'bg-white/60']"></span>
                    {{ faceLocked ? 'Face locked' : faceDetected ? 'Face detected' : 'Searching…' }}
                  </div>
                </Transition>

                <!-- Sample progress -->
                <div v-if="capturing" class="absolute bottom-0 inset-x-0 h-2 bg-white/20">
                  <div class="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-200" :style="{ width: progressPct + '%' }"></div>
                </div>

                <!-- Capture flash -->
                <Transition name="face-flash">
                  <div v-if="captureFlash" class="absolute inset-0 bg-white pointer-events-none"></div>
                </Transition>
              </div>

              <!-- Tips (sidebar-style glass items) -->
              <ul class="text-xs text-white/75 space-y-1.5">
                <li class="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 border-l-4" :class="accentBorderL">
                  <svg class="w-3.5 h-3.5 mt-0.5 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  <span>Hold your phone or laptop at eye level in good light.</span>
                </li>
                <li class="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 border-l-4" :class="accentBorderL">
                  <svg class="w-3.5 h-3.5 mt-0.5 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  <span>Look straight at the camera, no sunglasses or mask.</span>
                </li>
                <li class="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 border-l-4" :class="accentBorderL">
                  <svg class="w-3.5 h-3.5 mt-0.5 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  <span>Only your own face — your registration must be unique among students.</span>
                </li>
              </ul>

              <!-- Error -->
              <Transition name="face-stage">
                <div v-if="errorMessage" class="text-sm rounded-xl p-3 border border-red-300/40 bg-red-500/15 text-red-100">
                  {{ errorMessage }}
                </div>
              </Transition>

              <!-- Actions -->
              <div class="flex gap-3 pt-1">
                <button @click="closeIfIdle" :disabled="capturing"
                  class="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 hover:border-white/25 disabled:opacity-40 transition-all">
                  Cancel
                </button>
                <button v-if="!cooldownActive" @click="startCapture" :disabled="!cameraReady || capturing"
                  class="face-cta-btn group relative flex-1 py-2.5 rounded-xl font-semibold text-white border border-white/25 bg-white/15 hover:bg-white/25 hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-black/20">
                  <span v-if="!capturing && !disableCta" class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></span>
                  <span class="relative">{{ capturing ? `Capturing… ${capturedSamples}/${TARGET_SAMPLES}` : (hasExistingFace ? 'Update Face ID' : 'Capture & Save') }}</span>
                </button>
              </div>
            </div>
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
  hasExistingFace: { type: Boolean, default: false },
  cooldownActive: { type: Boolean, default: false },
  nextUpdateAllowedAt: { type: [String, Date, null], default: null },
  cooldownDays: { type: Number, default: 7 },
  isCOE: { type: Boolean, default: false },
  isSOM: { type: Boolean, default: false },
  isCNAHS: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'enrolled'])

// Theme accents (kept subtle inside the deep-navy sidebar look)
const orbAColor = computed(() => props.isCOE ? 'bg-orange-500' : props.isSOM ? 'bg-green-500' : props.isCNAHS ? 'bg-emerald-500' : 'bg-blue-500')
const orbBColor = computed(() => props.isCOE ? 'bg-amber-500' : props.isSOM ? 'bg-yellow-500' : props.isCNAHS ? 'bg-green-500' : 'bg-indigo-500')
const accentBorderL = computed(() => props.isCOE ? 'border-l-orange-300/70' : props.isSOM ? 'border-l-green-300/70' : props.isCNAHS ? 'border-l-emerald-300/70' : 'border-l-blue-300/70')

// Camera + capture state
const videoEl = ref(null)
let mediaStream = null
let detectionLoopHandle = null
const cameraReady = ref(false)
const camStatus = ref('Loading camera…')
const faceDetected = ref(false)
const faceLocked = ref(false)
const capturing = ref(false)
const capturedSamples = ref(0)
const errorMessage = ref('')
const collectedDescriptors = ref([])  // { descriptor, score }
const captureFlash = ref(false)

const TARGET_SAMPLES = 30
const progressPct = computed(() => Math.min(100, (capturedSamples.value / TARGET_SAMPLES) * 100))
const disableCta = computed(() => !cameraReady.value || capturing.value)

const stageStyle = computed(() => {
  if (capturing.value) return {
    bg: 'bg-emerald-400/15', border: 'border-emerald-300/40', text: 'text-emerald-100', dot: 'bg-emerald-300 animate-pulse'
  }
  if (faceDetected.value) return {
    bg: 'bg-blue-400/15', border: 'border-blue-300/40', text: 'text-blue-100', dot: 'bg-blue-300 animate-pulse'
  }
  return { bg: 'bg-white/10', border: 'border-white/15', text: 'text-white/85', dot: 'bg-white/60' }
})
const stageMessage = computed(() => {
  if (capturing.value) return 'Hold still — capturing your face'
  if (faceDetected.value) return 'Face detected — tap Capture when ready'
  if (cameraReady.value) return 'Position your face inside the oval'
  return 'Setting up your camera'
})
const stageHint = computed(() => {
  if (capturing.value) return `Sampling ${TARGET_SAMPLES} frames to build a strong template`
  return ''
})

function formatDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return String(d) }
}

watch(() => props.open, async (val) => {
  if (val) await openCamera()
  else stopCamera()
})

async function openCamera() {
  errorMessage.value = ''
  cameraReady.value = false
  faceDetected.value = false
  faceLocked.value = false
  capturedSamples.value = 0
  collectedDescriptors.value = []

  try {
    camStatus.value = 'Loading face models…'
    await ensureModelsLoaded()
    camStatus.value = 'Requesting camera…'
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    })
    if (!props.open) {
      mediaStream.getTracks().forEach(t => t.stop())
      mediaStream = null
      return
    }
    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream
      await videoEl.value.play().catch(() => {})
    }
    cameraReady.value = true
    camStatus.value = ''
    runDetectionLoop()
  } catch (err) {
    console.error('[FaceEnroll] camera error', err)
    errorMessage.value = err && err.name === 'NotAllowedError'
      ? 'Camera permission was denied. Please allow camera access in your browser to set up Face ID.'
      : 'Could not start the camera. Make sure no other app is using it and try again.'
    camStatus.value = ''
  }
}

function stopCamera() {
  cameraReady.value = false
  if (detectionLoopHandle) {
    clearTimeout(detectionLoopHandle)
    detectionLoopHandle = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
  if (videoEl.value) videoEl.value.srcObject = null
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
    if (ok) {
      faceLocked.value = true
      if (capturing.value && det.descriptor && capturedSamples.value < TARGET_SAMPLES) {
        collectedDescriptors.value.push({
          descriptor: Array.from(det.descriptor),
          score: det.detection.score,
          snapshot: capturedSamples.value === 0 ? snapshotFace(det.detection.box) : null
        })
        capturedSamples.value++
        // brief flash on first sample for feedback
        if (capturedSamples.value === 1) {
          captureFlash.value = true
          setTimeout(() => { captureFlash.value = false }, 180)
        }
        if (capturedSamples.value >= TARGET_SAMPLES) {
          await finishCapture()
          return
        }
      }
    } else {
      faceLocked.value = false
    }
  } catch (err) {
    console.warn('[FaceEnroll] detect error', err)
  }
  if (cameraReady.value) {
    detectionLoopHandle = setTimeout(runDetectionLoop, 120)
  }
}

function snapshotFace(box) {
  try {
    const v = videoEl.value
    if (!v || !box) return null
    const c = document.createElement('canvas')
    const pad = 0.4
    const x = Math.max(0, box.x - box.width * pad / 2)
    const y = Math.max(0, box.y - box.height * pad / 2)
    const w = Math.min(v.videoWidth - x, box.width * (1 + pad))
    const h = Math.min(v.videoHeight - y, box.height * (1 + pad))
    c.width = 200; c.height = 200
    const ctx = c.getContext('2d')
    ctx.drawImage(v, x, y, w, h, 0, 0, 200, 200)
    return c.toDataURL('image/jpeg', 0.6)
  } catch (_) { return null }
}

function startCapture() {
  if (!faceDetected.value) {
    errorMessage.value = 'Face not detected. Center your face in the oval and try again.'
    return
  }
  errorMessage.value = ''
  capturing.value = true
  capturedSamples.value = 0
  collectedDescriptors.value = []
}

async function finishCapture() {
  capturing.value = false
  const top = [...collectedDescriptors.value]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(20, collectedDescriptors.value.length))
  if (!top.length) {
    errorMessage.value = 'Capture failed — please try again with better lighting.'
    return
  }
  const avg = new Array(128).fill(0)
  for (const t of top) for (let i = 0; i < 128; i++) avg[i] += t.descriptor[i]
  for (let i = 0; i < 128; i++) avg[i] /= top.length

  const photo = collectedDescriptors.value.find(s => s.snapshot)?.snapshot || null

  await submitEnrollment(avg, photo)
}

async function submitEnrollment(descriptor, photo) {
  errorMessage.value = ''
  const token = localStorage.getItem('authToken') || localStorage.getItem('studentToken')
  try {
    const res = await fetch(buildAPIUrl('/apis/students/face'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp()
      },
      body: JSON.stringify({ descriptor, photo, label: 'My Face' })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      emit('enrolled', data)
      stopCamera()
      emit('close')
    } else {
      errorMessage.value = data.message || 'Enrollment failed. Please try again.'
    }
  } catch (err) {
    console.error('[FaceEnroll] submit error', err)
    errorMessage.value = 'Network error. Please check your connection and try again.'
  }
}

function closeIfIdle() {
  if (capturing.value) return
  stopCamera()
  emit('close')
}

onBeforeUnmount(() => stopCamera())
</script>

<style scoped>
/* Backdrop fade */
.face-backdrop-enter-active,
.face-backdrop-leave-active {
  transition: opacity 0.28s ease, backdrop-filter 0.28s ease;
}
.face-backdrop-enter-from,
.face-backdrop-leave-to { opacity: 0; }

/* Modal pop (scale + slide-up + fade) */
.face-modal-enter-active {
  transition: transform 0.42s cubic-bezier(0.22, 1.2, 0.36, 1), opacity 0.28s ease;
}
.face-modal-leave-active {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.18s ease;
}
.face-modal-enter-from {
  opacity: 0;
  transform: translateY(28px) scale(0.92);
}
.face-modal-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}

/* Stage banner cross-fade */
.face-stage-enter-active,
.face-stage-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.face-stage-enter-from { opacity: 0; transform: translateY(-4px); }
.face-stage-leave-to { opacity: 0; transform: translateY(4px); }

/* Generic fade */
.face-fade-enter-active,
.face-fade-leave-active { transition: opacity 0.3s ease; }
.face-fade-enter-from,
.face-fade-leave-to { opacity: 0; }

/* Capture flash */
.face-flash-enter-active { transition: opacity 0.05s ease; }
.face-flash-leave-active { transition: opacity 0.18s ease; }
.face-flash-enter-from,
.face-flash-leave-to { opacity: 0; }

/* Floating orbs */
@keyframes face-orb-drift-a {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.30; }
  50%      { transform: translate(-12px, 8px) scale(1.08); opacity: 0.40; }
}
@keyframes face-orb-drift-b {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.20; }
  50%      { transform: translate(14px, -10px) scale(1.06); opacity: 0.30; }
}
.face-modal-orb-a { animation: face-orb-drift-a 12s ease-in-out infinite; }
.face-modal-orb-b { animation: face-orb-drift-b 16s ease-in-out infinite; }

/* Camera ping for the locked indicator */
@keyframes face-ping-once-slow {
  0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6); }
  70% { box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}
.animate-ping-once-slow {
  animation: face-ping-once-slow 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* Custom scrollbar inside modal */
.face-modal-scroll::-webkit-scrollbar { width: 6px; }
.face-modal-scroll::-webkit-scrollbar-track { background: transparent; }
.face-modal-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
}
.face-modal-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
}

/* Button micro-interaction */
.face-cta-btn:active {
  transform: scale(0.98);
}
</style>
