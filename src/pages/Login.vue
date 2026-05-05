<template>
  <transition name="fade">
    <div v-if="showContactModal" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4" @click.self="showContactModal = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[92vh]">

          <!-- Header -->
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div class="w-5 h-5" style="-webkit-mask: url(/help.svg) center/contain no-repeat; mask: url(/help.svg) center/contain no-repeat; background-color: white;"></div>
              </div>
              <div>
                <h3 class="text-xl font-bold text-white leading-tight">Need Help?</h3>
                <p class="text-blue-100 text-xs mt-0.5">We're here to assist you</p>
              </div>
            </div>
            <button @click="showContactModal = false" class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-lg transition flex-shrink-0">&times;</button>
          </div>

          <!-- Drag handle on mobile -->
          <div class="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
          </div>

          <!-- Scrollable content -->
          <div class="px-5 pb-6 pt-4 space-y-4 overflow-y-auto help-modal-scroll">

            <!-- Contact cards -->
            <div class="grid grid-cols-3 gap-3">
              <div class="flex flex-col items-center text-center p-4 bg-blue-50 rounded-2xl">
                <div class="w-12 h-12 mb-3 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div class="w-6 h-6" style="-webkit-mask: url(/mail.svg) center/contain no-repeat; mask: url(/mail.svg) center/contain no-repeat; background-color: #6a2590;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-xs mb-1 leading-tight">Email Support</p>
                <p class="text-[10px] text-gray-500 leading-snug">ssaamjrmsu<br>@gmail.com</p>
                <p class="text-[10px] text-gray-400 mt-1">For inquiries</p>
              </div>

              <div class="flex flex-col items-center text-center p-4 bg-blue-50 rounded-2xl">
                <div class="w-12 h-12 mb-3 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div class="w-6 h-6" style="-webkit-mask: url(/home.svg) center/contain no-repeat; mask: url(/home.svg) center/contain no-repeat; background-color: #6a2590;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-xs mb-1 leading-tight">CCS Office</p>
                <p class="text-[10px] text-gray-500 leading-snug">College of<br>Computing</p>
                <p class="text-[10px] text-gray-400 mt-1">Office hours</p>
              </div>

              <div class="flex flex-col items-center text-center p-4 bg-blue-50 rounded-2xl cursor-pointer hover:bg-blue-100 active:scale-95 transition-all" @click="showDevelopersPopup = true; showContactModal = false">
                <div class="w-12 h-12 mb-3 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div class="w-6 h-6" style="-webkit-mask: url(/register_user.svg) center/contain no-repeat; mask: url(/register_user.svg) center/contain no-repeat; background-color: #6a2590;"></div>
                </div>
                <p class="font-semibold text-blue-900 text-xs mb-1 leading-tight">Meet the Team</p>
                <p class="text-[10px] text-gray-500 leading-snug">CCS<br>Creatives</p>
                <p class="text-[10px] text-blue-600 mt-1 font-semibold">View →</p>
              </div>
            </div>

            <!-- Quick Help -->
            <div class="bg-blue-50 rounded-2xl p-5">
              <p class="text-sm font-bold text-blue-900 mb-3">Quick Help</p>
              <ul class="space-y-3">
                <li class="flex items-start gap-2.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                  <span class="text-xs text-gray-600 leading-relaxed">Your default password is your Last Name (UPPERCASE)</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                  <span class="text-xs text-gray-600 leading-relaxed">Use "Forgot Password" if needed</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                  <span class="text-xs text-gray-600 leading-relaxed">Register your RFID at the CCS office</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                  <span class="text-xs text-gray-600 leading-relaxed">For profile issues, contact the Developers or visit the CCS office</span>
                </li>
              </ul>
            </div>

            <!-- Install SSAAM App -->
            <div class="rounded-2xl overflow-hidden border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <div class="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-green-100">
                <img src="/assets/app_icon.png" alt="SSAAM" class="w-10 h-10 rounded-xl shadow-sm flex-shrink-0 object-cover" />
                <div>
                  <p class="text-sm font-bold text-green-900 leading-tight">Install SSAAM App</p>
                  <p class="text-[10px] text-green-700 mt-0.5">Get the native experience on your phone</p>
                </div>
                <span class="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 border border-green-200 text-[10px] font-semibold text-green-700 flex-shrink-0">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.46 11.46 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>
                  Android only
                </span>
              </div>
              <div class="px-5 py-3.5 flex items-center justify-between gap-3">
                <p class="text-[11px] text-gray-500 leading-snug flex-1">Download the APK and install it directly on your Android device for a faster, offline-ready experience.</p>
                <a
                  href="https://www.mediafire.com/file/g3v17bvzzrot54q/ssaam.apk/file"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold shadow-sm hover:shadow-md hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"/></svg>
                  Download
                </a>
              </div>
            </div>

            <!-- Close button -->
            <button @click="showContactModal = false" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3.5 rounded-2xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-blue-200">
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
    <div v-if="showFaceModal" class="fixed inset-0 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center z-[130] p-0 sm:p-6" @click.self="pendingUserIsRestrictedRole() ? undefined : cancelFaceVerification()">
      <transition name="face-slide" appear>
        <div :class="['relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border max-h-[92dvh] sm:max-h-none overflow-y-auto overscroll-contain', faceEnrollMode ? 'bg-gradient-to-br from-slate-950 via-violet-950/40 to-slate-950 shadow-[0_0_80px_rgba(139,92,246,0.4)] border-violet-500/25' : 'bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 shadow-[0_0_80px_rgba(59,130,246,0.4)] border-blue-500/20']">

          <!-- Ambient corner glows -->
          <div :class="['absolute -top-20 -left-20 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-70', faceEnrollMode ? 'bg-violet-500/25' : 'bg-blue-500/25']"></div>
          <div :class="['absolute -bottom-20 -right-20 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-70', faceEnrollMode ? 'bg-purple-500/20' : 'bg-cyan-500/20']"></div>

          <!-- Drag handle (mobile only) -->
          <div class="sm:hidden flex justify-center pt-3 pb-0">
            <div class="w-10 h-1 rounded-full bg-white/15"></div>
          </div>

          <div class="relative px-5 sm:px-7 pt-4 pb-5 sm:pt-7 sm:pb-8">

            <!-- ── ENROLLMENT MODE header ─────────────────────────────────── -->
            <template v-if="faceEnrollMode">
              <!-- Step pills -->
              <div class="flex items-center justify-center gap-1.5 mb-5">
                <span class="w-7 h-1.5 rounded-full bg-violet-400/60"></span>
                <span class="w-7 h-1.5 rounded-full bg-violet-400/60"></span>
                <span class="relative w-7 h-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]">
                  <span class="absolute inset-0 rounded-full bg-violet-300 animate-pulse opacity-60"></span>
                </span>
              </div>

              <!-- Role badge -->
              <div class="flex items-center justify-center mb-4">
                <span :class="['px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border', pendingUser?.actualRole === 'treasurer' ? 'bg-teal-500/20 border-teal-400/40 text-teal-300' : 'bg-violet-500/20 border-violet-400/40 text-violet-300']">
                  {{ pendingUserRoleLabel() }} · Security Setup
                </span>
              </div>

              <!-- Icon -->
              <div class="flex items-center justify-center mb-4">
                <div class="relative">
                  <div class="absolute inset-0 rounded-full blur-2xl opacity-70 animate-pulse" :class="pendingUser?.actualRole === 'treasurer' ? 'bg-teal-500' : 'bg-violet-500'"></div>
                  <div :class="['relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl', pendingUser?.actualRole === 'treasurer' ? 'bg-gradient-to-br from-teal-500 to-cyan-500' : 'bg-gradient-to-br from-violet-500 to-purple-600']">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <h3 class="text-xl sm:text-2xl font-extrabold text-white text-center mb-1 tracking-tight">Face ID Required</h3>
              <p :class="['text-xs text-center mb-5 leading-relaxed', pendingUser?.actualRole === 'treasurer' ? 'text-teal-200/70' : 'text-violet-200/70']">
                As a <strong class="text-white/90">{{ pendingUserRoleLabel() }}</strong>, you must set up Face ID before accessing the dashboard. This is a one-time setup.
              </p>
            </template>

            <!-- ── VERIFICATION MODE header ────────────────────────────────── -->
            <template v-else>
              <!-- Step pills -->
              <div class="flex items-center justify-center gap-1.5 mb-5">
                <span class="w-7 h-1.5 rounded-full bg-cyan-400/70"></span>
                <span class="w-7 h-1.5 rounded-full bg-cyan-400/70"></span>
                <span class="relative w-7 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]">
                  <span class="absolute inset-0 rounded-full bg-cyan-300 animate-pulse opacity-60"></span>
                </span>
              </div>

              <!-- Icon -->
              <div class="flex items-center justify-center mb-4">
                <div class="relative">
                  <div class="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                  <div class="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8V6a2 2 0 012-2h2M3 16v2a2 2 0 002 2h2m10-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
                    </svg>
                  </div>
                </div>
              </div>

              <h3 class="text-xl sm:text-2xl font-extrabold text-white text-center mb-1 tracking-tight">Face Verification</h3>
              <p class="text-blue-200/70 text-xs text-center mb-5 leading-relaxed">Step 3 of 3 — Center your face inside the frame and hold still</p>
            </template>

            <!-- ── Error banner ────────────────────────────────────────────── -->
            <div v-if="faceError" class="mb-4 px-4 py-2.5 bg-red-900/40 border border-red-500/40 rounded-2xl text-red-300 text-xs text-center">
              {{ faceError }}
            </div>

            <!-- ── No-faces info (super-admin only bypass) ─────────────────── -->
            <div v-if="noFacesEnrolled" class="mb-4 px-4 py-3 bg-amber-900/25 border border-amber-500/25 rounded-2xl text-amber-200 text-xs text-center leading-relaxed">
              No Face ID enrolled for this account. You can continue now and enroll one from <strong>Settings → Face ID</strong>.
            </div>

            <!-- ── Camera frame ────────────────────────────────────────────── -->
            <div :class="['relative mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl', faceEnrollMode ? 'ring-2 ring-violet-500/40' : 'ring-1 ring-blue-500/20']" style="aspect-ratio:1/1; width:min(260px,100%); max-width:300px;">
              <video ref="faceVideoEl" autoplay muted playsinline class="absolute inset-0 w-full h-full object-cover -scale-x-100"></video>

              <!-- Loading spinner (camera starting or models loading) -->
              <div v-if="!faceCameraOn && !noFacesEnrolled" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 gap-3">
                <div :class="['w-10 h-10 rounded-full border-2 border-t-current animate-spin', faceEnrollMode ? 'border-violet-500/30 text-violet-400' : 'border-blue-400/30 text-blue-400']"></div>
                <p class="text-xs font-medium text-white/60">{{ faceLoadingModels ? 'Loading face models…' : 'Starting camera…' }}</p>
              </div>

              <!-- No-faces placeholder (super-admin without enrolled face) -->
              <div v-if="noFacesEnrolled" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 gap-3 px-6 text-center">
                <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <svg class="w-7 h-7 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8V6a2 2 0 012-2h2M3 16v2a2 2 0 002 2h2m10-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/>
                  </svg>
                </div>
                <p class="text-xs text-white/40 leading-relaxed">Face ID not enrolled<br>for this account</p>
              </div>

              <!-- ── Enrollment frame overlay ──────────────────────────────── -->
              <div v-if="faceCameraOn && faceEnrollMode" class="absolute inset-0 pointer-events-none">
                <div class="absolute inset-x-8 inset-y-7">
                  <span class="corner-enroll corner-tl-enroll"></span>
                  <span class="corner-enroll corner-tr-enroll"></span>
                  <span class="corner-enroll corner-bl-enroll"></span>
                  <span class="corner-enroll corner-br-enroll"></span>
                  <div class="absolute inset-0 rounded-[30%] border border-violet-400/25 animate-pulse-ring-violet"></div>
                  <!-- Enroll scan line -->
                  <div v-if="faceCapturing" class="scan-line-enroll"></div>
                </div>
                <!-- Enroll status pill -->
                <div class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md bg-violet-500/20 border border-violet-400/40 text-violet-200 flex items-center gap-1.5 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                  {{ faceCapturing ? 'Capturing…' : 'Position your face' }}
                </div>
              </div>

              <!-- ── Verification frame overlay ─────────────────────────────── -->
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
                      <div class="absolute inset-0 rounded-[28%] border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)]"></div>
                      <div class="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.9)]">
                        <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </div>
                  </transition>
                </div>
                <div :class="['absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md flex items-center gap-1.5 border whitespace-nowrap', faceStatusPillClass]">
                  <span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {{ faceStatusText }}
                </div>
              </div>
            </div>

            <!-- ── Enrollment status message ───────────────────────────────── -->
            <transition name="fade">
              <div v-if="faceEnrollMode && faceEnrollStatus"
                :class="['mt-4 px-4 py-2.5 rounded-2xl text-xs font-medium text-center leading-relaxed border', faceEnrollKind === 'error' ? 'bg-red-900/30 border-red-500/30 text-red-300' : faceEnrollKind === 'success' ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300' : 'bg-violet-900/20 border-violet-500/20 text-violet-200']">
                {{ faceEnrollStatus }}
              </div>
            </transition>

            <!-- ── Verification match-streak dots ─────────────────────────── -->
            <div v-if="faceCameraOn && !faceEnrollMode && !noFacesEnrolled" class="flex items-center justify-center gap-2 mt-5">
              <p class="text-[10px] text-white/30 mr-1">Match</p>
              <span v-for="n in 3" :key="n" :class="['h-2.5 rounded-full transition-all duration-300', faceMatchStreakDisplay >= n ? 'w-8 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]' : 'w-2.5 bg-blue-500/25']"></span>
            </div>

            <!-- ── Enrollment tips ────────────────────────────────────────── -->
            <div v-if="faceEnrollMode && !faceCapturing && !faceEnrollStatus" class="mt-4 grid grid-cols-3 gap-2">
              <div v-for="tip in ['Good lighting','Face forward','No glasses glare']" :key="tip" class="flex flex-col items-center gap-1 px-2 py-2 rounded-xl bg-white/4 border border-white/8 text-center">
                <p class="text-[10px] text-white/40 leading-snug">{{ tip }}</p>
              </div>
            </div>

            <!-- ── Buttons ────────────────────────────────────────────────── -->
            <div class="flex gap-3 mt-6">
              <!-- Cancel hidden for restricted roles in enrollment — they must complete setup -->
              <button
                v-if="!faceEnrollMode || !pendingUserIsRestrictedRole()"
                @click="cancelFaceVerification"
                class="flex-none px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-2xl text-sm font-medium transition-all active:scale-95"
              >
                Cancel
              </button>

              <!-- Enrollment CTA -->
              <button
                v-if="faceEnrollMode"
                @click="captureAndEnrollFace"
                :disabled="!faceCameraOn || faceCapturing || faceEnrollSaving"
                :class="['flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2', pendingUser?.actualRole === 'treasurer' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:shadow-[0_0_24px_rgba(20,184,166,0.6)]' : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-[0_0_24px_rgba(139,92,246,0.6)]', 'text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:scale-[1.02]']"
              >
                <svg v-if="faceCapturing || faceEnrollSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                {{ faceEnrollSaving ? 'Saving…' : faceCapturing ? 'Detecting…' : 'Capture & Enroll' }}
              </button>

              <!-- Super-admin bypass when no faces enrolled -->
              <button v-else-if="noFacesEnrolled" @click="completeLoginFromFace" class="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl text-sm font-bold transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.6)] hover:scale-[1.02] active:scale-95">
                Continue Anyway
              </button>

              <!-- Verification retry -->
              <button v-else @click="manualRetryFace" :disabled="!faceCameraOn || faceMatching || faceVerified" class="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl text-sm font-bold transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.6)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none">
                {{ faceVerified ? '✓ Verified' : faceMatching ? 'Scanning…' : 'Retry' }}
              </button>
            </div>

          </div>
        </div>
      </transition>
    </div>
  </transition>

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
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
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
      <ParticleBackground />
      <div class="relative z-10 text-center">
        <div class="mb-4">
          <div class="relative w-40 h-40 mx-auto">
            <!-- Soft outer ambient golden aura — pulses slowly -->
            <div class="absolute -inset-6 rounded-full pointer-events-none z-0" style="background: radial-gradient(ellipse at center, rgba(255,200,50,0.55) 0%, rgba(255,160,0,0.28) 45%, transparent 72%); filter: blur(10px); animation: golden-pulse 3s ease-in-out infinite;"></div>
            <!-- Masked container — everything inside is clipped to the CCS logo silhouette -->
            <div class="absolute inset-0 z-10" style="mask: url(/ccs.png) center/contain no-repeat; -webkit-mask: url(/ccs.png) center/contain no-repeat; mask-mode: alpha; -webkit-mask-mode: alpha;">
              <!-- Base logo image -->
              <img :src="jrmsuLogo" alt="JRMSU CCS Logo" class="w-full h-full object-contain relative z-10" />
              <!-- Golden light: spins slowly + pulses -->
              <div class="absolute inset-0 pointer-events-none z-20" style="animation: golden-spin 8s linear infinite, golden-pulse 3s ease-in-out infinite; background: conic-gradient(from 0deg, transparent 0%, rgba(255,200,0,0) 32%, rgba(255,175,0,0.55) 50%, rgba(255,230,60,1) 62%, rgba(255,175,0,0.55) 74%, transparent 100%); mix-blend-mode: screen;"></div>
              <!-- Shimmer sweep blended over the golden effect -->
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-sweep z-30 pointer-events-none" style="mix-blend-mode: overlay;"></div>
            </div>
          </div>
        </div>
        <h1 class="text-6xl font-extrabold italic mb-2">SSAAM</h1>
        <p class="text-sm">Student School Activities Attendance Monitoring</p>
      </div>
      <div class="absolute bottom-4 left-4 right-4 text-center text-xs text-white opacity-75">
        Copyright © 2026 Powered by CCS-Creatives Committee. Chairperson: Sheen Lee
      </div>
    </div>

    <div class="w-3/5 flex items-center justify-center p-8 bg-gray-50" style="border-radius: 2rem 0 0 2rem; overflow: hidden;">
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
              <img @click="togglePasswordVisibility" :src="showPassword ? '/visibility_on.svg' : '/visibility_off.svg'" alt="Toggle password" :class="['absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 cursor-pointer hover:opacity-70 opacity-100', { 'animate-wipe': visibilityAnimating }]" style="pointer-events: auto; z-index: 10;" />
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

  <div class="mobile-bg-full md:hidden min-h-screen flex flex-col w-full fixed inset-0 overflow-x-hidden overflow-y-auto" style="scrollbar-width:none;-ms-overflow-style:none;">
    <ParticleBackground />
    <div class="text-center text-white pt-12 pb-8 px-4 relative z-10">
      <div class="relative w-32 h-32 mx-auto mb-4">
        <!-- Soft outer ambient golden aura — pulses slowly -->
        <div class="absolute -inset-6 rounded-full pointer-events-none z-0" style="background: radial-gradient(ellipse at center, rgba(255,200,50,0.55) 0%, rgba(255,160,0,0.28) 45%, transparent 72%); filter: blur(10px); animation: golden-pulse 3s ease-in-out infinite;"></div>
        <!-- Masked container — everything inside is clipped to the CCS logo silhouette -->
        <div class="absolute inset-0 z-10" style="mask: url(/ccs.png) center/contain no-repeat; -webkit-mask: url(/ccs.png) center/contain no-repeat; mask-mode: alpha; -webkit-mask-mode: alpha;">
          <!-- Base logo image -->
          <img src="/src/assets/ccs-logo.png" alt="JRMSU CCS Logo" class="w-full h-full object-contain relative z-10" />
          <!-- Golden light: spins slowly + pulses -->
          <div class="absolute inset-0 pointer-events-none z-20" style="animation: golden-spin 8s linear infinite, golden-pulse 3s ease-in-out infinite; background: conic-gradient(from 0deg, transparent 0%, rgba(255,200,0,0) 32%, rgba(255,175,0,0.55) 50%, rgba(255,230,60,1) 62%, rgba(255,175,0,0.55) 74%, transparent 100%); mix-blend-mode: screen;"></div>
          <!-- Shimmer sweep blended over the golden effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-sweep z-30 pointer-events-none" style="mix-blend-mode: overlay;"></div>
        </div>
      </div>
      <h1 class="text-6xl font-extrabold italic mb-2">SSAAM</h1>
      <p class="text-lg mb-8">Let's Get Started!</p>
      <p class="text-sm opacity-90">You are a few clicks away from your profile.</p>
      <p class="text-sm opacity-90">Input your JRMSU Student ID to continue.</p>
    </div>

    <div class="flex-1 bg-white rounded-t-3xl shadow-2xl px-6 py-8 relative z-10">
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
            <img @click="togglePasswordVisibility" :src="showPassword ? '/visibility_on.svg' : '/visibility_off.svg'" alt="Toggle password" :class="['absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 cursor-pointer hover:opacity-70 opacity-100', { 'animate-wipe': visibilityAnimating }]" style="pointer-events: auto; z-index: 10;" />
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
          Copyright © 2026 Powered by CCS-Creatives Committee. Chairperson: Sheen Lee
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

// Complete the login after the admin verification code passes.
// Persists the pending user to localStorage and triggers the navigation.
function completeLogin() {
  if (!pendingUser) return
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
  syncServerTime(buildAPIUrl(''))

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

  // Ensure the client clock is synced with the server before sending any
  // timestamp-protected request. Cap at 3 s so slow networks don't stall login.
  try {
    await Promise.race([
      syncServerTime(buildAPIUrl('')),
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
          const d = await resp.json()
          console.log(`API STUDENT LOGIN RESPONSE (${college}):`, d)

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
            syncServerTime(buildAPIUrl('')),
            new Promise(resolve => setTimeout(resolve, 3000))
          ])
        } catch (_) { /* best-effort */ }
        attempt = await tryCollegeLoop()
      }

      finalResponse = attempt.response
      finalData = attempt.data
      detectedCollege = attempt.college

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
      console.log("Navigating to dashboard...");
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
  box-shadow: inset -18px 0 40px rgba(0,0,0,0.20), 8px 0 32px rgba(61,17,84,0.25);
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
  background-image: linear-gradient(90deg, #3d1154 0%, #7d2fa3 100%);
}
.modal-primary:hover { box-shadow: 0 12px 30px rgba(61,17,84,0.18); }
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

</style>
