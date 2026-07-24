<template>
  <transition name="fade">
    <div v-if="showDevelopersPopup" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showDevelopersPopup = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          <!-- Header -->
          <div class="px-8 pt-7 pb-1 text-center relative">
            <button @click="showDevelopersPopup = false"
              class="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition text-xl leading-none">
              &times;
            </button>
            <h3 class="text-2xl font-bold text-gray-900">Meet our team</h3>
            <p class="text-gray-500 text-sm mt-1">CCS – Creatives Committee</p>
          </div>

          <!-- Carousel -->
          <div class="relative px-6 pt-5 pb-4 select-none">
            <div class="relative overflow-hidden" style="height: 240px;">
              <div v-for="(dev, i) in developers" :key="dev.name"
                :style="getDevStyle(i)"
                @click="handleDevClick(i)">
                <img :src="dev.image" :alt="dev.name"
                  class="w-full h-full object-cover object-top" />
                <!-- Active card overlay -->
                <div v-if="i === devCarouselIdx"
                  class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-10">
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
            <div class="flex justify-center gap-2 mt-4">
              <button v-for="(_, i) in developers" :key="i" @click="devCarouselIdx = i"
                :class="['rounded-full transition-all duration-300', i === devCarouselIdx ? 'w-5 h-2 bg-gray-800' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400']" />
            </div>
          </div>

          <!-- Footer -->
          <div class="px-8 pb-6 text-center">
            <p class="text-xs text-gray-400">CCS – Creatives Committee</p>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <div v-if="isRegistering" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
      <svg class="animate-spin h-16 w-16 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-xl font-semibold text-blue-900">{{ loadingMessage }}</p>
      <p class="text-sm text-gray-600 mt-2">{{ loadingSubMessage }}</p>
    </div>
  </div>

  <transition name="fade">
    <div v-if="showNotification" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform transition-all">
          <div class="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-blue-900 mb-2">Success!</h3>
          <p class="text-gray-600">{{ notificationMessage }}</p>
          <p class="text-sm text-gray-500 mt-4">Redirecting to login...</p>
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

  <div v-if="registerDisabled" class="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 py-3 px-4 text-center z-30 shadow-md">
    <div class="flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span class="font-medium text-sm">{{ registerDisabledMessage || 'Registration is currently disabled.' }}</span>
    </div>
  </div>

  <div class="hidden md:flex min-h-screen relative" style="background: radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%), linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.55) 100%), url('/jrmsu-landscape.jpg') center 35% / cover no-repeat;">
    <div class="desktop-bg-panel relative flex-shrink-0" style="width:calc(40% + 60px);">
      <ParticleBackground />
      <!-- CCS logo with glow rings -->
      <div class="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div class="relative flex items-center justify-center">
          <div class="absolute w-64 h-64 rounded-full ccs-glow-ring"></div>
          <div class="absolute w-56 h-56 rounded-full ccs-glow-ring ccs-glow-ring-delay"></div>
          <img :src="'/ccs.png'" alt="CCS Logo" class="relative w-56 h-56 object-contain opacity-90 drop-shadow-2xl" />
        </div>
      </div>
      <!-- Top-left SSAAM branding -->
      <div class="absolute top-8 left-8 z-20 flex items-center gap-2.5">
        <img :src="'/img/ssaam_icon.png'" alt="SSAAM" class="w-9 h-9 rounded-xl object-cover shadow-md" />
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

    <div class="flex-1 flex items-center justify-center bg-white">
      <div class="w-full max-w-sm px-6">
        <div class="mb-8">
          <h2 class="text-4xl font-bold text-gray-900 leading-tight mb-3">Create account</h2>
          <p class="text-gray-400 text-sm">Fill in your details to get started</p>
        </div>

          <form @submit.prevent="handleNext" novalidate class="space-y-4">

            <div v-if="currentStep === 1" class="space-y-3 step-animate">

              <!-- ── ARMS Verification panel (desktop Step 1) ── -->
              <div v-if="!armsVerified" class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
                <div class="flex items-center gap-2">
                  <img :src="'/jrmsu.svg'" alt="JRMSU" class="w-5 h-5 object-contain" />
                  <p class="text-xs font-semibold text-blue-800">Sign up with JRMSU ARMS Portal</p>
                </div>
                <p class="text-xs text-blue-600 leading-relaxed">Verify your enrollment to auto-fill your details. Enter your Student ID and ARMS portal password. Forgot your password? Visit the <a href="https://jrmsu-arms.online/student/login.php" target="_blank" rel="noopener noreferrer" class="font-medium underline underline-offset-2 hover:text-blue-900 transition-colors">JRMSU-ARMS</a> portal.</p>
                <transition name="arms-btn">
                  <div v-if="!showArmsInput">
                    <button type="button" @click="showArmsInput = true; armsError = ''"
                      class="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Verify with ARMS
                    </button>
                  </div>
                </transition>
                <transition name="arms-expand">
                  <div v-if="showArmsInput" class="space-y-2 overflow-hidden">
                    <input v-model="armsStudentIdInput" @input="armsStudentIdInput = armsStudentIdInput.toUpperCase().replace(/[^0-9A-Z-]/g,'')" type="text" placeholder="Student ID (e.g. 25-A-00000)" maxlength="10"
                      class="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-800 transition" />
                    <div class="relative">
                      <input v-model="armsPassword" :type="armsShowPw ? 'text' : 'password'" placeholder="ARMS portal password"
                        class="w-full px-3 py-2 pr-10 border border-blue-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-800 transition"
                        @keydown.enter.prevent="verifyWithARMS" />
                      <button type="button" @click="armsShowPw = !armsShowPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg v-if="armsShowPw" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                    </div>
                    <transition name="arms-error">
                      <p v-if="armsError" class="text-xs text-red-600">{{ armsError }}</p>
                    </transition>
                    <div class="flex gap-2">
                      <button type="button" @click="showArmsInput = false; armsPassword = ''; armsError = ''"
                        class="flex-1 py-2 px-3 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancel</button>
                      <button type="button" @click="verifyWithARMS" :disabled="armsLoading"
                        class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition flex items-center justify-center gap-1">
                        <svg v-if="armsLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                        {{ armsLoading ? 'Verifying...' : 'Verify' }}
                      </button>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- ARMS verified badge (desktop Step 1) -->
              <div v-if="armsVerified" class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-green-800">ARMS Verified ✓ — {{ armsData?.studentId }}</p>
                  <p class="text-xs text-green-700 mt-0.5 truncate">{{ armsData?.studentName }} · {{ armsData?.programCode }} · {{ armsData?.yearLevel }}</p>
                  <button type="button" @click="resetArms()" class="text-xs text-green-600 underline mt-1 hover:text-green-800">Use a different account</button>
                </div>
              </div>

              <!-- Name fields — only shown after ARMS auto-fills them -->
              <template v-if="armsVerified">
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name</label>
                <div class="relative">
                  <input ref="firstNameInput" v-model="formData.first_name" type="text" placeholder="e.g. JUAN"
                    class="w-full px-4 py-3 border border-green-300 rounded-xl outline-none text-sm text-gray-800 bg-green-50 transition" readonly required />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Middle Name <span class="normal-case font-normal text-gray-400">(optional)</span></label>
                <div class="relative">
                  <input ref="middleNameInput" v-model="formData.middle_name" type="text" placeholder="e.g. DELA"
                    class="w-full px-4 py-3 border border-green-300 rounded-xl outline-none text-sm text-gray-800 bg-green-50 transition" readonly />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Name</label>
                <div class="relative">
                  <input ref="lastNameInput" v-model="formData.last_name" type="text" placeholder="e.g. CRUZ"
                    class="w-full px-4 py-3 border border-green-300 rounded-xl outline-none text-sm text-gray-800 bg-green-50 transition" readonly required />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Suffix <span class="normal-case font-normal text-gray-400">(optional)</span></label>
                <div class="relative">
                  <input v-model="formData.suffix" type="text"
                    class="w-full px-4 py-3 border border-green-300 rounded-xl outline-none text-sm text-gray-800 bg-green-50 transition" readonly />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
                </div>
              </div>
              </template>
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <input ref="emailInput" v-model="formData.email" @keydown.enter.prevent="() => handleNext()" type="email" placeholder="e.g. juan@gmail.com"
                  pattern="[a-zA-Z0-9._%+\-]+@gmail\.com"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none text-sm text-gray-800 placeholder-gray-300 bg-white transition" required />
                <p class="text-xs text-gray-400 flex items-center gap-1 pl-1">
                  <svg class="w-3 h-3 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>
                  Only Gmail addresses are accepted.
                </p>
              </div>
              <div class="flex items-center justify-center pt-2">
                <div class="flex space-x-2">
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
                  <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
                  <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
                </div>
              </div>
              <button type="submit" class="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm shadow-sm">
                Next →
              </button>
            </div>

            <div v-if="currentStep === 2" class="space-y-3 step-animate">
              <!-- Student ID -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</label>
                <div class="relative">
                  <input v-model="formData.student_id" @input="formData.student_id = formatStudentId(formData.student_id)" type="text" placeholder="e.g. 25-A-00000" maxlength="10"
                    :class="['w-full px-4 py-3 border rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-gray-800 placeholder-gray-300 transition pr-10',
                      armsVerified ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200']"
                    :readonly="armsVerified" required />
                  <span v-if="armsVerified" class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  </span>
                </div>
              </div>

              <!-- ARMS verified summary in Step 2 (desktop) -->
              <div v-if="armsVerified" class="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 flex items-center gap-3">
                <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-xs text-green-700 flex-1 truncate">ARMS Verified — <span class="font-semibold">{{ armsData?.studentName }}</span></p>
                <button type="button" @click="resetArms(); currentStep = 1" class="text-xs text-green-600 underline hover:text-green-800 flex-shrink-0">Change</button>
              </div>

              <!-- Year Level (auto-filled or manual) -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Year Level</label>
                <div class="relative" ref="yearDropdownRef">
                  <button type="button" @click="toggleYearMenu"
                    :class="['w-full text-left px-4 py-3 border rounded-xl flex items-center justify-between text-sm bg-white transition outline-none',
                      showYearMenu ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200',
                      formData.year_level ? 'text-gray-800' : 'text-gray-400']">
                    <span>{{ formData.year_level || 'Select Year Level' }}</span>
                    <svg :class="['w-4 h-4 text-gray-400 transition-transform duration-200', showYearMenu ? 'rotate-180' : '']"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <transition name="dropdown-pop">
                    <div v-if="showYearMenu"
                      :class="['absolute z-30 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden',
                        showYearMenuAbove ? 'bottom-full mb-2' : 'top-full mt-2']">
                      <ul class="py-1">
                        <li v-for="yr in ['1st Year','2nd Year','3rd Year','4th Year']" :key="yr"
                          @click="chooseYearLevel(yr)"
                          :class="['flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition',
                            formData.year_level === yr ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50']">
                          <span>{{ yr }}</span>
                          <svg v-if="formData.year_level === yr" class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </li>
                      </ul>
                    </div>
                  </transition>
                </div>
              </div>

              <!-- Program -->
              <div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Program</label>
                  <div class="relative" ref="programDropdownDesktopRef">
                  <button type="button" @click="toggleProgramMenu('desktop')" class="w-full text-left px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none flex items-center justify-between text-sm bg-white transition">
                    <span class="truncate">
                      <template v-if="selectedProgramItem">{{ selectedProgramItem.shortName }} - {{ selectedProgramItem.fullName }}</template>
                      <template v-else><span class="text-gray-400">Select Program</span></template>
                    </span>
                    <img :src="'/arrow_down.svg'" alt="Dropdown" class="w-4 h-4 opacity-65 flex-shrink-0" />
                  </button>
                  <div v-if="showProgramMenu" :class="showMenuAboveDesktop ? 'absolute z-30 bottom-full mb-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg' : 'absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg'">
                    <div class="px-2 pt-2 pb-1">
                      <input v-model="programSearch" type="text" placeholder="Search program..." @click.stop class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none" />
                    </div>
                    <ul class="max-h-48 overflow-auto">
                      <li v-for="p in filteredPrograms" :key="p.shortName" @click="chooseProgram(p)" class="flex items-start gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer">
                        <img :src="p.departmentLogo" :alt="p.departmentLabel" class="w-8 h-8 object-contain rounded bg-white flex-shrink-0" />
                        <div class="min-w-0">
                          <div class="text-sm font-medium text-gray-800">{{ p.shortName }}</div>
                          <div class="text-xs text-gray-500 whitespace-normal break-words">{{ p.fullName }}</div>
                          <div class="text-xs text-gray-400 mt-1">{{ p.departmentLabel }}</div>
                        </div>
                      </li>
                      <li v-if="filteredPrograms.length === 0" class="px-3 py-4 text-sm text-gray-400 text-center">No programs found</li>
                    </ul>
                  </div>
                </div>
                </div>
                <div v-if="programDepartment" class="mt-2 flex items-center gap-2 pl-2">
                  <img :src="programDepartment.departmentLogo" :alt="programDepartment.departmentLabel" class="w-5 h-5 object-contain rounded" />
                  <span class="text-xs text-gray-600">Dept: <strong class="text-blue-700">{{ programDepartment.departmentName }} ({{ programDepartment.departmentLabel }})</strong></span>
                </div>
              </div>
              <div class="flex items-center justify-center pt-2">
                <div class="flex space-x-2">
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
                  <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
                </div>
              </div>
              <div class="flex gap-3">
                <button type="button" @click="currentStep--" class="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm">
                  ← Back
                </button>
                <button type="submit" class="flex-1 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm shadow-sm">
                  Next →
                </button>
              </div>
            </div>

            <div v-if="currentStep === 3" class="space-y-4 step-animate">
              <div class="text-center">
                <div class="w-40 h-40 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center overflow-hidden">
                  <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
                  <div v-else class="flex flex-col items-center justify-center">
                    <div class="w-20 h-20 rounded-full bg-gray-300 mb-3"></div>
                    <div class="w-28 h-16 bg-gray-400 rounded-t-full"></div>
                  </div>
                </div>
                <label class="block text-sm font-medium text-gray-600 mb-4">Upload Profile Photo</label>
                <div class="relative">
                  <input type="file" @change="handleImageUpload" accept="image/*" class="hidden" id="file-upload" />
                  <label for="file-upload" class="cursor-pointer inline-flex items-center justify-center px-8 py-3 bg-green-50 rounded-full text-sm font-medium text-gray-600 hover:bg-green-100 transition duration-300">
                    <img :src="'/change_photo.svg'" alt="Upload" class="w-5 h-5 mr-2 opacity-60" />{{ imagePreview ? 'Change Photo' : 'Choose Photo' }}
                  </label>
                </div>
              </div>
              <div class="flex items-center justify-center pt-2">
                <div class="flex space-x-2">
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
                </div>
              </div>
              <div class="flex gap-3">
                <button type="button" @click="currentStep--" class="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm">
                  ← Back
                </button>
                <button type="submit" class="flex-1 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm shadow-sm">
                  Next →
                </button>
              </div>
            </div>

            <div v-if="currentStep === 3.5" class="space-y-4 step-animate">
              <div class="text-center mb-4">
                <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 class="text-lg font-semibold text-blue-900 mb-2">Review Your Information</h3>
                <p class="text-sm text-gray-600">Please verify all details are correct before proceeding.</p>
              </div>
              
              <div class="bg-gray-50 rounded-xl p-4 space-y-3">
                <div class="flex flex-col items-center text-center gap-2">
                  <div class="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                  </div>
                  <div>
                    <p class="font-bold text-blue-900">{{ formData.first_name }} {{ formData.middle_name }} {{ formData.last_name }} {{ formData.suffix }}</p>
                    <p class="text-sm text-gray-600">{{ formData.student_id }}</p>
                  </div>
                </div>
                
                <div class="border-t border-gray-200 pt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p class="text-gray-500 text-xs">Email</p>
                    <p class="font-medium text-gray-800 break-all text-xs">{{ formData.email }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500 text-xs">Program</p>
                    <p class="font-medium text-gray-800">{{ formData.program }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500 text-xs">Year Level</p>
                    <p class="font-medium text-gray-800">{{ formData.year_level }}</p>
                  </div>
                  <div>
                  </div>
                </div>
              </div>
              
              <div v-if="reviewCountdown > 0" class="text-center">
                <div class="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                  <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  <span class="font-medium text-sm">Please review... {{ reviewCountdown }}s</span>
                </div>
              </div>
              
              <div class="flex items-center justify-center pt-2">
                <div class="flex space-x-2">
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
                </div>
              </div>
              <div class="flex gap-3">
                <button type="button" @click="currentStep = 3" class="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm">
                  ← Back
                </button>
                <button type="submit" :disabled="reviewCountdown > 0" :class="['flex-1 py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm shadow-sm', reviewCountdown > 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white']">
                  {{ reviewCountdown > 0 ? `Wait ${reviewCountdown}s` : 'Confirm →' }}
                </button>
              </div>
            </div>

            <div v-if="currentStep === 4" class="space-y-4 step-animate">
              <div class="text-center mb-4">
                <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <img :src="'/mail-gradient.svg'" alt="Email" class="w-8 h-8" />
                </div>
                <h3 class="text-lg font-semibold text-blue-900 mb-2">Verify Your Email</h3>
                <p class="text-sm text-gray-600">We've sent a 6-digit verification code to:</p>
                <p class="text-sm font-medium text-blue-600 mt-1">{{ formData.email }}</p>
              </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2 text-center">Enter Verification Code</label>
                <p class="text-xs text-blue-600 mb-3 text-center font-medium">You can copy the code from your email and paste it here</p>
                <div class="flex justify-center gap-2">
                  <input 
                    v-for="(digit, index) in verificationCode" 
                    :key="index"
                    v-model="verificationCode[index]"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="1"
                    @input="handleCodeInput(index, $event)"
                    @keydown="handleCodeKeydown(index, $event)"
                    @paste="handleCodePaste($event)"
                    :ref="el => codeInputs[index] = el"
                    class="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>
                <p class="text-xs text-gray-500 mt-3 text-center">Code expires in 30 minutes</p>
              </div>
              
              <div class="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-4 mt-4">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <p class="font-bold text-yellow-900 text-sm">Important: Your Temporary Password</p>
                    <p class="text-yellow-800 text-xs mt-1">After your account is approved, your temporary password will be your <span class="font-bold bg-yellow-200 px-1 rounded">LAST NAME</span> (in uppercase). You can change it anytime from your Dashboard settings.</p>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center justify-center pt-2">
                <button type="button" @click="resendCode" :disabled="resendCooldown > 0" class="text-sm text-blue-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                  {{ resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code' }}
                </button>
              </div>
              <div class="flex items-center justify-center pt-2">
                <div class="flex space-x-2">
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <div class="w-10 h-1 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div class="flex gap-3">
                <button type="button" @click="currentStep = 3.5" class="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm">
                  ← Back
                </button>
                <button type="submit" class="flex-1 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition duration-200 flex items-center justify-center text-sm shadow-sm">
                  Sign Up →
                </button>
              </div>
            </div>
          </form>

          <p class="text-center text-sm text-gray-500 mt-5">
            Already have an account?
            <button @click="goToLogin" class="text-indigo-500 hover:text-indigo-700 font-semibold ml-1 transition">Log In</button>
          </p>
          <div class="mt-6 text-center text-xs text-gray-400">
            Powered by <button @click="showDevelopersPopup = true" class="text-blue-400 font-medium hover:text-blue-600 cursor-pointer transition">CCS - Creatives Committee</button>
          </div>
      </div>
    </div>
  </div>

  <div class="mobile-bg-full md:hidden min-h-screen flex flex-col w-full fixed inset-0 overflow-x-hidden overflow-y-auto" style="scrollbar-width:none;-ms-overflow-style:none;">
    <ParticleBackground />
    <div class="text-center text-white pt-12 pb-8 px-4 relative z-10">
      <div class="relative w-32 h-32 mx-auto mb-4">
        <!-- Ambient golden aura — pulses slowly -->
        <div class="absolute -inset-6 rounded-full pointer-events-none z-0" style="background: radial-gradient(ellipse at center, rgba(255,200,50,0.55) 0%, rgba(255,160,0,0.28) 45%, transparent 72%); filter: blur(10px); animation: golden-pulse 3s ease-in-out infinite;"></div>
        <!-- Masked container clipped to CCS logo silhouette -->
        <div class="absolute inset-0 z-10" style="mask: url(/ccs.png) center/contain no-repeat; -webkit-mask: url(/ccs.png) center/contain no-repeat; mask-mode: alpha; -webkit-mask-mode: alpha;">
          <img :src="'/src/assets/ccs-logo.png'" alt="JRMSU CCS Logo" class="w-full h-full object-contain relative z-10" />
          <!-- Golden light: spins slowly + pulses -->
          <div class="absolute inset-0 pointer-events-none z-20" style="animation: golden-spin 8s linear infinite, golden-pulse 3s ease-in-out infinite; background: conic-gradient(from 0deg, transparent 0%, rgba(255,200,0,0) 32%, rgba(255,175,0,0.55) 50%, rgba(255,230,60,1) 62%, rgba(255,175,0,0.55) 74%, transparent 100%); mix-blend-mode: screen;"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-sweep z-30 pointer-events-none" style="mix-blend-mode: overlay;"></div>
        </div>
      </div>
      <div v-if="currentStep !== 3 && currentStep !== 3.5 && currentStep !== 4" class="hidden sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg" :class="registrationIconGradientClass">
        <img :src="'/user_plus.svg'" alt="Register" class="w-10 h-10" style="filter: brightness(0) invert(1);" />
      </div>
      <h1 class="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Let's Create</h1>
      <h2 class="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Your Profile!</h2>
      <p class="text-xs sm:text-sm opacity-90 italic mb-3 sm:mb-4">Please provide your basic information.</p>
      <p class="text-sm sm:text-base font-semibold">
        {{ stepTitle }}
      </p>
    </div>

    <div class="flex-1 bg-white rounded-t-3xl shadow-2xl px-6 py-8 relative z-10">
      <div class="max-w-md mx-auto">

        <div class="mb-5 text-center">
          <h2 class="text-2xl font-bold text-blue-700 mb-1">Create Your Account</h2>
          <p class="text-gray-500 text-xs">{{ stepTitle }}</p>
        </div>

        <div class="text-center mb-4">
          <h3 class="text-xl font-bold text-gray-800">Sign Up</h3>
        </div>

        <form @submit.prevent="handleNext" novalidate class="space-y-4">

          <div v-if="currentStep === 1" class="space-y-3 step-animate">

              <!-- ── ARMS Verification panel (mobile Step 1) ── -->
              <div v-if="!armsVerified" class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
                <div class="flex items-center gap-2">
                  <img :src="'/jrmsu.svg'" alt="JRMSU" class="w-5 h-5 object-contain" />
                  <p class="text-xs font-semibold text-blue-800">Sign up with JRMSU ARMS Portal</p>
                </div>
                <p class="text-xs text-blue-600 leading-relaxed">Verify your enrollment to auto-fill your details. Forgot your password? Visit the <a href="https://jrmsu-arms.online/student/login.php" target="_blank" rel="noopener noreferrer" class="font-medium underline underline-offset-2 hover:text-blue-900 transition-colors">JRMSU-ARMS</a> portal.</p>
                <transition name="arms-btn">
                  <div v-if="!showArmsInput">
                    <button type="button" @click="showArmsInput = true; armsError = ''"
                      class="w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Verify with ARMS
                    </button>
                  </div>
                </transition>
                <transition name="arms-expand">
                  <div v-if="showArmsInput" class="space-y-2 overflow-hidden">
                    <input v-model="armsStudentIdInput" @input="armsStudentIdInput = armsStudentIdInput.toUpperCase().replace(/[^0-9A-Z-]/g,'')" type="text" placeholder="Student ID (e.g. 25-A-00000)" maxlength="10"
                      class="w-full px-4 py-2.5 border border-blue-200 rounded-full text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-800 transition" />
                    <div class="relative">
                      <input v-model="armsPassword" :type="armsShowPw ? 'text' : 'password'" placeholder="ARMS portal password"
                        class="w-full px-4 py-2.5 pr-10 border border-blue-200 rounded-full text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-800 transition"
                        @keydown.enter.prevent="verifyWithARMS" />
                      <button type="button" @click="armsShowPw = !armsShowPw" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg v-if="armsShowPw" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                    </div>
                    <transition name="arms-error">
                      <p v-if="armsError" class="text-xs text-red-600 px-1">{{ armsError }}</p>
                    </transition>
                    <div class="flex gap-2">
                      <button type="button" @click="showArmsInput = false; armsPassword = ''; armsError = ''"
                        class="flex-1 py-2 px-3 rounded-full border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">Cancel</button>
                      <button type="button" @click="verifyWithARMS" :disabled="armsLoading"
                        class="flex-1 py-2 px-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition flex items-center justify-center gap-1">
                        <svg v-if="armsLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                        {{ armsLoading ? 'Verifying...' : 'Verify' }}
                      </button>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- ARMS verified badge (mobile Step 1) -->
              <div v-if="armsVerified" class="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-green-800">ARMS Verified ✓ — {{ armsData?.studentId }}</p>
                  <p class="text-xs text-green-700 mt-0.5 truncate">{{ armsData?.studentName }} · {{ armsData?.programCode }} · {{ armsData?.yearLevel }}</p>
                  <button type="button" @click="resetArms()" class="text-xs text-green-600 underline mt-1 hover:text-green-800">Use a different account</button>
                </div>
              </div>

            <!-- Name fields — only shown after ARMS auto-fills them -->
            <template v-if="armsVerified">
            <div class="relative">
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/user.svg) center/contain no-repeat; mask: url(/user.svg) center/contain no-repeat; background-color: currentColor;"></div>
              <input v-model="formData.first_name" type="text" placeholder="First Name" class="w-full pl-11 pr-10 py-3 bg-green-100 border-0 rounded-full outline-none text-sm text-gray-700 placeholder-gray-400" readonly required />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
            </div>
            <div class="relative">
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/user.svg) center/contain no-repeat; mask: url(/user.svg) center/contain no-repeat; background-color: currentColor;"></div>
              <input v-model="formData.middle_name" type="text" placeholder="Middle Name (optional)" class="w-full pl-11 pr-10 py-3 bg-green-100 border-0 rounded-full outline-none text-sm text-gray-700 placeholder-gray-400" readonly />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
            </div>
            <div class="relative">
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/user.svg) center/contain no-repeat; mask: url(/user.svg) center/contain no-repeat; background-color: currentColor;"></div>
              <input v-model="formData.last_name" type="text" placeholder="Last Name" class="w-full pl-11 pr-10 py-3 bg-green-100 border-0 rounded-full outline-none text-sm text-gray-700 placeholder-gray-400" readonly required />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
            </div>
            <div class="relative">
              <input v-model="formData.suffix" type="text" placeholder="Suffix (optional)" class="w-full pl-4 pr-10 py-3 bg-green-100 border-0 rounded-full outline-none text-sm text-gray-700 placeholder-gray-400" readonly />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
            </div>
            </template>
            <div>
              <div class="relative">
                <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/mail.svg) center/contain no-repeat; mask: url(/mail.svg) center/contain no-repeat; background-color: currentColor;"></div>
                <input v-model="formData.email" type="email" placeholder="Gmail only (e.g. juan@gmail.com)"
                  pattern="[a-zA-Z0-9._%+\-]+@gmail\.com"
                  class="w-full pl-11 pr-4 py-3 bg-green-50 border-0 rounded-full focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none text-sm text-gray-700 placeholder-gray-400 transition" required />
              </div>
              <p class="text-xs text-gray-400 flex items-center gap-1 pl-4 pt-1">
                <svg class="w-3 h-3 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>
                Only Gmail addresses are accepted.
              </p>
            </div>
            <div class="flex items-center justify-center pt-1">
              <div class="flex space-x-2">
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
              </div>
            </div>
            <button type="submit" class="w-full bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-6 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition duration-300 flex items-center justify-center tracking-wide uppercase text-sm shadow-md">
              Next <span class="ml-2">&rarr;</span>
            </button>
          </div>

          <div v-if="currentStep === 2" class="space-y-3 step-animate">
            <!-- Student ID -->
            <div class="relative">
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/user.svg) center/contain no-repeat; mask: url(/user.svg) center/contain no-repeat; background-color: currentColor;"></div>
              <input v-model="formData.student_id" @input="formData.student_id = formatStudentId(formData.student_id)" type="text" placeholder="Student ID (25-A-00000)" maxlength="10"
                :class="['w-full pl-11 pr-10 py-3 border-0 rounded-full focus:ring-2 focus:ring-blue-300 outline-none text-sm text-gray-700 placeholder-gray-400',
                  armsVerified ? 'bg-green-100' : 'bg-green-50']"
                :readonly="armsVerified" required />
              <span v-if="armsVerified" class="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
            </div>

            <!-- ARMS verified summary in Step 2 (mobile) -->
            <div v-if="armsVerified" class="rounded-2xl border border-green-200 bg-green-50 px-4 py-2.5 flex items-center gap-3">
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-xs text-green-700 flex-1 truncate">ARMS Verified — <span class="font-semibold">{{ armsData?.studentName }}</span></p>
              <button type="button" @click="resetArms(); currentStep = 1" class="text-xs text-green-600 underline hover:text-green-800 flex-shrink-0">Change</button>
            </div>

            <!-- Year Level -->
            <div class="relative">
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65" style="-webkit-mask: url(/book.svg) center/contain no-repeat; mask: url(/book.svg) center/contain no-repeat; background-color: currentColor;"></div>
              <select v-model="formData.year_level" :class="['w-full pl-11 pr-4 py-3 bg-green-50 border-0 rounded-full focus:ring-2 focus:ring-blue-300 outline-none appearance-none text-sm', formData.year_level ? 'text-gray-700' : 'text-gray-400']" required>
                <option value="" disabled>Select Year Level</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
              <img :src="'/arrow_down.svg'" alt="Dropdown" class="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none opacity-65" />
            </div>

            <!-- Program -->
            <div>
              <div class="relative" ref="programDropdownMobileRef">
                <div class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-65 z-10" style="-webkit-mask: url(/course.svg) center/contain no-repeat; mask: url(/course.svg) center/contain no-repeat; background-color: currentColor;"></div>
                <button type="button" @click="toggleProgramMenu('mobile')" class="w-full text-left pl-11 pr-4 py-3 bg-green-50 border-0 rounded-full focus:ring-2 focus:ring-blue-300 outline-none flex items-center justify-between text-sm text-gray-700">
                  <span class="truncate">
                    <template v-if="selectedProgramItem">{{ selectedProgramItem.shortName }} - {{ selectedProgramItem.fullName }}</template>
                    <template v-else><span class="text-gray-400">Select Program</span></template>
                  </span>
                  <img :src="'/arrow_down.svg'" alt="Dropdown" class="w-4 h-4 opacity-65 flex-shrink-0" />
                </button>
                <div v-if="showProgramMenu" :class="showMenuAboveMobile ? 'absolute z-30 bottom-full mb-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg' : 'absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg'">
                  <div class="px-2 pt-2 pb-1">
                    <input v-model="programSearch" type="text" placeholder="Search program..." @click.stop class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none" />
                  </div>
                  <ul class="max-h-48 overflow-auto">
                    <li v-for="p in filteredPrograms" :key="p.shortName" @click="chooseProgram(p)" class="flex items-start gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer">
                      <img :src="p.departmentLogo" :alt="p.departmentLabel" class="w-6 h-6 object-contain rounded bg-white flex-shrink-0" />
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-800">{{ p.shortName }}</div>
                        <div class="text-xs text-gray-500 whitespace-normal break-words">{{ p.fullName }}</div>
                      </div>
                    </li>
                    <li v-if="filteredPrograms.length === 0" class="px-3 py-4 text-sm text-gray-400 text-center">No programs found</li>
                  </ul>
                </div>
              </div>
              <div v-if="programDepartment" class="mt-2 flex items-center gap-2 pl-2">
                <img :src="programDepartment.departmentLogo" :alt="programDepartment.departmentLabel" class="w-5 h-5 object-contain rounded" />
                <span class="text-xs text-gray-600">Dept: <strong class="text-blue-700">{{ programDepartment.departmentName }}</strong></span>
              </div>
            </div>
            <div class="flex items-center justify-center pt-1">
              <div class="flex space-x-2">
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
              </div>
            </div>
            <div class="flex gap-3">
              <button type="button" @click="currentStep--" class="flex-1 bg-green-50 text-blue-600 py-3 px-4 rounded-full font-semibold hover:bg-green-100 transition duration-300 flex items-center justify-center text-sm">
                <span class="mr-1">&larr;</span>Back
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-4 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition duration-300 flex items-center justify-center tracking-wide uppercase text-sm shadow-md">
                Next <span class="ml-1">&rarr;</span>
              </button>
            </div>
          </div>

          <div v-if="currentStep === 3" class="space-y-4 step-animate">
            <div class="text-center">
              <div class="w-36 h-36 sm:w-40 sm:h-40 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center overflow-hidden">
                <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
                <div v-else class="flex flex-col items-center justify-center">
                  <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-300 mb-3"></div>
                  <div class="w-24 h-14 sm:w-28 sm:h-16 bg-gray-400 rounded-t-full"></div>
                </div>
              </div>
              <label class="block text-sm font-medium text-gray-600 mb-4">Upload Profile Photo</label>
              <div class="relative">
                <input type="file" @change="handleImageUpload" accept="image/*" class="hidden" id="file-upload-mobile" />
                <label for="file-upload-mobile" class="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-green-50 rounded-full text-sm font-medium text-gray-600 hover:bg-green-100 transition duration-300">
                  <img :src="'/change_photo.svg'" alt="Upload" class="w-5 h-5 mr-2 opacity-60" />{{ imagePreview ? 'Change Photo' : 'Choose Photo' }}
                </label>
              </div>
            </div>
            <div class="flex items-center justify-center pt-1">
              <div class="flex space-x-2">
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
              </div>
            </div>
            <div class="flex gap-3">
              <button type="button" @click="currentStep--" class="flex-1 bg-green-50 text-blue-600 py-3 px-4 rounded-full font-semibold hover:bg-green-100 transition duration-300 flex items-center justify-center text-sm">
                <span class="mr-1">&larr;</span>Back
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-4 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition duration-300 flex items-center justify-center tracking-wide uppercase text-sm shadow-md">
                Next <span class="ml-1">&rarr;</span>
              </button>
            </div>
          </div>

          <div v-if="currentStep === 3.5" class="space-y-4 step-animate">
            <div class="text-center mb-3">
              <div class="w-14 h-14 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 class="text-base font-semibold text-blue-900 mb-1">Review Your Information</h3>
              <p class="text-xs text-gray-600">Please verify all details are correct.</p>
            </div>
            
            <div class="bg-green-50 rounded-2xl p-3 space-y-2">
              <div class="flex flex-col items-center text-center gap-2">
                <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                  <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-blue-900 text-sm">{{ formData.first_name }} {{ formData.middle_name }} {{ formData.last_name }} {{ formData.suffix }}</p>
                  <p class="text-xs text-gray-600">{{ formData.student_id }}</p>
                </div>
              </div>
              
              <div class="border-t border-gray-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <p class="text-gray-400 text-[10px]">Email</p>
                  <p class="font-medium text-gray-800 break-all text-[10px] leading-tight">{{ formData.email }}</p>
                </div>
                <div>
                  <p class="text-gray-400 text-[10px]">Program</p>
                  <p class="font-medium text-gray-800 text-xs">{{ formData.program }}</p>
                </div>
                <div>
                  <p class="text-gray-400 text-[10px]">Year Level</p>
                  <p class="font-medium text-gray-800 text-xs">{{ formData.year_level }}</p>
                </div>
                <div>
                  <p class="text-gray-400 text-[10px]">Semester</p>
                  <p class="font-medium text-gray-800 text-xs">{{ formData.semester }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-gray-400 text-[10px]">School Year</p>
                  <p class="font-medium text-gray-800 text-xs">{{ formData.school_year }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="reviewCountdown > 0" class="text-center">
              <div class="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <span class="font-medium text-xs">Please review... {{ reviewCountdown }}s</span>
              </div>
            </div>
            
            <div class="flex items-center justify-center">
              <div class="flex space-x-2">
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
              </div>
            </div>
            <div class="flex gap-3">
              <button type="button" @click="currentStep = 3" class="flex-1 bg-green-50 text-blue-600 py-3 px-3 rounded-full font-semibold hover:bg-green-100 transition duration-300 flex items-center justify-center text-sm">
                <span class="mr-1">&larr;</span>Back
              </button>
              <button type="submit" :disabled="reviewCountdown > 0" :class="['flex-1 py-3 px-3 rounded-full font-semibold transition duration-300 flex items-center justify-center text-sm uppercase tracking-wide shadow-md', reviewCountdown > 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white hover:from-ssaam-dark hover:to-ssaam-light']">
                {{ reviewCountdown > 0 ? `Wait ${reviewCountdown}s` : 'Confirm' }} <span v-if="reviewCountdown <= 0" class="ml-1">&rarr;</span>
              </button>
            </div>
          </div>

          <div v-if="currentStep === 4" class="space-y-4 step-animate">
            <div class="text-center mb-3 sm:mb-4">
              <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <img :src="'/mail-gradient.svg'" alt="Email" class="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 class="text-base sm:text-lg font-semibold text-blue-900 mb-1 sm:mb-2">Verify Your Email</h3>
              <p class="text-xs sm:text-sm text-gray-600">We've sent a 6-digit verification code to:</p>
              <p class="text-xs sm:text-sm font-medium text-blue-600 mt-1 break-all px-2">{{ formData.email }}</p>
            </div>
            <div>
              <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-center">Enter Verification Code</label>
              <p class="text-[10px] sm:text-xs text-blue-600 mb-2 sm:mb-3 text-center font-medium">Copy the code from your email and paste it here</p>
              <div class="flex justify-center gap-1.5 sm:gap-2">
                <input 
                  v-for="(digit, index) in verificationCode" 
                  :key="index"
                  v-model="verificationCode[index]"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="1"
                  @input="handleCodeInput(index, $event)"
                  @keydown="handleCodeKeydown(index, $event)"
                  @paste="handleCodePaste($event)"
                  :ref="el => codeInputsMobile[index] = el"
                  class="w-9 h-11 sm:w-10 sm:h-12 text-center text-lg sm:text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                />
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 text-center">Code expires in 30 minutes</p>
            </div>
            
            <div class="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-3 sm:p-4 mt-3 sm:mt-4">
              <div class="flex items-start gap-2 sm:gap-3">
                <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p class="font-bold text-yellow-900 text-xs sm:text-sm">Your Temporary Password</p>
                  <p class="text-yellow-800 text-[10px] sm:text-xs mt-1 leading-relaxed">After approval, your password will be your <span class="font-bold bg-yellow-200 px-1 rounded">LAST NAME</span> (uppercase).</p>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-center pt-1 sm:pt-2">
              <button type="button" @click="resendCode" :disabled="resendCooldown > 0" class="text-xs sm:text-sm text-blue-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                {{ resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code' }}
              </button>
            </div>
            <div class="flex items-center justify-center pt-2">
              <div class="flex space-x-2">
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
                <div class="w-8 h-1 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div class="flex gap-3">
              <button type="button" @click="currentStep = 3.5" class="flex-1 bg-green-50 text-blue-600 py-3 px-3 rounded-full font-semibold hover:bg-green-100 transition duration-300 flex items-center justify-center text-sm">
                <span class="mr-1">&larr;</span>Back
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white py-3 px-3 rounded-full font-semibold hover:from-ssaam-dark hover:to-ssaam-light transition duration-300 flex items-center justify-center tracking-wide uppercase text-sm shadow-md">
                Sign Up <span class="ml-1">&rarr;</span>
              </button>
            </div>
          </div>
        </form>

        <div class="mt-5 text-center text-sm text-gray-500">
          Already have an account?
          <button @click="goToLogin" class="text-blue-500 hover:text-blue-700 font-semibold ml-1">Log In</button>
        </div>

        <div class="mt-3 text-center text-xs text-gray-400">
          Powered by <button @click="showDevelopersPopup = true" class="text-blue-400 font-medium hover:text-blue-600 cursor-pointer">CCS - Creatives Committee</button>
        </div>

        <div class="mt-2 text-center text-xs text-gray-400">
          Copyright © 2026 Powered by CCS-Creatives Committee.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import jrmsuLogo from '../assets/ccs-logo.png'
import ParticleBackground from '../components/ParticleBackground.vue'
import { encodeTimestamp } from '../utils/ssaamCrypto.js'
import { buildAPIUrl } from '../config/api.js'
import departments from '../config/departments.js'

const router = useRouter()
const currentStep = ref(1)
const imagePreview = ref('')
const showDevelopersPopup = ref(false)
const devCarouselIdx = ref(1)
let devCarouselTimer = null
const DEV_COUNT = 5
const devIdx = (i) => ((i % DEV_COUNT) + DEV_COUNT) % DEV_COUNT
const prevDev = () => { devCarouselIdx.value = devIdx(devCarouselIdx.value - 1) }
const nextDev = () => { devCarouselIdx.value = devIdx(devCarouselIdx.value + 1) }

const getDevStyle = (i) => {
  let d = i - devCarouselIdx.value
  if (d > DEV_COUNT / 2) d -= DEV_COUNT
  if (d < -DEV_COUNT / 2) d += DEV_COUNT
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

const handleDevClick = (i) => {
  if (i !== devCarouselIdx.value) {
    devCarouselIdx.value = i
  } else {
    window.open(developers[i].facebook, '_blank', 'noopener,noreferrer')
  }
}

watch(showDevelopersPopup, (open) => {
  if (open) {
    devCarouselIdx.value = 1
    devCarouselTimer = setInterval(nextDev, 3000)
  } else {
    clearInterval(devCarouselTimer)
    devCarouselTimer = null
  }
})
const firstNameInput = ref(null)
const middleNameInput = ref(null)
const lastNameInput = ref(null)
const emailInput = ref(null)

const focusNext = (refName) => {
  const target = {
    firstNameInput,
    middleNameInput,
    lastNameInput,
    emailInput
  }[refName]
  
  if (target && target.value) {
    target.value.focus()
  }
}
const registerDisabled = ref(false)
const registerDisabledMessage = ref('')

const verificationCode = ref(['', '', '', '', '', ''])
const codeInputs = ref([])
const codeInputsMobile = ref([])
const resendCooldown = ref(0)
let resendTimer = null

const loadingMessage = ref('Processing...')
const loadingSubMessage = ref('Please wait')

const reviewCountdown = ref(0)
let reviewCountdownTimer = null

const startReviewCountdown = () => {
  reviewCountdown.value = 5
  if (reviewCountdownTimer) clearInterval(reviewCountdownTimer)
  reviewCountdownTimer = setInterval(() => {
    reviewCountdown.value--
    if (reviewCountdown.value <= 0) {
      clearInterval(reviewCountdownTimer)
    }
  }, 1000)
}

const stepTitle = computed(() => {
  switch (currentStep.value) {
    case 1: return 'Step 1 - Personal Information'
    case 2: return 'Step 2 - School Information'
    case 3: return 'Step 3 - Photo Upload'
    case 3.5: return 'Step 4 - Review Your Information'
    case 4: return 'Step 5 - Email Verification'
    default: return ''
  }
})

onMounted(async () => {
  try {
    const response = await fetch(buildAPIUrl('/apis/settings'), {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer SSAAMStudents'
      }
    })
    let data
    try { data = await response.json() } catch { data = {} }
    if (response.ok && data.userRegister) {
      registerDisabled.value = !data.userRegister.register
      registerDisabledMessage.value = data.userRegister.message || 'Registration is currently disabled. Please try again later.'
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
  }
})

const developers = [
  { name: 'Kenzen Miñao', initials: 'KM', role: 'Fullstack Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/kenzen3131', image: '/team/kenzen.jpg' },
  { name: 'Jullan Maglinte', initials: 'JM', role: 'Lead Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/jullan.maglinte', image: '/team/jullan.jpg' },
  { name: 'Keith Laranjo', initials: 'KL', role: 'Backend Dev', year_level: '2nd year', program: 'CS', facebook: 'https://facebook.com/kei.takun.5070', image: '/team/keith.jpg' },
  { name: 'Christoph Bagabuyo', initials: 'CB', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/christoph.bagabuyo', image: '/team/christoph.jpg' },
  { name: 'Mischi Jeda Elumba', initials: 'MJ', role: 'UI/UX Designer', year_level: '2nd year', program: 'IS', facebook: 'https://facebook.com/mischijeda.elumba.1', image: '/team/mischi.jpg' }
]

const formData = reactive({
  student_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  year_level: '',
  suffix: '',
  program: '',
  photo: '',
  email: '',
  semester: '',
  school_year: ''
})

// ── JRMSU ARMS verification state ────────────────────────────────────────────
const armsVerified      = ref(false)
const armsStudentIdInput = ref('')   // Student ID typed inside the ARMS panel
const armsPassword      = ref('')
const armsLoading       = ref(false)
const showArmsInput     = ref(false)
const armsData          = ref(null)
const armsError         = ref('')
const armsShowPw        = ref(false)

function resetArms() {
  armsVerified.value       = false
  armsData.value           = null
  armsError.value          = ''
  showArmsInput.value      = false
  armsPassword.value       = ''
  armsStudentIdInput.value = ''
  formData.student_id      = ''
}

// Map ARMS year-level string to SSAAM values
function mapArmsYearLevel(yl) {
  if (!yl) return ''
  const s = String(yl).toLowerCase().trim()
  if (s === '1' || s.includes('1st') || s.includes('first'))   return '1st Year'
  if (s === '2' || s.includes('2nd') || s.includes('second'))  return '2nd Year'
  if (s === '3' || s.includes('3rd') || s.includes('third'))   return '3rd Year'
  if (s === '4' || s.includes('4th') || s.includes('fourth'))  return '4th Year'
  return ''
}

// Parse "LASTNAME, FIRSTNAME MIDDLENAME" or "FIRSTNAME MIDDLENAME LASTNAME"
function parseArmsName(fullName) {
  if (!fullName) return { first: '', middle: '', last: '' }
  const parts = fullName.trim().toUpperCase()
  if (parts.includes(',')) {
    const [lastName, rest] = parts.split(',').map(s => s.trim())
    const restParts = rest.split(' ').filter(Boolean)
    return { first: restParts[0] || '', middle: restParts.slice(1).join(' '), last: lastName }
  }
  const nameParts = parts.split(' ').filter(Boolean)
  if (nameParts.length === 1) return { first: nameParts[0], middle: '', last: '' }
  if (nameParts.length === 2) return { first: nameParts[0], middle: '', last: nameParts[1] }
  return { first: nameParts[0], middle: nameParts.slice(1, -1).join(' '), last: nameParts[nameParts.length - 1] }
}

const verifyWithARMS = async () => {
  const sid = armsStudentIdInput.value.trim()
  if (!sid || !/^\d{2}-[A-Z]-\d{5}$/.test(sid)) {
    armsError.value = 'Please enter a valid Student ID (e.g. 25-A-00000).'
    return
  }
  if (!armsPassword.value.trim()) {
    armsError.value = 'Please enter your JRMSU ARMS portal password.'
    return
  }
  armsError.value  = ''
  armsLoading.value = true
  try {
    const response = await fetch(buildAPIUrl('/apis/students/arms-verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer SSAAMStudents' },
      body: JSON.stringify({ student_id: sid, password: armsPassword.value })
    })
    const data = await response.json()
    if (!response.ok) {
      armsError.value = data.message || 'ARMS verification failed. Please try again.'
      return
    }
    const s = data.student
    armsData.value      = s
    armsVerified.value  = true
    showArmsInput.value = false
    armsPassword.value  = ''

    // Lock the Student ID into formData from the ARMS record
    formData.student_id = s.studentId || sid

    // Auto-fill year level
    const mappedYear = mapArmsYearLevel(s.yearLevel)
    if (mappedYear) formData.year_level = mappedYear

    // Auto-fill program if ARMS code matches a known shortName
    const prog = (s.programCode || s.programEnrolled || '').toUpperCase().replace(/\s+/g, '')
    const validShortNames = flattenedPrograms.value.map(p => p.shortName)
    if (validShortNames.includes(prog)) formData.program = prog

    // Auto-fill semester and school year
    if (s.semester)   formData.semester    = s.semester
    if (s.schoolYear) formData.school_year = s.schoolYear

    // Auto-fill name fields from ARMS only if the student left them blank in Step 1
    if (s.studentName && (!formData.first_name || !formData.last_name)) {
      const parsed = parseArmsName(s.studentName)
      if (!formData.first_name  && parsed.first)  formData.first_name  = parsed.first
      if (!formData.middle_name && parsed.middle)  formData.middle_name = parsed.middle
      if (!formData.last_name   && parsed.last)    formData.last_name   = parsed.last
    }
  } catch (_) {
    armsError.value = 'Network error. Please check your connection and try again.'
  } finally {
    armsLoading.value = false
  }
}

const flattenedPrograms = computed(() => {
  const list = []
  departments.forEach(dept => {
    if (dept && Array.isArray(dept.programs)) {
      dept.programs.forEach(p => {
        list.push({
          shortName: p.shortName,
          fullName: p.fullName,
          departmentId: dept.id,
          departmentName: dept.name,
          departmentLogo: dept.logo,
          departmentLabel: dept.label
        })
      })
    }
  })
  return list
})

const programDepartment = computed(() => {
  if (!formData.program) return null
  return flattenedPrograms.value.find(p => p.shortName === formData.program) || null
})

const isCOE = computed(() => {
  return programDepartment.value && String(programDepartment.value.departmentLabel).toUpperCase() === 'COE'
})

const isSOM = computed(() => {
  return programDepartment.value && String(programDepartment.value.departmentLabel).toUpperCase() === 'SOM'
})

const isCNAHS = computed(() => {
  return programDepartment.value && String(programDepartment.value.departmentLabel).toUpperCase() === 'CNAHS'
})

const primaryGradientClass = computed(() => {
  if (isCOE.value) return 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
  if (isSOM.value) return 'bg-gradient-to-r from-som-green to-som-yellow text-white'
  if (isCNAHS.value) return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
  return 'bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white'
})

const primaryBorderClass = computed(() => {
  if (isCOE.value) return 'border-orange-600'
  if (isSOM.value) return 'border-som-green'
  if (isCNAHS.value) return 'border-emerald-600'
  return 'border-blue-600'
})

// Registration flow buttons always stay blue (not affected by SOM theme)
const registrationButtonClass = computed(() => {
  return 'bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white'
})

const registrationBorderClass = computed(() => {
  return 'border-blue-600'
})

const pillGradientClass = computed(() => {
  if (isCOE.value) return 'inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-bold rounded-full shadow-sm'
  if (isSOM.value) return 'inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-som-green to-som-yellow text-white text-xs font-bold rounded-full shadow-sm'
  if (isCNAHS.value) return 'inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-full shadow-sm'
  return 'inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white text-xs font-bold rounded-full shadow-sm'
})

// Icon gradient for branding. registration buttons and icons should always use blue,
// even when SOM is selected, so we keep a separate computed value for the form icon.
const iconGradientClass = computed(() => {
  // used in other parts of the UI (e.g. department cards) which should still follow
  // theme changes; do not modify.
  if (isCOE.value) return 'bg-gradient-to-br from-orange-600 to-orange-400'
  if (isSOM.value) return 'bg-gradient-to-br from-som-green to-som-yellow'
  if (isCNAHS.value) return 'bg-gradient-to-br from-emerald-600 to-teal-600'
  return 'bg-gradient-to-br from-ssaam-dark to-ssaam-light'
})

// Always-blue gradient for the registration form's avatar/logo.
const registrationIconGradientClass = computed(() => 'bg-gradient-to-br from-ssaam-dark to-ssaam-light')

// Program dropdown state for custom select with logos
// ── Year Level custom dropdown ──────────────────────────────────────────────
const showYearMenu = ref(false)
const showYearMenuAbove = ref(false)
const yearDropdownRef = ref(null)

const toggleYearMenu = () => {
  showYearMenu.value = !showYearMenu.value
  if (showYearMenu.value && yearDropdownRef.value) {
    const rect = yearDropdownRef.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    showYearMenuAbove.value = spaceBelow < 200 && rect.top > 200
  }
}

const chooseYearLevel = (yr) => {
  formData.year_level = yr
  showYearMenu.value = false
}

// ── Program dropdown ─────────────────────────────────────────────────────────
const showProgramMenu = ref(false)
const programDropdownDesktopRef = ref(null)
const programDropdownMobileRef = ref(null)
const showMenuAboveDesktop = ref(false)
const showMenuAboveMobile = ref(false)
const programSearch = ref('')
const selectedProgramItem = computed(() => {
  return flattenedPrograms.value.find(p => p.shortName === formData.program) || null
})
const filteredPrograms = computed(() => {
  const q = programSearch.value.trim().toLowerCase()
  if (!q) return flattenedPrograms.value
  return flattenedPrograms.value.filter(p =>
    p.shortName.toLowerCase().includes(q) ||
    p.fullName.toLowerCase().includes(q) ||
    p.departmentName.toLowerCase().includes(q) ||
    p.departmentLabel.toLowerCase().includes(q)
  )
})

const handleOutsideClick = (e) => {
  const desktopEl = programDropdownDesktopRef.value
  const mobileEl = programDropdownMobileRef.value
  const clickedInsideDesktop = desktopEl && desktopEl.contains(e.target)
  const clickedInsideMobile = mobileEl && mobileEl.contains(e.target)
  if (!clickedInsideDesktop && !clickedInsideMobile) showProgramMenu.value = false
  const yearEl = yearDropdownRef.value
  if (yearEl && !yearEl.contains(e.target)) showYearMenu.value = false
}

const updateProgramMenuPlacement = (which) => {
  try {
    const menuNeeded = 240 // approximate menu height in px
    if (which === 'desktop') {
      const el = programDropdownDesktopRef.value
      if (!el) return
      const rect = el.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      showMenuAboveDesktop.value = (spaceBelow < menuNeeded && spaceAbove > menuNeeded)
    } else if (which === 'mobile') {
      const el = programDropdownMobileRef.value
      if (!el) return
      const rect = el.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      showMenuAboveMobile.value = (spaceBelow < menuNeeded && spaceAbove > menuNeeded)
    }
  } catch (e) {
    // ignore
  }
}

const onWindowChange = () => {
  if (showProgramMenu.value) {
    updateProgramMenuPlacement('desktop')
    updateProgramMenuPlacement('mobile')
  }
}

const toggleProgramMenu = (which) => {
  showProgramMenu.value = !showProgramMenu.value
  if (showProgramMenu.value) {
    programSearch.value = ''
    updateProgramMenuPlacement(which)
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
})

const chooseProgram = (p) => {
  formData.program = p.shortName
  showProgramMenu.value = false
  programSearch.value = ''
}

const isUploading = ref(false)
const previousStudentIdLength = ref(0)

const formatStudentId = (value) => {
  let input = value.toUpperCase()
  let cleaned = input.replace(/[^0-9A-Z-]/g, '')
  let noDashes = cleaned.replace(/-/g, '')
  const isDeleting = noDashes.length < previousStudentIdLength.value
  previousStudentIdLength.value = noDashes.length
  
  if (isDeleting) {
    return noDashes.slice(0, 8)
  }
  
  const digits1 = noDashes.slice(0, 2)
  const letter = noDashes.slice(2, 3)
  const digits2 = noDashes.slice(3, 8)
  
  let formatted = digits1
  if (digits1.length === 2) formatted += '-'
  if (letter) formatted += letter
  if (letter) formatted += '-'
  if (digits2) formatted += digits2
  
  return formatted.slice(0, 10)
}

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        const maxWidth = 1920
        const maxHeight = 1920
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, width, height)
        
        let quality = 0.9
        let attempts = 0
        const maxAttempts = 15
        const targetSizeKB = 80
        
        const tryCompress = () => {
          if (attempts >= maxAttempts) {
            const dataURL = canvas.toDataURL('image/jpeg', 0.1)
            resolve(dataURL)
            return
          }
          
          const dataURL = canvas.toDataURL('image/jpeg', quality)
          const base64Size = (dataURL.length - 'data:image/jpeg;base64,'.length) * 3 / 4 / 1024
          
          if (base64Size <= targetSizeKB) {
            resolve(dataURL)
          } else {
            quality -= 0.06
            attempts++
            if (quality >= 0.05) {
              tryCompress()
            } else {
              resolve(dataURL)
            }
          }
        }
        
        tryCompress()
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = event.target.result
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)

  isUploading.value = true
  formData.photo = ""

  const maxRetries = 3
  let uploadSuccess = false

  try {
    // Compress the image first
    const compressedBase64 = await compressImage(file);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(buildAPIUrl('/apis/upload-image'), {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image: compressedBase64 })
        });

        const data = await res.json()

        if (data.success) {
          formData.photo = data.url
          uploadSuccess = true
          break
        } else {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      } catch (error) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    if (!uploadSuccess) {
      errorMessage.value = "Image upload failed after multiple attempts. Please try again."
      showErrorNotification.value = true
    }
  } catch (error) {
    errorMessage.value = "Image processing error. Please try again."
    showErrorNotification.value = true
  }

  isUploading.value = false
}

const handleCodeInput = (index, event) => {
  const value = event.target.value
  if (value && /^\d$/.test(value)) {
    verificationCode.value[index] = value
    if (index < 5) {
      const nextInput = codeInputs.value[index + 1] || codeInputsMobile.value[index + 1]
      if (nextInput) nextInput.focus()
    }
  } else {
    verificationCode.value[index] = ''
  }
}

const handleCodeKeydown = (index, event) => {
  if (event.key === 'Backspace' && !verificationCode.value[index] && index > 0) {
    const prevInput = codeInputs.value[index - 1] || codeInputsMobile.value[index - 1]
    if (prevInput) prevInput.focus()
  }
}

const handleCodePaste = (event) => {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < pastedData.length; i++) {
    verificationCode.value[i] = pastedData[i]
  }
  if (pastedData.length > 0) {
    const lastFilledIndex = Math.min(pastedData.length - 1, 5)
    setTimeout(() => {
      const lastInput = codeInputs.value[lastFilledIndex] || codeInputsMobile.value[lastFilledIndex]
      if (lastInput) lastInput.focus()
    }, 50)
  }
}

const startResendCooldown = () => {
  resendCooldown.value = 60
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(resendTimer)
    }
  }, 1000)
}

const resendCode = async () => {
  if (resendCooldown.value > 0) return
  
  isRegistering.value = true
  loadingMessage.value = 'Sending Code...'
  loadingSubMessage.value = 'Please check your email'
  
  try {
    await sendVerificationCode()
    startResendCooldown()
  } catch (error) {
    errorMessage.value = error.message || 'Failed to resend code'
    showErrorNotification.value = true
  }
  
  isRegistering.value = false
}

const sendVerificationCode = async () => {
  while (isUploading.value) {
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  try {
    const response = await fetch(buildAPIUrl('/apis/students/send-verification'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SSAAMStudents'
      },
      body: JSON.stringify(formData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification code')
    }

    return data
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Network connection error. Please check your internet connection and try again.')
    }
    throw error
  }
}

const showNotification = ref(false)
const notificationMessage = ref('')
const isRegistering = ref(false)
const showErrorNotification = ref(false)
const errorMessage = ref('')

const handleNext = async () => {
  if (registerDisabled.value) {
    errorMessage.value = registerDisabledMessage.value || 'Registration is currently disabled. Please try again later.'
    showErrorNotification.value = true
    return
  }
  
  if (currentStep.value === 1) {
    if (!formData.first_name || !formData.first_name.trim()) {
      errorMessage.value = "Please provide your first name to continue."
      showErrorNotification.value = true
      return
    }
    if (!/^[\p{L}\s'-]+$/u.test(formData.first_name)) {
      errorMessage.value = "First name can only contain letters and spaces."
      showErrorNotification.value = true
      return
    }
    if (formData.middle_name && !/^[\p{L}\s'-]+$/u.test(formData.middle_name)) {
      errorMessage.value = "Middle name can only contain letters and spaces."
      showErrorNotification.value = true
      return
    }
    if (formData.middle_name && formData.middle_name.trim().length < 3) {
      errorMessage.value = "Middle name must be at least 3 characters long."
      showErrorNotification.value = true
      return
    }
    if (!formData.last_name || !formData.last_name.trim()) {
      errorMessage.value = "Please provide your last name to proceed."
      showErrorNotification.value = true
      return
    }
    if (!/^[\p{L}\s'-]+$/u.test(formData.last_name)) {
      errorMessage.value = "Last name can only contain letters and spaces."
      showErrorNotification.value = true
      return
    }
    if (!formData.email || !formData.email.trim()) {
      errorMessage.value = "Please provide your email address."
      showErrorNotification.value = true
      return
    }
    if (!/^[^\s@]+@gmail\.com$/i.test(formData.email)) {
      errorMessage.value = "Only Gmail addresses (@gmail.com) are allowed for registration."
      showErrorNotification.value = true
      return
    }
  }

  if (currentStep.value === 2) {
    if (!formData.student_id || !formData.student_id.trim()) {
      errorMessage.value = "Please enter your Student ID to continue."
      showErrorNotification.value = true
      return
    }
    if (!/^\d{2}-[A-Z]-\d{5}$/.test(formData.student_id)) {
      errorMessage.value = "Student ID must follow format: 25-A-00000 (2 digits, hyphen, 1 letter, hyphen, 5 digits)."
      showErrorNotification.value = true
      return
    }
    if (!armsVerified.value) {
      errorMessage.value = "Please verify your Student ID with your JRMSU ARMS portal account before continuing."
      showErrorNotification.value = true
      showArmsInput.value = true
      return
    }
    if (!formData.year_level) {
      errorMessage.value = "Please select your Year Level."
      showErrorNotification.value = true
      return
    }
    if (!formData.program) {
      errorMessage.value = "Please select your Program."
      showErrorNotification.value = true
      return
    }
    const allowedPrograms = flattenedPrograms.value.map(p => p.shortName)
    if (!allowedPrograms.includes(formData.program)) {
      errorMessage.value = `Program must be one of: ${allowedPrograms.join(', ')}.`
      showErrorNotification.value = true
      return
    }
  }

  if (currentStep.value === 3) {
    currentStep.value = 3.5
    startReviewCountdown()
    return
  }

  if (currentStep.value === 3.5) {
    if (reviewCountdown.value > 0) {
      return
    }
    isRegistering.value = true
    loadingMessage.value = 'Sending Verification Code...'
    loadingSubMessage.value = 'Please check your email'
    
    try {
      await sendVerificationCode()
      verificationCode.value = ['', '', '', '', '', '']
      startResendCooldown()
      currentStep.value = 4
    } catch (error) {
      errorMessage.value = error.message || 'Failed to send verification code'
      showErrorNotification.value = true
    }
    
    isRegistering.value = false
    return
  }

  if (currentStep.value === 4) {
    const code = verificationCode.value.join('')
    if (code.length !== 6) {
      errorMessage.value = "Please enter the complete 6-digit verification code."
      showErrorNotification.value = true
      return
    }

    isRegistering.value = true
    loadingMessage.value = 'Verifying & Registering...'
    loadingSubMessage.value = 'Please wait while we create your account'
    
    try {
      const response = await fetch(buildAPIUrl('/apis/students/verify-and-register'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SSAAMStudents'
        },
        body: JSON.stringify({
          email: formData.email,
          code: code,
          _ssaam_access_token: encodeTimestamp()
        })
      })

      const data = await response.json()
      isRegistering.value = false

      if (response.ok) {
        notificationMessage.value = "Your account has been created! It's pending admin approval. You'll receive an email when approved."
        showNotification.value = true

        setTimeout(() => {
          showNotification.value = false
          router.push('/')
        }, 4000)
      } else {
        // Check if verification code expired - inform user but don't auto-reset
        if (data.resetRegistration || data.code === 'TOKEN_EXPIRED') {
          errorMessage.value = "Your verification code has expired. Please click 'Back' to start over and receive a new code."
          showErrorNotification.value = true
        } else {
          errorMessage.value = data.message || "Registration failed. Please try again."
          showErrorNotification.value = true
        }
      }
    } catch (error) {
      isRegistering.value = false
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        errorMessage.value = "Network connection error. Please check your internet connection and try again."
      } else {
        errorMessage.value = "Server error. Please try again later."
      }
      showErrorNotification.value = true
    }

    return
  }

  if (currentStep.value < 4) {
    currentStep.value++
  }
}

const goToLogin = () => {
  router.push('/')
}
</script>

<style scoped>
@keyframes golden-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes golden-pulse {
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 1;    }
}

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
  width: 40%;
  flex-shrink: 0;
  color: white;
  position: relative;
  overflow: hidden;
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

.dropdown-pop-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-pop-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
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

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.step-animate {
  animation: step-enter 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes step-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── ARMS panel expand/collapse ── */
.arms-expand-enter-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), max-height 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  max-height: 300px;
  overflow: hidden;
}
.arms-expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease, max-height 0.24s ease;
  max-height: 300px;
  overflow: hidden;
}
.arms-expand-enter-from {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.arms-expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}

/* ── ARMS verify button fade ── */
.arms-btn-enter-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.arms-btn-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.arms-btn-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.arms-btn-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── ARMS inline error shake-in ── */
.arms-error-enter-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.arms-error-leave-active {
  transition: opacity 0.15s ease;
}
.arms-error-enter-from {
  opacity: 0;
  transform: translateX(-6px);
}
.arms-error-leave-to {
  opacity: 0;
}
</style>
