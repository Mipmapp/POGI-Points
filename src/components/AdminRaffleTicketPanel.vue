<template>
  <div class="space-y-6">
    <!-- Banner Header -->
    <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="relative h-32 sm:h-36 bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-700 overflow-hidden">
        <div class="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-400/20 blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl"></div>
        <div class="absolute inset-0 flex items-center px-4 sm:px-6 md:px-8 gap-3 sm:gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Raffle Ticket Management</h2>
            <p class="text-white/70 text-sm mt-0.5">Record Rural & Evergood bus tickets and raffle category assignments</p>
          </div>
          <div class="flex-shrink-0 hidden sm:flex items-center gap-3">
            <div class="text-center bg-white/15 rounded-2xl px-4 py-2 border border-white/20">
              <p class="text-white/70 text-[10px] uppercase tracking-wider">Total Entries</p>
              <p class="text-white font-extrabold text-xl">{{ entries.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Legend -->
      <div class="px-4 sm:px-6 md:px-8 py-4 border-b border-gray-100">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Raffle Categories</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="cat in categories" :key="cat.key" :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border', cat.classes]">
            {{ cat.icon }} {{ cat.label }} <span class="opacity-70">({{ cat.range }})</span>
          </span>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="px-4 sm:px-6 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <div class="w-1 h-5 rounded-full bg-purple-600"></div>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Submit Tickets</h3>
        </div>
        <button
          @click="downloadExcel"
          :disabled="isDownloading || entries.length === 0"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm disabled:opacity-60 shadow-md shadow-green-200 active:scale-95"
        >
          <svg v-if="isDownloading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          {{ isDownloading ? 'Preparing...' : 'Export Excel' }}
        </button>
      </div>

      <!-- Search Bar -->
      <div class="px-4 sm:px-6 md:px-8 py-5 space-y-4">
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by Name, Student ID, or RFID..."
              @keydown.enter="searchStudent"
              class="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none text-sm bg-gray-50 focus:bg-white transition"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button
            @click="searchStudent"
            :disabled="isSearching"
            class="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-violet-700 text-white rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-purple-200 whitespace-nowrap disabled:opacity-60"
          >
            {{ isSearching ? '...' : 'Search' }}
          </button>
        </div>
      </div>

      <!-- Selected Student Ticket Submission -->
      <div v-if="selectedStudent" class="mx-4 sm:mx-6 md:mx-8 mb-6 bg-white rounded-2xl border border-purple-200 shadow overflow-hidden">
        <!-- Student Header -->
        <div class="px-5 py-4 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-200 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Student Photo -->
            <div class="w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden border-2 border-purple-200 shadow-sm">
              <img
                v-if="selectedStudent.photo && !photoError"
                :src="selectedStudent.photo"
                :alt="selectedStudent.full_name || selectedStudent.first_name"
                class="w-full h-full object-cover"
                referrerpolicy="no-referrer"
                @error="photoError = true"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-purple-700 to-violet-700 flex items-center justify-center text-white font-bold text-lg"
              >
                {{ (selectedStudent.full_name || selectedStudent.first_name || '?').charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="min-w-0">
              <h3 class="font-extrabold text-gray-900 text-sm sm:text-base truncate">{{ (selectedStudent.full_name || selectedStudent.first_name || '') }}{{ selectedStudent.last_name ? ' ' + selectedStudent.last_name : '' }}</h3>
              <p class="text-gray-500 text-xs truncate">{{ selectedStudent.student_id }} · {{ selectedStudent.program }} – {{ selectedStudent.year_level }}</p>
            </div>
          </div>
          <button @click="selectedStudent = null; ruralCount = null; evergoodCount = null" class="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Ticket Counts - Two separate inputs -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bus Ticket Counts</label>
            <div class="grid grid-cols-2 gap-3">
              <!-- Rural (Red) -->
              <div class="space-y-1.5">
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="w-3.5 h-3.5 rounded-full bg-red-500 inline-block flex-shrink-0"></span>
                  <span class="text-xs font-bold text-red-600 uppercase tracking-wide">Rural (Red)</span>
                </div>
                <input
                  v-model.number="ruralCount"
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  placeholder="0"
                  @keydown="blockNonInteger"
                  @input="clampValue('ruralCount')"
                  class="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none text-sm bg-red-50 focus:bg-white transition text-center font-bold text-red-700 placeholder:text-red-300"
                />
              </div>
              <!-- Evergood (Green) -->
              <div class="space-y-1.5">
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="w-3.5 h-3.5 rounded-full bg-green-500 inline-block flex-shrink-0"></span>
                  <span class="text-xs font-bold text-green-600 uppercase tracking-wide">Evergood (Green)</span>
                </div>
                <input
                  v-model.number="evergoodCount"
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  placeholder="0"
                  @keydown="blockNonInteger"
                  @input="clampValue('evergoodCount')"
                  class="w-full px-4 py-2.5 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none text-sm bg-green-50 focus:bg-white transition text-center font-bold text-green-700 placeholder:text-green-300"
                />
              </div>
            </div>
          </div>

          <!-- Ticket Summary -->
          <div v-if="totalTickets > 0" class="rounded-2xl border border-purple-100 bg-purple-50/50 overflow-hidden">
            <div class="px-4 py-2 bg-purple-100/60 border-b border-purple-100">
              <p class="text-xs font-bold text-purple-500 uppercase tracking-wider">Ticket Summary</p>
            </div>
            <div class="grid grid-cols-3 divide-x divide-purple-100">
              <div class="px-4 py-3 text-center">
                <p class="text-xl font-extrabold text-red-600">{{ ruralCount || 0 }}</p>
                <p class="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-0.5">Rural</p>
              </div>
              <div class="px-4 py-3 text-center">
                <p class="text-xl font-extrabold text-green-600">{{ evergoodCount || 0 }}</p>
                <p class="text-[10px] font-bold text-green-400 uppercase tracking-wider mt-0.5">Evergood</p>
              </div>
              <div class="px-4 py-3 text-center bg-purple-100/40">
                <p class="text-xl font-extrabold text-purple-700">{{ totalTickets }}</p>
                <p class="text-[10px] font-bold text-purple-400 uppercase tracking-wider mt-0.5">Total</p>
              </div>
            </div>
          </div>

          <!-- Category Preview -->
          <div v-if="totalTickets >= 1" class="p-4 rounded-2xl border" :class="previewCategory ? categoryStyle(previewCategory).bg : 'bg-gray-50 border-gray-200'">
            <p class="text-xs font-bold uppercase tracking-wider mb-1" :class="previewCategory ? categoryStyle(previewCategory).label : 'text-gray-400'">Raffle Category</p>
            <p class="text-xl font-extrabold" :class="previewCategory ? categoryStyle(previewCategory).text : 'text-gray-400'">
              {{ previewCategory ? categoryInfo(previewCategory).icon + ' ' + categoryInfo(previewCategory).label : 'No category (count out of range)' }}
            </p>
            <p v-if="previewCategory" class="text-xs mt-1" :class="categoryStyle(previewCategory).label">{{ categoryInfo(previewCategory).range }}</p>
            <p v-else class="text-xs mt-1 text-gray-400">Valid ranges: 20–25, 26–50, 51–80, 81–110, 150+</p>
          </div>

          <!-- Submit Button -->
          <button
            @click="submitTicket"
            :disabled="totalTickets < 1 || isSubmitting"
            class="w-full py-3 px-4 bg-gradient-to-r from-purple-700 to-violet-700 text-white rounded-2xl font-bold text-sm transition-all hover:from-purple-800 hover:to-violet-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200 active:scale-[0.99]"
          >
            <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            {{ isSubmitting ? 'Adding Entry...' : 'Add New Entry' }}
          </button>

          <!-- Success Message -->
          <div v-if="successMsg" class="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-semibold">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            {{ successMsg }}
          </div>
          <!-- Error Message -->
          <div v-if="errorMsg" class="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-semibold">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ errorMsg }}
          </div>
        </div>
      </div>
    </div>

    <!-- Entries List -->
    <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="px-5 sm:px-6 md:px-8 py-4 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <div class="w-1 h-5 rounded-full bg-purple-600"></div>
        <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Ticket Records</h3>
        <span class="ml-auto text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">{{ filteredEntries.length }}</span>

        <!-- Filter by category -->
        <select v-model="filterCategory" class="ml-2 px-3 py-1.5 border-2 border-gray-200 rounded-xl text-xs font-semibold bg-gray-50 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none transition">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.key" :value="cat.key">{{ cat.icon }} {{ cat.label }}</option>
          <option value="none">No Category</option>
        </select>
      </div>

      <!-- Empty State -->
      <div v-if="filteredEntries.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div class="w-16 h-16 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
          </svg>
        </div>
        <p class="text-gray-500 font-semibold text-sm">No raffle ticket entries found</p>
        <p class="text-gray-400 text-xs mt-1">Search for a student above to record their ticket submission</p>
      </div>

      <!-- Loading -->
      <div v-else-if="isLoading" class="flex items-center justify-center py-12">
        <svg class="w-8 h-8 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
      </div>

      <!-- Mobile Card View -->
      <div v-else class="block md:hidden divide-y divide-gray-100">
        <div v-for="entry in filteredEntries" :key="entry._id" class="p-4 hover:bg-gray-50 transition">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden border border-purple-100 shadow-sm">
                <img
                  v-if="entry.photo && !entryPhotoErrors[entry._id]"
                  :src="entry.photo"
                  :alt="entry.student_name"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer"
                  @error="entryPhotoErrors[entry._id] = true"
                />
                <div v-else class="w-full h-full bg-gradient-to-br from-purple-700 to-violet-700 flex items-center justify-center text-white text-sm font-bold">
                  {{ (entry.student_name || '?').charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-bold text-gray-900 text-sm truncate">{{ entry.student_name }}</p>
                <p class="text-gray-400 text-xs truncate">{{ entry.student_id_number }} · {{ entry.program || '—' }} · {{ entry.year_level || '—' }}</p>
              </div>
            </div>
            <button @click="deleteEntry(entry._id)" class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
          <!-- Ticket Breakdown -->
          <div class="flex items-center gap-2 flex-wrap mt-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1">
              🔴 Rural: {{ entry.rural_count || 0 }}
            </span>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
              🟢 Evergood: {{ entry.evergood_count || 0 }}
            </span>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Total: {{ entry.ticket_count }} tickets</span>
            <span v-if="entry.category !== 'none'" :class="['px-2.5 py-1 rounded-full text-xs font-bold', categoryStyle(entry.category).badge]">
              {{ categoryInfo(entry.category).icon }} {{ categoryInfo(entry.category).label }}
            </span>
            <span v-else class="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-400">No Category</span>
          </div>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gradient-to-r from-purple-700 to-violet-700">
              <th class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Student ID</th>
              <th class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
              <th class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Program</th>
              <th class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Year</th>
              <th class="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">🔴 Rural</th>
              <th class="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">🟢 Evergood</th>
              <th class="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Total</th>
              <th class="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Category</th>
              <th class="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="filteredEntries.length === 0">
              <td colspan="10" class="px-4 py-12 text-center text-gray-400 text-sm">No records match the current filters.</td>
            </tr>
            <tr v-for="entry in filteredEntries" :key="entry._id" class="hover:bg-purple-50/30 transition-colors">
              <td class="px-4 py-3 text-sm font-semibold text-gray-700">{{ entry.student_id_number }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 font-medium">{{ entry.student_name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ entry.program || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ entry.year_level || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  {{ entry.rural_count || 0 }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                  {{ entry.evergood_count || 0 }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                  {{ entry.ticket_count }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span v-if="entry.category !== 'none'" :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-bold', categoryStyle(entry.category).badge]">
                  {{ categoryInfo(entry.category).icon }} {{ categoryInfo(entry.category).label }}
                </span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="px-4 py-3 text-center text-xs text-gray-500">{{ formatDate(entry.submitted_at) }}</td>
              <td class="px-4 py-3 text-center">
                <button @click="deleteEntry(entry._id)" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="pendingDeleteId" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="pendingDeleteId = null"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 text-center">
          <div class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>
          <h3 class="text-lg font-extrabold text-gray-800 mb-1">Delete Entry?</h3>
          <p class="text-sm text-gray-500 mb-6">This raffle ticket entry will be permanently removed. This action cannot be undone.</p>
          <div class="flex gap-3">
            <button @click="pendingDeleteId = null" class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button @click="executeDelete" :disabled="isDeleting" class="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              <svg v-if="isDeleting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { buildAPIUrl, getCollege } from '../config/api.js'
import * as XLSX from 'xlsx'

const searchQuery = ref('')
const selectedStudent = ref(null)
const ruralCount = ref(null)
const evergoodCount = ref(null)
const photoError = ref(false)
const entryPhotoErrors = ref({})
const isSearching = ref(false)
const isSubmitting = ref(false)
const isLoading = ref(false)
const isDownloading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const entries = ref([])
const filterCategory = ref('')
const pendingDeleteId = ref(null)
const isDeleting = ref(false)

const categories = [
  { key: 'bronze', icon: '🥉', label: 'Bronze', range: '20–25 tickets', classes: 'bg-amber-50 border-amber-300 text-amber-700' },
  { key: 'silver', icon: '🥈', label: 'Silver', range: '26–50 tickets', classes: 'bg-slate-50 border-slate-300 text-slate-600' },
  { key: 'gold', icon: '🥇', label: 'Gold', range: '51–80 tickets', classes: 'bg-yellow-50 border-yellow-400 text-yellow-700' },
  { key: 'platinum', icon: '💠', label: 'Platinum', range: '81–149 tickets', classes: 'bg-cyan-50 border-cyan-400 text-cyan-700' },
  { key: 'diamond', icon: '💎', label: 'Diamond', range: '150+ tickets', classes: 'bg-blue-50 border-blue-400 text-blue-700' },
]

function categoryInfo(key) {
  return categories.find(c => c.key === key) || { icon: '', label: key, range: '' }
}

function categoryStyle(key) {
  const styles = {
    bronze:   { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
    silver:   { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' },
    gold:     { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
    platinum: { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-700', label: 'text-cyan-500', badge: 'bg-cyan-100 text-cyan-700' },
    diamond:  { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  }
  return styles[key] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', label: 'text-gray-400', badge: 'bg-gray-100 text-gray-500' }
}

const totalTickets = computed(() => {
  return (ruralCount.value || 0) + (evergoodCount.value || 0)
})

const previewCategory = computed(() => {
  const count = totalTickets.value
  if (!count || count < 1) return null
  if (count >= 20 && count <= 25) return 'bronze'
  if (count >= 26 && count <= 50) return 'silver'
  if (count >= 51 && count <= 80) return 'gold'
  if (count >= 81 && count <= 149) return 'platinum'
  if (count >= 150) return 'diamond'
  return null
})

const filteredEntries = computed(() => {
  const q = (searchQuery.value || '').toString().trim().toLowerCase()
  return entries.value.filter(e => {
    if (filterCategory.value && e.category !== filterCategory.value) return false
    if (q) {
      const hay = [
        e.name,
        e.first_name,
        e.middle_name,
        e.last_name,
        e.full_name,
        e.student_name,
        e.student_id,
        e.id_number,
        e.rfid_code,
        e.email
      ].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getAuthToken() {
  return localStorage.getItem('authToken') || localStorage.getItem('token') || ''
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
    'X-SSAAM-College': getCollege()
  }
}

function blockNonInteger(e) {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Home', 'End']
  if (allowed.includes(e.key)) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

function clampValue(field) {
  const val = field === 'ruralCount' ? ruralCount.value : evergoodCount.value
  if (val === null || val === undefined || isNaN(val)) return
  const clamped = Math.max(0, Math.min(500, Math.floor(val)))
  if (field === 'ruralCount') ruralCount.value = clamped
  else evergoodCount.value = clamped
}

let _rfidAutoTimer = null
watch(searchQuery, (val) => {
  const v = (val || '').toString().trim()
  if (/^[A-Za-z0-9]{8,}$/.test(v) && !v.includes('-')) {
    if (_rfidAutoTimer) clearTimeout(_rfidAutoTimer)
    _rfidAutoTimer = setTimeout(() => { searchStudent() }, 150)
  }
})

async function searchStudent() {
  const q = searchQuery.value.trim()
  if (!q) return
  isSearching.value = true
  errorMsg.value = ''
  successMsg.value = ''
  selectedStudent.value = null
  photoError.value = false
  try {
    const res = await fetch(buildAPIUrl('/apis/students/search'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ search_query: q })
    })
    const data = await res.json()
    if (res.ok && data.student) {
      selectedStudent.value = data.student
      ruralCount.value = null
      evergoodCount.value = null
    } else {
      errorMsg.value = data.message || 'Student not found'
    }
  } catch (e) {
    errorMsg.value = 'Failed to search student. Please try again.'
  } finally {
    isSearching.value = false
  }
}

async function submitTicket() {
  if (!selectedStudent.value || totalTickets.value < 1) return
  isSubmitting.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}')
    const body = {
      student_id: selectedStudent.value.student_id,
      rural_count: ruralCount.value || 0,
      evergood_count: evergoodCount.value || 0,
      admin_username: user.username || user.email || ''
    }
    const res = await fetch(buildAPIUrl('/apis/admin/raffle-tickets'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (data.success) {
      const catInfo = data.category && data.category !== 'none' ? categoryInfo(data.category) : null
      successMsg.value = catInfo
        ? `New entry added! ${catInfo.icon} Assigned to ${catInfo.label} category.`
        : 'New entry added! (Ticket count is outside a valid raffle range)'
      ruralCount.value = null
      evergoodCount.value = null
      await fetchEntries()
    } else {
      errorMsg.value = data.message || 'Failed to record entry'
    }
  } catch (e) {
    errorMsg.value = 'Network error. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function deleteEntry(id) {
  pendingDeleteId.value = id
}

async function executeDelete() {
  if (!pendingDeleteId.value) return
  isDeleting.value = true
  try {
    const res = await fetch(buildAPIUrl(`/apis/admin/raffle-tickets/${pendingDeleteId.value}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    const data = await res.json()
    if (data.success) {
      entries.value = entries.value.filter(e => e._id !== pendingDeleteId.value)
      pendingDeleteId.value = null
    } else {
      errorMsg.value = data.message || 'Failed to delete entry'
      pendingDeleteId.value = null
    }
  } catch (e) {
    errorMsg.value = 'Failed to delete entry. Please try again.'
    pendingDeleteId.value = null
  } finally {
    isDeleting.value = false
  }
}

async function fetchEntries() {
  isLoading.value = true
  try {
    const res = await fetch(buildAPIUrl('/apis/admin/raffle-tickets'), { headers: getAuthHeaders() })
    const data = await res.json()
    if (data.success) entries.value = data.data || []
  } catch (e) {
    console.error('Failed to fetch raffle entries', e)
  } finally {
    isLoading.value = false
  }
}

function buildSheetRows(list) {
  return list.map((e, i) => ({
    'No.': i + 1,
    'Student ID': e.student_id_number,
    'Name': e.student_name,
    'Program': e.program || '—',
    'Year Level': e.year_level || '—',
    'Rural (Red) Tickets': e.rural_count || 0,
    'Evergood (Green) Tickets': e.evergood_count || 0,
    'Total Tickets': e.ticket_count,
    'Category': e.category !== 'none' ? (categoryInfo(e.category).icon + ' ' + categoryInfo(e.category).label) : 'No Category',
    'Submitted By': e.submitted_by || '—',
    'Date Submitted': e.submitted_at ? new Date(e.submitted_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  }))
}

function autoWidth(ws, rows) {
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  ws['!cols'] = cols.map(col => ({
    wch: Math.max(col.length, ...rows.map(r => String(r[col] ?? '').length)) + 2
  }))
}

function downloadExcel() {
  if (isDownloading.value || entries.value.length === 0) return
  isDownloading.value = true
  try {
    const wb = XLSX.utils.book_new()
    const dateSuffix = new Date().toISOString().split('T')[0]

    const allRows = buildSheetRows(entries.value)
    const wsAll = XLSX.utils.json_to_sheet(allRows)
    autoWidth(wsAll, allRows)
    XLSX.utils.book_append_sheet(wb, wsAll, 'All Entries')

    const catOrder = [
      { key: 'bronze',   label: 'Bronze',   icon: '🥉' },
      { key: 'silver',   label: 'Silver',   icon: '🥈' },
      { key: 'gold',     label: 'Gold',     icon: '🥇' },
      { key: 'platinum', label: 'Platinum', icon: '💠' },
      { key: 'diamond',  label: 'Diamond',  icon: '💎' },
      { key: 'none',     label: 'No Category', icon: '' },
    ]

    catOrder.forEach(cat => {
      const filtered = entries.value.filter(e => e.category === cat.key)
      if (filtered.length === 0) return
      const rows = buildSheetRows(filtered)
      const ws = XLSX.utils.json_to_sheet(rows)
      autoWidth(ws, rows)
      XLSX.utils.book_append_sheet(wb, ws, cat.label)
    })

    XLSX.writeFile(wb, `RaffleTickets_${dateSuffix}.xlsx`)
    window.dispatchEvent(new CustomEvent('app-notification', {
      detail: { message: `Exported ${entries.value.length} raffle ticket record(s)`, type: 'success' }
    }))
  } catch (e) {
    console.error('Export failed', e)
    window.dispatchEvent(new CustomEvent('app-notification', {
      detail: { message: 'Failed to export Excel file', type: 'error' }
    }))
  } finally {
    isDownloading.value = false
  }
}

onMounted(() => {
  fetchEntries()
})
</script>
