<template>
  <div class="loading-screen" :style="loadingScreenStyle">
    <div class="flex flex-col items-center justify-center gap-6 text-center">
      <div class="w-32 h-32 flex items-center justify-center animate-bounce">
        <img :src="departmentLogo" :alt="isCOE ? 'COE Logo' : 'JRMSU CCS Logo'" class="w-full h-full object-contain drop-shadow-2xl" />
      </div>
      <div>
        <h1 class="text-4xl font-bold text-white mb-2">SSAAM</h1>
        <p class="text-lg text-white opacity-90">Student School Activities Attendance Monitoring</p>
      </div>
      <div class="flex gap-2 mt-8">
        <div class="w-3 h-3 rounded-full bg-white animate-pulse"></div>
        <div class="w-3 h-3 rounded-full bg-white animate-pulse" style="animation-delay: 0.2s;"></div>
        <div class="w-3 h-3 rounded-full bg-white animate-pulse" style="animation-delay: 0.4s;"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import jrmsuLogo from '../assets/jrmsu-logo.webp'

const router = useRouter()

// Check both sessionStorage and localStorage for department
const getUserDepartment = () => {
  const sessionDept = sessionStorage.getItem('userDepartment')
  const localDept = localStorage.getItem('userDepartment')
  const userDataStr = localStorage.getItem('userData')
  
  if (sessionDept) return sessionDept
  if (localDept) return localDept
  
  // Try to parse userData to get department
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr)
      return userData.program || userData.department
    } catch (e) {
      console.error('Failed to parse userData:', e)
    }
  }
  
  return 'ccs' // default to CCS
}

const userDept = computed(() => getUserDepartment())
const isCOE = computed(() => userDept.value?.toLowerCase().includes('coe'))

const departmentLogo = computed(() => {
  return isCOE.value ? '/icons/coe.svg' : jrmsuLogo
})

const loadingScreenStyle = computed(() => {
  if (isCOE.value) {
    return {
      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.7) 0%, rgba(220, 38, 38, 0.7) 100%), url(/assets/classroom-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }
  }
  return {
    background: 'linear-gradient(135deg, rgba(30, 59, 219, 0.7) 0%, rgba(79, 98, 255, 0.7) 100%), url(/assets/classroom-bg.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  }
})

// List of all images to preload
const imagesToPreload = [
  '/user.svg',
  '/key.svg',
  '/mail.svg',
  '/register_user.svg',
  '/arrow_down.svg',
  '/course.svg',
  '/book.svg',
  '/detector.svg',
  '/calendar.svg',
  '/event_note.svg',
  '/home.svg',
  '/logout.svg',
  '/help.svg',
  '/visibility_on.svg',
  '/visibility_off.svg',
  '/classroom-bg.jpg',
  jrmsuLogo
]

const preloadImages = () => {
  return Promise.all(
    imagesToPreload.map(
      (imageSrc) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = resolve // Resolve on error too, so we don't wait indefinitely
          img.src = imageSrc
        })
    )
  )
}

onMounted(async () => {
  // Preload all images before proceeding
  await preloadImages()
  
  // Give a small buffer to ensure rendering is complete
  setTimeout(() => {
    router.push('/')
  }, 500)
})
</script>

<style>
.loading-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
