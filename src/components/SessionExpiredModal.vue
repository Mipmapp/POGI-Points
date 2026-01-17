<template>
  <transition name="fade">
    <div v-if="visible && !isClosing" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] backdrop-blur-sm" @click.stop>
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 border-4 border-red-100">
          <div class="text-center mb-8">
            <div class="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-inner">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 class="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Security Alert</h3>
            <p class="text-gray-600 text-lg leading-relaxed">Your session has expired or the security token is invalid. For your protection, you must log in again to continue.</p>
          </div>
          <button 
            @click="handleLogout" 
            class="w-full bg-gradient-to-r from-red-600 to-purple-700 text-white py-4 px-6 rounded-2xl font-black text-xl hover:from-red-700 hover:to-purple-800 transition-all duration-300 shadow-[0_10px_20px_rgba(220,38,38,0.3)] transform active:scale-95 flex items-center justify-center gap-3"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Log Out Now
          </button>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  visible: Boolean
});

const emit = defineEmits(['logout']);
const isClosing = ref(false)

const handleLogout = () => {
  isClosing.value = true
  // Small delay to allow animation to start before parent triggers logout/unmount
  setTimeout(() => {
    emit('logout')
  }, 300)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.modal-bounce-enter-active {
  animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-bounce-leave-active {
  animation: pop-out 0.3s cubic-bezier(0.36, 0, 0.66, -0.56);
}

@keyframes pop-in {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pop-out {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.5); opacity: 0; }
}
</style>
