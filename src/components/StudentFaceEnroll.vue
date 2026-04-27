<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="closeIfIdle">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
      <!-- Header -->
      <div :class="['px-5 py-4 flex items-center justify-between border-b', accentBorder]">
        <div>
          <h3 :class="['text-lg font-bold', accentText]">{{ hasExistingFace ? 'Update your Face ID' : 'Set up your Face ID' }}</h3>
          <p class="text-xs text-gray-500 mt-0.5">Used to mark your own attendance with a face scan.</p>
        </div>
        <button @click="closeIfIdle" :disabled="capturing" class="text-gray-400 hover:text-gray-700 disabled:opacity-40 text-2xl leading-none">&times;</button>
      </div>

      <div class="p-5 space-y-4">
        <!-- Cooldown banner -->
        <div v-if="cooldownActive" class="text-sm bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-xl p-3">
          <p class="font-semibold mb-0.5">Face ID is locked until {{ formatDate(nextUpdateAllowedAt) }}</p>
          <p class="text-xs">You can only change your Face ID once every {{ cooldownDays }} days. This protects your account from being changed without your knowledge.</p>
        </div>

        <!-- Stage banner -->
        <div v-else :class="['text-sm rounded-xl p-3 border-2', stageStyle.bg, stageStyle.border, stageStyle.text]">
          <p class="font-semibold mb-0.5">{{ stageMessage }}</p>
          <p v-if="stageHint" class="text-xs opacity-80">{{ stageHint }}</p>
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

          <!-- Face oval overlay -->
          <div v-if="cameraReady" class="absolute inset-0 pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
              <ellipse cx="50" cy="48" rx="22" ry="30" fill="none"
                :stroke="faceLocked ? '#22c55e' : (faceDetected ? '#fbbf24' : '#ffffff80')"
                stroke-width="0.6" stroke-dasharray="2 1.5" />
            </svg>
          </div>

          <!-- Sample progress -->
          <div v-if="capturing" class="absolute bottom-0 inset-x-0 h-1.5 bg-white/30">
            <div class="h-full bg-emerald-400 transition-all" :style="{ width: progressPct + '%' }"></div>
          </div>
        </div>

        <!-- Tips -->
        <ul class="text-xs text-gray-500 space-y-1">
          <li>• Hold your phone or laptop at eye level in good light.</li>
          <li>• Look straight at the camera, no sunglasses or mask.</li>
          <li>• Only your own face — your registration must be unique among students.</li>
        </ul>

        <!-- Error -->
        <div v-if="errorMessage" class="text-sm bg-red-50 border-2 border-red-200 text-red-800 rounded-xl p-3">
          {{ errorMessage }}
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-1">
          <button @click="closeIfIdle" :disabled="capturing" class="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 disabled:opacity-50">Cancel</button>
          <button v-if="!cooldownActive" @click="startCapture" :disabled="!cameraReady || capturing"
            :class="['flex-1 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50', accentBg]">
            {{ capturing ? `Capturing… ${capturedSamples}/${TARGET_SAMPLES}` : (hasExistingFace ? 'Update Face ID' : 'Capture & Save') }}
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
  hasExistingFace: { type: Boolean, default: false },
  cooldownActive: { type: Boolean, default: false },
  nextUpdateAllowedAt: { type: [String, Date, null], default: null },
  cooldownDays: { type: Number, default: 7 },
  isCOE: { type: Boolean, default: false },
  isSOM: { type: Boolean, default: false },
  isCNAHS: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'enrolled'])

// Theme
const accentText = computed(() => props.isCOE ? 'text-orange-900' : props.isSOM ? 'text-green-900' : props.isCNAHS ? 'text-emerald-900' : 'text-purple-900')
const accentBg = computed(() => props.isCOE ? 'bg-orange-600 hover:bg-orange-700' : props.isSOM ? 'bg-green-600 hover:bg-green-700' : props.isCNAHS ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700')
const accentBorder = computed(() => props.isCOE ? 'border-orange-100' : props.isSOM ? 'border-green-100' : props.isCNAHS ? 'border-emerald-100' : 'border-purple-100')

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

const TARGET_SAMPLES = 30
const progressPct = computed(() => Math.min(100, (capturedSamples.value / TARGET_SAMPLES) * 100))

const stageStyle = computed(() => {
  if (capturing.value) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' }
  if (faceDetected.value) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' }
  return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
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
      // Modal closed while we were waiting; release the stream.
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
      // Soft "lock" if the face has been visible enough for a beat.
      faceLocked.value = true
      if (capturing.value && det.descriptor && capturedSamples.value < TARGET_SAMPLES) {
        collectedDescriptors.value.push({
          descriptor: Array.from(det.descriptor),
          score: det.detection.score,
          // a quick photo snapshot for the very first sample, used as the avatar
          snapshot: capturedSamples.value === 0 ? snapshotFace(det.detection.box) : null
        })
        capturedSamples.value++
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
  // Average the top-N descriptors by detection score for a more stable template.
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

  // First-frame snapshot becomes the saved photo (small jpeg).
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
