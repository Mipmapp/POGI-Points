<template>
  <transition name="terminal-fade">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center font-mono" :style="bgStyle" style="height:100dvh">
      <div class="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        <div class="scanner-line" :style="scannerStyle"></div>
        <div class="grid-overlay"></div>
      </div>

      <div class="relative w-full max-w-2xl p-6 md:p-8 mx-4 border border-white/20 bg-black/40 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-10">
          <div class="text-[40px] font-bold text-white select-none tracking-tighter">SSAAM</div>
        </div>

        <div class="absolute top-0 left-0 right-0 h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
          <div class="w-2.5 h-2.5 rounded-full" :style="{ background: accentColors.dot1 }"></div>
          <div class="w-2.5 h-2.5 rounded-full" :style="{ background: accentColors.dot2 }"></div>
          <div class="w-2.5 h-2.5 rounded-full" :style="{ background: accentColors.dot3 }"></div>
          <span class="ml-3 text-[10px] text-white/40 tracking-[0.3em] uppercase font-bold">Secure Access Protocol v3.0</span>
        </div>

        <div class="mt-6 space-y-3 text-sm md:text-base min-h-[220px] relative z-10">
          <div v-for="(line, index) in visibleLines" :key="index" class="flex items-start">
            <span class="mr-3 font-bold" :style="{ color: accentColors.prompt }">&#62;&#62;</span>
            <span class="typing-text text-white font-medium">{{ line }}</span>
          </div>
          
          <div v-if="visibleLines.length < script.length" class="flex items-center">
            <span class="mr-3 font-bold" :style="{ color: accentColors.prompt }">&#62;&#62;</span>
            <div class="w-2 h-5 animate-pulse" :style="{ background: accentColors.cursor }"></div>
          </div>

          <div v-if="showProgress" class="mt-10 space-y-2">
            <div class="flex justify-between items-end">
              <div class="flex flex-col">
                <span class="text-[10px] uppercase tracking-widest text-white/40 font-bold">System Status</span>
                <span class="text-xs text-white font-bold">{{ message }}</span>
              </div>
              <span class="text-xl font-bold italic tabular-nums" :style="{ color: accentColors.progress }">{{ progress }}%</span>
            </div>
            <div class="h-2 w-full bg-white/10 rounded-full relative overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-300 relative" 
                :style="{ width: `${progress}%`, background: accentColors.barGradient }"
              >
                <div class="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 p-4 flex gap-4 opacity-20">
          <div class="flex flex-col gap-1">
            <div class="h-1 w-8" :style="{ background: accentColors.dot1 }"></div>
            <div class="h-1 w-4" :style="{ background: accentColors.dot2 }"></div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'

const props = defineProps({
  visible: Boolean,
  message: {
    type: String,
    default: 'SYSTEM INITIALIZING'
  },
  theme: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['complete'])

const progress = ref(0)
const visibleLines = ref([])
const showProgress = ref(false)

const themeKey = computed(() => {
  const t = (props.theme || '').toLowerCase()
  if (t.includes('coe')) return 'coe'
  if (t.includes('som')) return 'som'
  if (t.includes('cnahs')) return 'cnahs'
  return 'ccs'
})

const bgStyle = computed(() => {
  const map = {
    coe: 'linear-gradient(to bottom, #4a1207, #7c2210)',
    som: 'linear-gradient(to bottom, #0d3320, #5a3a08)',
    cnahs: 'linear-gradient(to bottom, #052e16, #14532d)',
    ccs: 'linear-gradient(to bottom, #080e2e, #0f1f6e)',
  }
  return { background: map[themeKey.value] }
})

const accentColors = computed(() => {
  const map = {
    coe: {
      dot1: '#f97316', dot2: '#fb923c', dot3: '#ef4444',
      prompt: '#fb923c', cursor: '#f97316', progress: '#fb923c',
      barGradient: 'linear-gradient(to right, #b45309, #f97316)',
      scanner: 'rgba(251,146,60,0.5)',
    },
    som: {
      dot1: '#4ade80', dot2: '#facc15', dot3: '#86efac',
      prompt: '#86efac', cursor: '#4ade80', progress: '#86efac',
      barGradient: 'linear-gradient(to right, #15803d, #4ade80)',
      scanner: 'rgba(74,222,128,0.5)',
    },
    cnahs: {
      dot1: '#34d399', dot2: '#6ee7b7', dot3: '#10b981',
      prompt: '#6ee7b7', cursor: '#34d399', progress: '#6ee7b7',
      barGradient: 'linear-gradient(to right, #065f46, #34d399)',
      scanner: 'rgba(52,211,153,0.5)',
    },
    ccs: {
      dot1: '#60a5fa', dot2: '#93c5fd', dot3: '#818cf8',
      prompt: '#93c5fd', cursor: '#60a5fa', progress: '#93c5fd',
      barGradient: 'linear-gradient(to right, #3d1154, #7d2fa3)',
      scanner: 'rgba(96,165,250,0.5)',
    },
  }
  return map[themeKey.value]
})

const scannerStyle = computed(() => ({
  background: `linear-gradient(90deg, transparent, ${accentColors.value.scanner}, transparent)`
}))

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
    await new Promise(r => setTimeout(r, 200 + Math.random() * 200))
    visibleLines.value.push(script[i])
    if (i === 1) showProgress.value = true
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    runTerminal()
    const interval = setInterval(() => {
      if (progress.value < 100) {
        progress.value += Math.floor(Math.random() * 8) + 4
        if (progress.value >= 100) {
          progress.value = 100
          clearInterval(interval)
          setTimeout(() => {
            emit('complete')
          }, 500)
        }
      } else {
        clearInterval(interval)
      }
    }, 120)
  }
})

let previousHtmlOverflow = ''
watch(() => props.visible, (visible) => {
  try {
    if (visible) {
      previousHtmlOverflow = document.documentElement.style.overflow || ''
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = previousHtmlOverflow || ''
    }
  } catch (e) {}
})

onMounted(() => {
  if (props.visible) runTerminal()
})

onUnmounted(() => {
  try { document.documentElement.style.overflow = previousHtmlOverflow || '' } catch (e) {}
})
</script>

<style scoped>
.terminal-fade-enter-active, .terminal-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.terminal-fade-enter-from, .terminal-fade-leave-to {
  opacity: 0;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}

.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  animation: scan 4s linear infinite;
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
  letter-spacing: 0.02em;
}
</style>
