<template>
  <transition name="fade">
    <div v-if="showContactModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40" @click.self="showContactModal = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <div class="w-5 h-5" style="-webkit-mask: url(/help.svg) center/contain no-repeat; mask: url(/help.svg) center/contain no-repeat; background-color: white;"></div>
              </div>
              <h3 class="text-xl font-bold text-white">Need Help?</h3>
            </div>
            <button @click="showContactModal = false" class="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <div class="p-6 space-y-4 overflow-y-auto help-modal-scroll">
            <div class="grid grid-cols-3 gap-3">
              <div class="flex flex-col items-center text-center p-3 bg-green-50 rounded-2xl">
                <div class="w-10 h-10 mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                  <div class="w-5 h-5" style="-webkit-mask: url(/mail.svg) center/contain no-repeat; mask: url(/mail.svg) center/contain no-repeat; background-color: #2563eb;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-xs mb-1">Email Support</p>
                <p class="text-xs text-gray-500 break-all">ssaamjrmsu@gmail.com</p>
                <p class="text-xs text-gray-400 mt-0.5">For inquiries</p>
              </div>

              <div class="flex flex-col items-center text-center p-3 bg-green-50 rounded-2xl">
                <div class="w-10 h-10 mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                  <div class="w-5 h-5" style="-webkit-mask: url(/home.svg) center/contain no-repeat; mask: url(/home.svg) center/contain no-repeat; background-color: #2563eb;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-xs mb-1">CCS Office</p>
                <p class="text-xs text-gray-500">College of Computing Studies</p>
                <p class="text-xs text-gray-400 mt-0.5">Office hours</p>
              </div>

              <div class="flex flex-col items-center text-center p-3 bg-green-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition" @click="showDevelopersPopup = true; showContactModal = false">
                <div class="w-10 h-10 mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                  <div class="w-5 h-5" style="-webkit-mask: url(/register_user.svg) center/contain no-repeat; mask: url(/register_user.svg) center/contain no-repeat; background-color: #2563eb;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-xs mb-1">Meet the Team</p>
                <p class="text-xs text-gray-500">CCS Creatives</p>
                <p class="text-xs text-blue-600 mt-0.5 font-medium">View →</p>
              </div>
            </div>

            <div class="bg-green-50 rounded-2xl p-4">
              <p class="text-sm font-semibold text-blue-900 mb-2">Quick Help</p>
              <ul class="text-xs text-gray-600 space-y-1.5">
                <li class="flex items-start gap-2"><span class="text-blue-400 mt-0.5 flex-shrink-0">•</span>Your default password is your Last Name (UPPERCASE)</li>
                <li class="flex items-start gap-2"><span class="text-blue-400 mt-0.5 flex-shrink-0">•</span>Use "Forgot Password" if needed</li>
                <li class="flex items-start gap-2"><span class="text-blue-400 mt-0.5 flex-shrink-0">•</span>Register your RFID at the CCS office</li>
                <li class="flex items-start gap-2"><span class="text-blue-400 mt-0.5 flex-shrink-0">•</span>For profile issues, contact the Developers or visit the CCS office</li>
              </ul>
            </div>

            <button @click="showContactModal = false" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition">
              Close
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <transition name="fade">
    <div v-if="showVerificationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]" @click.self="showVerificationModal = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-[calc(100%-2rem)] text-center">
          <div class="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-2 text-blue-900">2nd Verification</h3>
          <p class="text-gray-600 mb-6 text-sm">Please enter the daily verification code to access the Admin Dashboard.</p>
          
          <div v-if="verificationError" class="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm font-medium animate-shake">
            {{ verificationErrorMessage }}
          </div>

          <div class="flex justify-center gap-2 mb-8 mx-4 w-full max-w-[320px] px-4 sm:px-6">
            <input 
              v-for="(digit, index) in 6" 
              :key="index"
              :ref="el => { if (el) verificationInputs[index] = el }"
              v-model="verificationDigits[index]"
              type="password"
              maxlength="1"
              class="w-9 h-10 sm:w-10 sm:h-12 md:w-12 md:h-14 border-2 border-blue-300 rounded-lg text-center text-lg sm:text-xl font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              @input="handleDigitInput(index, $event)"
              @keydown.delete="handleDigitDelete(index, $event)"
              inputmode="numeric"
            />
          </div>

          <div class="flex gap-3">
            <button @click="showVerificationModal = false; isLoading = false" class="flex-1 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition duration-300">
              Cancel
            </button>
            <button @click="verifyAdminCode" class="flex-1 px-6 py-2 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-lg font-medium hover:from-ssaam-dark hover:to-ssaam-light transition duration-300">
              Verify
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <!-- ══════════ FACE ID — 3rd Verification Step ══════════ -->
  <transition name="fade">
    <div v-if="showFaceModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[130]">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-sm overflow-hidden">

          <!-- Header -->
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-5 flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <!-- Face scan icon -->
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white leading-tight">Face ID</h3>
              <p class="text-blue-100 text-xs">Step 3 of 3 — Biometric Verification</p>
            </div>
            <!-- Step badge -->
            <div class="ml-auto flex gap-1.5">
              <span class="w-2 h-2 rounded-full bg-white/40"></span>
              <span class="w-2 h-2 rounded-full bg-white/40"></span>
              <span class="w-2 h-2 rounded-full bg-white"></span>
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 space-y-4">

            <!-- Loading / no-faces / error states (no camera) -->
            <div v-if="faceStep === 'loading' || faceStep === 'no-faces' || faceStep === 'error'" class="flex flex-col items-center gap-3 py-6">
              <div v-if="faceStep === 'loading'" class="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                <svg class="w-8 h-8 text-ssaam-dark animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
              <div v-else-if="faceStep === 'no-faces'" class="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div v-else-if="faceStep === 'error'" class="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <p class="text-sm font-semibold text-gray-700 text-center">{{ faceStatusText }}</p>
              <p v-if="faceLoadError" class="text-xs text-red-600 text-center">{{ faceLoadError }}</p>
            </div>

            <!-- Camera viewport (scanning / matched) -->
            <div v-if="faceStep === 'scanning' || faceStep === 'matched'" class="space-y-3">
              <div class="relative rounded-xl overflow-hidden bg-gray-900 aspect-[4/3] border-2 border-ssaam-dark/30 shadow-inner">
                <video id="face-login-video" autoplay muted playsinline
                  class="absolute inset-0 w-full h-full object-cover face-mirror"
                  :class="faceStep === 'scanning' || faceStep === 'matched' ? 'opacity-100' : 'opacity-0'"
                ></video>
                <canvas id="face-login-canvas" class="absolute inset-0 w-full h-full pointer-events-none face-mirror"></canvas>

                <!-- Scan-line animation while scanning -->
                <div v-if="faceStep === 'scanning'" class="ssaam-face-scanline absolute left-0 right-0 h-[2px] bg-ssaam-light shadow-[0_0_12px_2px_rgba(79,98,255,0.8)] pointer-events-none"></div>

                <!-- Corner brackets -->
                <div class="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-ssaam-light rounded-tl"></div>
                <div class="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-ssaam-light rounded-tr"></div>
                <div class="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-ssaam-light rounded-bl"></div>
                <div class="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-ssaam-light rounded-br"></div>

                <!-- Status HUD -->
                <div class="absolute top-2 left-1/2 -translate-x-1/2">
                  <span class="text-[10px] font-bold text-white bg-black/50 backdrop-blur px-2.5 py-1 rounded-full whitespace-nowrap">
                    {{ faceStatusText }}
                  </span>
                </div>

                <!-- Match confidence badge -->
                <div v-if="faceStep === 'matched' && faceConfidence !== null" class="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur shadow">
                    ✓ {{ faceConfidence }}% match
                  </span>
                </div>
              </div>

              <!-- Matched success banner -->
              <div v-if="faceStep === 'matched'" class="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                  <p class="text-sm font-bold text-emerald-800">Identity Confirmed</p>
                  <p class="text-xs text-emerald-600">Matched: {{ faceMatchLabel }} — Logging in…</p>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer actions -->
          <div class="px-5 pb-5 flex gap-3" v-if="faceStep !== 'matched' && faceStep !== 'no-faces'">
            <button
              @click="cancelFaceVerification"
              class="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              v-if="faceStep === 'error'"
              @click="startFaceVerification"
              class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition shadow"
            >
              Retry
            </button>
          </div>

        </div>
      </transition>
    </div>
  </transition>
  <!-- ══════════ END FACE ID ══════════ -->

  <transition name="fade">
    <div v-if="showErrorNotification" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-4 flex items-center gap-3">
            <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white">Oops!</h3>
          </div>
          <div class="p-6 text-center">
            <p class="text-gray-700 font-medium px-2">{{ errorMessage }}</p>
            <button @click="showErrorNotification = false" class="mt-6 px-8 py-2.5 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-full font-semibold hover:opacity-90 transition duration-300 shadow-md">
              Try Again
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <!-- Login Disabled Warning -->
  <div v-if="loginDisabled" class="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 py-3 px-4 text-center z-30 shadow-md">
    <div class="flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span class="font-medium text-sm">{{ loginDisabledMessage || 'Student login is currently disabled.' }}</span>
    </div>
  </div>

  <transition name="fade">
    <div v-if="showDevelopersPopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showDevelopersPopup = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light rounded-t-3xl px-6 py-5 text-center relative flex-shrink-0">
            <h3 class="text-xl font-bold text-white">Meet Our Developers</h3>
            <p class="text-blue-100 text-xs mt-0.5">CCS - Creatives Committee</p>
            <button @click="showDevelopersPopup = false" class="absolute right-4 top-4 text-white/70 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <div class="p-6 space-y-3 overflow-y-auto dev-modal-scroll">
            <div class="flex justify-center gap-3">
              <a v-for="(dev, index) in developers.slice(0,2)" :key="dev.name" :href="dev.facebook" target="_blank" rel="noopener noreferrer"
                 class="flex flex-col items-center p-3 bg-green-50 rounded-2xl w-32 hover:bg-blue-50 hover:scale-105 transition-all duration-300 cursor-pointer"
                 :style="{ transitionDelay: `${index * 50}ms` }">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center text-white shadow-md mb-2 overflow-hidden ring-2 ring-blue-200">
                  <img v-if="dev.image" :src="dev.image" :alt="dev.name" class="w-full h-full object-cover" />
                  <span v-else>{{ dev.initials }}</span>
                </div>
                <p class="text-xs font-semibold text-blue-700 text-center line-clamp-2 min-h-[1.75rem]">{{ dev.name }}</p>
                <p class="text-xs text-gray-500 text-center">{{ dev.year_level }} - {{ dev.program }}</p>
                <p class="text-xs text-gray-400 text-center">{{ dev.role }}</p>
              </a>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <a v-for="(dev, idx) in developers.slice(2)" :key="dev.name" :href="dev.facebook" target="_blank" rel="noopener noreferrer"
                 class="flex flex-col items-center p-3 bg-green-50 rounded-2xl hover:bg-blue-50 hover:scale-105 transition-all duration-300 cursor-pointer"
                 :style="{ transitionDelay: `${(idx + 2) * 50}ms` }">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center text-white shadow-md mb-2 overflow-hidden ring-2 ring-blue-200">
                  <img v-if="dev.image" :src="dev.image" :alt="dev.name" class="w-full h-full object-cover" />
                  <span v-else>{{ dev.initials }}</span>
                </div>
                <p class="text-xs font-semibold text-blue-700 text-center line-clamp-2 min-h-[1.75rem]">{{ dev.name }}</p>
                <p class="text-xs text-gray-500 text-center">{{ dev.year_level }} - {{ dev.program }}</p>
                <p class="text-xs text-gray-400 text-center">{{ dev.role }}</p>
              </a>
            </div>

            <div class="text-center bg-green-50 rounded-2xl py-3">
              <p class="text-sm font-semibold text-blue-900">CCS - Creatives Committee</p>
              <p class="text-xs text-gray-500">Chairperson: Sheen Lee</p>
            </div>

            <button @click="showDevelopersPopup = false" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition">
              Close
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <ProgrammerLoadingEffect :visible="isLoading" message="AUTHENTICATING" theme="" @complete="handleLoadingComplete" />
  <div class="hidden md:flex min-h-screen bg-white w-full">
    <div class="w-2/5 desktop-bg-panel flex-shrink-0">
      <div class="relative z-10 text-center">
        <div class="mb-4">
          <div class="w-40 h-40 mx-auto flex items-center justify-center logo-sweep" style="mask: url(/jrmsu.svg) no-repeat center / contain; -webkit-mask: url(/jrmsu.svg) no-repeat center / contain;">
            <img :src="jrmsuLogo" alt="JRMSU CCS Logo" class="w-full h-full object-contain drop-shadow-2xl relative z-10" />
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-sweep z-20 pointer-events-none"></div>
          </div>
        </div>
        <h1 class="text-6xl font-extrabold italic mb-2">SSAAM</h1>
        <p class="text-sm">Student School Activities Attendance Monitoring</p>
      </div>
      <div class="absolute bottom-4 left-4 right-4 text-center text-xs text-white opacity-75">
        Copyright © 2025 Powered by CCS-Creatives Committee. Chairperson: Sheen Lee
      </div>
    </div>

    <div class="w-3/5 flex items-center justify-center p-8 bg-gray-50">
      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <h2 class="text-3xl font-bold text-blue-700 mb-2">Welcome</h2>
          <p class="text-gray-500 text-sm">Login in to your account to continue</p>
        </div>

        <div class="bg-white rounded-3xl shadow-xl p-8">
          <form @submit.prevent="handleLogin" novalidate class="space-y-4">
            <div class="relative">
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/user.svg) center/contain no-repeat; mask: url(/user.svg) center/contain no-repeat; background-color: currentColor;"></div>
              <input ref="studentIdInput" v-model="studentId" type="text" placeholder="Student ID (e.g. 25-A-12345)" class="w-full pl-11 pr-4 py-3 bg-green-50 border-0 rounded-full focus:ring-2 focus:ring-blue-300 outline-none text-sm text-gray-700 placeholder-gray-400" @keydown.enter.prevent="focusPassword" required />
            </div>

            <div class="relative">
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/key.svg) center/contain no-repeat; mask: url(/key.svg) center/contain no-repeat; background-color: currentColor;"></div>
              <input ref="passwordInput" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password" class="w-full pl-11 pr-12 py-3 bg-green-50 border-0 rounded-full focus:ring-2 focus:ring-blue-300 outline-none text-sm text-gray-700 placeholder-gray-400" style="-webkit-appearance: none; -moz-appearance: none; appearance: none;" required />
              <img @click="togglePasswordVisibility" :src="showPassword ? '/visibility_on.svg' : '/visibility_off.svg'" alt="Toggle password" :class="['absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 cursor-pointer hover:opacity-80 opacity-65', { 'animate-wipe': visibilityAnimating }]" style="pointer-events: auto; z-index: 10;" />
            </div>

            <div class="text-center">
              <button type="button" @click="showForgotPasswordModal = true" class="text-sm text-blue-500 hover:text-blue-700 font-medium">
                Forgot your password?
              </button>
            </div>

            <button type="submit" :disabled="isLoading" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed tracking-wide uppercase text-sm shadow-md">
              {{ isLoading ? 'Logging in...' : 'Log In' }}
            </button>

            <div class="text-center text-sm text-gray-500 pt-1">
              Don't have an account?
              <button type="button" @click="goToRegister" class="text-blue-500 hover:text-blue-700 font-semibold ml-1">Sign Up</button>
            </div>

            <div class="flex items-center justify-center text-sm pt-1">
              <button type="button" @click="showContactModal = true" class="text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 text-xs">
                <img src="/help.svg" alt="Help" class="w-4 h-4 opacity-50" />
                Need help?
              </button>
            </div>
          </form>

          <div class="mt-5 text-center text-xs text-gray-400">
            Powered by <button @click="showDevelopersPopup = true" class="text-blue-400 font-medium hover:text-blue-600 cursor-pointer">CCS - Creatives Committee</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mobile-bg-panel md:hidden min-h-screen flex flex-col w-full">
    <div class="text-center text-white pt-12 pb-8 px-4 relative z-10">
      <div class="w-32 h-32 mx-auto mb-4 relative" style="mask: url(/jrmsu.svg) no-repeat center / contain; -webkit-mask: url(/jrmsu.svg) no-repeat center / contain;">
        <img src="/src/assets/jrmsu-logo.webp" alt="JRMSU CCS Logo" class="w-full h-full object-contain drop-shadow-2xl relative z-10" />
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-sweep z-20 pointer-events-none"></div>
      </div>
      <h1 class="text-6xl font-extrabold italic mb-2">SSAAM</h1>
      <p class="text-lg mb-8">Let's Get Started!</p>
      <p class="text-sm opacity-90">You are a few clicks away from your profile.</p>
      <p class="text-sm opacity-90">Input your JRMSU Student ID to continue.</p>
    </div>

    <div class="flex-1 bg-white rounded-t-3xl shadow-2xl px-6 py-8 overflow-auto relative z-10">
      <div class="max-w-md mx-auto">

        <div class="mb-6 text-center">
          <h2 class="text-2xl font-bold text-blue-700 mb-1">Welcome</h2>
          <p class="text-gray-500 text-sm">Login in to your account to continue</p>
        </div>

        <form @submit.prevent="handleLogin" novalidate class="space-y-4">
          <div class="relative">
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/user.svg) center/contain no-repeat; mask: url(/user.svg) center/contain no-repeat; background-color: currentColor;"></div>
            <input ref="mobileStudentIdInput" v-model="studentId" type="text" placeholder="Student ID (e.g. 25-A-12345)" class="w-full pl-11 pr-4 py-3 bg-green-50 border-0 rounded-full focus:ring-2 focus:ring-blue-300 outline-none text-sm text-gray-700 placeholder-gray-400" @keydown.enter.prevent="focusMobilePassword" required />
          </div>

          <div class="relative">
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/key.svg) center/contain no-repeat; mask: url(/key.svg) center/contain no-repeat; background-color: currentColor;"></div>
            <input ref="mobilePasswordInput" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password" class="w-full pl-11 pr-12 py-3 bg-green-50 border-0 rounded-full focus:ring-2 focus:ring-blue-300 outline-none text-sm text-gray-700 placeholder-gray-400" required />
            <img @click="togglePasswordVisibility" :src="showPassword ? '/visibility_on.svg' : '/visibility_off.svg'" alt="Toggle password" :class="['absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 cursor-pointer hover:opacity-80 opacity-65', { 'animate-wipe': visibilityAnimating }]" style="pointer-events: auto; z-index: 10;" />
          </div>

          <div class="text-center">
            <button type="button" @click="showForgotPasswordModal = true" class="text-sm text-blue-500 hover:text-blue-700 font-medium">
              Forgot your password?
            </button>
          </div>

          <button type="submit" :disabled="isLoading" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed tracking-wide uppercase text-sm shadow-md">
            {{ isLoading ? 'Logging in...' : 'Log In' }}
          </button>

          <div class="text-center text-sm text-gray-500 pt-1">
            Don't have an account?
            <button type="button" @click="goToRegister" class="text-blue-500 hover:text-blue-700 font-semibold ml-1">Sign Up</button>
          </div>

          <div class="flex items-center justify-center text-sm">
            <button type="button" @click="showContactModal = true" class="text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 text-xs">
              <img src="/help.svg" alt="Help" class="w-4 h-4 opacity-50" />
              Need help?
            </button>
          </div>
        </form>

        <div class="mt-6 text-center text-xs text-gray-400">
          Powered by <button @click="showDevelopersPopup = true" class="text-blue-400 font-medium hover:text-blue-600 cursor-pointer">CCS - Creatives Committee</button>
        </div>

        <div class="mt-4 text-center text-xs text-gray-400">
          Copyright © 2025 Powered by CCS-Creatives Committee. Chairperson: Sheen Lee
        </div>
      </div>
    </div>
  </div>

  <!-- Forgot Password Modal -->
  <transition name="fade">
    <div v-if="showForgotPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeForgotPasswordModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Gradient Header -->
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-white">Reset Password</h3>
                <p class="text-blue-100 text-xs mt-0.5">
                  {{ resetStep === 1 ? 'Step 1: Verify your identity' : resetStep === 2 ? 'Step 2: Enter your code' : 'Step 3: New password' }}
                </p>
              </div>
            </div>
            <button @click="closeForgotPasswordModal" class="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <!-- Scrollable Content -->
          <div class="p-6 space-y-4 overflow-y-auto">

            <!-- Step 1: Enter Student ID and Email -->
            <div v-if="resetStep === 1" class="space-y-4">
              <div class="bg-green-50 rounded-2xl p-4">
                <p class="text-sm text-gray-600">Enter your Student ID and registered email to receive a verification code.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                <input v-model="resetStudentId" type="text" placeholder="25-A-12345" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input v-model="resetEmail" type="email" placeholder="your.email@example.com" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <button @click="requestResetCode" :disabled="resetLoading || !resetStudentId.trim() || !resetEmail.trim()" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                <svg v-if="resetLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ resetLoading ? 'Sending...' : 'Send Code' }}
              </button>
              <p v-if="resetMessage" :class="['text-sm text-center font-medium', resetSuccess ? 'text-green-600' : 'text-red-600']">{{ resetMessage }}</p>
            </div>

            <!-- Step 2: Enter Verification Code -->
            <div v-if="resetStep === 2" class="space-y-4">
              <div class="bg-green-50 rounded-2xl p-4">
                <p class="text-sm text-gray-600">Enter the 6-digit verification code sent to your email.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input v-model="resetCode" type="text" placeholder="123456" maxlength="6" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest transition" />
              </div>
              <button @click="verifyResetCode" :disabled="resetLoading || resetCode.length !== 6" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                <svg v-if="resetLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ resetLoading ? 'Verifying...' : 'Verify Code' }}
              </button>
              <button @click="resetStep = 1" class="w-full text-sm font-medium text-blue-600 hover:text-blue-800 transition">← Back to Step 1</button>
              <p v-if="resetMessage" :class="['text-sm text-center font-medium', resetSuccess ? 'text-green-600' : 'text-red-600']">{{ resetMessage }}</p>
            </div>

            <!-- Step 3: Enter New Password -->
            <div v-if="resetStep === 3" class="space-y-4">
              <div class="bg-green-50 rounded-2xl p-4">
                <p class="text-sm text-gray-600">Create a new password for your account.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input v-model="newPassword" type="password" placeholder="Enter new password" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input v-model="confirmNewPassword" type="password" placeholder="Confirm new password" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <button @click="completePasswordReset" :disabled="resetLoading || !newPassword || newPassword !== confirmNewPassword" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                <svg v-if="resetLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ resetLoading ? 'Resetting...' : 'Reset Password' }}
              </button>
              <p v-if="newPassword && confirmNewPassword && newPassword !== confirmNewPassword" class="text-sm text-red-600 text-center font-medium">Passwords do not match</p>
              <p v-if="resetMessage" :class="['text-sm text-center font-medium', resetSuccess ? 'text-green-600' : 'text-red-600']">{{ resetMessage }}</p>
            </div>

          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ProgrammerLoadingEffect from '../components/ProgrammerLoadingEffect.vue'
import jrmsuLogo from '../assets/jrmsu-logo.webp'
import { encodeTimestamp } from '../utils/ssaamCrypto.js'
import API_getBaseURL, { buildAPIUrl } from '../config/api.js'
import departments from '../config/departments.js'

const isCOE = computed(() => {
  try {
    const userJson = localStorage.getItem('currentUser') || localStorage.getItem('user')
    const user = userJson ? JSON.parse(userJson) : {}
    const userProgram = user.program
    if (userProgram) {
      for (const dept of departments) {
        if (dept.programs.some(p => p.shortName === userProgram)) return dept.label === 'COE'
      }
    }
  } catch (e) {}
  return false
})

const isSOM = computed(() => {
  try {
    const userJson = localStorage.getItem('currentUser') || localStorage.getItem('user')
    const user = userJson ? JSON.parse(userJson) : {}
    const userProgram = user.program
    if (userProgram) {
      for (const dept of departments) {
        if (dept.programs.some(p => p.shortName === userProgram)) return dept.label === 'SOM'
      }
    }
  } catch (e) {}
  return false
})

const router = useRouter()
const studentId = ref('')
const password = ref('')
const isLoading = ref(false)
const isNavigationPending = ref(false)

const handleLoadingComplete = () => {
  if (isNavigationPending.value) {
    router.push("/dashboard")
  }
}

const showDevelopersPopup = ref(false)
const showErrorNotification = ref(false)
const showContactModal = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const visibilityAnimating = ref(false)
const loginDisabled = ref(false)
const loginDisabledMessage = ref('')
const showVerificationModal = ref(false)
const verificationDigits = ref(['', '', '', '', '', ''])
const verificationInputs = ref([])
const verificationError = ref(false)
const verificationErrorMessage = ref('')
let pendingUser = null

// ── Face ID step (3rd verification) ──────────────────────────────
const showFaceModal = ref(false)
const faceStep = ref('loading') // 'loading' | 'scanning' | 'matched' | 'failed' | 'no-faces' | 'error'
const faceStatusText = ref('Initializing…')
const faceMatchLabel = ref('')
const faceConfidence = ref(null)
const faceSavedFaces = ref([])
const faceStream = ref(null)
const faceDetectLoopId = ref(null)
const faceApiInst = ref(null)
const faceModelsReady = ref(false)
const faceLoadError = ref('')
let faceapiLoginPromise = null

const FACE_THRESHOLD = 0.38        // strict — only accept high-confidence matches
const FACE_MATCH_STREAK_NEEDED = 5  // must match this many consecutive frames to pass
const faceMatchStreak = ref(0)      // current consecutive-match counter
const FACE_MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'

function loadFaceApiLogin() {
  if (!faceapiLoginPromise) {
    faceapiLoginPromise = import('face-api.js').then(m => m.default || m)
  }
  return faceapiLoginPromise
}

async function startFaceVerification() {
  showFaceModal.value = true
  faceStep.value = 'loading'
  faceStatusText.value = 'Loading face models…'
  faceLoadError.value = ''
  faceMatchLabel.value = ''
  faceConfidence.value = null
  faceMatchStreak.value = 0

  try {
    // 1. Load saved faces using the pending user token
    const token = pendingUser?.token
    const college = pendingUser?.selectedDepartment?.value || pendingUser?._detectedCollege || 'CCS'
    const res = await fetch(buildAPIUrl('/apis/masters/face'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-SSAAM-College': college
      }
    })
    if (!res.ok) {
      faceStep.value = 'error'
      faceStatusText.value = 'Could not load Face ID data.'
      return
    }
    const data = await res.json()
    faceSavedFaces.value = (data.faces || []).filter(f => Array.isArray(f.descriptor) && f.descriptor.length === 128)

    if (faceSavedFaces.value.length === 0) {
      // No faces enrolled — skip Face ID and log in directly
      faceStep.value = 'no-faces'
      faceStatusText.value = 'No Face IDs enrolled. Skipping…'
      setTimeout(() => completeFaceLogin(), 1500)
      return
    }

    // 2. Load face-api.js models
    const faceapi = await loadFaceApiLogin()
    faceApiInst.value = faceapi
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL),
    ])
    faceModelsReady.value = true

    // 3. Start camera — switch to 'scanning' FIRST so the <video> element renders,
    //    then attach the stream once the DOM element actually exists.
    faceStatusText.value = 'Starting camera…'
    faceStream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    })

    // Switch state so Vue renders the <video> element
    faceStep.value = 'scanning'
    faceStatusText.value = 'Look at the camera…'
    await nextTick()

    // Now the element is in the DOM — attach the stream
    const video = document.getElementById('face-login-video')
    if (video) {
      video.srcObject = faceStream.value
      await new Promise(resolve => {
        video.onloadedmetadata = () => video.play().then(resolve).catch(resolve)
      })
    }

    runFaceLoginLoop()

  } catch (err) {
    console.error('Face verification init error:', err)
    faceStep.value = 'error'
    faceLoadError.value = err.name === 'NotAllowedError'
      ? 'Camera access denied. Allow camera and try again.'
      : 'Face ID verification failed to start.'
  }
}

function euclideanFace(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d }
  return Math.sqrt(s)
}

function stopFaceCamera() {
  if (faceDetectLoopId.value) { cancelAnimationFrame(faceDetectLoopId.value); faceDetectLoopId.value = null }
  if (faceStream.value) { faceStream.value.getTracks().forEach(t => t.stop()); faceStream.value = null }
  const video = document.getElementById('face-login-video')
  if (video) video.srcObject = null
}

async function runFaceLoginLoop() {
  if (faceStep.value !== 'scanning' || !faceApiInst.value) return
  const video = document.getElementById('face-login-video')
  const canvas = document.getElementById('face-login-canvas')
  if (!video || !canvas || video.readyState < 2) {
    faceDetectLoopId.value = requestAnimationFrame(runFaceLoginLoop)
    return
  }

  try {
    const detection = await faceApiInst.value
      .detectSingleFace(video, new faceApiInst.value.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor()

    const w = video.clientWidth, h = video.clientHeight
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    if (detection) {
      const box = detection.detection.box
      const sx = w / video.videoWidth, sy = h / video.videoHeight
      let best = null
      for (const f of faceSavedFaces.value) {
        const dist = euclideanFace(detection.descriptor, f.descriptor)
        if (best === null || dist < best.dist) best = { dist, label: f.label }
      }
      const frameMatched = best && best.dist < FACE_THRESHOLD

      // Increment or reset the consecutive-match streak
      if (frameMatched) {
        faceMatchStreak.value++
      } else {
        faceMatchStreak.value = 0
      }

      // Draw bounding box — green while streak building, indigo otherwise
      ctx.strokeStyle = frameMatched ? '#22c55e' : '#6366f1'
      ctx.lineWidth = 3
      ctx.strokeRect(box.x * sx, box.y * sy, box.width * sx, box.height * sy)

      // Streak progress bar along the bottom edge of the box
      if (faceMatchStreak.value > 0) {
        const barW = box.width * sx
        const barFill = barW * Math.min(faceMatchStreak.value / FACE_MATCH_STREAK_NEEDED, 1)
        ctx.fillStyle = 'rgba(34,197,94,0.25)'
        ctx.fillRect(box.x * sx, (box.y + box.height) * sy - 5, barW, 5)
        ctx.fillStyle = 'rgba(34,197,94,0.9)'
        ctx.fillRect(box.x * sx, (box.y + box.height) * sy - 5, barFill, 5)
      }

      // Label tag above the box
      const streakPct = Math.round((faceMatchStreak.value / FACE_MATCH_STREAK_NEEDED) * 100)
      const tag = frameMatched ? `${streakPct}% — Hold still…` : 'Scanning…'
      ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
      const pad = 6, tw = ctx.measureText(tag).width + pad * 2
      ctx.fillStyle = frameMatched ? 'rgba(34,197,94,0.92)' : 'rgba(99,102,241,0.85)'
      ctx.fillRect(box.x * sx, box.y * sy - 22, tw, 20)
      ctx.fillStyle = '#fff'
      ctx.fillText(tag, box.x * sx + pad, box.y * sy - 8)

      // Only confirm after FACE_MATCH_STREAK_NEEDED consecutive matching frames
      if (faceMatchStreak.value >= FACE_MATCH_STREAK_NEEDED) {
        faceMatchLabel.value = best.label
        faceConfidence.value = Math.round((1 - best.dist) * 100)
        faceStep.value = 'matched'
        faceStatusText.value = `Identity confirmed: ${best.label}`
        stopFaceCamera()
        setTimeout(() => completeFaceLogin(), 1800)
        return
      }

      faceStatusText.value = frameMatched
        ? `Verifying… ${faceMatchStreak.value}/${FACE_MATCH_STREAK_NEEDED}`
        : 'Face detected — align & hold still'
    } else {
      faceMatchStreak.value = 0  // lost face — reset streak
      faceStatusText.value = 'Look at the camera…'
    }
  } catch (_) { /* transient */ }

  faceDetectLoopId.value = requestAnimationFrame(runFaceLoginLoop)
}

function completeFaceLogin() {
  stopFaceCamera()
  showFaceModal.value = false
  localStorage.setItem('currentUser', JSON.stringify(pendingUser))
  localStorage.setItem('authToken', pendingUser.token)
  isLoading.value = true
  isNavigationPending.value = true
}

function cancelFaceVerification() {
  stopFaceCamera()
  showFaceModal.value = false
  faceStep.value = 'loading'
  pendingUser = null
}

const handleDigitInput = (index, event) => {
  const val = event.target.value;
  if (val.length > 0) {
    // Only take the last character entered
    verificationDigits.value[index] = val.slice(-1);
    // Move to next input
    if (index < 5) {
      verificationInputs.value[index + 1].focus();
    } else {
      // Auto-verify on last digit
      verifyAdminCode();
    }
  }
};

const handleDigitDelete = (index, event) => {
  if (!verificationDigits.value[index] && index > 0) {
    verificationInputs.value[index - 1].focus();
  }
};

const showForgotPasswordModal = ref(false)
const resetStep = ref(1)
const resetStudentId = ref('')
const resetEmail = ref('')
const resetCode = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const resetLoading = ref(false)
const resetMessage = ref('')
const resetSuccess = ref(false)

const apiFallbackUsed = ref(false)

const closeForgotPasswordModal = () => {
  showForgotPasswordModal.value = false
  resetStep.value = 1
  resetStudentId.value = ''
  resetEmail.value = ''
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
    const response = await fetch(buildAPIUrl(`/apis/password-reset/request`), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SSAAMStudents',
        'X-SSAAM-TS': token
      },
      body: JSON.stringify({ 
        student_id: resetStudentId.value.trim(),
        email: resetEmail.value.trim(),
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
    const response = await fetch(buildAPIUrl(`/apis/password-reset/verify`), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SSAAMStudents',
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
    const response = await fetch(buildAPIUrl(`/apis/password-reset/complete`), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SSAAMStudents',
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

const studentIdInput = ref(null)
const passwordInput = ref(null)
const mobileStudentIdInput = ref(null)
const mobilePasswordInput = ref(null)

const focusPassword = () => {
  if (passwordInput.value) {
    passwordInput.value.focus()
  }
}

const focusMobilePassword = () => {
  if (mobilePasswordInput.value) {
    mobilePasswordInput.value.focus()
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
  { name: 'Kenzen Miñao', initials: 'KM', role: 'Fullstack Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/kenzen3131', image: '/team/kenzen.jpg' },
  { name: 'Jullan Maglinte', initials: 'JM', role: 'Fullstack Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/jullan.maglinte', image: '/team/jullan.jpg' },
  { name: 'Keith Laranjo', initials: 'KL', role: 'Backend Dev', year_level: '2nd year', program: 'CS', facebook: 'https://facebook.com/kei.takun.5070', image: '/team/keith.jpg' },
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
    const response = await fetch(buildAPIUrl('/apis/settings'), {
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
  // safeFetch: try buildAPIUrl first, then fallback to default API if network/SSL fails
  const safeFetch = async (endpoint, options = {}) => {
    // endpoint may be full URL or path
    try {
      const resp = await fetch(buildAPIUrl(endpoint), options)
      return resp
    } catch (err) {
      console.warn('Primary API fetch failed, attempting fallback:', err)
      // fallback to main API
      const fallbackBase = 'https://ssaam-api.vercel.app'
      const url = (typeof endpoint === 'string' && endpoint.startsWith('http')) ? endpoint : (endpoint.startsWith('/') ? `${fallbackBase}${endpoint}` : `${fallbackBase}/${endpoint}`)
      try {
        // Mark that fallback is used and clear pre-login COE hint so we don't keep trying COE repeatedly
        try { apiFallbackUsed.value = true } catch (e) {}
        try { localStorage.removeItem('loginChosenDepartment') } catch (e) {}
        try { localStorage.removeItem('loginChosenProgram') } catch (e) {}
        const resp2 = await fetch(url, options)
        return resp2
      } catch (err2) {
        // rethrow the original error for logging
        console.error('Fallback API fetch also failed:', err2)
        throw err2
      }
    }
  }
  try {
    const enteredId = studentId.value.trim();
    const startsWithLetter = /^[a-zA-Z]/.test(enteredId);
    
    // Different handling for masters vs students
    let enteredPass;
    if (startsWithLetter) {
      // For masters: keep password as-is (trim only)
      enteredPass = password.value.trim();
    } else {
      // For students: trim leading/trailing spaces and collapse internal spaces, preserve multi-word names (e.g., "DELA CRUZ")
      enteredPass = password.value.trim().split(' ').map(word => word.trim()).filter(word => word).join(' ');
    }

    let user;
    
    if (startsWithLetter) {
      // Use masters login API with POST (safeFetch will fallback if network fails)
      const response = await safeFetch('/apis/masters/login', {
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
      // Auto-detect college: try each college in order until login succeeds
      const collegeOrder = ['CCS', 'COE', 'SOM', 'CNAHS', 'CLAMS', 'CBA', 'CMJE', 'CME']
      let finalResponse = null
      let finalData = null
      let detectedCollege = null

      for (const college of collegeOrder) {
        const resp = await safeFetch('/apis/students/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer SSAAMStudents`,
            'X-SSAAM-College': college
          },
          body: JSON.stringify({
            student_id: enteredId,
            last_name: enteredPass,
            _ssaam_access_token: encodeTimestamp()
          })
        })
        const d = await resp.json()
        console.log(`API STUDENT LOGIN RESPONSE (${college}):`, d)

        if (d.student && d.message === 'Login successful') {
          finalResponse = resp
          finalData = d
          detectedCollege = college
          break
        }
        // 403 mismatch means this college is wrong — try the next one
        if (resp.status === 403 && d && typeof d.message === 'string' && /belongs to the/i.test(d.message)) {
          continue
        }
        // Any other error (wrong password, not found, pending) — surface immediately
        finalResponse = resp
        finalData = d
        break
      }

      const data = finalData || {}
      if (data.student && data.message === 'Login successful') {
        user = data.student
        user.token = finalData.token
        user.requiresPasswordUpdate = finalData.requiresPasswordUpdate || false
        user._detectedCollege = detectedCollege
      } else if (data.message) {
        errorMessage.value = data.accountPending
          ? 'Your account is pending approval. Please wait for an admin to approve your registration. You will receive an email notification once approved.'
          : data.message
        showErrorNotification.value = true
        isLoading.value = false
        return
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
        yearLevel: user.year_level || '',
        semester: user.semester || '',
        schoolYear: user.school_year || '',
        program: user.program || '',
        role: startsWithLetter ? 'master' : (user.role || 'student'),
        image: user.photo || user.image || '',
        isMaster: startsWithLetter,
        token: user.token || '',
        requiresPasswordUpdate: user.requiresPasswordUpdate || false,
        selectedDepartment: user._detectedCollege
          ? (departments.find(d => d.label === user._detectedCollege) || null)
          : null
      };
      localStorage.removeItem('likeActionTimestamps')
      localStorage.removeItem('likeBanUntil')
      localStorage.removeItem('likeWarningShown')
      // Store the userLikeId that the backend will use (student_id for students, id/username for admins)
      const userLikeId = user.student_id || user._id || user.id || user.username
      if (userLikeId) {
        localStorage.setItem('userLikeId', userLikeId)
      }
      
      if (normalizedUser.role === 'master' || normalizedUser.isMaster) {
        pendingUser = normalizedUser;
        isLoading.value = false;
        // Wait for loading to finish animating out before showing modal
        setTimeout(() => {
          showVerificationModal.value = true;
          // Focus the first digit input after modal opens
          setTimeout(() => {
            if (verificationInputs.value[0]) verificationInputs.value[0].focus();
          }, 100);
        }, 300);
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
      localStorage.setItem("authToken", normalizedUser.token);
      // clear pre-login department/program hints
      try { localStorage.removeItem('loginChosenDepartment') } catch (e) {}
      try { localStorage.removeItem('loginChosenProgram') } catch (e) {}
      console.log("Navigating to dashboard...");
      isNavigationPending.value = true;
      return;
    }

    errorMessage.value = "Invalid Student ID or password. Please check your information and try again."
    showErrorNotification.value = true
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      errorMessage.value = "Network connection error: Cannot reach the authentication server. Please check your internet connection and try again."
      console.error("Network error detected - check if API is accessible at https://ssaam-api.vercel.app");
    } else if (error instanceof SyntaxError) {
      errorMessage.value = "Server error: Invalid response format. The server may be down."
      console.error("JSON parse error - server response was invalid");
    } else {
      errorMessage.value = "Server error. Please try again later."
    }
    showErrorNotification.value = true
  } finally {
    isLoading.value = false
  }
};

const goToRegister = () => {
  router.push('/register')
}

const verifyAdminCode = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  // MM/DD/YY format (e.g. April 22, 2026 -> 042226)
  const correctCode = `${month}${day}${year}`;
  const enteredCode = verificationDigits.value.join('');

  if (enteredCode === correctCode) {
    showVerificationModal.value = false;
    verificationError.value = false;
    verificationErrorMessage.value = '';
    // Proceed to Face ID step (step 3)
    startFaceVerification();
  } else {
    verificationErrorMessage.value = "Invalid verification code. Please try again.";
    verificationError.value = true;
    // Clear digits on error
    verificationDigits.value = ['', '', '', '', '', ''];
    if (verificationInputs.value[0]) verificationInputs.value[0].focus();
  }
};
</script>

<style scoped>
.fade-scale-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from {
  opacity: 0;
  transform: translateY(100%) scale(0.9);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (min-width: 768px) {
  .fade-scale-enter-from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
}

.desktop-bg-panel {
  background: linear-gradient(135deg, #1e3bdb 0%, #4f62ff 100%), url('/classroom-bg.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: inset -18px 0 40px rgba(0,0,0,0.35), 6px 0 24px rgba(0,0,0,0.28);
}

.mobile-bg-panel {
  background: linear-gradient(135deg, #1e3bdb 0%, #4f62ff 100%), url('/classroom-bg.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-bounce-enter-active {
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-bounce-leave-active {
  animation: bounce-in 0.3s reverse;
}
@keyframes bounce-in {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.slide-up-enter-active {
  animation: slide-up-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-up-leave-active {
  animation: slide-up-out 0.3s cubic-bezier(0.34, 0.44, 0.64, 0);
}
@keyframes slide-up-in {
  0% { 
    transform: translateY(2rem);
    opacity: 0;
  }
  100% { 
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes slide-up-out {
  0% { 
    transform: translateY(0);
    opacity: 1;
  }
  100% { 
    transform: translateY(2rem);
    opacity: 0;
  }
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}
.slide-left-enter-from {
  transform: translateX(2rem);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-2rem);
  opacity: 0;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.desktop-bg-panel, .mobile-bg-panel {
  transition: all 0.5s ease-in-out;
}

/* Mirror the camera feed so it feels natural (like a selfie) */
.face-mirror {
  transform: scaleX(-1);
}

.modal-logo {
  animation: logo-pop 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}

@keyframes logo-pop {
  0% { transform: translateY(-6px) scale(0.85); opacity: 0; }
  60% { transform: translateY(2px) scale(1.05); opacity: 1; }
  100% { transform: translateY(0) scale(1); }
}

.modal-logo-container {
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}

.modal-primary:focus,
.modal-secondary:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

/* Backdrop fade */
.fade-enter-active, .fade-leave-active {
  transition: opacity 260ms ease;
}
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Modal bounce with subtle scale and translate */
.modal-bounce-enter-active {
  animation: modal-bounce-in 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}
.modal-bounce-leave-active {
  animation: modal-bounce-out 320ms cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes modal-bounce-in {
  0% { transform: translateY(12px) scale(0.98); opacity: 0; }
  60% { transform: translateY(-8px) scale(1.02); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes modal-bounce-out {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(8px) scale(0.98); opacity: 0; }
}

/* Button hover glow and subtle gradient animation */
.modal-primary {
  background-image: linear-gradient(90deg, #1e3bdb 0%, #4f62ff 100%);
}
.modal-primary:hover { box-shadow: 0 12px 30px rgba(37,99,235,0.18); }
.modal-secondary:hover { box-shadow: 0 8px 20px rgba(15,23,42,0.06); }

/* Ensure modal content doesn't get clipped on very small screens */
.modal-primary, .modal-secondary { min-height: 44px; }

/* Need Help modal scrollbar styled to match gradient header */
.help-modal-scroll::-webkit-scrollbar {
  width: 6px;
}
.help-modal-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.help-modal-scroll::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 3px;
}
.help-modal-scroll::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

/* Face ID scan-line animation */
@keyframes face-scan {
  0%   { top: 8%;  opacity: 0; }
  10%  { opacity: 0.9; }
  50%  { top: 92%; opacity: 0.9; }
  60%  { opacity: 0; }
  100% { top: 8%;  opacity: 0; }
}
.ssaam-face-scanline {
  animation: face-scan 2.4s linear infinite;
}
</style>