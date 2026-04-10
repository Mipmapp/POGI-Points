<template>
  <transition name="fade">
    <div v-if="showContactModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40" @click.self="showContactModal = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 px-6 py-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <div class="w-5 h-5" style="-webkit-mask: url(/help.svg) center/contain no-repeat; mask: url(/help.svg) center/contain no-repeat; background-color: white;"></div>
              </div>
              <h3 class="text-xl font-bold text-white">Need Help?</h3>
            </div>
            <button @click="showContactModal = false" class="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <div class="p-6 space-y-4">
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

            <button @click="showContactModal = false" class="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white py-3 rounded-full font-semibold hover:from-blue-800 hover:via-blue-700 hover:to-blue-600 transition">
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
            <button @click="verifyAdminCode" class="flex-1 px-6 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-800 hover:via-blue-700 hover:to-blue-600 transition duration-300">
              Verify
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <transition name="fade">
    <div v-if="showCollegeMismatch" @click.self="showCollegeMismatch = false" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="mismatch-title">
      <transition name="modal-bounce" appear>
        <div ref="collegeMismatchModal" @keydown="handleMismatchKeydown" class="bg-white rounded-xl shadow-lg py-3 px-4 sm:py-6 sm:px-8 max-w-sm w-full mx-2 text-center transform transition-all overflow-visible" tabindex="-1">
          <div class="relative">
            <div class="absolute left-1/2 -translate-x-1/2 -top-12 sm:-top-20 pointer-events-none z-20">
              <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md border border-gray-100 overflow-visible modal-logo-container">
                <img :src="mismatchLogo" :alt="`${mismatchCollege} logo`" class="w-12 h-12 sm:w-16 sm:h-16 object-contain modal-logo" />
              </div>
            </div>

            <div class="pt-6 sm:pt-10 pb-3 max-h-[60vh] overflow-y-auto">
              
              <h3 class="text-xl sm:text-2xl font-extrabold text-gray-800 mt-2 sm:mt-3">Account College Mismatch</h3>
              <p class="text-gray-600 mt-2 text-sm leading-snug px-3 sm:px-4 line-clamp-6">{{ mismatchMessage }}</p>
              <div class="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-3 sm:px-4">
                <button ref="mismatchPrimary" @click="goToCollegePortal" class="modal-primary w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold shadow-sm transform transition duration-200 hover:-translate-y-0.5">Go to {{ mismatchCollege }} Login</button>
                <button @click="showCollegeMismatch = false" class="modal-secondary w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transform transition duration-150">Try Again</button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <transition name="fade">
    <div v-if="showErrorNotification" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center transform transition-all border border-red-200">
          <div class="w-20 h-20 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-red-600 mb-2">Oops!</h3>
          <p class="text-red-700 font-medium px-4">{{ errorMessage }}</p>
          <button @click="showErrorNotification = false" class="mt-6 px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-600 transition duration-300">
            Try Again
          </button>
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
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div class="bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 rounded-t-3xl px-6 py-5 text-center relative">
            <h3 class="text-xl font-bold text-white">Meet Our Developers</h3>
            <p class="text-blue-100 text-xs mt-0.5">CCS - Creatives Committee</p>
            <button @click="showDevelopersPopup = false" class="absolute right-4 top-4 text-white/70 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <div class="p-6 space-y-3">
            <div class="flex justify-center gap-3">
              <a v-for="(dev, index) in developers.slice(0,2)" :key="dev.name" :href="dev.facebook" target="_blank" rel="noopener noreferrer"
                 class="flex flex-col items-center p-3 bg-green-50 rounded-2xl w-32 hover:bg-blue-50 hover:scale-105 transition-all duration-300 cursor-pointer"
                 :style="{ transitionDelay: `${index * 50}ms` }">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white shadow-md mb-2 overflow-hidden ring-2 ring-blue-200">
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
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white shadow-md mb-2 overflow-hidden ring-2 ring-blue-200">
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

            <button @click="showDevelopersPopup = false" class="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white py-3 rounded-full font-semibold hover:from-blue-800 hover:via-blue-700 hover:to-blue-600 transition">
              Close
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <!-- Department Selector Modal -->
  <transition name="fade">
    <div v-if="showDepartmentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showDepartmentModal = false">
      <transition name="slide-up" appear>
        <div class="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- Programs Detail View with Slide Transition -->
          <transition name="slide-left" mode="out-in">
            <div v-if="selectedDepartment" :key="selectedDepartment.id" class="space-y-4 sm:space-y-6">
              <!-- Profile-like Header -->
              <div>
                <button @click="selectedDepartment = null" :class="['mb-3 sm:mb-4 flex items-center gap-2 font-medium transition-colors text-sm sm:text-base',
                  selectedDepartment.label === 'CCS' ? 'text-purple-600 hover:text-purple-800' :
                  selectedDepartment.label === 'COE' ? 'text-orange-600 hover:text-orange-800' :
                  selectedDepartment.label === 'SOM' ? 'text-green-600 hover:text-green-800' :
                  selectedDepartment.label === 'CNAHS' ? 'text-green-600 hover:text-green-800' :
                  'text-blue-600 hover:text-blue-800']">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 rotate-180">
                    <path fill="currentColor" d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Go Back
                </button>
                
                <!-- Profile Card (glassmorphism) -->
                <div :class="['p-1 rounded-lg bg-gradient-to-br',
                  selectedDepartment.label === 'CCS' ? 'from-purple-600 to-purple-400' :
                  selectedDepartment.label === 'COE' ? 'from-orange-600 to-orange-400' :
                  selectedDepartment.label === 'SOM' ? 'from-green-600 to-green-400' :
                  selectedDepartment.label === 'CNAHS' ? 'from-green-700 to-green-500' :
                  'from-blue-600 to-blue-400']">
                  <div class="bg-white/20 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-white/30">
                    <div class="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                      <div class="flex-shrink-0">
                        <img :src="selectedDepartment.logo" :alt="selectedDepartment.name" class="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg p-1" />
                      </div>
                      <div class="flex-1 text-center sm:text-left">
                        <!-- college name with checkmark to indicate selection -->
                        <div class="flex items-center justify-center sm:justify-start gap-1 mb-1">
                          <h2 class="text-base sm:text-xl font-bold text-white leading-tight">{{ selectedDepartment.name }}</h2>
                          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p class="text-xs sm:text-sm text-gray-100 font-medium">{{ selectedDepartment.programs.length }} programs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Programs List -->
              <div class="space-y-3 sm:space-y-4">
                <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-2">Available Programs</h3>
                <p class="text-xs sm:text-sm text-gray-600 mb-2">Please make sure your study program belongs to this college before confirming.</p>
                <p v-if="currentUserProgram" :class="['text-xs sm:text-sm mb-4',
                  isProgramAvailable ? 'text-green-700 font-medium' : 'text-red-700 font-medium']">
                  {{ isProgramAvailable ? '✓ Your program is available in this college' : '✗ Your program is not available in this college' }}
                </p>
                <div class="bg-white/20 backdrop-blur-md p-2 sm:p-3 rounded-lg border border-white/30 max-h-[40vh] overflow-y-auto">
                  <ul class="space-y-2">
                    <li v-for="(program, idx) in selectedDepartment.programs" :key="idx" :class="['bg-white rounded-md p-2 sm:p-3 border border-gray-200 hover:border-gray-300 transition-all flex justify-between items-center',
                      currentUserProgram && program.shortName === currentUserProgram ? 'ring-2 ring-green-300' : '']">
                      <div>
                        <p class="text-sm font-semibold text-gray-900">{{ program.fullName }}</p>
                        <p class="text-xs text-gray-500 mt-1">Code: <span class="font-mono font-bold">{{ program.shortName }}</span></p>
                      </div>
                      <span v-if="currentUserProgram && program.shortName === currentUserProgram" class="text-green-500 font-bold text-lg">✓</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/20">
                <button @click="confirmDepartment" :class="['flex-1 px-4 sm:px-6 py-2 sm:py-3 text-white text-sm sm:text-base rounded-lg font-semibold transition-all shadow-md hover:shadow-lg bg-gradient-to-r',
                  selectedDepartment.label === 'CCS' ? 'from-purple-600 via-purple-500 to-purple-400 hover:from-purple-700 hover:via-purple-600 hover:to-purple-500' :
                  selectedDepartment.label === 'COE' ? 'from-orange-600 via-orange-500 to-orange-400 hover:from-orange-700 hover:via-orange-600 hover:to-orange-500' :
                  selectedDepartment.label === 'SOM' ? 'from-green-600 via-green-500 to-green-400 hover:from-green-700 hover:via-green-600 hover:to-green-500' :
                  selectedDepartment.label === 'CNAHS' ? 'from-green-700 via-green-600 to-green-500 hover:from-green-800 hover:via-green-700 hover:to-green-600' :
                  'from-blue-700 via-blue-600 to-blue-500 hover:from-blue-800 hover:via-blue-700 hover:to-blue-600']">
                  Confirm
                </button>
                <button @click="selectedDepartment = null" :class="['flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition border',
                  selectedDepartment.label === 'CCS' ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100' :
                  selectedDepartment.label === 'COE' ? 'bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100' :
                  selectedDepartment.label === 'SOM' ? 'bg-green-50 text-green-800 border-green-300 hover:bg-green-100' :
                  selectedDepartment.label === 'CNAHS' ? 'bg-green-50 text-green-800 border-green-300 hover:bg-green-100' :
                  'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100']">
                  Back
                </button>
              </div>
            </div>
            <!-- Departments Grid -->
            <div v-else :key="'departments'" class="space-y-3 sm:space-y-4">
              <h2 class="text-xl sm:text-2xl font-bold text-blue-900 mb-4 sm:mb-6">Select College</h2>
              <button 
                v-for="dept in departments" 
                :key="dept.id"
                @click="selectedDepartment = dept"
                :class="['w-full group p-4 sm:p-6 border-2 rounded-lg sm:rounded-xl hover:shadow-xl transition-all duration-300 text-left',
                  dept.label === 'CCS' ? 'bg-purple-50 border-purple-200 hover:border-purple-400' :
                  dept.label === 'COE' ? 'bg-orange-50 border-orange-200 hover:border-orange-400' :
                  dept.label === 'SOM' ? 'bg-green-50 border-green-200 hover:border-green-400' :
                  dept.label === 'CNAHS' ? 'bg-green-50 border-green-200 hover:border-green-400' :
                  'bg-white border-blue-200 hover:border-blue-400']"
              >
                <div class="flex items-center gap-3 sm:gap-5">
                  <div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14">
                    <img :src="dept.logo" :alt="dept.name" class="w-full h-full object-contain" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 :class="['text-sm sm:text-base font-bold transition-colors truncate',
                      dept.label === 'CCS' ? 'text-purple-900 group-hover:text-purple-700' :
                      dept.label === 'COE' ? 'text-orange-900 group-hover:text-orange-700' :
                      dept.label === 'SOM' ? 'text-green-900 group-hover:text-green-700' :
                      dept.label === 'CNAHS' ? 'text-green-900 group-hover:text-green-700' :
                      'text-blue-900 group-hover:text-blue-600']">{{ dept.name }}</h3>
                    <div class="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span :class="['inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r text-white text-xs font-bold rounded-full shadow-sm',
                        dept.label === 'CCS' ? 'from-purple-700 via-purple-600 to-pink-600' :
                        dept.label === 'COE' ? 'from-orange-700 via-orange-600 to-red-600' :
                        dept.label === 'SOM' ? 'from-green-700 via-green-600 to-yellow-600' :
                        dept.label === 'CNAHS' ? 'from-green-800 via-green-700 to-green-600' :
                        'from-blue-700 via-blue-600 to-blue-500']">{{ dept.label }}</span>
                      <span class="text-xs text-gray-500 font-medium">{{ dept.programs.length }} program<span v-if="dept.programs.length !== 1">s</span></span>
                    </div>
                  </div>
                  <svg :class="['w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0',
                    dept.label === 'CCS' ? 'text-purple-600' :
                    dept.label === 'COE' ? 'text-orange-600' :
                    dept.label === 'SOM' ? 'text-green-600' :
                    dept.label === 'CNAHS' ? 'text-green-600' :
                    'text-blue-600']">                    
                    <path fill="currentColor" d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
              </button>

              <div class="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button @click="showDepartmentModal = false; selectedDepartment = null" class="w-full px-4 sm:px-6 py-2 sm:py-2 bg-gray-200 text-gray-800 text-sm sm:text-base rounded-lg font-medium hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </div>
  </transition>

  <ProgrammerLoadingEffect :visible="isLoading" message="AUTHENTICATING" :theme="chosenDepartment ? chosenDepartment.label : ''" @complete="handleLoadingComplete" />
  <div class="hidden md:flex min-h-screen bg-white w-full">
    <div class="w-2/5 desktop-bg-panel flex-shrink-0">
      <div class="bubble-container" aria-hidden="true">
        <div class="bubble" style="width:18px;height:18px;left:8%;animation-duration:9s;animation-delay:0s;"></div>
        <div class="bubble" style="width:30px;height:30px;left:18%;animation-duration:7s;animation-delay:1.5s;"></div>
        <div class="bubble" style="width:12px;height:12px;left:28%;animation-duration:11s;animation-delay:0.5s;"></div>
        <div class="bubble" style="width:45px;height:45px;left:38%;animation-duration:8s;animation-delay:3s;"></div>
        <div class="bubble" style="width:20px;height:20px;left:50%;animation-duration:12s;animation-delay:1s;"></div>
        <div class="bubble" style="width:35px;height:35px;left:62%;animation-duration:6s;animation-delay:4s;"></div>
        <div class="bubble" style="width:14px;height:14px;left:72%;animation-duration:10s;animation-delay:1.8s;"></div>
        <div class="bubble" style="width:40px;height:40px;left:82%;animation-duration:7.5s;animation-delay:0.8s;"></div>
        <div class="bubble" style="width:22px;height:22px;left:14%;animation-duration:9.5s;animation-delay:2.5s;"></div>
        <div class="bubble" style="width:50px;height:50px;left:55%;animation-duration:8.5s;animation-delay:3.5s;"></div>
        <div class="bubble" style="width:16px;height:16px;left:88%;animation-duration:11.5s;animation-delay:0.3s;"></div>
        <div class="bubble" style="width:28px;height:28px;left:44%;animation-duration:6.5s;animation-delay:2s;"></div>
      </div>
      <div class="relative z-10 text-center">
        <div class="mb-4">
          <div class="w-40 h-40 mx-auto flex items-center justify-center logo-sweep" style="mask: url(/jrmsu.svg) no-repeat center / contain; -webkit-mask: url(/jrmsu.svg) no-repeat center / contain;">
            <img :src="jrmsuLogo" alt="JRMSU CCS Logo" class="w-full h-full object-contain drop-shadow-2xl relative z-10" />
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-sweep z-20 pointer-events-none"></div>
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

            <button type="button" @click="showDepartmentModal = true" :class="['w-full py-3 px-6 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-3',
              chosenDepartment ? 
                (chosenDepartment.label === 'CCS' ? 'bg-purple-50 text-purple-900 hover:bg-purple-100' :
                 chosenDepartment.label === 'COE' ? 'bg-orange-50 text-orange-900 hover:bg-orange-100' :
                 chosenDepartment.label === 'SOM' ? 'bg-green-50 text-green-900 hover:bg-green-100' :
                 chosenDepartment.label === 'CNAHS' ? 'bg-green-50 text-green-900 hover:bg-green-100' :
                 'bg-blue-50 text-blue-900 hover:bg-blue-100')
              : 'bg-green-50 text-gray-500 hover:bg-green-100']">
              <template v-if="chosenDepartment">
                <img :src="chosenDepartment.logo" :alt="chosenDepartment.name" class="w-6 h-6 object-contain rounded-md" />
                <div class="text-left text-sm">
                  <div class="font-semibold">{{ chosenDepartment.name }}</div>
                </div>
              </template>
              <template v-else>
                <img src="/department.svg" alt="Department" class="w-5 h-5 object-contain opacity-65" />
                <span class="text-sm">Select College</span>
              </template>
            </button>

            <div class="text-center">
              <button type="button" @click="showForgotPasswordModal = true" class="text-sm text-blue-500 hover:text-blue-700 font-medium">
                forgot your password?
              </button>
            </div>

            <button type="submit" :disabled="isLoading || !chosenDepartment" class="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 px-6 rounded-full font-semibold hover:from-blue-700 hover:to-blue-500 transition duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed tracking-wide uppercase text-sm shadow-md">
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
    <div class="bubble-container" aria-hidden="true">
      <div class="bubble" style="width:18px;height:18px;left:8%;animation-duration:9s;animation-delay:0s;"></div>
      <div class="bubble" style="width:30px;height:30px;left:18%;animation-duration:7s;animation-delay:1.5s;"></div>
      <div class="bubble" style="width:12px;height:12px;left:28%;animation-duration:11s;animation-delay:0.5s;"></div>
      <div class="bubble" style="width:45px;height:45px;left:38%;animation-duration:8s;animation-delay:3s;"></div>
      <div class="bubble" style="width:20px;height:20px;left:50%;animation-duration:12s;animation-delay:1s;"></div>
      <div class="bubble" style="width:35px;height:35px;left:62%;animation-duration:6s;animation-delay:4s;"></div>
      <div class="bubble" style="width:14px;height:14px;left:72%;animation-duration:10s;animation-delay:1.8s;"></div>
      <div class="bubble" style="width:40px;height:40px;left:82%;animation-duration:7.5s;animation-delay:0.8s;"></div>
      <div class="bubble" style="width:22px;height:22px;left:14%;animation-duration:9.5s;animation-delay:2.5s;"></div>
      <div class="bubble" style="width:50px;height:50px;left:55%;animation-duration:8.5s;animation-delay:3.5s;"></div>
      <div class="bubble" style="width:16px;height:16px;left:88%;animation-duration:11.5s;animation-delay:0.3s;"></div>
      <div class="bubble" style="width:28px;height:28px;left:44%;animation-duration:6.5s;animation-delay:2s;"></div>
    </div>

    <div class="text-center text-white pt-12 pb-8 px-4 relative z-10">
      <div class="w-32 h-32 mx-auto mb-4 relative" style="mask: url(/jrmsu.svg) no-repeat center / contain; -webkit-mask: url(/jrmsu.svg) no-repeat center / contain;">
        <img src="/src/assets/jrmsu-logo.webp" alt="JRMSU CCS Logo" class="w-full h-full object-contain drop-shadow-2xl relative z-10" />
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-sweep z-20 pointer-events-none"></div>
      </div>
      <h1 class="text-4xl font-bold mb-2">SSAAM</h1>
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

          <button type="button" @click="showDepartmentModal = true" :class="['w-full py-3 px-6 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-3',
            chosenDepartment ? 
              (chosenDepartment.label === 'CCS' ? 'bg-purple-50 text-purple-900 hover:bg-purple-100' :
               chosenDepartment.label === 'COE' ? 'bg-orange-50 text-orange-900 hover:bg-orange-100' :
               chosenDepartment.label === 'SOM' ? 'bg-green-50 text-green-900 hover:bg-green-100' :
               chosenDepartment.label === 'CNAHS' ? 'bg-green-50 text-green-900 hover:bg-green-100' :
               'bg-blue-50 text-blue-900 hover:bg-blue-100')
            : 'bg-green-50 text-gray-500 hover:bg-green-100']">
            <template v-if="chosenDepartment">
              <img :src="chosenDepartment.logo" :alt="chosenDepartment.name" class="w-6 h-6 object-contain rounded-md" />
              <div class="text-left text-sm">
                <div class="font-semibold">{{ chosenDepartment.name }}</div>
              </div>
            </template>
            <template v-else>
              <img src="/department.svg" alt="Department" class="w-5 h-5 object-contain opacity-65" />
              <span class="text-sm">Select College</span>
            </template>
          </button>

          <div class="text-center">
            <button type="button" @click="showForgotPasswordModal = true" class="text-sm text-blue-500 hover:text-blue-700 font-medium">
              forgot your password?
            </button>
          </div>

          <button type="submit" :disabled="isLoading || !chosenDepartment" class="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 px-6 rounded-full font-semibold hover:from-blue-700 hover:to-blue-500 transition duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed tracking-wide uppercase text-sm shadow-md">
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
          <div class="bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 px-6 py-5 flex items-center justify-between flex-shrink-0">
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
              <button @click="requestResetCode" :disabled="resetLoading || !resetStudentId.trim() || !resetEmail.trim()" class="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white py-3 px-6 rounded-full font-semibold hover:from-blue-800 hover:via-blue-700 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
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
              <button @click="verifyResetCode" :disabled="resetLoading || resetCode.length !== 6" class="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white py-3 px-6 rounded-full font-semibold hover:from-blue-800 hover:via-blue-700 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
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
              <button @click="completePasswordReset" :disabled="resetLoading || !newPassword || newPassword !== confirmNewPassword" class="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white py-3 px-6 rounded-full font-semibold hover:from-blue-800 hover:via-blue-700 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
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

// Get current user's program for program availability checking
const currentUserProgram = computed(() => {
  try {
    const userJson = localStorage.getItem('currentUser') || localStorage.getItem('user')
    const user = userJson ? JSON.parse(userJson) : {}
    return user.program || null
  } catch (e) {}
  return null
})

// Check if current user's program is available in selected department
const isProgramAvailable = computed(() => {
  if (!currentUserProgram.value || !selectedDepartment.value) return false
  return selectedDepartment.value.programs.some(p => p.shortName === currentUserProgram.value)
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
const showCollegeMismatch = ref(false)
const mismatchCollege = ref('')
const mismatchMessage = ref('')
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

const mismatchLogo = computed(() => {
  try {
    const label = (mismatchCollege.value || '').toUpperCase()
    const dept = departments.find(d => d.label === label)
    return dept ? dept.logo : '/icons/ccs.svg'
  } catch (e) {
    return '/icons/ccs.svg'
  }
})

const goToCollegePortal = () => {
  try {
    const label = (mismatchCollege.value || '').toUpperCase()
    const dept = departments.find(d => d.label === label)
    if (dept) {
      chosenDepartment.value = dept
      try { localStorage.setItem('loginChosenDepartment', dept.label) } catch (e) {}
    }
  } finally {
    showCollegeMismatch.value = false
  }
}

// Accessibility & focus management for mismatch modal
const collegeMismatchModal = ref(null)
const mismatchPrimary = ref(null)

const handleMismatchKeydown = (e) => {
  if (!showCollegeMismatch.value) return
  if (e.key === 'Escape') {
    showCollegeMismatch.value = false
  }
}

watch(showCollegeMismatch, async (val) => {
  if (val) {
    await nextTick()
    // prefer focusing primary action for quick keyboard access
    if (mismatchPrimary.value && typeof mismatchPrimary.value.focus === 'function') {
      mismatchPrimary.value.focus()
    } else if (collegeMismatchModal.value && typeof collegeMismatchModal.value.focus === 'function') {
      collegeMismatchModal.value.focus()
    }
  }
})

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

// Department Selector
const showDepartmentModal = ref(false)
const selectedDepartment = ref(null)

// chosen selections to show on main UI
const chosenDepartment = ref(null)
const chosenProgram = ref(null)
const apiFallbackUsed = ref(false)

const chooseDepartment = (dept) => {
  // choose the department and auto-select the first program
  chosenDepartment.value = dept
  chosenProgram.value = (dept.programs && dept.programs.length) ? dept.programs[0] : null
  showDepartmentModal.value = false
  // clear any transient selection state
  selectedDepartment.value = null
  // persist selection so API module can pick COE endpoint pre-login
  try { localStorage.setItem('loginChosenDepartment', dept.label) } catch (e) {}
  if (chosenProgram.value) try { localStorage.setItem('loginChosenProgram', chosenProgram.value.shortName) } catch (e) {}
}

const selectProgram = (program) => {
  console.log('Selected program:', program)
  // set chosen program and close modal
  chosenProgram.value = program
  // ensure chosenDepartment is set (in case user navigated to programs)
  if (selectedDepartment.value) chosenDepartment.value = selectedDepartment.value
  showDepartmentModal.value = false
  selectedDepartment.value = null
  try { localStorage.setItem('loginChosenProgram', program.shortName) } catch (e) {}
  if (chosenDepartment.value) try { localStorage.setItem('loginChosenDepartment', chosenDepartment.value.label) } catch (e) {}
}

const confirmDepartment = () => {
  // set the chosen department only, no program selection
  chosenDepartment.value = selectedDepartment.value
  chosenProgram.value = null
  showDepartmentModal.value = false
  selectedDepartment.value = null
  try { localStorage.setItem('loginChosenDepartment', chosenDepartment.value ? chosenDepartment.value.label : '') } catch (e) {}
  try { localStorage.removeItem('loginChosenProgram') } catch (e) {}
}

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
  // Check if department is selected
  if (!chosenDepartment.value) {
    errorMessage.value = "Please select a department to continue."
    showErrorNotification.value = true
    return
  }

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
          'Authorization': `Bearer SSAAMRegJRMSU`,
          // include college selection so backend knows where to store the session
          // token (previously masters always went to CCS because no header was sent)
          'X-SSAAM-College': chosenDepartment.value ? chosenDepartment.value.label : ''
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
      // Use POST login endpoint for students (safeFetch will fallback if network fails)
      const response = await safeFetch('/apis/students/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer SSAAMStudents`,
          'X-SSAAM-College': chosenDepartment.value.label
        },
        body: JSON.stringify({
          student_id: enteredId,
          last_name: enteredPass,
          _ssaam_access_token: encodeTimestamp()
        })
      });
      const data = await response.json();
      console.log("API STUDENT LOGIN RESPONSE:", data);

      // If backend returned 403 and a college-mismatch message, show dedicated modal
      if (response.status === 403 && data && typeof data.message === 'string' && /belongs to the/i.test(data.message)) {
        const match = data.message.match(/belongs to the ([A-Za-z]+)/i);
        mismatchCollege.value = match ? match[1].toUpperCase() : (chosenDepartment.value ? chosenDepartment.value.label : 'CCS');
        mismatchMessage.value = data.message;
        showCollegeMismatch.value = true;
        isLoading.value = false;
        return;
      }

      if (data.student && data.message === "Login successful") {
        user = data.student;
        user.token = data.token; // Token is returned at top level, not inside student object
        user.requiresPasswordUpdate = data.requiresPasswordUpdate || false;
      } else if (data.message) {
        errorMessage.value = data.accountPending 
          ? "Your account is pending approval. Please wait for an admin to approve your registration. You will receive an email notification once approved."
          : data.message;
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
        yearLevel: user.year_level || '',
        semester: user.semester || '',
        schoolYear: user.school_year || '',
        program: user.program || '',
        role: startsWithLetter ? 'master' : (user.role || 'student'),
        image: user.photo || user.image || '',
        isMaster: startsWithLetter,
        token: user.token || '',
        requiresPasswordUpdate: user.requiresPasswordUpdate || false,
        selectedDepartment: chosenDepartment.value
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
  const correctCode = `${day}${month}${year}`;
  const enteredCode = verificationDigits.value.join('');

  if (enteredCode === correctCode) {
    showVerificationModal.value = false;
    verificationError.value = false;
    verificationErrorMessage.value = '';
    // Only now store the sensitive data
    localStorage.setItem("currentUser", JSON.stringify(pendingUser));
    localStorage.setItem("authToken", pendingUser.token);
    console.log("Admin Verification Success. Navigating to dashboard...");
    isLoading.value = true;
    isNavigationPending.value = true;
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
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%), url('/classroom-bg.jpg');
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

.bubble-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.bubble {
  position: absolute;
  bottom: -80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.25);
  animation: float-up linear infinite;
}

@keyframes float-up {
  0%   { transform: translateY(0) scale(1);   opacity: 0; }
  8%   { opacity: 1; }
  88%  { opacity: 0.7; }
  100% { transform: translateY(-110vh) scale(0.75); opacity: 0; }
}

.mobile-bg-panel {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%), url('/classroom-bg.jpg');
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

</style> 
<style scoped>
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
  background-image: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
}
.modal-primary:hover { box-shadow: 0 12px 30px rgba(37,99,235,0.18); }
.modal-secondary:hover { box-shadow: 0 8px 20px rgba(15,23,42,0.06); }

/* Ensure modal content doesn't get clipped on very small screens */
.modal-primary, .modal-secondary { min-height: 44px; }

</style>