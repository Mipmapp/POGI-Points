<template>
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
    <div class="hidden md:flex w-64 bg-gradient-to-b from-purple-600 to-pink-400 text-white flex-col order-1 border-r-2 border-white border-opacity-20">
      <div class="p-6 border-b border-white border-opacity-20">
        <div class="flex items-center justify-center mb-2">
          <img src="/src/assets/jrmsu-logo.webp" alt="JRMSU CCS Logo" class="w-32 h-32 object-contain drop-shadow-xl" />
        </div>
        <h1 class="text-xl font-bold text-center">SSAAM</h1>
      </div>

      <div class="p-6 border-b border-white border-opacity-20">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-2xl overflow-hidden">
            <div v-if="sidebarImageLoading" class="w-full h-full flex items-center justify-center">
              <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <img v-else-if="currentUser.image || currentUser.photo" :src="currentUser.image || currentUser.photo" alt="Profile" class="w-full h-full object-cover" @load="sidebarImageLoading = false" @error="sidebarImageLoading = false" />
            <img v-else src="/user_admin.svg" alt="Profile" class="w-6 h-6" style="filter: brightness(0) invert(1);" />
          </div>
          <div>
            <p class="text-sm">Welcome back,</p>
            <p class="font-bold">{{ displayName }}!</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4">
        <button @click="currentPage = 'dashboard'" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left', currentPage === 'dashboard' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
          <img src="/home.svg" alt="Dashboard" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
          <span>Dashboard</span>
        </button>
        <button v-if="currentUser.role === 'admin' || currentUser.isMaster" @click="currentPage = 'users'; showMobileMenu = false" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'users' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
          <img src="/user.svg" alt="Users" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
          <span>Manage</span>
        </button>
        <button 
          @click="handleLogoutWithAnimation"
          :class="['flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 w-full text-left mt-2 transition-all duration-300', isLoggingOut ? 'scale-95 opacity-70' : '']"
        >
          <img src="/logout.svg" alt="Log Out" :class="['w-5 h-5 transition-transform duration-300', isLoggingOut ? 'rotate-180' : '']" style="filter: brightness(0) invert(1);" />
          <span>Log Out</span>
        </button>
      </nav>

      <div class="p-4 text-xs text-white opacity-75">
        <p>Powered by</p>
        <button @click="showDevelopersPopup = true" class="text-yellow-300 hover:text-yellow-400 cursor-pointer">CCS - Creatives Committee</button>
      </div>
    </div>

    <!-- Mobile Sidebar (Slide-in menu for mobile) with Animation -->
    <transition name="slide-in">
      <div v-if="showMobileMenu" class="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-600 to-pink-400 text-white flex flex-col z-40 md:hidden shadow-2xl">
        <button @click="showMobileMenu = false" class="p-4 text-right text-2xl hover:text-gray-200">×</button>
        
        <div class="p-6 border-b border-white border-opacity-20">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-2xl overflow-hidden">
              <div v-if="sidebarImageLoading" class="w-full h-full flex items-center justify-center">
                <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <img v-else-if="currentUser.image || currentUser.photo" :src="currentUser.image || currentUser.photo" alt="Profile" class="w-full h-full object-cover" @load="sidebarImageLoading = false" @error="sidebarImageLoading = false" />
              <img v-else src="/user_admin.svg" alt="Profile" class="w-6 h-6" style="filter: brightness(0) invert(1);" />
            </div>
            <div>
              <p class="text-sm">Welcome back,</p>
              <p class="font-bold">{{ displayName }}!</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-4">
          <button @click="currentPage = 'dashboard'" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left', currentPage === 'dashboard' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
            <img src="/home.svg" alt="Dashboard" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
            <span>Dashboard</span>
          </button>
          <button v-if="currentUser.role === 'admin' || currentUser.isMaster" @click="currentPage = 'users'; showMobileMenu = false" :class="['flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left mt-2', currentPage === 'users' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10']">
            <img src="/user.svg" alt="Users" class="w-5 h-5" style="filter: brightness(0) invert(1);" />
            <span>Manage</span>
          </button>
          <button 
            @click="handleLogoutWithAnimation"
            :class="['flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 w-full text-left mt-2 transition-all duration-300', isLoggingOut ? 'scale-95 opacity-70' : '']"
          >
            <img src="/logout.svg" alt="Log Out" :class="['w-5 h-5 transition-transform duration-300', isLoggingOut ? 'rotate-180' : '']" style="filter: brightness(0) invert(1);" />
            <span>Log Out</span>
          </button>
        </nav>

        <div class="p-4 text-xs text-white opacity-75">
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
        <h1 class="hidden md:block text-2xl md:text-4xl font-bold text-purple-900 mb-8 pb-4 border-b-2 border-purple-900">{{ currentPage === 'users' ? 'Manage' : 'Dashboard' }}</h1>

        <!-- User Management Page -->
        <div v-if="currentPage === 'users' && (currentUser.role === 'admin' || currentUser.isMaster)" class="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div class="flex flex-col gap-4 mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 class="text-xl md:text-2xl font-bold text-purple-900">Manage Users</h2>
              <span class="text-sm text-gray-600 whitespace-nowrap">Total: {{ filteredUsers.length }} users</span>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative">
                <select v-model="searchFilter" class="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm">
                  <option value="all">All Fields</option>
                  <option value="student_id">Student ID</option>
                  <option value="first_name">First Name</option>
                  <option value="middle_name">Middle Name</option>
                  <option value="last_name">Last Name</option>
                  <option value="email">Email</option>
                  <option value="rfid_code">RFID Code</option>
                  <option value="program">Program</option>
                  <option value="school_level">School Level</option>
                </select>
                <svg class="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              <div class="flex-1 relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm" />
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
                  <th class="border border-purple-300 px-4 py-3 text-center font-semibold text-purple-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredUsers.length === 0" class="hover:bg-gray-50">
                  <td colspan="6" class="border border-purple-300 px-4 py-8 text-center text-gray-600">No users found matching your search.</td>
                </tr>
                <tr v-for="user in filteredUsers" :key="user.studentId || user.student_id" class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-4 py-3 text-gray-700">{{ user.studentId || user.student_id }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-gray-700">{{ (user.firstName || user.first_name) }} {{ (user.lastName || user.last_name) }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-gray-700">{{ user.email }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-center text-gray-700">{{ user.rfidCode || user.rfid_code || '—' }}</td>
                  <td class="border border-purple-300 px-4 py-3 text-center text-gray-700">{{ user.program }}</td>
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
        </div>

        <!-- Dashboard Page -->
        <div v-if="currentPage === 'dashboard' && currentUser.role !== 'admin' && !currentUser.isMaster" class="bg-white rounded-lg shadow-lg p-4 md:p-8 mb-8">
          <h2 class="text-xl md:text-2xl font-bold text-purple-900 mb-8">My Profile</h2>
          
          <!-- Profile Header Section -->
          <div class="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b-2 border-gray-200">
            <div class="flex flex-col items-center md:items-start">
              <div class="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 shadow-lg">
                <div v-if="profileImageLoading" class="w-full h-full flex items-center justify-center bg-purple-100">
                  <svg class="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <img v-else-if="currentUser.image || currentUser.photo" :src="currentUser.image || currentUser.photo" alt="Profile Picture" class="w-full h-full object-cover" @load="profileImageLoading = false" @error="profileImageLoading = false" />
                <div v-else class="w-full h-full flex items-center justify-center text-6xl text-gray-400">
                  👤
                </div>
              </div>
              <div class="text-center md:text-left">
                <p class="text-2xl font-bold text-purple-900">{{ displayName }}</p>
                <p class="text-sm text-gray-500 mt-1">ID: {{ currentUser.studentId || currentUser.student_id }}</p>
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
              <div class="bg-pink-50 p-4 rounded-lg">
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">RFID Code</p>
                <p class="text-base font-semibold text-gray-900 mt-2">{{ currentUser.rfidCode || currentUser.rfid_code || 'Not provided' }}</p>
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
        </div>

        <div v-if="currentPage === 'dashboard' && (currentUser.role === 'admin' || currentUser.isMaster)" class="bg-white rounded-lg shadow-lg p-4 md:p-8 mb-8">
          <h2 class="text-xl md:text-2xl font-bold text-purple-900 mb-6">Registered Students</h2>

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
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS['1st year'] }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS['1st year'] }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT['1st year'] }}</td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-6 py-4 font-medium text-gray-700">2nd years</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS['2nd year'] }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS['2nd year'] }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT['2nd year'] }}</td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-6 py-4 font-medium text-gray-700">3rd years</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS['3rd year'] }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS['3rd year'] }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT['3rd year'] }}</td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="border border-purple-300 px-6 py-4 font-medium text-gray-700">4th years</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS['4th year'] }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS['4th year'] }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT['4th year'] }}</td>
                </tr>
                <tr class="bg-purple-50 font-bold">
                  <td class="border border-purple-300 px-6 py-4 font-bold text-gray-900">All year levels</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSCS.total }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIS.total }}</td>
                  <td class="border border-purple-300 px-6 py-4 text-center">{{ stats.BSIT.total }}</td>
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
            <div class="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-3 shadow-lg">
              <img v-if="editingUser.image || editingUser.photo" :src="editingUser.image || editingUser.photo" alt="User Photo" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl text-gray-400">👤</div>
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
          <p v-if="editImageUploading" class="text-xs text-purple-600 mt-2">Uploading...</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
          <input v-model="editingUser.studentId" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input v-model="editingUser.firstName" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Middle Name <span class="text-gray-400">(optional)</span></label>
          <input v-model="editingUser.middleName" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input v-model="editingUser.lastName" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
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
            <option value="1st year">1st year</option>
            <option value="2nd year">2nd year</option>
            <option value="3rd year">3rd year</option>
            <option value="4th year">4th year</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">RFID Code</label>
          <input v-model="editingUser.rfidCode" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="closeEditModal" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
          <button @click="saveUser" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition">Save</button>
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentUser = ref({})
const users = ref([])
const isPageLoading = ref(true)
const profileImageLoading = ref(false)
const sidebarImageLoading = ref(false)
const showDevelopersPopup = ref(false)
const showLogoutConfirmation = ref(false)
const showMobileMenu = ref(false)
const showContactModal = ref(false)
const currentPage = ref('dashboard')
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const editingUser = ref(null)
const userToDelete = ref(null)
const searchQuery = ref('')
const searchFilter = ref('all')
const isLoggingOut = ref(false)
const showLogoutAnimation = ref(false)
const editImageUploading = ref(false)

// ImgBB API Keys (randomly selected to distribute traffic)
const imgbbApiKeys = [
  "b6a37178abd163036357a7ba35fd0364",
  "3b523af3b0ffb526efddfb51b8928581"
]

// Get random ImgBB API key
const getRandomApiKey = () => {
  return imgbbApiKeys[Math.floor(Math.random() * imgbbApiKeys.length)]
}

const developers = [
    { name: 'Jullan Maglinte', initials: 'JM', role: 'Backend Dev', year_level: '1st year', program: 'CS', facebook: 'https://facebook.com/jullan.maglinte', image: '/team/jullan.jpg' },
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
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  if (!user.studentId && !user.student_id) {
    router.push('/')
    return
  }
  currentUser.value = user
  
  // If admin or master, fetch students from API
  if (user.role === 'admin' || user.isMaster) {
    try {
      console.log('Using token:', import.meta.env.VITE_SSAAM_STUDENTS_API_KEY)
      const response = await fetch('https://ssaam-api.vercel.app/apis/students', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SSAAM_STUDENTS_API_KEY}`
        }
      })
      const apiStudents = await response.json()
      console.log('Fetched students:', apiStudents)
      // Normalize API data to match expected field names
      users.value = apiStudents.map(s => ({
        ...s,
        studentId: s.student_id,
        firstName: s.first_name,
        middleName: s.middle_name || '',
        lastName: s.last_name,
        yearLevel: s.year_level,
        rfidCode: s.rfid_code,
        schoolYear: s.school_year,
        image: s.photo || s.image || ''
      }))
    } catch (error) {
      console.error('Failed to fetch students:', error)
      users.value = []
    }
  } else {
    users.value = JSON.parse(localStorage.getItem('users') || '[]')
  }
  
  // Hide page loading after data is fetched
  isPageLoading.value = false
})

const stats = computed(() => {
  const result = {
    BSCS: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 },
    BSIS: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 },
    BSIT: { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0, total: 0 }
  }
  
  users.value.forEach(user => {
    const program = user.program
    const yearLevel = user.yearLevel || user.year_level
    if (result[program] && result[program][yearLevel] !== undefined) {
      result[program][yearLevel]++
      result[program].total++
    }
  })
  
  return result
})

const totalStudents = computed(() => {
  return stats.value.BSCS.total + stats.value.BSIS.total + stats.value.BSIT.total
})

const searchPlaceholder = computed(() => {
  const placeholders = {
    'all': 'Search all fields...',
    'student_id': 'Search by Student ID...',
    'first_name': 'Search by First Name...',
    'middle_name': 'Search by Middle Name...',
    'last_name': 'Search by Last Name...',
    'email': 'Search by Email...',
    'rfid_code': 'Search by RFID Code...',
    'program': 'Search by Program...',
    'school_level': 'Search by School Level...'
  }
  return placeholders[searchFilter.value] || 'Search...'
})

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value
  }
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => {
    const studentId = (user.studentId || user.student_id || '').toLowerCase()
    const firstName = (user.firstName || user.first_name || '').toLowerCase()
    const middleName = (user.middleName || user.middle_name || '').toLowerCase()
    const lastName = (user.lastName || user.last_name || '').toLowerCase()
    const email = (user.email || '').toLowerCase()
    const rfidCode = (user.rfidCode || user.rfid_code || '').toLowerCase()
    const program = (user.program || '').toLowerCase()
    const yearLevel = (user.yearLevel || user.year_level || '').toLowerCase()
    const fullName = `${firstName} ${middleName} ${lastName}`.toLowerCase()

    switch (searchFilter.value) {
      case 'student_id':
        return studentId.includes(query)
      case 'first_name':
        return firstName.includes(query)
      case 'middle_name':
        return middleName.includes(query)
      case 'last_name':
        return lastName.includes(query)
      case 'email':
        return email.includes(query)
      case 'rfid_code':
        return rfidCode.includes(query)
      case 'program':
        return program.includes(query)
      case 'school_level':
        return yearLevel.includes(query)
      default:
        return studentId.includes(query) || 
               firstName.includes(query) || 
               middleName.includes(query) ||
               lastName.includes(query) || 
               email.includes(query) ||
               rfidCode.includes(query) ||
               program.includes(query) ||
               yearLevel.includes(query) ||
               fullName.includes(query)
    }
  })
})

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

const confirmLogout = () => {
  showLogoutConfirmation.value = false
  showLogoutAnimation.value = true
  setTimeout(() => {
    localStorage.removeItem('currentUser')
    router.push('/')
  }, 1500)
}

const editUser = (user) => {
  editingUser.value = JSON.parse(JSON.stringify(user))
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingUser.value = null
}

const handleEditImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  editImageUploading.value = true

  try {
    const formData = new FormData()
    const apiKey = getRandomApiKey()
    formData.append("key", apiKey)
    formData.append("image", file, "photo.jpg")

    const res = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    if (data.success) {
      editingUser.value.image = data.data.url
      editingUser.value.photo = data.data.url
      console.log("Uploaded Image URL:", editingUser.value.image)
    } else {
      console.error("Image upload failed:", data)
    }
  } catch (error) {
    console.error("Upload error:", error)
  }

  editImageUploading.value = false
}

const saveUser = async () => {
  if (!editingUser.value) return
  const studentId = editingUser.value.studentId || editingUser.value.student_id
  
  try {
    const updateData = {
      student_id: studentId,
      first_name: editingUser.value.firstName || editingUser.value.first_name,
      middle_name: editingUser.value.middleName || editingUser.value.middle_name || '',
      last_name: editingUser.value.lastName || editingUser.value.last_name,
      email: editingUser.value.email,
      rfid_code: editingUser.value.rfidCode || editingUser.value.rfid_code || 'N/A',
      year_level: editingUser.value.yearLevel || editingUser.value.year_level,
      program: editingUser.value.program,
      photo: editingUser.value.image || editingUser.value.photo || ''
    }
    
    const response = await fetch(`https://ssaam-api.vercel.app/apis/students/${studentId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SSAAM_API_KEY}`
      },
      body: JSON.stringify(updateData)
    })
    
    if (response.ok) {
      const index = users.value.findIndex(u => (u.studentId || u.student_id) === studentId)
      if (index !== -1) {
        users.value[index] = { ...editingUser.value, ...updateData, studentId }
      }
      console.log('User updated successfully')
    } else {
      console.error('Failed to update user:', await response.text())
    }
  } catch (error) {
    console.error('Error updating user:', error)
  }
  
  closeEditModal()
}

const deleteUser = (studentId) => {
  userToDelete.value = studentId
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (userToDelete.value) {
    try {
      const response = await fetch(`https://ssaam-api.vercel.app/apis/students/${userToDelete.value}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SSAAM_API_KEY}`
        }
      })
      
      if (response.ok) {
        users.value = users.value.filter(u => (u.studentId || u.student_id) !== userToDelete.value)
        console.log('User deleted successfully')
      } else {
        console.error('Failed to delete user:', await response.text())
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }
  showDeleteConfirm.value = false
  userToDelete.value = null
}
</script>