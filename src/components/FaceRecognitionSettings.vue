<template>
  <div class="border-2 border-purple-100 rounded-2xl bg-gradient-to-br from-purple-50/60 via-white to-indigo-50/60 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 sm:px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-base sm:text-lg font-extrabold tracking-tight">Facial Recognition</h3>
        <p class="text-xs text-purple-100">Super Admin only · enroll faces for biometric sign-in</p>
      </div>
      <div class="hidden sm:flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-[11px] font-semibold">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
        {{ savedFaces.length }}/10 saved
      </div>
    </div>

    <!-- Body -->
    <div class="p-5 sm:p-6 space-y-6">
      <!-- Banner / status -->
      <div v-if="loadError" class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <div>
          <p class="font-bold">{{ loadError }}</p>
          <p class="text-xs text-red-600 mt-0.5">Check your camera permissions and your network, then try again.</p>
        </div>
      </div>

      <!-- Camera + controls grid -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <!-- Live capture -->
        <div class="lg:col-span-3 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-purple-600"></span>
              Live Capture
            </h4>
            <span v-if="modelsLoading" class="text-[11px] font-semibold text-purple-600 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Loading models…
            </span>
            <span v-else-if="cameraOn" class="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE
            </span>
            <span v-else class="text-[11px] font-semibold text-gray-400">Camera off</span>
          </div>

          <div class="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3] shadow-lg border-2 border-purple-100">
            <video
              ref="videoEl"
              autoplay
              muted
              playsinline
              class="absolute inset-0 w-full h-full object-cover"
              :class="cameraOn ? 'opacity-100' : 'opacity-0'"
            ></video>
            <canvas ref="overlayEl" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

            <!-- Empty state -->
            <div v-if="!cameraOn && !modelsLoading" class="absolute inset-0 flex flex-col items-center justify-center text-center text-white/70 p-6">
              <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
              <p class="text-sm font-semibold">Camera is off</p>
              <p class="text-[11px] mt-1 max-w-[16rem]">Press <span class="font-bold text-white">Start Camera</span> below to begin live face detection.</p>
            </div>

            <!-- Detection HUD -->
            <div v-if="cameraOn" class="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold text-white bg-black/40 backdrop-blur px-2 py-1 rounded-md">
                {{ liveStatus }}
              </span>
              <span v-if="liveDistance !== null" class="text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur"
                :class="liveDistance < MATCH_THRESHOLD ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-white'">
                {{ liveDistance < MATCH_THRESHOLD ? 'Match' : 'No match' }} · {{ (1 - liveDistance).toFixed(2) }}
              </span>
            </div>
          </div>

          <!-- Camera controls -->
          <div class="flex flex-wrap gap-2">
            <button
              v-if="!cameraOn"
              @click="startCamera"
              :disabled="modelsLoading || isCapturing"
              class="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold shadow-md shadow-purple-200 hover:opacity-95 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              Start Camera
            </button>
            <button
              v-else
              @click="stopCamera"
              class="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              Stop
            </button>
            <button
              @click="captureFace"
              :disabled="!cameraOn || isCapturing || !lastDetection"
              class="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="isCapturing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {{ isCapturing ? 'Saving…' : 'Capture &amp; Save' }}
            </button>
          </div>

          <!-- Label input -->
          <div class="space-y-1">
            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Face Label</label>
            <input
              v-model="newLabel"
              type="text"
              maxlength="64"
              placeholder="e.g. Office light, Daylight, Glasses on…"
              class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none text-sm bg-white transition"
            />
          </div>

          <p v-if="captureMessage" :class="['text-xs font-semibold rounded-lg px-3 py-2', captureSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200']">
            {{ captureMessage }}
          </p>
        </div>

        <!-- Saved faces -->
        <div class="lg:col-span-2 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-indigo-600"></span>
              Saved Faces
            </h4>
            <button @click="loadFaces" :disabled="loadingFaces" class="text-[11px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50">
              <svg :class="['w-3.5 h-3.5', loadingFaces && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refresh
            </button>
          </div>

          <div v-if="loadingFaces && savedFaces.length === 0" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
          </div>

          <div v-else-if="savedFaces.length === 0" class="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
            <div class="w-12 h-12 mx-auto rounded-full bg-purple-50 flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <p class="text-xs font-semibold text-gray-600">No faces enrolled yet</p>
            <p class="text-[11px] text-gray-400 mt-1">Capture at least one face for biometric sign-in.</p>
          </div>

          <ul v-else class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            <li
              v-for="face in savedFaces"
              :key="face._id"
              class="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-200 transition"
            >
              <div class="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                <img v-if="face.photo" :src="face.photo" :alt="face.label" class="w-full h-full object-cover" />
                <span v-else>{{ (face.label || 'F').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-gray-900 truncate">{{ face.label || 'Face' }}</p>
                <p class="text-[10px] text-gray-400 font-medium">Enrolled {{ formatDate(face.created_at) }}</p>
              </div>
              <button
                @click="deleteFace(face)"
                :disabled="deletingId === face._id"
                class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition disabled:opacity-50 flex-shrink-0"
              >
                <svg v-if="deletingId === face._id" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span v-else>Remove</span>
              </button>
            </li>
          </ul>

          <div class="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3 leading-relaxed">
            <p class="font-bold text-gray-700 mb-1">How it works</p>
            Faces are processed in your browser using <strong>face-api.js</strong>. Only the 128-number descriptor and an optional thumbnail are saved to your admin profile — the live video never leaves your device.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildAPIUrl, getCollege } from '@/config/api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const MATCH_THRESHOLD = 0.5; // lower = stricter

let faceapiPromise = null;
function loadFaceApi() {
  if (!faceapiPromise) {
    faceapiPromise = import('face-api.js').then(m => m.default || m);
  }
  return faceapiPromise;
}

export default {
  name: 'FaceRecognitionSettings',
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
