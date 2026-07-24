<template>
  <Transition name="welcome-fade">
    <div
      v-if="visible"
      class="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style="background: rgba(8,14,46,0.82); backdrop-filter: blur(8px);"
    >
      <div class="welcome-card bg-white w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col" style="max-height: 92vh;">

        <!-- Header -->
        <div class="flex-shrink-0 bg-gradient-to-br from-[#080e2e] via-[#0f2080] to-[#1a4abf] px-5 py-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5">SSAAM — CCS</p>
              <h2 class="text-white text-lg font-extrabold leading-tight tracking-tight">Terms &amp; Conditions</h2>
            </div>
          </div>
          <p class="text-white/60 text-xs leading-relaxed">
            Please read through all sections carefully before continuing. Scroll to the bottom to accept.
          </p>
        </div>

        <!-- Scrollable T&C content -->
        <div
          ref="scrollRef"
          class="flex-1 overflow-y-auto welcome-scroll bg-gray-50 overscroll-contain"
          @scroll="onScroll"
        >
          <div class="p-5 space-y-6">

            <div
              v-for="(section, idx) in tcSections"
              :key="idx"
              class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <!-- Section header -->
              <div :class="['flex items-center gap-3 px-5 py-4 border-b border-gray-100', section.headerBg]">
                <div :class="['w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-black shadow-sm', section.color]">
                  {{ idx + 1 }}
                </div>
                <h3 :class="['font-bold text-sm leading-tight', section.titleColor]">{{ section.title }}</h3>
              </div>

              <!-- Section body -->
              <div class="px-5 py-4 space-y-3">
                <div
                  v-for="(point, pi) in section.points"
                  :key="pi"
                  class="flex gap-3"
                >
                  <span :class="['flex-shrink-0 mt-[5px] w-2 h-2 rounded-full', section.dot]"></span>
                  <p class="text-sm text-gray-700 leading-relaxed">{{ point }}</p>
                </div>
              </div>
            </div>

            <!-- End marker -->
            <div class="text-center py-2">
              <span class="inline-flex items-center gap-2 text-xs text-gray-400 font-medium">
                <span class="w-8 h-px bg-gray-200 inline-block"></span>
                End of Terms &amp; Conditions
                <span class="w-8 h-px bg-gray-200 inline-block"></span>
              </span>
            </div>
          </div>
        </div>

        <!-- Scroll nudge -->
        <Transition name="hint-fade">
          <div
            v-if="!hasScrolledToBottom"
            class="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 bg-blue-50 border-t border-blue-100 cursor-pointer select-none"
            @click="scrollToBottom"
          >
            <svg class="w-3.5 h-3.5 text-blue-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
            </svg>
            <p class="text-[11px] text-blue-500 font-semibold">Scroll down to read all terms</p>
          </div>
        </Transition>

        <!-- Footer -->
        <div class="flex-shrink-0 bg-white border-t border-gray-100 px-5 pt-4 pb-5 space-y-3">

          <!-- Checkbox -->
          <label :class="['flex items-start gap-3 select-none transition-opacity rounded-xl p-3 border', hasScrolledToBottom ? 'cursor-pointer opacity-100 border-gray-200 bg-gray-50 hover:bg-blue-50/40 hover:border-blue-200 transition-colors' : 'cursor-not-allowed opacity-50 border-gray-100 bg-gray-50']">
            <div class="relative flex-shrink-0 mt-0.5">
              <input type="checkbox" v-model="agreed" :disabled="!hasScrolledToBottom" class="sr-only" />
              <div
                :class="[
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                  agreed && hasScrolledToBottom
                    ? 'bg-[#0f2080] border-[#0f2080]'
                    : hasScrolledToBottom
                    ? 'bg-white border-gray-300'
                    : 'bg-gray-100 border-gray-200'
                ]"
              >
                <svg v-if="agreed && hasScrolledToBottom" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
            <span class="text-xs text-gray-600 leading-relaxed">
              I have read and understood SSAAM's <strong class="text-[#0f2080]">Terms &amp; Conditions</strong>.
              I acknowledge that my attendance data and contributions are managed through this system.
            </span>
          </label>

          <!-- CTA button -->
          <button
            @click="handleAgree"
            :disabled="!agreed || !hasScrolledToBottom"
            :class="[
              'w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2',
              agreed && hasScrolledToBottom
                ? 'bg-gradient-to-r from-[#080e2e] to-[#1a3a8f] text-white shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            ]"
          >
            <svg v-if="agreed && hasScrolledToBottom" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
            <span>{{
              agreed && hasScrolledToBottom
                ? 'I Agree — Continue to SSAAM'
                : !hasScrolledToBottom
                ? 'Scroll down to continue'
                : 'Please check the box above'
            }}</span>
          </button>

          <!-- Welcome message -->
          <p class="text-center text-[11px] text-gray-400 leading-snug">
            <span v-if="userName && userName !== 'User'">
              Welcome, <strong class="text-gray-600">{{ userName }}</strong>! Glad to have you in SSAAM.
            </span>
            <span v-else>
              Welcome to <strong class="text-gray-600">SSAAM</strong> — your official CCS attendance platform.
            </span>
          </p>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  userName: { type: String, default: '' }
})

const emit = defineEmits(['agreed'])

const agreed = ref(false)
const hasScrolledToBottom = ref(false)
const scrollRef = ref(null)

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
    agreed.value = false
    hasScrolledToBottom.value = false
    nextTick(() => {
      if (scrollRef.value) scrollRef.value.scrollTop = 0
    })
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })

const onScroll = () => {
  if (!scrollRef.value) return
  const el = scrollRef.value
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
    hasScrolledToBottom.value = true
  }
}

const scrollToBottom = () => {
  if (scrollRef.value) {
    scrollRef.value.scrollTo({ top: scrollRef.value.scrollHeight, behavior: 'smooth' })
  }
}

const handleAgree = () => {
  if (!agreed.value || !hasScrolledToBottom.value) return
  emit('agreed')
}

const tcSections = [
  {
    title: 'System Overview & Purpose',
    color: 'bg-blue-600',
    dot: 'bg-blue-400',
    headerBg: 'bg-blue-50/60',
    titleColor: 'text-blue-900',
    points: [
      'SSAAM (Student School Activities Attendance Monitoring) is an official digital platform of the College of Computing Studies.',
      'It is designed to record, monitor, and manage student attendance in school activities and events.',
      'The system is operated by the College of Computing Studies (CCS) — Creatives Society and is authorized by the CCS administration.',
      'Use of this platform is mandatory for enrolled students who are required to attend official school activities.',
      'This platform covers the CCS.'
    ]
  },
  {
    title: 'Data Collection & Privacy',
    color: 'bg-violet-600',
    dot: 'bg-violet-400',
    headerBg: 'bg-violet-50/60',
    titleColor: 'text-violet-900',
    points: [
      'SSAAM collects personal information including your name, student ID, program, year level, and contact details as provided during registration.',
      'Biometric data (facial recognition descriptors) may be collected for identity verification during attendance check-in.',
      'Attendance logs, event participation records, and financial transaction histories are stored in a secured database.',
      'Your data is used solely for attendance monitoring, contribution tracking, and academic reporting within the CCS.',
      'SSAAM does not sell, share, or distribute your personal information to third parties without explicit written consent, except as required by university policy or law.',
      'Data is stored securely on cloud infrastructure and protected by encryption and access controls.'
    ]
  },
  {
    title: 'Attendance Policy',
    color: 'bg-emerald-600',
    dot: 'bg-emerald-400',
    headerBg: 'bg-emerald-50/60',
    titleColor: 'text-emerald-900',
    points: [
      'Attendance records generated through SSAAM are considered official and may be used for academic or disciplinary purposes.',
      'Students are responsible for ensuring their own check-in/check-out is properly recorded for each event they attend.',
      'Proxy attendance — checking in on behalf of another student — is strictly prohibited and may result in disciplinary action.',
      'RFID-based and Face ID check-ins are the supported verification methods. Technical failures must be reported immediately to the event organizer.',
      'Disputes regarding attendance records must be raised within 48 hours of the event through the proper university channels.',
      'The university reserves the right to adjust or correct attendance records based on verified evidence.'
    ]
  },
  {
    title: 'Financial Contributions',
    color: 'bg-amber-600',
    dot: 'bg-amber-400',
    headerBg: 'bg-amber-50/60',
    titleColor: 'text-amber-900',
    points: [
      'SSAAM tracks student contribution payments for approved school activities as authorized by university administration.',
      'All payment records reflected in the system are considered official receipts and must be settled through approved channels.',
      'Students are responsible for verifying that their payment status is correctly reflected in the system.',
      'Discrepancies in payment records must be reported to the designated treasurer or administrator within the prescribed period.',
      'Unauthorized modification of payment records is strictly prohibited and subject to disciplinary and legal action.',
      'Contribution amounts and deadlines are set by university policy and may be updated by authorized administrators.'
    ]
  },
  {
    title: 'User Responsibilities & Account Security',
    color: 'bg-rose-600',
    dot: 'bg-rose-400',
    headerBg: 'bg-rose-50/60',
    titleColor: 'text-rose-900',
    points: [
      'You are solely responsible for maintaining the confidentiality of your account credentials (Student ID and password).',
      'Do not share your account access with any other person. Any activity performed under your account is your responsibility.',
      'You must immediately report any unauthorized access or suspicious activity to the system administrator.',
      'Attempting to access, modify, or interfere with other users\' data or system functionality is strictly prohibited.',
      'SSAAM reserves the right to suspend or terminate accounts found to be in violation of these terms.',
      'By continuing, you confirm that all registration information you have provided is accurate and truthful.',
      'These terms may be updated periodically. Continued use of SSAAM constitutes acceptance of any revised terms.'
    ]
  }
]
</script>

<style scoped>
.welcome-fade-enter-active { transition: opacity 0.3s ease; }
.welcome-fade-leave-active { transition: opacity 0.25s ease; }
.welcome-fade-enter-from,
.welcome-fade-leave-to { opacity: 0; }

.welcome-fade-enter-active .welcome-card {
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
}
.welcome-fade-leave-active .welcome-card {
  transition: transform 0.22s ease-in, opacity 0.22s ease-in;
}
.welcome-fade-enter-from .welcome-card { transform: translateY(48px); opacity: 0; }
.welcome-fade-leave-to .welcome-card { transform: translateY(24px); opacity: 0; }

.hint-fade-enter-active { transition: opacity 0.3s ease, max-height 0.3s ease; overflow: hidden; max-height: 40px; }
.hint-fade-leave-active { transition: opacity 0.25s ease, max-height 0.25s ease; overflow: hidden; }
.hint-fade-enter-from { opacity: 0; max-height: 0; }
.hint-fade-leave-to { opacity: 0; max-height: 0; }

.welcome-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
.welcome-scroll::-webkit-scrollbar { width: 5px; }
.welcome-scroll::-webkit-scrollbar-track { background: transparent; }
.welcome-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 999px; }
.welcome-scroll::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
</style>
