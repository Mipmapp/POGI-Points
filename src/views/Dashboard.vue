<template>
  <!-- Image Preview Modal -->
  <div v-if="showImagePreviewModal" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" @click.self="showImagePreviewModal = false">
    <button @click="showImagePreviewModal = false" class="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10">&times;</button>
    <a :href="imagePreviewUrl" :download="getImageFileName(imagePreviewUrl)" class="absolute top-4 left-4 bg-white bg-opacity-20 hover:bg-opacity-40 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition z-10" @click.stop>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
      Download
    </a>
    <img :src="imagePreviewUrl" alt="Preview" class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" @click.stop />
  </div>

  <div v-if="showLogoutConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showLogoutConfirmation = false">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
      <h3 class="text-2xl font-bold text-purple-900 mb-4">Confirm Logout</h3>
      <p class="text-gray-600 mb-6">Are you sure you want to exit? You'll be logged out of your account.</p>
      <div class="flex gap-3">
        <button @click="showLogoutConfirmation = false" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition">
          Cancel
        </button>
        <button @click="confirmLogout" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition">
          Logout
        </button>
      </div>
    </div>
  </div>

  <!-- Contact Modal -->
  <div v-if="showContactModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40" @click.self="showContactModal = false">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Need Help?</h3>
        <button @click="showContactModal = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div class="flex flex-col items-center text-center p-4 bg-purple-50 rounded-lg">
          <div class="w-8 h-8 mb-3 gradient-icon" style="-webkit-mask: url(/mail.svg) center/contain no-repeat; mask: url(/mail.svg) center/contain no-repeat;"></div>
          <p class="font-semibold text-purple-900 text-sm">Email Support</p>
          <p class="text-xs text-gray-600 mt-2">admin@ssaam.edu</p>
          <p class="text-xs text-gray-500 mt-1">For general inquiries</p>
        </div>

        <div class="flex flex-col items-center text-center p-4 bg-pink-50 rounded-lg">
          <div class="w-8 h-8 mb-3 gradient-icon" style="-webkit-mask: url(/home.svg) center/contain no-repeat; mask: url(/home.svg) center/contain no-repeat;"></div>
          <p class="font-semibold text-purple-900 text-sm">JRMSU CCS Office</p>
          <p class="text-xs text-gray-600 mt-2">College of Computer Studies</p>
          <p class="text-xs text-gray-500 mt-1">Visit during office hours</p>
        </div>

        <div class="flex flex-col items-center text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
          <div class="w-8 h-8 mb-3 gradient-icon" style="-webkit-mask: url(/register_user.svg) center/contain no-repeat; mask: url(/register_user.svg) center/contain no-repeat;"></div>
          <p class="font-semibold text-purple-900 text-sm">Meet Our Developers</p>
          <p class="text-xs text-gray-600 mt-2">CCS - Creatives Committee</p>
          <button @click="showDevelopersPopup = true; showContactModal = false" class="text-xs text-purple-600 hover:text-purple-800 font-medium mt-2 underline">View Team →</button>
        </div>
      </div>

      <div class="bg-blue-50 rounded-lg p-4 mb-6">
        <p class="text-sm text-blue-900 font-medium mb-3">Quick Help</p>
        <ul class="text-xs text-blue-800 space-y-2">
          <li>• First time login? Your default password is your Last Name (uppercase)</li>
          <li>• Changed your password and forgot it? Use the Forgot Password option on the login page</li>
          <li>• Looking for your RFID? Register it to the CCS office</li>
          <li>• Profile problems? Contact Developers or Proceed to the CCS office</li>
        </ul>
      </div>

      <button @click="showContactModal = false" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition">
        Close
      </button>
    </div>
  </div>

  <div v-if="showDevelopersPopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showDevelopersPopup = false">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Meet Our Developers</h3>
        <button @click="showDevelopersPopup = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-6">
        <a v-for="dev in developers" :key="dev.name" :href="dev.facebook" target="_blank" rel="noopener noreferrer" class="flex flex-col items-center cursor-pointer hover:transform hover:scale-105 transition">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg mb-3 overflow-hidden flex-shrink-0">
            <img v-if="dev.image" :src="dev.image" :alt="dev.name" class="w-full h-full object-cover" />
            <span v-else>{{ dev.initials }}</span>
          </div>
          <p class="text-xs font-semibold text-purple-600 hover:text-purple-800 text-center line-clamp-2 min-h-[2rem] flex items-center">{{ dev.name }}</p>
          <p class="text-xs text-gray-600 text-center line-clamp-1 font-medium">{{ dev.year_level }} - {{ dev.program }}</p>
          <p class="text-xs text-gray-500 text-center line-clamp-1">{{ dev.role }}</p>
        </a>
      </div>
      <div class="text-center text-sm text-gray-600">
        <p class="font-medium text-purple-900">CCS - Creatives Committee</p>
        <p>Chairperson: Sheen Lee</p>
      </div>
    </div>
  </div>

  <!-- Clear Sessions Confirmation Modal -->
  <div v-if="showClearSessionsConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showClearSessionsConfirm = false">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-red-900">Clear All Sessions</h3>
        <button @click="showClearSessionsConfirm = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      
      <div class="mb-6">
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4">
          <div class="flex items-start gap-3">
            <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <div>
              <p class="text-sm text-red-800 font-medium">Are you sure you want to clear all session tokens?</p>
              <p class="text-xs text-red-700 mt-1">This will force logout ALL users from the system immediately. They will need to log in again.</p>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-600">Your current session will remain active.</p>
      </div>
      
      <div class="flex gap-3">
        <button 
          @click="showClearSessionsConfirm = false" 
          class="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          Cancel
        </button>
        <button 
          @click="clearAllSessionTokens" 
          class="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
          :disabled="clearingSessionTokens"
        >
          <svg v-if="clearingSessionTokens" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span>{{ clearingSessionTokens ? 'Clearing...' : 'Yes, Clear All' }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- RFID Scanner Fullscreen Modal -->
  <div v-if="rfidFullscreenMode" class="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex flex-col items-center justify-center z-[70]">
    <button @click="rfidFullscreenMode = false" class="absolute top-6 right-6 text-white hover:text-pink-300 transition">
      <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
    
    <div class="text-center mb-8">
      <img src="/src/assets/jrmsu-logo.webp" alt="JRMSU" class="w-24 h-24 mx-auto mb-4 drop-shadow-2xl" />
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-2">SSAAM</h1>
      <p class="text-white text-opacity-80 text-lg">{{ selectedEvent?.title || 'Select an Event' }}</p>
      <p v-if="selectedEvent" class="text-white text-opacity-60 text-sm mt-1">{{ formatEventDate(selectedEvent.date || selectedEvent.event_date) }}</p>
    </div>
    
    <div class="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 md:p-12 max-w-2xl w-full mx-4 border border-white border-opacity-20">
      <div class="text-center mb-8">
        <svg class="w-24 h-24 mx-auto mb-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4h4v4H3V4zm0 8h4v4H3v-4zm0 8h4v4H3v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4z"></path></svg>
        <p class="text-2xl font-semibold text-white mb-2">Ready for RFID Scan</p>
        <p class="text-white text-opacity-70">Scan your RFID card to check in/out</p>
      </div>
      
      <input 
        ref="rfidFullscreenInputRef"
        v-model="rfidInput"
        @keydown="handleRfidKeydown"
        type="text"
        placeholder="Waiting for RFID scan..."
        class="w-full px-6 py-4 text-center text-xl bg-white bg-opacity-20 border-2 border-white border-opacity-30 rounded-2xl focus:border-pink-400 focus:ring-4 focus:ring-pink-300 focus:ring-opacity-50 outline-none text-white placeholder-white placeholder-opacity-50"
        :disabled="rfidProcessing"
        autofocus
      />
      
      <div v-if="rfidProcessing" class="mt-6 flex items-center justify-center gap-3 text-white">
        <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        <span class="text-xl">Processing...</span>
      </div>
      
      <!-- RFID Result Display with Photo -->
      <transition name="fade">
        <div v-if="rfidResult" :class="['mt-6 p-6 rounded-2xl text-center', rfidResult.success ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-red-500 bg-opacity-80']">
          <div v-if="rfidResult.success && rfidResult.student" class="flex flex-col items-center">
            <div class="w-24 h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center overflow-hidden mb-4 ring-4 ring-white ring-opacity-50">
              <img v-if="rfidResult.student.photo" :src="rfidResult.student.photo" class="w-full h-full object-cover" @error="$event.target.style.display='none'" />
              <span v-else class="text-4xl font-bold text-white">{{ rfidResult.student.full_name?.charAt(0) || '?' }}</span>
            </div>
            <p class="text-2xl font-bold text-white mb-1">{{ rfidResult.action === 'check_in' ? 'Check-in Successful!' : 'Check-out Successful!' }}</p>
            <p class="text-xl text-white text-opacity-90">{{ rfidResult.student.full_name }}</p>
            <p class="text-sm text-white text-opacity-70 mt-1">{{ rfidResult.student.program }} | {{ rfidResult.student.year_level }}</p>
          </div>
          <div v-else>
            <p class="text-2xl font-bold text-white mb-2">Scan Failed</p>
            <p class="text-lg text-white text-opacity-90">{{ rfidResult.message }}</p>
          </div>
        </div>
      </transition>
    </div>
    
    <p class="text-white text-opacity-50 text-sm mt-8">Press ESC or click X to exit fullscreen</p>
  </div>

  <!-- Admin Key Modal -->
  <div v-if="showAdminKeyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="cancelAdminKeyModal">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Admin Verification Required</h3>
        <button @click="cancelAdminKeyModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      
      <div class="mb-4">
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
          <p class="text-sm text-yellow-800">
            This action requires admin verification. Please enter the admin key to continue.
          </p>
        </div>
        
        <label class="block text-sm font-medium text-gray-700 mb-2">Admin Key</label>
        <input 
          v-model="adminKeyInput" 
          type="password" 
          placeholder="Enter admin key"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          @keyup.enter="submitAdminKey"
          :disabled="adminKeyLoading"
        />
        <p v-if="adminKeyError" class="text-red-500 text-sm mt-2">{{ adminKeyError }}</p>
      </div>
      
      <div class="flex gap-3">
        <button 
          @click="cancelAdminKeyModal" 
          class="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
          :disabled="adminKeyLoading"
        >
          Cancel
        </button>
        <button 
          @click="submitAdminKey" 
          class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition flex items-center justify-center gap-2"
          :disabled="adminKeyLoading || !adminKeyInput"
        >
          <svg v-if="adminKeyLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ adminKeyLoading ? 'Verifying...' : 'Verify & Continue' }}</span>
        </button>
      </div>
    </div>
  </div>

  <div v-if="isPageLoading" class="fixed inset-0 bg-gradient-to-b from-purple-600 to-pink-400 flex items-center justify-center z-50">
    <div class="text-center text-white">
      <svg class="animate-spin h-16 w-16 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-xl font-semibold">Loading Dashboard...</p>
      <p class="text-sm opacity-75 mt-2">Please wait while we fetch your data</p>
    </div>
  </div>

  <!-- Logout Animation -->
  <transition name="fade">
    <div v-if="showLogoutAnimation" class="fixed inset-0 bg-gradient-to-b from-purple-600 to-pink-400 flex items-center justify-center z-50">
      <div class="text-center text-white">
        <svg class="animate-spin h-16 w-16 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xl font-semibold">Logging Out...</p>
        <p class="text-sm opacity-75 mt-2">See you soon!</p>
      </div>
    </div>
  </transition>

  <!-- Mobile Menu Overlay with Animation -->
  <transition name="fade">
    <div v-if="showMobileMenu" class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" @click="showMobileMenu = false"></div>
  </transition>

  <div class="flex h-screen flex-col md:flex-row">
    <!-- Sidebar (Hidden on mobile, visible on desktop) -->
    <div class="hidden md:flex w-64 bg-gradient-to-b from-purple-600 to-pink-400 text-white flex-col order-1 border-r-2 border-white border-opacity-20 h-screen">
      <div class="p-6 border-b border-white border-opacity-20 flex-shrink-0">
        <div class="flex items-center justify-center mb-2">
          <img src="/src/assets/jrmsu-logo.webp" alt="JRMSU CCS Logo" class="w-32 h-32 object-contain drop-shadow-xl" />
        </div>
        <h1 class="text-xl font-bold text-center">SSAAM</h1>
      </div>

      <div class="p-6 border-b border-white border-opacity-20 flex-shrink-0">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-2xl overflow-hidden">
            <div v-if="sidebarImageLoading && !sidebarImageFailed" class="w-full h-full flex items-center justify-center">
              <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <img v-else-if="(currentUser.image || currentUser.photo) && !sidebarImageFailed" :src="currentUser.image || currentUser.photo" alt="Profile" class="w-full h-full object-cover" @load="() => { sidebarImageLoading = false; sidebarImageFailed = false; }" @error="handleSidebarImageError" />
            <img v-else :src="currentUser.role === 'admin' || currentUser.isMaster ? '/user_admin.svg' : '/user.svg'" alt="Profile" class="w-6 h-6" style="filter: brightness(0) invert(1);" />
          </div>
          <div>
            <p class="text-sm">Welcome back,</p>
            <p class="font-bold">{{ displayName }}!</p>
            <div class="flex flex-wrap gap-1 mt-1" v-if="!currentUser.isMaster && currentUser.role !== 'admin'">
              <span :class="['text-xs px-2 py-0.5 rounded-full', currentUser.role === 'medpub' ? 'bg-yellow-400 text-yellow-900' : 'bg-white bg-opacity-30']">
                {{ currentUser.role === 'medpub' ? 'Medpub' : 'Student' }}
              </span>
              <span :class="['text-xs px-2 py-0.5 rounded-full', currentUser.rfid_status === 'verified' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900']">
                {{ currentUser.rfid_status === 'verified' ? 'Verified' : 'Unverified' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 overflow-y-auto min-h-0 sidebar-scroll">
        <button @click="currentPage = 'dashboard'" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left', currentPage === 'dashboard' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
          <img src="/home.svg" alt="Dashboard" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
          <span>Dashboard</span>
        </button>
        <button v-if="currentUser.role === 'admin' || currentUser.isMaster" @click="currentPage = 'users'; showMobileMenu = false" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'users' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
          <img src="/user.svg" alt="Users" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
          <span>Manage</span>
        </button>
        <button v-if="currentUser.role === 'admin' || currentUser.isMaster" @click="currentPage = 'pending'; fetchPendingStudents()" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'pending' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="flex items-center gap-2">Pending <span v-if="pendingCount > 0" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{{ pendingCount }}</span></span>
        </button>
        <button v-if="currentUser.role === 'admin' || currentUser.isMaster" @click="currentPage = 'settings'; fetchSettings()" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'settings' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span>Settings</span>
        </button>
        <button @click="currentPage = 'attendance'; fetchAttendanceData()" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'attendance' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          <span>Attendance</span>
        </button>
        <button @click="currentPage = 'notifications'; fetchNotifications(); markNotificationsAsSeen()" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'notifications' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          <span class="flex items-center gap-2">Notifications <span v-if="unreadNotificationCount > 0" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{{ unreadNotificationCount }}</span></span>
        </button>
        <button 
          @click="handleLogoutWithAnimation"
          :class="['flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 w-full text-left mt-2 transition-all duration-300', isLoggingOut ? 'scale-95 opacity-70' : '']"
        >
          <img src="/logout.svg" alt="Log Out" :class="['w-5 h-5 transition-transform duration-300', isLoggingOut ? 'rotate-180' : '']" style="filter: brightness(0) invert(1);" />
          <span>Log Out</span>
        </button>
      </nav>

      <div class="p-4 text-xs text-white opacity-75 flex-shrink-0">
        <p>Powered by</p>
        <button @click="showDevelopersPopup = true" class="text-yellow-300 hover:text-yellow-400 cursor-pointer">CCS - Creatives Committee</button>
      </div>
    </div>

    <!-- Mobile Sidebar (Slide-in menu for mobile) with Animation -->
    <transition name="slide-in">
      <div v-if="showMobileMenu" class="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-600 to-pink-400 text-white flex flex-col z-40 md:hidden shadow-2xl">
        <button @click="showMobileMenu = false" class="p-4 text-right text-2xl hover:text-gray-200 flex-shrink-0">×</button>
        
        <div class="p-6 border-b border-white border-opacity-20 flex-shrink-0">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-2xl overflow-hidden">
              <div v-if="sidebarImageLoading && !sidebarImageFailed" class="w-full h-full flex items-center justify-center">
                <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <img v-else-if="(currentUser.image || currentUser.photo) && !sidebarImageFailed" :src="currentUser.image || currentUser.photo" alt="Profile" class="w-full h-full object-cover" @load="() => { sidebarImageLoading = false; sidebarImageFailed = false; }" @error="handleSidebarImageError" />
              <img v-else :src="currentUser.role === 'admin' || currentUser.isMaster ? '/user_admin.svg' : '/user.svg'" alt="Profile" class="w-6 h-6" style="filter: brightness(0) invert(1);" />
            </div>
            <div>
              <p class="text-sm">Welcome back,</p>
              <p class="font-bold">{{ displayName }}!</p>
              <div class="flex flex-wrap gap-1 mt-1" v-if="!currentUser.isMaster && currentUser.role !== 'admin'">
                <span :class="['text-xs px-2 py-0.5 rounded-full', currentUser.role === 'medpub' ? 'bg-yellow-400 text-yellow-900' : 'bg-white bg-opacity-30']">
                  {{ currentUser.role === 'medpub' ? 'Medpub' : 'Student' }}
                </span>
                <span :class="['text-xs px-2 py-0.5 rounded-full', currentUser.rfid_status === 'verified' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900']">
                  {{ currentUser.rfid_status === 'verified' ? 'Verified' : 'Unverified' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-4 overflow-y-auto min-h-0 sidebar-scroll">
          <button @click="currentPage = 'dashboard'" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left', currentPage === 'dashboard' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
            <img src="/home.svg" alt="Dashboard" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
            <span>Dashboard</span>
          </button>
          <button v-if="currentUser.role === 'admin' || currentUser.isMaster" @click="currentPage = 'users'; showMobileMenu = false" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'users' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
            <img src="/user.svg" alt="Users" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
            <span>Manage</span>
          </button>
          <button v-if="currentUser.role === 'admin' || currentUser.isMaster" @click="currentPage = 'pending'; showMobileMenu = false; fetchPendingStudents()" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'pending' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="flex items-center gap-2">Pending <span v-if="pendingCount > 0" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{{ pendingCount }}</span></span>
          </button>
          <button v-if="currentUser.role === 'admin' || currentUser.isMaster" @click="currentPage = 'settings'; showMobileMenu = false; fetchSettings()" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'settings' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span>Settings</span>
          </button>
          <button @click="currentPage = 'attendance'; showMobileMenu = false; fetchAttendanceData()" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'attendance' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <span>Attendance</span>
          </button>
          <button @click="currentPage = 'notifications'; showMobileMenu = false; fetchNotifications(); markNotificationsAsSeen()" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'notifications' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span class="flex items-center gap-2">Notifications <span v-if="unreadNotificationCount > 0" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{{ unreadNotificationCount }}</span></span>
          </button>
          <button 
            @click="handleLogoutWithAnimation"
            :class="['flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 w-full text-left mt-2 transition-all duration-300', isLoggingOut ? 'scale-95 opacity-70' : '']"
          >
            <img src="/logout.svg" alt="Log Out" :class="['w-5 h-5 transition-transform duration-300', isLoggingOut ? 'rotate-180' : '']" style="filter: brightness(0) invert(1);" />
            <span>Log Out</span>
          </button>
        </nav>

        <div class="p-4 text-xs text-white opacity-75 flex-shrink-0">
          <p>Powered by</p>
          <button @click="showDevelopersPopup = true" class="text-yellow-300 hover:text-yellow-400 cursor-pointer">CCS - Creatives Committee</button>
        </div>
      </div>
    </transition>

    <!-- Main Content Area -->
    <div class="flex-1 bg-gray-100 overflow-auto order-2 md:order-2">
      <!-- Mobile Header with Hamburger Menu -->
      <div class="md:hidden sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-20 shadow">
        <h1 class="text-xl font-bold text-purple-900">SSAAM</h1>
        <div class="flex items-center gap-2">
          <button @click="showContactModal = true" class="p-2 hover:bg-purple-100 rounded-lg transition">
            <img src="/help.svg" alt="Help" class="w-5 h-5 text-purple-600" />
          </button>
          <button @click="showMobileMenu = true" class="text-2xl text-purple-900 hover:text-purple-700">☰</button>
        </div>
      </div>

      <!-- Desktop Help Button (bottom right, with spacing from scrollbar) -->
      <div class="hidden md:block fixed bottom-8 right-8 z-20">
        <button @click="showContactModal = true" class="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full w-14 h-14 flex items-center justify-center hover:from-purple-700 hover:to-pink-600 transition-all duration-300 shadow-lg hover:scale-110 active:scale-95 hover:shadow-xl">
          <img src="/help.svg" alt="Help" class="w-6 h-6" style="filter: brightness(0) invert(1);" />
        </button>
      </div>

      <div class="p-4 md:p-8">
        <h1 class="hidden md:block text-2xl md:text-4xl font-bold text-purple-900 mb-8 pb-4 border-b-2 border-purple-900">{{ currentPage === 'users' ? 'Manage' : currentPage === 'settings' ? 'Settings' : currentPage === 'pending' ? 'Pending Approvals' : currentPage === 'notifications' ? 'Notifications' : currentPage === 'attendance' ? 'Attendance' : 'Dashboard' }}</h1>

        <!-- Password Update Warning Banner -->
        <div v-if="showPasswordUpdateWarning && !currentUser.isMaster && currentUser.role !== 'admin'" class="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
          <div class="flex items-start gap-3">
            <svg class="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-yellow-800">Security Recommendation</h3>
              <p class="text-sm text-yellow-700 mt-1">Your password is still set to your last name. For better security, please change your password.</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button @click="showPasswordChangeModal = true; showPasswordUpdateWarning = false" class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition">
                  Change Password
                </button>
                <button @click="showPasswordUpdateWarning = false" class="text-yellow-700 hover:text-yellow-800 text-sm px-3 py-1.5 font-medium transition">
                  Remind Me Later
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Page -->
        <div v-if="currentPage === 'settings' && (currentUser.role === 'admin' || currentUser.isMaster)" class="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 class="text-xl md:text-2xl font-bold text-purple-900">Access Control Settings</h2>
            <button @click="fetchSettings" :disabled="settingsLoading" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              <svg v-if="settingsLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              {{ settingsLoading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>

          <div v-if="settingsLoading" class="flex items-center justify-center py-12">
            <svg class="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <div v-else class="space-y-8">
            <!-- User Registration Toggle -->
            <div class="border border-gray-200 rounded-xl p-6">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-purple-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                    User Registration
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">Allow new students to create accounts</p>
                </div>
                <button 
                  @click="appSettings.userRegister.register = !appSettings.userRegister.register" 
                  :class="['relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300', appSettings.userRegister.register ? 'bg-green-500' : 'bg-gray-300']"
                >
                  <span :class="['inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300', appSettings.userRegister.register ? 'translate-x-7' : 'translate-x-1']"></span>
                </button>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <span :class="['text-sm font-medium px-3 py-1 rounded-full', appSettings.userRegister.register ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                  {{ appSettings.userRegister.register ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <div v-if="!appSettings.userRegister.register" class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Message to display when registration is disabled:</label>
                <textarea 
                  v-model="appSettings.userRegister.message" 
                  placeholder="Enter a message to show users when registration is disabled..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none resize-none"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <!-- User Login Toggle -->
            <div class="border border-gray-200 rounded-xl p-6">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-purple-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                    User Login
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">Allow students to log into their accounts</p>
                </div>
                <button 
                  @click="appSettings.userLogin.login = !appSettings.userLogin.login" 
                  :class="['relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300', appSettings.userLogin.login ? 'bg-green-500' : 'bg-gray-300']"
                >
                  <span :class="['inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300', appSettings.userLogin.login ? 'translate-x-7' : 'translate-x-1']"></span>
                </button>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <span :class="['text-sm font-medium px-3 py-1 rounded-full', appSettings.userLogin.login ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                  {{ appSettings.userLogin.login ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <div v-if="!appSettings.userLogin.login" class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Message to display when login is disabled:</label>
                <textarea 
                  v-model="appSettings.userLogin.message" 
                  placeholder="Enter a message to show users when login is disabled..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none resize-none"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <!-- Clear Session Tokens Section -->
            <div class="border border-red-200 rounded-xl p-6 bg-red-50">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-red-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Clear All Session Tokens
                  </h3>
                  <p class="text-sm text-red-700 mt-1">Force logout all users from the system (except your current session)</p>
                </div>
                <button 
                  @click="showClearSessionsConfirm = true" 
                  :disabled="clearingSessionTokens"
                  class="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <svg v-if="clearingSessionTokens" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  {{ clearingSessionTokens ? 'Clearing...' : 'Clear All Sessions' }}
                </button>
              </div>
              <div class="bg-white rounded-lg p-3 border border-red-200">
                <p class="text-xs text-red-600"><strong>Warning:</strong> This action will log out all users from the system immediately. They will need to log in again. Your current session will remain active.</p>
              </div>
            </div>

            <!-- Save Button -->
            <div class="flex justify-end pt-4">
              <button 
                @click="saveSettings" 
                :disabled="settingsSaving"
                class="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg v-if="settingsSaving" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                {{ settingsSaving ? 'Saving...' : 'Save Settings' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Attendance Page -->
        <div v-if="currentPage === 'attendance'" class="space-y-6">
          <!-- Admin Attendance Management -->
          <div v-if="currentUser.role === 'admin' || currentUser.isMaster" class="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div class="flex items-center gap-4">
                <h2 class="text-xl font-bold text-purple-900">Attendance Events</h2>
                <div class="flex gap-2">
                  <button @click="attendanceTab = 'events'" :class="['px-4 py-2 rounded-lg text-sm font-medium transition', attendanceTab === 'events' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']">Events</button>
                  <button @click="switchToScannerTab" :class="['px-4 py-2 rounded-lg text-sm font-medium transition', attendanceTab === 'scanner' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']">RFID Scanner</button>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="fetchAttendanceData" :disabled="attendanceLoading" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                  <svg :class="['w-4 h-4', attendanceLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Refresh
                </button>
                <button @click="showCreateEventModal = true" class="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-600 transition flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Create Event
                </button>
              </div>
            </div>

            <!-- Events List Tab -->
            <div v-if="attendanceTab === 'events'">
              <div v-if="attendanceLoading" class="flex items-center justify-center py-12">
                <svg class="animate-spin h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div v-else-if="attendanceEvents.length === 0" class="text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                <p>No attendance events yet. Create one to get started!</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="event in attendanceEvents" :key="event._id" class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <h3 class="font-semibold text-lg text-purple-900">{{ event.title }}</h3>
                        <span :class="['px-2 py-1 rounded-full text-xs font-medium', getStatusBadgeClass(event.status)]">{{ event.status === 'active' ? 'Active' : event.status === 'draft' ? 'Draft' : event.status === 'closed' ? 'Closed' : event.status }}</span>
                        <span v-if="event.status === 'active' && getEventTimeRemaining(event._id)" :class="['px-2 py-1 rounded-full text-xs font-medium', getEventTimeRemaining(event._id) === 'Ended' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800']">
                          {{ getEventTimeRemaining(event._id) }}
                        </span>
                      </div>
                      <p v-if="event.description" class="text-gray-600 text-sm mb-2">{{ event.description }}</p>
                      <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          {{ formatEventDate(event.date || event.event_date) }}
                        </span>
                        <span v-if="event.startTime || event.start_time" class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {{ formatEventTime(event.startTime || event.start_time) }} - {{ formatEventTime(event.endTime || event.end_time) }}
                        </span>
                        <span v-if="event.location" class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          {{ event.location }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button @click="openEventLogs(event)" class="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition text-sm flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Logs
                      </button>
                      <button @click="openEditEvent(event)" class="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg hover:bg-yellow-200 transition text-sm flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Edit
                      </button>
                      <button @click="deleteAttendanceEvent(event._id)" class="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition text-sm flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- RFID Scanner Tab -->
            <div v-if="attendanceTab === 'scanner'" class="space-y-4">
              <!-- RFID Scanner Lock Controls -->
              <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Check-In/Out Controls
                </h3>
                <div class="grid md:grid-cols-2 gap-6">
                  <!-- Check-In Control -->
                  <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-3">
                      <span class="font-medium text-gray-700">Check-In</span>
                      <button 
                        @click="toggleCheckIn" 
                        :disabled="rfidScannerSaving"
                        :class="['relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300', appSettings.rfidScanner.checkInEnabled ? 'bg-green-500' : 'bg-gray-300']"
                      >
                        <span :class="['inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300', appSettings.rfidScanner.checkInEnabled ? 'translate-x-7' : 'translate-x-1']"></span>
                      </button>
                    </div>
                    <span :class="['text-sm font-medium px-3 py-1 rounded-full', appSettings.rfidScanner.checkInEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                      {{ appSettings.rfidScanner.checkInEnabled ? 'Enabled' : 'Disabled' }}
                    </span>
                    <!-- Timer controls -->
                    <div v-if="appSettings.rfidScanner.checkInEnabled" class="mt-3 pt-3 border-t border-gray-100">
                      <p class="text-xs text-gray-500 mb-2">Auto-disable after:</p>
                      <div class="flex items-center gap-2">
                        <input 
                          v-model.number="checkInTimerMinutes" 
                          type="number" 
                          min="1" 
                          max="1440"
                          class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 outline-none"
                        />
                        <span class="text-sm text-gray-600">minutes</span>
                        <button 
                          @click="setCheckInTimer" 
                          :disabled="rfidScannerSaving"
                          class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                        >
                          Set Timer
                        </button>
                      </div>
                      <p v-if="appSettings.rfidScanner.autoDisableCheckIn && appSettings.rfidScanner.checkInDisableAt" class="text-xs text-orange-600 mt-2">
                        Will disable at: {{ new Date(appSettings.rfidScanner.checkInDisableAt).toLocaleTimeString() }}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Check-Out Control -->
                  <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-3">
                      <span class="font-medium text-gray-700">Check-Out</span>
                      <button 
                        @click="toggleCheckOut" 
                        :disabled="rfidScannerSaving"
                        :class="['relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300', appSettings.rfidScanner.checkOutEnabled ? 'bg-green-500' : 'bg-gray-300']"
                      >
                        <span :class="['inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300', appSettings.rfidScanner.checkOutEnabled ? 'translate-x-7' : 'translate-x-1']"></span>
                      </button>
                    </div>
                    <span :class="['text-sm font-medium px-3 py-1 rounded-full', appSettings.rfidScanner.checkOutEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                      {{ appSettings.rfidScanner.checkOutEnabled ? 'Enabled' : 'Disabled' }}
                    </span>
                    <!-- Timer controls -->
                    <div v-if="appSettings.rfidScanner.checkOutEnabled" class="mt-3 pt-3 border-t border-gray-100">
                      <p class="text-xs text-gray-500 mb-2">Auto-disable after:</p>
                      <div class="flex items-center gap-2">
                        <input 
                          v-model.number="checkOutTimerMinutes" 
                          type="number" 
                          min="1" 
                          max="1440"
                          class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 outline-none"
                        />
                        <span class="text-sm text-gray-600">minutes</span>
                        <button 
                          @click="setCheckOutTimer" 
                          :disabled="rfidScannerSaving"
                          class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                        >
                          Set Timer
                        </button>
                      </div>
                      <p v-if="appSettings.rfidScanner.autoDisableCheckOut && appSettings.rfidScanner.checkOutDisableAt" class="text-xs text-orange-600 mt-2">
                        Will disable at: {{ new Date(appSettings.rfidScanner.checkOutDisableAt).toLocaleTimeString() }}
                      </p>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-3 text-center">These settings control whether students can check-in or check-out using the RFID scanner globally for all events.</p>
              </div>

              <div v-if="!selectedEvent" class="text-center py-8">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h4v4H3V4zm0 8h4v4H3v-4zm0 8h4v4H3v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4z"></path></svg>
                <p class="text-gray-500 mb-4">Select an event to start scanning RFID cards</p>
                <select v-model="selectedEvent" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
                  <option :value="null">-- Select Event --</option>
                  <option v-for="event in attendanceEvents.filter(e => e.status === 'active')" :key="event._id" :value="event">{{ event.title }} ({{ formatEventDate(event.date || event.event_date) }})</option>
                </select>
              </div>
              <div v-else class="space-y-4">
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-semibold text-purple-900">{{ selectedEvent.title }}</h3>
                      <p class="text-sm text-purple-600">{{ formatEventDate(selectedEvent.date || selectedEvent.event_date) }} | {{ formatEventTime(selectedEvent.startTime || selectedEvent.start_time) }} - {{ formatEventTime(selectedEvent.endTime || selectedEvent.end_time) }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button @click="enterFullscreenMode" class="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-600 transition flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                        Fullscreen
                      </button>
                      <button @click="selectedEvent = null" class="text-purple-600 hover:text-purple-800 p-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                  <svg class="w-20 h-20 mx-auto mb-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h4v4H3V4zm0 8h4v4H3v-4zm0 8h4v4H3v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v4h-4v-4z"></path></svg>
                  <p class="text-lg font-medium bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">Ready for RFID Scan</p>
                  <p class="text-sm text-gray-500 mb-4">Click below and scan an RFID card. Scanner input will be auto-detected.</p>
                  <input 
                    ref="rfidInputRef"
                    v-model="rfidInput"
                    @keydown="handleRfidKeydown"
                    type="text"
                    placeholder="Scan RFID card or type manually..."
                    class="w-full max-w-md mx-auto px-4 py-3 text-center text-lg border-2 border-purple-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                    :disabled="rfidProcessing"
                  />
                  <div v-if="rfidProcessing" class="mt-4 flex items-center justify-center gap-2 text-purple-600">
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </div>
                  <!-- Result display with photo -->
                  <div v-if="rfidResult" :class="['mt-4 p-4 rounded-lg', rfidResult.success ? 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200' : 'bg-red-100 text-red-800 border border-red-200']">
                    <div v-if="rfidResult.success && rfidResult.student" class="flex flex-col items-center">
                      <div class="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center overflow-hidden mb-3 ring-2 ring-white shadow-lg">
                        <img v-if="rfidResult.student.photo" :src="rfidResult.student.photo" class="w-full h-full object-cover" @error="$event.target.style.display='none'" />
                        <span v-else class="text-2xl font-bold text-white">{{ rfidResult.student.full_name?.charAt(0) || '?' }}</span>
                      </div>
                      <p class="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{{ rfidResult.action === 'check_in' ? 'Check-in Successful!' : 'Check-out Successful!' }}</p>
                      <p class="text-purple-800 font-medium">{{ rfidResult.student.full_name }}</p>
                      <p class="text-sm text-gray-600">{{ rfidResult.student.program }} | {{ rfidResult.student.year_level }}</p>
                    </div>
                    <div v-else>
                      <p class="font-medium">Scan Failed</p>
                      <p class="text-sm">{{ rfidResult.message }}</p>
                    </div>
                  </div>
                </div>

                <!-- Recent Logs -->
                <div class="mt-6">
                  <h4 class="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    Recent Attendance Logs
                    <span v-if="selectedEvent?.title" class="text-sm font-normal text-purple-600">- {{ selectedEvent.title }}</span>
                  </h4>
                  <div v-if="attendanceLogs.length === 0" class="text-center py-4 text-gray-500">
                    No attendance records yet for this event.
                  </div>
                  <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-4 py-2 text-left">Student</th>
                          <th class="px-4 py-2 text-left">Program</th>
                          <th class="px-4 py-2 text-left">Check-in</th>
                          <th class="px-4 py-2 text-left">Check-out</th>
                          <th class="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(log, index) in sortedAttendanceLogs.slice(0, 10)" :key="log._id" :class="['border-b transition-all duration-300', index === 0 && isRecentCheckIn(log) ? 'bg-gradient-to-r from-purple-50 to-pink-50 ring-2 ring-purple-300 ring-inset animate-pulse' : 'hover:bg-gray-50']">
                          <td class="px-4 py-2">
                            <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 flex items-center justify-center text-white text-xs overflow-hidden flex-shrink-0">
                                <img v-if="log.student_image || log.student?.photo" :src="log.student_image || log.student?.photo" class="w-full h-full object-cover" />
                                <span v-else>{{ (log.student?.full_name || log.student_name)?.charAt(0) || '?' }}</span>
                              </div>
                              <span class="font-medium">{{ log.student?.full_name || log.student_name }}</span>
                            </div>
                          </td>
                          <td class="px-4 py-2">{{ log.program || log.student?.program || '-' }}</td>
                          <td class="px-4 py-2">{{ (log.check_in_at || log.check_in_time) ? new Date(log.check_in_at || log.check_in_time).toLocaleTimeString() : '-' }}</td>
                          <td class="px-4 py-2">{{ (log.check_out_at || log.check_out_time) ? new Date(log.check_out_at || log.check_out_time).toLocaleTimeString() : '-' }}</td>
                          <td class="px-4 py-2">
                            <span :class="['px-2 py-1 rounded-full text-xs font-medium', (log.check_out_at || log.check_out_time) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800']">
                              {{ (log.check_out_at || log.check_out_time) ? 'Present' : 'Incomplete' }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Student Attendance View -->
          <div v-else class="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-purple-900">My Attendance</h2>
              <button @click="fetchAttendanceData" :disabled="attendanceLoading" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                <svg :class="['w-4 h-4', attendanceLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Refresh
              </button>
            </div>

            <div v-if="attendanceLoading" class="flex items-center justify-center py-12">
              <svg class="animate-spin h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div v-else-if="attendanceEvents.length === 0 && myAttendanceRecords.length === 0" class="text-center py-12 text-gray-500">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <p>No attendance events or records yet.</p>
            </div>
            <div v-else class="space-y-6">
              <!-- Active Events Section -->
              <div v-if="attendanceEvents.length > 0">
                <h3 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active Events
                </h3>
                <div class="space-y-3">
                  <div v-for="event in attendanceEvents" :key="event._id || event.event_id" class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h3 class="font-semibold text-lg text-purple-900">{{ event.title }}</h3>
                          <span :class="['px-2 py-1 rounded-full text-xs font-medium', getStatusBadgeClass(getAttendanceStatus(event._id || event.event_id))]">
                            {{ getAttendanceStatus(event._id || event.event_id) === 'present' ? 'Present' : getAttendanceStatus(event._id || event.event_id) === 'incomplete' ? 'Incomplete' : getAttendanceStatus(event._id || event.event_id) === 'active' ? 'Pending Check-in' : (event.status === 'active' ? 'Pending Check-in' : 'Absent') }}
                          </span>
                          <span v-if="event.status === 'active' && getEventTimeRemaining(event._id || event.event_id)" :class="['px-2 py-1 rounded-full text-xs font-medium', getEventTimeRemaining(event._id || event.event_id) === 'Ended' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800']">
                            {{ getEventTimeRemaining(event._id || event.event_id) }}
                          </span>
                        </div>
                        <p v-if="event.description" class="text-gray-600 text-sm mb-2">{{ event.description }}</p>
                        <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {{ formatEventDate(event.date || event.event_date) }}
                          </span>
                          <span v-if="event.startTime || event.start_time" class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {{ formatEventTime(event.startTime || event.start_time) }} - {{ formatEventTime(event.endTime || event.end_time) }}
                          </span>
                          <span v-if="event.location" class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            {{ event.location }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- My Attendance Records Section -->
              <div v-if="myAttendanceRecords.length > 0">
                <h3 class="font-semibold text-gray-700 mb-3">My Attendance History</h3>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Event</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Check-in</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Check-out</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="record in myAttendanceRecords" :key="record._id || record.event_id" class="hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-purple-900">{{ record.event?.title || record.event_title || 'Event' }}</td>
                        <td class="px-4 py-3 text-gray-600">{{ (record.event?.date || record.event?.event_date) ? formatEventDate(record.event.date || record.event.event_date) : ((record.check_in_at || record.check_in_time) ? new Date(record.check_in_at || record.check_in_time).toLocaleDateString() : '-') }}</td>
                        <td class="px-4 py-3 text-gray-600">{{ (record.check_in_at || record.check_in_time) ? new Date(record.check_in_at || record.check_in_time).toLocaleTimeString() : '-' }}</td>
                        <td class="px-4 py-3 text-gray-600">{{ (record.check_out_at || record.check_out_time) ? new Date(record.check_out_at || record.check_out_time).toLocaleTimeString() : '-' }}</td>
                        <td class="px-4 py-3">
                          <span :class="['px-2 py-1 rounded-full text-xs font-medium', (record.check_out_at || record.check_out_time) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800']">
                            {{ (record.check_out_at || record.check_out_time) ? 'Present' : 'Incomplete' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications Page -->
        <div v-if="currentPage === 'notifications'" class="space-y-6">
          <div v-if="currentUser.role === 'admin' || currentUser.isMaster || currentUser.role === 'medpub'" class="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-purple-900">Post New Announcement</h2>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input v-model="newNotification.title" type="text" placeholder="Announcement title..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" maxlength="200" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea v-model="newNotification.content" placeholder="Write your announcement here..." rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none resize-none" maxlength="2000"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
                <div class="space-y-3">
                  <div class="flex flex-col gap-3">
                    <label class="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all duration-200" :class="{'border-purple-500 bg-purple-50': notificationImagePreview}">
                      <input type="file" accept="image/*" class="hidden" @change="handleImageFileSelect" ref="imageFileInput" />
                      <div v-if="!notificationImagePreview" class="text-center">
                        <svg class="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <p class="text-sm text-gray-500">Click to upload an image</p>
                        <p class="text-xs text-gray-400 mt-1">JPG, PNG, GIF up to 10MB</p>
                      </div>
                      <div v-else class="relative">
                        <img :src="notificationImagePreview" alt="Preview" class="max-h-28 rounded-lg object-contain" />
                      </div>
                    </label>
                  </div>
                  <div v-if="notificationImagePreview || notificationImageUrl" class="flex items-center justify-between">
                    <span v-if="notificationImagePreview" class="text-xs text-green-600 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      Image selected - will be uploaded when you post
                    </span>
                    <button @click="clearNotificationImage" class="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 ml-auto">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex justify-end">
                <button @click="postNotification" :disabled="postingNotification || uploadingImage || !newNotification.title.trim() || !newNotification.content.trim()" class="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg v-if="postingNotification || uploadingImage" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  {{ uploadingImage ? 'Uploading Image...' : postingNotification ? 'Posting...' : 'Post Announcement' }}
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-purple-900">Announcements Feed</h2>
              <button @click="fetchNotifications" :disabled="notificationsLoading" class="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 transition">
                <svg :class="{'animate-spin': notificationsLoading}" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
            </div>

            <div v-if="notificationsLoading" class="flex items-center justify-center py-12">
              <svg class="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <div v-else-if="notifications.length === 0" class="text-center py-12">
              <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-700 mb-2">No announcements yet</h3>
              <p class="text-gray-500">Check back later for updates.</p>
            </div>

            <div v-else class="space-y-4">
              <div v-for="notif in notifications" :key="notif._id" :class="['rounded-xl p-4 md:p-5 border-l-4', notif.posted_by === 'admin' ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-500' : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-500']">
                <div class="flex items-start gap-3">
                  <!-- Admin: JRMSU Logo -->
                  <div v-if="notif.posted_by === 'admin'" class="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                    <img src="/src/assets/jrmsu-logo.webp" alt="JRMSU" class="w-10 h-10 object-contain" />
                  </div>
                  <!-- MedPub: Media and Publication Logo -->
                  <div v-else class="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-500 to-amber-600">
                    <img src="/media_pub_logo.png" alt="Media and Publication" class="w-8 h-8 object-contain" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <!-- Admin Header -->
                    <div v-if="notif.posted_by === 'admin'" class="flex flex-wrap items-center gap-2 mb-2">
                      <span class="font-bold text-purple-900">{{ notif.posted_by_name || notif.poster_name || 'Admin' }}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-200 text-purple-800">Admin</span>
                    </div>
                    <!-- MedPub Header: Organization name with label, then posted by user -->
                    <div v-else class="mb-2">
                      <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="font-bold text-yellow-900">Media and Publication</span>
                        <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-200 text-amber-800">Organization</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs text-gray-600">
                        <span>posted by</span>
                        <div class="flex items-center gap-1.5">
                          <!-- Poster's small profile photo with retry logic -->
                          <div class="w-5 h-5 rounded-full overflow-hidden flex-shrink-0" :style="getPosterPhotoFallbackStyle(notif)">
                            <img 
                              v-if="notif.poster_photo && !posterImageFailed[notif._id]" 
                              :src="notif.poster_photo" 
                              :alt="notif.posted_by_name" 
                              class="w-full h-full object-cover"
                              @error="handlePosterImageError(notif._id, notif.poster_photo)"
                              @load="posterImageFailed[notif._id] = false"
                            />
                            <img 
                              v-else 
                              src="/user.svg" 
                              alt="User" 
                              class="w-3 h-3 m-1" 
                              style="filter: brightness(0) invert(1);"
                            />
                          </div>
                          <span class="font-medium text-gray-800">{{ notif.posted_by_name || 'Unknown' }}</span>
                          <span class="text-xs px-1.5 py-0.5 rounded-full font-medium bg-yellow-200 text-yellow-800">Medpub</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                      <span class="flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {{ formatNotificationDate(notif.created_at) }}
                      </span>
                      <span v-if="notif.was_edited" class="flex items-center gap-1 text-gray-400">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Edited: {{ formatNotificationDate(notif.updated_at) }}
                      </span>
                    </div>
                    <h3 class="text-base md:text-lg font-semibold text-gray-900 mb-1.5">{{ notif.title }}</h3>
                    <p class="text-gray-700 whitespace-pre-wrap break-words leading-relaxed text-sm md:text-base flex-1" v-html="formatMessageWithLinks(notif.message || notif.content)"></p>
                    <div v-if="notif.image_url" class="mt-3">
                      <div class="relative group inline-block max-w-full">
                        <div v-if="notifImageRetries[notif._id] > 0 && !notifImageFailed[notif._id]" class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                          <div class="text-center">
                            <svg class="animate-spin h-8 w-8 text-purple-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span class="text-xs text-gray-500">Retrying... ({{ notifImageRetries[notif._id] }}/{{ MAX_NOTIF_IMAGE_RETRIES }})</span>
                          </div>
                        </div>
                        <div v-if="notifImageFailed[notif._id]" class="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                          <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          <p class="text-sm text-gray-500 mb-2">Failed to load image</p>
                          <button @click.stop="retryNotifImage(notif._id, notif.image_url)" class="text-xs text-purple-600 hover:text-purple-800 font-medium">Try again</button>
                        </div>
                        <img v-show="!notifImageFailed[notif._id]" :src="notif.image_url" alt="Announcement image" class="max-w-full w-auto h-auto max-h-[500px] rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90 transition shadow-sm" @click="openImagePreview(notif.image_url)" @error="handleNotifImageError(notif._id, notif.image_url, $event)" />
                        <div v-if="!notifImageFailed[notif._id]" class="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button @click.stop="openImagePreview(notif.image_url)" class="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-lg transition" title="View full size">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                          </button>
                          <a :href="notif.image_url" :download="getImageFileName(notif.image_url)" @click.stop class="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-lg transition" title="Download image">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 border-opacity-50 relative z-10">
                      <button @click.stop="toggleLike(notif)" :disabled="isLikeDisabled(notif._id)" :class="['flex items-center gap-2 transition group px-3 py-2 -ml-3 rounded-lg', isLikeDisabled(notif._id) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50 active:scale-95']" :title="isLikeDisabled(notif._id) ? 'Please wait...' : (isLikedByCurrentUser(notif) ? 'Unlike' : 'Like')">
                        <svg v-if="likeInProgress[notif._id]" class="w-6 h-6 animate-spin text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <svg v-else :class="['w-6 h-6 transition-all', isLikedByCurrentUser(notif) ? 'text-pink-500 fill-pink-500 scale-110' : (isLikeDisabled(notif._id) ? '' : 'group-hover:scale-110')]" :fill="isLikedByCurrentUser(notif) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        <span class="text-sm font-medium">{{ (notif.liked_by || []).length }}</span>
                      </button>
                      <div v-if="(currentUser.role === 'admin' || currentUser.isMaster) || (currentUser.role === 'medpub' && (notif.posted_by_id === currentUser._id || notif.poster_id === currentUser.student_id))" class="flex gap-2">
                        <button @click="openEditNotification(notif)" class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition" title="Edit">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button @click="deleteNotification(notif._id)" class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition" title="Delete">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Approvals Page -->
        <div v-if="currentPage === 'pending' && (currentUser.role === 'admin' || currentUser.isMaster)" class="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 class="text-xl md:text-2xl font-bold text-purple-900">Pending Student Approvals</h2>
            <button @click="fetchPendingStudents" :disabled="pendingLoading" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" title="Refresh Pending List">
              <svg :class="{'animate-spin': pendingLoading}" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Refresh
            </button>
          </div>

          <!-- Search Input for Pending Students -->
          <div class="mb-4">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input v-model="pendingSearchQuery" @input="filterPendingStudents" type="text" placeholder="Search by name, email, student ID, or RFID..." class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" />
            </div>
            <p class="text-xs text-gray-500 mt-1">Search across name, email, student ID, and RFID code</p>
          </div>

          <div v-if="pendingLoading" class="flex items-center justify-center py-12">
            <svg class="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <div v-else-if="filteredPendingStudents.length === 0 && pendingSearchQuery" class="text-center py-12">
            <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">No results found</h3>
            <p class="text-gray-500">No pending students match "{{ pendingSearchQuery }}"</p>
          </div>

          <div v-else-if="pendingStudents.length === 0" class="text-center py-12">
            <div class="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">All caught up!</h3>
            <p class="text-gray-500">No pending student registrations to review.</p>
          </div>

          <div v-else class="space-y-4">
            <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Showing {{ paginatedPendingStudents.length }} of {{ filteredPendingStudents.length }} pending student{{ filteredPendingStudents.length === 1 ? '' : 's' }}</span>
            </div>
            <div v-for="student in paginatedPendingStudents" :key="student.student_id" class="border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-md transition-shadow">
              <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-shrink-0">
                  <div class="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" :class="student.photo ? 'bg-purple-100' : 'bg-gradient-to-br from-pink-500 to-purple-600'">
                    <img v-if="student.photo" :src="student.photo" alt="Student Photo" class="w-full h-full object-cover" />
                    <img v-else src="/user.svg" alt="No Photo" class="w-10 h-10 brightness-0 invert" />
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 class="text-lg font-semibold text-purple-900">{{ student.first_name }} {{ student.middle_name || '' }} {{ student.last_name }} {{ student.suffix || '' }}</h3>
                      <p class="text-sm text-gray-500">{{ student.student_id }}</p>
                    </div>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>
                      Pending Review
                    </span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    <div>
                      <p class="text-gray-500">Program</p>
                      <p class="font-medium text-gray-800">{{ student.program }}</p>
                    </div>
                    <div>
                      <p class="text-gray-500">Year Level</p>
                      <p class="font-medium text-gray-800">{{ student.year_level }}</p>
                    </div>
                    <div>
                      <p class="text-gray-500">Email</p>
                      <p class="font-medium text-gray-800 truncate">{{ student.email || 'N/A' }}</p>
                    </div>
                    <div>
                      <p class="text-gray-500">Registered</p>
                      <p class="font-medium text-gray-800">{{ formatDate(student.created_date) }}</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button @click="approveStudent(student)" :disabled="approvingStudent === student.student_id" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 font-medium text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                      <svg v-if="approvingStudent === student.student_id" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      {{ approvingStudent === student.student_id ? 'Approving...' : 'Approve' }}
                    </button>
                    <button @click="openRejectModal(student)" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 font-medium text-sm flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Pagination Controls for Pending Students -->
            <div v-if="pendingTotalPages > 1" class="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
              <button @click="pendingCurrentPage = 1" :disabled="pendingCurrentPage === 1" class="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                First
              </button>
              <button @click="pendingCurrentPage--" :disabled="pendingCurrentPage === 1" class="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <span class="px-4 py-2 text-sm font-medium text-gray-700">
                Page {{ pendingCurrentPage }} of {{ pendingTotalPages }}
              </span>
              <button @click="pendingCurrentPage++" :disabled="pendingCurrentPage === pendingTotalPages" class="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
              <button @click="pendingCurrentPage = pendingTotalPages" :disabled="pendingCurrentPage === pendingTotalPages" class="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Last
              </button>
            </div>
          </div>
        </div>

        <!-- Reject Modal -->
        <div v-if="showRejectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showRejectModal = false">
          <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-red-600 mb-4">Reject Student Registration</h3>
            <p class="text-gray-600 mb-4">Are you sure you want to reject <span class="font-semibold">{{ studentToReject?.first_name }} {{ studentToReject?.last_name }}</span>'s registration?</p>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Reason for rejection (optional)</label>
              <textarea v-model="rejectReason" placeholder="Enter a reason to include in the notification email..." class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none" rows="3"></textarea>
            </div>
            <div class="flex gap-3">
              <button @click="showRejectModal = false" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
              <button @click="confirmRejectStudent" :disabled="rejectingStudent" class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                <svg v-if="rejectingStudent" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ rejectingStudent ? 'Rejecting...' : 'Reject' }}
              </button>
            </div>
          </div>
        </div>

        <!-- User Management Page -->
        <div v-if="currentPage === 'users' && (currentUser.role === 'admin' || currentUser.isMaster)" class="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div class="flex flex-col gap-4 mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 class="text-xl md:text-2xl font-bold text-purple-900">Manage Users</h2>
              <div class="flex items-center gap-2">
                <button @click="refreshStudents" :disabled="isRefreshing" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" title="Refresh Student List">
                  <svg v-if="isRefreshing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
                </button>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="flex-1 relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input v-model="searchQuery" @change="handleSearchChange" type="text" placeholder="Search by Name, Email, Student ID, or RFID Code..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm" />
              </div>
              <div class="relative min-w-[140px]">
                <select v-model="filterProgram" @change="handleSearchChange" class="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm">
                  <option value="">All Programs</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIS">BSIS</option>
                  <option value="BSIT">BSIT</option>
                </select>
                <svg class="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              <div class="relative min-w-[120px]">
                <select v-model="filterSchoolLevel" @change="handleSearchChange" class="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm">
                  <option value="">All Levels</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
                <svg class="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-purple-100">
                  <th class="border border-purple-300 px-4 py-3 text-left font-semibold text-purple-900">Student ID</th>
                  <th class="border border-purple-300 px-4 py-3 text-left font-semibold text-purple-900">Name</th>
                  <th class="border border-purple-300 px-4 py-3 text-left font-semibold text-purple-900">Email</th>
                  <th class="border border-purple-300 px-4 py-3 text-center font-semibold text-purple-900">RFID Code</th>
                  <th class="border border-purple-300 px-4 py-3 text-center font-semibold text-purple-900">Program</th>
                  <th class="border border-purple-300 px-4 py-3 text-center font-semibold text-purple-900">School Level</th>
                  <th class="border border-purple-300 px-4 py-3 text-center font-semibold text-purple-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredUsers.length === 0" class="hover:bg-gray-50">
                  <td colspan="7" class="border border-purple-300 px-4 py-8 text-center text-gray-600">No users found matching your search.</td>
                </tr>
                <tr v-for="user in filteredUsers" :key="user.studentId || user.student_id" class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-4 py-3 text-gray-700">{{ user.studentId || user.student_id }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-gray-700">{{ (user.firstName || user.first_name) }} {{ (user.lastName || user.last_name) }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-gray-700">{{ user.email }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-center text-gray-700">{{ user.rfidCode || user.rfid_code || '—' }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-center text-gray-700">{{ user.program }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-center text-gray-700">{{ user.yearLevel || user.year_level }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2 flex-nowrap">
                      <button @click="editUser(user)" class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0" title="Edit User">
                        <img src="/edit.svg" alt="Edit" class="w-4 h-4 min-w-[16px] min-h-[16px]" style="filter: brightness(0) invert(1);" />
                      </button>
                      <button @click="deleteUser(user.studentId || user.student_id)" class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0" title="Delete User">
                        <img src="/delete.svg" alt="Delete" class="w-4 h-4 min-w-[16px] min-h-[16px]" style="filter: brightness(0) invert(1);" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div v-if="paginationTotal > 0" class="mt-6 pt-6 border-t border-gray-200">
            <div class="text-sm text-gray-600 mb-4">
              Showing page <span class="font-semibold text-purple-900">{{ currentPageNum }}</span> of <span class="font-semibold text-purple-900">{{ totalPages }}</span> ({{ paginationTotal }} total students)
            </div>
            <div class="flex flex-wrap gap-2 items-center justify-center md:justify-start">
              <div class="flex gap-1">
                <button @click="goToPreviousPage" :disabled="currentPageNum === 1" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">
                  Previous
                </button>
                <button @click="goToNextPage" :disabled="currentPageNum >= totalPages" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">
                  Next
                </button>
              </div>
              
              <div class="flex gap-1">
                <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="['px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200', currentPageNum === page ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300']">
                  {{ page }}
                </button>
              </div>
              
              <div class="flex gap-1">
                <button @click="goToPage(1)" :disabled="currentPageNum === 1" class="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">
                  ← First
                </button>
                <button @click="goToPage(totalPages)" :disabled="currentPageNum === totalPages" class="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">
                  Last →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Attendance Event Banner for Students -->
        <div v-if="currentPage === 'dashboard' && currentUser.role !== 'admin' && !currentUser.isMaster && activeUnattendedEvents.length > 0" class="mb-4">
          <div v-for="event in activeUnattendedEvents" :key="event._id" class="bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg shadow-lg p-4 mb-3 text-white">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                </div>
                <div>
                  <h3 class="font-bold text-lg">{{ event.title }}</h3>
                  <p class="text-sm text-white text-opacity-90">
                    <span v-if="getAttendanceStatus(event._id || event.event_id) === 'incomplete'" class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      You checked in but haven't checked out yet
                    </span>
                    <span v-else class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Active attendance event - Please check in with your RFID
                    </span>
                  </p>
                  <div class="flex flex-wrap gap-3 mt-2 text-xs text-white text-opacity-80">
                    <span v-if="event.date || event.event_date" class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {{ formatEventDate(event.date || event.event_date) }}
                    </span>
                    <span v-if="event.startTime || event.start_time" class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {{ formatEventTime(event.startTime || event.start_time) }} - {{ formatEventTime(event.endTime || event.end_time) }}
                    </span>
                    <span v-if="event.location" class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {{ event.location }}
                    </span>
                  </div>
                </div>
              </div>
              <button @click="currentPage = 'attendance'; fetchAttendanceData()" class="bg-white text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition flex items-center gap-2 text-sm whitespace-nowrap">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                View Attendance
              </button>
            </div>
          </div>
        </div>

        <!-- Dashboard Page -->
        <div v-if="currentPage === 'dashboard' && currentUser.role !== 'admin' && !currentUser.isMaster" class="bg-white rounded-lg shadow-lg p-4 md:p-8 mb-8">
          <h2 class="text-xl md:text-2xl font-bold text-purple-900 mb-8">My Profile</h2>
          
          <!-- Profile Header Section -->
          <div class="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b-2 border-gray-200">
            <div class="flex flex-col items-center md:items-start">
              <div class="relative">
                <div class="w-32 h-32 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 overflow-hidden mb-4 shadow-lg flex items-center justify-center">
                  <div v-if="profileImageLoading && !profileImageFailed" class="w-full h-full flex items-center justify-center">
                    <svg class="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <img v-else-if="!profileImageFailed && (currentUser.image || currentUser.photo)" :src="currentUser.image || currentUser.photo" alt="Profile Picture" class="w-full h-full object-cover" @load="() => { profileImageLoading = false; profileImageFailed = false; }" @error="handleProfileImageError" />
                  <img v-else src="/user.svg" alt="Profile" class="w-16 h-16" style="filter: brightness(0) invert(1);" />
                </div>
                <button 
                  v-if="currentUser.role !== 'admin' && !currentUser.isMaster"
                  @click="$refs.studentPhotoInput.click()" 
                  class="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 hover:scale-110 border-3 border-white"
                  title="Change Photo"
                >
                  <img src="/change_photo.svg" alt="Change Photo" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
                </button>
              </div>
              <input 
                ref="studentPhotoInput" 
                @change="handleStudentPhotoUpload"
                type="file" 
                accept="image/*" 
                class="hidden" 
              />
              <div class="text-center md:text-left">
                <p class="text-2xl font-bold text-purple-900">{{ displayName }}</p>
                <p class="text-sm text-gray-500 mt-1">ID: {{ currentUser.studentId || currentUser.student_id }}</p>
                <p v-if="studentPhotoUploading" class="text-xs text-purple-600 mt-2 font-medium">Uploading photo...</p>
              </div>
            </div>
          </div>

          <!-- Personal Information Section -->
          <div class="mb-8">
            <h3 class="text-lg font-bold text-purple-900 mb-4 pb-2 border-b-2 border-purple-300">Personal Information</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div class="bg-purple-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">First Name</p>
                <p class="text-base font-semibold text-gray-900 mt-2">{{ currentUser.firstName || currentUser.first_name || 'N/A' }}</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Middle Name</p>
                <p class="text-base font-semibold text-gray-900 mt-2">{{ currentUser.middleName || currentUser.middle_name || 'N/A' }}</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Name</p>
                <p class="text-base font-semibold text-gray-900 mt-2">{{ currentUser.lastName || currentUser.last_name || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Contact & ID Section -->
          <div class="mb-8">
            <h3 class="text-lg font-bold text-purple-900 mb-4 pb-2 border-b-2 border-purple-300">Contact & Identification</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="bg-pink-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</p>
                <p class="text-base font-semibold text-gray-900 mt-2 break-words">{{ currentUser.email || 'Not provided' }}</p>
              </div>
              <div :class="['p-4 rounded-lg', currentUser.rfid_status === 'verified' ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200']">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">RFID Status</p>
                  <span :class="['text-xs px-2 py-1 rounded-full font-semibold', currentUser.rfid_status === 'verified' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white']">
                    {{ currentUser.rfid_status === 'verified' ? 'Verified' : 'Pending' }}
                  </span>
                </div>
                <div v-if="currentUser.rfid_status === 'verified'">
                  <p class="text-base font-semibold text-gray-900">{{ currentUser.rfidCode || currentUser.rfid_code }}</p>
                  <p v-if="currentUser.rfid_verified_by" class="text-xs text-gray-500 mt-2">
                    Verified by the Administrator
                  </p>
                  <p v-if="currentUser.rfid_verified_at" class="text-xs text-gray-500">
                    Date: {{ new Date(currentUser.rfid_verified_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) }}
                  </p>
                  <p class="text-xs text-green-600 mt-2 font-medium">Your RFID card is active and ready for attendance logging.</p>
                </div>
                <div v-else>
                  <p class="text-base font-semibold text-gray-900">Not Yet Assigned</p>
                  <p class="text-xs text-yellow-700 mt-2">Your RFID card has not been verified yet. Please visit the CCS office to have your attendance card assigned and verified by an admin.</p>
                  <p class="text-xs text-gray-500 mt-2">You will receive an email notification once your RFID is verified.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Information Section -->
          <div>
            <h3 class="text-lg font-bold text-purple-900 mb-4 pb-2 border-b-2 border-purple-300">Academic Information</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Program</p>
                <p class="text-base font-semibold text-gray-900 mt-2">{{ currentUser.program || 'Not provided' }}</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Year Level</p>
                <p class="text-base font-semibold text-gray-900 mt-2">{{ currentUser.yearLevel || currentUser.year_level || 'Not provided' }}</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Semester</p>
                <p class="text-base font-semibold text-gray-900 mt-2">{{ currentUser.semester || 'Not provided' }}</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">School Year</p>
                <p class="text-base font-semibold text-gray-900 mt-2">{{ currentUser.schoolYear || currentUser.school_year || 'Not provided' }}</p>
              </div>
            </div>
          </div>

          <!-- Account Security Section -->
          <div class="mt-8">
            <h3 class="text-lg font-bold text-purple-900 mb-4 pb-2 border-b-2 border-purple-300">Account Security</h3>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p class="text-base font-semibold text-gray-900">Password</p>
                  <p class="text-sm text-gray-600 mt-1">Keep your account secure by updating your password regularly</p>
                </div>
                <button @click="showPasswordChangeModal = true" class="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentPage === 'dashboard' && (currentUser.role === 'admin' || currentUser.isMaster)" class="bg-white rounded-lg shadow-lg p-4 md:p-8 mb-8">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 class="text-xl md:text-2xl font-bold text-purple-900">Registered Students</h2>
            <button @click="refreshStudents" :disabled="isRefreshing" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" title="Refresh Statistics">
              <svg v-if="isRefreshing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>

          <div class="overflow-x-auto text-sm md:text-base">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-purple-100">
                  <th class="border border-purple-300 px-6 py-3 text-left font-semibold text-purple-900"></th>
                  <th class="border border-purple-300 px-6 py-3 text-center font-semibold text-purple-900">BSCS</th>
                  <th class="border border-purple-300 px-6 py-3 text-center font-semibold text-purple-900">BSIS</th>
                  <th class="border border-purple-300 px-6 py-3 text-center font-semibold text-purple-900">BSIT</th>
                </tr>
              </thead>
              <tbody>
                <tr class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-6 py-4 font-medium text-gray-700">1st years</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS['1st Year'] || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS['1st Year'] || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT['1st Year'] || 0 }}</td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-6 py-4 font-medium text-gray-700">2nd years</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS['2nd Year'] || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS['2nd Year'] || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT['2nd Year'] || 0 }}</td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-6 py-4 font-medium text-gray-700">3rd years</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS['3rd Year'] || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS['3rd Year'] || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT['3rd Year'] || 0 }}</td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-6 py-4 font-medium text-gray-700">4th years</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS['4th Year'] || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS['4th Year'] || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT['4th Year'] || 0 }}</td>
                </tr>
                <tr class="bg-purple-50 font-bold">
                  <td class="border border-purple-300 px-6 py-4 font-bold text-gray-900">All year levels</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS.total || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS.total || 0 }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT.total || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-6 text-center">
            <p class="text-lg font-semibold text-purple-900">
              Total Registered Students: <span class="text-2xl">{{ totalStudents }}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Edit User Modal -->
  <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <h3 class="text-2xl font-bold text-purple-900 mb-6">Edit User</h3>
      <div v-if="editingUser" class="space-y-4">
        <div class="flex flex-col items-center mb-6">
          <div class="relative">
            <div class="w-24 h-24 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 overflow-hidden mb-3 shadow-lg flex items-center justify-center relative">
              <div v-if="editImageLoading" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <svg class="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <img v-if="editingUser.image || editingUser.photo" :src="editingUser.image || editingUser.photo" alt="User Photo" class="w-full h-full object-cover" @load="editImageLoading = false" @error="editImageLoading = false" />
              <img v-else src="/user.svg" alt="Profile" class="w-12 h-12" style="filter: brightness(0) invert(1);" />
            </div>
            <button 
              @click="$refs.photoInput.click()" 
              class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 hover:scale-110"
              title="Change Photo"
            >
              <img src="/change_photo.svg" alt="Change Photo" class="w-4 h-4" style="filter: brightness(0) invert(1);" />
            </button>
          </div>
          <input 
            ref="photoInput" 
            @change="handleEditImageUpload"
            type="file" 
            accept="image/*" 
            class="hidden" 
          />
          <p v-if="editImageUploading" class="text-xs text-purple-600 mt-3 font-medium">Uploading...</p>
          <div v-if="editingUser.image && editingUser.image.includes('imgbb')" class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-xs font-medium text-gray-700 mb-1">Photo URL:</p>
            <a :href="editingUser.image" target="_blank" class="text-xs text-blue-600 hover:text-blue-800 underline break-all font-medium">{{ editingUser.image }}</a>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
          <input v-model="editingUser.studentId" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input v-model="editingUser.firstName" @input="editingUser.firstName = editingUser.firstName.toUpperCase()" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none uppercase" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Middle Name <span class="text-gray-400">(optional)</span></label>
          <input v-model="editingUser.middleName" @input="editingUser.middleName = editingUser.middleName.toUpperCase()" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none uppercase" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input v-model="editingUser.lastName" @input="editingUser.lastName = editingUser.lastName.toUpperCase()" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none uppercase" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input v-model="editingUser.email" type="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Program</label>
          <select v-model="editingUser.program" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
            <option value="">Select Program</option>
            <option value="BSCS">BSCS</option>
            <option value="BSIS">BSIS</option>
            <option value="BSIT">BSIT</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
          <select v-model="editingUser.yearLevel" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
            <option value="">Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">RFID Code</label>
          <input v-model="editingUser.rfidCode" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select v-model="editingUser.role" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
            <option value="student">Student</option>
            <option value="medpub">Medpub</option>
          </select>
          <p v-if="editingUser.role === 'medpub'" class="text-xs text-yellow-600 mt-1">Medpub users can post announcements and notifications.</p>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="closeEditModal" :disabled="savingUser" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
          <button @click="saveUser" :disabled="savingUser" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg v-if="savingUser" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            {{ savingUser ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Notification Modal -->
  <div v-if="showEditNotificationModal && editNotificationData" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeEditNotificationModal">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Edit Announcement</h3>
        <button @click="closeEditNotificationModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input v-model="editNotificationData.title" type="text" placeholder="Announcement title..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" maxlength="200" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <textarea v-model="editNotificationData.message" placeholder="Write your announcement here..." rows="6" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none resize-none" maxlength="2000"></textarea>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="closeEditNotificationModal" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
          <button @click="saveEditedNotification" :disabled="savingEditedNotification || !editNotificationData.title.trim() || !editNotificationData.message.trim()" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg v-if="savingEditedNotification" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            {{ savingEditedNotification ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
      <h3 class="text-2xl font-bold text-red-600 mb-4">Delete User?</h3>
      <p class="text-gray-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
      <div class="flex gap-3">
        <button @click="showDeleteConfirm = false" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
        <button @click="confirmDelete" class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition">Delete</button>
      </div>
    </div>
  </div>

  <!-- Password Change Modal with Email Verification -->
  <div v-if="showPasswordChangeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closePasswordChangeModal">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Change Password</h3>
        <button @click="closePasswordChangeModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>

      <!-- Step 1: Request Email Verification -->
      <div v-if="pwChangeStep === 1" class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-sm text-blue-800">For your security, we'll send a verification code to your registered email address.</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Your Email Address</label>
          <input v-model="pwChangeEmail" type="email" :placeholder="currentUser.email || 'your.email@example.com'" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <button @click="requestPasswordChangeCode" :disabled="changingPassword || !pwChangeEmail.trim()" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          <svg v-if="changingPassword" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ changingPassword ? 'Sending...' : 'Send Verification Code' }}
        </button>
        <p v-if="pwChangeMessage" :class="['text-sm text-center', pwChangeSuccess ? 'text-green-600' : 'text-red-600']">{{ pwChangeMessage }}</p>
      </div>

      <!-- Step 2: Enter Verification Code -->
      <div v-if="pwChangeStep === 2" class="space-y-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <p class="text-sm text-green-800">A 6-digit code has been sent to your email. Please check your inbox.</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
          <input v-model="pwChangeCode" type="text" placeholder="123456" maxlength="6" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-center text-2xl tracking-widest" />
        </div>
        <button @click="verifyPasswordChangeCode" :disabled="changingPassword || pwChangeCode.length !== 6" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          <svg v-if="changingPassword" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ changingPassword ? 'Verifying...' : 'Verify Code' }}
        </button>
        <button @click="pwChangeStep = 1" class="w-full text-purple-600 hover:text-purple-700 text-sm font-medium">Back to Step 1</button>
        <p v-if="pwChangeMessage" :class="['text-sm text-center', pwChangeSuccess ? 'text-green-600' : 'text-red-600']">{{ pwChangeMessage }}</p>
      </div>

      <!-- Step 3: Enter New Password -->
      <div v-if="pwChangeStep === 3" class="space-y-4">
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-sm text-purple-800">Email verified! Now create your new secure password.</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <div class="relative">
            <input v-model="passwordForm.newPassword" :type="showNewPassword ? 'text' : 'password'" placeholder="Enter new password (min 6 characters)" class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
            <button type="button" @click="showNewPassword = !showNewPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition">
              <svg v-if="showNewPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
            </button>
          </div>
          <p v-if="passwordErrors.newPassword" class="text-red-500 text-xs mt-1">{{ passwordErrors.newPassword }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <div class="relative">
            <input v-model="passwordForm.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="Confirm new password" class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
            <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition">
              <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
            </button>
          </div>
          <p v-if="passwordErrors.confirmPassword" class="text-red-500 text-xs mt-1">{{ passwordErrors.confirmPassword }}</p>
        </div>
        <button @click="completePasswordChange" :disabled="changingPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          <svg v-if="changingPassword" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ changingPassword ? 'Changing Password...' : 'Change Password' }}
        </button>
        <p v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="text-sm text-red-600 text-center">Passwords do not match</p>
        <p v-if="pwChangeMessage" :class="['text-sm text-center', pwChangeSuccess ? 'text-green-600' : 'text-red-600']">{{ pwChangeMessage }}</p>
      </div>
    </div>
  </div>

  <!-- Time Picker Modal - Clock Design -->
  <div v-if="showTimePicker" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" @click.self="showTimePicker = false">
    <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Select Time</h3>
        <button @click="showTimePicker = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      
      <!-- Clock Face Design -->
      <div class="relative w-48 h-48 mx-auto mb-6">
        <div class="absolute inset-0 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 shadow-inner"></div>
        <div class="absolute inset-2 rounded-full bg-white shadow-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              {{ timePickerHour }}:{{ timePickerMinute.toString().padStart(2, '0') }}
            </div>
            <div class="text-lg font-semibold text-purple-600 mt-1">{{ timePickerPeriod }}</div>
          </div>
        </div>
        <!-- Clock hour markers -->
        <div v-for="i in 12" :key="i" class="absolute w-1 h-1 bg-purple-300 rounded-full" :style="{ top: `${50 - 42 * Math.cos((i * 30 - 90) * Math.PI / 180)}%`, left: `${50 + 42 * Math.sin((i * 30 - 90) * Math.PI / 180)}%` }"></div>
      </div>
      
      <!-- Direct Time Input -->
      <div class="mb-6">
        <p class="text-xs text-gray-500 mb-2 text-center font-medium">Type time directly or use controls below</p>
        <div class="flex items-center justify-center gap-2">
          <input 
            type="number" 
            v-model.number="timePickerHour" 
            @input="timePickerHour = Math.max(1, Math.min(12, timePickerHour || 1))"
            min="1" 
            max="12" 
            class="w-16 h-12 text-center text-xl font-bold border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none"
            placeholder="HH"
          />
          <span class="text-2xl font-bold text-purple-600">:</span>
          <input 
            type="number" 
            v-model.number="timePickerMinute" 
            @input="timePickerMinute = Math.max(0, Math.min(59, timePickerMinute || 0))"
            min="0" 
            max="59" 
            class="w-16 h-12 text-center text-xl font-bold border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none"
            placeholder="MM"
          />
          <div class="flex flex-col gap-1 ml-2">
            <button @click="timePickerPeriod = 'AM'" :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm', timePickerPeriod === 'AM' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">AM</button>
            <button @click="timePickerPeriod = 'PM'" :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm', timePickerPeriod === 'PM' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">PM</button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center gap-4 mb-6">
        <!-- Hour Control -->
        <div class="flex flex-col items-center">
          <label class="text-xs text-gray-500 mb-1 font-medium">Hour</label>
          <div class="flex flex-col items-center">
            <button @click="timePickerHour = timePickerHour < 12 ? timePickerHour + 1 : 1" class="text-purple-600 hover:text-pink-500 p-1 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
            </button>
            <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {{ timePickerHour }}
            </div>
            <button @click="timePickerHour = timePickerHour > 1 ? timePickerHour - 1 : 12" class="text-purple-600 hover:text-pink-500 p-1 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>
        </div>
        
        <span class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mt-5">:</span>
        
        <!-- Minute Control -->
        <div class="flex flex-col items-center">
          <label class="text-xs text-gray-500 mb-1 font-medium">Minute</label>
          <div class="flex flex-col items-center">
            <button @click="timePickerMinute = timePickerMinute < 59 ? timePickerMinute + 1 : 0" class="text-purple-600 hover:text-pink-500 p-1 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
            </button>
            <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {{ timePickerMinute.toString().padStart(2, '0') }}
            </div>
            <button @click="timePickerMinute = timePickerMinute > 0 ? timePickerMinute - 1 : 59" class="text-purple-600 hover:text-pink-500 p-1 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>
        </div>
        
        <!-- Period Control -->
        <div class="flex flex-col items-center ml-2">
          <label class="text-xs text-gray-500 mb-1 font-medium">Period</label>
          <div class="flex flex-col gap-1 mt-1">
            <button @click="timePickerPeriod = 'AM'" :class="['px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm', timePickerPeriod === 'AM' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">AM</button>
            <button @click="timePickerPeriod = 'PM'" :class="['px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm', timePickerPeriod === 'PM' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">PM</button>
          </div>
        </div>
      </div>
      
      <div class="flex gap-3">
        <button @click="showTimePicker = false" class="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
        <button @click="confirmTimePicker" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition shadow-lg">Confirm</button>
      </div>
    </div>
  </div>

  <!-- Create Attendance Event Modal -->
  <div v-if="showCreateEventModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showCreateEventModal = false">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Create Attendance Event</h3>
        <button @click="showCreateEventModal = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
          <input v-model="newEvent.title" type="text" placeholder="e.g., CCS General Assembly" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea v-model="newEvent.description" placeholder="Event description..." rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input v-model="newEvent.location" type="text" placeholder="e.g., CCS AVR" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input v-model="newEvent.date" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
            <button @click="openTimePicker('startTime')" type="button" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-left flex items-center justify-between hover:bg-gray-50 transition">
              <span :class="newEvent.startTime ? 'text-gray-900' : 'text-gray-400'">{{ formatDisplayTime(newEvent.startTime) }}</span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
            <button @click="openTimePicker('endTime')" type="button" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-left flex items-center justify-between hover:bg-gray-50 transition">
              <span :class="newEvent.endTime ? 'text-gray-900' : 'text-gray-400'">{{ formatDisplayTime(newEvent.endTime) }}</span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select v-model="newEvent.status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
            <option value="upcoming">Upcoming</option>
            <option value="active">Active (Accepting Check-ins)</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showCreateEventModal = false" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
          <button @click="createAttendanceEvent" :disabled="!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed">Create Event</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Attendance Event Modal -->
  <div v-if="showEditEventModal && selectedEvent" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showEditEventModal = false">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Edit Attendance Event</h3>
        <button @click="showEditEventModal = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
          <input v-model="selectedEvent.title" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea v-model="selectedEvent.description" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input v-model="selectedEvent.location" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input v-model="selectedEvent.date" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
            <button @click="openTimePicker('edit_start_time')" type="button" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-left flex items-center justify-between hover:bg-gray-50 transition">
              <span :class="selectedEvent.start_time ? 'text-gray-900' : 'text-gray-400'">{{ formatDisplayTime(selectedEvent.start_time) }}</span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
            <button @click="openTimePicker('edit_end_time')" type="button" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-left flex items-center justify-between hover:bg-gray-50 transition">
              <span :class="selectedEvent.end_time ? 'text-gray-900' : 'text-gray-400'">{{ formatDisplayTime(selectedEvent.end_time) }}</span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select v-model="selectedEvent.status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
            <option value="upcoming">Upcoming</option>
            <option value="active">Active (Accepting Check-ins)</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div class="border-t pt-4 mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-3">Attendance Lock Controls</label>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-800">Lock Check-In</p>
                <p class="text-xs text-gray-500">Prevent new students from checking in</p>
              </div>
              <button 
                @click="selectedEvent.check_in_locked = !selectedEvent.check_in_locked" 
                :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300', selectedEvent.check_in_locked ? 'bg-red-500' : 'bg-gray-300']"
              >
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300', selectedEvent.check_in_locked ? 'translate-x-6' : 'translate-x-1']"></span>
              </button>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-800">Lock Check-Out</p>
                <p class="text-xs text-gray-500">Prevent students from checking out</p>
              </div>
              <button 
                @click="selectedEvent.check_out_locked = !selectedEvent.check_out_locked" 
                :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300', selectedEvent.check_out_locked ? 'bg-red-500' : 'bg-gray-300']"
              >
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300', selectedEvent.check_out_locked ? 'translate-x-6' : 'translate-x-1']"></span>
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showEditEventModal = false" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
          <button @click="updateAttendanceEvent" :disabled="!selectedEvent.title || !selectedEvent.date || !selectedEvent.start_time || !selectedEvent.end_time" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed">Save Changes</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Event Attendance Logs Modal -->
  <div v-if="showEventLogsModal && selectedEvent" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showEventLogsModal = false">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-2xl font-bold text-purple-900">{{ selectedEvent.title }}</h3>
          <p class="text-gray-500 text-sm">Attendance Logs - {{ formatEventDate(selectedEvent.date || selectedEvent.event_date) }}</p>
        </div>
        <button @click="showEventLogsModal = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      
      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <input v-model="eventLogsFilter.search" type="text" placeholder="Search by name or ID..." class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" @input="fetchEventLogs(selectedEvent.id)" />
        <select v-model="eventLogsFilter.yearLevel" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" @change="fetchEventLogs(selectedEvent.id)">
          <option value="">All Year Levels</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
        <select v-model="eventLogsFilter.program" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" @change="fetchEventLogs(selectedEvent.id)">
          <option value="">All Programs</option>
          <option value="BSCS">BSCS</option>
          <option value="BSIS">BSIS</option>
          <option value="BSIT">BSIT</option>
        </select>
        <select v-model="eventLogsFilter.status" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" @change="fetchEventLogs(selectedEvent.id)">
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-green-50 p-4 rounded-lg text-center">
          <p class="text-2xl font-bold text-green-600">{{ attendanceLogs.filter(l => l.status === 'present').length }}</p>
          <p class="text-sm text-green-700">Present</p>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg text-center">
          <p class="text-2xl font-bold text-yellow-600">{{ attendanceLogs.filter(l => l.status === 'late').length }}</p>
          <p class="text-sm text-yellow-700">Late</p>
        </div>
        <div class="bg-red-50 p-4 rounded-lg text-center">
          <p class="text-2xl font-bold text-red-600">{{ attendanceLogs.filter(l => l.status === 'absent').length }}</p>
          <p class="text-sm text-red-700">Absent</p>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg text-center">
          <p class="text-2xl font-bold text-purple-600">{{ attendanceLogs.length }}</p>
          <p class="text-sm text-purple-700">Total</p>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-purple-100 text-purple-900">
              <th class="border border-purple-300 px-4 py-3 text-left">Student</th>
              <th class="border border-purple-300 px-4 py-3 text-left">Program</th>
              <th class="border border-purple-300 px-4 py-3 text-left">Year</th>
              <th class="border border-purple-300 px-4 py-3 text-center">Check In</th>
              <th class="border border-purple-300 px-4 py-3 text-center">Check Out</th>
              <th class="border border-purple-300 px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="attendanceLoading" class="text-center">
              <td colspan="6" class="py-8 text-gray-500">
                <svg class="animate-spin h-8 w-8 mx-auto mb-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading logs...
              </td>
            </tr>
            <tr v-else-if="attendanceLogs.length === 0" class="text-center">
              <td colspan="6" class="py-8 text-gray-500">No attendance records found</td>
            </tr>
            <tr v-else v-for="log in attendanceLogs" :key="log.id" class="hover:bg-gray-50">
              <td class="border border-purple-300 px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 flex items-center justify-center text-white text-xs overflow-hidden">
                    <img v-if="log.student_image" :src="log.student_image" class="w-full h-full object-cover" />
                    <span v-else>{{ log.student_name?.charAt(0) || '?' }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ log.student_name }}</p>
                    <p class="text-xs text-gray-500">{{ log.student_id }}</p>
                  </div>
                </div>
              </td>
              <td class="border border-purple-300 px-4 py-3">{{ log.program || '-' }}</td>
              <td class="border border-purple-300 px-4 py-3">{{ log.year_level || '-' }}</td>
              <td class="border border-purple-300 px-4 py-3 text-center">{{ (log.check_in_at || log.check_in_time) ? new Date(log.check_in_at || log.check_in_time).toLocaleTimeString() : '-' }}</td>
              <td class="border border-purple-300 px-4 py-3 text-center">{{ (log.check_out_at || log.check_out_time) ? new Date(log.check_out_at || log.check_out_time).toLocaleTimeString() : '-' }}</td>
              <td class="border border-purple-300 px-4 py-3 text-center">
                <span :class="getStatusBadgeClass(log.status)">{{ log.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Notification Toast -->
  <div v-if="notification.show" :class="['fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 z-40', notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500']">
    <div class="flex items-center gap-2">
      <svg v-if="notification.type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
      <svg v-else-if="notification.type === 'error'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
      <svg v-else class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { encodeTimestamp } from '../utils/ssaamCrypto.js'

const router = useRouter()
const currentUser = ref({})
const users = ref([])
const isPageLoading = ref(true)
const statsLoading = ref(false)
const profileImageLoading = ref(false)
const sidebarImageLoading = ref(false)
const showDevelopersPopup = ref(false)
const showLogoutConfirmation = ref(false)
const showMobileMenu = ref(false)
const showContactModal = ref(false)
const currentPage = ref('dashboard')
const currentPageNum = ref(1)
const itemsPerPage = ref(20)
const paginationTotal = ref(0)
const totalPages = ref(0)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const editingUser = ref(null)
const userToDelete = ref(null)
const searchQuery = ref('')
const filterProgram = ref('')
const filterSchoolLevel = ref('')
const isLoggingOut = ref(false)
const showLogoutAnimation = ref(false)
const editImageUploading = ref(false)
const editImageLoading = ref(false)
const savingUser = ref(false)
const pendingEditUser = ref(null)
const isRefreshing = ref(false)
const isSearching = ref(false)
const statsData = ref(null)
const notification = ref({ show: false, message: '', type: 'info' })
const profileImageFailed = ref(false)
const sidebarImageFailed = ref(false)
const profileImageRetries = ref(0)
const sidebarImageRetries = ref(0)
const maxRetries = 3
const studentPhotoUploading = ref(false)

// Settings management
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const appSettings = ref({
  userRegister: { register: true, message: '' },
  userLogin: { login: true, message: '' },
  rfidScanner: { 
    checkInEnabled: true, 
    checkOutEnabled: true,
    autoDisableCheckIn: false,
    autoDisableCheckOut: false,
    checkInDisableAt: null,
    checkOutDisableAt: null
  }
})
const rfidScannerSaving = ref(false)
const checkInTimerMinutes = ref(30)
const checkOutTimerMinutes = ref(30)

// Clear sessions management
const showClearSessionsConfirm = ref(false)
const clearingSessionTokens = ref(false)

// RFID Fullscreen mode
const rfidFullscreenMode = ref(false)
const rfidFullscreenInputRef = ref(null)

// Pending students management
const pendingStudents = ref([])
const pendingCount = ref(0)
const pendingLoading = ref(false)
const approvingStudent = ref(null)
const rejectingStudent = ref(false)
const showRejectModal = ref(false)
const studentToReject = ref(null)
const rejectReason = ref('')
const pendingSearchQuery = ref('')
const pendingCurrentPage = ref(1)
const pendingPerPage = 10

const filteredPendingStudents = computed(() => {
  if (!pendingSearchQuery.value.trim()) {
    return pendingStudents.value
  }
  const query = pendingSearchQuery.value.toLowerCase().trim()
  return pendingStudents.value.filter(student => {
    const fullName = `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''} ${student.suffix || ''}`.toLowerCase()
    const studentId = (student.student_id || '').toLowerCase()
    const email = (student.email || '').toLowerCase()
    const rfid = (student.rfid_code || '').toLowerCase()
    return fullName.includes(query) || studentId.includes(query) || email.includes(query) || rfid.includes(query)
  })
})

const pendingTotalPages = computed(() => {
  return Math.ceil(filteredPendingStudents.value.length / pendingPerPage)
})

const paginatedPendingStudents = computed(() => {
  const start = (pendingCurrentPage.value - 1) * pendingPerPage
  const end = start + pendingPerPage
  return filteredPendingStudents.value.slice(start, end)
})

const filterPendingStudents = () => {
  pendingCurrentPage.value = 1
}

// Notifications management
const notifications = ref([])
const notificationsLoading = ref(false)
const likeCooldowns = ref({})
const likeInProgress = ref({})
const LIKE_COOLDOWN_MS = 2000

// ImgBB API keys for image uploads
const imgbbApiKeys = [
  "b6a37178abd163036357a7ba35fd0364",
  "3b523af3b0ffb526efddfb51b8928581"
]

const getRandomApiKey = () => {
  return imgbbApiKeys[Math.floor(Math.random() * imgbbApiKeys.length)]
}

// Like rate limiting with warning and ban
const LIKE_WARNING_THRESHOLD = 20
const LIKE_BAN_DURATION_MS = 60 * 60 * 1000
const likeActionTimestamps = ref(JSON.parse(localStorage.getItem('likeActionTimestamps') || '[]'))
const likeWarningShown = ref(localStorage.getItem('likeWarningShown') === 'true')
const likeBanUntil = ref(parseInt(localStorage.getItem('likeBanUntil') || '0'))
const showNotificationModal = ref(false)
const newNotification = ref({ title: '', content: '', type: 'announcement' })
const postingNotification = ref(false)
const editingNotification = ref(null)
const showDeleteNotificationConfirm = ref(false)
const notificationToDelete = ref(null)
const deletingNotification = ref(false)
const notificationImage = ref(null)
const notificationImagePreview = ref(null)
const notificationImageUrl = ref('')
const showImagePreviewModal = ref(false)
const imagePreviewUrl = ref('')
const notifImageRetries = ref({})
const notifImageFailed = ref({})
const MAX_NOTIF_IMAGE_RETRIES = 3
const showEditNotificationModal = ref(false)

// Admin action token management
const adminActionToken = ref(null)
const adminActionTokenExpiry = ref(null)
const showAdminKeyModal = ref(false)
const adminKeyInput = ref('')
const adminKeyError = ref('')
const adminKeyLoading = ref(false)
const pendingAdminAction = ref(null)
const isPrimaryAdmin = ref(false)

// Poster image handling for MedPub posts
const posterImageFailed = ref({})
const posterImageRetries = ref({})
const MAX_POSTER_IMAGE_RETRIES = 2
const posterFallbackColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899']

const getRandomFallbackColor = (id) => {
  const hash = id ? id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0) : Math.random() * 1000
  return posterFallbackColors[Math.abs(hash) % posterFallbackColors.length]
}

const getPosterPhotoFallbackStyle = (notif) => {
  if (notif.poster_photo && !posterImageFailed.value[notif._id]) {
    return {}
  }
  return { backgroundColor: getRandomFallbackColor(notif._id) }
}

// Attendance management
const attendanceEvents = ref([])
const attendanceLogs = ref([])
const myAttendanceRecords = ref([])
const attendanceLoading = ref(false)
const attendanceRefreshInterval = ref(null)
const eventTimeInterval = ref(null)
const eventTimeRemaining = ref({})
const eventEndedNotifications = ref(new Set())
const showCreateEventModal = ref(false)
const showEditEventModal = ref(false)
const showEventLogsModal = ref(false)
const selectedEvent = ref(null)
const newEvent = ref({
  title: '',
  description: '',
  location: '',
  date: '',
  startTime: '',
  endTime: '',
  status: 'draft'
})
const eventLogsFilter = ref({
  yearLevel: '',
  program: '',
  search: ''
})
const rfidInput = ref('')
const rfidInputRef = ref(null)
const rfidLastKeyTime = ref(0)
const rfidInputBuffer = ref('')
const rfidProcessing = ref(false)
const rfidResult = ref(null)
const attendanceTab = ref('events')
const rfidScannerVerified = ref(false)

const showTimePicker = ref(false)
const timePickerTarget = ref('') 
const timePickerHour = ref(8)
const timePickerMinute = ref(0)
const timePickerPeriod = ref('AM')

const openTimePicker = (target) => {
  timePickerTarget.value = target
  let currentTime = ''
  if (target === 'startTime' || target === 'endTime') {
    currentTime = newEvent.value[target]
  } else if (target === 'edit_start_time' || target === 'edit_end_time') {
    const field = target.replace('edit_', '')
    currentTime = selectedEvent.value?.[field] || ''
  }
  
  if (currentTime) {
    const [h, m] = currentTime.split(':').map(Number)
    timePickerHour.value = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    timePickerMinute.value = m
    timePickerPeriod.value = h >= 12 ? 'PM' : 'AM'
  } else {
    timePickerHour.value = 8
    timePickerMinute.value = 0
    timePickerPeriod.value = 'AM'
  }
  showTimePicker.value = true
}

const confirmTimePicker = () => {
  let hour24 = timePickerHour.value
  if (timePickerPeriod.value === 'PM' && hour24 !== 12) hour24 += 12
  if (timePickerPeriod.value === 'AM' && hour24 === 12) hour24 = 0
  
  const timeStr = `${hour24.toString().padStart(2, '0')}:${timePickerMinute.value.toString().padStart(2, '0')}`
  
  if (timePickerTarget.value === 'startTime') {
    newEvent.value.startTime = timeStr
  } else if (timePickerTarget.value === 'endTime') {
    newEvent.value.endTime = timeStr
  } else if (timePickerTarget.value === 'edit_start_time') {
    selectedEvent.value.start_time = timeStr
  } else if (timePickerTarget.value === 'edit_end_time') {
    selectedEvent.value.end_time = timeStr
  }
  showTimePicker.value = false
}

const formatDisplayTime = (time) => {
  if (!time) return 'Select time'
  const [h, m] = time.split(':').map(Number)
  const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
}

const handlePosterImageError = async (notifId, imageUrl) => {
  const retries = posterImageRetries.value[notifId] || 0
  if (retries < MAX_POSTER_IMAGE_RETRIES && imageUrl) {
    posterImageRetries.value[notifId] = retries + 1
    await new Promise(resolve => setTimeout(resolve, 500))
    const imgElements = document.querySelectorAll(`img[src="${imageUrl}"]`)
    imgElements.forEach(img => {
      img.src = imageUrl + '?retry=' + Date.now()
    })
  } else {
    posterImageFailed.value[notifId] = true
  }
}

const isAdminActionTokenValid = () => {
  if (!adminActionToken.value || !adminActionTokenExpiry.value) return false
  return new Date() < new Date(adminActionTokenExpiry.value)
}

const checkAdminActionStatus = async () => {
  const token = localStorage.getItem('authToken')
  if (!token || (!currentUser.value.isMaster && currentUser.value.role !== 'admin')) return
  
  try {
    const response = await fetch('https://ssaam-api.vercel.app/apis/admin-actions/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      isPrimaryAdmin.value = data.is_primary_admin || false
      if (data.has_active_token && data.token_expires_at) {
        adminActionTokenExpiry.value = data.token_expires_at
      }
    }
  } catch (error) {
    console.error('Failed to check admin action status:', error)
  }
}

const requestAdminActionToken = async (adminKey) => {
  const token = localStorage.getItem('authToken')
  if (!token) throw new Error('Authentication required')
  
  const response = await fetch('https://ssaam-api.vercel.app/apis/admin-actions/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-SSAAM-TS': encodeTimestamp()
    },
    body: JSON.stringify({ admin_key: adminKey })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify admin key')
  }
  
  adminActionToken.value = data.action_token
  adminActionTokenExpiry.value = data.expires_at
  return data
}

const getAdminActionHeaders = () => {
  const headers = {}
  if (adminActionToken.value && isAdminActionTokenValid()) {
    headers['X-Admin-Action-Token'] = adminActionToken.value
  }
  return headers
}

const handleAdminActionError = async (response) => {
  if (response.status === 403) {
    const data = await response.json()
    if (data.code === 'NOT_PRIMARY_ADMIN') {
      showNotification('Only the primary admin (ssaam) can perform this action', 'error')
      return true
    }
    if (data.code === 'ACTION_TOKEN_REQUIRED' || data.code === 'INVALID_ACTION_TOKEN' || data.code === 'ACTION_TOKEN_EXPIRED') {
      adminActionToken.value = null
      adminActionTokenExpiry.value = null
      return false
    }
  }
  return false
}

const withAdminAction = (actionFn) => {
  return async (...args) => {
    if (!isPrimaryAdmin.value) {
      showNotification('Only the primary admin can perform this action', 'error')
      return
    }
    
    if (!isAdminActionTokenValid()) {
      pendingAdminAction.value = () => actionFn(...args)
      adminKeyInput.value = ''
      adminKeyError.value = ''
      showAdminKeyModal.value = true
      return
    }
    
    return await actionFn(...args)
  }
}

const cancelAdminKeyModal = () => {
  showAdminKeyModal.value = false
  adminKeyInput.value = ''
  adminKeyError.value = ''
  pendingAdminAction.value = null
  pendingEditUser.value = null
}

const submitAdminKey = async () => {
  if (!adminKeyInput.value) {
    adminKeyError.value = 'Please enter the admin key'
    return
  }
  
  adminKeyLoading.value = true
  adminKeyError.value = ''
  
  try {
    await requestAdminActionToken(adminKeyInput.value)
    showAdminKeyModal.value = false
    adminKeyInput.value = ''
    
    if (pendingAdminAction.value) {
      const action = pendingAdminAction.value
      pendingAdminAction.value = null
      await action()
    }
  } catch (error) {
    adminKeyError.value = error.message || 'Invalid admin key'
  } finally {
    adminKeyLoading.value = false
  }
}

const editNotificationData = ref(null)
const savingEditedNotification = ref(false)

// Notification seen tracking for badge counter - using user-specific keys with both IDs and timestamp for reliability
// These refs are for reactivity only - actual data is loaded from user-specific localStorage keys
const seenNotificationIds = ref(new Set())
const lastSeenNotificationTimestamp = ref(null)

const unreadNotificationCount = computed(() => {
  if (!notifications.value || notifications.value.length === 0) return 0
  const userId = currentUser.value?._id || currentUser.value?.student_id || 'guest'
  const userSeenKey = `seenNotificationIds_${userId}`
  const userTimestampKey = `lastSeenNotificationTimestamp_${userId}`
  
  // Load user-specific seen IDs if available
  let userSeenIds = seenNotificationIds.value
  try {
    const stored = localStorage.getItem(userSeenKey)
    if (stored) {
      userSeenIds = new Set(JSON.parse(stored))
    }
  } catch {}
  
  // Get last seen timestamp for this user
  const lastTimestamp = localStorage.getItem(userTimestampKey)
  
  return notifications.value.filter(n => {
    // Check if notification is in seen IDs
    if (userSeenIds.has(n._id)) return false
    // If we have a last seen timestamp, only count notifications newer than that
    if (lastTimestamp && n.created_at) {
      const notifTime = new Date(n.created_at).getTime()
      const lastSeenTime = parseInt(lastTimestamp) || 0
      if (notifTime <= lastSeenTime) return false
    }
    return true
  }).length
})

const markNotificationsAsSeen = () => {
  if (!notifications.value || notifications.value.length === 0) return
  const userId = currentUser.value?._id || currentUser.value?.student_id || 'guest'
  const userSeenKey = `seenNotificationIds_${userId}`
  const userTimestampKey = `lastSeenNotificationTimestamp_${userId}`
  
  // Load existing user-specific seen IDs
  let userSeenIds
  try {
    const stored = localStorage.getItem(userSeenKey)
    userSeenIds = stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    userSeenIds = new Set()
  }
  
  // Add all current notification IDs
  notifications.value.forEach(n => userSeenIds.add(n._id))
  
  // Find the latest notification timestamp
  let maxTimestamp = 0
  notifications.value.forEach(n => {
    if (n.created_at) {
      const ts = new Date(n.created_at).getTime()
      if (ts > maxTimestamp) maxTimestamp = ts
    }
  })
  
  // Store user-specific data
  localStorage.setItem(userSeenKey, JSON.stringify([...userSeenIds]))
  if (maxTimestamp > 0) {
    localStorage.setItem(userTimestampKey, maxTimestamp.toString())
  }
  
  // Also update the ref for reactivity
  seenNotificationIds.value = userSeenIds
  lastSeenNotificationTimestamp.value = maxTimestamp.toString()
}

// Password change management with email verification
const showPasswordChangeModal = ref(false)
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const changingPassword = ref(false)
const passwordErrors = ref({})
const showPasswordUpdateWarning = ref(false)
const pwChangeStep = ref(1)
const pwChangeEmail = ref('')
const pwChangeCode = ref('')
const pwChangeToken = ref('')
const pwChangeMessage = ref('')
const pwChangeSuccess = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Image upload state
const uploadingImage = ref(false)
const uploadedImageUrl = ref(null)
const imageFileInput = ref(null)
const notificationImageBase64 = ref(null)

const developers = [
    { name: 'Jullan Maglinte', initials: 'JM', role: 'Fullstack Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/jullan.maglinte', image: '/team/jullan.jpg' },
    { name: 'Keith Laranjo', initials: 'KL', role: 'Backend Dev', year_level: '2nd year', program: 'CS', facebook: 'https://facebook.com/kei.takun.5070', image: '/team/keith.jpg' },
    { name: 'Kenzen Miñao', initials: 'KM', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/kenzen3131', image: '/team/kenzen.jpg' },
    { name: 'Christoph Bagabuyo', initials: 'CB', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/christoph.bagabuyo', image: '/team/christoph.jpg' },
    { name: 'Mischi Jeda Elumba', initials: 'MJ', role: 'UI/UX Designer', year_level: '2nd year', program: 'IS', facebook: 'https://facebook.com/mischijeda.elumba.1', image: '/team/mischi.jpg' }
  ]

const displayName = computed(() => {
  const firstName = currentUser.value.firstName || currentUser.value.first_name
  const lastName = currentUser.value.lastName || currentUser.value.last_name
  if (currentUser.value.role === 'admin' || currentUser.value.isMaster) {
    return 'Admin'
  }
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }
  return currentUser.value.name || 'User'
})

onMounted(async () => {
  // Add ESC key listener for fullscreen mode
  document.addEventListener('keydown', handleEscKey)
  
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  if (!user.studentId && !user.student_id) {
    router.push('/')
    return
  }
  currentUser.value = user
  
  // Check if user needs to update password (still using last name as password)
  if (user.requiresPasswordUpdate && !user.isMaster && user.role !== 'admin') {
    showPasswordUpdateWarning.value = true
  }
  
  // Initialize loading states
  profileImageLoading.value = false
  sidebarImageLoading.value = false
  
  // SECURITY: If user claims to be admin, verify via API using the JWT token
  // This prevents localStorage tampering - the server validates the actual JWT
  if (user.role === 'admin' || user.isMaster) {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('No auth token found for admin user')
      currentUser.value.isMaster = false
      currentUser.value.role = 'student'
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      router.push('/')
      return
    }
    
    try {
      const verifyResponse = await fetch('https://ssaam-api.vercel.app/apis/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!verifyResponse.ok) {
        console.error('Admin verification failed - token is not a valid admin token')
        currentUser.value.isMaster = false
        currentUser.value.role = 'student'
        localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
        localStorage.removeItem('authToken')
        router.push('/')
        return
      }
      
      const verifyData = await verifyResponse.json()
      if (!verifyData.isAdmin) {
        console.error('Token verified but user is not admin')
        currentUser.value.isMaster = false
        currentUser.value.role = 'student'
        localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
        router.push('/')
        return
      }
      
      currentUser.value.isMaster = true
      currentUser.value.isPrimaryAdmin = verifyData.isPrimaryAdmin
    } catch (error) {
      console.error('Failed to verify admin status:', error)
      currentUser.value.isMaster = false
      currentUser.value.role = 'student'
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      router.push('/')
      return
    }
    
    // Check admin action status for primary admin
    checkAdminActionStatus()
    
    try {
      // Fetch only current page (10-20 students)
      const response = await fetch(`https://ssaam-api.vercel.app/apis/students?page=${currentPageNum.value}&limit=${itemsPerPage.value}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer SSAAMStudents`
        }
      })
      const result = await response.json()
      const pageData = result.data || result
      
      if (response.ok && Array.isArray(pageData)) {
        // Get pagination info
        if (result.pagination) {
          paginationTotal.value = result.pagination.total
          totalPages.value = result.pagination.totalPages
        }
        
        // Normalize data
        users.value = pageData.map(s => ({
          ...s,
          studentId: s.student_id,
          firstName: s.first_name,
          middleName: s.middle_name || '',
          lastName: s.last_name,
          yearLevel: s.year_level,
          rfidCode: s.rfid_code || 'N/A',
          schoolYear: s.school_year,
          image: s.photo || s.image || ''
        }))
      } else {
        console.error('API returned error or invalid data:', pageData)
        users.value = []
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
      users.value = []
    }
    
    // Fetch statistics and pending count separately
    fetchStats()
    fetchPendingStudents()
  } else {
    users.value = JSON.parse(localStorage.getItem('users') || '[]')
  }
  
  // Fetch notifications for badge counter
  fetchNotifications()
  
  // Fetch attendance data for students to show notification banner
  if (!user.isMaster && user.role !== 'admin') {
    fetchAttendanceData()
  }
  
  // Start auto-refresh for attendance and event timers
  startAttendanceAutoRefresh()
  
  isPageLoading.value = false
})

// Fetch statistics from separate endpoint
const fetchStats = async () => {
  statsLoading.value = true
  try {
    const response = await fetch('https://ssaam-api.vercel.app/apis/students/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer SSAAMStudents`
      }
    })
    const data = await response.json()
    if (response.ok && data.stats) {
      statsData.value = data.stats
      if (data.pendingCount !== undefined) {
        pendingCount.value = data.pendingCount
      }
    }
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
  } finally {
    statsLoading.value = false
  }
}

// Fetch pending students for approval
const fetchPendingStudents = async () => {
  pendingLoading.value = true
  try {
    const response = await fetch('https://ssaam-api.vercel.app/apis/students/pending', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer SSAAMStudents`
      }
    })
    const result = await response.json()
    if (response.ok) {
      pendingStudents.value = result.data || result
      pendingCount.value = pendingStudents.value.length
    }
  } catch (error) {
    console.error('Failed to fetch pending students:', error)
  } finally {
    pendingLoading.value = false
  }
}

// Approve a student (internal implementation)
const approveStudentImpl = async (student) => {
  approvingStudent.value = student.student_id
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`https://ssaam-api.vercel.app/apis/students/${student.student_id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp(),
        ...getAdminActionHeaders()
      }
    })
    
    if (response.ok) {
      pendingStudents.value = pendingStudents.value.filter(s => s.student_id !== student.student_id)
      pendingCount.value = pendingStudents.value.length
      showNotification('Student approved successfully! They will receive an email notification.', 'success')
      fetchStats()
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = () => approveStudentImpl(student)
          showAdminKeyModal.value = true
        }
        return
      }
      const data = await response.json()
      showNotification(data.message || 'Failed to approve student', 'error')
    }
  } catch (error) {
    console.error('Failed to approve student:', error)
    showNotification('Failed to approve student. Please try again.', 'error')
  } finally {
    approvingStudent.value = null
  }
}

// Approve a student (with admin action check)
const approveStudent = (student) => withAdminAction(approveStudentImpl)(student)

// Open reject modal
const openRejectModal = (student) => {
  studentToReject.value = student
  rejectReason.value = ''
  showRejectModal.value = true
}

// Confirm reject student (internal implementation)
const confirmRejectStudentImpl = async () => {
  if (!studentToReject.value) return
  
  rejectingStudent.value = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`https://ssaam-api.vercel.app/apis/students/${studentToReject.value.student_id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp(),
        ...getAdminActionHeaders()
      },
      body: JSON.stringify({ reason: rejectReason.value })
    })
    
    if (response.ok) {
      pendingStudents.value = pendingStudents.value.filter(s => s.student_id !== studentToReject.value.student_id)
      pendingCount.value = pendingStudents.value.length
      showRejectModal.value = false
      studentToReject.value = null
      rejectReason.value = ''
      showNotification('Student registration rejected. They will receive an email notification.', 'success')
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = () => confirmRejectStudentImpl()
          showAdminKeyModal.value = true
        }
        return
      }
      const data = await response.json()
      showNotification(data.message || 'Failed to reject student', 'error')
    }
  } catch (error) {
    console.error('Failed to reject student:', error)
    showNotification('Failed to reject student. Please try again.', 'error')
  } finally {
    rejectingStudent.value = false
  }
}

// Confirm reject student (with admin action check)
const confirmRejectStudent = () => withAdminAction(confirmRejectStudentImpl)()

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const stats = computed(() => {
  // Return stats from backend if available
  if (statsData.value) {
    return statsData.value
  }
  
  // Fallback: compute from current page (if backend endpoint not available yet)
  const result = {
    BSCS: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, total: 0 },
    BSIS: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, total: 0 },
    BSIT: { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0, total: 0 }
  }
  return result
})

const totalStudents = computed(() => {
  return stats.value.BSCS.total + stats.value.BSIS.total + stats.value.BSIT.total
})

const filteredUsers = computed(() => {
  return users.value
})

const handleSearchChange = () => {
  currentPageNum.value = 1
  refreshStudents()
}

const refreshStudents = async () => {
  if (!currentUser.value.isMaster && currentUser.value.role !== 'admin') return
  
  isRefreshing.value = true
  try {
    const hasFilters = searchQuery.value.trim() || filterProgram.value || filterSchoolLevel.value
    const limit = hasFilters ? 100 : itemsPerPage.value
    const page = hasFilters ? 1 : currentPageNum.value
    
    let url = `https://ssaam-api.vercel.app/apis/students?page=${page}&limit=${limit}`
    
    if (hasFilters) {
      url = `https://ssaam-api.vercel.app/apis/students/search?page=${page}&limit=${limit}`
      if (searchQuery.value.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.value)}`
      }
      if (filterProgram.value) {
        url += `&program=${filterProgram.value}`
      }
      if (filterSchoolLevel.value) {
        url += `&yearLevel=${encodeURIComponent(filterSchoolLevel.value)}`
      }
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer SSAAMStudents`
      }
    })
    const result = await response.json()
    const apiStudents = result.data || result
    
    if (response.ok && Array.isArray(apiStudents)) {
      users.value = apiStudents.map(s => ({
        ...s,
        studentId: s.student_id,
        firstName: s.first_name,
        middleName: s.middle_name || '',
        lastName: s.last_name,
        yearLevel: s.year_level,
        rfidCode: s.rfid_code || 'N/A',
        schoolYear: s.school_year,
        image: s.photo || s.image || ''
      }))
      if (result.pagination) {
        paginationTotal.value = result.pagination.total
        totalPages.value = result.pagination.totalPages
      }
    }
  } catch (error) {
    console.error('Failed to refresh students:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Fetch settings from API
const fetchSettings = async () => {
  if (!currentUser.value.isMaster && currentUser.value.role !== 'admin') return
  
  settingsLoading.value = true
  try {
    const response = await fetch('https://ssaam-api.vercel.app/apis/settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer SSAAMStudents`
      }
    })
    const data = await response.json()
    if (response.ok && data) {
      appSettings.value = {
        userRegister: data.userRegister || { register: true, message: '' },
        userLogin: data.userLogin || { login: true, message: '' },
        rfidScanner: data.rfidScanner || { 
          checkInEnabled: true, 
          checkOutEnabled: true,
          autoDisableCheckIn: false,
          autoDisableCheckOut: false,
          checkInDisableAt: null,
          checkOutDisableAt: null
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    showNotification('Failed to load settings', 'error')
  } finally {
    settingsLoading.value = false
  }
}

// Save settings to API (internal implementation)
const saveSettingsImpl = async () => {
  if (!currentUser.value.isMaster && currentUser.value.role !== 'admin') return
  
  settingsSaving.value = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch('https://ssaam-api.vercel.app/apis/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp(),
        ...getAdminActionHeaders()
      },
      body: JSON.stringify({
        userRegister: appSettings.value.userRegister,
        userLogin: appSettings.value.userLogin,
        rfidScanner: appSettings.value.rfidScanner
      })
    })
    
    if (response.ok) {
      showNotification('Settings saved successfully!', 'success')
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = () => saveSettingsImpl()
          showAdminKeyModal.value = true
        }
        return
      }
      const error = await response.json()
      showNotification(error.message || 'Failed to save settings', 'error')
    }
  } catch (error) {
    console.error('Failed to save settings:', error)
    showNotification('Failed to save settings', 'error')
  } finally {
    settingsSaving.value = false
  }
}

// Save settings (with admin action check)
const saveSettings = () => withAdminAction(saveSettingsImpl)()

// RFID Scanner lock control functions
const saveRfidScannerSettings = async () => {
  if (!currentUser.value.isMaster && currentUser.value.role !== 'admin') return
  
  rfidScannerSaving.value = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch('https://ssaam-api.vercel.app/apis/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp(),
        ...getAdminActionHeaders()
      },
      body: JSON.stringify({
        rfidScanner: appSettings.value.rfidScanner
      })
    })
    
    if (response.ok) {
      showNotification('RFID Scanner settings saved!', 'success')
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = () => saveRfidScannerSettings()
          showAdminKeyModal.value = true
        }
        return
      }
      const error = await response.json()
      showNotification(error.message || 'Failed to save RFID settings', 'error')
    }
  } catch (error) {
    console.error('Failed to save RFID settings:', error)
    showNotification('Failed to save RFID settings', 'error')
  } finally {
    rfidScannerSaving.value = false
  }
}

const toggleCheckIn = async () => {
  appSettings.value.rfidScanner.checkInEnabled = !appSettings.value.rfidScanner.checkInEnabled
  // Clear timer when disabling
  if (!appSettings.value.rfidScanner.checkInEnabled) {
    appSettings.value.rfidScanner.autoDisableCheckIn = false
    appSettings.value.rfidScanner.checkInDisableAt = null
  }
  await saveRfidScannerSettings()
}

const toggleCheckOut = async () => {
  appSettings.value.rfidScanner.checkOutEnabled = !appSettings.value.rfidScanner.checkOutEnabled
  // Clear timer when disabling
  if (!appSettings.value.rfidScanner.checkOutEnabled) {
    appSettings.value.rfidScanner.autoDisableCheckOut = false
    appSettings.value.rfidScanner.checkOutDisableAt = null
  }
  await saveRfidScannerSettings()
}

const setCheckInTimer = async () => {
  if (checkInTimerMinutes.value < 1) {
    showNotification('Timer must be at least 1 minute', 'error')
    return
  }
  const disableAt = new Date(Date.now() + checkInTimerMinutes.value * 60 * 1000)
  appSettings.value.rfidScanner.autoDisableCheckIn = true
  appSettings.value.rfidScanner.checkInDisableAt = disableAt.toISOString()
  await saveRfidScannerSettings()
  showNotification(`Check-in will be disabled at ${disableAt.toLocaleTimeString()}`, 'info')
}

const setCheckOutTimer = async () => {
  if (checkOutTimerMinutes.value < 1) {
    showNotification('Timer must be at least 1 minute', 'error')
    return
  }
  const disableAt = new Date(Date.now() + checkOutTimerMinutes.value * 60 * 1000)
  appSettings.value.rfidScanner.autoDisableCheckOut = true
  appSettings.value.rfidScanner.checkOutDisableAt = disableAt.toISOString()
  await saveRfidScannerSettings()
  showNotification(`Check-out will be disabled at ${disableAt.toLocaleTimeString()}`, 'info')
}

// Clear all session tokens (except current admin session)
const clearAllSessionTokens = async () => {
  showClearSessionsConfirm.value = false
  clearingSessionTokens.value = true
  
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch('https://ssaam-api.vercel.app/apis/debug/session-tokens/clear?type=all', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Admin-Action-Token': adminActionToken.value || ''
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      showNotification(`Successfully cleared ${data.deletedCount || 'all'} session tokens!`, 'success')
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = clearAllSessionTokens
          showAdminKeyModal.value = true
        }
        return
      }
      const error = await response.json()
      showNotification(error.message || 'Failed to clear session tokens', 'error')
    }
  } catch (error) {
    console.error('Failed to clear session tokens:', error)
    showNotification('Failed to clear session tokens', 'error')
  } finally {
    clearingSessionTokens.value = false
  }
}

// RFID Fullscreen mode functions
const enterFullscreenMode = () => {
  if (!selectedEvent.value) {
    showNotification('Please select an event first', 'error')
    return
  }
  rfidFullscreenMode.value = true
  setTimeout(() => {
    rfidFullscreenInputRef.value?.focus()
  }, 100)
}

// Handle ESC key for fullscreen mode
const handleEscKey = (event) => {
  if (event.key === 'Escape' && rfidFullscreenMode.value) {
    rfidFullscreenMode.value = false
  }
}

const handleLogout = () => {
  showLogoutConfirmation.value = true
}

const handleLogoutWithAnimation = () => {
  isLoggingOut.value = true
  setTimeout(() => {
    showLogoutConfirmation.value = true
    isLoggingOut.value = false
  }, 300)
}

const confirmLogout = async () => {
  showLogoutConfirmation.value = false
  showLogoutAnimation.value = true
  
  try {
    const token = localStorage.getItem('authToken')
    if (token) {
      const endpoint = currentUser.value.isMaster ? 'https://ssaam-api.vercel.app/apis/masters/logout' : 'https://ssaam-api.vercel.app/apis/students/logout'
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    }
  } catch (error) {
    console.error('Logout API error:', error)
  }
  
  setTimeout(() => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userLikeId')
    localStorage.removeItem('likeActionTimestamps')
    localStorage.removeItem('likeBanUntil')
    localStorage.removeItem('likeWarningShown')
    router.push('/')
  }, 1500)
}

const openEditModalWithUser = (user) => {
  const userCopy = JSON.parse(JSON.stringify(user))
  userCopy.studentId = userCopy.studentId || userCopy.student_id
  userCopy.firstName = userCopy.firstName || userCopy.first_name || ''
  userCopy.middleName = userCopy.middleName || userCopy.middle_name || ''
  userCopy.lastName = userCopy.lastName || userCopy.last_name || ''
  userCopy.yearLevel = userCopy.yearLevel || userCopy.year_level || ''
  userCopy.rfidCode = userCopy.rfidCode || userCopy.rfid_code || ''
  userCopy.image = userCopy.image || userCopy.photo || ''
  editingUser.value = userCopy
  editImageLoading.value = false
  showEditModal.value = true
}

const editUser = (user) => {
  if (!currentUser.value.isMaster && currentUser.value.role !== 'admin') {
    showNotification('Only administrators can edit users', 'error')
    return
  }
  
  if (isPrimaryAdmin.value && !isAdminActionTokenValid()) {
    pendingEditUser.value = user
    pendingAdminAction.value = () => {
      openEditModalWithUser(pendingEditUser.value)
      pendingEditUser.value = null
    }
    showAdminKeyModal.value = true
    return
  }
  
  openEditModalWithUser(user)
}

const closeEditModal = () => {
  showEditModal.value = false
  editingUser.value = null
}

const showNotification = (message, type = 'info') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Scale down if needed
        if (width > 1200) {
          height = (height * 1200) / width
          width = 1200
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // Compress with quality adjustment
        let quality = 0.9
        let compressedBlob = null
        
        const checkSize = (blob) => {
          if (blob.size <= 80 * 1024) {
            resolve(blob)
          } else if (quality > 0.1) {
            quality -= 0.1
            canvas.toBlob(checkSize, 'image/jpeg', quality)
          } else {
            resolve(blob)
          }
        }
        
        canvas.toBlob(checkSize, 'image/jpeg', quality)
      }
    }
  })
}

const handleEditImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  editImageUploading.value = true
  showNotification('Compressing image...', 'info')

  try {
    // Compress the image to 600KB or smaller
    const compressedBlob = await compressImage(file)
    
    const formData = new FormData()
    const apiKey = getRandomApiKey()
    formData.append("key", apiKey)
    formData.append("image", compressedBlob)

    showNotification('Uploading image...', 'info')

    const res = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    if (data.success) {
      editingUser.value.image = data.data.url
      editingUser.value.photo = data.data.url
      editImageLoading.value = false
      showNotification('Image uploaded successfully!', 'success')
    } else {
      editImageLoading.value = false
      showNotification('Upload failed', 'error')
    }
  } catch (error) {
    editImageLoading.value = false
    showNotification('Upload error', 'error')
    console.error("Upload error:", error)
  } finally {
    editImageUploading.value = false
  }
}

const handleProfileImageError = () => {
  profileImageLoading.value = false
  if (profileImageRetries.value < maxRetries) {
    profileImageRetries.value++
    setTimeout(() => {
      // Force re-render by toggling loading state
      profileImageLoading.value = true
      setTimeout(() => {
        profileImageLoading.value = false
      }, 100)
    }, 1000)
  } else {
    profileImageFailed.value = true
  }
}

const goToNextPage = () => {
  if (currentPageNum.value < totalPages.value) {
    currentPageNum.value++
    refreshStudents()
  }
}

const goToPreviousPage = () => {
  if (currentPageNum.value > 1) {
    currentPageNum.value--
    refreshStudents()
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPageNum.value) {
    currentPageNum.value = page
    refreshStudents()
  }
}

const visiblePages = computed(() => {
  if (totalPages.value <= 5) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1)
  }
  
  const pages = []
  const start = Math.max(1, currentPageNum.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const handleSidebarImageError = () => {
  sidebarImageLoading.value = false
  if (sidebarImageRetries.value < maxRetries) {
    sidebarImageRetries.value++
    setTimeout(() => {
      sidebarImageLoading.value = true
      setTimeout(() => {
        sidebarImageLoading.value = false
      }, 100)
    }, 1000)
  } else {
    sidebarImageFailed.value = true
  }
}

const handleStudentPhotoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  studentPhotoUploading.value = true;
  const maxUploadRetries = 3;
  let uploadSuccess = false;
  try {
    const compressedBlob = await compressImage(file);
    for (let attempt = 1; attempt <= maxUploadRetries; attempt++) {
      try {
        const apiKey = getRandomApiKey();
        const uploadForm = new FormData();
        uploadForm.append("key", apiKey);
        uploadForm.append("image", compressedBlob, "photo.jpg");
        const res = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: uploadForm,
        });
        const data = await res.json();
        if (data.success) {
          const photoUrl = data.data.url;
          const studentId = currentUser.value.studentId || currentUser.value.student_id;
          const updateResponse = await fetch(`https://ssaam-api.vercel.app/apis/students/${studentId}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer SSAAMStudents`
            },
            body: JSON.stringify({
              student_id: studentId,
              first_name: currentUser.value.firstName || currentUser.value.first_name,
              middle_name: currentUser.value.middleName || currentUser.value.middle_name || '',
              last_name: currentUser.value.lastName || currentUser.value.last_name,
              email: currentUser.value.email,
              rfid_code: currentUser.value.rfidCode || currentUser.value.rfid_code || 'N/A',
              year_level: currentUser.value.yearLevel || currentUser.value.year_level,
              program: currentUser.value.program,
              photo: photoUrl,
              _ssaam_access_token: encodeTimestamp()
            })
          });
          if (updateResponse.ok) {
            currentUser.value.image = photoUrl;
            currentUser.value.photo = photoUrl;
            const updatedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            updatedUser.image = photoUrl;
            updatedUser.photo = photoUrl;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            profileImageFailed.value = false;
            uploadSuccess = true;
            showNotification('Photo updated successfully!', 'success');
            break;
          }
        } else {
          if (attempt < maxUploadRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        if (attempt < maxUploadRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    if (!uploadSuccess) {
      showNotification('Failed to update photo. Please try again.', 'error');
    }
  } catch (error) {
    showNotification('Image processing error. Please try again.', 'error');
  }
  studentPhotoUploading.value = false;
};

const saveUserImpl = async () => {
  if (!editingUser.value) return
  
  if (!currentUser.value.isMaster && currentUser.value.role !== 'admin') {
    showNotification('Only administrators can edit users', 'error')
    closeEditModal()
    return
  }
  
  const studentId = editingUser.value.studentId || editingUser.value.student_id
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
  
  if (!token) {
    showNotification('Admin authentication required', 'error')
    closeEditModal()
    return
  }
  
  savingUser.value = true
  
  try {
    const updateData = {
      student_id: studentId,
      first_name: (editingUser.value.firstName || editingUser.value.first_name || '').toUpperCase(),
      middle_name: (editingUser.value.middleName || editingUser.value.middle_name || '').toUpperCase(),
      last_name: (editingUser.value.lastName || editingUser.value.last_name || '').toUpperCase(),
      email: editingUser.value.email,
      rfid_code: editingUser.value.rfidCode || editingUser.value.rfid_code || 'N/A',
      year_level: editingUser.value.yearLevel || editingUser.value.year_level,
      program: editingUser.value.program,
      photo: editingUser.value.image || editingUser.value.photo || '',
      _ssaam_access_token: encodeTimestamp()
    }
    
    const response = await fetch(`https://ssaam-api.vercel.app/apis/students/${studentId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp(),
        ...getAdminActionHeaders()
      },
      body: JSON.stringify(updateData)
    })
    
    if (response.ok) {
      // Also update role if it was changed (role is updated via separate endpoint)
      const newRole = editingUser.value.role
      const originalUser = users.value.find(u => (u.studentId || u.student_id) === studentId)
      const originalRole = originalUser?.role
      
      if (newRole && newRole !== originalRole) {
        try {
          const roleResponse = await fetch(`https://ssaam-api.vercel.app/apis/students/${studentId}/role`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-SSAAM-TS': encodeTimestamp(),
              ...getAdminActionHeaders()
            },
            body: JSON.stringify({ 
              role: newRole.toLowerCase(),
              _ssaam_access_token: encodeTimestamp()
            })
          })
          
          if (!roleResponse.ok) {
            const roleError = await roleResponse.json()
            showNotification(roleError.message || 'Failed to update role', 'error')
          }
        } catch (roleErr) {
          console.error('Error updating role:', roleErr)
        }
      }
      
      // Also update RFID if it was changed (this auto-verifies the user)
      const newRfid = editingUser.value.rfidCode || editingUser.value.rfid_code
      const originalRfid = originalUser?.rfidCode || originalUser?.rfid_code
      
      if (newRfid && newRfid !== 'N/A' && newRfid !== originalRfid) {
        try {
          const rfidResponse = await fetch(`https://ssaam-api.vercel.app/apis/students/${studentId}/rfid`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-SSAAM-TS': encodeTimestamp(),
              ...getAdminActionHeaders()
            },
            body: JSON.stringify({ 
              rfid_code: newRfid,
              admin_verification_token: 'admin_update',
              _ssaam_access_token: encodeTimestamp()
            })
          })
          
          if (rfidResponse.ok) {
            // Update local user data to show verified status
            editingUser.value.rfid_status = 'verified'
          }
        } catch (rfidErr) {
          console.error('Error updating RFID:', rfidErr)
        }
      }
      
      const index = users.value.findIndex(u => (u.studentId || u.student_id) === studentId)
      if (index !== -1) {
        users.value[index] = { ...editingUser.value, ...updateData, studentId, role: newRole, rfid_status: editingUser.value.rfid_status }
      }
      showNotification('User updated successfully', 'success')
      refreshStudents()
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = () => saveUserImpl()
          showAdminKeyModal.value = true
        }
        return
      }
      const errorData = await response.json()
      showNotification(errorData.message || 'Failed to update user', 'error')
    }
  } catch (error) {
    console.error('Error updating user:', error)
    showNotification('Error updating user', 'error')
  } finally {
    savingUser.value = false
  }
  
  closeEditModal()
}

const saveUser = () => withAdminAction(saveUserImpl)()

const deleteUser = (studentId) => {
  userToDelete.value = studentId
  showDeleteConfirm.value = true
}

const confirmDeleteImpl = async () => {
  // Check if user is admin
  if (!currentUser.value.isMaster && currentUser.value.role !== 'admin') {
    showNotification('Only administrators can delete users', 'error')
    showDeleteConfirm.value = false
    userToDelete.value = null
    return
  }
  
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
  
  if (!token) {
    showNotification('Admin authentication required', 'error')
    showDeleteConfirm.value = false
    userToDelete.value = null
    return
  }
  
  if (userToDelete.value) {
    try {
      const response = await fetch(`https://ssaam-api.vercel.app/apis/students/${userToDelete.value}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-SSAAM-TS': encodeTimestamp(),
          ...getAdminActionHeaders()
        }
      })
      
      if (response.ok) {
        users.value = users.value.filter(u => (u.studentId || u.student_id) !== userToDelete.value)
        showNotification('User deleted successfully', 'success')
        fetchStats()
      } else {
        if (response.status === 403) {
          const handled = await handleAdminActionError(response)
          if (!handled) {
            pendingAdminAction.value = () => confirmDeleteImpl()
            showAdminKeyModal.value = true
          }
          return
        }
        const errorData = await response.json()
        showNotification(errorData.message || 'Failed to delete user', 'error')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showNotification('Error deleting user', 'error')
    }
  }
  showDeleteConfirm.value = false
  userToDelete.value = null
}

const confirmDelete = () => withAdminAction(confirmDeleteImpl)()

const fetchNotifications = async () => {
  notificationsLoading.value = true
  try {
    const response = await fetch('https://ssaam-api.vercel.app/apis/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer SSAAMStudents`
      }
    })
    const result = await response.json()
    if (response.ok) {
      notifications.value = result.data || result || []
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    notifications.value = []
  } finally {
    notificationsLoading.value = false
  }
}

const fetchAttendanceData = async () => {
  attendanceLoading.value = true
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
  const isAdmin = currentUser.value.role === 'admin' || currentUser.value.isMaster
  
  try {
    if (isAdmin) {
      const response = await fetch('https://ssaam-api.vercel.app/apis/attendance/events', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-SSAAM-TS': encodeTimestamp()
        }
      })
      if (response.ok) {
        const result = await response.json()
        attendanceEvents.value = result.data || []
      }
    } else {
      const [eventsRes, myRecordsRes] = await Promise.all([
        fetch('https://ssaam-api.vercel.app/apis/attendance/events/active', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-SSAAM-TS': encodeTimestamp()
          }
        }),
        fetch('https://ssaam-api.vercel.app/apis/attendance/my-records', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-SSAAM-TS': encodeTimestamp()
          }
        })
      ])
      
      if (eventsRes.ok) {
        const eventsResult = await eventsRes.json()
        attendanceEvents.value = eventsResult.data || []
      }
      if (myRecordsRes.ok) {
        const recordsResult = await myRecordsRes.json()
        myAttendanceRecords.value = recordsResult.data || []
      }
    }
  } catch (error) {
    console.error('Failed to fetch attendance data:', error)
  } finally {
    attendanceLoading.value = false
  }
}

const createAttendanceEvent = async () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
  try {
    const eventPayload = {
      title: newEvent.value.title,
      description: newEvent.value.description || '',
      location: newEvent.value.location || '',
      event_date: newEvent.value.date,
      start_time: newEvent.value.startTime,
      end_time: newEvent.value.endTime,
      status: newEvent.value.status || 'draft'
    }
    const response = await fetch('https://ssaam-api.vercel.app/apis/attendance/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp(),
        ...getAdminActionHeaders()
      },
      body: JSON.stringify(eventPayload)
    })
    
    if (response.ok) {
      showNotification('Event created successfully', 'success')
      showCreateEventModal.value = false
      newEvent.value = { title: '', description: '', location: '', date: '', startTime: '', endTime: '', status: 'draft' }
      fetchAttendanceData()
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = () => createAttendanceEvent()
          showAdminKeyModal.value = true
        }
        return
      }
      const errorData = await response.json()
      showNotification(errorData.message || 'Failed to create event', 'error')
    }
  } catch (error) {
    console.error('Error creating event:', error)
    showNotification('Error creating event', 'error')
  }
}

const updateAttendanceEvent = async () => {
  if (!selectedEvent.value) return
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
  try {
    // Prepare payload with proper field mapping (date -> event_date for API)
    const eventPayload = {
      ...selectedEvent.value,
      event_date: selectedEvent.value.date || selectedEvent.value.event_date
    }
    
    const response = await fetch(`https://ssaam-api.vercel.app/apis/attendance/events/${selectedEvent.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp(),
        ...getAdminActionHeaders()
      },
      body: JSON.stringify(eventPayload)
    })
    
    if (response.ok) {
      showNotification('Event updated successfully', 'success')
      showEditEventModal.value = false
      fetchAttendanceData()
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = () => updateAttendanceEvent()
          showAdminKeyModal.value = true
        }
        return
      }
      const errorData = await response.json()
      showNotification(errorData.message || 'Failed to update event', 'error')
    }
  } catch (error) {
    console.error('Error updating event:', error)
    showNotification('Error updating event', 'error')
  }
}

const deleteAttendanceEvent = async (eventId) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
  try {
    const response = await fetch(`https://ssaam-api.vercel.app/apis/attendance/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp(),
        ...getAdminActionHeaders()
      }
    })
    
    if (response.ok) {
      showNotification('Event deleted successfully', 'success')
      fetchAttendanceData()
    } else {
      if (response.status === 403) {
        const handled = await handleAdminActionError(response)
        if (!handled) {
          pendingAdminAction.value = () => deleteAttendanceEvent(eventId)
          showAdminKeyModal.value = true
        }
        return
      }
      const errorData = await response.json()
      showNotification(errorData.message || 'Failed to delete event', 'error')
    }
  } catch (error) {
    console.error('Error deleting event:', error)
    showNotification('Error deleting event', 'error')
  }
}

const fetchEventLogs = async (eventId) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
  attendanceLoading.value = true
  try {
    const params = new URLSearchParams()
    if (eventLogsFilter.value.yearLevel) params.append('yearLevel', eventLogsFilter.value.yearLevel)
    if (eventLogsFilter.value.program) params.append('program', eventLogsFilter.value.program)
    if (eventLogsFilter.value.search) params.append('search', eventLogsFilter.value.search)
    
    const response = await fetch(`https://ssaam-api.vercel.app/apis/attendance/events/${eventId}/logs?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp()
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      attendanceLogs.value = result.data || []
    }
  } catch (error) {
    console.error('Error fetching event logs:', error)
  } finally {
    attendanceLoading.value = false
  }
}

const handleRfidKeydown = (event) => {
  const now = Date.now()
  const timeDiff = now - rfidLastKeyTime.value
  const SCANNER_THRESHOLD = 30
  
  if (timeDiff < SCANNER_THRESHOLD || rfidLastKeyTime.value === 0) {
    if (event.key !== 'Enter') {
      rfidInputBuffer.value += event.key
    }
  } else {
    rfidInputBuffer.value = event.key === 'Enter' ? '' : event.key
  }
  rfidLastKeyTime.value = now
  
  if (event.key === 'Enter' && rfidInputBuffer.value.length > 5) {
    event.preventDefault()
    processRfidScan(rfidInputBuffer.value)
    rfidInputBuffer.value = ''
    rfidInput.value = ''
  }
}

const switchToScannerTab = () => {
  if (rfidScannerVerified.value) {
    attendanceTab.value = 'scanner'
  } else {
    pendingAdminAction.value = () => {
      rfidScannerVerified.value = true
      attendanceTab.value = 'scanner'
    }
    showAdminKeyModal.value = true
  }
}

const processRfidScan = async (rfidCode) => {
  if (!selectedEvent.value || rfidProcessing.value) return
  
  rfidProcessing.value = true
  rfidResult.value = null
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
  
  try {
    const response = await fetch(`https://ssaam-api.vercel.app/apis/attendance/events/${selectedEvent.value._id}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-TS': encodeTimestamp()
      },
      body: JSON.stringify({ rfid_code: rfidCode })
    })
    
    const result = await response.json()
    if (response.ok) {
      rfidResult.value = { success: true, ...result }
      showNotification(`${result.action === 'check_in' ? 'Check-in' : 'Check-out'}: ${result.student?.full_name || 'Student'}`, 'success')
      fetchEventLogs(selectedEvent.value._id)
    } else {
      rfidResult.value = { success: false, message: result.message }
      showNotification(result.message || 'RFID scan failed', 'error')
    }
  } catch (error) {
    console.error('RFID scan error:', error)
    rfidResult.value = { success: false, message: 'Error processing RFID' }
    showNotification('Error processing RFID scan', 'error')
  } finally {
    rfidProcessing.value = false
    setTimeout(() => { rfidResult.value = null }, 3000)
    // Keep RFID input focused for continuous scanning
    setTimeout(() => {
      if (rfidInputRef.value) {
        rfidInputRef.value.focus()
      }
    }, 100)
  }
}

const openEventLogs = (event) => {
  selectedEvent.value = event
  showEventLogsModal.value = true
  fetchEventLogs(event._id)
}

const openEditEvent = (event) => {
  selectedEvent.value = { 
    ...event,
    date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : event.date
  }
  showEditEventModal.value = true
}

const formatEventDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

const formatEventTime = (timeStr) => {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

// Helper function to get current Philippine time (UTC+8)
const getPhilippineTime = () => {
  const now = new Date()
  // Get UTC time and add 8 hours for Philippine timezone
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utcTime + (8 * 60 * 60 * 1000))
}

// Helper function to create event end time in Philippine timezone
const getEventEndTimeInPH = (event) => {
  if (!event.end_time) return null
  
  // Parse the event date (YYYY-MM-DD format)
  const dateStr = event.event_date || event.date
  if (!dateStr) return null
  
  // Extract date parts
  const dateParts = dateStr.split('T')[0].split('-')
  const year = parseInt(dateParts[0])
  const month = parseInt(dateParts[1]) - 1 // Month is 0-indexed
  const day = parseInt(dateParts[2])
  
  // Parse end time (HH:MM format)
  const [hours, minutes] = event.end_time.split(':').map(Number)
  
  // Create date in Philippine timezone
  // We create a UTC date, then subtract 8 hours to account for PH being UTC+8
  // This way when we compare with getPhilippineTime(), the math works out
  const eventEndPH = new Date(Date.UTC(year, month, day, hours - 8, minutes, 0, 0))
  return eventEndPH
}

// Helper function to get event start time in Philippine timezone
const getEventStartTimeInPH = (event) => {
  if (!event.start_time) return null
  
  const dateStr = event.event_date || event.date
  if (!dateStr) return null
  
  const dateParts = dateStr.split('T')[0].split('-')
  const year = parseInt(dateParts[0])
  const month = parseInt(dateParts[1]) - 1
  const day = parseInt(dateParts[2])
  
  const [hours, minutes] = event.start_time.split(':').map(Number)
  const eventStartPH = new Date(Date.UTC(year, month, day, hours - 8, minutes, 0, 0))
  return eventStartPH
}

// Check if event has actually ended (using Philippine time)
const hasEventEndedPH = (event) => {
  const eventEnd = getEventEndTimeInPH(event)
  if (!eventEnd) return false
  const nowPH = getPhilippineTime()
  return nowPH >= eventEnd
}

const getAttendanceStatus = (eventId) => {
  const record = myAttendanceRecords.value.find(r => r.event_id === eventId || r.event?._id === eventId)
  const event = attendanceEvents.value.find(e => e._id === eventId || e.event_id === eventId)
  
  // Check if event has actually ended using Philippine time
  const eventEnded = event ? hasEventEndedPH(event) : false
  
  if (!record) {
    // No attendance record - check if event is still active using Philippine time
    if (event && event.status === 'active' && !eventEnded) {
      return 'active'  // Event is still active, pending check-in
    }
    // Only mark absent if event has actually ended
    if (eventEnded || (event && event.status !== 'active')) {
      return 'absent'
    }
    return 'active'  // Default to active if event status unclear
  }
  
  // Has a record - check attendance status
  if (record.check_out_at || record.check_out_time) return 'present'  // Complete attendance
  if (record.check_in_at || record.check_in_time) return 'incomplete'  // Checked in but not out
  
  // Has record but no check-in/out (shouldn't happen normally)
  return eventEnded ? 'absent' : 'active'
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'present': return 'bg-green-100 text-green-800'
    case 'incomplete': return 'bg-yellow-100 text-yellow-800'
    case 'absent': return 'bg-red-100 text-red-800'
    case 'active': return 'bg-blue-100 text-blue-800'
    case 'draft': return 'bg-gray-100 text-gray-800'
    case 'closed': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const activeUnattendedEvents = computed(() => {
  if (currentUser.value.role === 'admin' || currentUser.value.isMaster) return []
  if (attendanceLoading.value) return []
  return attendanceEvents.value.filter(event => {
    const eventId = event._id || event.event_id
    const status = getAttendanceStatus(eventId)
    return event.status === 'active' && (status === 'active' || status === 'incomplete')
  })
})

// Sort attendance logs by check-in time (most recent first)
const sortedAttendanceLogs = computed(() => {
  return [...attendanceLogs.value].sort((a, b) => {
    const aTime = a.check_in_at || a.check_in_time || a.created_at || 0
    const bTime = b.check_in_at || b.check_in_time || b.created_at || 0
    return new Date(bTime) - new Date(aTime)
  })
})

// Check if a log entry is a recent check-in (within last 30 seconds)
const isRecentCheckIn = (log) => {
  const checkInTime = log.check_in_at || log.check_in_time || log.created_at
  if (!checkInTime) return false
  const now = new Date()
  const logTime = new Date(checkInTime)
  return (now - logTime) < 30000 // 30 seconds
}

const clearNotificationImage = () => {
  notificationImage.value = null
  notificationImagePreview.value = null
  notificationImageUrl.value = ''
  uploadedImageUrl.value = null
  notificationImageBase64.value = null
  if (imageFileInput.value) {
    imageFileInput.value.value = ''
  }
}

const compressNotificationImage = (dataUrl, maxSizeKB = 100) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      let width = img.width
      let height = img.height
      const targetBytes = maxSizeKB * 1024 * 1.37
      
      const compress = (w, h, q) => {
        canvas.width = w
        canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        return canvas.toDataURL('image/jpeg', q)
      }
      
      let maxDim = 1200
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim
          width = maxDim
        } else {
          width = (width / height) * maxDim
          height = maxDim
        }
      }
      
      let quality = 0.9
      let result = compress(width, height, quality)
      
      while (result.length > targetBytes && quality > 0.1) {
        quality -= 0.1
        result = compress(width, height, quality)
      }
      
      while (result.length > targetBytes && (width > 400 || height > 400)) {
        width = Math.floor(width * 0.7)
        height = Math.floor(height * 0.7)
        quality = 0.7
        result = compress(width, height, quality)
        
        let q = quality
        while (result.length > targetBytes && q > 0.2) {
          q -= 0.1
          result = compress(width, height, q)
        }
      }
      
      if (result.length > targetBytes) {
        width = Math.floor(width * 0.5)
        height = Math.floor(height * 0.5)
        result = compress(width, height, 0.5)
      }
      
      resolve(result)
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = dataUrl
  })
}

const handleImageFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    showNotification('Please select an image file', 'error')
    return
  }
  
  if (file.size > 10 * 1024 * 1024) {
    showNotification('Image must be less than 10MB', 'error')
    return
  }
  
  uploadingImage.value = true
  
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const originalData = e.target.result
        notificationImagePreview.value = originalData
        
        const compressed = await compressNotificationImage(originalData, 100)
        notificationImageBase64.value = compressed
        notificationImageUrl.value = ''
        
        const compressedSizeKB = Math.round(compressed.length * 0.73 / 1024)
        showNotification(`Image compressed to ~${compressedSizeKB}KB`, 'success')
      } catch (err) {
        console.error('Compression failed:', err)
        notificationImageBase64.value = e.target.result
        showNotification('Using original image (compression failed)', 'warning')
      } finally {
        uploadingImage.value = false
      }
    }
    reader.onerror = () => {
      showNotification('Failed to read image file', 'error')
      uploadingImage.value = false
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('Image selection error:', error)
    showNotification('Failed to process image', 'error')
    uploadingImage.value = false
  }
}

const isValidImageUrl = (url) => {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const handleImageUrlInput = () => {
  // Clear any previously uploaded image when entering URL
  notificationImage.value = null
  notificationImagePreview.value = null
  uploadedImageUrl.value = null
}

const handleImageUrlError = (e) => {
  console.error('Failed to load image from URL')
  showNotification('Unable to load image from URL. Please check the URL is correct.', 'error')
}

const openEditNotification = (notif) => {
  editNotificationData.value = {
    _id: notif._id,
    title: notif.title,
    message: notif.message || notif.content,
    priority: notif.priority || 'normal'
  }
  showEditNotificationModal.value = true
}

const closeEditNotificationModal = () => {
  showEditNotificationModal.value = false
  editNotificationData.value = null
}

const saveEditedNotification = async () => {
  if (!editNotificationData.value || !editNotificationData.value.title.trim() || !editNotificationData.value.message.trim()) return
  
  savingEditedNotification.value = true
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
    const response = await fetch(`https://ssaam-api.vercel.app/apis/notifications/${editNotificationData.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: editNotificationData.value.title,
        message: editNotificationData.value.message,
        priority: editNotificationData.value.priority
      })
    })
    
    if (response.ok) {
      showNotification('Announcement updated successfully!', 'success')
      closeEditNotificationModal()
      fetchNotifications()
    } else {
      const error = await response.json()
      showNotification(error.message || 'Failed to update announcement', 'error')
    }
  } catch (error) {
    console.error('Failed to update notification:', error)
    showNotification('Failed to update announcement', 'error')
  } finally {
    savingEditedNotification.value = false
  }
}

const openImagePreview = (url) => {
  imagePreviewUrl.value = url
  showImagePreviewModal.value = true
}

const getImageFileName = (url) => {
  if (!url) return 'image.jpg'
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split('/').pop()
    if (fileName && fileName.includes('.')) {
      return fileName
    }
    return 'announcement-image.jpg'
  } catch {
    return 'announcement-image.jpg'
  }
}

const handleNotifImageError = (notifId, imageUrl, event) => {
  const currentRetries = notifImageRetries.value[notifId] || 0
  if (currentRetries < MAX_NOTIF_IMAGE_RETRIES) {
    notifImageRetries.value[notifId] = currentRetries + 1
    setTimeout(() => {
      const imgElement = event.target
      if (imgElement) {
        const separator = imageUrl.includes('?') ? '&' : '?'
        imgElement.src = `${imageUrl}${separator}retry=${Date.now()}`
      }
    }, 1000 * (currentRetries + 1))
  } else {
    notifImageFailed.value[notifId] = true
  }
}

const retryNotifImage = (notifId, imageUrl) => {
  notifImageRetries.value[notifId] = 0
  notifImageFailed.value[notifId] = false
}

const formatNotificationDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
  return date.toLocaleDateString('en-US', options)
}

const formatMessageWithLinks = (text) => {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  return escapedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ssaam-link">${url}</a>`
  })
}

const uploadToImgbb = async (base64Image) => {
  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
    const formData = new FormData()
    formData.append('key', getRandomApiKey())
    formData.append('image', base64Data)
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    if (data.success) {
      return { success: true, url: data.data.url }
    }
    return { success: false, error: data.error?.message || 'Upload failed' }
  } catch (error) {
    console.error('ImgBB upload error:', error)
    return { success: false, error: error.message }
  }
}

const postNotification = async () => {
  if (!newNotification.value.title.trim() || !newNotification.value.content.trim()) return
  
  postingNotification.value = true
  uploadingImage.value = !!notificationImageBase64.value
  
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
    
    const payload = {
      title: newNotification.value.title,
      message: newNotification.value.content,
      priority: 'normal'
    }
    
    // If base64 image is selected, upload to ImgBB first then use URL
    if (notificationImageBase64.value) {
      showNotification('Uploading image...', 'info')
      const imgbbResult = await uploadToImgbb(notificationImageBase64.value)
      if (imgbbResult.success) {
        payload.image_url = imgbbResult.url
      } else {
        showNotification('Image upload failed: ' + imgbbResult.error, 'error')
        postingNotification.value = false
        uploadingImage.value = false
        return
      }
    }
    // Otherwise use URL if provided
    else if (notificationImageUrl.value && isValidImageUrl(notificationImageUrl.value)) {
      payload.image_url = notificationImageUrl.value
    }
    
    const response = await fetch('https://ssaam-api.vercel.app/apis/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    
    if (response.ok) {
      showNotification('Announcement posted successfully!', 'success')
      newNotification.value = { title: '', content: '', type: 'announcement' }
      clearNotificationImage()
      fetchNotifications()
    } else {
      const error = await response.json()
      showNotification(error.message || 'Failed to post announcement', 'error')
    }
  } catch (error) {
    console.error('Failed to post notification:', error)
    showNotification('Failed to post announcement', 'error')
  } finally {
    postingNotification.value = false
    uploadingImage.value = false
  }
}

const deleteNotification = async (notifId) => {
  if (!confirm('Are you sure you want to delete this announcement?')) return
  
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
    const response = await fetch(`https://ssaam-api.vercel.app/apis/notifications/${notifId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      notifications.value = notifications.value.filter(n => n._id !== notifId)
      showNotification('Announcement deleted successfully', 'success')
    } else {
      const error = await response.json()
      showNotification(error.message || 'Failed to delete announcement', 'error')
    }
  } catch (error) {
    console.error('Failed to delete notification:', error)
    showNotification('Failed to delete announcement', 'error')
  }
}

const isLikedByCurrentUser = (notif) => {
  if (!notif.liked_by || !Array.isArray(notif.liked_by)) return false
  
  // Get current user's ID - check all possible ID fields including the stored userLikeId from server
  const userLikeId = localStorage.getItem('userLikeId')
  const userId = currentUser.value.studentId || currentUser.value.student_id || currentUser.value._id || currentUser.value.id || currentUser.value.username
  
  // Check if user's ID is in the liked_by array (check both userId and userLikeId)
  if (userId && notif.liked_by.includes(userId)) {
    return true
  }
  
  // Also check the server-provided userLikeId (in case it's different)
  if (userLikeId && notif.liked_by.includes(userLikeId)) {
    return true
  }
  
  return false
}

const isLikeBanned = () => {
  const now = Date.now()
  if (likeBanUntil.value > now) {
    const remainingMins = Math.ceil((likeBanUntil.value - now) / 60000)
    return { banned: true, remainingMins }
  }
  return { banned: false }
}

const checkLikeRateLimit = () => {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  
  const recentActions = likeActionTimestamps.value.filter(ts => ts > oneMinuteAgo)
  likeActionTimestamps.value = recentActions
  localStorage.setItem('likeActionTimestamps', JSON.stringify(recentActions))
  
  return recentActions.length
}

const recordLikeAction = () => {
  const now = Date.now()
  likeActionTimestamps.value.push(now)
  localStorage.setItem('likeActionTimestamps', JSON.stringify(likeActionTimestamps.value))
}

const isLikeDisabled = (notifId) => {
  if (isLikeBanned().banned) return true
  return likeInProgress.value[notifId] || (likeCooldowns.value[notifId] && Date.now() < likeCooldowns.value[notifId])
}

const toggleLike = async (notif) => {
  const notifId = notif._id
  
  const banCheck = isLikeBanned()
  if (banCheck.banned) {
    showNotification(`You are banned from liking for ${banCheck.remainingMins} more minutes. Please wait.`, 'error')
    return
  }
  
  const recentActionCount = checkLikeRateLimit()
  
  if (recentActionCount >= LIKE_WARNING_THRESHOLD) {
    if (likeWarningShown.value) {
      likeBanUntil.value = Date.now() + LIKE_BAN_DURATION_MS
      localStorage.setItem('likeBanUntil', likeBanUntil.value.toString())
      likeWarningShown.value = false
      localStorage.setItem('likeWarningShown', 'false')
      likeActionTimestamps.value = []
      localStorage.setItem('likeActionTimestamps', '[]')
      showNotification('You have been banned from liking for 1 hour due to excessive activity.', 'error')
      return
    } else {
      likeWarningShown.value = true
      localStorage.setItem('likeWarningShown', 'true')
      showNotification('Warning: You are reacting too fast! Slow down or you will be banned for 1 hour.', 'warning')
    }
  }
  
  if (isLikeDisabled(notifId)) {
    return
  }
  
  likeInProgress.value[notifId] = true
  recordLikeAction()
  
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
    const visitorId = currentUser.value.studentId || currentUser.value.student_id || currentUser.value._id
    
    const response = await fetch(`https://ssaam-api.vercel.app/apis/notifications/${notif._id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id: visitorId })
    })
    
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}))
      const retryAfter = (data.retryAfter || 5) * 1000
      showNotification('Too many requests. Please wait a moment.', 'error')
      likeCooldowns.value[notifId] = Date.now() + retryAfter
      return
    }
    
    if (response.status === 401) {
      // Session expired or invalid - prompt user to re-login
      showNotification('Your session has expired. Please log in again to like posts.', 'error')
      return
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      showNotification(errorData.message || 'Failed to update like', 'error')
      return
    }
    
    if (response.ok) {
      const data = await response.json()
      const serverUserId = data.user_id
      
      // Store the server's user ID for consistent like tracking
      if (serverUserId) {
        localStorage.setItem('userLikeId', serverUserId)
      }
      
      const notifIndex = notifications.value.findIndex(n => n._id === notif._id)
      if (notifIndex > -1) {
        // Update liked_by array from server response (includes total like count)
        if (data.like_count !== undefined) {
          // Sync with server's liked_by array if available
          if (data.liked_by && Array.isArray(data.liked_by)) {
            notifications.value[notifIndex].liked_by = data.liked_by
          } else {
            // Manually update based on server response
            if (!notifications.value[notifIndex].liked_by) {
              notifications.value[notifIndex].liked_by = []
            }
            const likeId = serverUserId || visitorId
            if (data.liked) {
              if (!notifications.value[notifIndex].liked_by.includes(likeId)) {
                notifications.value[notifIndex].liked_by.push(likeId)
              }
            } else {
              notifications.value[notifIndex].liked_by = notifications.value[notifIndex].liked_by.filter(id => id !== likeId && id !== visitorId)
            }
          }
        }
      }
      likeCooldowns.value[notifId] = Date.now() + LIKE_COOLDOWN_MS
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likeInProgress.value[notifId] = false
  }
}

const closePasswordChangeModal = () => {
  showPasswordChangeModal.value = false
  pwChangeStep.value = 1
  pwChangeEmail.value = ''
  pwChangeCode.value = ''
  pwChangeToken.value = ''
  pwChangeMessage.value = ''
  pwChangeSuccess.value = false
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  passwordErrors.value = {}
  showNewPassword.value = false
  showConfirmPassword.value = false
}

const requestPasswordChangeCode = async () => {
  changingPassword.value = true
  pwChangeMessage.value = ''
  try {
    const token = encodeTimestamp()
    const studentId = currentUser.value.studentId || currentUser.value.student_id
    
    const response = await fetch('https://ssaam-api.vercel.app/apis/password-reset/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SSAAMStudents',
        'X-SSAAM-TS': token
      },
      body: JSON.stringify({
        student_id: studentId,
        email: pwChangeEmail.value.trim(),
        _ssaam_access_token: token
      })
    })
    
    const data = await response.json()
    if (response.ok) {
      pwChangeSuccess.value = true
      pwChangeMessage.value = 'Verification code sent to your email!'
      pwChangeStep.value = 2
    } else {
      pwChangeSuccess.value = false
      pwChangeMessage.value = data.message || 'Failed to send verification code'
    }
  } catch (error) {
    pwChangeSuccess.value = false
    pwChangeMessage.value = 'Network error. Please try again.'
  } finally {
    changingPassword.value = false
  }
}

const verifyPasswordChangeCode = async () => {
  changingPassword.value = true
  pwChangeMessage.value = ''
  try {
    const token = encodeTimestamp()
    const studentId = currentUser.value.studentId || currentUser.value.student_id
    
    const response = await fetch('https://ssaam-api.vercel.app/apis/password-reset/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SSAAMStudents',
        'X-SSAAM-TS': token
      },
      body: JSON.stringify({
        student_id: studentId,
        code: pwChangeCode.value.trim(),
        _ssaam_access_token: token
      })
    })
    
    const data = await response.json()
    if (response.ok) {
      pwChangeSuccess.value = true
      pwChangeMessage.value = 'Code verified!'
      pwChangeToken.value = data.reset_token
      pwChangeStep.value = 3
    } else {
      pwChangeSuccess.value = false
      pwChangeMessage.value = data.message || 'Invalid verification code'
    }
  } catch (error) {
    pwChangeSuccess.value = false
    pwChangeMessage.value = 'Verification failed. Please try again.'
  } finally {
    changingPassword.value = false
  }
}

const completePasswordChange = async () => {
  passwordErrors.value = {}
  
  if (!passwordForm.value.newPassword) {
    passwordErrors.value.newPassword = 'New password is required'
    return
  } else if (passwordForm.value.newPassword.length < 6) {
    passwordErrors.value.newPassword = 'Password must be at least 6 characters'
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Passwords do not match'
    return
  }
  
  changingPassword.value = true
  pwChangeMessage.value = ''
  try {
    const token = encodeTimestamp()
    const studentId = currentUser.value.studentId || currentUser.value.student_id
    
    const response = await fetch('https://ssaam-api.vercel.app/apis/password-reset/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SSAAMStudents',
        'X-SSAAM-TS': token
      },
      body: JSON.stringify({
        student_id: studentId,
        reset_token: pwChangeToken.value,
        new_password: passwordForm.value.newPassword,
        _ssaam_access_token: token
      })
    })
    
    const data = await response.json()
    if (response.ok) {
      showNotification('Password changed successfully!', 'success')
      closePasswordChangeModal()
      showPasswordUpdateWarning.value = false
      const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      storedUser.requiresPasswordUpdate = false
      localStorage.setItem('currentUser', JSON.stringify(storedUser))
      currentUser.value.requiresPasswordUpdate = false
    } else {
      pwChangeSuccess.value = false
      pwChangeMessage.value = data.message || 'Failed to change password'
    }
  } catch (error) {
    pwChangeSuccess.value = false
    pwChangeMessage.value = 'Password change failed. Please try again.'
  } finally {
    changingPassword.value = false
  }
}

// Calculate time remaining for each active event
const updateEventTimeRemaining = () => {
  const nowPH = getPhilippineTime()
  const isAdmin = currentUser.value.role === 'admin' || currentUser.value.isMaster
  
  attendanceEvents.value.forEach(event => {
    if (event.status === 'active' && event.end_time) {
      const eventEnd = getEventEndTimeInPH(event)
      if (!eventEnd) return
      
      const diff = eventEnd - nowPH
      
      if (diff <= 0) {
        // Event has ended
        if (!eventEndedNotifications.value.has(event._id)) {
          eventEndedNotifications.value.add(event._id)
          showNotification(`Event "${event.title}" has ended!`, 'info')
        }
        eventTimeRemaining.value[event._id] = 'Ended'
      } else {
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60))
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000)
        
        if (hoursLeft > 0) {
          eventTimeRemaining.value[event._id] = `${hoursLeft}h ${minutesLeft}m remaining`
        } else if (minutesLeft > 0) {
          eventTimeRemaining.value[event._id] = `${minutesLeft}m ${secondsLeft}s remaining`
        } else {
          eventTimeRemaining.value[event._id] = `${secondsLeft}s remaining`
        }
        
        // Warn admin when 5 minutes or less remaining
        if (isAdmin && diff <= 5 * 60 * 1000 && diff > 4 * 60 * 1000) {
          showNotification(`Event "${event.title}" ends in 5 minutes!`, 'warning')
        }
      }
    }
  })
}

// Get time remaining for a specific event
const getEventTimeRemaining = (eventId) => {
  return eventTimeRemaining.value[eventId] || ''
}

// Start auto-refresh for attendance data (for students)
const startAttendanceAutoRefresh = () => {
  const isAdmin = currentUser.value.role === 'admin' || currentUser.value.isMaster
  
  // Auto-refresh attendance data every 30 seconds for students to catch RFID check-ins
  if (!isAdmin) {
    attendanceRefreshInterval.value = setInterval(() => {
      fetchAttendanceData()
    }, 30000) // 30 seconds
  }
  
  // Update event time remaining every second
  eventTimeInterval.value = setInterval(() => {
    updateEventTimeRemaining()
  }, 1000)
}

onUnmounted(() => {
  // Remove ESC key listener
  document.removeEventListener('keydown', handleEscKey)
  
  if (attendanceRefreshInterval.value) {
    clearInterval(attendanceRefreshInterval.value)
  }
  if (eventTimeInterval.value) {
    clearInterval(eventTimeInterval.value)
  }
})
</script>