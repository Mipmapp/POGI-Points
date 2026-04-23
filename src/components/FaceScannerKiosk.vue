<template>
  <!-- Admin biometric kiosk scanner. Opens camera, runs continuous detection,
       and once a face is held in view consistently for ~1.2s, sends the 128-float
       descriptor to the backend for matching + check-in. Mirrors the visual
       language of the existing RFID kiosk so admins can swap modes intuitively.
       When `fullscreen` prop is true, the component renders in a dark-glass
       theme that fits inside the deep-navy fullscreen kiosk overlay. -->
  <div :class="fullscreen
    ? 'bg-transparent'
    : 'bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'">
    <!-- Header strip — hidden in fullscreen mode (the overlay supplies its own header). -->
    <div v-if="!fullscreen" class="relative px-5 sm:px-7 py-4 bg-gradient-to-r from-ssaam-dark via-blue-700 to-ssaam-light text-white">
      <div class="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      <div class="relative flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0"/>
            </svg>
          </div>
          <div class="min-w-0">
            <h3 class="text-base sm:text-lg font-extrabold tracking-tight truncate">Face ID Scanner</h3>
            <p class="text-xs text-white/80 truncate">Look at the camera to check in</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="cameraOn" class="text-[10px] font-bold text-white bg-emerald-500/90 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE
          </span>
          <span v-else class="text-[10px] font-bold text-white/90 bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">PAUSED</span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div :class="fullscreen ? 'p-0 space-y-3' : 'p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-5 gap-5'">
      <!-- ─── Camera viewport ─── -->
      <div :class="fullscreen ? 'space-y-3' : 'lg:col-span-3 space-y-3'">
        <div :class="['relative rounded-2xl overflow-hidden aspect-[4/3] shadow-inner',
          fullscreen
            ? 'bg-black/50 border-2 border-white/15 backdrop-blur-sm'
            : 'bg-gray-900 border-2 border-ssaam-dark/20']">
          <video
            ref="videoEl"
            autoplay muted playsinline
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 face-mirror"
            :class="cameraOn ? 'opacity-100' : 'opacity-0'"
          ></video>
          <canvas ref="overlayEl" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

          <!-- Scanline -->
          <div v-if="cameraOn && !sending && !lastResult" class="ssaam-scanline absolute left-0 right-0 h-[2px] bg-ssaam-light shadow-[0_0_12px_2px_rgba(79,98,255,0.7)] pointer-events-none"></div>

          <!-- Corner brackets -->
          <template v-if="cameraOn">
            <div class="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-ssaam-light rounded-tl"></div>
            <div class="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-ssaam-light rounded-tr"></div>
            <div class="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-ssaam-light rounded-bl"></div>
            <div class="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-ssaam-light rounded-br"></div>
          </template>

          <!-- Off state -->
          <div v-if="!cameraOn && !modelsLoading" class="absolute inset-0 flex flex-col items-center justify-center text-center text-white/80 p-6">
            <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </div>
            <p class="text-sm font-semibold">Scanner is paused</p>
            <p class="text-xs mt-1 max-w-[18rem] text-white/60">Press <span class="font-bold text-white">Start Scanner</span> to begin recognising faces.</p>
          </div>

          <!-- Loading models -->
          <div v-else-if="modelsLoading" class="absolute inset-0 flex flex-col items-center justify-center text-center text-white/90 p-6">
            <svg class="w-10 h-10 animate-spin mb-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <p class="text-sm font-semibold">Loading recognition models…</p>
          </div>

          <!-- Status pill -->
          <div v-if="cameraOn" class="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <span class="text-[10px] font-bold text-white bg-black/60 backdrop-blur px-3 py-1 rounded-full">{{ liveStatus }}</span>
          </div>

          <!-- Hold-progress ring -->
          <div v-if="cameraOn && !sending && !lastResult && holdProgress > 0" class="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <div class="h-1.5 w-32 bg-white/20 rounded-full overflow-hidden border border-white/20">
              <div class="h-full bg-emerald-400 transition-all duration-100" :style="{ width: holdProgress + '%' }"></div>
            </div>
          </div>

          <!-- Sending overlay -->
          <div v-if="sending" class="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm z-20">
            <div class="bg-white rounded-2xl px-6 py-5 flex items-center gap-3 shadow-2xl">
              <svg class="w-6 h-6 animate-spin text-ssaam-dark" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <p class="text-sm font-bold text-gray-800">Recognising…</p>
            </div>
          </div>

          <!-- Result overlay -->
          <Transition name="result-pop">
            <div v-if="lastResult" class="absolute inset-0 z-30 flex items-center justify-center p-4" :class="lastResult.success ? 'bg-emerald-600/85' : 'bg-red-600/85'">
              <div class="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 text-center max-w-sm w-full">
                <div :class="['w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3', lastResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">
                  <svg v-if="lastResult.success" class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  <svg v-else class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <div v-if="lastResult.success && lastResult.studentPhoto" class="w-20 h-20 mx-auto rounded-2xl overflow-hidden ring-4 ring-emerald-200 mb-3">
                  <img :src="lastResult.studentPhoto" :alt="lastResult.studentName" class="w-full h-full object-cover" />
                </div>
                <p :class="['text-base font-extrabold mb-1', lastResult.success ? 'text-emerald-800' : 'text-red-800']">{{ lastResult.title }}</p>
                <p class="text-sm text-gray-700 font-semibold">{{ lastResult.studentName || lastResult.message }}</p>
                <p v-if="lastResult.studentMeta" class="text-xs text-gray-500 mt-0.5">{{ lastResult.studentMeta }}</p>
                <p v-if="lastResult.subtitle" class="text-xs text-gray-500 mt-2">{{ lastResult.subtitle }}</p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Controls -->
        <div class="flex flex-wrap gap-2">
          <button
            v-if="!cameraOn"
            @click="startCamera"
            :disabled="modelsLoading"
            class="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-ssaam-dark to-ssaam-light"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Start Scanner
          </button>
          <button
            v-else
            @click="stopCamera"
            :class="['flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition flex items-center justify-center gap-2',
              fullscreen
                ? 'bg-white/10 border border-white/25 text-white hover:bg-white/20 backdrop-blur'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50']"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Pause
          </button>
          <button
            v-if="lastResult"
            @click="clearResult"
            :class="['flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition flex items-center justify-center gap-2',
              fullscreen
                ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur'
                : 'bg-ssaam-dark/10 text-ssaam-dark hover:bg-ssaam-dark/20']"
          >
            Scan Next
          </button>
        </div>

        <p v-if="loadError" :class="['text-xs font-medium rounded-xl px-3 py-2',
          fullscreen
            ? 'bg-red-500/15 text-red-200 border border-red-400/40'
            : 'bg-red-50 text-red-700 border border-red-200']">{{ loadError }}</p>
      </div>

      <!-- ─── Sidebar info ─── (hidden in fullscreen — overlay supplies its own info) -->
      <div v-if="!fullscreen" class="lg:col-span-2 space-y-3">
        <div class="rounded-2xl border border-ssaam-dark/15 bg-ssaam-dark/5 p-4">
          <p class="text-[10px] font-bold uppercase tracking-widest text-ssaam-dark mb-1">Active Session</p>
          <p class="text-sm font-extrabold text-gray-900 truncate">{{ sessionLabel || 'No session selected' }}</p>
          <p v-if="sessionMeta" class="text-xs text-gray-600 mt-0.5 truncate">{{ sessionMeta }}</p>
          <div v-if="checkOutMode" class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            CHECK-OUT MODE
          </div>
          <div v-else class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            CHECK-IN MODE
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-4">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Recent Recognitions</p>
          <div v-if="recent.length === 0" class="text-xs text-gray-400 italic">Nothing yet — start the scanner.</div>
          <ul v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
            <li v-for="(r, i) in recent" :key="i" class="flex items-center gap-2.5 p-2 rounded-xl border border-gray-100 bg-gray-50">
              <div :class="['w-2 h-2 rounded-full flex-shrink-0', r.success ? 'bg-emerald-500' : 'bg-red-500']"></div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-gray-800 truncate">{{ r.studentName || 'Unrecognised' }}</p>
                <p class="text-[10px] text-gray-500">{{ r.timeLabel }}</p>
              </div>
              <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded', r.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">
                {{ r.success ? (r.action === 'check-out' ? 'OUT' : 'IN') : 'FAIL' }}
              </span>
            </li>
          </ul>
        </div>

        <div class="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-3 leading-relaxed">
          <p class="font-bold text-ssaam-dark mb-1">How it works</p>
          Hold steady in front of the camera. After a brief moment of recognition, the system will automatically check the matching student in or out. Students must enroll their face in their profile first.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildAPIUrl, getCollege } from '@/config/api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const HOLD_DURATION_MS = 1200; // how long the face must be visible before sending
const COOLDOWN_MS = 4000;       // gap between successful recognitions

let faceapiPromise = null;
function loadFaceApi() {
  if (!faceapiPromise) {
    faceapiPromise = import('face-api.js').then(m => m.default || m);
  }
  return faceapiPromise;
}

export default {
  name: 'FaceScannerKiosk',
  props: {
    sessionId: { type: String, default: '' },
    sessionLabel: { type: String, default: '' },
    sessionMeta: { type: String, default: '' },
    checkOutMode: { type: Boolean, default: false },
    // When true, the component drops its own card chrome and renders with a
    // dark-glass theme so it slots cleanly inside the fullscreen overlay.
    fullscreen: { type: Boolean, default: false },
  },
  emits: ['recognized'],
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

      holdStartTs: 0,
      holdProgress: 0,
      cooldownUntil: 0,

      sending: false,
      lastResult: null,
      lastResultTimer: null,
      recent: [],
    };
  },
  watch: {
    sessionId() { this.clearResult(); },
  },
  beforeUnmount() {
    this.stopCamera();
    if (this.lastResultTimer) clearTimeout(this.lastResultTimer);
  },
  methods: {
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
        this.loadError = 'Could not load face recognition models. Check your network and try again.';
      } finally {
        this.modelsLoading = false;
      }
    },
    async startCamera() {
      if (!this.sessionId) {
        this.loadError = 'Pick an active session first.';
        return;
      }
      if (!this.modelsReady) await this.bootstrapModels();
      if (!this.modelsReady) return;
      this.loadError = '';
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 540 } },
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
      if (this.detectLoopId) { cancelAnimationFrame(this.detectLoopId); this.detectLoopId = null; }
      if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
      const video = this.$refs.videoEl; if (video) video.srcObject = null;
      const canvas = this.$refs.overlayEl;
      if (canvas) { const ctx = canvas.getContext('2d'); ctx && ctx.clearRect(0, 0, canvas.width, canvas.height); }
      this.lastDetection = null;
      this.holdStartTs = 0;
      this.holdProgress = 0;
      this.liveStatus = 'Scanner paused';
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

        const now = Date.now();
        const inCooldown = now < this.cooldownUntil;

        if (detection && !inCooldown && !this.sending && !this.lastResult) {
          this.lastDetection = detection;
          const box = detection.detection.box;
          const sx = w / video.videoWidth, sy = h / video.videoHeight;
          const bw = box.width * sx;
          const bx = w - (box.x + box.width) * sx;

          // Track hold duration
          if (!this.holdStartTs) this.holdStartTs = now;
          const elapsed = now - this.holdStartTs;
          this.holdProgress = Math.min(100, Math.round((elapsed / HOLD_DURATION_MS) * 100));
          this.liveStatus = elapsed >= HOLD_DURATION_MS ? 'Recognising…' : 'Hold steady…';

          // Box colour transitions to green as hold completes
          const ratio = this.holdProgress / 100;
          const r = Math.round(168 + (16 - 168) * ratio);
          const g = Math.round(85 + (185 - 85) * ratio);
          const b = Math.round(247 + (129 - 247) * ratio);
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(bx, box.y * sy, bw, box.height * sy);

          if (elapsed >= HOLD_DURATION_MS) {
            // fire and forget; submitFace handles its own state
            this.holdStartTs = 0;
            this.holdProgress = 0;
            this.submitFace(detection);
          }
        } else {
          this.lastDetection = null;
          if (!inCooldown && !this.sending && !this.lastResult) {
            this.holdStartTs = 0;
            this.holdProgress = 0;
            this.liveStatus = 'Looking for face…';
          }
        }
      } catch (_) { /* transient */ }

      this.detectLoopId = requestAnimationFrame(() => this.runDetectionLoop());
    },
    async submitFace(detection) {
      if (this.sending) return;
      this.sending = true;
      try {
        const descriptor = Array.from(detection.descriptor);
        const res = await fetch(buildAPIUrl(`/apis/attendance/sessions/${this.sessionId}/check-face`), {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ descriptor }),
        });
        const data = await res.json().catch(() => ({}));
        const now = new Date();
        const timeLabel = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

        if (res.ok && (data.success || data.message)) {
          const studentName = data.student?.full_name || data.student_name || 'Student';
          const meta = [data.student?.program, data.student?.year_level].filter(Boolean).join(' · ');
          const action = data.action || (data.checkout_at ? 'check-out' : 'check-in');
          this.lastResult = {
            success: true,
            title: action === 'check-out' ? 'Checked Out' : 'Checked In',
            studentName,
            studentMeta: meta || (data.student?.student_id ? `ID: ${data.student.student_id}` : ''),
            studentPhoto: data.student?.photo || null,
            subtitle: data.message || '',
            action,
          };
          this.recent.unshift({ success: true, studentName, action, timeLabel });
        } else if (res.status === 404 && data.no_match) {
          this.lastResult = {
            success: false,
            title: 'No Match',
            studentName: '',
            studentMeta: '',
            subtitle: data.message || 'No matching face found.',
          };
          this.recent.unshift({ success: false, studentName: 'Unrecognised', timeLabel });
        } else {
          this.lastResult = {
            success: false,
            title: 'Could Not Check In',
            studentName: data.student?.full_name || '',
            studentMeta: '',
            subtitle: data.message || `Server returned ${res.status}.`,
          };
          this.recent.unshift({ success: false, studentName: data.student?.full_name || 'Error', timeLabel });
        }
        this.recent = this.recent.slice(0, 8);
        this.$emit('recognized', this.lastResult);
      } catch (err) {
        this.lastResult = {
          success: false,
          title: 'Network Error',
          studentName: '',
          subtitle: err.message || 'Could not contact server.',
        };
      } finally {
        this.sending = false;
        this.cooldownUntil = Date.now() + COOLDOWN_MS;
        if (this.lastResultTimer) clearTimeout(this.lastResultTimer);
        this.lastResultTimer = setTimeout(() => { this.lastResult = null; }, COOLDOWN_MS);
      }
    },
    clearResult() {
      this.lastResult = null;
      if (this.lastResultTimer) { clearTimeout(this.lastResultTimer); this.lastResultTimer = null; }
      this.cooldownUntil = 0;
      this.holdStartTs = 0;
      this.holdProgress = 0;
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
.result-pop-enter-active { animation: result-pop 0.25s cubic-bezier(0.2, 0.9, 0.2, 1) both; }
.result-pop-leave-active { animation: result-pop reverse 0.18s ease both; }
@keyframes result-pop {
  0%   { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1);    opacity: 1; }
}
</style>
