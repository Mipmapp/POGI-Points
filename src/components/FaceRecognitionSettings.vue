<template>
  <div class="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden">
    <!-- Header -->
    <div class="px-5 sm:px-6 py-4 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8V6a2 2 0 012-2h2M3 16v2a2 2 0 002 2h2m10-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-sm sm:text-base font-extrabold leading-tight">Face ID — 3rd Login Verification</h3>
        <p class="text-[11px] sm:text-xs text-white/80 truncate">Enroll your face so the login flow asks for it after the verification code.</p>
      </div>
      <span :class="['px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0', faces.length ? 'bg-white text-ssaam-dark' : 'bg-white/15 text-white/80']">
        {{ faces.length }} enrolled
      </span>
    </div>

    <div class="p-4 sm:p-6 space-y-4">
      <!-- Status -->
      <div v-if="status" :class="['text-xs font-semibold rounded-xl px-3 py-2', statusKind === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : statusKind === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200']">
        {{ status }}
      </div>

      <!-- Camera + capture -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[4/3]">
          <video ref="videoEl" autoplay muted playsinline class="absolute inset-0 w-full h-full object-cover transform -scale-x-100"></video>
          <div v-if="!cameraOn" class="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
            Camera off
          </div>
          <div v-if="cameraOn && capturing" class="absolute inset-0 pointer-events-none">
            <div class="absolute inset-x-0 top-0 h-0.5 bg-ssaam-light shadow-[0_0_18px_4px_rgba(96,165,250,.7)] animate-[scan_1.6s_linear_infinite]"></div>
          </div>
          <span v-if="cameraOn" class="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">LIVE</span>
        </div>

        <div class="space-y-3">
          <div class="text-xs text-gray-600 leading-relaxed">
            <p class="mb-2">Position your face in the frame, then click <span class="font-bold">Capture & Enroll</span>. Add 1 to 3 angles for better recognition.</p>
            <ul class="space-y-1 text-[11px] text-gray-500">
              <li>• Good lighting, no glare on glasses</li>
              <li>• One person in frame</li>
              <li>• Face the camera straight on</li>
            </ul>
          </div>

          <div class="flex flex-wrap gap-2">
            <button v-if="!cameraOn" @click="startCamera" :disabled="loadingModels" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50">
              {{ loadingModels ? 'Loading models...' : 'Turn Camera On' }}
            </button>
            <button v-else @click="stopCamera" class="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition">
              Stop Camera
            </button>
            <button @click="captureAndEnroll" :disabled="!cameraOn || capturing || saving" class="flex-1 px-3 py-2 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5">
              <svg v-if="capturing || saving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {{ saving ? 'Saving...' : capturing ? 'Detecting...' : 'Capture & Enroll' }}
            </button>
          </div>

          <input v-model="newLabel" type="text" placeholder="Optional label (e.g. Glasses)" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
        </div>
      </div>

      <!-- Enrolled list -->
      <div>
        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Enrolled Faces</h4>
        <div v-if="loadingFaces" class="text-xs text-gray-400 py-3">Loading...</div>
        <div v-else-if="faces.length === 0" class="text-xs text-gray-400 py-3 px-3 bg-gray-50 rounded-xl">No faces enrolled yet. Capture one above to enable Step 3.</div>
        <div v-else class="space-y-2">
          <div v-for="f in faces" :key="f._id" class="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-2xl">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-ssaam-dark to-ssaam-light text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-800 truncate">{{ f.label || 'Face' }}</p>
              <p class="text-[11px] text-gray-500">Enrolled {{ formatDate(f.created_at) }}</p>
            </div>
            <button @click="deleteFace(f._id)" class="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-100">Remove</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildAPIUrl } from '../config/api.js';
import { ensureModelsLoaded, detectDescriptor } from '../utils/faceapi.js';

export default {
  name: 'FaceRecognitionSettings',
  emits: ['enrolled'],
  data() {
    return {
      faces: [],
      loadingFaces: false,
      loadingModels: false,
      cameraOn: false,
      stream: null,
      capturing: false,
      saving: false,
      status: '',
      statusKind: 'info',
      newLabel: '',
    };
  },
  mounted() { this.fetchFaces(); },
  beforeUnmount() { this.stopCamera(); },
  methods: {
    setStatus(message, kind = 'info') {
      this.status = message;
      this.statusKind = kind;
    },
    formatDate(d) {
      if (!d) return '';
      try { return new Date(d).toLocaleString(); } catch { return ''; }
    },
    authHeaders() {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || '';
      return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },
    async fetchFaces() {
      this.loadingFaces = true;
      try {
        const res = await fetch(buildAPIUrl('/apis/masters/face'), { headers: this.authHeaders() });
        if (res.ok) {
          const data = await res.json();
          this.faces = data.faces || [];
        }
      } catch (e) {
        this.setStatus('Could not load enrolled faces', 'error');
      } finally {
        this.loadingFaces = false;
      }
    },
    async startCamera() {
      try {
        this.loadingModels = true;
        await ensureModelsLoaded();
        this.loadingModels = false;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        this.stream = stream;
        const video = this.$refs.videoEl;
        video.srcObject = stream;
        await new Promise((resolve) => { video.onloadedmetadata = () => resolve(); });
        await video.play();
        this.cameraOn = true;
        this.setStatus('Camera ready. Position your face and press Capture.', 'info');
      } catch (e) {
        this.loadingModels = false;
        this.setStatus('Could not start camera: ' + (e.message || e), 'error');
      }
    },
    stopCamera() {
      try {
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
      } catch {}
      this.stream = null;
      this.cameraOn = false;
      const video = this.$refs.videoEl;
      if (video) video.srcObject = null;
    },
    async captureAndEnroll() {
      if (!this.cameraOn) {
        this.setStatus('Turn the camera on first.', 'error');
        return;
      }
      this.capturing = true;
      this.setStatus('Looking for your face...', 'info');
      try {
        const descriptor = await detectDescriptor(this.$refs.videoEl);
        if (!descriptor) {
          this.setStatus('No face detected. Adjust lighting and try again.', 'error');
          return;
        }
        this.saving = true;
        const res = await fetch(buildAPIUrl('/apis/masters/face'), {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ descriptor, label: this.newLabel.trim() || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Enrollment failed');
        this.setStatus('Face enrolled successfully ✓', 'success');
        this.newLabel = '';
        await this.fetchFaces();
        this.$emit('enrolled');
      } catch (e) {
        this.setStatus(e.message || String(e), 'error');
      } finally {
        this.capturing = false;
        this.saving = false;
      }
    },
    async deleteFace(faceId) {
      if (!confirm('Remove this enrolled face?')) return;
      try {
        const res = await fetch(buildAPIUrl(`/apis/masters/face/${faceId}`), {
          method: 'DELETE',
          headers: this.authHeaders(),
        });
        if (!res.ok) throw new Error('Delete failed');
        this.setStatus('Face removed', 'success');
        await this.fetchFaces();
      } catch (e) {
        this.setStatus(e.message || String(e), 'error');
      }
    },
  },
};
</script>

<style scoped>
@keyframes scan {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(100%); }
  100% { transform: translateY(0); }
}
</style>
