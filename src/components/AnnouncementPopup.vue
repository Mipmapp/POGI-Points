<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible && announcements.length > 0" class="fixed inset-0 bg-black bg-opacity-50 z-[59]" @click="close"></div>
    </Transition>
    <Transition name="popup-slide-up">
      <div v-if="visible && announcements.length > 0" class="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
        <div 
          class="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-3 sm:mx-4 overflow-hidden max-h-[80vh] flex flex-col pointer-events-auto"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
        <div class="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">Latest Announcements</h3>
              <p class="text-white text-opacity-90 text-xs font-medium">{{ currentIndex + 1 }} of {{ announcements.length }}</p>
            </div>
          </div>
          <button @click="close" class="text-white text-opacity-80 hover:text-opacity-100 transition active:scale-90 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="relative flex-1 overflow-hidden">
          <div 
            class="flex transition-transform duration-300 ease-out h-full"
            :style="{ transform: `translateX(calc(-${currentIndex * 100}% + ${swipeOffset}px))` }"
          >
            <div 
              v-for="announcement in announcements" 
              :key="announcement._id"
              class="w-full flex-shrink-0 p-5 sm:p-7 overflow-y-auto"
              style="min-height: 150px; max-height: 65vh;"
            >
              <div class="flex items-start gap-4 mb-5">
                <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden shadow-md', announcement.posted_by === 'admin' ? 'bg-gradient-to-br from-blue-500 to-blue-500' : 'bg-gradient-to-br from-yellow-500 to-amber-600']">
                  <img v-if="announcement.posted_by === 'admin'" src="/assets/ssaam_logo.jpg" alt="SSAAM" class="w-full h-full object-cover" />
                  <img v-else-if="announcement.posted_by === 'medpub'" src="/media_pub_logo.png" alt="Media and Publication" class="w-6 h-6 object-contain" />
                  <span v-else>{{ getInitials(announcement.posted_by_name) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span :class="['font-bold text-sm', announcement.posted_by === 'admin' ? 'text-blue-900' : 'text-yellow-900']" v-html="formatPosterName(announcement)">
                    </span>
                    <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold', announcement.posted_by === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-amber-200 text-amber-800']">
                      {{ announcement.posted_by === 'admin' ? 'Admin' : 'Organization' }}
                    </span>
                    <span v-if="announcement.priority === 'urgent'" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      Urgent
                    </span>
                  </div>
                  <div v-if="announcement.posted_by === 'medpub'" class="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                    <span>posted by</span>
                    <div class="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600 relative ring-1 ring-white">
                      <span class="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white uppercase">{{ (announcement.posted_by_name || 'U').charAt(0) }}</span>
                      <img v-if="announcement.poster_photo" :src="announcement.poster_photo" :alt="announcement.posted_by_name" class="w-full h-full object-cover absolute inset-0 z-10" />
                    </div>
                    <span class="font-semibold text-gray-800">{{ announcement.posted_by_name }}</span>
                  </div>
                  <p class="text-xs text-gray-500">{{ formatDate(announcement.created_at) }}</p>
                </div>
              </div>

              <h4 class="text-lg font-bold text-gray-900 mb-2.5 leading-tight">{{ announcement.title }}</h4>
              <div class="text-gray-700 text-sm whitespace-pre-wrap break-words leading-relaxed mb-4" v-html="formatMessage(announcement.message)"></div>

              <div v-if="announcement.image_url" class="mt-4 w-full rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
                <img 
                  :src="announcement.image_url" 
                  :alt="announcement.title"
                  class="w-full max-h-96 sm:max-h-[600px] object-contain bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer hover:opacity-95 transition"
                  @click="$emit('preview-image', announcement.image_url)"
                />
              </div>

              <div class="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
                <button 
                  @click.stop="$emit('toggle-like', announcement)"
                  class="flex items-center gap-2 text-gray-600 text-sm hover:text-blue-500 transition group px-3 py-2 -ml-3 rounded-lg hover:bg-blue-50 active:scale-95"
                >
                  <svg 
                    :class="['w-5 h-5 transition-all duration-300', isLiked(announcement) ? 'text-blue-500 scale-125' : 'group-hover:scale-110']" 
                    :fill="isLiked(announcement) ? 'currentColor' : 'none'" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                  <span :class="['font-semibold text-sm', isLiked(announcement) ? 'text-blue-500' : 'text-gray-600']">{{ announcement.liked_by?.length || 0 }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="px-4 sm:px-6 py-4 sm:py-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <button 
            @click="prevSlide" 
            :disabled="currentIndex === 0"
            :class="['flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition', currentIndex === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100 active:scale-95']"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span class="hidden sm:inline">Previous</span>
          </button>

          <div class="flex gap-2 items-center">
            <button 
              v-for="(_, index) in announcements" 
              :key="index"
              @click="goToSlide(index)"
              :class="['rounded-full transition-all duration-300 hover:scale-110', index === currentIndex ? 'bg-gradient-to-r from-blue-600 to-blue-500 h-2.5 w-8 shadow-md' : 'bg-gray-300 h-2 w-2 hover:bg-gray-400 hover:scale-125']"
            ></button>
          </div>

          <button 
            @click="nextSlide" 
            :disabled="currentIndex === announcements.length - 1"
            :class="['flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition', currentIndex === announcements.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100 active:scale-95']"
          >
            <span class="hidden sm:inline">Next</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        <div class="px-4 sm:px-6 pb-4 sm:pb-5 bg-gray-50">
          <button 
            @click="close" 
            class="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg active:scale-95"
          >
            Got it!
          </button>
        </div>
      </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  announcements: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'preview-image', 'toggle-like'])

const isLiked = (announcement) => {
  if (!announcement.liked_by || !Array.isArray(announcement.liked_by)) return false
  
  // Check current user ID passed as prop
  if (props.currentUserId && announcement.liked_by.includes(props.currentUserId)) {
    return true
  }
  
  // Also check the server-provided userLikeId from localStorage (for consistency)
  const userLikeId = localStorage.getItem('userLikeId')
  if (userLikeId && announcement.liked_by.includes(userLikeId)) {
    return true
  }
  
  return false
}

const currentIndex = ref(0)
const swipeOffset = ref(0)
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)

watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentIndex.value = 0
    swipeOffset.value = 0
  }
})

const close = () => {
  emit('close')
}

const prevSlide = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const nextSlide = () => {
  if (currentIndex.value < props.announcements.length - 1) {
    currentIndex.value++
  }
}

const goToSlide = (index) => {
  currentIndex.value = index
}

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isSwiping.value = true
}

const handleTouchMove = (e) => {
  if (!isSwiping.value) return
  
  const diffX = e.touches[0].clientX - touchStartX.value
  const diffY = Math.abs(e.touches[0].clientY - touchStartY.value)
  
  if (diffY > Math.abs(diffX)) {
    isSwiping.value = false
    swipeOffset.value = 0
    return
  }
  
  if (currentIndex.value === 0 && diffX > 0) {
    swipeOffset.value = diffX * 0.3
  } else if (currentIndex.value === props.announcements.length - 1 && diffX < 0) {
    swipeOffset.value = diffX * 0.3
  } else {
    swipeOffset.value = diffX
  }
}

const handleTouchEnd = (e) => {
  if (!isSwiping.value) return
  
  const threshold = 80
  
  if (swipeOffset.value < -threshold && currentIndex.value < props.announcements.length - 1) {
    currentIndex.value++
  } else if (swipeOffset.value > threshold && currentIndex.value > 0) {
    currentIndex.value--
  }
  
  swipeOffset.value = 0
  isSwiping.value = false
}

const formatPosterName = (announcement) => {
  if (announcement.posted_by === 'admin') {
    return 'SSAAM'
  }
  return 'Media and Publication'
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatMessage = (message) => {
  if (!message) return ''
  
  // Unescape slashes from source first
  let unescapedMessage = message.replace(/&#x2F;/g, '/').replace(/&#47;/g, '/')

  // Platform icons mapping (using SVG paths or common emojis as fallback)
  const icons = {
    fb: 'https://cdn-icons-png.flaticon.com/512/124/124010.png',
    facebook: 'https://cdn-icons-png.flaticon.com/512/124/124010.png',
    insta: 'https://cdn-icons-png.flaticon.com/512/174/174855.png',
    instagram: 'https://cdn-icons-png.flaticon.com/512/174/174855.png',
    tiktok: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
    discord: 'https://cdn-icons-png.flaticon.com/512/3670/3670157.png',
    telegram: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
    whatsapp: 'https://cdn-icons-png.flaticon.com/512/733/733585.png'
  }

  // Regex to match [platform][name][link]
  const pattern = /\[(fb|facebook|insta|instagram|tiktok|discord|telegram|whatsapp)\]\[(.*?)\]\[(.*?)\]/gi

  // Use a placeholder strategy to prevent escaping the HTML we generate
  const socialTags = []
  const textWithPlaceholders = unescapedMessage.replace(pattern, (match, platform, name, link) => {
    const iconUrl = icons[platform.toLowerCase()]
    const fullLink = link.startsWith('http') ? link : `https://${link}`
    const tag = `<a href="${fullLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold no-underline align-middle"><img src="${iconUrl}" alt="${platform}" class="w-4 h-4 object-contain" /><span>${name}</span></a>`
    socialTags.push(tag)
    return `__SOCIAL_TAG_${socialTags.length - 1}__`
  })

  // Escape the remaining text for safety
  let escapedText = textWithPlaceholders
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Restore the social tags
  socialTags.forEach((tag, index) => {
    escapedText = escapedText.replace(`__SOCIAL_TAG_${index}__`, tag)
  })

  return escapedText
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-PH', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>

<style scoped>
.fade-enter-active {
  transition: opacity 0.3s ease;
}

.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.popup-slide-up-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.popup-slide-up-leave-active {
  transition: all 0.2s ease-in;
}

.popup-slide-up-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.popup-slide-up-enter-to {
  opacity: 1;
  transform: scale(1);
}

.popup-slide-up-leave-from {
  opacity: 1;
  transform: scale(1);
}

.popup-slide-up-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
