<template>
  <div id="app">
    <LoadingScreen v-if="isLoading" />
    <router-view v-if="!isLoading" v-slot="{ Component }">
      <Transition :name="isInitialLoad ? 'slide-in-initial' : 'fade-slide'" mode="out-in">
        <component :is="Component" :key="isInitialLoad" />
      </Transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LoadingScreen from './components/LoadingScreen.vue'

const isLoading = ref(true)
const isInitialLoad = ref(true)

const preventContextMenu = (e) => {
  e.preventDefault()
  return false
}

const preventCopy = (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A' || e.key === 'x' || e.key === 'X')) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      return false
    }
  }
}

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
    setTimeout(() => {
      isInitialLoad.value = false
    }, 600)
  }, 2000)
  
  document.addEventListener('contextmenu', preventContextMenu)
  document.addEventListener('keydown', preventCopy)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', preventContextMenu)
  document.removeEventListener('keydown', preventCopy)
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
}

/* Initial Slide-In Animation */
.slide-in-initial-enter-active {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease;
}

/* Desktop: Slide from right to left */
@media (min-width: 768px) {
  .slide-in-initial-enter-from {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Mobile: Slide from bottom to top */
@media (max-width: 767px) {
  .slide-in-initial-enter-from {
    transform: translateY(100%);
    opacity: 0;
  }
}

.slide-in-initial-enter-to {
  transform: translate(0, 0);
  opacity: 1;
}

/* Page Transition Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>