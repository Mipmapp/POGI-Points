<template>
  <transition name="terminal-fade">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0208] font-mono">
      <!-- Animated Background Scanner Lines -->
      <div class="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div class="scanner-line"></div>
        <div class="grid-overlay"></div>
      </div>

      <div class="relative w-full max-w-2xl p-8 border border-purple-500/30 bg-black/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-lg overflow-hidden">
        <!-- SSAAM Branding Corner -->
        <div class="absolute top-0 right-0 p-4 opacity-20">
          <div class="text-[40px] font-bold text-purple-500 select-none">SSAAM</div>
        </div>

        <!-- Terminal Header -->
        <div class="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-b border-purple-500/30 flex items-center px-4 gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
          <span class="ml-3 text-[10px] text-purple-200/60 tracking-[0.3em] uppercase font-bold">Secure Access Protocol v2.0</span>
        </div>

        <!-- Terminal Content -->
        <div class="mt-6 space-y-3 text-sm md:text-base min-h-[220px] relative z-10">
          <div v-for="(line, index) in visibleLines" :key="index" class="flex items-start">
            <span class="mr-3 text-purple-500/50 font-bold">>></span>
            <span class="typing-text text-purple-100 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">{{ line }}</span>
          </div>
          
          <div v-if="visibleLines.length < script.length" class="flex items-center">
            <span class="mr-3 text-purple-500/50 font-bold">>></span>
            <div class="w-2 h-5 bg-pink-500 animate-pulse shadow-[0_0_10px_#ec4899]"></div>
          </div>

          <!-- SSAAM Style Progress Bar -->
          <div v-if="showProgress" class="mt-10 space-y-2">
            <div class="flex justify-between items-end">
              <div class="flex flex-col">
                <span class="text-[10px] uppercase tracking-widest text-purple-400 font-bold">System Status</span>
                <span class="text-xs text-purple-200">{{ message }}</span>
              </div>
              <span class="text-xl font-bold italic text-pink-400 tabular-nums">{{ progress }}%</span>
            </div>
            <div class="h-1.5 w-full bg-purple-900/30 rounded-full border border-purple-500/20 relative overflow-hidden p-[1px]">
              <div 
                class="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)] transition-all duration-300 relative" 
                :style="{ width: `${progress}%` }"
              >
                <div class="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Decorative UI Elements -->
        <div class="absolute bottom-0 left-0 p-4 flex gap-4 opacity-30">
          <div class="flex flex-col gap-1">
            <div class="h-1 w-8 bg-purple-500"></div>
            <div class="h-1 w-4 bg-pink-500"></div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  message: {
    type: String,
    default: 'SYSTEM INITIALIZING'
  }
})

const progress = ref(0)
const visibleLines = ref([])
const showProgress = ref(false)

const script = [
  'BOOTING SSAAM SECURE KERNEL...',
  'ESTABLISHING ENCRYPTED HANDSHAKE...',
  'SYNCHRONIZING RFID REPOSITORIES...',
  'VERIFYING ACADEMIC CREDENTIALS...',
  'DECRYPTING ACCESS TOKENS...',
  'PROTOCOL STABILIZED. ACCESS GRANTED.'
]

const runTerminal = async () => {
  visibleLines.value = []
  progress.value = 0
  showProgress.value = false
  
  for (let i = 0; i < script.length; i++) {
    if (!props.visible) break
    await new Promise(r => setTimeout(r, 300 + Math.random() * 300))
    visibleLines.value.push(script[i])
    if (i === 1) showProgress.value = true
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    runTerminal()
    const interval = setInterval(() => {
      if (progress.value < 100) {
        progress.value += Math.floor(Math.random() * 12) + 6
        if (progress.value > 100) progress.value = 100
      } else {
        clearInterval(interval)
      }
    }, 180)
  }
})

onMounted(() => {
  if (props.visible) runTerminal()
})
</script>

<style scoped>
.terminal-fade-enter-active, .terminal-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.terminal-fade-enter-from, .terminal-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(168, 85, 247, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.05) 1px, transparent 1px);
  background-size: 30px 30px;
}

.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #a855f7, transparent);
  animation: scan 3s linear infinite;
  box-shadow: 0 0 15px #a855f7;
  z-index: 1;
}

@keyframes scan {
  0% { top: -10%; }
  100% { top: 110%; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.typing-text {
  letter-spacing: 0.05em;
}
</style>

