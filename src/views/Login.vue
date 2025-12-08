<template>
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
          <li>• Login issues? Use your Student ID and password</li>
          <li>• RFID not working? Contact the CCS office</li>
          <li>• Profile problems? Check your information is complete</li>
        </ul>
      </div>

      <button @click="showContactModal = false" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition">
        Close
      </button>
    </div>
  </div>

  <div v-if="showErrorNotification" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform transition-all border-2 border-red-500">
      <div class="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-red-600 mb-2">Oops!</h3>
      <p class="text-red-700 font-medium">{{ errorMessage }}</p>
      <button @click="showErrorNotification = false" class="mt-6 px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-600 transition duration-300">
        Try Again
      </button>
    </div>
  </div>

  <!-- Login Disabled Warning -->
  <div v-if="loginDisabled" class="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 py-3 px-4 text-center z-30 shadow-md">
    <div class="flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span class="font-medium text-sm">{{ loginDisabledMessage || 'Student login is currently disabled.' }}</span>
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
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white text-2xl shadow-lg mb-3 overflow-hidden flex-shrink-0">
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

  <div class="hidden md:flex min-h-screen bg-white w-full">
    <div class="w-2/5 desktop-bg-panel flex-shrink-0">
      <div class="relative z-10 text-center">
        <div class="mb-4">
          <div class="w-40 h-40 mx-auto flex items-center justify-center">
            <img :src="jrmsuLogo" alt="JRMSU CCS Logo" class="w-full h-full object-contain drop-shadow-2xl" />
          </div>
        </div>
        <h1 class="text-4xl font-bold mb-2">SSAAM</h1>
        <p class="text-sm">Student School Activities Attendance Monitoring</p>
      </div>
      <div class="absolute bottom-4 left-4 right-4 text-center text-xs text-white opacity-75">
        Copyright © 2025 Powered by CCS-Creatives Committee. Chairperson: Sheen Lee
      </div>
    </div>

    <div class="w-3/5 flex items-center justify-center p-8 bg-gray-50">
      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <h2 class="text-3xl font-bold text-purple-900 mb-4">Let's Get Started!</h2>
          <p class="text-gray-600 text-sm mb-2">You are a few clicks away from your profile.</p>
          <p class="text-gray-600 text-sm">Input your JRMSU Student ID to continue.</p>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-8">
          <div class="flex mb-6 border-b border-gray-200">
            <button class="flex-1 py-3 px-4 text-center font-medium border-b-2 border-purple-600 text-purple-600">
              Log In
            </button>
            <button @click="goToRegister" class="flex-1 py-3 px-4 text-center font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
              <img src="/register_user.svg" alt="Register" class="w-5 h-5" /> Register
            </button>
          </div>

          <form @submit.prevent="handleLogin" novalidate class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <div class="relative">
                <img src="/user.svg" alt="Student ID" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input v-model="studentId" type="text" placeholder="25-A-12345" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div class="relative">
                <img src="/key.svg" alt="Password" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Your Password (Last Name)" class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" style="-webkit-appearance: none; -moz-appearance: none; appearance: none;" required />
                <img @click="togglePasswordVisibility" :src="showPassword ? '/visibility_on.svg' : '/visibility_off.svg'" alt="Toggle password" :class="['absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 cursor-pointer hover:opacity-70', { 'animate-wipe': visibilityAnimating }]" style="pointer-events: auto; z-index: 10;" />
              </div>
            </div>

            <button type="submit" :disabled="isLoading" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
              <span v-if="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
              <span v-else class="flex items-center">
                Login <span class="ml-2">→</span>
              </span>
            </button>

            <div class="flex items-center justify-between text-sm">
              <button type="button" @click="showForgotPasswordModal = true" class="text-purple-600 hover:text-purple-700 font-medium">
                Forgot Password?
              </button>
              <button type="button" @click="showContactModal = true" class="text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 font-medium">
                <img src="/help.svg" alt="Help" class="w-4 h-4" />
                Need help?
              </button>
            </div>
          </form>

          <div class="mt-6 text-center text-xs text-gray-500">
            Powered by <button @click="showDevelopersPopup = true" class="text-yellow-500 font-medium hover:text-yellow-600 cursor-pointer">CCS - Creatives Committee</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mobile-bg-panel md:hidden min-h-screen flex flex-col w-full">

    <div class="text-center text-white pt-12 pb-8 px-4 relative z-10">
      <div class="w-32 h-32 mx-auto mb-4">
        <img src="/src/assets/jrmsu-logo.webp" alt="JRMSU CCS Logo" class="w-full h-full object-contain drop-shadow-2xl" />
      </div>
      <h1 class="text-4xl font-bold mb-2">SSAAM</h1>
      <p class="text-lg mb-8">Let's Get Started!</p>
      <p class="text-sm opacity-90">You are a few clicks away from your profile.</p>
      <p class="text-sm opacity-90">Input your JRMSU Student ID to continue.</p>
    </div>

    <div class="flex-1 bg-white rounded-t-3xl shadow-2xl px-6 py-8 overflow-auto">
      <div class="max-w-md mx-auto">

        <div class="flex mb-8 bg-gray-100 rounded-lg p-1">
          <button class="flex-1 py-3 px-4 text-center font-medium rounded-md bg-white text-purple-600 shadow-sm">
            Log In
          </button>
          <button @click="goToRegister" class="flex-1 py-3 px-4 text-center font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
            <img src="/register_user.svg" alt="Register" class="w-5 h-5" /> Register
          </button>
        </div>

        <form @submit.prevent="handleLogin" novalidate class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
            <div class="relative">
              <img src="/user.svg" alt="Student ID" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input v-model="studentId" type="text" placeholder="25-A-12345" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div class="relative">
              <img src="/key.svg" alt="Password" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Your Password (Last Name)" class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
              <img @click="togglePasswordVisibility" :src="showPassword ? '/visibility_on.svg' : '/visibility_off.svg'" alt="Toggle password" :class="['absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 cursor-pointer hover:opacity-70', { 'animate-wipe': visibilityAnimating }]" style="pointer-events: auto; z-index: 10;" />
            </div>
          </div>

          <button type="submit" :disabled="isLoading" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
            <span v-if="isLoading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </span>
            <span v-else class="flex items-center">
              Login <span class="ml-2">→</span>
            </span>
          </button>

          <div class="flex items-center justify-between text-sm">
            <button type="button" @click="showForgotPasswordModal = true" class="text-purple-600 hover:text-purple-700 font-medium">
              Forgot Password?
            </button>
            <button type="button" @click="showContactModal = true" class="text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 font-medium">
              <img src="/help.svg" alt="Help" class="w-4 h-4" />
              Need help?
            </button>
          </div>
        </form>

        <div class="mt-8 text-center text-xs text-gray-500">
          Powered by <button @click="showDevelopersPopup = true" class="text-yellow-500 font-medium hover:text-yellow-600 cursor-pointer">CCS - Creatives Committee</button>
        </div>

        <div class="mt-4 text-center text-xs text-gray-400">
          Copyright © 2025 Powered by CCS-Creatives Committee. Chairperson: Sheen Lee
        </div>
      </div>
    </div>
  </div>

  <!-- Forgot Password Modal -->
  <div v-if="showForgotPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeForgotPasswordModal">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Reset Password</h3>
        <button @click="closeForgotPasswordModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>

      <!-- Step 1: Enter Student ID -->
      <div v-if="resetStep === 1" class="space-y-4">
        <p class="text-gray-600 text-sm">Enter your Student ID and we'll send a verification code to your registered email.</p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
          <input v-model="resetStudentId" type="text" placeholder="25-A-12345" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <button @click="requestResetCode" :disabled="resetLoading || !resetStudentId.trim()" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          <svg v-if="resetLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ resetLoading ? 'Sending...' : 'Send Code' }}
        </button>
        <p v-if="resetMessage" :class="['text-sm text-center', resetSuccess ? 'text-green-600' : 'text-red-600']">{{ resetMessage }}</p>
      </div>

      <!-- Step 2: Enter Verification Code -->
      <div v-if="resetStep === 2" class="space-y-4">
        <p class="text-gray-600 text-sm">Enter the 6-digit verification code sent to your email.</p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
          <input v-model="resetCode" type="text" placeholder="123456" maxlength="6" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-center text-2xl tracking-widest" />
        </div>
        <button @click="verifyResetCode" :disabled="resetLoading || resetCode.length !== 6" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          <svg v-if="resetLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ resetLoading ? 'Verifying...' : 'Verify Code' }}
        </button>
        <button @click="resetStep = 1" class="w-full text-purple-600 hover:text-purple-700 text-sm font-medium">Back to Step 1</button>
        <p v-if="resetMessage" :class="['text-sm text-center', resetSuccess ? 'text-green-600' : 'text-red-600']">{{ resetMessage }}</p>
      </div>

      <!-- Step 3: Enter New Password -->
      <div v-if="resetStep === 3" class="space-y-4">
        <p class="text-gray-600 text-sm">Create a new password for your account.</p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input v-model="newPassword" type="password" placeholder="Enter new password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <input v-model="confirmNewPassword" type="password" placeholder="Confirm new password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <button @click="completePasswordReset" :disabled="resetLoading || !newPassword || newPassword !== confirmNewPassword" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          <svg v-if="resetLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ resetLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
        <p v-if="newPassword && confirmNewPassword && newPassword !== confirmNewPassword" class="text-sm text-red-600 text-center">Passwords do not match</p>
        <p v-if="resetMessage" :class="['text-sm text-center', resetSuccess ? 'text-green-600' : 'text-red-600']">{{ resetMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import jrmsuLogo from '../assets/jrmsu-logo.webp'
import { encodeTimestamp } from '../utils/ssaamCrypto.js'

const router = useRouter()
const studentId = ref('')
const password = ref('')
const isLoading = ref(false)
const showDevelopersPopup = ref(false)
const showErrorNotification = ref(false)
const showContactModal = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const visibilityAnimating = ref(false)
const loginDisabled = ref(false)
const loginDisabledMessage = ref('')

const showForgotPasswordModal = ref(false)
const resetStep = ref(1)
const resetStudentId = ref('')
const resetCode = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const resetLoading = ref(false)
const resetMessage = ref('')
const resetSuccess = ref(false)

const closeForgotPasswordModal = () => {
  showForgotPasswordModal.value = false
  resetStep.value = 1
  resetStudentId.value = ''
  resetCode.value = ''
  resetToken.value = ''
  newPassword.value = ''
  confirmNewPassword.value = ''
  resetMessage.value = ''
  resetSuccess.value = false
}

const requestResetCode = async () => {
  resetLoading.value = true
  resetMessage.value = ''
  try {
    const token = encodeTimestamp()
    const response = await fetch('https://ssaam-api.vercel.app/apis/password-reset/request', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-SSAAM-TS': token
      },
      body: JSON.stringify({ 
        student_id: resetStudentId.value.trim(),
        _ssaam_access_token: token
      })
    })
    const data = await response.json()
    if (response.ok) {
      resetSuccess.value = true
      resetMessage.value = data.message || 'Verification code sent to your email!'
      resetStep.value = 2
    } else {
      resetSuccess.value = false
      resetMessage.value = data.message || 'Failed to send verification code'
    }
  } catch (error) {
    resetSuccess.value = false
    resetMessage.value = 'Network error. Please try again.'
  } finally {
    resetLoading.value = false
  }
}

const verifyResetCode = async () => {
  resetLoading.value = true
  resetMessage.value = ''
  try {
    const token = encodeTimestamp()
    const response = await fetch('https://ssaam-api.vercel.app/apis/password-reset/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-SSAAM-TS': token
      },
      body: JSON.stringify({ 
        student_id: resetStudentId.value.trim(), 
        code: resetCode.value.trim(),
        _ssaam_access_token: token
      })
    })
    const data = await response.json()
    if (response.ok) {
      resetSuccess.value = true
      resetMessage.value = 'Code verified! Enter your new password.'
      resetToken.value = data.reset_token
      resetStep.value = 3
    } else {
      resetSuccess.value = false
      resetMessage.value = data.message || 'Invalid verification code'
    }
  } catch (error) {
    resetSuccess.value = false
    resetMessage.value = 'Network error. Please try again.'
  } finally {
    resetLoading.value = false
  }
}

const completePasswordReset = async () => {
  if (newPassword.value !== confirmNewPassword.value) {
    resetMessage.value = 'Passwords do not match'
    resetSuccess.value = false
    return
  }
  resetLoading.value = true
  resetMessage.value = ''
  try {
    const token = encodeTimestamp()
    const response = await fetch('https://ssaam-api.vercel.app/apis/password-reset/complete', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-SSAAM-TS': token
      },
      body: JSON.stringify({ 
        student_id: resetStudentId.value.trim(), 
        reset_token: resetToken.value,
        new_password: newPassword.value,
        _ssaam_access_token: token
      })
    })
    const data = await response.json()
    if (response.ok) {
      resetSuccess.value = true
      resetMessage.value = 'Password reset successful! You can now login.'
      setTimeout(() => {
        closeForgotPasswordModal()
      }, 2000)
    } else {
      resetSuccess.value = false
      resetMessage.value = data.message || 'Failed to reset password'
    }
  } catch (error) {
    resetSuccess.value = false
    resetMessage.value = 'Network error. Please try again.'
  } finally {
    resetLoading.value = false
  }
}

const togglePasswordVisibility = () => {
  visibilityAnimating.value = true
  showPassword.value = !showPassword.value
  setTimeout(() => {
    visibilityAnimating.value = false
  }, 400)
}

const developers = [
  { name: 'Jullan Maglinte', initials: 'JM', role: 'Fullstack Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/jullan.maglinte', image: '/team/jullan.jpg' },
  { name: 'Keith Laranjo', initials: 'KL', role: 'Backend Dev', year_level: '2nd year', program: 'CS', facebook: 'https://facebook.com/kei.takun.5070', image: '/team/keith.jpg' },
  { name: 'Kenzen Miñao', initials: 'KM', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/kenzen3131', image: '/team/kenzen.jpg' },
  { name: 'Christoph Bagabuyo', initials: 'CB', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/christoph.bagabuyo', image: '/team/christoph.jpg' },
  { name: 'Mischi Jeda Elumba', initials: 'MJ', role: 'UI/UX Designer', year_level: '2nd year', program: 'IS', facebook: 'https://facebook.com/mischijeda.elumba.1', image: '/team/mischi.jpg' }
]

onMounted(async () => {
  const currentUser = localStorage.getItem('currentUser')
  if (currentUser) {
    const user = JSON.parse(currentUser)
    if (user.studentId || user.student_id) {
      router.push('/dashboard')
      return
    }
  }
  
  // Check login settings
  try {
    const response = await fetch('https://ssaam-api.vercel.app/apis/settings', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer SSAAMStudents'
      }
    })
    const data = await response.json()
    if (response.ok && data.userLogin) {
      loginDisabled.value = !data.userLogin.login
      loginDisabledMessage.value = data.userLogin.message || 'Login is currently disabled. Please try again later.'
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
  }
})

const handleLogin = async () => {
  // Check if login is disabled (for students only)
  const enteredId = studentId.value.trim();
  const startsWithLetter = /^[a-zA-Z]/.test(enteredId);
  
  if (loginDisabled.value && !startsWithLetter) {
    errorMessage.value = loginDisabledMessage.value || 'Login is currently disabled. Please try again later.'
    showErrorNotification.value = true
    return
  }
  
  // Custom validation
  if (!studentId.value.trim()) {
    errorMessage.value = "Please enter your Student ID to proceed."
    showErrorNotification.value = true
    return
  }
  if (!password.value.trim()) {
    errorMessage.value = "Please enter your password to continue."
    showErrorNotification.value = true
    return
  }

  isLoading.value = true
  try {
    const enteredId = studentId.value.trim();
    const startsWithLetter = /^[a-zA-Z]/.test(enteredId);
    
    // Different handling for masters vs students
    let enteredPass;
    if (startsWithLetter) {
      // For masters: keep password as-is (trim only)
      enteredPass = password.value.trim();
    } else {
      // For students: trim leading/trailing spaces and collapse internal spaces, preserve multi-word names (e.g., "DELA CRUZ"), then uppercase
      enteredPass = password.value.trim().split(' ').map(word => word.trim()).filter(word => word).join(' ').toUpperCase();
    }

    let user;
    
    if (startsWithLetter) {
      // Use masters login API with POST
      const response = await fetch("https://ssaam-api.vercel.app/apis/masters/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer SSAAMRegJRMSU`
        },
        body: JSON.stringify({
          username: enteredId,
          password: enteredPass
        })
      });
      const data = await response.json();
      console.log("API MASTERS LOGIN RESPONSE:", data);
      
      // Extract master object from response
      if (data.master && data.message === "Login successful") {
        user = data.master;
        user.token = data.token;
      } else if (data.message) {
        errorMessage.value = data.message;
        showErrorNotification.value = true;
        isLoading.value = false;
        return;
      }
    } else {
      // Use POST login endpoint for students
      const response = await fetch("https://ssaam-api.vercel.app/apis/students/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer SSAAMStudents`
        },
        body: JSON.stringify({
          student_id: enteredId,
          last_name: enteredPass,
          _ssaam_access_token: encodeTimestamp()
        })
      });
      const data = await response.json();
      console.log("API STUDENT LOGIN RESPONSE:", data);
      
      if (data.student && data.message === "Login successful") {
        user = data.student;
      } else if (data.message) {
        errorMessage.value = data.message;
        showErrorNotification.value = true;
        isLoading.value = false;
        return;
      }
    }

    if (user) {
      console.log("LOGIN SUCCESS:", user);
      const normalizedUser = {
        ...user,
        studentId: user.student_id || user.username || enteredId,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        middleName: user.middle_name || '',
        email: user.email || '',
        rfidCode: user.rfid_code || '',
        rfid_code: user.rfid_code || '',
        rfid_status: user.rfid_status || 'unverified',
        rfid_verified_at: user.rfid_verified_at || null,
        rfid_verified_by: user.rfid_verified_by || null,
        yearLevel: user.year_level || '',
        semester: user.semester || '',
        schoolYear: user.school_year || '',
        program: user.program || '',
        role: startsWithLetter ? 'master' : (user.role || 'student'),
        image: user.photo || user.image || '',
        isMaster: startsWithLetter,
        token: user.token || ''
      };
      localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
      localStorage.setItem("authToken", normalizedUser.token);
      console.log("Navigating to dashboard...");
      router.push("/dashboard");
      return;
    }

    errorMessage.value = "Invalid Student ID or password. Please check your information and try again."
    showErrorNotification.value = true
  } catch (error) {
    console.error("Login error:", error);
    errorMessage.value = "Server error. Please try again later."
    showErrorNotification.value = true
  } finally {
    isLoading.value = false
  }
};

const goToRegister = () => {
  router.push('/register')
}
</script> 