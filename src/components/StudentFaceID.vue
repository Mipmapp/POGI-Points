<template>
  <!-- Student-facing Face ID enrollment panel. Mirrors the admin Face Recognition
       Settings layout but slimmed down for the typical student journey:
       only enroll / remove (no rename, no secret code), and a small 3-face cap. -->
  <div :class="['border border-gray-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm']">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
      <div class="min-w-0">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-ssaam-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0"/>
          </svg>
          Face ID
        </h3>
        <p class="text-sm text-gray-500 mt-1">Optional. Enroll your face so you can check in to events with the campus kiosk.</p>
      </div>
      <span class="text-xs font-bold px-3 py-1 rounded-full bg-ssaam-dark/10 text-ssaam-dark">
        {{ savedFaces.length }} / {{ limit }} enrolled
      </span>
    </div>

    <!-- Banner -->
    <div v-if="loadError" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      <div>
        <p class="font-semibold">{{ loadError }}</p>
        <p class="text-xs text-red-600 mt-0.5">Make sure you've allowed camera access for this site, then try again.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <!-- ==================== LIVE CAPTURE ==================== -->
      <div class="lg:col-span-3 space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-semibold text-gray-700">Live Camera</label>
          <span v-if="modelsLoading" class="text-xs font-semibold flex items-center gap-1.5 text-ssaam-dark">
            <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Loading models…
          </span>
          <span v-else-if="cameraOn" class="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
          </span>
        </div>

        <div class="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3] border-2 border-ssaam-dark/20 shadow-inner">
          <video
            ref="videoEl"
            autoplay muted playsinline
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 face-mirror"
            :class="cameraOn ? 'opacity-100' : 'opacity-0'"
          ></video>
          <canvas ref="overlayEl" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

          <div v-if="cameraOn" class="ssaam-scanline absolute left-0 right-0 h-[2px] bg-ssaam-light shadow-[0_0_12px_2px_rgba(79,98,255,0.7)] pointer-events-none"></div>

          <template v-if="cameraOn">
            <div class="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-ssaam-light rounded-tl"></div>
            <div class="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-ssaam-light rounded-tr"></div>
            <div class="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-ssaam-light rounded-bl"></div>
            <div class="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-ssaam-light rounded-br"></div>
          </template>

          <div v-if="!cameraOn && !modelsLoading" class="absolute inset-0 flex flex-col items-center justify-center text-center text-white/80 p-6">
            <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </div>
            <p class="text-sm font-semibold">Camera is off</p>
            <p class="text-xs mt-1 max-w-[18rem] text-white/60">Tap <span class="font-bold text-white">Start Camera</span> to begin.</p>
          </div>

          <div v-if="cameraOn" class="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span class="text-[10px] font-bold text-white bg-black/50 backdrop-blur px-2.5 py-1 rounded-full">
              {{ liveStatus }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="!cameraOn"
            @click="startCamera"
            :disabled="modelsLoading || isCapturing || atLimit"
            class="flex-1 min-w-[150px] px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-ssaam-dark to-ssaam-light"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            {{ atLimit ? 'Limit reached' : 'Start Camera' }}
          </button>
          <button
            v-else
            @click="stopCamera"
            class="flex-1 min-w-[120px] px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Stop
          </button>
          <button
            @click="captureFace"
            :disabled="!cameraOn || isCapturing || !lastDetection || atLimit"
            class="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="isCapturing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            {{ isCapturing ? 'Saving…' : 'Save This Face' }}
          </button>
        </div>

        <p v-if="captureMessage" :class="['text-xs font-medium rounded-xl px-3 py-2', captureSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200']">
          {{ captureMessage }}
        </p>
      </div>

      <!-- ==================== ENROLLED FACES ==================== -->
      <div class="lg:col-span-2 space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-semibold text-gray-700">Your Faces</label>
          <button @click="loadFaces" :disabled="loadingFaces" class="text-xs font-semibold flex items-center gap-1 text-ssaam-dark disabled:opacity-50">
            <svg :class="['w-3.5 h-3.5', loadingFaces && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>

        <div v-if="loadingFaces && savedFaces.length === 0" class="space-y-2">
          <div v-for="i in 2" :key="i" class="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
        </div>

        <div v-else-if="savedFaces.length === 0" class="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center bg-gray-50/50">
          <div class="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 bg-ssaam-dark/10 text-ssaam-dark/60">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <p class="text-sm font-semibold text-gray-700">No faces enrolled</p>
          <p class="text-xs text-gray-500 mt-1">Capture your face to enable kiosk check-in.</p>
        </div>

        <ul v-else class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          <li
            v-for="face in savedFaces"
            :key="face._id"
            class="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm transition hover:border-ssaam-light"
          >
            <div class="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br from-ssaam-dark to-ssaam-light">
              <img v-if="face.photo" :src="face.photo" :alt="face.label" class="w-full h-full object-cover" />
              <span v-else>{{ (face.label || 'F').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ face.label || 'Face' }}</p>
              <p class="text-[11px] text-gray-500">Enrolled {{ formatDate(face.created_at) }}</p>
            </div>
            <button
              @click="deleteFace(face)"
              :disabled="deletingId === face._id"
              class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition disabled:opacity-50 flex-shrink-0"
            >
              <svg v-if="deletingId === face._id" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span v-else>Remove</span>
            </button>
          </li>
        </ul>

        <div class="text-xs text-gray-500 bg-ssaam-dark/5 border border-ssaam-dark/10 rounded-xl p-3 leading-relaxed">
          <p class="font-bold text-ssaam-dark mb-1 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Privacy
          </p>
          Your camera image is processed entirely in your browser. Only a 128-number math representation of your face (and a tiny thumbnail) is stored — never the live video.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildAPIUrl, getCollege } from '@/config/api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let faceapiPromise = null;
function loadFaceApi() {
  if (!faceapiPromise) {
    faceapiPromise = import('face-api.js').then(m => m.default || m);
  }
  return faceapiPromise;
}

export default {
  name: 'StudentFaceID',
  data() {
    return {
      faceapi: null,
      modelsLoading: false,
      modelsReady: false,
      loadError: '',

      stream: null,
      cameraOn: false,
      detectLoopId: null,

      lastDetection: null,
      liveStatus: 'Looking for face…',

      savedFaces: [],
      limit: 3,
      loadingFaces: false,

      isCapturing: false,
      captureMessage: '',
      captureSuccess: false,
      deletingId: null,
    };
  },
  computed: {
    atLimit() { return this.savedFaces.length >= this.limit; },
  },
  async mounted() {
    await this.loadFaces();
    await this.bootstrapModels();
  },
  beforeUnmount() { this.stopCamera(); },
  methods: {
    formatDate(d) {
      if (!d) return '';
      try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
      catch (_) { return ''; }
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
      if (this.atLimit) return;
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
          ? 'Camera permission was denied. Allow camera access in your browser to continue.'
          : 'Could not access the camera.';
      }
    },
    stopCamera() {
      this.cameraOn = false;
      if (this.detectLoopId) { cancelAnimationFrame(this.detectLoopId); this.detectLoopId = null; }
      if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
      const video = this.$refs.videoEl; if (video) video.srcObject = null;
      const canvas = this.$refs.overlayEl;
      if (canvas) { const ctx = canvas.getContext('2d'); ctx && ctx.clearRect(0, 0, canvas.width, canvas.height); }
      this.lastDetection = null;
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

        const w = video.clientWidth, h = video.clientHeight;
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);

        if (detection) {
          this.lastDetection = detection;
          const box = detection.detection.box;
          const sx = w / video.videoWidth, sy = h / video.videoHeight;
          const bw = box.width * sx;
          const bx = w - (box.x + box.width) * sx;
          ctx.strokeStyle = '#4f62ff';
          ctx.lineWidth = 3;
          ctx.strokeRect(bx, box.y * sy, bw, box.height * sy);
          this.liveStatus = 'Face detected — ready to save';
        } else {
          this.lastDetection = null;
          this.liveStatus = 'Looking for face…';
        }
      } catch (_) { /* transient */ }
      this.detectLoopId = requestAnimationFrame(() => this.runDetectionLoop());
    },
    captureThumbnail(box) {
      const video = this.$refs.videoEl;
      if (!video || !video.videoWidth) return null;
      const c = document.createElement('canvas');
      const size = 96;
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      const pad = box.width * 0.25;
      const sx = Math.max(0, box.x - pad);
      const sy = Math.max(0, box.y - pad);
      const sw = Math.min(video.videoWidth - sx, box.width + pad * 2);
      const sh = Math.min(video.videoHeight - sy, box.height + pad * 2);
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, size, size);
      try { return c.toDataURL('image/jpeg', 0.7); } catch (_) { return null; }
    },
    async captureFace() {
      if (!this.lastDetection || this.isCapturing || this.atLimit) return;
      this.isCapturing = true;
      this.captureMessage = '';
      try {
        const descriptor = Array.from(this.lastDetection.descriptor);
        const photo = this.captureThumbnail(this.lastDetection.detection.box);
        const label = `Face ${this.savedFaces.length + 1}`;
        const res = await fetch(buildAPIUrl('/apis/students/face'), {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ label, descriptor, photo }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save face');
        this.savedFaces = data.faces || [];
        this.captureSuccess = true;
        this.captureMessage = `Saved “${label}”. You can now check in by face at the kiosk.`;
        this.$emit('updated', this.savedFaces.length);
        if (this.atLimit) this.stopCamera();
      } catch (err) {
        this.captureSuccess = false;
        this.captureMessage = err.message || 'Could not save face.';
      } finally {
        this.isCapturing = false;
        setTimeout(() => { this.captureMessage = ''; }, 4500);
      }
    },
    async loadFaces() {
      this.loadingFaces = true;
      try {
        const res = await fetch(buildAPIUrl('/apis/students/face'), { headers: this.authHeaders() });
        if (res.ok) {
          const data = await res.json();
          this.savedFaces = data.faces || [];
          if (typeof data.limit === 'number') this.limit = data.limit;
          this.$emit('updated', this.savedFaces.length);
        }
      } catch (err) {
        console.error('Failed to load student faces:', err);
      } finally {
        this.loadingFaces = false;
      }
    },
    async deleteFace(face) {
      if (!face?._id || this.deletingId) return;
      if (!confirm(`Remove "${face.label || 'this face'}"? You can re-enroll any time.`)) return;
      this.deletingId = face._id;
      try {
        const res = await fetch(buildAPIUrl(`/apis/students/face/${face._id}`), {
          method: 'DELETE',
          headers: this.authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          this.savedFaces = data.faces || this.savedFaces.filter(f => f._id !== face._id);
          this.$emit('updated', this.savedFaces.length);
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
@keyframes ssaam-scan {
  0%   { top: 8%;  opacity: 0; }
  10%  { opacity: 0.9; }
  50%  { top: 92%; opacity: 0.9; }
  60%  { opacity: 0; }
  100% { top: 8%;  opacity: 0; }
}
.ssaam-scanline { animation: ssaam-scan 2.6s linear infinite; }
.face-mirror { transform: scaleX(-1); }
</style>
