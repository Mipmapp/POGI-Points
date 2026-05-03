<!-- [AI WARNING] Unused component — GlobalLoadingEffect is never imported in any .vue or .js file. ProgrammerLoadingEffect is used instead everywhere. Safe to delete. -->
<template>
  <transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-purple-950/80 backdrop-blur-md">
      <div class="relative flex flex-col items-center">
        <!-- Main Hexagon Loader -->
        <div class="relative w-32 h-32">
          <!-- Animated Hexagon Border -->
          <svg class="w-full h-full animate-[spin_4s_linear_infinite]" viewBox="0 0 100 100">
            <path
              d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
              fill="none"
              stroke="url(#purpleGradient)"
              stroke-width="2"
              stroke-dasharray="300"
              stroke-dashoffset="300"
              class="animate-[dash_2s_ease-in-out_infinite]"
            />
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#a855f7;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>

          <!-- Inner Pulse Orbs -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-ssaam-dark to-ssaam-light blur-xl opacity-20 animate-pulse"></div>
            <div class="absolute w-8 h-8 rounded-full bg-white opacity-90 shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-ping"></div>
          </div>
        </div>

        <!-- Scanning Line -->
        <div class="mt-8 relative w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent w-full animate-[scan_1.5s_ease-in-out_infinite]"></div>
        </div>

        <!-- Loading Text -->
        <div class="mt-6 text-center">
          <h2 class="text-xl font-bold tracking-[0.2em] text-white uppercase">{{ message }}</h2>
          <div class="mt-2 flex justify-center gap-1">
            <span class="w-1 h-1 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span class="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span class="w-1 h-1 bg-pink-400 rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: Boolean,
  message: {
    type: String,
    default: 'PROCESSING'
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes dash {
  0% { stroke-dashoffset: 300; }
  50% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -300; }
}

@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
