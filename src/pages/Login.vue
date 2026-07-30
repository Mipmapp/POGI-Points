<template>
  <transition name="fade">
    <div v-if="showContactModal" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[200] p-0 sm:p-6" @click.self="showContactModal = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[88vh]">

          <!-- Header -->
          <div class="px-6 sm:px-8 pt-6 sm:pt-8 pb-3 text-center relative flex-shrink-0">
            <button @click="showContactModal = false" class="absolute right-4 top-4 sm:right-5 sm:top-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition text-xl leading-none">&times;</button>
            <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Need Help?</h3>
            <p class="text-gray-500 text-xs sm:text-sm mt-1">We're here to assist you</p>
          </div>

          <!-- Drag handle on mobile -->
          <div class="sm:hidden flex justify-center pt-2 pb-1 flex-shrink-0">
            <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
          </div>

          <!-- Scrollable content -->
          <div class="px-4 sm:px-6 pb-5 sm:pb-7 pt-3 sm:pt-4 space-y-3 sm:space-y-5 overflow-y-auto help-modal-scroll">

            <!-- Contact cards -->
            <div class="grid grid-cols-3 gap-2 sm:gap-4">
              <div class="flex flex-col items-center text-center p-2.5 sm:p-5 bg-blue-50 rounded-xl sm:rounded-2xl">
                <div class="w-9 h-9 sm:w-14 sm:h-14 mb-1.5 sm:mb-3 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <div class="w-5 h-5 sm:w-7 sm:h-7" style="-webkit-mask: url(/mail.svg) center/contain no-repeat; mask: url(/mail.svg) center/contain no-repeat; background-color: #2563eb;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-[11px] sm:text-sm mb-0.5 sm:mb-1 leading-tight">Email Support</p>
                <p class="text-[10px] sm:text-xs text-gray-500 leading-snug hidden sm:block">ssaamjrmsu@gmail.com</p>
                <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">For inquiries</p>
              </div>

              <div class="flex flex-col items-center text-center p-2.5 sm:p-5 bg-blue-50 rounded-xl sm:rounded-2xl">
                <div class="w-9 h-9 sm:w-14 sm:h-14 mb-1.5 sm:mb-3 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <div class="w-5 h-5 sm:w-7 sm:h-7" style="-webkit-mask: url(/home.svg) center/contain no-repeat; mask: url(/home.svg) center/contain no-repeat; background-color: #2563eb;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-[11px] sm:text-sm mb-0.5 sm:mb-1 leading-tight">CCS Office</p>
                <p class="text-[10px] sm:text-xs text-gray-500 leading-snug hidden sm:block">College of Computing</p>
                <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Office hours</p>
              </div>

              <div class="flex flex-col items-center text-center p-2.5 sm:p-5 bg-blue-50 rounded-xl sm:rounded-2xl cursor-pointer hover:bg-blue-100 active:scale-95 transition-all" @click="showDevelopersPopup = true; showContactModal = false">
                <div class="w-9 h-9 sm:w-14 sm:h-14 mb-1.5 sm:mb-3 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <div class="w-5 h-5 sm:w-7 sm:h-7" style="-webkit-mask: url(/register_user.svg) center/contain no-repeat; mask: url(/register_user.svg) center/contain no-repeat; background-color: #2563eb;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-[11px] sm:text-sm mb-0.5 sm:mb-1 leading-tight">Meet the Team</p>
                <p class="text-[10px] sm:text-xs text-gray-500 leading-snug hidden sm:block">CCS Creatives</p>
                <p class="text-[10px] sm:text-xs text-blue-600 mt-0.5 sm:mt-1 font-semibold">View →</p>
              </div>
            </div>

            <!-- Quick Help -->
            <div class="bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl p-3.5 sm:p-5">
              <p class="text-xs sm:text-sm font-bold text-gray-800 mb-2.5 sm:mb-4">Quick Help</p>
              <ul class="space-y-2.5 sm:space-y-3.5">
                <li class="flex items-start gap-2.5">
                  <span class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span>
                  </span>
                  <span class="text-xs sm:text-sm text-gray-600 leading-relaxed">Your default password is your <strong class="text-gray-800 font-semibold">Last Name (UPPERCASE)</strong></span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span>
                  </span>
                  <span class="text-xs sm:text-sm text-gray-600 leading-relaxed">Use <strong class="text-gray-800 font-semibold">"Forgot Password"</strong> if you need to reset it</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span>
                  </span>
                  <span class="text-xs sm:text-sm text-gray-600 leading-relaxed">Register your RFID at the <strong class="text-gray-800 font-semibold">CCS office</strong></span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span>
                  </span>
                  <span class="text-xs sm:text-sm text-gray-600 leading-relaxed">For profile issues, contact the <strong class="text-gray-800 font-semibold">Developers</strong> or visit the CCS office</span>
                </li>
              </ul>
            </div>

            <!-- Install SSAAM App -->
            <div class="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 px-3 py-2.5 flex items-center gap-2.5">
              <img :src="'/img/app_icon.png'" alt="SSAAM" class="w-9 h-9 rounded-xl shadow-sm flex-shrink-0 object-cover" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center flex-wrap gap-x-1 gap-y-0.5">
                  <p class="text-xs font-bold text-green-900 leading-tight">Install SSAAM App</p>
                  <span class="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-green-100 border border-green-200 text-[9px] font-semibold text-green-700 whitespace-nowrap">
                    <svg class="w-2 h-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.46 11.46 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>
                    Android only
                  </span>
                </div>
                <p class="text-[10px] text-green-700 mt-0.5 leading-snug">Get the native experience on your phone</p>
              </div>
              <a
                href="https://www.mediafire.com/file/g3v17bvzzrot54q/ssaam.apk/file"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[11px] font-bold shadow-sm hover:shadow-md hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all whitespace-nowrap"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"/></svg>
                Download
              </a>
            </div>

            <!-- Close button -->
            <button @click="showContactModal = false" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 sm:py-3.5 rounded-2xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md">
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

  <!-- Step 3 of 3: Face ID verification / first-time enrollment -->
  <transition name="fade">
    <div v-if="showFaceModal"
      class="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-[130] p-0 sm:p-4"
      @click.self="pendingUserIsRestrictedRole() ? undefined : cancelFaceVerification()">
      <transition name="face-slide" appear>
        <div :class="['relative w-full sm:max-w-[360px] overflow-hidden flex flex-col',
          'rounded-t-3xl sm:rounded-2xl bg-white',
          faceEnrollMode
            ? 'border border-violet-100 shadow-[0_-20px_60px_rgba(139,92,246,0.08)] sm:shadow-[0_20px_60px_rgba(139,92,246,0.12)]'
            : 'border border-gray-100 shadow-[0_-20px_60px_rgba(0,0,0,0.08)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.12)]']">

          <!-- Drag handle (mobile only) -->
          <div class="sm:hidden flex justify-center pt-2.5 shrink-0">
            <div class="w-8 h-[3px] rounded-full bg-gray-200"></div>
          </div>

          <!-- Content -->
          <div class="flex flex-col px-5 sm:px-6 pt-4 pb-5 sm:pt-5 sm:pb-6 gap-3 sm:gap-3.5">

            <!-- Step pills -->
            <div class="flex items-center justify-center gap-1.5">
              <span :class="['w-6 h-1 rounded-full', faceEnrollMode ? 'bg-violet-200' : 'bg-blue-200']"></span>
              <span :class="['w-6 h-1 rounded-full', faceEnrollMode ? 'bg-violet-200' : 'bg-blue-200']"></span>
              <span :class="['w-6 h-1 rounded-full', faceEnrollMode ? 'bg-violet-500' : 'bg-blue-500']"></span>
            </div>

            <!-- Header -->
            <template v-if="faceEnrollMode">
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-2.5"
                  :class="pendingUser?.actualRole === 'treasurer' ? 'bg-teal-50 border border-teal-100' : 'bg-violet-50 border border-violet-100'">
                  <svg class="w-5 h-5" :class="pendingUser?.actualRole === 'treasurer' ? 'text-teal-500' : 'text-violet-500'"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <h3 class="text-base font-bold text-gray-900 tracking-tight">Face ID Setup</h3>
                <p class="text-[11px] mt-0.5 leading-relaxed text-gray-400">
                  {{ pendingUserRoleLabel() }} · One-time security setup
                </p>
              </div>
            </template>

            <template v-else>
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 mb-2.5">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8V6a2 2 0 012-2h2M3 16v2a2 2 0 002 2h2m10-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
                  </svg>
                </div>
                <h3 class="text-base font-bold text-gray-900 tracking-tight">Face Verification</h3>
                <p class="text-[11px] text-gray-400 mt-0.5">Step 3 of 3 — Center your face and hold still</p>
              </div>
            </template>

            <!-- Error banner -->
            <div v-if="faceError"
              class="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[11px] text-center leading-snug">
              {{ faceError }}
            </div>

            <!-- No-faces info (super-admin bypass) -->
            <div v-if="noFacesEnrolled"
              class="px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-[11px] text-center leading-snug">
              No Face ID enrolled. You can continue and set one up from <strong class="text-amber-800">Settings → Face ID</strong>.
            </div>

            <!-- Camera frame -->
            <div :class="['relative mx-auto w-full rounded-xl overflow-hidden bg-gray-950',
              faceEnrollMode ? 'ring-1 ring-violet-200' : 'ring-1 ring-gray-200']"
              style="aspect-ratio:1/1; max-width:min(240px,100%);">
              <video ref="faceVideoEl" autoplay muted playsinline class="absolute inset-0 w-full h-full object-cover -scale-x-100"></video>

              <!-- Loading -->
              <div v-if="!faceCameraOn && !noFacesEnrolled"
                class="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-gray-950">
                <div :class="['w-8 h-8 rounded-full border-2 border-t-transparent animate-spin',
                  faceEnrollMode ? 'border-violet-400' : 'border-blue-400']"></div>
                <p class="text-[10px] text-white/50 font-medium">{{ faceLoadingModels ? 'Loading face models…' : 'Starting camera…' }}</p>
              </div>

              <!-- No-faces placeholder -->
              <div v-if="noFacesEnrolled"
                class="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-gray-950 px-5 text-center">
                <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <svg class="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8V6a2 2 0 012-2h2M3 16v2a2 2 0 002 2h2m10-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
                  </svg>
                </div>
                <p class="text-[10px] text-white/35 leading-relaxed">No Face ID<br>enrolled</p>
              </div>

              <!-- Enrollment overlay -->
              <div v-if="faceCameraOn && faceEnrollMode" class="absolute inset-0 pointer-events-none">
                <div class="absolute inset-x-8 inset-y-7">
                  <span class="corner-enroll corner-tl-enroll"></span>
                  <span class="corner-enroll corner-tr-enroll"></span>
                  <span class="corner-enroll corner-bl-enroll"></span>
                  <span class="corner-enroll corner-br-enroll"></span>
                  <div class="absolute inset-0 rounded-[30%] border border-violet-400/30 animate-pulse-ring-violet"></div>
                  <div v-if="faceCapturing" class="scan-line-enroll"></div>
                </div>
                <div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px] font-medium backdrop-blur-md bg-black/50 border border-violet-300/30 text-violet-200 flex items-center gap-1.5 whitespace-nowrap">
                  <span class="w-1 h-1 rounded-full bg-violet-400 animate-pulse"></span>
                  {{ faceCapturing ? 'Capturing…' : 'Position your face' }}
                </div>
              </div>

              <!-- Verification overlay -->
              <div v-if="faceCameraOn && !faceEnrollMode" class="absolute inset-0 pointer-events-none">
                <div class="absolute inset-x-8 inset-y-7 face-frame">
                  <span class="corner corner-tl"></span>
                  <span class="corner corner-tr"></span>
                  <span class="corner corner-bl"></span>
                  <span class="corner corner-br"></span>
                  <div class="absolute inset-0 rounded-[28%] border border-cyan-400/30 animate-pulse-ring"></div>
                  <div v-if="faceMatching" class="scan-line"></div>
                  <transition name="burst">
                    <div v-if="faceVerified" class="absolute inset-0 flex items-center justify-center">
                      <div class="absolute inset-0 rounded-[28%] border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]"></div>
                      <div class="relative w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.6)]">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </div>
                  </transition>
                </div>
                <div :class="['absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px] font-medium backdrop-blur-md flex items-center gap-1.5 border whitespace-nowrap', faceStatusPillClass]">
                  <span class="w-1 h-1 rounded-full bg-current animate-pulse"></span>
                  {{ faceStatusText }}
                </div>
              </div>
            </div>

            <!-- Enrollment status message -->
            <transition name="fade">
              <div v-if="faceEnrollMode && faceEnrollStatus"
                :class="['px-3 py-2 rounded-xl text-[11px] font-medium text-center leading-snug border',
                  faceEnrollKind === 'error'   ? 'bg-red-50 border-red-100 text-red-600'
                  : faceEnrollKind === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : 'bg-violet-50 border-violet-100 text-violet-700']">
                {{ faceEnrollStatus }}
              </div>
            </transition>

            <!-- Match-streak dots (verification only) -->
            <div v-if="faceCameraOn && !faceEnrollMode && !noFacesEnrolled"
              class="flex items-center justify-center gap-1.5">
              <span class="text-[10px] text-gray-400 mr-0.5">Match</span>
              <span v-for="n in 3" :key="n"
                :class="['h-1.5 rounded-full transition-all duration-300',
                  faceMatchStreakDisplay >= n ? 'w-6 bg-blue-500' : 'w-1.5 bg-gray-200']">
              </span>
            </div>

            <!-- Enrollment tips -->
            <div v-if="faceEnrollMode && !faceCapturing && !faceEnrollStatus"
              class="grid grid-cols-3 gap-1.5">
              <div v-for="tip in ['Good lighting','Face forward','No glare']" :key="tip"
                class="px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-center">
                <p class="text-[10px] text-gray-400 leading-snug">{{ tip }}</p>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex gap-2 pt-0.5">
              <button
                v-if="!faceEnrollMode || !pendingUserIsRestrictedRole()"
                @click="cancelFaceVerification"
                class="flex-none px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-xl text-sm font-medium transition-all active:scale-95">
                Cancel
              </button>

              <!-- Enrollment CTA -->
              <button
                v-if="faceEnrollMode"
                @click="captureAndEnrollFace"
                :disabled="!faceCameraOn || faceCapturing || faceEnrollSaving"
                :class="['flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white',
                  pendingUser?.actualRole === 'treasurer'
                    ? 'bg-teal-500 hover:bg-teal-600'
                    : 'bg-violet-500 hover:bg-violet-600']">
                <svg v-if="faceCapturing || faceEnrollSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ faceEnrollSaving ? 'Saving…' : faceCapturing ? 'Detecting…' : 'Capture & Enroll' }}
              </button>

              <!-- Super-admin bypass -->
              <button v-else-if="noFacesEnrolled"
                @click="completeLoginFromFace"
                class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all active:scale-95">
                Continue Anyway
              </button>

              <!-- Verification retry -->
              <button v-else
                @click="manualRetryFace"
                :disabled="!faceCameraOn || faceMatching || faceVerified"
                class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                {{ faceVerified ? '✓ Verified' : faceMatching ? 'Scanning…' : 'Retry' }}
              </button>
            </div>

          </div>
        </div>
      </transition>
    </div>
  </transition>

  <transition name="fade">
    <div v-if="showErrorNotification" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showErrorNotification = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
          <div class="px-8 pt-7 pb-2 text-center relative">
            <button @click="showErrorNotification = false" class="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition text-xl leading-none">&times;</button>
            <h3 class="text-2xl font-bold text-gray-900">Oops!</h3>
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
    <div v-if="showDevelopersPopup" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showDevelopersPopup = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="px-6 sm:px-8 pt-6 sm:pt-7 pb-1 text-center relative flex-shrink-0">
            <button @click="showDevelopersPopup = false"
              class="absolute right-4 top-4 sm:right-5 sm:top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition text-xl leading-none">
              &times;
            </button>
            <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Meet our team</h3>
            <p class="text-gray-500 text-xs sm:text-sm mt-1">CCS – Creatives Committee</p>
          </div>

          <!-- Carousel -->
          <div class="relative px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 select-none overflow-hidden">
            <div class="relative" style="height: 240px; overflow: visible;">
              <div v-for="(dev, i) in developers" :key="dev.name"
                :style="getDevStyle(i)"
                @click="handleDevClick(i)">
                <img :src="dev.image" :alt="dev.name"
                  class="w-full h-full object-cover object-top" />
                <!-- Active card overlay -->
                <div v-if="i === devCarouselIdx"
                  class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 sm:p-4 pt-8 sm:pt-10">
                  <p class="text-white font-bold text-sm leading-tight">{{ dev.name }}</p>
                  <p class="text-white/80 text-xs mt-0.5">{{ dev.role }}</p>
                  <p class="text-white/55 text-xs">{{ dev.year_level }} · {{ dev.program }}</p>
                </div>
                <!-- Side card name overlay -->
                <div v-else class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p class="text-white font-semibold text-[10px] text-center leading-tight truncate">{{ dev.name }}</p>
                </div>
              </div>
            </div>

            <!-- Nav arrows -->
            <button @click="prevDev"
              class="absolute left-1 top-1/2 -translate-y-6 w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-lg transition z-30">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button @click="nextDev"
              class="absolute right-1 top-1/2 -translate-y-6 w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-lg transition z-30">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            <!-- Dot indicators -->
            <div class="flex justify-center gap-2 mt-3 sm:mt-4">
              <button v-for="(_, i) in developers" :key="i" @click="devCarouselIdx = i"
                :class="['rounded-full transition-all duration-300', i === devCarouselIdx ? 'w-5 h-2 bg-gray-800' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400']" />
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 sm:px-8 pb-4 sm:pb-6 text-center flex-shrink-0">
            <p class="text-xs text-gray-400">CCS – Creatives Committee</p>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <ProgrammerLoadingEffect :visible="isLoading" message="AUTHENTICATING" theme="" @complete="handleLoadingComplete" />
  <!-- Desktop Layout -->
  <div class="hidden md:flex min-h-screen w-full relative" style="background: radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%), linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.55) 100%), url('/jrmsu-landscape.jpg') center 35% / cover no-repeat;">
    <!-- Left: image panel -->
    <div class="desktop-bg-panel flex-shrink-0 relative" style="width:calc(40% + 60px);">
      <ParticleBackground />
      <!-- Centered CCS logo -->
      <div class="absolute inset-0 z-20 flex items-center pointer-events-none" style="padding-right: 120px;">
        <div class="relative flex items-center justify-center w-full">
          <!-- Pulse glow rings -->
          <div class="absolute w-64 h-64 rounded-full ccs-glow-ring"></div>
          <div class="absolute w-56 h-56 rounded-full ccs-glow-ring ccs-glow-ring-delay"></div>
          <!-- Logo -->
          <img :src="'/ccs.png'" alt="CCS Logo" class="relative w-56 h-56 object-contain opacity-90 drop-shadow-2xl" />
        </div>
      </div>
      <!-- Top-left SSAAM branding -->
      <div class="absolute top-8 left-8 z-20 flex items-center gap-2.5">
        <img :src="'/img/app_icon.png'" alt="SSAAM" class="w-9 h-9 rounded-xl object-cover shadow-md" />
        <span class="text-white font-bold text-xl tracking-wide">SSAAM</span>
      </div>
      <!-- Bottom quote -->
      <div class="absolute bottom-12 left-8 right-8 z-20">
        <!-- Accent label -->
        <div class="flex items-center gap-2 mb-3">
          <span class="block w-6 h-px bg-indigo-400 opacity-80"></span>
          <span class="text-indigo-300 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-90">Official System</span>
        </div>
        <!-- Title block -->
        <div class="border-l-2 border-indigo-400 pl-3.5 mb-4">
          <p class="text-white/60 text-xs font-medium uppercase tracking-widest leading-none mb-1">Student School Activities</p>
          <p class="text-white text-3xl font-extrabold leading-tight tracking-tight">Attendance</p>
          <p class="text-indigo-300 text-3xl font-extrabold leading-tight tracking-tight">Monitoring</p>
        </div>
        <p class="text-white font-semibold text-sm">Jose Rizal Memorial State University</p>
        <p class="text-white/70 text-xs mt-0.5">College of Computing Studies</p>
      </div>
      <div class="absolute bottom-3 left-4 right-4 text-center text-[10px] text-white/40">
        Copyright © 2026 Powered by CCS-Creatives Committee.
      </div>
    </div>

    <!-- Gentle S-wave divider -->
    <div class="absolute top-0 bottom-0 z-40 pointer-events-none" style="left:40%;transform:translateX(-50%);width:120px;">
      <svg class="h-full w-full" viewBox="0 0 120 800" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60,0 C140,200 -20,600 60,800 L120,800 L120,0 Z" fill="white"/>
      </svg>
    </div>

    <!-- Right: login form -->
    <div class="flex-1 flex items-center justify-center bg-white">
      <div class="w-full max-w-sm px-6">
        <div class="mb-8">
          <h2 class="text-4xl font-bold text-gray-900 leading-tight mb-3">Welcome back!</h2>
          <p class="text-gray-400 text-sm">Student School Activities Attendance Monitoring</p>
        </div>

        <form @submit.prevent="handleLogin" novalidate class="space-y-4">
          <!-- Student ID -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</label>
            <input ref="studentIdInput" v-model="studentId" type="text" placeholder="e.g. 25-A-12345"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-white transition"
              @keydown.enter.prevent="focusPassword" required />
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
            <div class="relative">
              <input ref="passwordInput" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                class="w-full px-4 py-3 border border-indigo-400 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-gray-800 bg-white transition"
                style="-webkit-appearance:none;-moz-appearance:none;appearance:none;" required />
              <button type="button" @click="togglePasswordVisibility"
                :class="['absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition', { 'animate-wipe': visibilityAnimating }]"
                style="z-index:10;">
                <!-- Eye open -->
                <svg v-if="showPassword" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <!-- Eye closed -->
                <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Forgot / Help row -->
          <div class="flex justify-between items-center">
            <button type="button" @click="showForgotPasswordModal = true" class="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition">
              Forgot password?
            </button>
            <button type="button" @click="showContactModal = true" class="text-xs text-gray-400 hover:text-gray-600 transition">
              Need help?
            </button>
          </div>

          <!-- Log in button -->
          <button type="submit" :disabled="isLoading"
            class="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-sm">
            {{ isLoading ? 'Logging in…' : 'Log in' }}
          </button>
        </form>

        <!-- OR divider -->
        <div class="flex items-center gap-3 mt-4 mb-3">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-xs text-gray-400 font-medium">OR</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <!-- Continue with Google -->
        <button @click="handleGoogleLogin" type="button"
          class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition text-sm font-medium text-gray-700 shadow-sm">
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <!-- Sign up -->
        <p class="text-center text-sm text-gray-500 mt-5">
          Don't have an account?
          <button type="button" @click="goToRegister" class="text-indigo-500 hover:text-indigo-700 font-semibold ml-1 transition">Sign up</button>
        </p>

        <div class="mt-6 text-center text-xs text-gray-400">
          Powered by <button @click="showDevelopersPopup = true" class="text-blue-400 font-medium hover:text-blue-600 cursor-pointer transition">CCS - Creatives Committee</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div class="mobile-bg-full md:hidden min-h-screen flex flex-col w-full fixed inset-0 overflow-x-hidden overflow-y-auto" style="scrollbar-width:none;-ms-overflow-style:none;">
    <ParticleBackground />
    <!-- Branding header -->
    <div class="text-white pt-12 pb-8 px-6 relative z-10">
      <div class="flex items-center gap-3 mb-8">
        <img :src="'/img/app_icon.png'" alt="SSAAM" class="w-10 h-10 rounded-2xl object-cover shadow-md" />
        <span class="text-white font-bold text-2xl tracking-wide">SSAAM</span>
      </div>
      <h1 class="text-3xl font-bold leading-tight mb-2">Welcome back!</h1>
      <p class="text-white/70 text-sm">Login with your Student ID to continue.</p>
    </div>

    <div class="flex-1 bg-white rounded-t-3xl shadow-2xl px-6 py-8 relative z-10">
      <div class="max-w-md mx-auto">

        <form @submit.prevent="handleLogin" novalidate class="space-y-4">
          <!-- Student ID -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</label>
            <input ref="mobileStudentIdInput" v-model="studentId" type="text" placeholder="e.g. 25-A-12345"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-white transition"
              @keydown.enter.prevent="focusMobilePassword" required />
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
            <div class="relative">
              <input ref="mobilePasswordInput" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                class="w-full px-4 py-3 border border-indigo-400 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-gray-800 bg-white transition"
                required />
              <button type="button" @click="togglePasswordVisibility"
                :class="['absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition', { 'animate-wipe': visibilityAnimating }]"
                style="z-index:10;">
                <!-- Eye open -->
                <svg v-if="showPassword" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <!-- Eye closed -->
                <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Forgot / Help row -->
          <div class="flex justify-between items-center">
            <button type="button" @click="showForgotPasswordModal = true" class="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition">
              Forgot password?
            </button>
            <button type="button" @click="showContactModal = true" class="text-xs text-gray-400 hover:text-gray-600 transition">
              Need help?
            </button>
          </div>

          <!-- Log in button -->
          <button type="submit" :disabled="isLoading"
            class="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-sm">
            {{ isLoading ? 'Logging in…' : 'Log in' }}
          </button>
        </form>

        <!-- OR divider -->
        <div class="flex items-center gap-3 mt-4 mb-3">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-xs text-gray-400 font-medium">OR</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <!-- Continue with Google -->
        <button @click="handleGoogleLogin" type="button"
          class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition text-sm font-medium text-gray-700 shadow-sm">
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <!-- Sign up -->
        <p class="text-center text-sm text-gray-500 mt-5">
          Don't have an account?
          <button type="button" @click="goToRegister" class="text-indigo-500 hover:text-indigo-700 font-semibold ml-1 transition">Sign up</button>
        </p>

        <div class="mt-6 text-center text-xs text-gray-400">
          Powered by <button @click="showDevelopersPopup = true" class="text-blue-400 font-medium hover:text-blue-600 cursor-pointer transition">CCS - Creatives Committee</button>
        </div>
        <div class="mt-2 text-center text-xs text-gray-400">
          Copyright © 2026 Powered by CCS-Creatives Committee.
        </div>
      </div>
    </div>
  </div>

  <!-- Forgot Password Modal -->
  <transition name="fade">
    <div v-if="showForgotPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" @click.self="closeForgotPasswordModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="px-5 sm:px-8 pt-5 sm:pt-7 pb-2 text-center relative flex-shrink-0">
            <!-- Drag handle (mobile) -->
            <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden"></div>
            <button @click="closeForgotPasswordModal" class="absolute right-4 top-4 sm:right-5 sm:top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition text-xl leading-none">&times;</button>
            <h3 class="text-xl sm:text-2xl font-bold text-gray-900">Reset Password</h3>
            <p class="text-gray-500 text-xs sm:text-sm mt-1">{{ resetStep === 1 && !resetEmailStep ? 'Step 1: Enter your Student ID' : resetStep === 1 && resetEmailStep ? 'Step 1: Enter your email' : resetStep === 2 ? 'Step 2: Enter your code' : 'Step 3: New password' }}</p>
          </div>

          <!-- Scrollable Content -->
          <div class="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 overflow-y-auto">

            <!-- Step 1: Student ID → Email (animated) -->
            <div v-if="resetStep === 1" class="relative overflow-hidden">
              <transition :name="resetDirection === 'forward' ? 'step-slide-left' : 'step-slide-right'">

                <!-- Step 1a: Student ID -->
                <div v-if="!resetEmailStep" key="id-step" class="space-y-5">
                  <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
                    <svg class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p class="text-sm text-blue-700 leading-relaxed">Enter your Student ID to get started with the password reset.</p>
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-sm font-semibold text-gray-700">Student ID</label>
                    <input v-model="resetStudentId" type="text" placeholder="25-A-12345"
                      @keyup.enter="resetStudentId.trim() && (resetDirection = 'forward', resetEmailStep = true)"
                      class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-gray-800 placeholder-gray-400" />
                  </div>
                  <button @click="resetDirection = 'forward'; resetEmailStep = true" :disabled="!resetStudentId.trim()"
                    class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                    Next →
                  </button>
                </div>

                <!-- Step 1b: Email -->
                <div v-else key="email-step" class="space-y-5">
                  <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
                    <svg class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p class="text-sm text-blue-700 leading-relaxed">Enter the email address registered to your account to receive a verification code.</p>
                  </div>
                  <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                    <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    <span class="text-sm text-gray-600 font-medium truncate">{{ resetStudentId }}</span>
                    <button @click="resetDirection = 'backward'; resetEmailStep = false; resetMessage = ''" class="ml-auto text-xs text-blue-500 hover:text-blue-700 font-semibold flex-shrink-0 transition-colors">Change</button>
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-sm font-semibold text-gray-700">Email Address</label>
                    <input v-model="resetEmail" type="email" placeholder="your.email@example.com"
                      @keyup.enter="!resetLoading && resetEmail.trim() && requestResetCode()"
                      class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-gray-800 placeholder-gray-400" />
                  </div>
                  <button @click="requestResetCode" :disabled="resetLoading || !resetEmail.trim()"
                    class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2">
                    <svg v-if="resetLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    {{ resetLoading ? 'Sending...' : 'Send Code' }}
                  </button>
                  <button @click="resetDirection = 'backward'; resetEmailStep = false; resetMessage = ''" class="w-full text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">← Back</button>
                  <p v-if="resetMessage" :class="['text-sm text-center font-medium', resetSuccess ? 'text-green-600' : 'text-red-500']">{{ resetMessage }}</p>
                </div>

              </transition>
            </div>

            <!-- Step 2: Enter Verification Code -->
            <div v-if="resetStep === 2" class="space-y-5">
              <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
                <svg class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-sm text-blue-700 leading-relaxed">Enter the 6-digit verification code sent to your email.</p>
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700 text-center">Verification Code</label>
                <p class="text-xs text-blue-500 font-medium text-center">Copy the code from your email and paste it here</p>
                <div class="flex justify-center gap-2 sm:gap-3 mt-1">
                  <input
                    v-for="(digit, i) in resetCodeDigits"
                    :key="i"
                    :ref="el => { if (el) resetCodeInputRefs[i] = el }"
                    v-model="resetCodeDigits[i]"
                    @input="handleResetDigitInput(i)"
                    @keydown="handleResetDigitKeydown($event, i)"
                    @paste.prevent="handleResetCodePaste($event)"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    class="w-10 h-12 sm:w-12 sm:h-14 border-2 border-blue-200 rounded-xl text-center text-xl font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-gray-800 caret-transparent"
                  />
                </div>
              </div>
              <button @click="verifyResetCode" :disabled="resetLoading || resetCode.length !== 6"
                class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2">
                <svg v-if="resetLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ resetLoading ? 'Verifying...' : 'Verify Code' }}
              </button>
              <button @click="resetStep = 1" class="w-full text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">← Back to Step 1</button>
              <p v-if="resetMessage" :class="['text-sm text-center font-medium', resetSuccess ? 'text-green-600' : 'text-red-500']">{{ resetMessage }}</p>
            </div>

            <!-- Step 3: Enter New Password -->
            <div v-if="resetStep === 3" class="space-y-5">
              <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
                <svg class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-sm text-blue-700 leading-relaxed">Create a new password for your account.</p>
              </div>
              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-gray-700">New Password</label>
                <input v-model="newPassword" type="password" placeholder="Enter new password"
                  class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-gray-800 placeholder-gray-400" />
              </div>
              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-gray-700">Confirm Password</label>
                <input v-model="confirmNewPassword" type="password" placeholder="Confirm new password"
                  :class="['w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition text-gray-800 placeholder-gray-400',
                    newPassword && confirmNewPassword && newPassword !== confirmNewPassword
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100']" />
              </div>
              <p v-if="newPassword && confirmNewPassword && newPassword !== confirmNewPassword" class="text-xs text-red-500 font-medium -mt-2">Passwords do not match</p>
              <button @click="completePasswordReset" :disabled="resetLoading || !newPassword || newPassword !== confirmNewPassword"
                class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2">
                <svg v-if="resetLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ resetLoading ? 'Resetting...' : 'Reset Password' }}
              </button>
              <p v-if="resetMessage" :class="['text-sm text-center font-medium', resetSuccess ? 'text-green-600' : 'text-red-500']">{{ resetMessage }}</p>
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
import ParticleBackground from '../components/ParticleBackground.vue'
import jrmsuLogo from '../assets/ccs-logo.png'
import { encodeTimestamp, syncServerTime, updateServerOffsetFromHeaders } from '../utils/ssaamCrypto.js'
import API_getBaseURL, { buildAPIUrl } from '../config/api.js'
import departments from '../config/departments.js'
import { useCollege } from '../composables/useCollege.js'

const { isCCS, isCOE, isSOM, isCNAHS } = useCollege()

const router = useRouter()
const studentId = ref('')
const password = ref('')
const isLoading = ref(false)
const isNavigationPending = ref(false)

// Navigate as soon as auth is confirmed — do NOT wait for the loading
// animation's @complete event, which fires on its own timer and can race
// against a slow API response (causing the "must click twice" bug).
watch(isNavigationPending, (pending) => {
  if (pending) {
    router.push('/dashboard')
  }
})

// Kept as a no-op safety net so the @complete binding on the template
// continues to compile without errors.
const handleLoadingComplete = () => {}

const showDevelopersPopup = ref(false)
const devCarouselIdx = ref(1) // start on Jullan Maglinte (index 1)
let devCarouselTimer = null
const DEV_COUNT = 5
const devIdx = (i) => ((i % DEV_COUNT) + DEV_COUNT) % DEV_COUNT
const prevDev = () => { devCarouselIdx.value = devIdx(devCarouselIdx.value - 1) }
const nextDev = () => { devCarouselIdx.value = devIdx(devCarouselIdx.value + 1) }

// Returns per-card absolute style; CSS transition animates every property smoothly
const getDevStyle = (i) => {
  let d = i - devCarouselIdx.value
  if (d > DEV_COUNT / 2) d -= DEV_COUNT
  if (d < -DEV_COUNT / 2) d += DEV_COUNT
  // All cards share left:50% as origin; translateX shifts each to its slot:
  //   d=0  (active)  : center 160px card  → translateX(-80px)
  //   d=-1 (prev)    : 112px card left    → translateX(-204px)   [center at -148px]
  //   d=+1 (next)    : 112px card right   → translateX(+92px)    [center at +148px]
  //   |d|≥2          : hidden off-screen
  const t = {
    position: 'absolute', bottom: '0', left: '50%',
    borderRadius: '1rem', overflow: 'hidden',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  }
  if (d === 0) {
    return { ...t, width: '160px', height: '240px', transform: 'translateX(-80px)', opacity: '1', filter: 'none', zIndex: '20' }
  } else if (d === -1) {
    return { ...t, width: '112px', height: '176px', transform: 'translateX(-204px)', opacity: '0.55', filter: 'grayscale(1)', zIndex: '10' }
  } else if (d === 1) {
    return { ...t, width: '112px', height: '176px', transform: 'translateX(92px)', opacity: '0.55', filter: 'grayscale(1)', zIndex: '10' }
  } else if (d < -1) {
    return { ...t, width: '112px', height: '176px', transform: 'translateX(-420px)', opacity: '0', filter: 'grayscale(1)', zIndex: '5', pointerEvents: 'none' }
  } else {
    return { ...t, width: '112px', height: '176px', transform: 'translateX(380px)', opacity: '0', filter: 'grayscale(1)', zIndex: '5', pointerEvents: 'none' }
  }
}

// Clicking a non-active card navigates the carousel; clicking the active card opens Facebook
const handleDevClick = (i) => {
  if (i !== devCarouselIdx.value) {
    devCarouselIdx.value = i
  } else {
    window.open(developers[i].facebook, '_blank', 'noopener,noreferrer')
  }
}

watch(showDevelopersPopup, (open) => {
  if (open) {
    devCarouselIdx.value = 1 // always open on Jullan
    devCarouselTimer = setInterval(nextDev, 3000)
  } else {
    clearInterval(devCarouselTimer)
    devCarouselTimer = null
  }
})
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

// Sweep localStorage and remove every photo_* entry whose expiry has passed.
// Runs on every login so the cache never grows unboundedly over time.
function pruneExpiredPhotoCache() {
  try {
    const now = Date.now()
    const toDelete = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('photo_')) continue
      try {
        const parsed = JSON.parse(localStorage.getItem(key))
        if (!parsed || !parsed.expiry || now >= parsed.expiry) toDelete.push(key)
      } catch { toDelete.push(key) }
    }
    toDelete.forEach(k => localStorage.removeItem(k))
    // pruned expired photo cache entries silently
  } catch (e) {
    console.warn('[PhotoCache] Prune failed:', e)
  }
}

// Complete the login after the admin verification code passes.
// Persists the pending user to localStorage and triggers the navigation.
function completeLogin() {
  if (!pendingUser) return
  pruneExpiredPhotoCache()
  const { token: _t, custom_password: _cp, password_hash: _ph, admin_verification_token: _avt, ...safeUser } = pendingUser
  localStorage.setItem('currentUser', JSON.stringify(safeUser))
  localStorage.setItem('authToken', pendingUser.token)
  isLoading.value = true
  isNavigationPending.value = true
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
const resetEmailStep = ref(false)
const resetDirection = ref('forward')
const resetStudentId = ref('')
const resetEmail = ref('')
const resetCode = ref('')
const resetCodeDigits = ref(['', '', '', '', '', ''])
const resetCodeInputRefs = ref([])
const resetToken = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const resetLoading = ref(false)
const resetMessage = ref('')
const resetSuccess = ref(false)

// Sync digit boxes → resetCode
watch(resetCodeDigits, (digits) => {
  resetCode.value = digits.join('')
}, { deep: true })

const handleResetDigitInput = (i) => {
  const raw = resetCodeDigits.value[i].replace(/\D/g, '')
  resetCodeDigits.value[i] = raw ? raw[0] : ''
  if (raw && i < 5) {
    nextTick(() => resetCodeInputRefs.value[i + 1]?.focus())
  }
  if (resetCodeDigits.value.join('').length === 6 && !resetLoading.value) {
    verifyResetCode()
  }
}

const handleResetDigitKeydown = (e, i) => {
  if (e.key === 'Backspace' && !resetCodeDigits.value[i] && i > 0) {
    nextTick(() => resetCodeInputRefs.value[i - 1]?.focus())
  }
  if (e.key === 'ArrowLeft' && i > 0) resetCodeInputRefs.value[i - 1]?.focus()
  if (e.key === 'ArrowRight' && i < 5) resetCodeInputRefs.value[i + 1]?.focus()
}

const handleResetCodePaste = (e) => {
  const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6)
  text.split('').forEach((ch, idx) => { resetCodeDigits.value[idx] = ch })
  const next = Math.min(text.length, 5)
  nextTick(() => resetCodeInputRefs.value[next]?.focus())
}

const apiFallbackUsed = ref(false)

const closeForgotPasswordModal = () => {
  showForgotPasswordModal.value = false
  resetStep.value = 1
  resetEmailStep.value = false
  resetDirection.value = 'forward'
  resetStudentId.value = ''
  resetEmail.value = ''
  resetCode.value = ''
  resetCodeDigits.value = ['', '', '', '', '', '']
  resetToken.value = ''
  newPassword.value = ''
  confirmNewPassword.value = ''
  resetMessage.value = ''
  resetSuccess.value = false
}

// Helper: send a timestamp-protected POST. If it 401s with a timestamp error,
// re-sync our clock against the server's Date header and retry once.
const postWithTimestamp = async (url, payload) => {
  const send = () => {
    const token = encodeTimestamp()
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SSAAMStudents',
        'X-SSAAM-TS': token
      },
      body: JSON.stringify({ ...payload, _ssaam_access_token: token })
    })
  }
  let response = await send()
  // Always learn the server's clock from this response.
  updateServerOffsetFromHeaders(response)
  if (response.status === 401) {
    // Could be clock skew that wasn't corrected before the first call.
    // Now that offset is updated, retry once.
    response = await send()
    updateServerOffsetFromHeaders(response)
  }
  return response
}

const requestResetCode = async () => {
  resetLoading.value = true
  resetMessage.value = ''
  try {
    const response = await postWithTimestamp(buildAPIUrl(`/apis/password-reset/request`), {
      student_id: resetStudentId.value.trim(),
      email: resetEmail.value.trim()
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
    const response = await postWithTimestamp(buildAPIUrl(`/apis/password-reset/verify`), {
      student_id: resetStudentId.value.trim(),
      code: resetCode.value.trim()
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
    const response = await postWithTimestamp(buildAPIUrl(`/apis/password-reset/complete`), {
      student_id: resetStudentId.value.trim(),
      reset_token: resetToken.value,
      new_password: newPassword.value
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
  { name: 'Jullan Maglinte', initials: 'JM', role: 'Lead Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/jullan.maglinte', image: '/team/jullan.jpg' },
  { name: 'Keith Laranjo', initials: 'KL', role: 'Backend Dev', year_level: '2nd year', program: 'CS', facebook: 'https://facebook.com/kei.takun.5070', image: '/team/keith.jpg' },
  { name: 'Christoph Bagabuyo', initials: 'CB', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/christoph.bagabuyo', image: '/team/christoph.jpg' },
  { name: 'Mischi Jeda Elumba', initials: 'MJ', role: 'UI/UX Designer', year_level: '2nd year', program: 'IS', facebook: 'https://facebook.com/mischijeda.elumba.1', image: '/team/mischi.jpg' }
]

onMounted(async () => {
  // Sync our clock against the server early so timestamp-protected endpoints
  // (login, password reset) don't 401 due to user PC clock skew. Fire-and-forget.
  syncServerTime()

  // ── Google OAuth callback handling ──────────────────────────────────────────
  const params = new URLSearchParams(window.location.search)

  // If Google redirected back with an error, show it and clean the URL
  const googleError = params.get('google_error')
  if (googleError) {
    errorMessage.value = googleError
    showErrorNotification.value = true
    window.history.replaceState({}, '', window.location.pathname)
  }

  // If Google redirected back with a short-lived exchange code, trade it for
  // the full auth payload and log the student in automatically.
  const gc = params.get('gc')
  if (gc) {
    window.history.replaceState({}, '', window.location.pathname)
    try {
      isLoading.value = true
      const resp = await fetch('/api/auth/google/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gc })
      })
      const data = await resp.json()
      if (!resp.ok || !data.token || !data.student) {
        throw new Error(data.message || 'Google login failed. Please try again.')
      }
      const user = data.student
      const college = data.college
      const normalizedUser = {
        ...user,
        studentId: user.student_id,
        fullName: user.full_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        rfidCode: user.rfid_code || '',
        rfid_code: user.rfid_code || '',
        rfid_status: user.rfid_status || 'unverified',
        rfid_verified_at: user.rfid_verified_at || null,
        yearLevel: user.year_level || '',
        semester: user.semester || '',
        schoolYear: user.school_year || '',
        program: user.program || '',
        role: user.role || 'student',
        actualRole: 'student',
        image: user.photo || user.image || '',
        isMaster: false,
        token: data.token,
        requiresPasswordUpdate: false,
        selectedDepartment: departments.find(d => d.label === college) || null
      }
      const { token: _tok, custom_password: _cp, password_hash: _ph, admin_verification_token: _avt, ...safeUser } = normalizedUser
      localStorage.setItem('currentUser', JSON.stringify(safeUser))
      localStorage.setItem('authToken', data.token)
      pruneExpiredPhotoCache()
      router.push('/dashboard')
      return
    } catch (err) {
      isLoading.value = false
      errorMessage.value = err.message || 'Google login failed. Please try again.'
      showErrorNotification.value = true
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

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
    let data
    try { data = await response.json() } catch { data = {} }
    if (response.ok && data.userLogin) {
      loginDisabled.value = !data.userLogin.login
      loginDisabledMessage.value = data.userLogin.message || 'Login is currently disabled. Please try again later.'
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
  }
})

const handleGoogleLogin = () => {
  window.location.href = '/api/auth/google'
}

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

  // Ensure the client clock is synced with the server before sending any
  // timestamp-protected request. Cap at 3 s so slow networks don't stall login.
  try {
    await Promise.race([
      syncServerTime(),
      new Promise(resolve => setTimeout(resolve, 3000))
    ])
  } catch (_) { /* best-effort — proceed with whatever offset we have */ }

  // safeFetch: try buildAPIUrl first, then fallback to default API if network/SSL fails
  const safeFetch = async (endpoint, options = {}) => {
    // endpoint may be full URL or path
    try {
      const resp = await fetch(buildAPIUrl(endpoint), options)
      return resp
    } catch (err) {
      console.warn('Primary API fetch failed:', err)
      // Clear pre-login college hints so we don't keep retrying with stale state
      try { apiFallbackUsed.value = true } catch (e) {}
      try { localStorage.removeItem('loginChosenDepartment') } catch (e) {}
      try { localStorage.removeItem('loginChosenProgram') } catch (e) {}
      throw err
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
      let data;
      try {
        data = await response.json();
      } catch {
        throw new SyntaxError('Server returned a non-JSON response. The server may be temporarily unavailable.');
      }
      
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

      // Helper: run the full college-detection loop with the current clock offset.
      const tryCollegeLoop = async () => {
        let _finalResponse = null
        let _finalData = null
        let _detectedCollege = null
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
          // Keep server clock updated on every response.
          updateServerOffsetFromHeaders(resp.clone ? resp.clone() : resp)
          let d
          try {
            d = await resp.json()
          } catch {
            // Non-JSON response (proxy error, server down) — try next college
            continue
          }

          if (d.student && d.message === 'Login successful') {
            _finalResponse = resp
            _finalData = d
            _detectedCollege = college
            break
          }
          // 403 mismatch means this college is wrong — try the next one
          if (resp.status === 403 && d && typeof d.message === 'string' && /belongs to the/i.test(d.message)) {
            continue
          }
          // Any other error (wrong password, not found, pending, timestamp) — stop immediately
          _finalResponse = resp
          _finalData = d
          break
        }
        return { response: _finalResponse, data: _finalData, college: _detectedCollege }
      }

      let attempt = await tryCollegeLoop()

      // If the first attempt failed with a timestamp error, re-sync the clock and
      // retry once — handles phones with automatic-time that is still drifted at
      // the point of first call.
      if (
        attempt.response?.status === 401 &&
        typeof attempt.data?.message === 'string' &&
        /timestamp/i.test(attempt.data.message)
      ) {
        try {
          await Promise.race([
            syncServerTime(),
            new Promise(resolve => setTimeout(resolve, 3000))
          ])
        } catch (_) { /* best-effort */ }
        attempt = await tryCollegeLoop()
      }

      finalResponse = attempt.response
      finalData = attempt.data
      detectedCollege = attempt.college

      // If every college returned a non-JSON response the server is unreachable
      if (!finalResponse && !finalData) {
        errorMessage.value = 'Cannot reach the server. Please check your internet connection or try again later.'
        showErrorNotification.value = true
        isLoading.value = false
        return
      }

      const data = finalData || {}
      if (data.student && data.message === 'Login successful') {
        user = data.student
        user.token = finalData.token
        user.requiresPasswordUpdate = finalData.requiresPasswordUpdate || false
        user._detectedCollege = detectedCollege
      } else if (data.message) {
        const isTimestampError = /timestamp/i.test(data.message) && finalResponse?.status === 401
        errorMessage.value = data.accountPending
          ? 'Your account is pending approval. Please wait for an admin to approve your registration. You will receive an email notification once approved.'
          : isTimestampError
            ? 'Login failed due to a clock sync issue. Please make sure your device\'s date and time are set to "Automatic" and try again.'
            : data.message
        showErrorNotification.value = true
        isLoading.value = false
        return
      }
    }

    if (user) {
      const normalizedUser = {
        ...user,
        studentId: user.student_id || user.username || enteredId,
        fullName: user.full_name || user.first_name || '',
        lastName: user.last_name || '',
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
        actualRole: startsWithLetter ? (user.role || 'admin') : 'student',
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

      const { token: _tok, custom_password: _cp, password_hash: _ph, admin_verification_token: _avt, ...safeUser } = normalizedUser
      localStorage.setItem("currentUser", JSON.stringify(safeUser));
      localStorage.setItem("authToken", normalizedUser.token);
      // clear pre-login department/program hints
      try { localStorage.removeItem('loginChosenDepartment') } catch (e) {}
      try { localStorage.removeItem('loginChosenProgram') } catch (e) {}
      pruneExpiredPhotoCache()
      // Navigate immediately — authentication is complete. The loading overlay
      // (isLoading) will be cleared by the finally block after we return.
      router.push('/dashboard');
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
      console.error("Network error detected - check if the API server is running and reachable");
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
    // Verification passed — try Step 3 (Face ID) before completing the login.
    proceedToFaceVerification();
  } else {
    verificationErrorMessage.value = "Invalid verification code. Please try again.";
    verificationError.value = true;
    // Clear digits on error
    verificationDigits.value = ['', '', '', '', '', ''];
    if (verificationInputs.value[0]) verificationInputs.value[0].focus();
  }
};

// ---------- Step 3 of 3: Face ID ----------
// Always shown after the 2nd verification passes. If no faces are enrolled
// (or the enrollment lookup fails), the modal still opens with a "Continue"
// button so admins are never silently logged in past the 3rd step.
// For co-admin / treasurer: if no face enrolled, they MUST enroll inline
// before they can proceed — the "Continue" bypass is not available to them.
const showFaceModal = ref(false)
const faceLoadingModels = ref(false)
const faceCameraOn = ref(false)
const faceMatching = ref(false)
const faceVerified = ref(false)
const noFacesEnrolled = ref(false)
const faceError = ref('')
const faceStatusText = ref('')
const faceStatusVariant = ref('idle') // idle | scanning | match | nomatch | nodetect | success | error
const faceMatchStreakDisplay = ref(0)
const faceVideoEl = ref(null)
let faceStream = null
let faceLoopHandle = null
let faceEnrolled = []          // [{_id, label, descriptor[]}]
let faceMatchStreak = 0
let faceMatchStreakTarget = 3

// Enrollment mode — used for co-admin/treasurer with no faces enrolled yet
const faceEnrollMode = ref(false)
const faceEnrollStatus = ref('')
const faceEnrollKind = ref('info') // info | success | error
const faceCapturing = ref(false)
const faceEnrollSaving = ref(false)

function pendingUserIsRestrictedRole() {
  const r = pendingUser?.actualRole || ''
  return r === 'co-admin' || r === 'treasurer'
}

function pendingUserRoleLabel() {
  const r = pendingUser?.actualRole || ''
  if (r === 'treasurer') return 'Treasurer'
  if (r === 'co-admin') return 'Co-Admin'
  return 'Admin'
}

const faceStatusPillClass = computed(() => {
  switch (faceStatusVariant.value) {
    case 'success': return 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200';
    case 'match':   return 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100';
    case 'nomatch': return 'bg-amber-500/20 border-amber-400/50 text-amber-100';
    case 'nodetect':return 'bg-slate-700/60 border-slate-500/40 text-slate-200';
    case 'error':   return 'bg-red-500/20 border-red-400/50 text-red-200';
    case 'scanning':return 'bg-blue-500/20 border-blue-400/50 text-blue-100';
    default:        return 'bg-blue-500/20 border-blue-400/50 text-blue-100';
  }
})

function setFaceStatus(text, variant = 'scanning') {
  faceStatusText.value = text;
  faceStatusVariant.value = variant;
}

async function proceedToFaceVerification() {
  // Always reveal the 3rd verification modal, even when something fails below.
  faceError.value = '';
  faceVerified.value = false;
  noFacesEnrolled.value = false;
  faceEnrollMode.value = false;
  faceEnrollStatus.value = '';
  faceEnrollKind.value = 'info';
  faceCapturing.value = false;
  faceEnrollSaving.value = false;
  faceMatchStreakDisplay.value = 0;
  setFaceStatus('Initializing…', 'scanning');
  showFaceModal.value = true;

  if (!pendingUser || !pendingUser.token) {
    if (pendingUserIsRestrictedRole()) { faceEnrollMode.value = true; await startFaceCamera(); }
    else { noFacesEnrolled.value = true; }
    return;
  }

  try {
    const res = await fetch(buildAPIUrl('/apis/masters/face'), {
      headers: { 'Authorization': `Bearer ${pendingUser.token}` },
    });
    if (!res.ok) {
      if (pendingUserIsRestrictedRole()) { faceEnrollMode.value = true; await startFaceCamera(); }
      else { noFacesEnrolled.value = true; }
      return;
    }
    const data = await res.json();
    faceEnrolled = (data.faces || []).filter(f => Array.isArray(f.descriptor) && f.descriptor.length === 128);
    if (faceEnrolled.length === 0) {
      // Co-admin / treasurer must enroll their face inline — no bypass allowed.
      // Super-admin gets the "Continue Anyway" option.
      if (pendingUserIsRestrictedRole()) {
        faceEnrollMode.value = true;
        await startFaceCamera();
      } else {
        noFacesEnrolled.value = true;
      }
      return;
    }
    setFaceStatus('Position your face', 'scanning');
    await startFaceCamera();
  } catch (e) {
    // Even on network/parse errors, restricted roles must go through enrollment
    // rather than being silently given the bypass button.
    if (pendingUserIsRestrictedRole()) {
      faceEnrollMode.value = true;
      await startFaceCamera();
    } else {
      noFacesEnrolled.value = true;
    }
  }
}

async function captureAndEnrollFace() {
  if (!faceCameraOn.value || faceCapturing.value) return;
  faceCapturing.value = true;
  faceEnrollStatus.value = 'Looking for your face…';
  faceEnrollKind.value = 'info';
  try {
    const { detectDescriptor } = await import('../utils/faceapi.js');
    const descriptor = await detectDescriptor(faceVideoEl.value);
    if (!descriptor) {
      faceEnrollStatus.value = 'No face detected — adjust lighting and try again.';
      faceEnrollKind.value = 'error';
      return;
    }
    faceEnrollSaving.value = true;
    faceEnrollStatus.value = 'Saving your face…';
    const res = await fetch(buildAPIUrl('/apis/masters/face'), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pendingUser.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ descriptor, label: `${pendingUserRoleLabel()} Face` }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Enrollment failed');
    faceEnrollStatus.value = '✓ Face enrolled! Verifying now…';
    faceEnrollKind.value = 'success';
    // Refresh enrolled list then jump straight to verification
    const facesRes = await fetch(buildAPIUrl('/apis/masters/face'), {
      headers: { 'Authorization': `Bearer ${pendingUser.token}` },
    });
    const facesData = await facesRes.json();
    faceEnrolled = (facesData.faces || []).filter(f => Array.isArray(f.descriptor) && f.descriptor.length === 128);
    await new Promise(r => setTimeout(r, 900));
    faceEnrollMode.value = false;
    faceEnrollStatus.value = '';
    faceMatchStreak = 0;
    faceMatchStreakDisplay.value = 0;
    setFaceStatus('Position your face', 'scanning');
    runFaceLoop();
  } catch (e) {
    faceEnrollStatus.value = e.message || 'Enrollment failed. Try again.';
    faceEnrollKind.value = 'error';
  } finally {
    faceCapturing.value = false;
    faceEnrollSaving.value = false;
  }
}

async function startFaceCamera() {
  try {
    faceLoadingModels.value = true;
    const { ensureModelsLoaded, FACE_MATCH_STREAK } = await import('../utils/faceapi.js');
    if (typeof FACE_MATCH_STREAK === 'number' && FACE_MATCH_STREAK > 0) faceMatchStreakTarget = FACE_MATCH_STREAK;
    await ensureModelsLoaded();
    faceLoadingModels.value = false;

    faceStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
    // Wait for Vue to flush DOM updates so faceVideoEl is mounted
    await nextTick();
    await new Promise(r => setTimeout(r, 50));
    const video = faceVideoEl.value;
    if (!video) {
      // Still not mounted — retry after one more tick
      await nextTick();
      if (!faceVideoEl.value) {
        faceError.value = 'Camera display not ready. Please try again.';
        setFaceStatus('Display error', 'error');
        return;
      }
    }
    const vid = faceVideoEl.value;
    vid.srcObject = faceStream;
    await new Promise(resolve => { vid.onloadedmetadata = () => resolve(); });
    await vid.play();
    faceCameraOn.value = true;
    faceMatchStreak = 0;
    faceMatchStreakDisplay.value = 0;
    // Only run the match loop in verification mode; enrollment mode uses
    // captureAndEnrollFace() instead — running the loop against an empty
    // faceEnrolled array would waste CPU and interfere with capture.
    if (!faceEnrollMode.value) {
      runFaceLoop();
    }
  } catch (e) {
    faceLoadingModels.value = false;
    faceError.value = 'Could not access camera. ' + (e.message || '');
    setFaceStatus('Camera unavailable', 'error');
  }
}

async function runFaceLoop() {
  if (!faceCameraOn.value || faceMatching.value) return;
  faceMatching.value = true;
  setFaceStatus('Scanning…', 'scanning');
  try {
    const { detectDescriptor, descriptorDistance, FACE_MATCH_THRESHOLD } = await import('../utils/faceapi.js');
    const tick = async () => {
      if (!faceCameraOn.value || !showFaceModal.value) return;
      const live = await detectDescriptor(faceVideoEl.value);
      if (live) {
        let best = Infinity;
        for (const f of faceEnrolled) {
          const d = descriptorDistance(live, f.descriptor);
          if (d < best) best = d;
        }
        if (best < FACE_MATCH_THRESHOLD) {
          faceMatchStreak += 1;
          faceMatchStreakDisplay.value = Math.min(faceMatchStreak, faceMatchStreakTarget);
          setFaceStatus(`Matching ${faceMatchStreak}/${faceMatchStreakTarget}`, 'match');
          if (faceMatchStreak >= faceMatchStreakTarget) {
            await onFaceMatched();
            return;
          }
        } else {
          faceMatchStreak = 0;
          faceMatchStreakDisplay.value = 0;
          setFaceStatus('Hold steady — keep looking at the camera', 'nomatch');
        }
      } else {
        faceMatchStreak = 0;
        faceMatchStreakDisplay.value = 0;
        setFaceStatus('No face detected', 'nodetect');
      }
      faceLoopHandle = setTimeout(tick, 350);
    };
    await tick();
  } catch (e) {
    faceError.value = 'Face scan failed: ' + (e.message || '');
    setFaceStatus('Scan error', 'error');
  } finally {
    faceMatching.value = false;
  }
}

async function onFaceMatched() {
  faceVerified.value = true;
  setFaceStatus('Verified ✓', 'success');
  // Brief pause so the success burst is visible before navigating away.
  await new Promise(r => setTimeout(r, 700));
  stopFaceCamera();
  showFaceModal.value = false;
  completeLogin();
}

function completeLoginFromFace() {
  stopFaceCamera();
  showFaceModal.value = false;
  completeLogin();
}

function stopFaceCamera() {
  try { if (faceLoopHandle) clearTimeout(faceLoopHandle); } catch {}
  faceLoopHandle = null;
  try { if (faceStream) faceStream.getTracks().forEach(t => t.stop()); } catch {}
  faceStream = null;
  faceCameraOn.value = false;
  if (faceVideoEl.value) faceVideoEl.value.srcObject = null;
}

function cancelFaceVerification() {
  stopFaceCamera();
  showFaceModal.value = false;
  isLoading.value = false;
  isNavigationPending.value = false;
  pendingUser = null;
}

function manualRetryFace() {
  if (faceVerified.value) return;
  if (!faceCameraOn.value) { startFaceCamera(); return; }
  faceMatchStreak = 0;
  faceMatchStreakDisplay.value = 0;
  faceError.value = '';
  runFaceLoop();
}
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
  background:
    radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%),
    linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.55) 100%),
    url('/jrmsu-landscape.jpg') center 35% / cover no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.mobile-bg-full {
  background:
    radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%),
    linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.55) 100%),
    url('/jrmsu-landscape.jpg') center 35% / cover no-repeat;
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

/* ---------- reset-password step slide (forward: left, backward: right) ---------- */
.step-slide-left-enter-active,
.step-slide-left-leave-active,
.step-slide-right-enter-active,
.step-slide-right-leave-active {
  transition: transform 0.38s cubic-bezier(0.4, 0, 0.2, 1),
              opacity   0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-slide-left-leave-active,
.step-slide-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
/* forward: new slides in from right, old exits left */
.step-slide-left-enter-from { transform: translateX(48px);  opacity: 0; }
.step-slide-left-leave-to   { transform: translateX(-48px); opacity: 0; }
/* backward: new slides in from left, old exits right */
.step-slide-right-enter-from { transform: translateX(-48px); opacity: 0; }
.step-slide-right-leave-to   { transform: translateX(48px);  opacity: 0; }
@keyframes scan {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(280px); }
  100% { transform: translateY(0); }
}

/* ---------- face-slide modal (bottom-sheet on mobile, centered on sm+) ---------- */
.face-slide-enter-active {
  animation: face-slide-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.face-slide-leave-active {
  animation: face-slide-in 0.28s cubic-bezier(0.4, 0, 0.2, 1) reverse both;
}
@keyframes face-slide-in {
  0%  { transform: translateY(60px) scale(0.97); opacity: 0; }
  100%{ transform: translateY(0)    scale(1);    opacity: 1; }
}
@media (min-width: 640px) {
  @keyframes face-slide-in {
    0%  { transform: translateY(24px) scale(0.96); opacity: 0; }
    100%{ transform: translateY(0)    scale(1);    opacity: 1; }
  }
}

/* ---------- Verification frame ---------- */
.face-frame {
  position: absolute;
}
.corner {
  position: absolute;
  width: 26px;
  height: 26px;
  border: 3px solid #22d3ee;
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.7);
  pointer-events: none;
}
.corner-tl {
  top: -3px; left: -3px;
  border-right: none; border-bottom: none;
  border-top-left-radius: 14px;
}
.corner-tr {
  top: -3px; right: -3px;
  border-left: none; border-bottom: none;
  border-top-right-radius: 14px;
}
.corner-bl {
  bottom: -3px; left: -3px;
  border-right: none; border-top: none;
  border-bottom-left-radius: 14px;
}
.corner-br {
  bottom: -3px; right: -3px;
  border-left: none; border-top: none;
  border-bottom-right-radius: 14px;
}

/* ---------- Enrollment frame (violet) ---------- */
.corner-enroll {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 3px solid #a78bfa;
  box-shadow: 0 0 16px rgba(167, 139, 250, 0.75);
  pointer-events: none;
}
.corner-tl-enroll {
  top: -3px; left: -3px;
  border-right: none; border-bottom: none;
  border-top-left-radius: 14px;
}
.corner-tr-enroll {
  top: -3px; right: -3px;
  border-left: none; border-bottom: none;
  border-top-right-radius: 14px;
}
.corner-bl-enroll {
  bottom: -3px; left: -3px;
  border-right: none; border-top: none;
  border-bottom-left-radius: 14px;
}
.corner-br-enroll {
  bottom: -3px; right: -3px;
  border-left: none; border-top: none;
  border-bottom-right-radius: 14px;
}
.scan-line-enroll {
  position: absolute;
  left: 4%; right: 4%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.9) 50%, transparent 100%);
  box-shadow: 0 0 18px rgba(167,139,250,0.95), 0 0 36px rgba(167,139,250,0.5);
  border-radius: 2px;
  animation: face-scan 2.2s ease-in-out infinite;
  top: 8%;
}
.animate-pulse-ring-violet {
  animation: pulse-ring-violet 2.4s ease-out infinite;
}
@keyframes pulse-ring-violet {
  0%   { box-shadow: 0 0 0 0 rgba(167,139,250,0.45); }
  70%  { box-shadow: 0 0 0 14px rgba(167,139,250,0); }
  100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); }
}
.scan-line {
  position: absolute;
  left: 4%;
  right: 4%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.9) 50%, transparent 100%);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.95), 0 0 36px rgba(34, 211, 238, 0.5);
  border-radius: 2px;
  animation: face-scan 2.2s ease-in-out infinite;
  top: 8%;
}
@keyframes face-scan {
  0%   { top: 8%;  opacity: 0.7; }
  50%  { top: 92%; opacity: 1; }
  100% { top: 8%;  opacity: 0.7; }
}
.animate-pulse-ring {
  animation: pulse-ring 2.4s ease-out infinite;
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.45); }
  70%  { box-shadow: 0 0 0 14px rgba(34, 211, 238, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
}

/* CCS logo white glow pulse */
.ccs-glow-ring {
  background: radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 75%);
  animation: ccs-glow-pulse 2.8s ease-in-out infinite;
  will-change: transform, opacity;
}
.ccs-glow-ring-delay {
  animation-delay: 1.4s;
}
@keyframes ccs-glow-pulse {
  0%   { transform: scale(0.88); opacity: 0; }
  30%  { opacity: 1; }
  50%  { transform: scale(1.18); opacity: 0.85; }
  70%  { opacity: 1; }
  100% { transform: scale(0.88); opacity: 0; }
}

.burst-enter-active {
  animation: burst-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.burst-leave-active {
  animation: burst-in 0.3s reverse;
}
@keyframes burst-in {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
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

.modal-logo {
  animation: logo-pop 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}

@keyframes logo-pop {
  0% { transform: translateY(-6px) scale(0.85); opacity: 0; }
  60% { transform: translateY(2px) scale(1.05); opacity: 1; }
  100% { transform: translateY(0) scale(1); }
}

@keyframes golden-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes golden-pulse {
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 1;    }
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

/* Need Help modal scrollbar */
.help-modal-scroll::-webkit-scrollbar {
  width: 6px;
}
.help-modal-scroll::-webkit-scrollbar-track {
  background: #f3f4f6;
}
.help-modal-scroll::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 3px;
}
.help-modal-scroll::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
.help-modal-scroll {
  scrollbar-color: #9ca3af #f3f4f6;
  scrollbar-width: thin;
}

</style>
