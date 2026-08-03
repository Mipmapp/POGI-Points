<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <svg :class="['animate-spin h-8 w-8', isCOE ? 'text-orange-500' : isSOM ? 'text-green-500' : isCNAHS ? 'text-emerald-500' : 'text-blue-500']" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
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
        <div class="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            @click="activeTab = 'users'"
            :class="[
              'px-4 md:px-5 py-1.5 font-semibold rounded-lg transition-all duration-200 text-sm',
              activeTab === 'users'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Users
          </button>
          <button
            @click="activeTab = 'roles'"
            :class="[
              'px-4 md:px-5 py-1.5 font-semibold rounded-lg transition-all duration-200 text-sm',
              activeTab === 'roles'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Roles
          </button>
        </div>

        <!-- Unvalidated students banner (moved here from Users tab body) -->
        <div
          v-if="appSettings?.schoolYear && appSettings?.semester && unvalidatedCount > 0 && userValidationFilter !== 'not_validated' && !dismissedUnvalidatedBanner"
          :class="['flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm', isCOE ? 'bg-orange-50 border-orange-200' : isSOM ? 'bg-yellow-50 border-yellow-200' : isCNAHS ? 'bg-yellow-50 border-yellow-200' : 'bg-orange-50 border-orange-200']"
        >
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <span class="font-medium text-orange-800">
              <strong>{{ unvalidatedCount }}</strong> student{{ unvalidatedCount === 1 ? '' : 's' }} haven't logged in yet for
              <strong>{{ appSettings.semester }} {{ appSettings.schoolYear }}</strong>
            </span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="userValidationFilter = 'not_validated'; currentPage = 1"
              class="px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 transition active:scale-95"
            >Show them</button>
            <button
              @click="dismissedUnvalidatedBanner = true"
              class="w-6 h-6 flex items-center justify-center rounded-full text-orange-400 hover:text-orange-700 hover:bg-orange-100 transition active:scale-95"
              title="Dismiss"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- USERS TAB -->
      <div v-if="activeTab === 'users'" class="space-y-6">

        <div
          v-if="userValidationFilter === 'not_validated'"
          class="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-sm"
        >
          <span class="font-medium text-indigo-800">Showing <strong>{{ filteredUsers.length }}</strong> unvalidated student{{ filteredUsers.length === 1 ? '' : 's' }}</span>
          <button @click="userValidationFilter = null" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline transition">Clear filter</button>
        </div>

        <!-- Users Search and Filter -->
        <div class="rounded-xl p-4 md:p-5 mb-6 space-y-4 bg-white border border-gray-200 shadow-sm relative z-10">
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
          
          <!-- Filters: custom dropdown row -->
          <div class="flex flex-wrap justify-center gap-3 animate-fade-in">

            <!-- Role -->
            <div class="space-y-1.5 w-40 relative" @click.stop>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">Role</label>
              <button
                @click="openDropdown = openDropdown === 'role' ? null : 'role'"
                :class="['w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm shadow-sm transition-all duration-150 cursor-pointer outline-none',
                  openDropdown === 'role' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                  userRoleFilter ? 'text-gray-900 font-medium' : 'text-gray-500']"
              >
                <span class="truncate">{{ userRoleFilter === 'student' ? 'Student' : userRoleFilter === 'treasurer' ? 'Treasurer' : userRoleFilter === 'co-admin' ? 'Co-Admin' : 'All Roles' }}</span>
                <svg :class="['w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-transform duration-150 text-gray-400', openDropdown === 'role' ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="openDropdown === 'role'" class="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
                <button v-for="opt in [{value:'',label:'All Roles'},{value:'student',label:'Student'},{value:'treasurer',label:'Treasurer'},{value:'co-admin',label:'Co-Admin'}]" :key="opt.value"
                  @click="userRoleFilter = opt.value || null; currentPage = 1; openDropdown = null"
                  :class="['w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50',
                    (userRoleFilter === opt.value || (!userRoleFilter && !opt.value)) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700']"
                >
                  <span>{{ opt.label }}</span>
                  <svg v-if="userRoleFilter === opt.value || (!userRoleFilter && !opt.value)" class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
            </div>

            <!-- Year Level -->
            <div class="space-y-1.5 w-40 relative" @click.stop>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">Year Level</label>
              <button
                @click="openDropdown = openDropdown === 'year' ? null : 'year'"
                :class="['w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm shadow-sm transition-all duration-150 cursor-pointer outline-none',
                  openDropdown === 'year' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                  userYearFilter ? 'text-gray-900 font-medium' : 'text-gray-500']"
              >
                <span class="truncate">{{ userYearFilter || 'All Years' }}</span>
                <svg :class="['w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-transform duration-150 text-gray-400', openDropdown === 'year' ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="openDropdown === 'year'" class="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
                <button v-for="opt in [{value:'',label:'All Years'},{value:'1st year',label:'1st Year'},{value:'2nd year',label:'2nd Year'},{value:'3rd year',label:'3rd Year'},{value:'4th year',label:'4th Year'}]" :key="opt.value"
                  @click="userYearFilter = opt.value || null; currentPage = 1; openDropdown = null"
                  :class="['w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50',
                    (userYearFilter === opt.value || (!userYearFilter && !opt.value)) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700']"
                >
                  <span>{{ opt.label }}</span>
                  <svg v-if="userYearFilter === opt.value || (!userYearFilter && !opt.value)" class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
            </div>

            <!-- Program -->
            <div class="space-y-1.5 w-40 relative" @click.stop>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">Program</label>
              <button
                @click="openDropdown = openDropdown === 'program' ? null : 'program'"
                :class="['w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm shadow-sm transition-all duration-150 cursor-pointer outline-none',
                  openDropdown === 'program' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                  userProgramFilter ? 'text-gray-900 font-medium' : 'text-gray-500']"
              >
                <span class="truncate">{{ userProgramFilter || 'All Programs' }}</span>
                <svg :class="['w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-transform duration-150 text-gray-400', openDropdown === 'program' ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="openDropdown === 'program'" class="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
                <button v-for="opt in [{value:'',label:'All Programs'},{value:'BSCS',label:'BSCS'},{value:'BSIT',label:'BSIT'},{value:'BSIS',label:'BSIS'}]" :key="opt.value"
                  @click="userProgramFilter = opt.value || null; currentPage = 1; openDropdown = null"
                  :class="['w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50',
                    (userProgramFilter === opt.value || (!userProgramFilter && !opt.value)) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700']"
                >
                  <span>{{ opt.label }}</span>
                  <svg v-if="userProgramFilter === opt.value || (!userProgramFilter && !opt.value)" class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
            </div>

            <!-- College (super admin only) -->
            <div v-if="isMaster && !isCoAdmin && !isTreasurer" class="space-y-1.5 w-40 relative" @click.stop>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">College</label>
              <button
                @click="openDropdown = openDropdown === 'college' ? null : 'college'"
                :class="['w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm shadow-sm transition-all duration-150 cursor-pointer outline-none',
                  openDropdown === 'college' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                  userCollegeFilter ? 'text-gray-900 font-medium' : 'text-gray-500']"
              >
                <span class="truncate">{{ userCollegeFilter || 'All Colleges' }}</span>
                <svg :class="['w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-transform duration-150 text-gray-400', openDropdown === 'college' ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="openDropdown === 'college'" class="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
                <button v-for="opt in [{value:'',label:'All Colleges'},{value:'CCS',label:'CCS'},{value:'COE',label:'COE'},{value:'SOM',label:'SOM'},{value:'CNAHS',label:'CNAHS'}]" :key="opt.value"
                  @click="userCollegeFilter = opt.value || null; currentPage = 1; openDropdown = null"
                  :class="['w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50',
                    (userCollegeFilter === opt.value || (!userCollegeFilter && !opt.value)) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700']"
                >
                  <span>{{ opt.label }}</span>
                  <svg v-if="userCollegeFilter === opt.value || (!userCollegeFilter && !opt.value)" class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
            </div>

            <!-- Semester Validation -->
            <div v-if="appSettings?.schoolYear && appSettings?.semester" class="space-y-1.5 w-44 relative" @click.stop>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">Sem. Validation</label>
              <button
                @click="openDropdown = openDropdown === 'validation' ? null : 'validation'"
                :class="['w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm shadow-sm transition-all duration-150 cursor-pointer outline-none',
                  openDropdown === 'validation' ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300',
                  userValidationFilter ? 'text-gray-900 font-medium' : 'text-gray-500']"
              >
                <span class="flex items-center gap-1.5 truncate">
                  <span v-if="userValidationFilter === 'validated'" class="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  <span v-else-if="userValidationFilter === 'not_validated'" class="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></span>
                  {{ userValidationFilter === 'validated' ? 'Validated' : userValidationFilter === 'not_validated' ? 'Not Validated' : 'All Students' }}
                </span>
                <svg :class="['w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-transform duration-150 text-gray-400', openDropdown === 'validation' ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="openDropdown === 'validation'" class="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
                <button v-for="opt in [{value:'',label:'All Students',dot:null},{value:'validated',label:'Validated',dot:'indigo'},{value:'not_validated',label:'Not Validated',dot:'orange'}]" :key="opt.value"
                  @click="userValidationFilter = opt.value || null; currentPage = 1; openDropdown = null"
                  :class="['w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50',
                    (userValidationFilter === opt.value || (!userValidationFilter && !opt.value)) ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-gray-700']"
                >
                  <span class="flex items-center gap-2">
                    <span v-if="opt.dot === 'indigo'" class="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                    <span v-else-if="opt.dot === 'orange'" class="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></span>
                    <span v-else class="w-1.5 h-1.5 flex-shrink-0"></span>
                    {{ opt.label }}
                  </span>
                  <svg v-if="userValidationFilter === opt.value || (!userValidationFilter && !opt.value)" class="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
            </div>

            <!-- Verification Status -->
            <div class="space-y-1.5 w-44 relative" @click.stop>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">Verification</label>
              <button
                @click="openDropdown = openDropdown === 'status' ? null : 'status'"
                :class="['w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm shadow-sm transition-all duration-150 cursor-pointer outline-none',
                  openDropdown === 'status' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                  userStatusFilter ? 'text-gray-900 font-medium' : 'text-gray-500']"
              >
                <span class="flex items-center gap-1.5 truncate">
                  <span v-if="userStatusFilter === 'verified'" class="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                  <span v-else-if="userStatusFilter === 'unverified'" class="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                  <span v-else-if="userStatusFilter === 'unreadable'" class="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"></span>
                  {{ userStatusFilter === 'verified' ? 'Verified' : userStatusFilter === 'unverified' ? 'Unverified' : userStatusFilter === 'unreadable' ? 'Unreadable' : 'All Statuses' }}
                </span>
                <svg :class="['w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-transform duration-150 text-gray-400', openDropdown === 'status' ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="openDropdown === 'status'" class="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
                <button v-for="opt in [{value:'',label:'All Statuses',dot:null},{value:'verified',label:'Verified',dot:'green'},{value:'unverified',label:'Unverified',dot:'red'},{value:'unreadable',label:'Unreadable',dot:'yellow'}]" :key="opt.value"
                  @click="userStatusFilter = opt.value || null; currentPage = 1; openDropdown = null"
                  :class="['w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50',
                    (userStatusFilter === opt.value || (!userStatusFilter && !opt.value)) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700']"
                >
                  <span class="flex items-center gap-2">
                    <span v-if="opt.dot === 'green'" class="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                    <span v-else-if="opt.dot === 'red'" class="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                    <span v-else-if="opt.dot === 'yellow'" class="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"></span>
                    <span v-else class="w-1.5 h-1.5 flex-shrink-0"></span>
                    {{ opt.label }}
                  </span>
                  <svg v-if="userStatusFilter === opt.value || (!userStatusFilter && !opt.value)" class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
            </div>

            <!-- AY Year -->
            <div class="space-y-1.5 w-40 relative" @click.stop>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">AY Year</label>
              <button
                @click="openDropdown = openDropdown === 'acadYear' ? null : 'acadYear'"
                :class="['w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm shadow-sm transition-all duration-150 cursor-pointer outline-none',
                  openDropdown === 'acadYear' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                  userAcadYearFilter ? 'text-gray-900 font-medium' : 'text-gray-500']"
              >
                <span class="truncate">{{ userAcadYearFilter || 'All Years' }}</span>
                <svg :class="['w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-transform duration-150 text-gray-400', openDropdown === 'acadYear' ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="openDropdown === 'acadYear'" class="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
                <button v-for="opt in [{value:'',label:'All Years'},{value:'2025-2026',label:'2025-2026'},{value:'2026-2027',label:'2026-2027'}]" :key="opt.value"
                  @click="userAcadYearFilter = opt.value || null; currentPage = 1; openDropdown = null"
                  :class="['w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50',
                    (userAcadYearFilter === opt.value || (!userAcadYearFilter && !opt.value)) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700']"
                >
                  <span>{{ opt.label }}</span>
                  <svg v-if="userAcadYearFilter === opt.value || (!userAcadYearFilter && !opt.value)" class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
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
        <div v-if="filteredUsers.length > 0" class="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          <div v-for="(user, idx) in paginatedUsers" :key="user._id || user.id || user.student_id"
            class="ssaam-row-anim"
            :style="{ animationDelay: Math.min(idx * 20, 400) + 'ms' }">

            <!-- ── Compact Row ── -->
            <div
              @click="toggleExpand(user)"
              :class="['flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 select-none', expandedUserId === (user._id || user.student_id) ? (isCOE ? 'bg-orange-50' : isSOM ? 'bg-green-50' : isCNAHS ? 'bg-green-50' : 'bg-blue-50') : 'bg-white hover:bg-gray-50']"
            >
              <!-- Avatar -->
              <div :class="['w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs overflow-hidden', isCOE ? 'bg-gradient-to-br from-orange-400 to-red-400' : isSOM ? 'bg-gradient-to-br from-green-400 to-yellow-500' : isCNAHS ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-ssaam-dark to-ssaam-light']">
                <img
                  v-if="user.photo && !photoFailed[user._id || user.student_id]"
                  :src="user.photo"
                  :alt="getInitials(user)"
                  class="w-full h-full object-cover"
                  @error="markPhotoFailed(user._id || user.student_id)"
                  referrerpolicy="no-referrer"
                />
                <span v-else class="text-[11px]">{{ getInitials(user) }}</span>
              </div>

              <!-- Name + ID -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {{ user.full_name || user.first_name || user.firstName }}{{ (user.last_name || user.lastName) ? ' ' + (user.last_name || user.lastName) : '' }}{{ user.suffix ? (' ' + user.suffix) : '' }}
                </p>
                <p class="text-xs text-gray-500 font-mono leading-tight mt-0.5">{{ user.student_id }}</p>
              </div>

              <!-- Badges (hidden on very small screens) -->
              <div class="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                <!-- Role -->
                <span v-if="user.role && user.role !== 'student'" class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 capitalize">{{ user.role }}</span>
                <span v-else class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">Student</span>
                <!-- College (master only) -->
                <span v-if="isMaster && user.college" :class="['px-2 py-0.5 rounded-full text-[11px] font-bold', user.college === 'COE' ? 'bg-orange-100 text-orange-700' : user.college === 'SOM' ? 'bg-green-100 text-green-700' : user.college === 'CNAHS' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700']">{{ user.college }}</span>
                <!-- Verification -->
                <span v-if="getAutoVerificationStatus(user) === true" class="flex items-center gap-0.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[11px] font-bold">
                  <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                  Verified
                </span>
                <span v-else-if="getAutoVerificationStatus(user) === false" class="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[11px] font-bold">Unverified</span>
                <span v-else-if="getAutoVerificationStatus(user) === 'unreadable'" class="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[11px] font-bold">Unreadable</span>
                <!-- Semester Validation badge -->
                <span
                  v-if="appSettings?.schoolYear && appSettings?.semester && user.school_year === appSettings.schoolYear && user.semester === appSettings.semester"
                  class="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-bold"
                  :title="`Validated for ${appSettings.semester} ${appSettings.schoolYear}`"
                >✓ Validated</span>
                <span
                  v-else-if="appSettings?.schoolYear && appSettings?.semester"
                  class="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[11px] font-bold"
                  :title="`Has not logged in for ${appSettings.semester} ${appSettings.schoolYear} yet`"
                >Not Validated</span>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-1.5 flex-shrink-0" @click.stop>
                <button @click="editUser(user)" class="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-150 active:scale-95" title="Edit">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button @click="confirmDeleteUser(user)" class="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-150 active:scale-95" title="Delete">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>

              <!-- View icon hint -->
              <svg class="w-4 h-4 flex-shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
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
      <div class="rounded-xl p-5 md:p-6 shadow-sm border border-gray-200 bg-white space-y-5">
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
              <h4 class="font-bold text-gray-900 text-sm">{{ roleTargetStudent.full_name }}{{ roleTargetStudent.last_name ? ' ' + roleTargetStudent.last_name : '' }}{{ roleTargetStudent.suffix ? ' ' + roleTargetStudent.suffix : '' }}</h4>
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
              <p class="text-sm font-bold text-gray-900 truncate">{{ r.full_name }}{{ r.last_name ? ' ' + r.last_name : '' }}</p>
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

      <!-- College Role Members -->
      <div class="space-y-3">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest px-0.5">Role Members by College</h3>

        <!-- Master admin: 4-college card grid (click → modal) -->
        <div v-if="isMaster && !isCoAdmin && !isTreasurer" class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            v-for="col in ['CCS','COE','SOM','CNAHS']"
            :key="col"
            @click="fetchCollegeMembers(col)"
            class="group bg-white rounded-xl p-4 text-left transition-all active:scale-95 border border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3">
              <div :class="['w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', col === 'COE' ? 'bg-orange-50' : col === 'SOM' ? 'bg-green-50' : col === 'CNAHS' ? 'bg-teal-50' : 'bg-blue-50']">
                <img :src="`/icons/${col.toLowerCase()}.svg`" :alt="col" class="w-6 h-6 object-contain" />
              </div>
              <div>
                <span class="font-bold text-gray-800 text-sm block">{{ col }}</span>
                <span class="text-[10px] text-gray-400">Roles</span>
              </div>
            </div>
            <svg class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        <!-- Single-college user: inline members list -->
        <div v-else class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <!-- College header row -->
          <div class="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isCOE ? 'bg-orange-50' : isSOM ? 'bg-green-50' : isCNAHS ? 'bg-teal-50' : 'bg-blue-50']">
              <img :src="`/icons/${(currentUser.college || 'CCS').toLowerCase()}.svg`" :alt="currentUser.college || 'CCS'" class="w-5 h-5 object-contain" />
            </div>
            <span class="font-bold text-gray-800 text-sm">{{ currentUser.college || 'CCS' }}</span>
            <span class="text-xs text-gray-400 ml-auto" v-if="!loadingInlineMembers">
              {{ inlineCollegeMembers.length }} member{{ inlineCollegeMembers.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Loading -->
          <div v-if="loadingInlineMembers" class="flex items-center justify-center py-10">
            <svg class="w-5 h-5 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          </div>

          <!-- Empty -->
          <div v-else-if="inlineCollegeMembers.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400">
            <svg class="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p class="text-sm">No members assigned yet</p>
          </div>

          <!-- Members grouped by role -->
          <template v-else v-for="roleGroup in ['co-admin', 'treasurer']" :key="roleGroup">
            <div v-if="inlineCollegeMembers.filter(m => m.role === roleGroup).length > 0">
              <!-- Group label -->
              <div class="px-5 py-1.5 flex items-center gap-2 bg-gray-50 border-b border-gray-100">
                <span :class="['text-[10px] font-black uppercase tracking-widest', roleGroup === 'co-admin' ? 'text-violet-500' : 'text-cyan-600']">
                  {{ roleGroup === 'co-admin' ? 'Co-Admins' : 'Treasurers' }}
                </span>
                <span class="text-[10px] text-gray-300 font-semibold">({{ inlineCollegeMembers.filter(m => m.role === roleGroup).length }})</span>
              </div>
              <!-- Member rows -->
              <div v-for="member in inlineCollegeMembers.filter(m => m.role === roleGroup)" :key="member.student_id"
                class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                <div class="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200">
                  <img v-if="member.photo && !photoFailed['inl-' + (member._id || member.student_id)]"
                    :src="member.photo" class="w-full h-full object-cover"
                    @error="markPhotoFailed('inl-' + (member._id || member.student_id))" referrerpolicy="no-referrer" />
                  <div v-else class="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                    {{ (member.full_name || member.last_name || '?').charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 text-sm truncate">
                    {{ member.full_name }}{{ member.last_name ? ' ' + member.last_name : '' }}{{ member.suffix ? ' ' + member.suffix : '' }}
                  </p>
                  <p class="text-xs text-gray-400 truncate">{{ member.student_id }} · {{ member.program }} – {{ member.year_level }}</p>
                </div>
                <span :class="['px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex-shrink-0',
                  member.role === 'co-admin' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-cyan-600']">
                  {{ member.role === 'co-admin' ? 'Co-Admin' : 'Treasurer' }}
                </span>
              </div>
            </div>
          </template>
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
    <div v-if="showCollegeMembersModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" @click.self="showCollegeMembersModal = false">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[78vh] flex flex-col overflow-hidden border border-gray-100">

          <!-- Modal Header -->
          <div class="px-5 py-4 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div :class="['w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                collegeMembersModalData.college === 'COE' ? 'bg-orange-50' :
                collegeMembersModalData.college === 'SOM' ? 'bg-green-50' :
                collegeMembersModalData.college === 'CNAHS' ? 'bg-teal-50' : 'bg-blue-50']">
                <img :src="`/icons/${collegeMembersModalData.college.toLowerCase()}.svg`" :alt="collegeMembersModalData.college" class="w-6 h-6 object-contain" />
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-sm leading-tight">{{ collegeMembersModalData.college }}</h3>
                <p class="text-[11px] text-gray-400 leading-tight">Assigned Role Members</p>
              </div>
            </div>
            <button @click="showCollegeMembersModal = false" class="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loadingCollegeMembers" class="flex-1 flex items-center justify-center py-10">
            <svg class="w-6 h-6 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          </div>

          <!-- Empty State -->
          <div v-else-if="!collegeMembersModalData.members.length" class="flex-1 flex flex-col items-center justify-center py-10 text-gray-400">
            <svg class="w-10 h-10 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p class="text-sm font-medium text-gray-500">No members assigned yet</p>
          </div>

          <!-- Members List -->
          <div v-else class="flex-1 overflow-y-auto">
            <template v-for="roleGroup in ['co-admin', 'treasurer']" :key="roleGroup">
              <div v-if="collegeMembersModalData.members.filter(m => m.role === roleGroup).length > 0">
                <!-- Group label -->
                <div class="px-5 py-1.5 flex items-center gap-2 sticky top-0 bg-white border-b border-gray-50 z-10">
                  <span :class="['text-[10px] font-black uppercase tracking-widest',
                    roleGroup === 'co-admin' ? 'text-violet-500' : 'text-cyan-600']">
                    {{ roleGroup === 'co-admin' ? 'Co-Admins' : 'Treasurers' }}
                  </span>
                  <span class="text-[10px] text-gray-300 font-semibold">({{ collegeMembersModalData.members.filter(m => m.role === roleGroup).length }})</span>
                </div>
                <!-- Member rows -->
                <div v-for="member in collegeMembersModalData.members.filter(m => m.role === roleGroup)" :key="member.student_id"
                  class="px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div class="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200">
                    <img v-if="member.photo && !photoFailed['mem-' + (member._id || member.student_id)]"
                      :src="member.photo" class="w-full h-full object-cover"
                      @error="markPhotoFailed('mem-' + (member._id || member.student_id))" referrerpolicy="no-referrer" />
                    <div v-else class="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                      {{ (member.full_name || member.last_name || '?').charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 text-sm truncate leading-tight">
                      {{ member.full_name }}{{ member.last_name ? ' ' + member.last_name : '' }}{{ member.suffix ? ' ' + member.suffix : '' }}
                    </p>
                    <p class="text-[11px] text-gray-400 truncate leading-tight">{{ member.student_id }} · {{ member.program }} – {{ member.year_level }}</p>
                  </div>
                  <span :class="['px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex-shrink-0',
                    member.role === 'co-admin' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-cyan-600']">
                    {{ member.role === 'co-admin' ? 'Co-Admin' : 'Treasurer' }}
                  </span>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t border-gray-100 flex-shrink-0">
            <p class="text-[11px] text-gray-400 text-center">{{ collegeMembersModalData.members.length }} member{{ collegeMembersModalData.members.length !== 1 ? 's' : '' }} in {{ collegeMembersModalData.college }}</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- View User Modal -->
    <div v-if="showViewUserModal && viewingUser" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" @click.self="closeViewUserModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">

          <!-- Header: avatar + name + close -->
          <div class="px-6 pt-6 pb-4 flex items-start gap-4 flex-shrink-0">
            <!-- Avatar -->
            <div class="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
              <img v-if="viewingUser.photo && !photoFailed[viewingUser._id || viewingUser.student_id]"
                :src="viewingUser.photo" class="w-full h-full object-cover"
                @error="markPhotoFailed(viewingUser._id || viewingUser.student_id)" referrerpolicy="no-referrer" />
              <div v-else :class="['w-full h-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br', isCOE ? 'from-orange-400 to-red-500' : isSOM ? 'from-green-400 to-teal-500' : isCNAHS ? 'from-teal-400 to-green-500' : 'from-blue-500 to-indigo-600']">
                {{ getInitials(viewingUser) }}
              </div>
            </div>
            <!-- Name + ID -->
            <div class="flex-1 min-w-0 pt-0.5">
              <h3 class="font-bold text-gray-900 text-lg leading-tight truncate">
                {{ viewingUser.full_name || viewingUser.first_name || viewingUser.firstName }}{{ (viewingUser.last_name || viewingUser.lastName) ? ' ' + (viewingUser.last_name || viewingUser.lastName) : '' }}{{ viewingUser.suffix ? ' ' + viewingUser.suffix : '' }}
              </h3>
              <p class="text-sm text-gray-400 font-mono mt-0.5 tracking-wide">{{ viewingUser.student_id }}</p>
              <!-- Badges -->
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <span v-if="viewingUser.role && viewingUser.role !== 'student'" class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-900 text-white capitalize">{{ viewingUser.role }}</span>
                <span v-else class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">Student</span>
                <span v-if="isMaster && viewingUser.college" :class="['px-2 py-0.5 rounded-full text-[11px] font-semibold', viewingUser.college === 'COE' ? 'bg-orange-100 text-orange-700' : viewingUser.college === 'SOM' ? 'bg-green-100 text-green-700' : viewingUser.college === 'CNAHS' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700']">{{ viewingUser.college }}</span>
                <span v-if="getAutoVerificationStatus(viewingUser) === true" class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">✓ Verified</span>
                <span v-else-if="getAutoVerificationStatus(viewingUser) === false" class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Unverified</span>
                <span v-else-if="getAutoVerificationStatus(viewingUser) === 'unreadable'" class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-600">Unreadable</span>
              </div>
            </div>
            <!-- Close button -->
            <button @click="closeViewUserModal" class="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition mt-0.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Info grid -->
          <div class="px-6 pb-4 flex-shrink-0">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 rounded-2xl px-4 py-3">
                <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                <p class="text-sm text-gray-800 font-medium break-all leading-snug">{{ viewingUser.email || '—' }}</p>
              </div>
              <div class="bg-gray-50 rounded-2xl px-4 py-3">
                <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Program</p>
                <p class="text-sm text-gray-800 font-semibold">{{ viewingUser.program || '—' }}</p>
              </div>
              <div class="bg-gray-50 rounded-2xl px-4 py-3">
                <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Year Level</p>
                <p class="text-sm text-gray-800 font-semibold">{{ viewingUser.year_level || '—' }}</p>
              </div>
              <div class="bg-gray-50 rounded-2xl px-4 py-3 flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">RFID</p>
                  <p class="text-sm font-mono font-bold leading-snug" :class="viewingUser.rfid_code && viewingUser.rfid_code !== 'N/A' ? 'text-gray-800' : 'text-red-400'">
                    {{ viewingUser.rfid_code ? (viewingUser.rfid_code.length > 10 ? viewingUser.rfid_code.substring(0, 10) + '…' : viewingUser.rfid_code) : 'N/A' }}
                  </p>
                </div>
                <button @click="copyToClipboard(viewingUser.student_id)" class="flex-shrink-0 mt-1 p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-200 transition" title="Copy Student ID">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="mx-6 border-t border-gray-100 flex-shrink-0"></div>

          <!-- Attendance section — scrollable -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Attendance Record</p>

            <!-- Loading -->
            <div v-if="attendanceFetching[viewingUser._id || viewingUser.student_id]" class="flex items-center gap-2 py-8 justify-center text-sm text-gray-400">
              <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Loading attendance…
            </div>

            <!-- No records -->
            <div v-else-if="userAttendanceCache[viewingUser._id || viewingUser.student_id] && userAttendanceCache[viewingUser._id || viewingUser.student_id].length === 0"
              class="text-sm text-gray-400 py-8 text-center">
              No closed events found for this student.
            </div>

            <!-- Records loaded -->
            <div v-else-if="userAttendanceCache[viewingUser._id || viewingUser.student_id]">
              <!-- Summary row -->
              <div class="grid grid-cols-4 gap-2 mb-4">
                <div class="flex flex-col items-center py-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span class="text-xl font-black text-gray-900 leading-none">{{ getAttendanceSummary(viewingUser).present }}</span>
                  <span class="text-[10px] text-green-600 font-semibold mt-1.5">Present</span>
                </div>
                <div class="flex flex-col items-center py-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span class="text-xl font-black text-gray-900 leading-none">{{ getAttendanceSummary(viewingUser).absent }}</span>
                  <span class="text-[10px] text-red-500 font-semibold mt-1.5">Absent</span>
                </div>
                <div class="flex flex-col items-center py-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span class="text-xl font-black text-gray-900 leading-none">{{ getAttendanceSummary(viewingUser).late }}</span>
                  <span class="text-[10px] text-amber-500 font-semibold mt-1.5">Late</span>
                </div>
                <div class="flex flex-col items-center py-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span class="text-xl font-black text-gray-900 leading-none">{{ getAttendanceSummary(viewingUser).excused }}</span>
                  <span class="text-[10px] text-blue-500 font-semibold mt-1.5">Excused</span>
                </div>
              </div>

              <!-- Event rows -->
              <div class="space-y-1">
                <div
                  v-for="rec in userAttendanceCache[viewingUser._id || viewingUser.student_id]"
                  :key="rec.event._id"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <div :class="['w-2 h-2 rounded-full flex-shrink-0', rec.overall_status === 'present' ? 'bg-green-500' : rec.overall_status === 'late' ? 'bg-amber-400' : rec.overall_status === 'excused' ? 'bg-blue-400' : 'bg-red-400']"></div>
                  <span class="flex-1 text-gray-700 truncate font-medium">{{ rec.event.title }}</span>
                  <span class="text-gray-300 flex-shrink-0 text-xs">{{ rec.event.event_date ? new Date(rec.event.event_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—' }}</span>
                  <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 capitalize', rec.overall_status === 'present' ? 'bg-green-100 text-green-700' : rec.overall_status === 'late' ? 'bg-amber-100 text-amber-700' : rec.overall_status === 'excused' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-500']">{{ rec.overall_status }}</span>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div v-else-if="attendanceError[viewingUser._id || viewingUser.student_id]" class="text-sm text-red-400 py-8 text-center">
              Failed to load attendance.
              <button @click="fetchStudentAttendance(viewingUser)" class="underline ml-1 text-gray-600">Retry</button>
            </div>

            <!-- Not fetched yet -->
            <div v-else class="py-8 text-center">
              <button @click="fetchStudentAttendance(viewingUser)" class="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition">Load Attendance</button>
            </div>
          </div>

          <!-- Footer actions -->
          <div class="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
            <button @click="editUser(viewingUser); closeViewUserModal()"
              :class="['flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl active:scale-[0.98] text-white text-sm font-semibold transition-all', isCOE ? 'bg-orange-700 hover:bg-orange-800' : isSOM ? 'bg-green-600 hover:bg-green-700' : isCNAHS ? 'bg-green-700 hover:bg-green-800' : 'bg-blue-600 hover:bg-blue-700']">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Edit User
            </button>
            <button @click="closeViewUserModal"
              class="flex-1 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-700 text-sm font-semibold transition-all">
              Close
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal && editingUser" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeEditUserModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-xl max-w-xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 class="text-base font-bold text-gray-900">Edit User</h3>
            <button @click="closeEditUserModal" class="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Edit Form (scrollable) -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
          <div class="space-y-4 mb-6">
            <!-- Profile Picture Preview and Upload -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
              <div class="flex items-start gap-4">
                <div :class="['w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-lg overflow-hidden border-2 border-gray-300', isCOE ? 'bg-gradient-to-br from-orange-400 to-red-400' : isSOM ? 'bg-gradient-to-br from-green-400 to-yellow-500' : isCNAHS ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-ssaam-dark to-ssaam-light']">
                  <img
                    v-if="editingUser.photo && !photoFailed['edit-' + (editingUser._id || editingUser.student_id)]"
                    :src="editingUser.photo"
                    :alt="editingUser.full_name || editingUser.last_name || ''"
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
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student ID</label>
                <input 
                  v-model="editingUser.student_id"
                  type="text"
                  :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">RFID</label>
                <input 
                  v-model="editingUser.rfid_code"
                  type="text"
                  :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
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

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  v-model="editingUser.full_name"
                  type="text"
                  placeholder="e.g. JUAN DELA CRUZ"
                  :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                <input 
                  v-model="editingUser.last_name"
                  type="text"
                  :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Suffix <span class="font-normal normal-case text-gray-400">(opt.)</span></label>
                <div>
                  <select v-model="editingUser.suffix" :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none appearance-none bg-white text-sm', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : isCNAHS ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']">
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
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input 
                v-model="editingUser.email"
                type="email"
                :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Program</label>
                <select 
                  v-model="editingUser.program"
                  :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
                >
                  <option value="N/A">N/A</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSIS">BSIS</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year Level</label>
                <select 
                  v-model="editingUser.year_level"
                  :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
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
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Verification Status</label>
              <select 
                v-model="editingUser.rfid_status"
                :class="['w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none bg-white text-sm', isCOE ? 'focus:ring-2 focus:ring-orange-600 focus:border-transparent' : isSOM ? 'focus:ring-2 focus:ring-green-600 focus:border-transparent' : 'focus:ring-2 focus:ring-blue-600 focus:border-transparent']"
              >
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="unreadable">Unreadable</option>
              </select>
            </div>
          </div>
          </div><!-- end scrollable -->

          <!-- Action Buttons -->
          <div class="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button 
              @click="closeEditUserModal"
              class="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button 
              @click="saveEditUser"
              :disabled="isSavingUser"
              :class="['flex-1 bg-gradient-to-r text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2', primaryButtonGradient, primaryButtonHover]"
            >
              <svg v-if="isSavingUser" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ isSavingUser ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Delete User Confirmation Modal -->
    <div v-if="showDeleteConfirmModal && userToDelete" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" @click.self="closeDeleteConfirmModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden">
          <!-- Icon header -->
          <div class="pt-7 px-6 pb-4 text-center">
            <div class="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <h3 class="text-base font-bold text-gray-900 mb-1">Delete User</h3>
            <p class="text-sm text-gray-500 leading-relaxed">
              Remove <span class="font-semibold text-gray-800">{{ userToDelete.full_name || userToDelete.first_name || userToDelete.firstName }}{{ (userToDelete.last_name || userToDelete.lastName) ? ' ' + (userToDelete.last_name || userToDelete.lastName) : '' }}</span>? This cannot be undone.
            </p>
          </div>
          <div class="flex gap-2 px-6 pb-6">
            <button 
              @click="closeDeleteConfirmModal"
              class="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button 
              @click="deleteUser"
              :disabled="isDeletingUser"
              class="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <svg v-if="isDeletingUser" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
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
import { buildAPIUrl, getCollege } from '../config/api.js'
import { encodeTimestamp } from '../utils/ssaamCrypto.js'
import departments from '../config/departments.js'
import { COLLEGES } from '../config/themes.js'


export default {
  name: 'Manage',
  props: {
    appSettings: {
      type: Object,
      default: () => ({ schoolYear: '', semester: '' })
    }
  },
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
      userValidationFilter: null,
      userAcadYearFilter: null,
      dismissedUnvalidatedBanner: false,
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
      expandedUserId: null,
      showViewUserModal: false,
      viewingUser: null,
      userAttendanceCache: {},
      attendanceFetching: {},
      attendanceError: {},
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
      inlineCollegeMembers: [],
      loadingInlineMembers: false,
      openDropdown: null,
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
    isCOE() { return getCollege() === 'COE' },
    isSOM() { return getCollege() === 'SOM' },
    isCCS() { return getCollege() === 'CCS' },
    isCNAHS() { return getCollege() === 'CNAHS' },
    primaryButtonGradient() {
      if (this.isCOE) return 'from-orange-600 to-red-500'
      if (this.isSOM) return 'from-green-600 to-yellow-500'
      if (this.isCNAHS) return 'from-green-700 to-green-600'
      return 'from-ssaam-dark to-ssaam-light'
    },
    primaryButtonHover() {
      if (this.isCOE) return 'hover:from-orange-700 hover:to-red-600'
      if (this.isSOM) return 'hover:from-green-700 hover:to-yellow-600'
      if (this.isCNAHS) return 'hover:from-green-800 hover:to-green-700'
      return 'hover:from-ssaam-dark hover:to-ssaam-light'
    },
    primaryTextColor() {
      if (this.isCOE) return 'text-orange-600'
      if (this.isSOM) return 'text-green-600'
      if (this.isCNAHS) return 'text-green-700'
      return 'text-blue-600'
    },
    primaryTextHover() {
      if (this.isCOE) return 'hover:text-orange-800'
      if (this.isSOM) return 'hover:text-green-800'
      if (this.isCNAHS) return 'hover:text-green-900'
      return 'hover:text-blue-800'
    },
    primaryDarkText() {
      if (this.isCOE) return 'text-orange-900'
      if (this.isSOM) return 'text-green-900'
      if (this.isCNAHS) return 'text-green-900'
      return 'text-blue-900'
    },
    isMaster() { return this.currentUser?.isMaster === true },
    isCoAdmin() { return this.currentUser?.role === 'co-admin' },
    isTreasurer() { return this.currentUser?.isMaster === true && this.currentUser?.role === 'treasurer' },
    // End theme helpers
    unvalidatedCount() {
      const currentSchoolYear = this.appSettings?.schoolYear || ''
      const currentSemester = this.appSettings?.semester || ''
      if (!currentSchoolYear || !currentSemester) return 0
      return this.allUsers.filter(user =>
        user.school_year !== currentSchoolYear || user.semester !== currentSemester
      ).length
    },

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
          const fullName = ((user.full_name || user.first_name || user.firstName || '') + ' ' + (user.last_name || user.lastName || '')).toLowerCase()
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

      // Apply AY year filter
      if (this.userAcadYearFilter !== null) {
        filtered = filtered.filter(user => (user.school_year || '') === this.userAcadYearFilter)
      }

      // Apply semester validation filter
      if (this.userValidationFilter !== null) {
        const currentSchoolYear = this.appSettings?.schoolYear || ''
        const currentSemester = this.appSettings?.semester || ''
        filtered = filtered.filter(user => {
          const isValidated = !!(currentSchoolYear && currentSemester &&
            user.school_year === currentSchoolYear && user.semester === currentSemester)
          if (this.userValidationFilter === 'validated') return isValidated
          if (this.userValidationFilter === 'not_validated') return !isValidated
          return true
        })
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
    },
    userValidationFilter() {
      this.currentPage = 1
    },
    activeTab(val) {
      // Auto-load inline members for single-college users when Roles tab is opened
      if (val === 'roles' && !(this.isMaster && !this.isCoAdmin && !this.isTreasurer)) {
        this.fetchInlineCollegeMembers()
      }
    }
  },
  methods: {
    toggleExpand(user) {
      this.openViewUserModal(user)
    },
    openViewUserModal(user) {
      this.viewingUser = user
      this.showViewUserModal = true
      const uid = user._id || user.student_id
      if (!this.userAttendanceCache[uid] && !this.attendanceFetching[uid]) {
        this.fetchStudentAttendance(user)
      }
    },
    closeViewUserModal() {
      this.showViewUserModal = false
      this.viewingUser = null
    },
    async fetchStudentAttendance(user) {
      const uid = user._id || user.student_id
      const sid = user.student_id
      if (!sid) return
      this.attendanceFetching = { ...this.attendanceFetching, [uid]: true }
      this.attendanceError = { ...this.attendanceError, [uid]: false }
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken')
        const college = (user.college) || localStorage.getItem('loginChosenDepartment') || 'CCS'
        const res = await fetch(buildAPIUrl(`/apis/attendance/student/${encodeURIComponent(sid)}/records`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-SSAAM-College': college
          }
        })
        if (res.ok) {
          const data = await res.json()
          this.userAttendanceCache = { ...this.userAttendanceCache, [uid]: data.data || [] }
        } else {
          this.attendanceError = { ...this.attendanceError, [uid]: true }
        }
      } catch {
        this.attendanceError = { ...this.attendanceError, [uid]: true }
      } finally {
        this.attendanceFetching = { ...this.attendanceFetching, [uid]: false }
      }
    },
    getAttendanceSummary(user) {
      const uid = user._id || user.student_id
      const records = this.userAttendanceCache[uid] || []
      return {
        present: records.filter(r => r.overall_status === 'present').length,
        absent: records.filter(r => r.overall_status === 'absent').length,
        late: records.filter(r => r.overall_status === 'late').length,
        excused: records.filter(r => r.overall_status === 'excused').length,
      }
    },
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
      const name = user.full_name || user.first_name || user.firstName || ''
      const lastName = user.last_name || user.lastName || ''
      return (name.charAt(0) + lastName.charAt(0)).toUpperCase()
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
      this.dismissedUnvalidatedBanner = false
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
        full_name: user.full_name || user.first_name || user.firstName || '',
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

      if (file.size > 5 * 1024 * 1024) {
        this.showNotification('error', 'File Too Large', 'File size must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        this.showNotification('error', 'Invalid File', 'Please select a valid image file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 800
          if (width > height) {
            if (width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim }
          } else {
            if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
          const targetBytes = 80 * 1024
          let quality = 0.85
          let dataURL = canvas.toDataURL('image/jpeg', quality)
          while ((dataURL.length * 3 / 4) > targetBytes && quality > 0.1) {
            quality = Math.max(0.1, quality - 0.1)
            dataURL = canvas.toDataURL('image/jpeg', quality)
          }
          this.editingUser.photo = dataURL
        }
        img.src = e.target.result
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
          full_name: this.editingUser.full_name,
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
            name: (this.roleTargetStudent.full_name || '') + (this.roleTargetStudent.last_name ? ' ' + this.roleTargetStudent.last_name : ''),
            photo: this.roleTargetStudent.photo || '',
            role: this.selectedNewRole,
            time: new Date().toLocaleTimeString()
          })
          if (this.recentRoleAssignments.length > 10) this.recentRoleAssignments.pop()
          this.roleTargetStudent = { ...this.roleTargetStudent, role: this.selectedNewRole }
          this.showNotification('success', 'Role Assigned', `${(this.roleTargetStudent.full_name || '') + (this.roleTargetStudent.last_name ? ' ' + this.roleTargetStudent.last_name : '')} is now a ${roleLabel}.`)
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
    async fetchInlineCollegeMembers() {
      const college = this.currentUser.college || 'CCS'
      this.inlineCollegeMembers = []
      this.loadingInlineMembers = true
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
          this.inlineCollegeMembers = data.members || []
        }
      } catch (e) {
        console.error('Error fetching inline college members:', e)
      } finally {
        this.loadingInlineMembers = false
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
    this._closeDropdownOnOutside = () => { this.openDropdown = null }
    document.addEventListener('click', this._closeDropdownOnOutside)
  },
  beforeUnmount() {
    // Clean up event listeners
    if (this.handleUserDeletedEvent) {
      window.removeEventListener('user-deleted', this.handleUserDeletedEvent)
    }
    if (this._closeDropdownOnOutside) {
      document.removeEventListener('click', this._closeDropdownOnOutside)
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

/* Expand/collapse transition for user detail panel */
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 700px;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>