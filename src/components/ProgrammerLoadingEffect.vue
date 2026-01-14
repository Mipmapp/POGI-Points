<template>
  <transition name="terminal-fade">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0208] font-mono text-[#00ff41]">
      <div class="relative w-full max-w-2xl p-8 border border-[#00ff41]/30 bg-[#0d0208]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,65,0.1)]">
        <!-- Terminal Header -->
        <div class="absolute top-0 left-0 right-0 h-8 bg-[#00ff41]/10 border-b border-[#00ff41]/30 flex items-center px-4 gap-2">
          <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          <span class="ml-2 text-[10px] text-[#00ff41]/50 tracking-widest uppercase">SSAAM-OS TERMINAL v1.0.42</span>
        </div>

        <!-- Terminal Content -->
        <div class="mt-4 space-y-2 text-sm md:text-base min-h-[200px]">
          <div v-for="(line, index) in visibleLines" :key="index" class="flex">
            <span class="mr-2 opacity-50">root@ssaam:~$</span>
            <span class="typing-text">{{ line }}</span>
          </div>
          
          <div v-if="visibleLines.length < script.length" class="flex items-center">
            <span class="mr-2 opacity-50">root@ssaam:~$</span>
            <span class="animate-pulse">_</span>
          </div>

          <!-- Loading Progress Bar -->
          <div v-if="showProgress" class="mt-8 space-y-1">
            <div class="flex justify-between text-[10px] uppercase tracking-tighter">
              <span>System Initialization</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="h-2 w-full bg-[#00ff41]/10 border border-[#00ff41]/30 relative overflow-hidden">
              <div 
                class="h-full bg-[#00ff41] shadow-[0_0_10px_#00ff41] transition-all duration-300" 
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Background Grid Effect -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
          <div class="grid-overlay"></div>
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
  'INITIALIZING SSAAM KERNEL...',
  'CONNECTING TO SECURE BACKEND...',
  'VERIFYING ENCRYPTED TIMESTAMPS...',
  'LOADING STUDENT REPOSITORIES...',
  'ESTABLISHING HANDSHAKE PROTOCOL...',
  'READY FOR COMMAND INPUT.'
]

const runTerminal = async () => {
  visibleLines.value = []
  progress.value = 0
  showProgress.value = false
  
  for (let i = 0; i < script.length; i++) {
    if (!props.visible) break
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400))
    visibleLines.value.push(script[i])
    if (i === 2) showProgress.value = true
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    runTerminal()
    const interval = setInterval(() => {
      if (progress.value < 100) {
        progress.value += Math.floor(Math.random() * 10) + 5
        if (progress.value > 100) progress.value = 100
      } else {
        clearInterval(interval)
      }
    }, 200)
  }
})

onMounted(() => {
  if (props.visible) runTerminal()
})
</script>

<style scoped>
.terminal-fade-enter-active, .terminal-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.terminal-fade-enter-from, .terminal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.grid-overlay {
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.typing-text {
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
}
</style>
