<template>
  <div class="loading-screen" :style="loadingScreenStyle">
    <ParticleBackground />
    <div class="flex flex-col items-center justify-center gap-4 text-center relative z-10">
      <div class="w-32 h-32 flex items-center justify-center animate-bounce">
        <img :src="departmentLogo" :alt="isCOE ? 'COE Logo' : 'JRMSU CCS Logo'" class="w-full h-full object-contain drop-shadow-2xl" />
      </div>
      <div>
        <h1 class="text-6xl font-extrabold italic text-white mb-1 tracking-wide drop-shadow-lg">SSAAM</h1>
        <p class="text-xs sm:text-sm md:text-base text-white opacity-90 px-8">Student School Activities Attendance Monitoring</p>
        <p class="text-xs text-white/70 mt-3">Jose Rizal Memorial State University</p>
      </div>
      <div class="flex gap-2 mt-4">
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
import ParticleBackground from './ParticleBackground.vue'

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
      background: 'linear-gradient(135deg, rgba(74, 18, 7, 0.82) 0%, rgba(124, 34, 16, 0.82) 100%), url(/assets/classroom-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }
  }
  // default/CCS — dark blue with side silhouette
  return {
    background: 'linear-gradient(160deg, rgba(20, 65, 200, 0.58) 0%, rgba(8, 28, 125, 0.72) 100%), url(/jrmsu-landscape.jpg) center 35% / cover no-repeat'
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
  const minWait = new Promise(resolve => setTimeout(resolve, 3000))
  // Run preloading and minimum wait in parallel
  await Promise.all([preloadImages(), minWait])
  router.push('/')
})
</script>

<style>
.loading-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
</style>
