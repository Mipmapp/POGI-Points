<template>
  <div class="bg-white rounded-lg shadow-lg p-3 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div :class="['animate-spin rounded-full h-12 w-12 border-b-2', isCOE ? 'border-orange-700' : isSOM ? 'border-green-600' : isCNAHS ? 'border-green-700' : 'border-blue-600']"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Header Section with Tabs -->
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex items-center justify-between">
          <h2 :class="['text-xl md:text-2xl font-bold', primaryDarkText]">Manage</h2>
          <button 
            @click="refreshData" 
            :disabled="isRefreshing"
            :class="['text-white px-4 md:px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 font-medium flex items-center gap-2 disabled:opacity-70 text-sm md:text-base', isCOE ? 'bg-orange-700 hover:bg-orange-800' : isSOM ? 'bg-green-600 hover:bg-green-700' : isCNAHS ? 'bg-green-700 hover:bg-green-800' : 'bg-blue-600 hover:bg-blue-700']"
          >
            <svg v-if="isRefreshing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
        <!-- Tab Navigation -->
        <div class="flex gap-2 border-b-2 border-gray-200">
          <button
            @click="activeTab = 'users'"
            :class="[
              'px-3 md:px-4 py-2 font-medium transition-all duration-200 border-b-2 text-sm md:text-base',
              activeTab === 'users'
                ? [primaryTextColor, isCOE ? 'border-orange-700' : isSOM ? 'border-green-700' : isCNAHS ? 'border-green-700' : 'border-blue-600']
                : 'text-gray-600 border-transparent hover:text-gray-700'
            ]"
          >
            Users
          </button>
          <button
            @click="activeTab = 'roles'"
            :class="[
              'px-3 md:px-4 py-2 font-medium transition-all duration-200 border-b-2 text-sm md:text-base',
              activeTab === 'roles'
                ? [primaryTextColor, isCOE ? 'border-orange-700' : isSOM ? 'border-green-700' : isCNAHS ? 'border-green-700' : 'border-blue-600']
                : 'text-gray-600 border-transparent hover:text-gray-700'
            ]"
          >
            Roles
          </button>
        </div>
      </div>

      <!-- USERS TAB -->
      <div v-if="activeTab === 'users'" class="space-y-6">
        <!-- Users Search and Filter -->
        <div :class="['rounded-lg md:rounded-xl p-4 md:p-6 mb-6 space-y-4 md:space-y-5 shadow-sm border', isCOE ? 'bg-gradient-to-br from-white via-orange-50 to-white border-orange-100' : isSOM ? 'bg-gradient-to-br from-white via-green-50 to-white border-green-100' : isCNAHS ? 'bg-gradient-to-br from-white via-green-50 to-white border-green-100' : 'bg-gradient-to-br from-white via-blue-50 to-white border-blue-100']"
          <!-- Search Input -->
          <div class="relative group">
            <div :class="['absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none', isCOE ? 'text-gray-400 group-focus-within:text-orange-700' : isSOM ? 'text-gray-400 group-focus-within:text-green-700' : isCNAHS ? 'text-gray-400 group-focus-within:text-green-700' : 'text-gray-400 group-focus-within:text-blue-600', 'transition-colors duration-200']">
              <svg class="w-4 md:w-5 h-4 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input 
              v-model="userSearchQuery"
              type="text"
              placeholder="Search by name, email, student ID, or RFID..."
              :class="['w-full pl-9 md:pl-10 pr-4 py-2 md:py-3 border border-gray-200 rounded-lg outline-none bg-white text-sm md:text-base shadow-sm focus:shadow-md transition-all duration-300', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent hover:border-orange-300' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent hover:border-green-300' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent hover:border-green-300' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent hover:border-blue-300']"
            />
          </div>
          
          <!-- Filters: compact dropdown row -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-in">
            <!-- Role -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Role</label>
              <div class="relative">
                <select
                  :value="userRoleFilter ?? ''"
                  @change="(e) => { userRoleFilter = e.target.value || null; currentPage = 1 }"
                  :class="['w-full appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-800 font-medium shadow-sm focus:shadow-md outline-none transition-all duration-200 cursor-pointer hover:border-gray-300', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                >
                  <option value="">All Roles</option>
                  <option value="student">Students</option>
                  <option value="treasurer">Treasurers</option>
                  <option value="co-admin">Co-Admins</option>
                </select>
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <!-- Year Level -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Year Level</label>
              <div class="relative">
                <select
                  :value="userYearFilter ?? ''"
                  @change="(e) => { userYearFilter = e.target.value || null; currentPage = 1 }"
                  :class="['w-full appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-800 font-medium shadow-sm focus:shadow-md outline-none transition-all duration-200 cursor-pointer hover:border-gray-300', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                >
                  <option value="">All Years</option>
                  <option value="1st year">1st Year</option>
                  <option value="2nd year">2nd Year</option>
                  <option value="3rd year">3rd Year</option>
                  <option value="4th year">4th Year</option>
                </select>
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <!-- Program -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Program</label>
              <div class="relative">
                <select
                  :value="userProgramFilter ?? ''"
                  @change="(e) => { userProgramFilter = e.target.value || null; currentPage = 1 }"
                  :class="['w-full appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-800 font-medium shadow-sm focus:shadow-md outline-none transition-all duration-200 cursor-pointer hover:border-gray-300', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                >
                  <option value="">All Programs</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSIS">BSIS</option>
                </select>
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <!-- College (super admin only) -->
            <div v-if="isMaster && !isCoAdmin && !isTreasurer" class="space-y-1.5">
              <label class="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">College</label>
              <div class="relative">
                <select
                  :value="userCollegeFilter ?? ''"
                  @change="(e) => { userCollegeFilter = e.target.value || null; currentPage = 1 }"
                  class="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-800 font-medium shadow-sm focus:shadow-md outline-none transition-all duration-200 cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">All Colleges</option>
                  <option value="CCS">CCS</option>
                  <option value="COE">COE</option>
                  <option value="SOM">SOM</option>
                  <option value="CNAHS">CNAHS</option>
                </select>
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <!-- Verification Status -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Verification Status</label>
              <div class="relative">
                <select
                  :value="userStatusFilter ?? ''"
                  @change="(e) => { userStatusFilter = e.target.value || null; currentPage = 1 }"
                  class="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-800 font-medium shadow-sm focus:shadow-md outline-none transition-all duration-200 cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-green-600 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="verified">✓ Verified</option>
                  <option value="unverified">✗ Unverified</option>
                  <option value="unreadable">⚠ Unreadable</option>
                </select>
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Pagination Controls -->
        <div v-if="filteredUsers.length > 0" class="mt-4 pt-4 border-t border-gray-200">
          <!-- Mobile: compact prev/page/next row -->
          <div class="flex items-center justify-between gap-2 sm:hidden">
            <span class="text-xs text-gray-500">{{ filteredUsers.length }} users</span>
            <div class="flex items-center gap-2">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="w-9 h-9 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <span class="text-sm text-gray-600 whitespace-nowrap">{{ currentPage }} / {{ totalPages }}</span>
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="w-9 h-9 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
          <!-- Desktop: full pagination -->
          <div class="hidden sm:flex sm:items-center sm:justify-between gap-2">
            <div class="text-sm text-gray-600">
              Showing {{ (currentPage - 1) * usersPerPage + 1 }} to {{ Math.min(currentPage * usersPerPage, filteredUsers.length) }} of {{ filteredUsers.length }} users
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Previous
              </button>
              <div class="flex gap-1 items-center">
                <button
                  v-for="page in paginationRange"
                  :key="page"
                  @click="page !== '...' && (currentPage = page)"
                  :disabled="page === '...'"
                  :class="[
                    'w-10 h-10 rounded-lg font-medium transition-all duration-200',
                    page === '...'
                      ? 'cursor-default text-gray-400'
                      : currentPage === page
                      ? ['bg-gradient-to-r', primaryButtonGradient, 'text-white']
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
              </div>
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
              >
                Next
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Users List -->
        <div v-if="filteredUsers.length > 0" class="space-y-3">
          <div v-for="(user, idx) in paginatedUsers" :key="user._id || user.id || user.student_id"
            :class="['bg-white rounded-xl border transition-all duration-300 overflow-hidden ssaam-row-anim', isCOE ? 'hover:border-orange-300 hover:shadow-lg' : isSOM ? 'hover:border-green-300 hover:shadow-lg' : isCNAHS ? 'hover:border-green-300 hover:shadow-lg' : 'hover:border-blue-300 hover:shadow-lg']"
            :style="{ animationDelay: Math.min(idx * 30, 600) + 'ms' }">
            <!-- Card Header with Profile -->
            <div class="p-4 md:p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-transparent">
              <div class="flex items-start justify-between gap-3">
                <!-- Left: Profile Info -->
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  <!-- Profile Image -->
                  <div :class="['w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm md:text-base overflow-hidden shadow-md', isCOE ? 'bg-gradient-to-br from-orange-400 to-red-400' : isSOM ? 'bg-gradient-to-br from-green-400 to-yellow-500' : isCNAHS ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-ssaam-dark to-ssaam-light']">
                    <img
                      v-if="user.photo && !photoFailed[user._id || user.student_id]"
                      :src="user.photo"
                      :alt="`${user.first_name} ${user.last_name}`"
                      class="w-full h-full object-cover"
                      @error="markPhotoFailed(user._id || user.student_id)"
                      referrerpolicy="no-referrer"
                    />
                    <span v-else>{{ getInitials(user) }}</span>
                  </div>
                  <!-- User Basic Info -->
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-gray-900 text-base md:text-lg truncate">{{ (user.first_name || user.firstName) }} {{ (user.middle_name || user.middleName) ? ((user.middle_name || user.middleName) + ' ') : '' }}{{ (user.last_name || user.lastName) }}{{ user.suffix ? (' ' + user.suffix) : '' }}</h3>
                    <div class="flex items-center gap-2 mt-1">
                      <p class="text-sm text-gray-600 font-mono">{{ user.student_id }}</p>
                      <button 
                        @click="copyToClipboard(user.student_id)"
                        class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700"
                        title="Copy Student ID"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                      </button>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-2">
                      <!-- Role Badge -->
                      <span v-if="user.role && user.role !== 'student'" class="px-2 py-1 rounded-full text-xs font-bold capitalize shadow-sm bg-gradient-to-r from-blue-100 to-blue-100 text-blue-700">
                        {{ user.role }}
                      </span>
                      <span v-else class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize shadow-sm">
                        Student
                      </span>
                      <!-- College Badge (super admin only) -->
                      <span v-if="isMaster && user.college" :class="['px-2 py-1 rounded-full text-xs font-bold shadow-sm', user.college === 'COE' ? 'bg-orange-100 text-orange-700' : user.college === 'SOM' ? 'bg-green-100 text-green-700' : user.college === 'CNAHS' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700']">
                        {{ user.college }}
                      </span>
                      <!-- Verification Badge -->
                      <span v-if="getAutoVerificationStatus(user) === true" class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        Verified
                      </span>
                      <span v-else-if="getAutoVerificationStatus(user) === false" class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                        Unverified
                      </span>
                      <span v-else-if="getAutoVerificationStatus(user) === 'unreadable'" class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                        Unreadable
                      </span>
                    </div>
                  </div>
                </div>
                <!-- Right: Action Buttons -->
                <div class="flex gap-2 flex-shrink-0">
                  <button
                    @click="editUser(user)"
                    class="bg-blue-500 hover:bg-blue-600 text-white p-2 md:p-2.5 rounded-lg transition-all duration-200 hover:shadow-md active:scale-95 flex items-center justify-center"
                    title="Edit User"
                  >
                    <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button
                    @click="confirmDeleteUser(user)"
                    class="bg-red-500 hover:bg-red-600 text-white p-2 md:p-2.5 rounded-lg transition-all duration-200 hover:shadow-md active:scale-95 flex items-center justify-center"
                    title="Delete User"
                  >
                    <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Card Body with Details -->
            <div class="p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <!-- Email -->
              <div class="col-span-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <p class="text-sm text-gray-900 truncate font-medium">{{ user.email }}</p>
              </div>
              <!-- Program -->
              <div class="col-span-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Program</p>
                <p class="text-sm text-gray-900 font-medium">{{ user.program || 'N/A' }}</p>
              </div>
              <!-- Year Level -->
              <div class="col-span-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Year</p>
                <p class="text-sm text-gray-900 font-medium">{{ user.year_level || 'N/A' }}</p>
              </div>
              <!-- RFID Status -->
              <div class="col-span-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">RFID</p>
                <p class="text-sm font-mono font-bold" :class="user.rfid_code && user.rfid_code !== 'N/A' ? 'text-green-600' : 'text-red-600'">{{ user.rfid_code ? user.rfid_code.substring(0, 8) + '...' : 'N/A' }}</p>
              </div>
            </div>
          </div>
          
          <!-- Pagination Controls -->
          <div class="mt-6 pt-4 border-t border-gray-200">
            <!-- Mobile: compact prev/page/next row -->
            <div class="flex items-center justify-between gap-2 sm:hidden">
              <span class="text-xs text-gray-500">{{ filteredUsers.length }} users</span>
              <div class="flex items-center gap-2">
                <button
                  @click="currentPage = Math.max(1, currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="w-9 h-9 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <span class="text-sm text-gray-600 whitespace-nowrap">{{ currentPage }} / {{ totalPages }}</span>
                <button
                  @click="currentPage = Math.min(totalPages, currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="w-9 h-9 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
            <!-- Desktop: full pagination -->
            <div class="hidden sm:flex sm:items-center sm:justify-between gap-2">
              <div class="text-sm text-gray-600">
                Showing {{ (currentPage - 1) * usersPerPage + 1 }} to {{ Math.min(currentPage * usersPerPage, filteredUsers.length) }} of {{ filteredUsers.length }} users
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="currentPage = Math.max(1, currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Previous
                </button>
                <div class="flex gap-1 items-center">
                  <button
                    v-for="page in paginationRange"
                    :key="page"
                    @click="page !== '...' && (currentPage = page)"
                    :disabled="page === '...'"
                    :class="[
                      'w-10 h-10 rounded-lg font-medium transition-all duration-200',
                      page === '...'
                        ? 'cursor-default text-gray-400'
                        : currentPage === page
                        ? ['bg-gradient-to-r', primaryButtonGradient, 'text-white']
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    ]"
                  >
                    {{ page }}
                  </button>
                </div>
                <button
                  @click="currentPage = Math.min(totalPages, currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                >
                  Next
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-600">
          <p>No users found matching your search</p>
        </div>
      </div>

    </div>

    <!-- ROLES TAB -->
    <div v-if="activeTab === 'roles'" class="space-y-6">
      <!-- Assign Role Section -->
      <div :class="['rounded-xl p-5 md:p-6 shadow-sm border space-y-5', isCOE ? 'bg-gradient-to-br from-white via-orange-50 to-white border-orange-100' : isSOM ? 'bg-gradient-to-br from-white via-green-50 to-white border-green-100' : isCNAHS ? 'bg-gradient-to-br from-white via-green-50 to-white border-green-100' : 'bg-gradient-to-br from-white via-blue-50 to-white border-blue-100']">
        <div class="flex items-center gap-2 mb-1">
          <div :class="['w-1 h-5 rounded-full', isCOE ? 'bg-orange-600' : isSOM ? 'bg-green-600' : isCNAHS ? 'bg-green-700' : 'bg-blue-600']"></div>
          <h3 :class="['text-sm font-bold uppercase tracking-widest', isCOE ? 'text-orange-700' : isSOM ? 'text-green-700' : isCNAHS ? 'text-green-800' : 'text-blue-700']">Assign Student Role</h3>
        </div>
        <p class="text-xs text-gray-500">Search for a student by ID or name, then assign them a role.</p>

        <!-- Search Row -->
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="roleSearchQuery"
              type="text"
              placeholder="Enter Student ID or name..."
              @keydown.enter="searchStudentForRole"
              :class="['w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 outline-none text-sm bg-gray-50 focus:bg-white transition', isCOE ? 'focus:ring-orange-300 focus:border-orange-400' : isSOM ? 'focus:ring-green-300 focus:border-green-400' : isCNAHS ? 'focus:ring-green-300 focus:border-green-400' : 'focus:ring-blue-300 focus:border-blue-400']"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button
            @click="searchStudentForRole"
            :disabled="isSearchingRole"
            :class="['px-5 py-2.5 text-white rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-md whitespace-nowrap disabled:opacity-60 bg-gradient-to-r', isCOE ? 'from-orange-600 to-red-600 shadow-orange-200' : isSOM ? 'from-green-600 to-teal-600 shadow-green-200' : isCNAHS ? 'from-green-700 to-green-600 shadow-green-200' : 'from-ssaam-dark to-ssaam-light shadow-blue-200']"
          >
            <svg v-if="isSearchingRole" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <span v-else>Search</span>
          </button>
        </div>

        <!-- Found Student Card -->
        <div v-if="roleTargetStudent" class="bg-white border-2 border-blue-200 rounded-2xl p-4 space-y-4">
          <div class="flex items-center gap-3">
            <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden shadow-md', isCOE ? 'bg-gradient-to-br from-orange-400 to-red-500' : isSOM ? 'bg-gradient-to-br from-green-400 to-yellow-500' : isCNAHS ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-ssaam-dark to-ssaam-light']">
              <img v-if="roleTargetStudent.photo && !photoFailed['role-' + (roleTargetStudent._id || roleTargetStudent.student_id)]" :src="roleTargetStudent.photo" class="w-full h-full object-cover" @error="markPhotoFailed('role-' + (roleTargetStudent._id || roleTargetStudent.student_id))" referrerpolicy="no-referrer" />
              <span v-else>{{ getInitials(roleTargetStudent) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-gray-900 text-sm">{{ roleTargetStudent.first_name }} {{ roleTargetStudent.middle_name ? roleTargetStudent.middle_name + ' ' : '' }}{{ roleTargetStudent.last_name }}{{ roleTargetStudent.suffix ? ' ' + roleTargetStudent.suffix : '' }}</h4>
              <p class="text-xs text-gray-500">{{ roleTargetStudent.student_id }} · {{ roleTargetStudent.program }} – {{ roleTargetStudent.year_level }}</p>
              <div class="mt-1 flex items-center gap-1.5">
                <span class="text-[10px] text-gray-400 font-medium">Current role:</span>
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', roleTargetStudent.role && roleTargetStudent.role !== 'student' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ roleTargetStudent.role || 'student' }}</span>
              </div>
            </div>
            <button @click="roleTargetStudent = null; roleSearchQuery = ''" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- College Dept (isMaster only) -->
          <div v-if="isMaster" class="space-y-2">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">College Department</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="col in ['CCS','COE','SOM','CNAHS']" :key="col" @click="roleTargetCollegeDept = col"
                :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                  roleTargetCollegeDept === col
                    ? col === 'CCS' ? 'bg-blue-600 text-white border-transparent shadow-md' : col === 'COE' ? 'bg-orange-500 text-white border-transparent shadow-md' : col === 'SOM' ? 'bg-green-600 text-white border-transparent shadow-md' : 'bg-teal-600 text-white border-transparent shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300']">{{ col }}</button>
            </div>
          </div>

          <!-- Role Selector -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Assign New Role</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="r in availableStudentRoles"
                :key="r.value"
                @click="selectedNewRole = r.value"
                :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all border', selectedNewRole === r.value ? 'bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white border-transparent shadow-md shadow-blue-200' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-sm']"
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <!-- Assign Button -->
          <button
            @click="assignStudentRole"
            :disabled="!selectedNewRole || isAssigningRole"
            :class="['w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r', isCOE ? 'from-orange-600 to-red-600 shadow-orange-200 hover:from-orange-700 hover:to-red-700' : isSOM ? 'from-green-600 to-teal-600 shadow-green-200 hover:from-green-700 hover:to-teal-700' : isCNAHS ? 'from-green-700 to-green-600 shadow-green-200 hover:from-green-800 hover:to-green-700' : 'from-ssaam-dark to-ssaam-light shadow-blue-200 hover:opacity-90']"
          >
            <svg v-if="isAssigningRole" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            {{ isAssigningRole ? 'Assigning...' : `Assign as ${availableStudentRoles.find(r => r.value === selectedNewRole)?.label || ''}` }}
          </button>

          <!-- Role error message -->
          <p v-if="roleAssignError" class="text-xs text-red-600 font-medium text-center">{{ roleAssignError }}</p>
        </div>

        <!-- Multiple results — pick one -->
        <div v-else-if="roleSearchResults.length > 0" class="space-y-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{{ roleSearchResults.length }} {{ roleSearchResults.length === 1 ? 'match' : 'matches' }}</p>
          <button
            v-for="r in roleSearchResults"
            :key="r._id || r.student_id"
            @click="selectRoleResult(r)"
            class="w-full flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-sm text-left transition"
          >
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm', isCOE ? 'bg-gradient-to-br from-orange-400 to-red-500' : isSOM ? 'bg-gradient-to-br from-green-400 to-yellow-500' : isCNAHS ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-ssaam-dark to-ssaam-light']">
              <img v-if="r.photo && !photoFailed['rs-' + (r._id || r.student_id)]" :src="r.photo" class="w-full h-full object-cover" @error="markPhotoFailed('rs-' + (r._id || r.student_id))" referrerpolicy="no-referrer" />
              <span v-else>{{ getInitials(r) }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-gray-900 truncate">{{ r.first_name }} {{ r.last_name }}</p>
              <p class="text-[11px] text-gray-500 truncate">{{ r.student_id }} · {{ r.program || '—' }} · {{ r.year_level || '—' }}</p>
            </div>
            <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold capitalize flex-shrink-0', r.role && r.role !== 'student' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ r.role || 'student' }}</span>
          </button>
        </div>

        <!-- Empty search state -->
        <div v-else-if="!isSearchingRole && roleSearchQuery && !roleTargetStudent && roleSearchResults.length === 0" class="text-center py-6 text-gray-400 text-sm">
          No student found. Try a different ID or name.
        </div>
      </div>

      <!-- College Role Members Cards -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <div :class="['w-1 h-5 rounded-full', isCOE ? 'bg-orange-600' : isSOM ? 'bg-green-600' : isCNAHS ? 'bg-green-700' : 'bg-blue-600']"></div>
          <h3 :class="['text-sm font-bold uppercase tracking-widest', isCOE ? 'text-orange-700' : isSOM ? 'text-green-700' : isCNAHS ? 'text-green-800' : 'text-blue-700']">Role Members by College</h3>
        </div>
        <div :class="['grid gap-3', (isMaster && !isCoAdmin && !isTreasurer) ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1']">
          <button
            v-for="col in ((isMaster && !isCoAdmin && !isTreasurer) ? ['CCS','COE','SOM','CNAHS'] : [currentUser.college || 'CCS'])"
            :key="col"
            @click="fetchCollegeMembers(col)"
            :class="['rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-sm border-2 border-transparent hover:border-opacity-50',
              col === 'COE' ? 'bg-gradient-to-br from-orange-500 to-red-600 hover:border-orange-300' :
              col === 'SOM' ? 'bg-gradient-to-br from-green-600 to-emerald-700 hover:border-green-300' :
              col === 'CNAHS' ? 'bg-gradient-to-br from-teal-500 to-green-600 hover:border-teal-300' :
              'bg-gradient-to-br from-blue-600 to-indigo-700 hover:border-blue-300']"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <img :src="`/icons/${col.toLowerCase()}.svg`" :alt="col" class="w-8 h-8 object-contain drop-shadow-md" />
                <span class="text-white font-black text-base tracking-wide">{{ col }}</span>
              </div>
              <svg class="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </div>
            <p class="text-white/70 text-[10px] font-medium mt-2">Treasurers &amp; Co-Admins</p>
          </button>
        </div>
      </div>

      <!-- Recently Assigned Roles List -->
      <div v-if="recentRoleAssignments.length > 0" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div :class="['w-1 h-5 rounded-full', isCOE ? 'bg-orange-600' : isSOM ? 'bg-green-600' : isCNAHS ? 'bg-green-700' : 'bg-blue-600']"></div>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Recently Assigned</h3>
        </div>
        <div class="divide-y divide-gray-100">
          <div v-for="assignment in recentRoleAssignments" :key="assignment.student_id" class="px-5 py-3 flex items-center gap-3">
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden', isCOE ? 'bg-gradient-to-br from-orange-400 to-red-500' : isSOM ? 'bg-gradient-to-br from-green-400 to-yellow-500' : isCNAHS ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-ssaam-dark to-ssaam-light']">
              <img v-if="assignment.photo && !photoFailed['asg-' + (assignment._id || assignment.student_id)]" :src="assignment.photo" class="w-full h-full object-cover" @error="markPhotoFailed('asg-' + (assignment._id || assignment.student_id))" referrerpolicy="no-referrer" />
              <span v-else>{{ (assignment.name || '?').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-gray-900 text-sm truncate">{{ assignment.name }}</p>
              <p class="text-xs text-gray-500">{{ assignment.student_id }}</p>
            </div>
            <span :class="['px-2.5 py-1 rounded-full text-xs font-bold capitalize', assignment.role !== 'student' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500']">{{ assignment.role }}</span>
            <span class="text-[10px] text-gray-400 flex-shrink-0">{{ assignment.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- College Members Modal -->
    <div v-if="showCollegeMembersModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" @click.self="showCollegeMembersModal = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <!-- Modal Header -->
          <div :class="['px-6 py-4 flex items-center justify-between flex-shrink-0',
            collegeMembersModalData.college === 'COE' ? 'bg-gradient-to-r from-orange-500 to-red-600' :
            collegeMembersModalData.college === 'SOM' ? 'bg-gradient-to-r from-green-600 to-emerald-700' :
            collegeMembersModalData.college === 'CNAHS' ? 'bg-gradient-to-r from-teal-500 to-green-600' :
            'bg-gradient-to-r from-blue-600 to-indigo-700']">
            <div class="flex items-center gap-3">
              <img :src="`/icons/${collegeMembersModalData.college.toLowerCase()}.svg`" :alt="collegeMembersModalData.college" class="w-10 h-10 object-contain drop-shadow-md flex-shrink-0" />
              <div>
                <h3 class="text-white font-black text-lg">{{ collegeMembersModalData.college }}</h3>
                <p class="text-white/70 text-xs">Assigned Role Members</p>
              </div>
            </div>
            <button @click="showCollegeMembersModal = false" class="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loadingCollegeMembers" class="flex-1 flex items-center justify-center py-12">
            <svg class="w-8 h-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          </div>

          <!-- Empty State -->
          <div v-else-if="!collegeMembersModalData.members.length" class="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
            <svg class="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p class="text-sm font-medium">No role members assigned yet</p>
            <p class="text-xs mt-1">Use the form above to assign Treasurer or Co-Admin roles.</p>
          </div>

          <!-- Members List -->
          <div v-else class="flex-1 overflow-y-auto divide-y divide-gray-100">
            <!-- Role group headers -->
            <template v-for="roleGroup in ['co-admin', 'treasurer']" :key="roleGroup">
              <div v-if="collegeMembersModalData.members.filter(m => m.role === roleGroup).length > 0">
                <div :class="['px-5 py-2 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10',
                  roleGroup === 'co-admin' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-cyan-600']">
                  {{ roleGroup === 'co-admin' ? 'Co-Admins' : 'Treasurers' }}
                  <span class="ml-1 opacity-60">({{ collegeMembersModalData.members.filter(m => m.role === roleGroup).length }})</span>
                </div>
                <div v-for="member in collegeMembersModalData.members.filter(m => m.role === roleGroup)" :key="member.student_id"
                  class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm',
                    collegeMembersModalData.college === 'COE' ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                    collegeMembersModalData.college === 'SOM' ? 'bg-gradient-to-br from-green-400 to-yellow-500' :
                    collegeMembersModalData.college === 'CNAHS' ? 'bg-gradient-to-br from-teal-400 to-green-500' :
                    'bg-gradient-to-br from-blue-500 to-indigo-600']">
                    <img v-if="member.photo && !photoFailed['mem-' + (member._id || member.student_id)]" :src="member.photo" class="w-full h-full object-cover" @error="markPhotoFailed('mem-' + (member._id || member.student_id))" referrerpolicy="no-referrer" />
                    <span v-else>{{ (member.first_name || '?').charAt(0).toUpperCase() }}{{ (member.last_name || '').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 text-sm truncate">
                      {{ member.first_name }} {{ member.middle_name ? member.middle_name.charAt(0) + '. ' : '' }}{{ member.last_name }}{{ member.suffix ? ' ' + member.suffix : '' }}
                    </p>
                    <p class="text-xs text-gray-400 truncate">{{ member.student_id }} · {{ member.program }} – {{ member.year_level }}</p>
                  </div>
                  <span :class="['px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex-shrink-0',
                    member.role === 'co-admin' ? 'bg-violet-100 text-violet-700' : 'bg-cyan-100 text-cyan-700']">
                    {{ member.role === 'co-admin' ? 'Co-Admin' : 'Treasurer' }}
                  </span>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 border-t border-gray-100 flex-shrink-0">
            <p class="text-xs text-gray-400 text-center">{{ collegeMembersModalData.members.length }} assigned member{{ collegeMembersModalData.members.length !== 1 ? 's' : '' }} in {{ collegeMembersModalData.college }}</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal && editingUser" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeEditUserModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h3 :class="['text-2xl font-bold', primaryDarkText]">Edit User</h3>
            <button @click="closeEditUserModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>

          <!-- Edit Form -->
          <div class="space-y-4 mb-6">
            <!-- Profile Picture Preview and Upload -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
              <div class="flex items-start gap-4">
                <div :class="['w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-lg overflow-hidden border-2 border-gray-300', isCOE ? 'bg-gradient-to-br from-orange-400 to-red-400' : isSOM ? 'bg-gradient-to-br from-green-400 to-yellow-500' : isCNAHS ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-ssaam-dark to-ssaam-light']">
                  <img
                    v-if="editingUser.photo && !photoFailed['edit-' + (editingUser._id || editingUser.student_id)]"
                    :src="editingUser.photo"
                    :alt="`${editingUser.first_name} ${editingUser.last_name}`"
                    class="w-full h-full object-cover"
                    @error="markPhotoFailed('edit-' + (editingUser._id || editingUser.student_id))"
                    referrerpolicy="no-referrer"
                  />
                  <span v-else>{{ getInitials(editingUser) }}</span>
                </div>
                <div class="flex-1">
                  <input 
                    type="file"
                    accept="image/*"
                    @change="handlePhotoUpload"
                    :class="['block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium', isCOE ? 'file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100' : isSOM ? 'file:bg-green-50 file:text-green-700 hover:file:bg-green-100' : isCNAHS ? 'file:bg-green-50 file:text-green-700 hover:file:bg-green-100' : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100']"
                  />
                  <p class="text-xs text-gray-500 mt-2">Accepted formats: JPG, PNG. Max 5MB</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                <input 
                  v-model="editingUser.student_id"
                  type="text"
                  :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">RFID</label>
                <input 
                  v-model="editingUser.rfid_code"
                  type="text"
                  :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                />
                <!-- Mark as Unreadable Button aligned under RFID -->
                <button
                  v-if="editingUser.rfid_code && editingUser.rfid_code !== 'N/A'"
                  @click="markRFIDAsUnreadable"
                  class="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all duration-200 flex items-center gap-2 font-medium text-sm w-full justify-center"
                  title="Mark this RFID as unreadable"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Mark Unreadable
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input 
                  v-model="editingUser.first_name"
                  type="text"
                  :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                <input 
                  v-model="editingUser.middle_name"
                  type="text"
                  :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input 
                  v-model="editingUser.last_name"
                  type="text"
                  :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Suffix <span class="text-gray-500 text-xs">(optional)</span></label>
                <div>
                  <select v-model="editingUser.suffix" :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none appearance-none bg-white', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']">
                    <option value="">None</option>
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
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                v-model="editingUser.email"
                type="email"
                :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Program</label>
                <select 
                  v-model="editingUser.program"
                  :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                >
                  <option value="N/A">N/A</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSIS">BSIS</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                <select 
                  v-model="editingUser.year_level"
                  :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                >
                  <option value="N/A">N/A</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
              <select 
                v-model="editingUser.rfid_status"
                :class="['w-full px-4 py-2 border border-gray-300 rounded-lg outline-none', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
              >
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="unreadable">Unreadable</option>
              </select>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              @click="closeEditUserModal"
              class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button 
              @click="saveEditUser"
              :disabled="isSavingUser"
              :class="['flex-1 bg-gradient-to-r text-white py-2 px-4 rounded-lg font-medium transition disabled:opacity-70', primaryButtonGradient, primaryButtonHover]"
            >
              {{ isSavingUser ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Delete User Confirmation Modal -->
    <div v-if="showDeleteConfirmModal && userToDelete" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeDeleteConfirmModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-blue-900 mb-2">Delete User</h3>
            <p class="text-gray-600">
              Are you sure you want to delete <strong>{{ (userToDelete.first_name || userToDelete.firstName) }} {{ (userToDelete.last_name || userToDelete.lastName) }}</strong>? This action cannot be undone.
            </p>
          </div>
          <div class="flex gap-3">
            <button 
              @click="closeDeleteConfirmModal"
              class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button 
              @click="deleteUser"
              :disabled="isDeletingUser"
              class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-70"
            >
              {{ isDeletingUser ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </transition>
    </div>


    <!-- Notification Modal -->
    <transition name="fade">
      <div v-if="notification.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeNotification">
        <transition name="notification-pop" appear>
          <div @click.stop :class="['bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-11/12 md:w-96 border-l-4', isCOE ? 'border-orange-500' : isSOM ? 'border-green-500' : 'border-blue-500']">
            <!-- Close Button -->
            <button @click="closeNotification" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <!-- Notification Icon -->
            <div class="flex justify-center mb-5">
              <div :class="[
                'w-16 h-16 rounded-full flex items-center justify-center shadow-lg',
                notification.type === 'success' ? (isCOE ? 'bg-gradient-to-br from-green-100 to-emerald-100' : isSOM ? 'bg-gradient-to-br from-green-100 to-emerald-100' : isCNAHS ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-gradient-to-br from-green-100 to-emerald-100') : 
                notification.type === 'error' ? (isCOE ? 'bg-gradient-to-br from-red-100 to-orange-100' : isSOM ? 'bg-gradient-to-br from-red-100 to-orange-100' : isCNAHS ? 'bg-gradient-to-br from-red-100 to-orange-100' : 'bg-gradient-to-br from-red-100 to-blue-100') : 
                (isCOE ? 'bg-gradient-to-br from-orange-100 to-yellow-100' : isSOM ? 'bg-gradient-to-br from-green-100 to-yellow-100' : isCNAHS ? 'bg-gradient-to-br from-green-100 to-yellow-100' : 'bg-gradient-to-br from-blue-100 to-blue-100')
              ]">
                <svg v-if="notification.type === 'success'" class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <svg v-else-if="notification.type === 'error'" :class="['w-8 h-8', isCOE ? 'text-red-600' : 'text-red-600']" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                <svg v-else :class="['w-8 h-8', isCOE ? 'text-orange-600' : isSOM ? 'text-green-600' : isCNAHS ? 'text-green-600' : 'text-blue-600']" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clip-rule="evenodd"></path>
                </svg>
              </div>
            </div>

            <!-- Notification Message -->
            <h3 :class="['text-lg md:text-xl font-bold text-center mb-2', notification.type === 'success' ? 'text-green-700' : notification.type === 'error' ? 'text-red-700' : (isCOE ? 'text-orange-700' : 'text-blue-700')]">
              {{ notification.title }}
            </h3>
            <p class="text-center text-gray-600 text-sm md:text-base mb-6 leading-relaxed">{{ notification.message }}</p>

            <!-- Notification Button -->
            <button 
              @click="closeNotification"
              :class="['w-full text-white py-2.5 md:py-3 px-4 rounded-lg transition-all duration-200 font-bold text-sm md:text-base shadow-md hover:shadow-lg active:scale-95', 'bg-gradient-to-r', primaryButtonGradient, primaryButtonHover]"
            >
              Close
            </button>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { buildAPIUrl } from '../config/api.js'
import { encodeTimestamp } from '../utils/ssaamCrypto.js'
import departments from '../config/departments.js'
import { COLLEGES, checkDepartment } from '../config/themes.js'


export default {
  name: 'Manage',
  data() {
    return {
      activeTab: 'users',
      allUsers: [],
      isLoading: false,
      isRefreshing: false,
      isFetchingUsers: false,
      userSearchQuery: '',
      userRoleFilter: null,
      userYearFilter: null,
      userProgramFilter: null,
      userStatusFilter: null,
      userCollegeFilter: null,
      showEditUserModal: false,
      editingUser: null,
      isSavingUser: false,
      showDeleteConfirmModal: false,
      userToDelete: null,
      isDeletingUser: false,
      currentPage: 1,
      usersPerPage: 10,
      notification: {
        show: false,
        type: 'success',
        title: '',
        message: ''
      },
      handleUserDeletedEvent: null,
      // Map of cache keys -> true when an avatar image fails to load. We need
      // a reactive flag (rather than just `@error="display:none"`) so the
      // initials fallback inside the same circle can show.
      photoFailed: {},
      roleSearchQuery: '',
      isSearchingRole: false,
      // List of matches when several students hit the same name query.
      roleSearchResults: [],
      roleTargetStudent: null,
      selectedNewRole: null,
      roleTargetCollegeDept: '',
      isAssigningRole: false,
      roleAssignError: '',
      recentRoleAssignments: [],
      showCollegeMembersModal: false,
      collegeMembersModalData: { college: '', members: [] },
      loadingCollegeMembers: false,
      availableStudentRoles: [
        { value: 'student', label: 'Student' },
        { value: 'treasurer', label: 'Treasurer' },
        { value: 'co-admin', label: 'Co-Admin' }
      ]
    }
  },
  computed: {
    // Theme helpers for department-based coloring
    currentUser() {
      return JSON.parse(localStorage.getItem('currentUser') || '{}')
    },
    userDepartment() {
      if (this.currentUser.selectedDepartment) return this.currentUser.selectedDepartment
      const userProgram = this.currentUser.program
      if (userProgram) {
        for (const dept of departments) {
          if (dept.programs.some(p => p.shortName === userProgram)) {
            return { label: dept.label, name: dept.name }
          }
        }
      }
      // Fallback: check localStorage if needed (though theme picker removed)
      const storedTheme = localStorage.getItem('adminThemePreference')
      if (storedTheme) {
        const dept = departments.find(d => d.label === storedTheme)
        if (dept) return { label: dept.label, name: dept.name }
      }
      return null
    },
    isCOE() { return false },
    isSOM() { return false },
    isCCS() { return true },
    isCNAHS() { return false },
    primaryButtonGradient() { return 'from-ssaam-dark to-ssaam-light' },
    primaryButtonHover() { return 'hover:from-ssaam-dark hover:to-ssaam-light' },
    primaryTextColor() { return 'text-blue-600' },
    primaryTextHover() { return 'hover:text-blue-800' },
    primaryDarkText() { return 'text-blue-900' },
    isMaster() { return this.currentUser?.isMaster === true },
    isCoAdmin() { return this.currentUser?.role === 'co-admin' },
    isTreasurer() { return this.currentUser?.isMaster === true && this.currentUser?.role === 'treasurer' },
    // End theme helpers

    filteredUsers() {
      let filtered = this.allUsers

      // Apply role filter
      if (this.userRoleFilter !== null) {
        filtered = filtered.filter(user => {
          const userRole = (user.role || 'student').toLowerCase()
          return userRole === this.userRoleFilter.toLowerCase()
        })
      }

      // Apply search filter
      if (this.userSearchQuery.trim()) {
        const query = this.userSearchQuery.toLowerCase()
        filtered = filtered.filter(user => {
          const fullName = `${(user.first_name || user.firstName) || ''} ${(user.last_name || user.lastName) || ''}`.toLowerCase()
          const studentId = (user.student_id || '').toLowerCase()
          const email = (user.email || '').toLowerCase()
          const rfid = (user.rfid_code || '').toLowerCase()
          return fullName.includes(query) || studentId.includes(query) || email.includes(query) || rfid.includes(query)
        })
      }

      // Apply year level filter
      if (this.userYearFilter !== null) {
        filtered = filtered.filter(user => {
          const userYear = (user.year_level || '').toLowerCase()
          return userYear.includes(this.userYearFilter.toLowerCase())
        })
      }

      // Apply verification status filter
      if (this.userStatusFilter !== null) {
        filtered = filtered.filter(user => {
          const status = this.getAutoVerificationStatus(user)
          if (this.userStatusFilter === 'verified') return status === true
          if (this.userStatusFilter === 'unverified') return status === false
          if (this.userStatusFilter === 'unreadable') return status === 'unreadable'
          return true
        })
      }

      // Apply program filter
      if (this.userProgramFilter !== null) {
        filtered = filtered.filter(user => {
          const userProgram = (user.program || '').toUpperCase()
          return userProgram === this.userProgramFilter.toUpperCase()
        })
      }

      // Apply college filter (super admin only)
      if (this.userCollegeFilter !== null) {
        filtered = filtered.filter(user => (user.college || 'CCS') === this.userCollegeFilter)
      }

      return filtered
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.usersPerPage
      const end = start + this.usersPerPage
      return this.filteredUsers.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.usersPerPage)
    },
    paginationRange() {
      const pages = []
      const maxVisible = 5 // Show max 5 page buttons
      const total = this.totalPages
      
      if (total <= maxVisible) {
        // Show all pages if there are 5 or fewer
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        // Always show first page
        pages.push(1)
        
        // Calculate range around current page
        let start = Math.max(2, this.currentPage - 1)
        let end = Math.min(total - 1, this.currentPage + 1)
        
        // Add ellipsis if needed
        if (start > 2) {
          pages.push('...')
        }
        
        // Add pages around current
        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) {
            pages.push(i)
          }
        }
        
        // Add ellipsis if needed
        if (end < total - 1) {
          pages.push('...')
        }
        
        // Always show last page
        if (!pages.includes(total)) {
          pages.push(total)
        }
      }
      
      return pages
    },
  },
  watch: {
    userSearchQuery() {
      this.currentPage = 1
    },
    userRoleFilter() {
      this.currentPage = 1
    },
    userYearFilter() {
      this.currentPage = 1
    },
    userStatusFilter() {
      this.currentPage = 1
    },
    userProgramFilter() {
      this.currentPage = 1
    }
  },
  methods: {
    showNotification(type, title, message) {
      this.notification = {
        show: true,
        type,
        title,
        message
      }
      // Auto close after 5 seconds
      setTimeout(() => {
        this.closeNotification()
      }, 5000)
    },
    closeNotification() {
      this.notification.show = false
    },
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('success', 'Copied!', `"${text}" copied to clipboard`)
      }).catch(() => {
        this.showNotification('error', 'Failed', 'Could not copy to clipboard')
      })
    },
    getInitials(user) {
      const firstName = user.first_name || user.firstName || ''
      const lastName = user.last_name || user.lastName || ''
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
    },
    getAutoVerificationStatus(user) {
      // Check RFID code first (primary source of truth)
      // If RFID code is N/A or empty, return Unverified
      if (!user.rfid_code || user.rfid_code === 'N/A') {
        return false
      }
      // If RFID contains "UNREADABLE", return Unreadable
      if (user.rfid_code && user.rfid_code.includes('UNREADABLE')) {
        return 'unreadable'
      }
      // If RFID has a valid value, return Verified
      if (user.rfid_code) {
        return true
      }
      // If rfid_status is explicitly provided and is one of our known values, use it
      if (user.rfid_status && typeof user.rfid_status === 'string') {
        const status = user.rfid_status.toLowerCase()
        if (status === 'verified') return true
        if (status === 'unreadable') return 'unreadable'
        if (status === 'unverified') return false
      }
      // Default to unverified
      return false
    },
    async fetchAllUsers() {
      if (this.isFetchingUsers) {
        console.warn('fetchAllUsers already in progress, skipping duplicate call')
        return
      }
      try {
        this.isFetchingUsers = true
        const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken')
        if (!token) {
          this.showNotification('error', 'Authentication Error', 'Authentication required. Please login again.')
          return
        }

        // Master admin fetches ALL colleges at once; co-admin/regular admin
        // fetches own college only. /apis/students/list/all returns every
        // approved student in the chosen college (the previous endpoint
        // /apis/students/search with no query was filtering down to the
        // calling user's own student record only, which is why admins were
        // seeing nothing but themselves).
        const isMaster = this.currentUser?.isMaster === true
        const college = this.currentUser?.college || localStorage.getItem('loginChosenDepartment') || 'CCS'

        let url, headers
        if (isMaster && !this.isCoAdmin) {
          url = buildAPIUrl('/apis/students/all-colleges')
          headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-SSAAM-College': 'CCS' }
        } else {
          url = buildAPIUrl('/apis/students/list/all')
          headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-SSAAM-College': college }
        }

        const response = await fetch(url, { headers })
        if (response.ok) {
          const data = await response.json()
          this.allUsers = Array.isArray(data) ? data : (data.data || [])
        } else {
          const errorData = await response.json()
          console.error('Failed to fetch users:', response.status, errorData)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        this.isFetchingUsers = false
      }
    },
    async refreshData() {
      this.isRefreshing = true
      try {
        await this.fetchAllUsers()
      } finally {
        this.isRefreshing = false
      }
    },
    editUser(user) {
      // Create a copy of the user to edit
      this.editingUser = {
        ...user,
        first_name: user.first_name || user.firstName || '',
        middle_name: user.middle_name || user.middleName || '',
        last_name: user.last_name || user.lastName || '',
        suffix: user.suffix || '',
        originalStudentId: user.student_id || user.studentId // Preserve original ID for API calls
      }
      
      // Auto-set verification status based on RFID
      this.autoSetVerificationStatus()
      
      this.showEditUserModal = true
    },
    autoSetVerificationStatus() {
      // If RFID code is N/A, set to Unverified
      if (!this.editingUser.rfid_code || this.editingUser.rfid_code === 'N/A') {
        this.editingUser.rfid_status = 'unverified'
      }
      // If RFID has a value and it's not "UNREADABLE", set to Verified
      else if (this.editingUser.rfid_code && !this.editingUser.rfid_code.includes('UNREADABLE')) {
        this.editingUser.rfid_status = 'verified'
      }
      // If RFID is "UNREADABLE:N/A", set to Unreadable
      else if (this.editingUser.rfid_code && this.editingUser.rfid_code.includes('UNREADABLE')) {
        this.editingUser.rfid_status = 'unreadable'
      }
    },
    markRFIDAsUnreadable() {
      this.editingUser.rfid_code = 'UNREADABLE:N/A'
      this.editingUser.rfid_status = 'unreadable'
    },
    closeEditUserModal() {
      this.showEditUserModal = false
      this.editingUser = null
    },
    handlePhotoUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.showNotification('error', 'File Too Large', 'File size must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showNotification('error', 'Invalid File', 'Please select a valid image file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        this.editingUser.photo = e.target.result
      }
      reader.readAsDataURL(file)
    },
    async saveEditUser() {
      if (!this.editingUser) return

      this.isSavingUser = true
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        if (!token) {
          this.showNotification('error', 'Authentication Error', 'Authentication required. Please login again.')
          return
        }

        // Use original student ID for API call (to support ID renames), fallback to current ID
        const userId = this.editingUser.originalStudentId || this.editingUser.student_id || this.editingUser._id || this.editingUser.id
        
        // Auto-set rfid_status based on rfid_code before saving
        let rfidStatus = this.editingUser.rfid_status
        if (this.editingUser.rfid_code) {
          if (this.editingUser.rfid_code === 'N/A' || !this.editingUser.rfid_code) {
            rfidStatus = 'unverified'
          } else if (this.editingUser.rfid_code.includes('UNREADABLE')) {
            rfidStatus = 'unreadable'
          } else {
            rfidStatus = 'verified'
          }
        } else {
          rfidStatus = 'unverified'
        }
        
        // Prepare update data (without role - defaults to student)
        const updateData = {
          first_name: this.editingUser.first_name,
          middle_name: this.editingUser.middle_name,
          last_name: this.editingUser.last_name,
          suffix: this.editingUser.suffix,
          email: this.editingUser.email,
          program: this.editingUser.program,
          year_level: this.editingUser.year_level,
          student_id: this.editingUser.student_id,
          rfid_code: this.editingUser.rfid_code,
          rfid_status: rfidStatus,
          photo: this.editingUser.photo,
          role: 'student'
        }

        const userCollege = this.editingUser.college || this.currentUser?.college || localStorage.getItem('loginChosenDepartment') || 'CCS'
        const timestamp = encodeTimestamp()
        const response = await fetch(buildAPIUrl(`/apis/students/${userId}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-SSAAM-College': userCollege,
            'X-SSAAM-TS': timestamp,
            'X-SSAAM-Original-Student-Id': userId
          },
          body: JSON.stringify(updateData)
        })

        if (response.ok) {
          // Update the user in allUsers
          const index = this.allUsers.findIndex(u => (u._id || u.id || u.student_id) === userId)
          if (index !== -1) {
            this.allUsers[index] = { ...this.allUsers[index], ...updateData }
          }
          this.showNotification('success', 'Success', 'User updated successfully')
          this.closeEditUserModal()
          await this.refreshData()
        } else {
          const errorData = await response.json()
          this.showNotification('error', 'Failed', 'Failed to update user: ' + (errorData.message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Error updating user:', error)
        this.showNotification('error', 'Error', 'Error updating user')
      } finally {
        this.isSavingUser = false
      }
    },
    markPhotoFailed(key) {
      if (!key) return
      // Reactive set on a plain object using Vue 3 deep reactivity
      this.photoFailed = { ...this.photoFailed, [key]: true }
    },
    selectRoleResult(student) {
      this.roleTargetStudent = student
      this.roleSearchResults = []
      this.roleTargetCollegeDept = student?.college || this.currentUser?.college || localStorage.getItem('loginChosenDepartment') || 'CCS'
    },
    async searchStudentForRole() {
      if (!this.roleSearchQuery.trim()) return
      this.isSearchingRole = true
      this.roleTargetStudent = null
      this.roleSearchResults = []
      this.selectedNewRole = null
      this.roleAssignError = ''
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        const college = this.currentUser?.college || localStorage.getItem('loginChosenDepartment') || 'CCS'
        // Use multi-result search so name queries return up to 10 candidates.
        const response = await fetch(buildAPIUrl('/apis/students/search-multi'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-SSAAM-College': college
          },
          body: JSON.stringify({ search_query: this.roleSearchQuery.trim() })
        })
        if (response.ok) {
          const data = await response.json()
          const results = Array.isArray(data.students) ? data.students : []
          if (results.length === 1) {
            // Auto-select on a unique match (e.g. exact student ID).
            this.selectRoleResult(results[0])
          } else {
            this.roleSearchResults = results
          }
        } else {
          this.roleSearchResults = []
        }
      } catch (e) {
        console.error('Error searching student for role:', e)
        this.roleSearchResults = []
      } finally {
        this.isSearchingRole = false
      }
    },
    async assignStudentRole() {
      if (!this.roleTargetStudent || !this.selectedNewRole) return
      this.isAssigningRole = true
      this.roleAssignError = ''
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        const college = this.roleTargetCollegeDept || this.roleTargetStudent.college || this.currentUser?.college || localStorage.getItem('loginChosenDepartment') || 'CCS'
        const { encodeTimestamp } = await import('../utils/ssaamCrypto.js')
        const timestamp = encodeTimestamp()
        const studentId = this.roleTargetStudent.student_id
        const response = await fetch(buildAPIUrl(`/apis/students/${studentId}/role`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-SSAAM-College': college,
            'X-SSAAM-TS': timestamp
          },
          body: JSON.stringify({ role: this.selectedNewRole })
        })
        const data = await response.json()
        if (response.ok) {
          const roleLabel = this.availableStudentRoles.find(r => r.value === this.selectedNewRole)?.label || this.selectedNewRole
          this.recentRoleAssignments.unshift({
            student_id: studentId,
            name: `${this.roleTargetStudent.first_name} ${this.roleTargetStudent.last_name}`,
            photo: this.roleTargetStudent.photo || '',
            role: this.selectedNewRole,
            time: new Date().toLocaleTimeString()
          })
          if (this.recentRoleAssignments.length > 10) this.recentRoleAssignments.pop()
          this.roleTargetStudent = { ...this.roleTargetStudent, role: this.selectedNewRole }
          this.showNotification('success', 'Role Assigned', `${this.roleTargetStudent.first_name} is now a ${roleLabel}.`)
          this.selectedNewRole = null
        } else {
          this.roleAssignError = data.message || 'Failed to assign role.'
        }
      } catch (e) {
        console.error('Error assigning role:', e)
        this.roleAssignError = 'Network error. Please try again.'
      } finally {
        this.isAssigningRole = false
      }
    },
    async fetchCollegeMembers(college) {
      this.collegeMembersModalData = { college, members: [] }
      this.showCollegeMembersModal = true
      this.loadingCollegeMembers = true
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        const response = await fetch(buildAPIUrl(`/apis/students/role-members?college=${college}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-SSAAM-College': college
          }
        })
        if (response.ok) {
          const data = await response.json()
          this.collegeMembersModalData = { college, members: data.members || [] }
        }
      } catch (e) {
        console.error('Error fetching college members:', e)
      } finally {
        this.loadingCollegeMembers = false
      }
    },
    confirmDeleteUser(user) {
      this.userToDelete = user
      this.showDeleteConfirmModal = true
    },
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false
      this.userToDelete = null
    },
    async deleteUser() {
      if (!this.userToDelete) return

      this.isDeletingUser = true
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        if (!token) {
          this.showNotification('error', 'Authentication Error', 'Authentication required. Please login again.')
          return
        }

        const userId = this.userToDelete.student_id || this.userToDelete._id || this.userToDelete.id
        const deleteCollege = this.userToDelete.college || this.currentUser?.college || localStorage.getItem('loginChosenDepartment') || 'CCS'

        const response = await fetch(buildAPIUrl(`/apis/students/${userId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-SSAAM-College': deleteCollege,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          // Remove the user from allUsers
          this.allUsers = this.allUsers.filter(u => (u._id || u.id || u.student_id) !== userId)
          // Emit event to sync deletion with Contributions view
          window.dispatchEvent(new CustomEvent('user-deleted', { detail: { userId } }))
          this.showNotification('success', 'Success', 'User deleted successfully')
          this.closeDeleteConfirmModal()
        } else {
          const errorData = await response.json()
          this.showNotification('error', 'Failed', 'Failed to delete user: ' + (errorData.message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        this.showNotification('error', 'Error', 'Error deleting user')
      } finally {
        this.isDeletingUser = false
      }
    }
  },
  mounted() {
    // Skip loading if data is already populated (prevents duplicate fetch)
    if (!this.allUsers || this.allUsers.length === 0) {
      this.isLoading = true
      this.fetchAllUsers().finally(() => {
        this.isLoading = false
      })
    }
    // Listen for user deletion from Contributions view
    if (!this.handleUserDeletedEvent) {
      this.handleUserDeletedEvent = (e) => {
        const userId = e?.detail?.userId
        if (userId) {
          this.allUsers = this.allUsers.filter(u => (u._id || u.id || u.student_id) !== userId)
        }
      }
    }
    window.addEventListener('user-deleted', this.handleUserDeletedEvent)
  },
  beforeUnmount() {
    // Clean up event listener
    if (this.handleUserDeletedEvent) {
      window.removeEventListener('user-deleted', this.handleUserDeletedEvent)
    }
  }
}
</script>

<style scoped>
.modal-bounce-enter-active {
  animation: modal-bounce 0.3s ease-out;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.notification-pop-enter-active {
  animation: notification-pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.notification-pop-leave-active {
  animation: notification-pop-leave 0.3s ease-out;
}

@keyframes modal-bounce {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes notification-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes notification-pop-leave {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0;
  }
}

/* Filter animations */
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeInUp 0.4s ease-out 0.1s both;
}

.animate-fade-in-delay-1 {
  animation: fadeInUp 0.4s ease-out 0.2s both;
}

.animate-fade-in-delay-2 {
  animation: fadeInUp 0.4s ease-out 0.3s both;
}

/* Sweep effect animation */
@keyframes sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-sweep {
  animation: sweep 2s infinite;
}
</style>