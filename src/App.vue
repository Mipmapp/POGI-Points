<template>
  <div id="app">
    <LoadingScreen v-if="isLoading" />
    <router-view v-if="!isLoading" />
    <transition name="offline-slide">
      <div
        v-if="isOffline"
        class="offline-banner"
        role="alert"
        aria-live="assertive"
      >
        <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
        <span>You're offline — some features may be unavailable</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LoadingScreen from './components/LoadingScreen.vue'

const isLoading = ref(true)
const isOffline = ref(typeof navigator !== 'undefined' ? !navigator.onLine : false)

const handleOnline = () => { isOffline.value = false }
const handleOffline = () => { isOffline.value = true }

onMounted(() => {
  setTimeout(() => { isLoading.value = false }, 3000)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}

.offline-banner {
  position: fixed;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(30, 30, 30, 0.96);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.55rem 1.1rem;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  white-space: nowrap;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;
  user-select: none;
}

.offline-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: #f87171;
}

.offline-slide-enter-active,
.offline-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.offline-slide-enter-from,
.offline-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.75rem);
}
</style>
