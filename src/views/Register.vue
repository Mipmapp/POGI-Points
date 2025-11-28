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
      <p class="text-xl font-semibold text-purple-900">Registering...</p>
      <p class="text-sm text-gray-600 mt-2">Please wait while we create your account</p>
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
              <img src="/register_user.svg" alt="Register" class="w-7 h-7" style="filter: brightness(0) invert(1);" />
            </div>
            <div class="text-left">
              <h2 class="text-2xl font-bold text-purple-900">Let's Create</h2>
              <h2 class="text-2xl font-bold text-purple-900">Your Profile!</h2>
            </div>
          </div>
          <p class="text-gray-600 text-sm italic mb-4">Please provide your basic information.</p>
          <p class="text-sm font-semibold text-purple-900">
            {{ currentStep === 1 ? 'Step 1 - Personal Information' : currentStep === 2 ? 'Step 2 - School Information' : 'Step 3 - Photo Upload' }}
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
                  <input v-model="formData.first_name" type="text" placeholder="Juan" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Middle Name <span class="text-gray-500 text-xs">(optional)</span></label>
                <div class="relative">
                  <img src="/user.svg" alt="Middle Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <input v-model="formData.middle_name" type="text" placeholder="Dela" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <div class="relative">
                  <img src="/user.svg" alt="Last Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <input v-model="formData.last_name" type="text" placeholder="Cruz" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
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
                  <div class="w-16 h-1 bg-purple-600 rounded"></div>
                  <div class="w-16 h-1 bg-gray-300 rounded"></div>
                  <div class="w-16 h-1 bg-gray-300 rounded"></div>
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
                  <input v-model="formData.student_id" type="text" placeholder="25-A-12345" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">RFID Code <span class="text-gray-500 text-xs">(optional)</span></label>
                <div class="relative">
                  <img src="/detector.svg" alt="RFID Code" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <input v-model="formData.rfid_code" type="text" placeholder="12345678" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                <div class="relative">
                  <img src="/book.svg" alt="Year Level" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <select v-model="formData.year_level" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white" required>
                    <option value="" disabled>Select Year Level</option>
                    <option value="1st year">1st year</option>
                    <option value="2nd year">2nd year</option>
                    <option value="3rd year">3rd year</option>
                    <option value="4th year">4th year</option>
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
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
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
                  <div class="w-16 h-1 bg-purple-600 rounded"></div>
                  <div class="w-16 h-1 bg-purple-600 rounded"></div>
                  <div class="w-16 h-1 bg-gray-300 rounded"></div>
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
                  <div class="w-16 h-1 bg-purple-600 rounded"></div>
                  <div class="w-16 h-1 bg-purple-600 rounded"></div>
                  <div class="w-16 h-1 bg-purple-600 rounded"></div>
                </div>
              </div>
              <div class="flex gap-4">
                <button type="button" @click="currentStep--" class="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition duration-300 flex items-center justify-center">
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
      <div v-if="currentStep !== 3" class="w-16 h-16 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
        <img src="/register_user.svg" alt="Register" class="w-10 h-10" style="filter: brightness(0) invert(1);" />
      </div>
      <h1 class="text-3xl font-bold mb-2">Let's Create</h1>
      <h2 class="text-3xl font-bold mb-4">Your Profile!</h2>
      <p class="text-sm opacity-90 italic mb-4">Please provide your basic information.</p>
      <p class="text-base font-semibold">
        {{ currentStep === 1 ? 'Step 1 - Personal Information' : currentStep === 2 ? 'Step 2 - School Information' : 'Step 3 - Photo Upload' }}
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
                <input v-model="formData.first_name" type="text" placeholder="Juan" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Middle Name <span class="text-gray-500 text-xs">(optional)</span></label>
              <div class="relative">
                <img src="/user.svg" alt="Middle Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input v-model="formData.middle_name" type="text" placeholder="Dela" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <div class="relative">
                <img src="/user.svg" alt="Last Name" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input v-model="formData.last_name" type="text" placeholder="Cruz" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
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
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">✉️</span>
                <input v-model="formData.email" type="email" placeholder="juandelacruz@gmail.com" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
              </div>
            </div>
            <div class="flex items-center justify-center pt-4">
              <div class="flex space-x-2">
                <div class="w-16 h-1 bg-purple-600 rounded"></div>
                <div class="w-16 h-1 bg-gray-300 rounded"></div>
                <div class="w-16 h-1 bg-gray-300 rounded"></div>
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
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
                <input v-model="formData.student_id" type="text" placeholder="25-A-12345" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">RFID Code <span class="text-gray-500 text-xs">(optional)</span></label>
              <div class="relative">
                <img src="/detector.svg" alt="RFID Code" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <input v-model="formData.rfid_code" type="text" placeholder="12345678" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none" required />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
              <div class="relative">
                <img src="/book.svg" alt="Year Level" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                <select v-model="formData.year_level" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white" required>
                  <option value="" disabled>Select Year Level</option>
                  <option value="1st year">1st year</option>
                  <option value="2nd year">2nd year</option>
                  <option value="3rd year">3rd year</option>
                  <option value="4th year">4th year</option>
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
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
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
                <div class="w-16 h-1 bg-purple-600 rounded"></div>
                <div class="w-16 h-1 bg-purple-600 rounded"></div>
                <div class="w-16 h-1 bg-gray-300 rounded"></div>
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
                <div class="w-16 h-1 bg-purple-600 rounded"></div>
                <div class="w-16 h-1 bg-purple-600 rounded"></div>
                <div class="w-16 h-1 bg-purple-600 rounded"></div>
              </div>
            </div>
            <div class="flex gap-4">
              <button type="button" @click="currentStep--" class="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition duration-300 flex items-center justify-center">
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import jrmsuLogo from '../assets/jrmsu-logo.webp'

const router = useRouter()
const currentStep = ref(1)
const imagePreview = ref('')
const showDevelopersPopup = ref(false)

  const developers = [
    { name: 'Jullan Maglinte', initials: 'JM', role: 'Backend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/jullan.maglinte', image: '/team/jullan.jpg' },
    { name: 'Keith Laranjo', initials: 'KL', role: 'Backend Dev', year_level: '2nd year', program: 'CS', facebook: 'https://facebook.com/kei.takun.5070', image: '/team/keith.jpg' },
    { name: 'Kenzen Miñao', initials: 'KM', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/kenzen3131', image: '/team/kenzen.jpg' },
    { name: 'Christoph Bagabuyo', initials: 'CB', role: 'Frontend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/christoph.bagabuyo', image: '/team/christoph.jpg' },
    { name: 'Mischi Jeda Elumba', initials: 'MJ', role: 'UI/UX Designer', year_level: '2nd year', program: 'IS', facebook: 'https://facebook.com/mischijeda.elumba.1', image: '/team/mischi.jpg' }
  ]

const formData = reactive({
  student_id: '',
  rfid_code: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  year_level: '',
  suffix: '',
  program: '',
  photo: '',
  semester: '',
})

const isUploading = ref(false);

// ImgBB API Keys (randomly selected to distribute traffic)
const imgbbApiKeys = [
  "b6a37178abd163036357a7ba35fd0364",
  "3b523af3b0ffb526efddfb51b8928581"
];

// Get random ImgBB API key
const getRandomApiKey = () => {
  return imgbbApiKeys[Math.floor(Math.random() * imgbbApiKeys.length)];
};

// Compress image to 1MB or below while maintaining quality
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate dimensions to maintain aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1920;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try compression with decreasing quality until under 1MB
        let quality = 0.9;
        let compressedBlob;
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryCompress = () => {
          if (attempts >= maxAttempts) {
            canvas.toBlob(resolve, 'image/jpeg', 0.3); // Final fallback
            return;
          }
          
          canvas.toBlob((blob) => {
            const sizeInMB = blob.size / (1024 * 1024);
            console.log(`Compression attempt ${attempts + 1}: ${sizeInMB.toFixed(2)}MB at quality ${quality}`);
            
            if (sizeInMB <= 1) {
              resolve(blob);
            } else {
              quality -= 0.08;
              attempts++;
              if (quality >= 0.1) {
                tryCompress();
              } else {
                resolve(blob); // Use best available
              }
            }
          }, 'image/jpeg', quality);
        };
        
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);

  isUploading.value = true;
  formData.photo = "";

  try {
    // Compress image to 1MB or below
    const compressedBlob = await compressImage(file);
    const sizeInMB = (compressedBlob.size / (1024 * 1024)).toFixed(2);
    console.log(`Final compressed image size: ${sizeInMB}MB`);
    
    // Upload compressed image to imgbb with random key
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
      formData.photo = data.data.url;
      console.log("Uploaded Image URL:", formData.photo);
    } else {
      console.error("Image upload failed:", data);
      errorMessage.value = "Image upload failed. Please try again.";
      showErrorNotification.value = true;
    }
  } catch (error) {
    console.error("Upload error:", error);
    errorMessage.value = "Image upload error. Please try again.";
    showErrorNotification.value = true;
  }

  isUploading.value = false;
};


const showNotification = ref(false)
const notificationMessage = ref('')
const isRegistering = ref(false)
const showErrorNotification = ref(false)
const errorMessage = ref('')

const handleNext = async () => {
  // STEP 1 validation
  if (currentStep.value === 1) {
    if (!formData.first_name || !formData.first_name.trim()) {
      errorMessage.value = "Please provide your first name to continue."
      showErrorNotification.value = true
      return
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.first_name)) {
      errorMessage.value = "First name can only contain letters and spaces."
      showErrorNotification.value = true
      return
    }
    if (formData.middle_name && !/^[a-zA-Z\s]+$/.test(formData.middle_name)) {
      errorMessage.value = "Middle name can only contain letters and spaces."
      showErrorNotification.value = true
      return
    }
    if (!formData.last_name || !formData.last_name.trim()) {
      errorMessage.value = "Please provide your last name to proceed."
      showErrorNotification.value = true
      return
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.last_name)) {
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

  // STEP 2 validation
  if (currentStep.value === 2) {
    if (!formData.student_id || !formData.student_id.trim()) {
      errorMessage.value = "Please enter your Student ID to continue."
      showErrorNotification.value = true
      return
    }
    if (!/^\d{2}-[A-Z]-\d{5}$/.test(formData.student_id)) {
      errorMessage.value = "Student ID must follow format: 12-A-12345 (2 digits, hyphen, 1 letter, hyphen, 5 digits)."
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
  }

  // STEP 3 — final step: submit form
  if (currentStep.value === 3) {
    isRegistering.value = true
    
    while (isUploading.value) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    if (!formData.photo) {
      console.error("Photo missing after upload.")
      isRegistering.value = false
      return
    }

    try {
      const response = await fetch('https://ssaam-api.vercel.app/apis/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      isRegistering.value = false

      if (response.ok) {
        notificationMessage.value = "Your account has been created successfully!"
        showNotification.value = true

        setTimeout(() => {
          showNotification.value = false
          router.push('/') // redirect after showing notification
        }, 3000)
      } else {
        const errorData = await response.json()
        console.error("Error:", errorData)
        errorMessage.value = "Registration failed. Please try again."
        showErrorNotification.value = true
      }
    } catch (error) {
      console.error("Submit error:", error)
      isRegistering.value = false
      errorMessage.value = "Server error. Please try again later."
      showErrorNotification.value = true
    }

    return // stop further execution
  }

  // Go to next step if not final
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const goToLogin = () => {
  router.push('/')
}
</script>