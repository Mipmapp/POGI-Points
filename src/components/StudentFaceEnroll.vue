<template>
  <!-- Backdrop fade -->
  <Transition name="face-backdrop">
    <div v-if="open" class="face-modal-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040820]/70 backdrop-blur-md" @click.self="closeIfIdle">
      <!-- Modal pop -->
      <Transition name="face-modal" appear>
        <div v-if="open" :class="['face-modal-shell relative w-full max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-gradient-to-b from-[#080e2e] to-[#0f1f6e] text-white', tncAgreed ? 'max-w-lg md:max-w-4xl lg:max-w-5xl' : 'max-w-lg']">
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

            <!-- Terms & Conditions gate (must be accepted before camera starts) -->
            <div v-if="!tncAgreed" class="flex-1 flex flex-col overflow-hidden">
              <!-- Header area (fixed) -->
              <div class="px-4 pt-4 pb-2 flex-shrink-0">
                <div class="flex items-center gap-2 mb-1">
                  <svg class="w-5 h-5 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <h4 class="text-sm font-bold text-white">Face ID — Terms &amp; Privacy</h4>
                </div>
                <p class="text-[11px] text-white/65 leading-snug">Please read and agree before we set up your Face ID.</p>
              </div>

              <!-- Scrollable T&C text (only this area scrolls) -->
              <div ref="tncScrollEl" @scroll="onTncScroll"
                class="flex-1 overflow-y-auto face-modal-scroll mx-4 rounded-xl bg-black/20 border border-white/10 p-3 text-[11px] text-white/85 space-y-2 leading-relaxed min-h-0">
                <p class="font-semibold text-white text-xs">1. What we collect</p>
                <p>SSAAM extracts a mathematical face template (a numeric descriptor) from samples taken by your camera. We also store one preview photo so you can recognise yourself in the system.</p>

                <p class="font-semibold text-white text-xs pt-1">2. How we use it</p>
                <p>Your face template is used <strong>only</strong> to verify your identity when you mark your own attendance. It is never shared with other students, never sold, and never used for advertising or surveillance outside of attendance.</p>

                <p class="font-semibold text-white text-xs pt-1">3. Your responsibility</p>
                <p>You must enrol your <strong>own face</strong>. Enrolling someone else's face, or letting another person use your Face ID to mark attendance, is treated as proxy attendance and may lead to disciplinary action under CCS rules.</p>

                <p class="font-semibold text-white text-xs pt-1">4. Updating &amp; removing</p>
                <p>You can update your Face ID once every {{ cooldownDays }} days from this same screen. To remove your Face ID entirely, contact your college admin.</p>

                <p class="font-semibold text-white text-xs pt-1">5. Camera &amp; on-device processing</p>
                <p>The camera turns on only after you tap <em>Agree &amp; Continue</em>. Face detection runs in your browser; only the final descriptor and preview photo are sent to the SSAAM server when you confirm.</p>

                <p class="text-white/50 italic pt-1">Scroll to the bottom to enable the agreement checkbox.</p>
              </div>

              <!-- Checkbox + buttons (always visible, never scrolls) -->
              <div class="flex-shrink-0 px-4 pt-3 pb-4 space-y-3">
                <label :class="['flex items-start gap-3 p-3 rounded-xl border transition-all select-none', tncReadToBottom ? 'border-emerald-300/40 bg-emerald-400/10 cursor-pointer hover:bg-emerald-400/15' : 'border-white/10 bg-white/5 opacity-60 cursor-not-allowed']">
                  <input type="checkbox" v-model="tncCheckbox" :disabled="!tncReadToBottom"
                    class="mt-0.5 w-4 h-4 rounded accent-emerald-400 cursor-pointer disabled:cursor-not-allowed flex-shrink-0" />
                  <span class="text-[11px] text-white/90 leading-relaxed">
                    I have read and agree to the SSAAM Face ID terms above. The face I am about to enrol is <strong>my own</strong>.
                  </span>
                </label>

                <div class="flex gap-3">
                  <button @click="emit('close')" type="button"
                    class="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/15 hover:border-white/25 transition-all active:scale-[0.98]">
                    Cancel
                  </button>
                  <button @click="agreeAndContinue" type="button" :disabled="!tncCheckbox"
                    :class="['face-cta-btn group relative flex-1 py-3 rounded-xl font-semibold text-sm text-white border overflow-hidden transition-all active:scale-95 shadow-lg', tncCheckbox ? 'border-emerald-400/50 bg-emerald-500/30 hover:bg-emerald-500/45 shadow-emerald-500/20 hover:-translate-y-0.5' : 'border-white/15 bg-white/10 opacity-50 cursor-not-allowed']">
                    <span v-if="tncCheckbox" class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"></span>
                    <span class="relative flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      Agree
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Scanner body: two-column on md+, stacked on mobile. No scrollbars. -->
            <div v-else class="flex-1 min-h-0 p-4 face-modal-body md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-4 md:items-stretch flex flex-col gap-3">

              <!-- Cooldown banner (spans both columns) -->
              <div v-if="cooldownActive"
                class="md:col-span-2 flex items-start gap-3 text-sm rounded-2xl px-4 py-3 border border-amber-300/30 bg-amber-400/10 text-amber-100">
                <svg class="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                <div>
                  <p class="font-semibold text-amber-200 text-sm">Locked until {{ formatDate(nextUpdateAllowedAt) }}</p>
                  <p class="text-xs text-amber-100/70 mt-0.5">Face ID can only be changed once every {{ cooldownDays }} days.</p>
                </div>
              </div>

              <!-- LEFT: Camera -->
              <div class="md:flex md:flex-col md:min-h-0 flex flex-col min-h-0">
                <!-- Camera frame with glowing border -->
                <div :class="['relative bg-black rounded-2xl overflow-hidden flex-1 flex items-center justify-center shadow-2xl transition-all duration-500 face-camera-frame',
                  faceLocked ? 'ring-2 ring-emerald-400/70 shadow-emerald-500/20' : faceDetected ? 'ring-2 ring-amber-400/60 shadow-amber-500/10' : 'ring-1 ring-white/10',
                  'aspect-[4/3] md:aspect-auto md:min-h-[20rem]']">

                  <video ref="videoEl" autoplay muted playsinline
                    :class="['w-full h-full object-cover transition-opacity duration-500', cameraReady ? 'opacity-100' : 'opacity-0']"
                    style="transform: scaleX(-1);" />

                  <!-- Vignette for depth -->
                  <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at center, transparent 40%, rgba(4,8,32,0.55) 100%);"></div>

                  <!-- Loading overlay -->
                  <Transition name="face-fade">
                    <div v-if="!cameraReady" class="absolute inset-0 flex flex-col items-center justify-center text-white bg-[#040820]/70 backdrop-blur-sm gap-3">
                      <div class="relative w-12 h-12">
                        <svg class="animate-spin w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg>
                        <svg class="animate-spin w-12 h-12 text-white absolute inset-0" style="animation-duration:1s" fill="none" viewBox="0 0 24 24"><path fill="currentColor" opacity="0.8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      </div>
                      <span class="text-sm text-white/80 font-medium">{{ camStatus }}</span>
                    </div>
                  </Transition>

                  <!-- Face outline + scan line -->
                  <div v-if="cameraReady" class="absolute inset-0 pointer-events-none">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
                      <!-- Animated face-shape guide (wider cranium, tapered chin) -->
                      <path
                        d="M50,17 C61,17 71,24 72.5,37 C74,50 68,63 62,69 C58,73 54,77 50,79 C46,77 42,73 38,69 C32,63 26,50 27.5,37 C29,24 39,17 50,17 Z"
                        fill="none"
                        :stroke="faceLocked ? '#34d399' : (faceDetected ? '#fbbf24' : 'rgba(255,255,255,0.5)')"
                        :stroke-width="faceLocked ? '0.7' : '0.5'"
                        stroke-dasharray="2.5 1.5"
                        stroke-linecap="round">
                        <animate attributeName="stroke-dashoffset" from="0" to="18" dur="2.5s" repeatCount="indefinite"/>
                      </path>
                      <!-- Glow halo when locked -->
                      <path v-if="faceLocked"
                        d="M50,17 C61,17 71,24 72.5,37 C74,50 68,63 62,69 C58,73 54,77 50,79 C46,77 42,73 38,69 C32,63 26,50 27.5,37 C29,24 39,17 50,17 Z"
                        fill="none" stroke="#34d399" stroke-width="0.4" opacity="0.3"/>
                    </svg>

                    <!-- Scanning line animation when capturing -->
                    <div v-if="capturing" class="face-scan-line absolute inset-x-[18%]" style="top:20%; height:60%;"></div>

                    <!-- Corner brackets — larger, more prominent -->
                    <div class="absolute top-3 left-3 w-6 h-6 border-t-[2.5px] border-l-[2.5px] border-white/70 rounded-tl-lg"></div>
                    <div class="absolute top-3 right-3 w-6 h-6 border-t-[2.5px] border-r-[2.5px] border-white/70 rounded-tr-lg"></div>
                    <div class="absolute bottom-3 left-3 w-6 h-6 border-b-[2.5px] border-l-[2.5px] border-white/70 rounded-bl-lg"></div>
                    <div class="absolute bottom-3 right-3 w-6 h-6 border-b-[2.5px] border-r-[2.5px] border-white/70 rounded-br-lg"></div>
                  </div>

                  <!-- Status pill -->
                  <Transition name="face-fade">
                    <div v-if="cameraReady" class="absolute top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border"
                      :class="faceLocked ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : faceDetected ? 'bg-amber-500/20 border-amber-400/40 text-amber-200' : 'bg-black/50 border-white/15 text-white'">
                      <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', faceLocked ? 'bg-emerald-400 animate-ping-once-slow' : faceDetected ? 'bg-amber-400 animate-pulse' : 'bg-white/50 animate-pulse']"></span>
                      {{ faceLocked ? 'Face locked' : faceDetected ? 'Face detected' : 'Searching…' }}
                    </div>
                  </Transition>

                  <!-- Progress bar (capturing) -->
                  <div v-if="capturing" class="absolute bottom-0 inset-x-0 h-1.5">
                    <div class="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-200 shadow-lg shadow-emerald-400/40" :style="{ width: progressPct + '%' }"></div>
                  </div>

                  <!-- Capture flash -->
                  <Transition name="face-flash">
                    <div v-if="captureFlash" class="absolute inset-0 bg-white pointer-events-none"></div>
                  </Transition>

                  <!-- Confirm overlay -->
                  <Transition name="face-confirm">
                    <div v-if="showConfirmDialog" class="absolute inset-0 bg-[#040820]/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 p-5">
                      <div class="relative">
                        <div class="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-emerald-400/70 shadow-2xl shadow-emerald-500/40">
                          <img v-if="confirmedPhoto" :src="confirmedPhoto" class="w-full h-full object-cover" alt="Captured face" />
                          <div v-else class="w-full h-full bg-white/10 flex items-center justify-center">
                            <svg class="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                          </div>
                        </div>
                        <!-- checkmark badge -->
                        <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-[#080e2e] flex items-center justify-center shadow-lg">
                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                      </div>
                      <div class="text-center">
                        <p class="text-white font-bold text-sm">Does this look like you?</p>
                        <p class="text-white/50 text-xs mt-1">Confirm to save or retake.</p>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- RIGHT: Status + tips + actions -->
              <div class="flex flex-col gap-3 md:min-h-0 min-h-0">

                <!-- Stage banner -->
                <Transition name="face-stage" mode="out-in">
                  <div v-if="!cooldownActive" :key="stageMessage"
                    :class="['rounded-2xl px-4 py-3 border backdrop-blur-sm flex items-start gap-3', stageStyle.bg, stageStyle.border, stageStyle.text]">
                    <span :class="['w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1', stageStyle.dot]"></span>
                    <div class="min-w-0">
                      <p class="font-bold text-sm leading-tight">{{ stageMessage }}</p>
                      <p v-if="stageHint" class="text-xs opacity-70 mt-1 leading-relaxed">{{ stageHint }}</p>
                    </div>
                  </div>
                </Transition>

                <!-- Tips carousel -->
                <div class="flex-1 min-h-0 relative rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex flex-col justify-between" :class="['border-l-4', accentBorderL]">
                  <Transition name="face-tip" mode="out-in">
                    <div :key="activeTipIndex" class="flex items-start gap-2.5">
                      <div class="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg class="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <span class="text-xs text-white/80 leading-relaxed">{{ tips[activeTipIndex] }}</span>
                    </div>
                  </Transition>
                  <div class="flex justify-center gap-2 mt-3">
                    <button
                      v-for="(_, i) in tips" :key="i"
                      type="button"
                      @click="activeTipIndex = i"
                      :class="['h-1.5 rounded-full transition-all duration-300', i === activeTipIndex ? 'w-6 bg-white/80' : 'w-1.5 bg-white/25 hover:bg-white/45']"
                      :aria-label="`Tip ${i + 1}`" />
                  </div>
                </div>

                <!-- Error -->
                <Transition name="face-stage">
                  <div v-if="errorMessage" class="flex items-start gap-2.5 text-sm rounded-2xl px-4 py-3 border border-red-300/30 bg-red-500/12 text-red-100">
                    <svg class="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    <span class="text-xs leading-relaxed">{{ errorMessage }}</span>
                  </div>
                </Transition>

                <!-- Actions -->
                <div v-if="!showConfirmDialog" class="flex gap-2.5 mt-auto">
                  <button @click="closeIfIdle" :disabled="capturing || submitting"
                    class="flex-1 py-3 rounded-2xl bg-white/8 border border-white/12 text-white text-sm font-semibold hover:bg-white/14 hover:border-white/22 disabled:opacity-40 transition-all active:scale-[0.98]">
                    Cancel
                  </button>
                </div>
                <div v-else class="flex gap-2.5 mt-auto">
                  <button @click="retakeCapture" :disabled="submitting"
                    class="flex-1 py-3 rounded-2xl bg-white/8 border border-white/12 text-white text-sm font-semibold hover:bg-white/14 hover:border-white/22 disabled:opacity-40 transition-all active:scale-[0.98]">
                    Retake
                  </button>
                  <button @click="confirmEnrollment" :disabled="submitting"
                    class="face-cta-btn group relative flex-1 py-3 rounded-2xl text-sm font-bold text-white border border-emerald-400/40 bg-emerald-500/25 hover:bg-emerald-500/40 disabled:opacity-40 overflow-hidden transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                    <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></span>
                    <svg v-if="submitting" class="w-4 h-4 animate-spin flex-shrink-0 relative" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    <svg v-else class="w-4 h-4 flex-shrink-0 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span class="relative">{{ submitting ? 'Saving…' : 'Confirm' }}</span>
                  </button>
                </div>
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

// Terms & Conditions gate (must be agreed before camera starts)
const TNC_STORAGE_KEY = 'ssaam_face_tnc_agreed_v1'
const tncAgreed = ref(typeof localStorage !== 'undefined' && localStorage.getItem(TNC_STORAGE_KEY) === '1')
const tncCheckbox = ref(false)
const tncReadToBottom = ref(false)
const tncScrollEl = ref(null)

function onTncScroll(e) {
  const el = e && e.target
  if (!el) return
  // Mark as fully read when user scrolls within 12px of the bottom
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) {
    tncReadToBottom.value = true
  }
}

async function agreeAndContinue() {
  if (!tncCheckbox.value) return
  try { localStorage.setItem(TNC_STORAGE_KEY, '1') } catch {}
  tncAgreed.value = true
  // Now that the user has agreed, open the camera if the modal is still open
  if (props.open) await openCamera()
}

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

// Auto-capture countdown — short, 2-second steady countdown so the user
// barely has time to drift before sampling begins.
let autoStartHandle = null
const autoCountdown = ref(0)  // counts down 2→0 before auto-capturing
const AUTO_COUNTDOWN_START = 2     // seconds of steady detection required
const AUTO_COUNTDOWN_INTERVAL = 1000  // ms between ticks (1 per second)

// Face placement feedback — true when a face is detected but it's too far
// from the camera (small bounding box). Used to nudge "Get closer".
const faceTooFar = ref(false)
// True when face is detected but its center sits clearly outside the oval
// region (~22% × 30% radius around 50/48). Nudges the user to recenter.
const faceOffCenter = ref(false)

// Tips carousel — short, scannable, one at a time.
const tips = [
  'Hold your phone or laptop at eye level in good light.',
  'Look straight at the camera, no sunglasses or mask.',
  'Only your own face — your registration must be unique among students.'
]
const activeTipIndex = ref(0)
let tipsCycleHandle = null
function startTipsCycle() {
  stopTipsCycle()
  tipsCycleHandle = setInterval(() => {
    activeTipIndex.value = (activeTipIndex.value + 1) % tips.length
  }, 4000)
}
function stopTipsCycle() {
  if (tipsCycleHandle) { clearInterval(tipsCycleHandle); tipsCycleHandle = null }
}

// Confirm stage after samples collected
const showConfirmDialog = ref(false)
const confirmedDescriptor = ref(null)
const confirmedPhoto = ref(null)
const submitting = ref(false)

const TARGET_SAMPLES = 20
const progressPct = computed(() => Math.min(100, (capturedSamples.value / TARGET_SAMPLES) * 100))

const stageStyle = computed(() => {
  if (showConfirmDialog.value) return {
    bg: 'bg-violet-400/15', border: 'border-violet-300/40', text: 'text-violet-100', dot: 'bg-violet-300 animate-pulse'
  }
  if (capturing.value) return {
    bg: 'bg-emerald-400/15', border: 'border-emerald-300/40', text: 'text-emerald-100', dot: 'bg-emerald-300 animate-pulse'
  }
  if (autoCountdown.value > 0) return {
    bg: 'bg-amber-400/15', border: 'border-amber-300/40', text: 'text-amber-100', dot: 'bg-amber-300 animate-ping'
  }
  if (faceDetected.value) return {
    bg: 'bg-blue-400/15', border: 'border-blue-300/40', text: 'text-blue-100', dot: 'bg-blue-300 animate-pulse'
  }
  return { bg: 'bg-white/10', border: 'border-white/15', text: 'text-white/85', dot: 'bg-white/60' }
})
const stageMessage = computed(() => {
  if (showConfirmDialog.value) return 'Capture complete — confirm your Face ID'
  if (capturing.value) return 'Hold still — capturing your face'
  if (autoCountdown.value > 0) return `Auto-capturing in ${autoCountdown.value}…`
  if (faceTooFar.value) return 'Get closer to the camera'
  if (faceOffCenter.value) return 'Center your face inside the oval'
  if (faceDetected.value) return 'Face detected — auto-capturing soon'
  if (cameraReady.value) return 'Position your face inside the oval'
  return 'Setting up your camera'
})
const stageHint = computed(() => {
  if (showConfirmDialog.value) return 'Review the preview below — confirm to save or retake to try again.'
  if (capturing.value) return `Sampling ${TARGET_SAMPLES} frames to build a strong template`
  if (autoCountdown.value > 0) return 'Stay still — capture will begin automatically'
  if (faceTooFar.value) return 'Move closer so your face fills most of the oval — this ensures a clear, accurate capture.'
  if (faceOffCenter.value) return 'Slide your face so it sits right inside the oval guide.'
  return ''
})

function formatDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return String(d) }
}

watch(() => props.open, async (val) => {
  if (val) {
    // Reset checkbox each time the modal opens so users explicitly re-confirm
    tncCheckbox.value = false
    tncReadToBottom.value = false
    activeTipIndex.value = 0
    startTipsCycle()
    if (tncAgreed.value) {
      await openCamera()
    }
    // If not yet agreed, the T&C gate is shown and the camera waits for agreeAndContinue()
  } else {
    stopTipsCycle()
    stopCamera()
  }
})

async function openCamera() {
  errorMessage.value = ''
  cameraReady.value = false
  faceDetected.value = false
  faceLocked.value = false
  capturing.value = false
  capturedSamples.value = 0
  collectedDescriptors.value = []
  showConfirmDialog.value = false
  confirmedDescriptor.value = null
  confirmedPhoto.value = null
  autoCountdown.value = 0
  if (autoStartHandle) { clearTimeout(autoStartHandle); autoStartHandle = null }

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
  if (autoStartHandle) {
    clearTimeout(autoStartHandle)
    autoStartHandle = null
  }
  autoCountdown.value = 0
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
  if (videoEl.value) videoEl.value.srcObject = null
}

async function runDetectionLoop() {
  if (!cameraReady.value || !videoEl.value || showConfirmDialog.value) return
  try {
    const fa = await getFaceApi()
    const det = await fa
      .detectSingleFace(videoEl.value, new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.6 }))
      .withFaceLandmarks(true)
      .withFaceDescriptor()

    const hasFace = !!det && det.detection && det.detection.score > 0.72
    let wellPlaced = false
    let tooFar = false
    let offCenter = false

    if (hasFace) {
      // Compare the detection box against the camera frame to decide whether
      // the user is far enough / centered enough for a clean capture. The
      // oval guide spans roughly 44% × 60% of the frame (rx=22, ry=30 in a
      // 100×100 viewBox centered at 50,48), so we mirror those bounds here.
      const v = videoEl.value
      const vw = v.videoWidth || 1
      const vh = v.videoHeight || 1
      const box = det.detection.box
      const faceFracW = box.width / vw
      const cx = (box.x + box.width / 2) / vw
      const cy = (box.y + box.height / 2) / vh
      // Mirror the video horizontally (the preview uses scaleX(-1)) so the
      // off-center check matches what the user actually sees.
      const cxMirrored = 1 - cx

      // "Too far" when the face takes up less than ~28% of the frame width.
      // Raised from 0.22 → 0.28 so only close, well-lit captures are accepted,
      // producing a higher-quality descriptor that is less prone to false matches.
      tooFar = faceFracW < 0.28
      // "Off center" when the face center sits well outside the oval region.
      offCenter = Math.abs(cxMirrored - 0.5) > 0.18 || Math.abs(cy - 0.48) > 0.22

      wellPlaced = !tooFar && !offCenter
    }

    faceDetected.value = hasFace
    faceTooFar.value = hasFace && tooFar
    faceOffCenter.value = hasFace && !tooFar && offCenter

    if (hasFace && wellPlaced) {
      faceLocked.value = true
      if (capturing.value && det.descriptor && capturedSamples.value < TARGET_SAMPLES) {
        collectedDescriptors.value.push({
          descriptor: Array.from(det.descriptor),
          score: det.detection.score,
          snapshot: capturedSamples.value === 0 ? snapshotFace(det.detection.box) : null
        })
        capturedSamples.value++
        if (capturedSamples.value === 1) {
          captureFlash.value = true
          setTimeout(() => { captureFlash.value = false }, 180)
        }
        if (capturedSamples.value >= TARGET_SAMPLES) {
          await finishCapture()
          return
        }
      } else if (!capturing.value && !autoStartHandle && !props.cooldownActive) {
        // Auto-start a 2-second steady countdown once the face is well placed.
        // One tick per second so the on-screen number visibly counts down.
        let count = AUTO_COUNTDOWN_START
        autoCountdown.value = count
        const tick = () => {
          count--
          autoCountdown.value = count
          if (count <= 0) {
            autoStartHandle = null
            autoCountdown.value = 0
            if (faceDetected.value && !faceTooFar.value && !faceOffCenter.value && !capturing.value && !showConfirmDialog.value) {
              startCapture()
            }
          } else {
            autoStartHandle = setTimeout(tick, AUTO_COUNTDOWN_INTERVAL)
          }
        }
        autoStartHandle = setTimeout(tick, AUTO_COUNTDOWN_INTERVAL)
      }
    } else {
      faceLocked.value = false
      // Cancel auto-start if face lost OR placement broke (too far / off center)
      if (autoStartHandle) {
        clearTimeout(autoStartHandle)
        autoStartHandle = null
        autoCountdown.value = 0
      }
    }
  } catch (err) {
    console.warn('[FaceEnroll] detect error', err)
  }
  if (cameraReady.value && !showConfirmDialog.value) {
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
  // Keep only high-confidence frames (score > 0.80), then take the top 12 by
  // score. Using fewer but higher-quality frames produces a tighter, more
  // distinctive average descriptor — significantly reducing false "already
  // registered" rejections caused by noisy low-confidence samples drifting
  // the average toward another student's descriptor.
  const highQuality = collectedDescriptors.value.filter(s => s.score > 0.80)
  const pool = highQuality.length >= 5 ? highQuality : collectedDescriptors.value
  const top = [...pool]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(12, pool.length))
  if (!top.length) {
    errorMessage.value = 'Capture failed — please try again with better lighting.'
    return
  }
  const avg = new Array(128).fill(0)
  for (const t of top) for (let i = 0; i < 128; i++) avg[i] += t.descriptor[i]
  for (let i = 0; i < 128; i++) avg[i] /= top.length

  const photo = collectedDescriptors.value.find(s => s.snapshot)?.snapshot || null

  confirmedDescriptor.value = avg
  confirmedPhoto.value = photo
  showConfirmDialog.value = true
}

async function confirmEnrollment() {
  if (!confirmedDescriptor.value) return
  await submitEnrollment(confirmedDescriptor.value, confirmedPhoto.value)
}

function retakeCapture() {
  showConfirmDialog.value = false
  confirmedDescriptor.value = null
  confirmedPhoto.value = null
  capturedSamples.value = 0
  collectedDescriptors.value = []
  errorMessage.value = ''
  autoCountdown.value = 0
  if (autoStartHandle) { clearTimeout(autoStartHandle); autoStartHandle = null }
  if (cameraReady.value) runDetectionLoop()
}

async function submitEnrollment(descriptor, photo) {
  errorMessage.value = ''
  submitting.value = true
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
      showConfirmDialog.value = false
    }
  } catch (err) {
    console.error('[FaceEnroll] submit error', err)
    errorMessage.value = 'Network error. Please check your connection and try again.'
    showConfirmDialog.value = false
  } finally {
    submitting.value = false
  }
}

function closeIfIdle() {
  if (capturing.value || submitting.value) return
  stopCamera()
  showConfirmDialog.value = false
  emit('close')
}

onBeforeUnmount(() => { stopTipsCycle(); stopCamera() })
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
.face-confirm-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.face-confirm-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.face-confirm-enter-from { opacity: 0; transform: scale(0.96); }
.face-confirm-leave-to { opacity: 0; transform: scale(0.96); }

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

/* Custom scrollbar — only used inside the T&C section now. Tints match the
   deep-navy modal so the scrollbar reads as part of the chrome rather than
   an out-of-place blue browser default. Cross-browser via Firefox's
   scrollbar-* properties. */
.face-modal-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
}
.face-modal-scroll::-webkit-scrollbar { width: 6px; }
.face-modal-scroll::-webkit-scrollbar-track { background: transparent; }
.face-modal-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.face-modal-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.36);
}

/* Body container: no scrollbar. Content is sized with the carousel + compact
   tips so it always fits inside the modal on phone + desktop. */
.face-modal-body { overflow: hidden; }

/* Tip carousel cross-fade */
.face-tip-enter-active,
.face-tip-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.face-tip-enter-from { opacity: 0; transform: translateY(4px); }
.face-tip-leave-to { opacity: 0; transform: translateY(-4px); }

/* Button micro-interaction */
.face-cta-btn:active {
  transform: scale(0.98);
}

/* Scanning line animation when capturing */
@keyframes face-scan {
  0%   { top: 20%; opacity: 0.9; }
  48%  { opacity: 0.6; }
  50%  { top: 80%; opacity: 0.9; }
  98%  { opacity: 0.6; }
  100% { top: 20%; opacity: 0.9; }
}
.face-scan-line {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.8), transparent);
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.6), 0 0 20px rgba(52, 211, 153, 0.2);
  border-radius: 999px;
  animation: face-scan 1.8s ease-in-out infinite;
  pointer-events: none;
}
</style>
