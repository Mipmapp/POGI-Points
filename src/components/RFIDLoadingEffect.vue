<template>
  <Transition name="fade">
    <div v-if="visible">
      <!-- COE Version: Flipping Logo -->
      <div v-if="props.isCoe" :class="['fixed inset-0 z-[150] flex items-center justify-center pointer-events-auto', 'bg-gradient-to-br from-orange-900 via-orange-800 to-red-900']">
        <!-- Full Screen Flipping Logo -->
        <div class="absolute inset-0 flex items-center justify-center overflow-hidden">
          <!-- Flipping COE Logo Container -->
          <div class="relative w-64 h-64 lg:w-96 lg:h-96 perspective">
            <div 
              class="absolute inset-0 flex items-center justify-center flip-animation"
              :style="{
                transformStyle: 'preserve-3d'
              }"
            >
              <!-- Logo with flip effect -->
              <div class="flip-inner-vertical w-full h-full flex items-center justify-center">
                <!-- Front of flip -->
                <div class="absolute inset-0 flex items-center justify-center backface-hidden">
                  <img 
                    src="/icons/coe.svg" 
                    alt="COE Logo" 
                    class="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
                <!-- Back of flip -->
                <div class="absolute inset-0 flex items-center justify-center backface-hidden" style="transform: rotateY(180deg);">
                  <img 
                    src="/icons/coe.svg" 
                    alt="COE Logo" 
                    class="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>

            <!-- Glowing effect around logo -->
            <div class="absolute inset-0 rounded-3xl blur-3xl opacity-50 -z-10 bg-gradient-to-br from-red-500 to-orange-500"></div>
          </div>
        </div>

        <!-- Status Text -->
        <div class="absolute bottom-1/4 text-center z-10">
          <h2 class="text-3xl lg:text-4xl font-bold text-white tracking-widest uppercase mb-4 drop-shadow-lg">
            Processing Student...
          </h2>
          <p class="text-lg text-white text-opacity-80 drop-shadow-md">Please wait</p>
        </div>
      </div>

      <!-- CCS Version: Matrix Scanner Effect -->
      <div v-else class="fixed inset-0 z-[150] flex items-center justify-center bg-blue-950/30 backdrop-blur-md pointer-events-auto">
        <div class="relative max-w-md w-full p-8 text-center flex flex-col items-center justify-center">
          <!-- Matrix-like background effect -->
          <div class="absolute inset-0 overflow-hidden opacity-20 pointer-events-none flex items-center justify-center">
            <div class="matrix-text text-xs text-blue-400 font-mono text-center leading-none whitespace-pre select-none">
              {{ matrixText }}
            </div>
          </div>

          <!-- Main Scanner Animation -->
          <div class="relative mb-4 z-10">
            <div class="w-32 h-32 mx-auto border-4 border-blue-500/30 rounded-2xl relative overflow-hidden bg-blue-900/40">
              <div class="absolute inset-0 bg-gradient-to-b from-ssaam-dark/0 via-ssaam-light/50 to-ssaam-dark/0 h-1 w-full scanner-line"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <svg class="w-16 h-16 text-blue-300 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4h4v4H3V4zm0 8h4v4H3v-4zm0 8h4v4H3v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4z"></path>
                </svg>
              </div>
            </div>
            
            <!-- Glowing corners -->
            <div class="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-blue-400"></div>
            <div class="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-blue-400"></div>
            <div class="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-blue-400"></div>
            <div class="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-blue-400"></div>
          </div>

          <!-- Status Text -->
          <div class="font-mono z-10">
            <h2 class="text-2xl font-bold text-white tracking-widest uppercase">
              Processing...
            </h2>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onUnmounted, watch } from 'vue';

const props = defineProps({
  visible: Boolean,
  isCoe: {
    type: Boolean,
    default: false
  }
});

const matrixText = ref('');
let matrixInterval = null;

const startAnimation = () => {
  matrixInterval = setInterval(() => {
    let text = '';
    const chars = '01ABCDEF';
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 50; j++) {
        text += chars[Math.floor(Math.random() * chars.length)];
      }
      text += '\n';
    }
    matrixText.value = text;
  }, 100);
};

const stopAnimation = () => {
  clearInterval(matrixInterval);
};

watch(() => props.visible, (newVal) => {
  if (newVal && !props.isCoe) startAnimation();
  else stopAnimation();
});

onUnmounted(stopAnimation);
</script>

<style scoped>
/* COE Flip Animation */
.flip-animation {
  animation: flipVertical 2s ease-in-out infinite;
}

.flip-inner-vertical {
  transform-style: preserve-3d;
  animation: flipVerticalInner 2s ease-in-out infinite;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.perspective {
  perspective: 1000px;
  -webkit-perspective: 1000px;
}

@keyframes flipVertical {
  0% {
    transform: rotateX(0deg) rotateY(0deg);
  }
  50% {
    transform: rotateX(180deg) rotateY(0deg);
  }
  75% {
    transform: rotateX(180deg) rotateY(180deg);
  }
  100% {
    transform: rotateX(0deg) rotateY(0deg);
  }
}

@keyframes flipVerticalInner {
  0% {
    transform: rotateX(0deg) rotateY(0deg);
  }
  50% {
    transform: rotateX(180deg) rotateY(0deg);
  }
  75% {
    transform: rotateX(180deg) rotateY(180deg);
  }
  100% {
    transform: rotateX(0deg) rotateY(0deg);
  }
}

/* CCS Scanner Animation */
.scanner-line {
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: -10%; }
  100% { top: 110%; }
}

.matrix-text {
  font-family: 'Courier New', Courier, monospace;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
