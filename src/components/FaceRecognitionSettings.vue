<template>
  <!-- Matches the rest of the Settings panel: white card, gray border,
       rounded-xl, themed accents based on the active college. -->
  <div :class="['border border-gray-200 rounded-xl p-6', tint.bgSoft]">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div class="min-w-0">
        <h3 :class="['text-lg font-semibold flex items-center gap-2', tint.heading]">
          <svg :class="['w-5 h-5', tint.icon]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0"/>
          </svg>
          Facial Recognition
        </h3>
        <p class="text-sm text-gray-500 mt-1">Enroll faces for biometric sign-in (Super Admin only)</p>
      </div>
      <div class="flex items-center gap-2">
        <span :class="['text-xs font-semibold px-3 py-1 rounded-full', tint.badge]">
          {{ savedFaces.length }} / 10 saved
        </span>
        <span v-if="cameraOn" class="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          LIVE
        </span>
      </div>
    </div>

    <!-- Banner / status -->
    <div v-if="loadError" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      <div>
        <p class="font-semibold">{{ loadError }}</p>
        <p class="text-xs text-red-600 mt-0.5">Check your camera permissions and your network, then try again.</p>
      </div>
    </div>

    <!-- Body grid -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- ==================== LIVE CAPTURE ==================== -->
      <div class="lg:col-span-3 space-y-4">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">Live Capture</label>
          <span v-if="modelsLoading" :class="['text-xs font-semibold flex items-center gap-1.5', tint.icon]">
            <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Loading models…
          </span>
        </div>

        <!-- Scanner viewport -->
        <div :class="['relative rounded-xl overflow-hidden bg-gray-900 aspect-[4/3] border-2 shadow-inner', tint.viewportBorder]">
          <video
            ref="videoEl"
            autoplay
            muted
            playsinline
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 face-mirror"
            :class="cameraOn ? 'opacity-100' : 'opacity-0'"
          ></video>
          <canvas ref="overlayEl" class="absolute inset-0 w-full h-full pointer-events-none face-mirror"></canvas>

          <!-- Animated scan-line when actively scanning -->
          <div
            v-if="cameraOn"
            class="ssaam-scanline absolute left-0 right-0 h-[2px] pointer-events-none"
            :class="tint.scanline"
          ></div>

          <!-- Corner brackets -->
          <template v-if="cameraOn">
            <div :class="['absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl', tint.corner]"></div>
            <div :class="['absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 rounded-tr', tint.corner]"></div>
            <div :class="['absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 rounded-bl', tint.corner]"></div>
            <div :class="['absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 rounded-br', tint.corner]"></div>
          </template>

          <!-- Empty state -->
          <div v-if="!cameraOn && !modelsLoading" class="absolute inset-0 flex flex-col items-center justify-center text-center text-white/80 p-6">
            <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </div>
            <p class="text-sm font-semibold">Camera is off</p>
            <p class="text-xs mt-1 max-w-[18rem] text-white/60">Press <span class="font-bold text-white">Start Camera</span> below to begin live face detection.</p>
          </div>

          <!-- Detection HUD -->
          <div v-if="cameraOn" class="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span class="text-[10px] font-bold text-white bg-black/50 backdrop-blur px-2.5 py-1 rounded-full">
              {{ liveStatus }}
            </span>
          </div>
          <div v-if="cameraOn && liveDistance !== null" class="absolute bottom-2 left-1/2 -translate-x-1/2">
            <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur shadow', liveDistance < MATCH_THRESHOLD ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white']">
              {{ liveDistance < MATCH_THRESHOLD ? '✓ Recognized' : 'No match' }}
              · confidence {{ Math.max(0, Math.round((1 - liveDistance) * 100)) }}%
            </span>
          </div>
        </div>

        <!-- Camera controls -->
        <div class="flex flex-wrap gap-2">
          <button
            v-if="!cameraOn"
            @click="startCamera"
            :disabled="modelsLoading || isCapturing"
            :class="['flex-1 min-w-[150px] px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r', tint.primaryBtn]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Start Camera
          </button>
          <button
            v-else
            @click="stopCamera"
            class="flex-1 min-w-[120px] px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Stop
          </button>
          <button
            @click="captureFace"
            :disabled="!cameraOn || isCapturing || !lastDetection"
            class="flex-1 min-w-[160px] px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="isCapturing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {{ isCapturing ? 'Saving…' : 'Capture &amp; Save Face' }}
          </button>
        </div>

        <p v-if="captureMessage" :class="['text-xs font-medium rounded-lg px-3 py-2', captureSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200']">
          {{ captureMessage }}
        </p>
      </div>

      <!-- ==================== SAVED FACES ==================== -->
      <div class="lg:col-span-2 space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">Enrolled Faces</label>
          <button @click="loadFaces" :disabled="loadingFaces" :class="['text-xs font-semibold flex items-center gap-1 disabled:opacity-50', tint.icon]">
            <svg :class="['w-3.5 h-3.5', loadingFaces && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>

        <div v-if="loadingFaces && savedFaces.length === 0" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-gray-100 animate-pulse"></div>
        </div>

        <div v-else-if="savedFaces.length === 0" class="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center bg-white/50">
          <div :class="['w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2', tint.emptyIcon]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <p class="text-sm font-semibold text-gray-700">No faces enrolled yet</p>
          <p class="text-xs text-gray-500 mt-1">Capture at least one face above for biometric sign-in.</p>
        </div>

        <ul v-else class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          <li
            v-for="face in savedFaces"
            :key="face._id"
            :class="['flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm transition', tint.itemHover]"
          >
            <div :class="['w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br', tint.avatar]">
              <img v-if="face.photo" :src="face.photo" :alt="face.label" class="w-full h-full object-cover" />
              <span v-else>{{ (face.label || 'F').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <!-- Inline rename mode -->
              <div v-if="editingId === face._id" class="flex items-center gap-1.5">
                <input
                  v-model="editingLabel"
                  type="text"
                  maxlength="64"
                  :class="['flex-1 min-w-0 px-2 py-0.5 text-sm border rounded-md outline-none transition-all', tint.input]"
                  @keyup.enter="saveRename(face)"
                  @keyup.escape="cancelRename"
                  ref="renameInput"
                />
                <button
                  @click="saveRename(face)"
                  :disabled="renamingId === face._id"
                  class="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50 flex-shrink-0"
                  title="Save"
                >
                  <svg v-if="renamingId === face._id" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
                <button
                  @click="cancelRename"
                  class="p-1 rounded text-gray-400 hover:bg-gray-100 transition flex-shrink-0"
                  title="Cancel"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <!-- Display mode -->
              <div v-else class="flex items-center gap-1.5 group">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ face.label || 'Face' }}</p>
                <button
                  @click="startRename(face)"
                  :class="['p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity', tint.icon]"
                  title="Rename"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
              </div>
              <p class="text-[11px] text-gray-500">Enrolled {{ formatDate(face.created_at) }}</p>
            </div>
            <button
              v-if="editingId !== face._id"
              @click="deleteFace(face)"
              :disabled="deletingId === face._id"
              class="px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition disabled:opacity-50 flex-shrink-0"
            >
              <svg v-if="deletingId === face._id" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span v-else>Remove</span>
            </button>
          </li>
        </ul>

        <div class="text-xs text-gray-500 bg-white/70 border border-gray-200 rounded-lg p-3 leading-relaxed">
          <p class="font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <svg :class="['w-3.5 h-3.5', tint.icon]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            How it works
          </p>
          Faces are processed in your browser using <strong>face-api.js</strong>. Only the 128-number descriptor and an optional thumbnail are saved to your admin profile — the live video never leaves your device.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildAPIUrl, getCollege } from '@/config/api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const MATCH_THRESHOLD = 0.38; // lower = stricter — must match login threshold

let faceapiPromise = null;
function loadFaceApi() {
  if (!faceapiPromise) {
    faceapiPromise = import('face-api.js').then(m => m.default || m);
  }
  return faceapiPromise;
}

// Per-college accent palette so the section visually matches the Settings
// page header chosen by the active college.
const TINTS = {
  blue: {
    bgSoft: 'bg-blue-50/30',
    heading: 'text-blue-900',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    viewportBorder: 'border-blue-200',
    corner: 'border-blue-400',
    scanline: 'bg-blue-400 shadow-[0_0_12px_2px_rgba(59,130,246,0.7)]',
    primaryBtn: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    input: 'border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white',
    avatar: 'from-blue-500 to-blue-700',
    itemHover: 'hover:border-blue-300',
    emptyIcon: 'bg-blue-50 text-blue-300',
  },
  orange: {
    bgSoft: 'bg-orange-50/30',
    heading: 'text-orange-900',
    icon: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    viewportBorder: 'border-orange-200',
    corner: 'border-orange-400',
    scanline: 'bg-orange-400 shadow-[0_0_12px_2px_rgba(249,115,22,0.7)]',
    primaryBtn: 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
    input: 'border-orange-300 focus:ring-2 focus:ring-orange-200 focus:border-transparent bg-white',
    avatar: 'from-orange-400 to-red-500',
    itemHover: 'hover:border-orange-300',
    emptyIcon: 'bg-orange-50 text-orange-300',
  },
  green: {
    bgSoft: 'bg-green-50/30',
    heading: 'text-green-900',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    viewportBorder: 'border-green-200',
    corner: 'border-green-400',
    scanline: 'bg-green-400 shadow-[0_0_12px_2px_rgba(34,197,94,0.7)]',
    primaryBtn: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
    input: 'border-green-300 focus:ring-2 focus:ring-green-200 focus:border-transparent bg-white',
    avatar: 'from-green-500 to-green-700',
    itemHover: 'hover:border-green-300',
    emptyIcon: 'bg-green-50 text-green-300',
  },
};

export default {
  name: 'FaceRecognitionSettings',
  props: {
    theme: { type: String, default: 'blue' },
  },
  computed: {
    tint() {
      return TINTS[this.theme] || TINTS.blue;
    },
  },
  data() {
    return {
      MATCH_THRESHOLD,
      faceapi: null,
      modelsLoading: false,
      modelsReady: false,
      loadError: '',

      stream: null,
      cameraOn: false,
      detectLoopId: null,

      lastDetection: null,
      liveDistance: null,
      liveStatus: 'Looking for face…',

      savedFaces: [],
      loadingFaces: false,

      newLabel: '',
      isCapturing: false,
      captureMessage: '',
      captureSuccess: false,
      deletingId: null,
      editingId: null,
      editingLabel: '',
      renamingId: null,
    };
  },
  async mounted() {
    await this.bootstrapModels();
    await this.loadFaces();
  },
  beforeUnmount() {
    this.stopCamera();
  },
  methods: {
    formatDate(d) {
      if (!d) return '';
      try {
        return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (_) {
        return '';
      }
    },
    authHeaders(extra = {}) {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-SSAAM-College': getCollege(),
        ...extra,
      };
    },

    async bootstrapModels() {
      if (this.modelsReady) return;
      this.modelsLoading = true;
      this.loadError = '';
      try {
        const faceapi = await loadFaceApi();
        this.faceapi = faceapi;
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        this.modelsReady = true;
      } catch (err) {
        console.error('face-api models failed to load:', err);
        this.loadError = 'Could not load face recognition models.';
      } finally {
        this.modelsLoading = false;
      }
    },

    async startCamera() {
      if (!this.modelsReady) await this.bootstrapModels();
      if (!this.modelsReady) return;
      this.loadError = '';
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        const video = this.$refs.videoEl;
        video.srcObject = this.stream;
        await new Promise((resolve) => {
          video.onloadedmetadata = () => { video.play().then(resolve).catch(resolve); };
        });
        this.cameraOn = true;
        this.runDetectionLoop();
      } catch (err) {
        console.error('Camera error:', err);
        this.loadError = err.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access in your browser to continue.'
          : 'Could not access the camera.';
      }
    },

    stopCamera() {
      this.cameraOn = false;
      if (this.detectLoopId) {
        cancelAnimationFrame(this.detectLoopId);
        this.detectLoopId = null;
      }
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      const video = this.$refs.videoEl;
      if (video) video.srcObject = null;
      const canvas = this.$refs.overlayEl;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      this.lastDetection = null;
      this.liveDistance = null;
      this.liveStatus = 'Camera off';
    },

    async runDetectionLoop() {
      if (!this.cameraOn || !this.faceapi) return;
      const video = this.$refs.videoEl;
      const canvas = this.$refs.overlayEl;
      if (!video || !canvas || video.readyState < 2) {
        this.detectLoopId = requestAnimationFrame(() => this.runDetectionLoop());
        return;
      }

      try {
        const detection = await this.faceapi
          .detectSingleFace(video, new this.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        // Match canvas size to video display size
        const w = video.clientWidth, h = video.clientHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w; canvas.height = h;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);

        if (detection) {
          this.lastDetection = detection;
          // Map detection box from video native dims -> displayed dims
          const box = detection.detection.box;
          const sx = w / video.videoWidth;
          const sy = h / video.videoHeight;

          // Compare against saved faces
          let best = null;
          for (const f of this.savedFaces) {
            if (!Array.isArray(f.descriptor)) continue;
            const dist = this.euclidean(detection.descriptor, f.descriptor);
            if (best === null || dist < best.dist) best = { dist, label: f.label };
          }
          this.liveDistance = best ? best.dist : null;
          this.liveStatus = best
            ? (best.dist < MATCH_THRESHOLD ? `Recognized: ${best.label}` : 'Face detected · not recognized')
            : 'Face detected · capture to enroll';

          // Draw box
          const matched = best && best.dist < MATCH_THRESHOLD;
          ctx.strokeStyle = matched ? '#10b981' : '#a855f7';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x * sx, box.y * sy, box.width * sx, box.height * sy);

          // Label tag
          const label = matched ? `✓ ${best.label}` : (best ? `${(best.dist).toFixed(2)} away` : 'New face');
          ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
          const padding = 6;
          const tw = ctx.measureText(label).width + padding * 2;
          ctx.fillStyle = matched ? 'rgba(16,185,129,0.9)' : 'rgba(168,85,247,0.9)';
          ctx.fillRect(box.x * sx, box.y * sy - 22, tw, 20);
          ctx.fillStyle = '#fff';
          ctx.fillText(label, box.x * sx + padding, box.y * sy - 8);
        } else {
          this.lastDetection = null;
          this.liveDistance = null;
          this.liveStatus = 'Looking for face…';
        }
      } catch (err) {
        // Silent — detection can throw transiently while video buffers
      }

      this.detectLoopId = requestAnimationFrame(() => this.runDetectionLoop());
    },

    euclidean(a, b) {
      let s = 0;
      for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        s += d * d;
      }
      return Math.sqrt(s);
    },

    captureThumbnail(box) {
      // Crop the face region from the current video frame as a small JPEG.
      const video = this.$refs.videoEl;
      if (!video || !video.videoWidth) return null;
      const c = document.createElement('canvas');
      const size = 96;
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      // Expand box ~25% for context, clamp to video bounds
      const pad = box.width * 0.25;
      const sx = Math.max(0, box.x - pad);
      const sy = Math.max(0, box.y - pad);
      const sw = Math.min(video.videoWidth - sx, box.width + pad * 2);
      const sh = Math.min(video.videoHeight - sy, box.height + pad * 2);
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, size, size);
      try { return c.toDataURL('image/jpeg', 0.7); } catch (_) { return null; }
    },

    async captureFace() {
      if (!this.lastDetection || this.isCapturing) return;
      this.isCapturing = true;
      this.captureMessage = '';
      try {
        const descriptor = Array.from(this.lastDetection.descriptor);
        const photo = this.captureThumbnail(this.lastDetection.detection.box);
        const label = this.newLabel.trim() || `Face ${this.savedFaces.length + 1}`;

        const res = await fetch(buildAPIUrl('/apis/masters/face'), {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ label, descriptor, photo }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save face');
        this.savedFaces.push(data.face);
        this.captureSuccess = true;
        this.captureMessage = `Saved “${data.face.label}”.`;
        this.newLabel = '';
      } catch (err) {
        this.captureSuccess = false;
        this.captureMessage = err.message || 'Could not save face.';
      } finally {
        this.isCapturing = false;
        setTimeout(() => { this.captureMessage = ''; }, 4000);
      }
    },

    async loadFaces() {
      this.loadingFaces = true;
      try {
        const res = await fetch(buildAPIUrl('/apis/masters/face'), {
          headers: this.authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          this.savedFaces = data.faces || [];
        } else if (res.status === 403) {
          this.loadError = 'Only the Super Admin can manage facial recognition.';
        }
      } catch (err) {
        console.error('Failed to load faces:', err);
      } finally {
        this.loadingFaces = false;
      }
    },

    startRename(face) {
      this.editingId = face._id;
      this.editingLabel = face.label || '';
      this.$nextTick(() => {
        const input = this.$refs.renameInput;
        const el = Array.isArray(input) ? input[0] : input;
        if (el) { el.focus(); el.select(); }
      });
    },

    cancelRename() {
      this.editingId = null;
      this.editingLabel = '';
    },

    async saveRename(face) {
      const newLabel = this.editingLabel.trim();
      if (!newLabel || newLabel === face.label) {
        this.cancelRename();
        return;
      }
      this.renamingId = face._id;
      try {
        const res = await fetch(buildAPIUrl(`/apis/masters/face/${face._id}`), {
          method: 'PATCH',
          headers: this.authHeaders(),
          body: JSON.stringify({ label: newLabel }),
        });
        if (res.ok) {
          const data = await res.json();
          const idx = this.savedFaces.findIndex(f => f._id === face._id);
          if (idx !== -1) this.savedFaces[idx] = { ...this.savedFaces[idx], label: data.face?.label ?? newLabel };
          this.savedFaces = [...this.savedFaces];
        } else {
          const data = await res.json().catch(() => ({}));
          console.error('Rename failed:', data.message);
        }
      } catch (err) {
        console.error('Rename face failed:', err);
      } finally {
        this.renamingId = null;
        this.cancelRename();
      }
    },

    async deleteFace(face) {
      if (!face?._id) return;
      this.deletingId = face._id;
      try {
        const res = await fetch(buildAPIUrl(`/apis/masters/face/${face._id}`), {
          method: 'DELETE',
          headers: this.authHeaders(),
        });
        if (res.ok) {
          this.savedFaces = this.savedFaces.filter(f => f._id !== face._id);
        }
      } catch (err) {
        console.error('Delete face failed:', err);
      } finally {
        this.deletingId = null;
      }
    },
  },
};
</script>

<style scoped>
/* Vertical scan line that sweeps the viewport while the camera is on. */
@keyframes ssaam-scan {
  0%   { top: 8%;  opacity: 0; }
  10%  { opacity: 0.9; }
  50%  { top: 92%; opacity: 0.9; }
  60%  { opacity: 0; }
  100% { top: 8%;  opacity: 0; }
}
.ssaam-scanline {
  animation: ssaam-scan 2.6s linear infinite;
}

/* Mirror the camera feed so it feels natural (like a selfie) */
.face-mirror {
  transform: scaleX(-1);
}
</style>
