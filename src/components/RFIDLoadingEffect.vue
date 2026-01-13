<template>
  <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-purple-950/90 backdrop-blur-md">
    <div class="relative max-w-md w-full p-8 text-center">
      <!-- Matrix-like background effect -->
      <div class="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div class="matrix-text text-xs text-purple-400 font-mono text-left leading-none whitespace-pre select-none">
          {{ matrixText }}
        </div>
      </div>

      <!-- Main Scanner Animation -->
      <div class="relative mb-8">
        <div class="w-32 h-32 mx-auto border-4 border-purple-500/30 rounded-2xl relative overflow-hidden bg-purple-900/40">
          <div class="absolute inset-0 bg-gradient-to-b from-purple-500/0 via-purple-400/50 to-purple-500/0 h-1 w-full scanner-line"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="w-16 h-16 text-purple-300 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4h4v4H3V4zm0 8h4v4H3v-4zm0 8h4v4H3v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4z"></path>
            </svg>
          </div>
        </div>
        
        <!-- Glowing corners -->
        <div class="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-purple-400"></div>
        <div class="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-purple-400"></div>
        <div class="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-purple-400"></div>
        <div class="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-purple-400"></div>
      </div>

      <!-- Status Text -->
      <div class="space-y-4 font-mono">
        <h2 class="text-2xl font-bold text-white tracking-widest uppercase">
          Processing...
        </h2>
        <div class="flex flex-col gap-2">
          <div v-for="(log, index) in logs" :key="index" 
               class="text-xs text-left"
               :class="index === logs.length - 1 ? 'text-purple-300' : 'text-purple-500/60'">
            <span class="mr-2">></span> {{ log }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  visible: Boolean
});

const logs = ref([]);
const matrixText = ref('');
let logInterval = null;
let matrixInterval = null;

const possibleLogs = [
  'Initializing RFID protocol...',
  'Handshaking with Vercel API...',
  'Authenticating security token...',
  'Retrieving student profile...',
  'Verifying attendance record...',
  'Updating activity database...',
  'Generating session logs...',
  'Encrypting response data...',
  'Syncing local cache...'
];

const startAnimation = () => {
  logs.value = [possibleLogs[0]];
  logInterval = setInterval(() => {
    if (logs.value.length < 5) {
      logs.value.push(possibleLogs[Math.floor(Math.random() * possibleLogs.length)]);
    } else {
      logs.value.shift();
      logs.value.push(possibleLogs[Math.floor(Math.random() * possibleLogs.length)]);
    }
  }, 300);

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
  clearInterval(logInterval);
  clearInterval(matrixInterval);
};

watch(() => props.visible, (newVal) => {
  if (newVal) startAnimation();
  else stopAnimation();
});

onUnmounted(stopAnimation);
</script>

<style scoped>
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
</style>
