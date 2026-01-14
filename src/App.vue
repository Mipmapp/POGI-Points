<template>
  <div id="app">
    <LoadingScreen v-if="isLoading" />
    <router-view v-slot="{ Component }" v-if="!isLoading">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LoadingScreen from './components/LoadingScreen.vue'

const isLoading = ref(true)

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

.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.4s ease-in-out;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>