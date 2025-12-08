<template>
  <div v-if="showDevelopersPopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showDevelopersPopup = false">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-purple-900">Meet Our Developers</h3>
        <button @click="showDevelopersPopup = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        <a v-for="dev in developers" :key="dev.name" :href="dev.facebook" target="_blank" rel="noopener noreferrer" class="flex flex-col items-center cursor-pointer hover:transform hover:scale-105 transition">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white text-2xl shadow-lg mb-2 overflow-hidden">
            <img v-if="dev.image" :src="dev.image" :alt="dev.name" class="w-full h-full object-cover" />
            <span v-else>{{ dev.initials }}</span>
          </div>
          <p class="text-xs font-semibold text-purple-600 hover:text-purple-800 text-center">{{ dev.name }}</p>
          <p class="text-xs text-gray-600 text-center font-medium">{{ dev.year_level }} - {{ dev.program }}</p>
          <p class="text-xs text-gray-500 text-center">{{ dev.role }}</p>
        </a>
      </div>
      <div class="text-center text-sm text-gray-600">
        <p class="font-medium text-purple-900">CCS - Creatives Committee</p>
        <p>Chairperson: Sheen Lee</p>
      </div>
    </div>
  </div>

  <div v-if="isRegistering" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
      <svg class="animate-spin h-16 w-16 mx-auto mb-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-xl font-semibold text-purple-900">{{ loadingMessage }}</p>
      <p class="text-sm text-gray-600 mt-2">{{ loadingSubMessage }}</p>
    </div>
  </div>

  <div v-if="showNotification" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform transition-all">
      <div class="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
        <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-purple-900 mb-2">Success!</h3>
      <p class="text-gray-600">{{ notificationMessage }}</p>
      <p class="text-sm text-gray-500 mt-4">Redirecting to login...</p>
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

  <div v-if="registerDisabled" class="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 py-3 px-4 text-center z-30 shadow-md">
    <div class="flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span class="font-medium text-sm">{{ registerDisabledMessage || 'Registration is currently disabled.' }}</span>
    </div>
  </div>

  <div class="hidden md:flex min-h-screen bg-white">
    <div class="desktop-bg-panel">
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
        <div class="text-center mb-8">
          <div class="flex items-center justify-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-400 flex items-center justify-center flex-shrink-0">
              <img src="/user_plus.svg" alt="Register" class="w-7 h-7" style="filter: brightness(0) invert(1);" />
            </div>
            <div class="text-left">
              <h2 class="text-2xl font-bold text-purple-900">Let's Create</h2>
              <h2 class="text-2xl font-bold text-purple-900">Your Profile!</h2>
            </div>
          </div>
          <p class="text-gray-600 text-sm italic mb-4">Please provide your basic information.</p>
          <p class="text-sm font-semibold text-purple-900">
            {{ stepTitle }}
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-8">
          <div class="flex mb-6 border-b border-gray-200">
            <button @click="goToLogin" class="flex-1 py-3 px-4 text-center font-medium text-gray-500 hover:text-gray-700">
              Log In
            </button>
            <button class="flex-1 py-3 px-4 text-center font-medium border-b-2 border-purple-600 text-purple-600 flex items-center justify-center gap-1">
              <img src="/register_user.svg" alt="Register" class="w-5 h-5" /> Register
            </button>
          </div>

          <form @submit.prevent="handleNext" novalidate class="space-y-4">

            <div v-if="currentStep === 1" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <div class="relative">
                  <img src="/user.svg" alt="First Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <input v-model="formData.first_name" @input="formData.first_name = formData.first_name.toUpperCase()" type="text" placeholder="JUAN" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none uppercase" required />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Middle Name <span class="text-gray-500 text-xs">(optional)</span></label>
                <div class="relative">
                  <img src="/user.svg" alt="Middle Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <input v-model="formData.middle_name" @input="formData.middle_name = formData.middle_name.toUpperCase()" type="text" placeholder="DELA" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none uppercase" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <div class="relative">
                  <img src="/user.svg" alt="Last Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <input v-model="formData.last_name" @input="formData.last_name = formData.last_name.toUpperCase()" type="text" placeholder="CRUZ" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Suffix <span class="text-gray-500 text-xs">(optional)</span></label>
                <div class="relative">
                  <select v-model="formData.suffix" class="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white">
                    <option value="">Select Suffix</option>
                    <option value="Jr.">Jr.</option>
                    <option value="Sr.">Sr.</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                    <option value="VI">VI</option>
                    <option value="VII">VII</option>
                    <option value="VIII">VIII</option>
                    <option value="IX">IX</option>
                    <option value="X">X</option>
                  </select>
                  <img src="/arrow_down.svg" alt="Dropdown" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <div class="relative">
                  <img src="/mail.svg" alt="Email" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <input v-model="formData.email" type="email" placeholder="juandelacruz@gmail.com" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
                </div>
              </div>
              <div class="flex items-center justify-center pt-4">
                <div class="flex space-x-2">
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-gray-300 rounded"></div>
                  <div class="w-12 h-1 bg-gray-300 rounded"></div>
                  <div class="w-12 h-1 bg-gray-300 rounded"></div>
                </div>
              </div>
              <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center">
                Next <span class="ml-2">→</span>
              </button>
            </div>

            <div v-if="currentStep === 2" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                <div class="relative">
                  <img src="/user.svg" alt="Student ID" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <input v-model="formData.student_id" @input="formData.student_id = formatStudentId(formData.student_id)" type="text" placeholder="00-A-00000" maxlength="10" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none uppercase" required />
                </div>
                <p class="text-xs text-gray-400 mt-1 pl-10">Format: 00-A-00000</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                <div class="relative">
                  <img src="/book.svg" alt="Year Level" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <select v-model="formData.year_level" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white" required>
                    <option value="" disabled>Select Year Level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Program</label>
                <div class="relative">
                  <img src="/course.svg" alt="Program" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <select v-model="formData.program" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white" required>
                    <option value="" disabled>Select Program</option>
                    <option value="BSCS">BSCS</option>
                    <option value="BSIS">BSIS</option>
                    <option value="BSIT">BSIT</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <div class="relative">
                    <img src="/calendar.svg" alt="Semester" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                    <select v-model="formData.semester" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white text-sm" required>
                      <option value="" disabled>Semester</option>
                      <option value="1st Sem">1st Sem</option>
                      <option value="2nd Sem">2nd Sem</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">School Year</label>
                  <div class="relative">
                    <img src="/event_note.svg" alt="School Year" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                    <select v-model="formData.school_year" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white text-sm" required>
                      <option value="" disabled>Year</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-center pt-4">
                <div class="flex space-x-2">
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-gray-300 rounded"></div>
                  <div class="w-12 h-1 bg-gray-300 rounded"></div>
                </div>
              </div>
              <div class="flex gap-4">
                <button type="button" @click="currentStep--" class="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition duration-300 flex items-center justify-center">
                  <span class="mr-2">←</span>Back
                </button>
                <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center">
                  Next <span class="ml-2">→</span>
                </button>
              </div>
            </div>

            <div v-if="currentStep === 3" class="space-y-4">
              <div class="text-center">
                <div class="w-48 h-48 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
                  <div v-else class="flex flex-col items-center justify-center">
                    <div class="w-24 h-24 rounded-full bg-gray-400 mb-4"></div>
                    <div class="w-32 h-20 bg-gray-500 rounded-t-full"></div>
                  </div>
                </div>
                <label class="block text-sm font-medium text-gray-700 mb-4">Upload Image</label>
                <div class="relative">
                  <input type="file" @change="handleImageUpload" accept="image/*" class="hidden" id="file-upload" />
                  <label for="file-upload" class="cursor-pointer inline-flex items-center justify-center px-8 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-300">
                    <span class="mr-2">📷</span>{{ imagePreview ? 'Change Image' : 'No File Chosen' }}
                  </label>
                </div>
              </div>
              <div class="flex items-center justify-center pt-4">
                <div class="flex space-x-2">
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-gray-300 rounded"></div>
                </div>
              </div>
              <div class="flex gap-4">
                <button type="button" @click="currentStep--" class="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition duration-300 flex items-center justify-center">
                  <span class="mr-2">←</span>Back
                </button>
                <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center">
                  Send Code <span class="ml-2">→</span>
                </button>
              </div>
            </div>

            <div v-if="currentStep === 4" class="space-y-4">
              <div class="text-center mb-4">
                <div class="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <img src="/mail.svg" alt="Email" class="w-8 h-8" />
                </div>
                <h3 class="text-lg font-semibold text-purple-900 mb-2">Verify Your Email</h3>
                <p class="text-sm text-gray-600">We've sent a 6-digit verification code to:</p>
                <p class="text-sm font-medium text-purple-600 mt-1">{{ formData.email }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2 text-center">Enter Verification Code</label>
                <div class="flex justify-center gap-2">
                  <input 
                    v-for="(digit, index) in verificationCode" 
                    :key="index"
                    v-model="verificationCode[index]"
                    type="text"
                    maxlength="1"
                    @input="handleCodeInput(index, $event)"
                    @keydown="handleCodeKeydown(index, $event)"
                    @paste="handleCodePaste($event)"
                    :ref="el => codeInputs[index] = el"
                    class="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none"
                  />
                </div>
                <p class="text-xs text-gray-500 mt-3 text-center">Code expires in 10 minutes</p>
              </div>
              <div class="flex items-center justify-center pt-2">
                <button type="button" @click="resendCode" :disabled="resendCooldown > 0" class="text-sm text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                  {{ resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code' }}
                </button>
              </div>
              <div class="flex items-center justify-center pt-4">
                <div class="flex space-x-2">
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                  <div class="w-12 h-1 bg-purple-600 rounded"></div>
                </div>
              </div>
              <div class="flex gap-4">
                <button type="button" @click="currentStep = 3" class="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition duration-300 flex items-center justify-center">
                  <span class="mr-2">←</span>Back
                </button>
                <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center">
                  Register <span class="ml-2">→</span>
                </button>
              </div>
            </div>
          </form>

          <div class="mt-6 text-center text-xs text-gray-500">
            Powered by <button @click="showDevelopersPopup = true" class="text-yellow-500 font-medium hover:text-yellow-600 cursor-pointer">CCS - Creatives Committee</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mobile-bg-panel md:hidden min-h-screen flex flex-col">

    <div class="text-center text-white pt-12 pb-8 px-4 relative z-10">
      <div v-if="currentStep !== 3 && currentStep !== 4" class="w-16 h-16 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
        <img src="/user_plus.svg" alt="Register" class="w-10 h-10" style="filter: brightness(0) invert(1);" />
      </div>
      <h1 class="text-3xl font-bold mb-2">Let's Create</h1>
      <h2 class="text-3xl font-bold mb-4">Your Profile!</h2>
      <p class="text-sm opacity-90 italic mb-4">Please provide your basic information.</p>
      <p class="text-base font-semibold">
        {{ stepTitle }}
      </p>
    </div>

    <div class="flex-1 bg-white rounded-t-3xl shadow-2xl px-6 py-8 overflow-auto">
      <div class="max-w-md mx-auto">

        <div class="flex mb-8 bg-gray-100 rounded-lg p-1">
          <button @click="goToLogin" class="flex-1 py-3 px-4 text-center font-medium text-gray-500 hover:text-gray-700">
            Log In
          </button>
          <button class="flex-1 py-3 px-4 text-center font-medium rounded-md bg-white text-purple-600 shadow-sm flex items-center justify-center gap-1">
            <img src="/register_user.svg" alt="Register" class="w-5 h-5" /> Register
          </button>
        </div>

        <form @submit.prevent="handleNext" novalidate class="space-y-4">

          <div v-if="currentStep === 1" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <div class="relative">
                <img src="/user.svg" alt="First Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input v-model="formData.first_name" @input="formData.first_name = formData.first_name.toUpperCase()" type="text" placeholder="JUAN" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none uppercase" required />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Middle Name <span class="text-gray-500 text-xs">(optional)</span></label>
              <div class="relative">
                <img src="/user.svg" alt="Middle Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input v-model="formData.middle_name" @input="formData.middle_name = formData.middle_name.toUpperCase()" type="text" placeholder="DELA" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none uppercase" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <div class="relative">
                <img src="/user.svg" alt="Last Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input v-model="formData.last_name" @input="formData.last_name = formData.last_name.toUpperCase()" type="text" placeholder="CRUZ" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none uppercase" required />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Suffix <span class="text-gray-500 text-xs">(optional)</span></label>
              <div class="relative">
                <select v-model="formData.suffix" class="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white">
                  <option value="">Select Suffix</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Sr.">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                </select>
                <img src="/arrow_down.svg" alt="Dropdown" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div class="relative">
                <img src="/mail.svg" alt="Email" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input v-model="formData.email" type="email" placeholder="juandelacruz@gmail.com" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
              </div>
            </div>
            <div class="flex items-center justify-center pt-4">
              <div class="flex space-x-2">
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-gray-300 rounded"></div>
                <div class="w-12 h-1 bg-gray-300 rounded"></div>
                <div class="w-12 h-1 bg-gray-300 rounded"></div>
              </div>
            </div>
            <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center">
              Next <span class="ml-2">→</span>
            </button>
          </div>

          <div v-if="currentStep === 2" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <div class="relative">
                <img src="/user.svg" alt="Student ID" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input v-model="formData.student_id" @input="formData.student_id = formatStudentId(formData.student_id)" type="text" placeholder="00-A-00000" maxlength="10" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none uppercase" required />
              </div>
              <p class="text-xs text-gray-400 mt-1">Format: 00-A-00000</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
              <div class="relative">
                <img src="/book.svg" alt="Year Level" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <select v-model="formData.year_level" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white" required>
                  <option value="" disabled>Select Year Level</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Program</label>
              <div class="relative">
                <img src="/course.svg" alt="Program" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <select v-model="formData.program" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white" required>
                  <option value="" disabled>Select Program</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIS">BSIS</option>
                  <option value="BSIT">BSIT</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <div class="relative">
                  <img src="/calendar.svg" alt="Semester" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                  <select v-model="formData.semester" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white text-sm" required>
                    <option value="" disabled>Semester</option>
                    <option value="1st Sem">1st Sem</option>
                    <option value="2nd Sem">2nd Sem</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">School Year</label>
                <div class="relative">
                  <img src="/event_note.svg" alt="School Year" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                  <select v-model="formData.school_year" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white text-sm" required>
                    <option value="" disabled>Year</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-center pt-4">
              <div class="flex space-x-2">
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-gray-300 rounded"></div>
                <div class="w-12 h-1 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div class="flex gap-4">
              <button type="button" @click="currentStep--" class="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition duration-300 flex items-center justify-center">
                <span class="mr-2">←</span>Back
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center">
                Next <span class="ml-2">→</span>
              </button>
            </div>
          </div>

          <div v-if="currentStep === 3" class="space-y-4">
            <div class="text-center">
              <div class="w-48 h-48 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
                <div v-else class="flex flex-col items-center justify-center">
                  <div class="w-24 h-24 rounded-full bg-gray-400 mb-4"></div>
                  <div class="w-32 h-20 bg-gray-500 rounded-t-full"></div>
                </div>
              </div>
              <label class="block text-sm font-medium text-gray-700 mb-4">Upload Image</label>
              <div class="relative">
                <input type="file" @change="handleImageUpload" accept="image/*" class="hidden" id="file-upload-mobile" />
                <label for="file-upload-mobile" class="cursor-pointer inline-flex items-center justify-center px-8 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-300">
                  <span class="mr-2">📷</span>{{ imagePreview ? 'Change Image' : 'No File Chosen' }}
                </label>
              </div>
            </div>
            <div class="flex items-center justify-center pt-4">
              <div class="flex space-x-2">
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div class="flex gap-4">
              <button type="button" @click="currentStep--" class="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition duration-300 flex items-center justify-center">
                <span class="mr-2">←</span>Back
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center">
                Send Code <span class="ml-2">→</span>
              </button>
            </div>
          </div>

          <div v-if="currentStep === 4" class="space-y-4">
            <div class="text-center mb-4">
              <div class="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <img src="/mail.svg" alt="Email" class="w-8 h-8" />
              </div>
              <h3 class="text-lg font-semibold text-purple-900 mb-2">Verify Your Email</h3>
              <p class="text-sm text-gray-600">We've sent a 6-digit verification code to:</p>
              <p class="text-sm font-medium text-purple-600 mt-1">{{ formData.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 text-center">Enter Verification Code</label>
              <div class="flex justify-center gap-2">
                <input 
                  v-for="(digit, index) in verificationCode" 
                  :key="index"
                  v-model="verificationCode[index]"
                  type="text"
                  maxlength="1"
                  @input="handleCodeInput(index, $event)"
                  @keydown="handleCodeKeydown(index, $event)"
                  @paste="handleCodePaste($event)"
                  :ref="el => codeInputsMobile[index] = el"
                  class="w-10 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none"
                />
              </div>
              <p class="text-xs text-gray-500 mt-3 text-center">Code expires in 10 minutes</p>
            </div>
            <div class="flex items-center justify-center pt-2">
              <button type="button" @click="resendCode" :disabled="resendCooldown > 0" class="text-sm text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                {{ resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code' }}
              </button>
            </div>
            <div class="flex items-center justify-center pt-4">
              <div class="flex space-x-2">
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
                <div class="w-12 h-1 bg-purple-600 rounded"></div>
              </div>
            </div>
            <div class="flex gap-4">
              <button type="button" @click="currentStep = 3" class="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition duration-300 flex items-center justify-center">
                <span class="mr-2">←</span>Back
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition duration-300 flex items-center justify-center">
                Register <span class="ml-2">→</span>
              </button>
            </div>
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
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import jrmsuLogo from '../assets/jrmsu-logo.webp'
import { encodeTimestamp } from '../utils/ssaamCrypto.js'

const router = useRouter()
const currentStep = ref(1)
const imagePreview = ref('')
const showDevelopersPopup = ref(false)
const registerDisabled = ref(false)
const registerDisabledMessage = ref('')

const verificationCode = ref(['', '', '', '', '', ''])
const codeInputs = ref([])
const codeInputsMobile = ref([])
const resendCooldown = ref(0)
let resendTimer = null

const loadingMessage = ref('Processing...')
const loadingSubMessage = ref('Please wait')

const stepTitle = computed(() => {
  switch (currentStep.value) {
    case 1: return 'Step 1 - Personal Information'
    case 2: return 'Step 2 - School Information'
    case 3: return 'Step 3 - Photo Upload'
    case 4: return 'Step 4 - Email Verification'
    default: return ''
  }
})

onMounted(async () => {
  try {
    const response = await fetch('https://ssaam-api.vercel.app/apis/settings', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer SSAAMStudents'
      }
    })
    const data = await response.json()
    if (response.ok && data.userRegister) {
      registerDisabled.value = !data.userRegister.register
      registerDisabledMessage.value = data.userRegister.message || 'Registration is currently disabled. Please try again later.'
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
  }
})

const developers = [
  { name: 'Jullan Maglinte', initials: 'JM', role: 'Fullstack Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/jullan.maglinte', image: '/team/jullan.jpg' },
  { name: 'Keith Laranjo', initials: 'KL', role: 'Backend Dev', year_level: '2nd year', program: 'CS', facebook: 'https://facebook.com/kei.takun.5070', image: '/team/keith.jpg' },
  { name: 'Kenzen Miñao', initials: 'KM', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/kenzen3131', image: '/team/kenzen.jpg' },
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
  semester: '',
  school_year: '',
  email: ''
})

const isUploading = ref(false)
const previousStudentIdLength = ref(0)

const imgbbApiKeys = [
  "b6a37178abd163036357a7ba35fd0364",
  "3b523af3b0ffb526efddfb51b8928581"
]

const getRandomApiKey = () => {
  return imgbbApiKeys[Math.floor(Math.random() * imgbbApiKeys.length)]
}

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
            canvas.toBlob(resolve, 'image/jpeg', 0.1)
            return
          }
          
          canvas.toBlob((blob) => {
            const sizeInKB = blob.size / 1024
            
            if (sizeInKB <= targetSizeKB) {
              resolve(blob)
            } else {
              quality -= 0.06
              attempts++
              if (quality >= 0.05) {
                tryCompress()
              } else {
                resolve(blob)
              }
            }
          }, 'image/jpeg', quality)
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
    const compressedBlob = await compressImage(file)
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const apiKey = getRandomApiKey()
        const uploadForm = new FormData()
        uploadForm.append("key", apiKey)
        uploadForm.append("image", compressedBlob, "photo.jpg")

        const res = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: uploadForm,
        })

        const data = await res.json()

        if (data.success) {
          formData.photo = data.data.url
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

  const response = await fetch('https://ssaam-api.vercel.app/apis/students/send-verification', {
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errorMessage.value = "Please enter a valid email address."
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
      errorMessage.value = "Student ID must follow format: 18-A-12345 (2 digits, hyphen, 1 letter, hyphen, 5 digits)."
      showErrorNotification.value = true
      return
    }
    const yearPrefix = parseInt(formData.student_id.substring(0, 2), 10)
    if (yearPrefix < 18 || yearPrefix > 25) {
      errorMessage.value = "Student ID must start with 18 to 25 (e.g., 18-A-12345 to 25-A-12345)."
      showErrorNotification.value = true
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
    if (!['BSCS', 'BSIT', 'BSIS'].includes(formData.program)) {
      errorMessage.value = "Program must be BSCS, BSIT, or BSIS."
      showErrorNotification.value = true
      return
    }
    if (!formData.semester) {
      errorMessage.value = "Please select your Semester."
      showErrorNotification.value = true
      return
    }
    if (!formData.school_year) {
      errorMessage.value = "Please select your School Year."
      showErrorNotification.value = true
      return
    }
  }

  if (currentStep.value === 3) {
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
      const response = await fetch('https://ssaam-api.vercel.app/apis/students/verify-and-register', {
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
        errorMessage.value = data.message || "Registration failed. Please try again."
        showErrorNotification.value = true
      }
    } catch (error) {
      isRegistering.value = false
      errorMessage.value = "Server error. Please try again later."
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
