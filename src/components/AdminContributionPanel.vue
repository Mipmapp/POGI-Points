<template>
  <div class="space-y-6">
    <!-- Banner Header -->
    <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="relative h-32 sm:h-36 bg-gradient-to-br from-ssaam-dark via-blue-700 to-ssaam-light overflow-hidden">
        <div class="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-400/20 blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div class="light-sweep"></div>
        <div class="absolute inset-0 flex items-center px-6 md:px-8 gap-4">
          <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Contribution Management</h2>
            <p class="text-white/70 text-sm mt-0.5">Track and manage student payment contributions</p>
          </div>
          <div class="flex-shrink-0 hidden sm:flex items-center gap-3">
            <div class="text-center bg-white/15 rounded-2xl px-4 py-2 border border-white/20">
              <p class="text-white/70 text-[10px] uppercase tracking-wider">Matched</p>
              <p class="text-white font-extrabold text-xl">{{ serverFilteredCount !== null ? serverFilteredCount : filteredCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="px-4 sm:px-6 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100">
        <div class="flex items-center gap-2 sm:hidden">
          <div class="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-sm font-bold text-blue-700">
            {{ serverFilteredCount !== null ? serverFilteredCount : filteredCount }} matched
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-1 h-5 rounded-full bg-blue-600"></div>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Filters &amp; Search</h3>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            @click="showCreateEventModal = true"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-xl hover:opacity-90 transition-all font-semibold text-sm shadow-md shadow-blue-200 active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Create Event
          </button>
          <button
            @click="downloadPaymentExcel"
            :disabled="isDownloading"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm disabled:opacity-70 shadow-md shadow-green-200 active:scale-95"
          >
            <svg v-if="isDownloading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            {{ isDownloading ? 'Preparing...' : 'Export Excel' }}
          </button>
        </div>
      </div>

      <!-- Event Selector -->
      <div class="px-4 sm:px-6 md:px-8 py-4 border-b border-gray-100">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-1 h-5 rounded-full bg-purple-500"></div>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Event</h3>
          <span v-if="activePayment" class="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            {{ activePayment.title }}
          </span>
          <span v-else-if="!isLoadingEvents" class="ml-auto text-xs text-gray-400 font-medium">No event selected</span>
        </div>

        <!-- Loading Events -->
        <div v-if="isLoadingEvents" class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div v-for="i in 3" :key="i" class="flex-shrink-0 h-20 w-48 rounded-2xl bg-gray-100 animate-pulse"></div>
        </div>

        <!-- No Events -->
        <div v-else-if="paymentEvents.length === 0" class="flex items-center gap-3 bg-gray-50 border border-dashed border-gray-300 rounded-2xl px-4 py-3">
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <p class="text-sm text-gray-500">No events created yet. Click <strong>Create Event</strong> to get started.</p>
        </div>

        <!-- Events List -->
        <div v-else class="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          <div
            v-for="event in paymentEvents"
            :key="event._id"
            :class="[
              'relative flex-shrink-0 w-52 rounded-2xl border-2 p-3.5 transition-all duration-150 cursor-pointer group',
              activePayment && activePayment._id === event._id
                ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
            ]"
            @click="selectEvent(event)"
          >
            <!-- Action buttons (edit + delete) — hidden while this card's edit modal is open -->
            <div v-show="!(showEditEventModal && editEventForm._id === event._id)"
              class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 z-10">
              <button
                @click.stop="openEditEvent(event)"
                class="w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-500 text-blue-500 hover:text-white flex items-center justify-center transition-all duration-150"
                title="Edit event"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 15.414 9 16l.586-3z"/></svg>
              </button>
              <button
                @click.stop="confirmDeleteEvent(event)"
                class="w-5 h-5 rounded-full bg-red-100 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all duration-150"
                title="Delete event"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Active checkmark badge — bottom-right, never overlaps hover buttons -->
            <div v-if="activePayment && activePayment._id === event._id"
              class="absolute bottom-2.5 right-2.5 w-5 h-5 rounded-full bg-purple-500 shadow-md flex items-center justify-center z-10">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>

            <div class="flex items-start mb-2 pr-2">
              <p :class="['font-bold text-sm leading-tight line-clamp-2 flex-1', activePayment && activePayment._id === event._id ? 'text-purple-800' : 'text-gray-800']">{{ event.title }}</p>
            </div>
            <div class="flex items-center justify-between gap-1">
              <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
                event.type === 'fee' ? 'bg-blue-100 text-blue-700' :
                event.type === 'membership' ? 'bg-green-100 text-green-700' :
                event.type === 'donation' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-200 text-gray-600'
              ]">{{ event.type || 'event' }}</span>
              <span :class="['font-extrabold text-sm', activePayment && activePayment._id === event._id ? 'text-purple-700' : 'text-blue-700']">₱{{ Number(event.amount_due || 0).toFixed(2) }}</span>
            </div>
            <div v-if="event.description" class="mt-1.5 text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{{ event.description }}</div>
            <div class="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold leading-none" :title="'Total collected (after discounts) for this event'">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
              ₱{{ Number(collectedByEvent[event._id] || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} collected
            </div>
            <div v-if="event.deadline" class="mt-1 text-[10px] text-gray-400 font-medium">
              Due: {{ new Date(event.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }}
            </div>
            <!-- Targeting badges -->
            <div v-if="(event.target_year_levels && event.target_year_levels.length > 0) || (event.target_programs && event.target_programs.length > 0)" class="mt-1.5 flex flex-wrap gap-1">
              <span v-for="yl in (event.target_year_levels || [])" :key="'yl-'+yl" class="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-700 leading-none">{{ yl }}</span>
              <span v-for="prog in (event.target_programs || [])" :key="'prog-'+prog" class="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 leading-none">{{ prog }}</span>
            </div>
            <div v-else class="mt-1 text-[9px] text-gray-400 italic">All students</div>
          </div>
        </div>
      </div>

      <!-- Statistics Panel -->
      <div v-if="activePayment && filteredContributions.length > 0" class="px-4 sm:px-6 md:px-8 py-4 border-b border-gray-100">
        <button @click="showStatsPanel = !showStatsPanel" class="w-full flex items-center gap-2 mb-3 group">
          <div class="w-1 h-5 rounded-full bg-teal-500"></div>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Statistics</h3>
          <div class="ml-2 flex items-center gap-2">
            <span class="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              {{ statsOverall.paid }}/{{ statsOverall.total }} Paid
            </span>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              {{ statsOverall.unpaid }} Unpaid
            </span>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              {{ statsOverall.pct }}%
            </span>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full" :title="`Total collected (after discounts) — Expected ₱${statsOverall.expected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ₱{{ statsOverall.totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} collected
            </span>
          </div>
          <svg :class="['ml-auto w-4 h-4 text-gray-400 transition-transform duration-200', showStatsPanel ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>

        <transition name="ssaam-stats">
        <div v-if="showStatsPanel" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- By Year Level -->
          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              By Year Level
            </p>
            <div class="space-y-2">
              <div v-for="row in statsByYearLevel" :key="row.year_level">
                <div class="flex items-center justify-between text-xs mb-0.5">
                  <span class="font-semibold text-gray-700">{{ row.year_level }}</span>
                  <span class="text-gray-500">{{ row.paid }}/{{ row.total }}</span>
                </div>
                <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500"
                    :style="{ width: row.total ? (row.paid / row.total * 100) + '%' : '0%' }"></div>
                </div>
                <div class="flex gap-2 mt-0.5 text-[10px]">
                  <span class="text-teal-600 font-semibold">{{ row.paid }} paid</span>
                  <span class="text-red-500 font-semibold">{{ row.unpaid }} unpaid</span>
                  <span class="text-gray-400 ml-auto">{{ row.total ? Math.round(row.paid / row.total * 100) : 0 }}%</span>
                </div>
              </div>
              <p v-if="statsByYearLevel.length === 0" class="text-xs text-gray-400 text-center py-2">No data</p>
            </div>
          </div>

          <!-- By Program -->
          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              By Program
            </p>
            <div class="space-y-2">
              <div v-for="row in statsByProgram" :key="row.program">
                <div class="flex items-center justify-between text-xs mb-0.5">
                  <span class="font-semibold text-gray-700">{{ row.program }}</span>
                  <span class="text-gray-500">{{ row.paid }}/{{ row.total }}</span>
                </div>
                <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                    :style="{ width: row.total ? (row.paid / row.total * 100) + '%' : '0%' }"></div>
                </div>
                <div class="flex gap-2 mt-0.5 text-[10px]">
                  <span class="text-blue-600 font-semibold">{{ row.paid }} paid</span>
                  <span class="text-red-500 font-semibold">{{ row.unpaid }} unpaid</span>
                  <span class="text-gray-400 ml-auto">{{ row.total ? Math.round(row.paid / row.total * 100) : 0 }}%</span>
                </div>
              </div>
              <p v-if="statsByProgram.length === 0" class="text-xs text-gray-400 text-center py-2">No data</p>
            </div>
          </div>
        </div>
        </transition>
      </div>

      <!-- Search & Filters -->
      <div class="px-4 sm:px-6 md:px-8 py-5 space-y-4">
        <!-- Search Row -->
        <form @submit.prevent="searchStudent" class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by Name, Student ID, or RFID..."
              class="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button
            type="submit"
            :disabled="isSearchingStudent"
            class="px-5 py-2.5 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-200 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ isSearchingStudent ? 'Searching...' : 'Search' }}
          </button>
        </form>

        <!-- Multi-result search dropdown: shows up to 10 close matches.
             User clicks a row to set selectedStudent before recording payment. -->
        <div v-if="hasSearched && searchResults.length > 0" class="bg-white border-2 border-blue-200 rounded-2xl shadow-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 flex items-center justify-between">
            <p class="text-xs font-bold text-blue-700 uppercase tracking-wider">{{ searchResults.length }} {{ searchResults.length === 1 ? 'match' : 'matches' }} — click to select</p>
            <button @click="clearSearchResults" class="p-1 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition" title="Clear results">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <ul class="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            <li
              v-for="s in searchResults"
              :key="s._id || s.student_id"
              @click="selectStudentFromSearch(s)"
              class="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition"
            >
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                <img
                  v-if="s.photo && !photoFailed['res-' + (s._id || s.student_id)]"
                  :src="s.photo"
                  :alt="s.full_name"
                  class="w-full h-full object-cover"
                  @error="markPhotoFailed('res-' + (s._id || s.student_id))"
                  referrerpolicy="no-referrer"
                />
                <span v-else>{{ (s.full_name || s.first_name || '?').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-bold text-gray-900 text-sm truncate">{{ s.full_name || ((s.first_name || '') + ' ' + (s.last_name || '')).trim() }}</p>
                <p class="text-xs text-gray-500 truncate">{{ s.student_id }} · {{ s.program || '—' }} · {{ s.year_level || '—' }}<span v-if="s.college"> · {{ s.college }}</span></p>
              </div>
              <span class="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0">Select</span>
            </li>
          </ul>
        </div>

        <!-- Empty-search state -->
        <div v-else-if="hasSearched && !isSearchingStudent && searchResults.length === 0" class="px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center">
          <p class="text-xs text-gray-500 font-semibold">No students found matching "{{ searchQuery }}"</p>
        </div>

        <!-- ============ Date Filter (Paid On) ============ -->
        <div class="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-white p-3 sm:p-4 shadow-sm">
          <div class="flex items-center justify-between gap-2 mb-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <div class="flex-shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center shadow-sm">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-wider text-blue-700 leading-tight flex items-center gap-1.5">
                  Paid On
                  <!-- Quick "just refreshed" pulse — flashes for ~1.2s after
                       any refresh (manual or auto-after-payment) so the admin
                       sees that the panel reloaded with fresh data. -->
                  <span v-if="isRefreshingPaidOn" class="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                </p>
                <p class="text-[10px] text-gray-500 leading-tight truncate">
                  Show payments collected on a specific day<span v-if="paidOnLastRefreshed"> · Updated {{ formatRefreshedTime(paidOnLastRefreshed) }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <!-- Manual refresh: re-pulls the contribution list so the
                   "Paid On" totals reflect the latest payments without a
                   full page reload. Disabled while a refresh is in flight
                   to avoid hammering the API. -->
              <button
                @click="refreshPaidOn"
                :disabled="isRefreshingPaidOn || isLoading"
                class="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh paid-on data"
              >
                <svg :class="['w-3 h-3 transition-transform', isRefreshingPaidOn ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
              <button
                v-if="filterPaidDate"
                @click="clearDateFilter"
                class="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                title="Clear date filter"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                Clear
              </button>
            </div>
          </div>

          <!-- Quick day chips + custom date input -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              @click="setDatePreset('yesterday')"
              :class="['px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-150 active:scale-95',
                filterPaidDatePreset === 'yesterday'
                  ? 'bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white border-transparent shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700']"
            >Yesterday</button>
            <button
              type="button"
              @click="setDatePreset('today')"
              :class="['px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-150 active:scale-95 inline-flex items-center gap-1.5',
                filterPaidDatePreset === 'today'
                  ? 'bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white border-transparent shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700']"
            >
              <span :class="['w-1.5 h-1.5 rounded-full', filterPaidDatePreset === 'today' ? 'bg-white' : 'bg-emerald-500 animate-pulse']"></span>
              Today
            </button>
            <!-- Tiny separator dot for visual rhythm -->
            <span class="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300 mx-0.5"></span>

            <!-- Custom date input — sits flush with the chips so admins can
                 jump to any historical day without leaving the filter row.
                 `:max="todayDateString"` blocks future dates: collections
                 haven't happened yet, so picking tomorrow would always be
                 empty and was confusing in the UI. -->
            <div class="relative flex-1 min-w-[10rem]">
              <input
                type="date"
                v-model="filterPaidDate"
                :max="todayDateString"
                class="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-xs sm:text-sm bg-white text-gray-700 font-semibold transition"
              />
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
          </div>

          <!-- Live summary: tells the admin exactly what's being shown right
               now, including the count, so the impact of the filter is obvious. -->
          <transition name="fade">
            <div v-if="filterPaidDate" class="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-white border border-blue-200">
              <svg class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-xs text-gray-700 leading-snug">
                <span class="font-extrabold text-blue-700">{{ filteredContributions.filter(c => c.payment_status === 'paid').length }}</span>
                payment<span v-if="filteredContributions.filter(c => c.payment_status === 'paid').length !== 1">s</span>
                · <span class="font-extrabold text-emerald-700">₱{{ filterPaidDateCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                collected on <span class="font-bold text-gray-900">{{ formatFilterDate(filterPaidDate) }}</span>.
              </p>
            </div>
          </transition>

          <!-- ─── Daily collection counters ───────────────────────────────
               Quick-glance totals so admins know how much money came in
               today / yesterday / this week / this month without having to
               toggle filters. Tappable: clicking a chip applies the
               matching date filter (week/month chips clear the date filter
               and rely on the running balance instead). Stays scrollable on
               mobile via flex + overflow-x-auto so nothing wraps weirdly. -->
          <div class="mt-3 -mx-1 px-1 flex items-stretch gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              @click="setDatePreset('today')"
              :class="['flex-shrink-0 min-w-[8.5rem] text-left px-3 py-2 rounded-xl border-2 transition-all duration-150 active:scale-[0.97]',
                filterPaidDatePreset === 'today'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white border-emerald-200 hover:border-emerald-400']"
            >
              <p :class="['text-[9px] font-bold uppercase tracking-wider leading-none', filterPaidDatePreset === 'today' ? 'text-white/80' : 'text-emerald-600']">Today</p>
              <p :class="['text-sm font-extrabold leading-tight mt-1', filterPaidDatePreset === 'today' ? 'text-white' : 'text-gray-900']">
                ₱{{ dailyTotals.today.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </p>
              <p :class="['text-[10px] leading-none mt-0.5', filterPaidDatePreset === 'today' ? 'text-white/70' : 'text-gray-400']">
                {{ dailyTotals.today.count }} payment{{ dailyTotals.today.count === 1 ? '' : 's' }}
              </p>
            </button>
            <button
              type="button"
              @click="setDatePreset('yesterday')"
              :class="['flex-shrink-0 min-w-[8.5rem] text-left px-3 py-2 rounded-xl border-2 transition-all duration-150 active:scale-[0.97]',
                filterPaidDatePreset === 'yesterday'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white border-blue-200 hover:border-blue-400']"
            >
              <p :class="['text-[9px] font-bold uppercase tracking-wider leading-none', filterPaidDatePreset === 'yesterday' ? 'text-white/80' : 'text-blue-600']">Yesterday</p>
              <p :class="['text-sm font-extrabold leading-tight mt-1', filterPaidDatePreset === 'yesterday' ? 'text-white' : 'text-gray-900']">
                ₱{{ dailyTotals.yesterday.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </p>
              <p :class="['text-[10px] leading-none mt-0.5', filterPaidDatePreset === 'yesterday' ? 'text-white/70' : 'text-gray-400']">
                {{ dailyTotals.yesterday.count }} payment{{ dailyTotals.yesterday.count === 1 ? '' : 's' }}
              </p>
            </button>
            <div class="flex-shrink-0 min-w-[8.5rem] text-left px-3 py-2 rounded-xl border-2 bg-white border-purple-200">
              <p class="text-[9px] font-bold uppercase tracking-wider leading-none text-purple-600">This Week</p>
              <p class="text-sm font-extrabold leading-tight mt-1 text-gray-900">
                ₱{{ dailyTotals.week.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </p>
              <p class="text-[10px] leading-none mt-0.5 text-gray-400">
                {{ dailyTotals.week.count }} payment{{ dailyTotals.week.count === 1 ? '' : 's' }}
              </p>
            </div>
            <div class="flex-shrink-0 min-w-[8.5rem] text-left px-3 py-2 rounded-xl border-2 bg-white border-amber-200">
              <p class="text-[9px] font-bold uppercase tracking-wider leading-none text-amber-600">This Month</p>
              <p class="text-sm font-extrabold leading-tight mt-1 text-gray-900">
                ₱{{ dailyTotals.month.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </p>
              <p class="text-[10px] leading-none mt-0.5 text-gray-400">
                {{ dailyTotals.month.count }} payment{{ dailyTotals.month.count === 1 ? '' : 's' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Filter Row -->
        <div :class="['grid gap-3 grid-cols-1 sm:grid-cols-2', isMaster ? 'md:grid-cols-4' : 'md:grid-cols-3']">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Year Level</label>
            <select v-model="filterYearLevel" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition">
              <option value="">All Levels</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Program</label>
            <select v-model="filterProgram" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition">
              <option value="">All Programs</option>
              <option value="BSCS">BSCS</option>
              <option value="BSIT">BSIT</option>
              <option value="BSIS">BSIS</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select v-model="filterStatus" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div v-if="isMaster">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">College</label>
            <select v-model="filterCollege" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition">
              <option value="">All Colleges</option>
              <option value="CCS">CCS</option>
              <option value="COE">COE</option>
              <option value="SOM">SOM</option>
              <option value="CNAHS">CNAHS</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Student Payment Card -->
    <div v-if="selectedStudent" class="bg-white rounded-3xl shadow-xl border border-blue-200 overflow-hidden">
      <div class="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
            <img v-if="selectedStudent.photo && !photoFailed['sel-' + (selectedStudent._id || selectedStudent.student_id)]" :src="selectedStudent.photo" :alt="selectedStudent.full_name" class="w-full h-full object-cover" @error="markPhotoFailed('sel-' + (selectedStudent._id || selectedStudent.student_id))" referrerpolicy="no-referrer" />
            <span v-else>{{ (selectedStudent.full_name || selectedStudent.first_name || '?').charAt(0).toUpperCase() }}</span>
          </div>
          <div class="min-w-0">
            <h3 class="font-extrabold text-gray-900 text-sm sm:text-base truncate">{{ selectedStudent.full_name || (selectedStudent.first_name + ' ' + selectedStudent.last_name) }}</h3>
            <p class="text-gray-500 text-xs truncate">{{ selectedStudent.student_id }} · {{ selectedStudent.program }} – {{ selectedStudent.year_level }}</p>
          </div>
        </div>
        <button @click="selectedStudent = null" class="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-5 sm:p-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Campaign Fee -->
          <div class="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Campaign Fee</p>
            <p class="text-2xl font-extrabold text-ssaam-dark">₱{{ campaignFee.toFixed(2) }}</p>
            <p v-if="activePayment" class="text-[10px] text-purple-600 font-semibold mt-1 truncate">{{ activePayment.title }}</p>
            <p v-else class="text-[10px] text-red-400 font-semibold mt-1">No event selected</p>
          </div>
          <!-- Discount -->
          <div class="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discount</p>
            <div class="flex gap-1 p-1 bg-gray-200 rounded-xl">
              <button @click="discountType = 'amount'" :class="['flex-1 py-1.5 rounded-lg text-xs font-bold transition', discountType === 'amount' ? 'bg-ssaam-dark text-white shadow' : 'text-gray-600 hover:text-gray-800']">₱ Amount</button>
              <button @click="discountType = 'percentage'" :class="['flex-1 py-1.5 rounded-lg text-xs font-bold transition', discountType === 'percentage' ? 'bg-ssaam-dark text-white shadow' : 'text-gray-600 hover:text-gray-800']">% Percent</button>
            </div>
            <div class="flex gap-2">
              <input v-model.number="discountValue" type="number" :placeholder="discountType === 'amount' ? '0.00' : '0'" class="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-white transition" />
              <span class="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold text-sm">{{ discountType === 'amount' ? '₱' : '%' }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <p class="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">Payment Summary</p>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Original Amount</span>
              <span class="font-bold text-gray-900">₱{{ campaignFee.toFixed(2) }}</span>
            </div>
            <div v-if="discountValue > 0" class="flex justify-between items-center text-orange-600">
              <span>Discount {{ discountType === 'percentage' ? `(${discountValue}%)` : '' }}</span>
              <span class="font-bold">–₱{{ calculatedDiscount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-blue-200">
              <span class="font-bold text-blue-900">Target Payment</span>
              <span class="font-extrabold text-blue-700 text-lg">₱{{ targetPayment.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Already Paid State (Mark as Unpaid) -->
        <div v-if="selectedStudentAlreadyPaid" class="space-y-3">
          <div class="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-green-800">Already Paid</p>
              <p class="text-xs text-green-600 truncate">This student has already paid for the active campaign.</p>
            </div>
          </div>
          <button
            @click="markAsUnpaid()"
            :disabled="isProcessingPaymentGlobal"
            class="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold text-sm transition-all hover:from-red-600 hover:to-red-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-200 active:scale-[0.99]"
          >
            <svg v-if="isProcessingPaymentGlobal" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            {{ isProcessingPaymentGlobal ? 'Processing...' : 'Mark as Unpaid' }}
          </button>
        </div>

        <!-- Record Payment Button -->
        <button
          v-else
          @click="markAsPayment()"
          :disabled="!selectedStudent || isProcessingPaymentGlobal"
          class="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold text-sm transition-all hover:from-green-700 hover:to-green-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-200 active:scale-[0.99]"
        >
          <svg v-if="isProcessingPaymentGlobal" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          {{ isProcessingPaymentGlobal ? 'Processing...' : 'Record Payment' }}
        </button>
      </div>
    </div>

    <!-- Loyverse POS Panel (visible only when a student is selected) -->
    <LoyversePOSPanel
      v-if="selectedStudent"
      :student="selectedStudent"
      :suggested-amount="targetPayment"
      :active-payment="activePayment"
    />

    <!-- Contributions List — hidden while a student is selected so the
         admin can focus on the payment card + POS panel without the table
         distracting underneath. -->
    <div v-if="!selectedStudent" class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="px-5 sm:px-6 md:px-8 py-4 border-b border-gray-100 flex items-center gap-2">
        <div class="w-1 h-5 rounded-full bg-blue-600"></div>
        <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Payment Records</h3>
        <span class="ml-auto text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">{{ filteredContributions.length }}</span>
      </div>

      <!-- Top Pagination Controls -->
      <div v-if="!isLoading && filteredContributions.length > 0" class="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 md:px-8 py-3 border-b border-gray-100">
        <div class="text-sm text-gray-600">
          Showing {{ (paymentsPage - 1) * paymentsPerPage + 1 }} to {{ Math.min(paymentsPage * paymentsPerPage, filteredContributions.length) }} of {{ filteredContributions.length }} records
        </div>
        <div class="flex gap-2 items-center">
          <button
            @click="paymentsPage = Math.max(1, paymentsPage - 1)"
            :disabled="paymentsPage === 1"
            class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Previous
          </button>
          <div class="flex gap-1 items-center">
            <button
              v-for="page in paymentsPaginationRange"
              :key="page"
              @click="page !== '...' && (paymentsPage = page)"
              :disabled="page === '...'"
              :class="[
                'w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200',
                page === '...' ? 'cursor-default text-gray-400' :
                paymentsPage === page ? 'bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white shadow' :
                'border border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
            >{{ page }}</button>
          </div>
          <button
            @click="paymentsPage = Math.min(paymentsTotalPages, paymentsPage + 1)"
            :disabled="paymentsPage === paymentsTotalPages"
            class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            Next
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="p-4 space-y-3">
        <div v-for="i in 8" :key="i" class="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 animate-pulse">
          <div class="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 bg-gray-200 rounded-full w-1/3"></div>
            <div class="h-2.5 bg-gray-100 rounded-full w-1/4"></div>
          </div>
          <div class="h-3 bg-gray-200 rounded-full w-16"></div>
          <div class="h-6 bg-gray-100 rounded-full w-14"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredContributions.length === 0" class="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div class="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
        <p class="text-gray-500 font-semibold text-sm">No payment records found</p>
        <p class="text-gray-400 text-xs mt-1">Create a payment campaign first or adjust your filters</p>
      </div>

      <!-- Mobile Card View -->
      <div v-else class="block md:hidden divide-y divide-gray-100">
        <div v-for="(c, idx) in paginatedContributions" :key="c._id"
          class="p-4 hover:bg-gray-50 transition ssaam-row-anim"
          :style="{ animationDelay: Math.min(idx * 35, 700) + 'ms' }">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                <img v-if="c.photo && !photoFailed['c-' + (c._id || c.student_id)]" :src="c.photo" :alt="c.student_name" class="w-full h-full object-cover" @error="markPhotoFailed('c-' + (c._id || c.student_id))" referrerpolicy="no-referrer" />
                <span v-else>{{ (c.student_name || '?').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-bold text-gray-900 text-sm truncate">{{ c.student_name }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <p class="text-gray-400 text-xs truncate">{{ c.student_id }}</p>
                  <span v-if="isMaster && c.college" :class="['inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0', c.college === 'COE' ? 'bg-orange-100 text-orange-700' : c.college === 'SOM' ? 'bg-green-100 text-green-700' : c.college === 'CNAHS' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700']">{{ c.college }}</span>
                </div>
              </div>
            </div>
            <span :class="['px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0', c.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600']">
              {{ c.payment_status === 'paid' ? 'PAID' : 'UNPAID' }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs bg-gray-50 rounded-2xl p-3 mb-3">
            <div>
              <p class="text-gray-400 font-medium mb-0.5">Program</p>
              <p class="font-bold text-gray-700">{{ c.program || '—' }}</p>
            </div>
            <div>
              <p class="text-gray-400 font-medium mb-0.5">Year</p>
              <p class="font-bold text-gray-700">{{ c.year_level || '—' }}</p>
            </div>
            <div>
              <p class="text-gray-400 font-medium mb-0.5">Target</p>
              <p class="font-bold text-blue-700">₱{{ c.target_amount?.toFixed(2) || '0.00' }}</p>
            </div>
          </div>
          <div v-if="c.discount_value > 0" class="flex items-center gap-1.5 text-xs text-orange-600 mb-3">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            Discount applied: –₱{{ c.discount_value.toFixed(2) }}
          </div>
          <div v-if="c.payment_status === 'paid' && c.paid_at" class="flex items-center gap-1.5 text-xs text-green-700 mb-3">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="font-medium">Paid:</span>
            <span>{{ new Date(c.paid_at).toLocaleString() }}</span>
          </div>
          <div class="flex gap-2">
            <button
              v-if="c.payment_status !== 'paid'"
              @click="markAsPayment(c)"
              :disabled="processingPaymentId === (c._id || c.student_id)"
              class="flex-1 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-xs font-bold transition hover:from-green-600 hover:to-green-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <svg v-if="processingPaymentId === (c._id || c.student_id)" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {{ processingPaymentId === (c._id || c.student_id) ? 'Processing...' : 'Mark as Paid' }}
            </button>
            <button
              v-else
              @click="markAsUnpaid(c)"
              :disabled="processingPaymentId === (c._id || c.student_id)"
              class="flex-1 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-xs font-bold transition hover:from-red-600 hover:to-red-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <svg v-if="processingPaymentId === (c._id || c.student_id)" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {{ processingPaymentId === (c._id || c.student_id) ? 'Processing...' : 'Mark as Unpaid' }}
            </button>
            <button @click="applyDiscount(c)" class="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition hover:bg-blue-100 inline-flex items-center justify-center" title="Apply discount">
              <img src="/discount.svg" alt="Discount" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop Table View (hidden on mobile) ────────────────────────
           Tightened padding + hidden low-priority columns so the table
           stops feeling cramped on standard 1024-1280px monitors:
             - Student ID:  always
             - Name:        always
             - College:     always (master only)
             - Program:     always
             - Year:        ≥ lg
             - Original:    ≥ xl  (rarely useful when no discount)
             - Discount:    ≥ xl  (still listed in mobile cards inline)
             - Target:      always (the headline number)
             - Status:      always
             - Paid Date:   ≥ lg
             - Actions:     always
           Discount column also auto-hides if no row in this page has one.
      -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gradient-to-r from-ssaam-dark to-ssaam-light">
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider whitespace-nowrap">Student ID</th>
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">Name</th>
              <th v-if="isMaster" class="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">College</th>
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">Program</th>
              <th class="hidden lg:table-cell px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">Year</th>
              <th class="hidden xl:table-cell px-3 py-2.5 text-right text-[11px] font-bold text-white uppercase tracking-wider">Original</th>
              <th v-if="anyRowHasDiscount" class="hidden xl:table-cell px-3 py-2.5 text-right text-[11px] font-bold text-white uppercase tracking-wider">Discount</th>
              <th class="px-3 py-2.5 text-right text-[11px] font-bold text-white uppercase tracking-wider">Target</th>
              <th class="px-3 py-2.5 text-center text-[11px] font-bold text-white uppercase tracking-wider">Status</th>
              <th class="hidden lg:table-cell px-3 py-2.5 text-center text-[11px] font-bold text-white uppercase tracking-wider whitespace-nowrap">Paid Date</th>
              <th class="px-3 py-2.5 text-center text-[11px] font-bold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="filteredContributions.length === 0">
              <td :colspan="desktopColspan" class="px-4 py-12 text-center text-gray-400 text-sm">
                No records match the current filters.
              </td>
            </tr>
            <tr v-for="(c, idx) in paginatedContributions" :key="c._id"
              class="hover:bg-blue-50/40 transition-colors ssaam-row-anim"
              :style="{ animationDelay: Math.min(idx * 35, 700) + 'ms' }">
              <td class="px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">{{ c.student_id }}</td>
              <td class="px-3 py-2 text-sm text-gray-900 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 overflow-hidden">
                    <img v-if="c.photo && !photoFailed['ct-' + (c._id || c.student_id)]" :src="c.photo" :alt="c.student_name" class="w-full h-full object-cover" @error="markPhotoFailed('ct-' + (c._id || c.student_id))" referrerpolicy="no-referrer" />
                    <span v-else>{{ (c.student_name || '?').charAt(0).toUpperCase() }}</span>
                  </div>
                  <span class="truncate text-xs sm:text-sm">{{ c.student_name }}</span>
                </div>
              </td>
              <td v-if="isMaster" class="px-3 py-2 text-sm">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold', c.college === 'COE' ? 'bg-orange-100 text-orange-700' : c.college === 'SOM' ? 'bg-green-100 text-green-700' : c.college === 'CNAHS' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700']">{{ c.college || '—' }}</span>
              </td>
              <td class="px-3 py-2 text-xs text-gray-600">{{ c.program || '—' }}</td>
              <td class="hidden lg:table-cell px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{{ c.year_level || '—' }}</td>
              <td class="hidden xl:table-cell px-3 py-2 text-xs text-right text-gray-700 whitespace-nowrap">₱{{ c.original_amount?.toFixed(2) || '0.00' }}</td>
              <td v-if="anyRowHasDiscount" class="hidden xl:table-cell px-3 py-2 text-xs text-right font-semibold text-orange-600 whitespace-nowrap">
                {{ c.discount_value > 0 ? `–₱${c.discount_value.toFixed(2)}` : '—' }}
              </td>
              <td class="px-3 py-2 text-sm text-right font-extrabold text-blue-700 whitespace-nowrap">₱{{ c.target_amount?.toFixed(2) || '0.00' }}</td>
              <td class="px-3 py-2 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold', c.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600']">
                  {{ c.payment_status === 'paid' ? 'PAID' : 'UNPAID' }}
                </span>
              </td>
              <td class="hidden lg:table-cell px-3 py-2 text-center text-[11px] text-gray-600 whitespace-nowrap">
                <span v-if="c.payment_status === 'paid' && c.paid_at" :title="new Date(c.paid_at).toLocaleString()">
                  {{ new Date(c.paid_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}
                  <span class="block text-[10px] text-gray-400">{{ new Date(c.paid_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }}</span>
                </span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-3 py-2 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    v-if="c.payment_status !== 'paid'"
                    @click="markAsPayment(c)"
                    :disabled="processingPaymentId === (c._id || c.student_id)"
                    class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-[11px] font-bold transition disabled:opacity-60 inline-flex items-center gap-1 whitespace-nowrap"
                    title="Mark as Paid"
                  >
                    <svg v-if="processingPaymentId === (c._id || c.student_id)" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    <span>{{ processingPaymentId === (c._id || c.student_id) ? '...' : 'Paid' }}</span>
                  </button>
                  <button
                    v-else
                    @click="markAsUnpaid(c)"
                    :disabled="processingPaymentId === (c._id || c.student_id)"
                    class="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-[11px] font-bold transition disabled:opacity-60 inline-flex items-center gap-1 whitespace-nowrap"
                    title="Reverse this payment"
                  >
                    <svg v-if="processingPaymentId === (c._id || c.student_id)" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                    <span>{{ processingPaymentId === (c._id || c.student_id) ? '...' : 'Unpaid' }}</span>
                  </button>
                  <button @click="applyDiscount(c)" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold transition whitespace-nowrap inline-flex items-center justify-center" title="Apply / change discount">
                    <img src="/discount.svg" alt="Discount" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bottom Pagination Controls -->
      <div v-if="!isLoading && filteredContributions.length > 0" class="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 md:px-8 py-3 border-t border-gray-100">
        <div class="text-sm text-gray-600">
          Showing {{ (paymentsPage - 1) * paymentsPerPage + 1 }} to {{ Math.min(paymentsPage * paymentsPerPage, filteredContributions.length) }} of {{ filteredContributions.length }} records
        </div>
        <div class="flex gap-2 items-center">
          <button
            @click="paymentsPage = Math.max(1, paymentsPage - 1)"
            :disabled="paymentsPage === 1"
            class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Previous
          </button>
          <div class="flex gap-1 items-center">
            <button
              v-for="page in paymentsPaginationRange"
              :key="page"
              @click="page !== '...' && (paymentsPage = page)"
              :disabled="page === '...'"
              :class="[
                'w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200',
                page === '...' ? 'cursor-default text-gray-400' :
                paymentsPage === page ? 'bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white shadow' :
                'border border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
            >{{ page }}</button>
          </div>
          <button
            @click="paymentsPage = Math.min(paymentsTotalPages, paymentsPage + 1)"
            :disabled="paymentsPage === paymentsTotalPages"
            class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            Next
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Event Confirmation Modal -->
    <Teleport to="body">
    <transition name="fade">
      <div v-if="showDeleteEventConfirm" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancelDeleteEvent"></div>
        <div class="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div class="p-6 text-center">
            <!-- Icon with countdown ring -->
            <div class="relative w-16 h-16 mx-auto mb-4">
              <svg class="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#fee2e2" stroke-width="4"/>
                <circle cx="28" cy="28" r="24" fill="none" stroke="#ef4444" stroke-width="4"
                  stroke-dasharray="150.8"
                  :stroke-dashoffset="deleteConfirmCooldown > 0 ? (150.8 * deleteConfirmCooldown / 5) : 0"
                  class="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <svg v-if="deleteConfirmCooldown === 0" class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span v-else class="text-xl font-extrabold text-red-600">{{ deleteConfirmCooldown }}</span>
              </div>
            </div>

            <h3 class="text-lg font-extrabold text-gray-900 mb-1">Delete Event?</h3>
            <p class="text-sm text-gray-500 mb-1">You are about to permanently delete:</p>
            <p class="text-sm font-bold text-gray-800 mb-1">{{ eventToDelete?.title }}</p>
            <p class="text-xs text-red-500 font-medium mb-2">This will also remove all payment records linked to this event. This cannot be undone.</p>
            <p v-if="deleteConfirmCooldown > 0" class="text-xs text-gray-400 mb-4 font-medium">Please wait {{ deleteConfirmCooldown }}s before confirming...</p>
            <p v-else class="text-xs text-orange-600 font-semibold mb-4">You may now confirm the deletion.</p>

            <div class="flex gap-3">
              <button @click="cancelDeleteEvent" :disabled="isDeletingEvent" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
                Cancel
              </button>
              <button
                @click="deleteEvent"
                :disabled="isDeletingEvent || deleteConfirmCooldown > 0"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2',
                  deleteConfirmCooldown > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-60'
                ]"
              >
                <svg v-if="isDeletingEvent" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <span v-if="isDeletingEvent">Deleting...</span>
                <span v-else-if="deleteConfirmCooldown > 0">Wait ({{ deleteConfirmCooldown }}s)</span>
                <span v-else>Delete Event</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
    </Teleport>

    <!-- Create Contribution Event Modal -->
    <Teleport to="body">
    <transition name="fade">
      <div v-if="showCreateEventModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeCreateEventModal"></div>
        <div class="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </div>
              <div>
                <h3 class="text-lg font-extrabold text-white">Create Contribution Event</h3>
                <p class="text-white/70 text-sm mt-0.5">Set up a new payment event for students</p>
              </div>
            </div>
            <button @click="closeCreateEventModal" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-6 space-y-4 overflow-y-auto">
            <!-- Event Title -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Title <span class="text-red-500">*</span></label>
              <input
                v-model="newEventForm.title"
                type="text"
                placeholder="e.g., CCS General Assembly Fee, Sportsfest 2025"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description <span class="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                v-model="newEventForm.description"
                rows="2"
                placeholder="Brief description of the event or fee..."
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition resize-none"
              ></textarea>
            </div>

            <!-- Amount & Type Row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₱) <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₱</span>
                  <input
                    v-model.number="newEventForm.amount_due"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    class="w-full pl-7 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                <select v-model="newEventForm.type" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition">
                  <option value="fee">Fee</option>
                  <option value="membership">Membership</option>
                  <option value="donation">Donation</option>
                  <option value="other">Other / Event</option>
                </select>
              </div>
            </div>

            <!-- Deadline -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Deadline <span class="text-gray-400 font-normal">(optional)</span></label>
              <input
                v-model="newEventForm.deadline"
                type="date"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition"
              />
            </div>

            <!-- Target Year Levels -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Year Levels <span class="text-gray-400 font-normal">(leave unchecked = all)</span></label>
              <div class="flex flex-wrap gap-2">
                <label v-for="yl in ['1st Year','2nd Year','3rd Year','4th Year']" :key="yl" class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" :value="yl" v-model="newEventForm.target_year_levels"
                    class="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-300" />
                  <span class="text-sm text-gray-700">{{ yl }}</span>
                </label>
              </div>
            </div>

            <!-- Target Programs -->
            <div v-if="uniquePrograms.length > 0">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Programs <span class="text-gray-400 font-normal">(leave unchecked = all)</span></label>
              <div class="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                <label v-for="prog in uniquePrograms" :key="prog" class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" :value="prog" v-model="newEventForm.target_programs"
                    class="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-300" />
                  <span class="text-sm text-gray-700">{{ prog }}</span>
                </label>
              </div>
            </div>

            <!-- Info Banner -->
            <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-sm text-blue-700">
                <span v-if="newEventForm.target_year_levels.length === 0 && newEventForm.target_programs.length === 0">
                  This will assign the event to <strong>all approved students</strong>.
                </span>
                <span v-else>
                  This will assign the event only to approved students matching the selected year levels/programs.
                </span>
                You can track and mark payments after creation.
              </p>
            </div>

            <!-- Error message -->
            <p v-if="createEventError" class="text-sm text-red-600 font-medium">{{ createEventError }}</p>

            <!-- Actions -->
            <div class="flex gap-3 pt-1">
              <button @click="closeCreateEventModal" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
                Cancel
              </button>
              <button
                @click="createContributionEvent"
                :disabled="!newEventForm.title.trim() || !newEventForm.amount_due || isCreatingEvent"
                class="flex-1 px-4 py-2.5 bg-gradient-to-r from-ssaam-dark to-ssaam-light hover:opacity-90 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-200"
              >
                <svg v-if="isCreatingEvent" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ isCreatingEvent ? 'Creating...' : 'Create Event' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
    </Teleport>

    <!-- Edit Event Modal -->
    <Teleport to="body">
    <transition name="fade">
      <div v-if="showEditEventModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeEditEventModal"></div>
        <div class="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 15.414 9 16l.586-3z"/></svg>
              </div>
              <div>
                <h3 class="text-lg font-extrabold text-white">Edit Contribution Event</h3>
                <p class="text-white/70 text-sm mt-0.5">Update details for this payment event</p>
              </div>
            </div>
            <button @click="closeEditEventModal" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-6 space-y-4 overflow-y-auto">
            <!-- Event Title -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Title <span class="text-red-500">*</span></label>
              <input v-model="editEventForm.title" type="text" placeholder="e.g., CCS General Assembly Fee"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition" />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description <span class="text-gray-400 font-normal">(optional)</span></label>
              <textarea v-model="editEventForm.description" rows="2" placeholder="Brief description..."
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition resize-none"></textarea>
            </div>

            <!-- Amount, Type, Status Row -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₱) <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₱</span>
                  <input v-model.number="editEventForm.amount_due" type="number" min="0" step="0.01" placeholder="0.00"
                    class="w-full pl-7 pr-2 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                <select v-model="editEventForm.type" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition">
                  <option value="fee">Fee</option>
                  <option value="membership">Membership</option>
                  <option value="donation">Donation</option>
                  <option value="other">Other / Event</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <select v-model="editEventForm.status" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition">
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <!-- Deadline -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Deadline <span class="text-gray-400 font-normal">(optional)</span></label>
              <input v-model="editEventForm.deadline" type="date"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition" />
            </div>

            <!-- Target Year Levels -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Year Levels <span class="text-gray-400 font-normal">(unchecked = all)</span></label>
              <div class="flex flex-wrap gap-2">
                <label v-for="yl in ['1st Year','2nd Year','3rd Year','4th Year']" :key="yl" class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" :value="yl" v-model="editEventForm.target_year_levels"
                    class="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-300" />
                  <span class="text-sm text-gray-700">{{ yl }}</span>
                </label>
              </div>
            </div>

            <!-- Target Programs -->
            <div v-if="uniquePrograms.length > 0">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Programs <span class="text-gray-400 font-normal">(unchecked = all)</span></label>
              <div class="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                <label v-for="prog in uniquePrograms" :key="prog" class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" :value="prog" v-model="editEventForm.target_programs"
                    class="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-300" />
                  <span class="text-sm text-gray-700">{{ prog }}</span>
                </label>
              </div>
            </div>

            <!-- Error message -->
            <p v-if="editEventError" class="text-sm text-red-600 font-medium">{{ editEventError }}</p>

            <!-- Actions -->
            <div class="flex gap-3 pt-1">
              <button @click="closeEditEventModal" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
                Cancel
              </button>
              <button
                @click="saveEditEvent"
                :disabled="!editEventForm.title.trim() || !editEventForm.amount_due || isEditingEvent"
                class="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-90 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-200"
              >
                <svg v-if="isEditingEvent" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                {{ isEditingEvent ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
    </Teleport>

    <!-- Download Confirmation Modal -->
    <Teleport to="body">
    <transition name="fade">
      <div v-if="showDownloadConfirm" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showDownloadConfirm = false"></div>
        <div class="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-5 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-extrabold text-white">Confirm Export</h3>
              <p class="text-white/70 text-sm mt-0.5">Review records before downloading</p>
            </div>
            <button @click="showDownloadConfirm = false" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-5 sm:p-6 space-y-4">
            <!-- Filter Summary -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-gray-50 rounded-2xl p-3">
                <p class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Status</p>
                <p class="font-bold text-gray-900 text-sm mt-0.5">{{ downloadFiltersSummary.status }}</p>
              </div>
              <div class="bg-gray-50 rounded-2xl p-3">
                <p class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Year</p>
                <p class="font-bold text-gray-900 text-sm mt-0.5">{{ downloadFiltersSummary.year }}</p>
              </div>
              <div class="bg-gray-50 rounded-2xl p-3">
                <p class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Program</p>
                <p class="font-bold text-gray-900 text-sm mt-0.5">{{ downloadFiltersSummary.program }}</p>
              </div>
              <div class="bg-gray-50 rounded-2xl p-3">
                <p class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Format</p>
                <div class="flex items-center gap-3 mt-1">
                  <label class="inline-flex items-center text-sm font-semibold text-gray-700 cursor-pointer gap-1.5">
                    <input type="radio" v-model="downloadFormat" value="xlsx" class="accent-blue-600" /> XLSX
                  </label>
                  <label class="inline-flex items-center text-sm font-semibold text-gray-700 cursor-pointer gap-1.5">
                    <input type="radio" v-model="downloadFormat" value="csv" class="accent-blue-600" /> CSV
                  </label>
                </div>
              </div>
            </div>

            <!-- Preview Table -->
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview (first {{ downloadPreviewLimit }} records)</p>
              <div class="border border-gray-200 rounded-2xl overflow-hidden">
                <div class="overflow-x-auto max-h-48">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 sticky top-0">
                      <tr>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500">Student</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500">ID</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500 hidden sm:table-cell">Program</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500 hidden sm:table-cell">Year</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500">Amount</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500 hidden sm:table-cell">Paid By</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500 hidden md:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="(c, idx) in downloadPreviewRecords" :key="c._id || idx" class="hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium">{{ c.student_name }}</td>
                        <td class="px-3 py-2 text-gray-500">{{ c.student_id }}</td>
                        <td class="px-3 py-2 text-gray-500 hidden sm:table-cell">{{ c.program || 'N/A' }}</td>
                        <td class="px-3 py-2 text-gray-500 hidden sm:table-cell">{{ c.year_level || 'N/A' }}</td>
                        <td class="px-3 py-2 font-semibold text-blue-700">{{ c.amount_paid ? `₱${c.amount_paid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : (c.original_amount ? `₱${c.original_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—') }}</td>
                        <td class="px-3 py-2 text-gray-500 hidden sm:table-cell">{{ c.paid_by_treasurer ? (typeof c.paid_by_treasurer === 'string' ? c.paid_by_treasurer : (c.paid_by_treasurer?.first_name || '') + ' ' + (c.paid_by_treasurer?.last_name || '')) : 'Admin' }}</td>
                        <td class="px-3 py-2 text-gray-500 text-xs hidden md:table-cell">{{ c.payment_status === 'paid' && c.paid_at ? new Date(c.paid_at).toLocaleString() : 'N/A' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <button @click="showDownloadConfirm = false" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
                Cancel
              </button>
              <button
                @click="confirmAndExportFilteredExcel"
                :disabled="isDownloading"
                class="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 disabled:opacity-70 shadow-md shadow-green-200"
              >
                <svg v-if="isDownloading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                {{ isDownloading ? 'Exporting...' : `Export ${serverFilteredCount !== null ? serverFilteredCount : filteredCount} records` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
    </Teleport>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
import { buildAPIUrl, getCollege } from '../config/api.js'
import LoyversePOSPanel from './LoyversePOSPanel.vue'

export default {
  name: 'AdminContributionPanel',
  components: { LoyversePOSPanel },
  data() {
    return {
      // Reactive map of cache keys -> true when an avatar image fails to load,
      // so the initials fallback inside the same circle becomes visible.
      photoFailed: {},
      searchQuery: '',
      contributions: [],
      selectedStudent: null,
      // Multi-result student search: list of close matches the user can click.
      searchResults: [],
      isSearchingStudent: false,
      hasSearched: false,
      activePayment: null,
      campaignFee: 0,
      discountType: 'amount',
      discountValue: 0,
      filterYearLevel: '',
      filterProgram: '',
      filterStatus: '',
      filterCollege: '',
      // Date filter: when set, only payments whose `paid_at` falls on the
      // selected calendar day (in the admin's local timezone) are shown.
      // 'today' / 'yesterday' are convenience presets that map to a
      // concrete YYYY-MM-DD string in setDatePreset(). Future dates are
      // blocked at the input level via :max="todayDateString".
      filterPaidDate: '',
      filterPaidDatePreset: '',
      isLoading: false,
      isDownloading: false,
      showDownloadConfirm: false,
      downloadPreviewLimit: 5,
      downloadFormat: 'xlsx',
      downloadPreviewRecords: [],
      serverFilteredCount: null,
      isProcessingPaymentGlobal: false,
      processingPaymentId: null,
      showCreateEventModal: false,
      isCreatingEvent: false,
      createEventError: '',
      paymentEvents: [],
      isLoadingEvents: false,
      showDeleteEventConfirm: false,
      eventToDelete: null,
      isDeletingEvent: false,
      deleteConfirmCooldown: 0,
      _deleteConfirmTimer: null,
      showEditEventModal: false,
      isEditingEvent: false,
      editEventError: '',
      editEventForm: {
        _id: '', title: '', description: '', amount_due: '', type: 'fee',
        deadline: '', status: 'active', target_year_levels: [], target_programs: []
      },
      showStatsPanel: false,
      newEventForm: {
        title: '',
        description: '',
        amount_due: '',
        type: 'fee',
        deadline: '',
        target_year_levels: [],
        target_programs: []
      },
      paymentsPage: 1,
      paymentsPerPage: 10,
      // Manual / auto refresh state for the "Paid On" panel. We pulse the
      // little dot next to "Paid On" each time the data is refreshed (either
      // by the admin clicking the refresh button or automatically right
      // after a payment is recorded) so the change is visible.
      isRefreshingPaidOn: false,
      paidOnLastRefreshed: null,
      _paidOnRefreshFlashTimer: null,
    };
  },
  computed: {
    isMaster() {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
        return user.isMaster === true
      } catch {
        return false
      }
    },
    calculatedDiscount() {
      if (this.discountType === 'percentage') {
        return (this.campaignFee * this.discountValue) / 100;
      }
      return Math.min(this.discountValue, this.campaignFee);
    },
    targetPayment() {
      return Math.max(0, this.campaignFee - this.calculatedDiscount);
    },
    // The contribution row that matches the currently-selected student for the
    // active campaign. Used to detect whether they've already paid so the
    // selected-student card can show "Already Paid" + "Mark as Unpaid"
    // instead of "Record Payment".
    selectedStudentContribution() {
      if (!this.selectedStudent) return null;
      const sid = this.selectedStudent.student_id;
      return this.contributions.find(c => (c.student_id_number || c.student_id) === sid) || null;
    },
    selectedStudentAlreadyPaid() {
      const c = this.selectedStudentContribution;
      return !!(c && c.payment_status === 'paid');
    },
    filteredContributions() {
      const fs = (this.filterStatus || '').toString().toLowerCase();
      const fy = this.filterYearLevel;
      const fp = this.filterProgram;

      const fc = (this.filterCollege || '').toUpperCase();
      const q = (this.searchQuery || '').toString().trim().toLowerCase();
      // Local YYYY-MM-DD string the admin picked (e.g. "2026-04-29"). When
      // empty, the date filter is inactive and every record is allowed
      // through this gate.
      const fdate = (this.filterPaidDate || '').toString();

      // Audience scope from the active payment event. When the event is
      // restricted (e.g. "4th Year BSCS only"), exclude any contribution
      // record whose student doesn't match — this keeps the table AND the
      // statistics counts in sync with the campaign's intended audience.
      const audienceLevels = (this.activePayment && Array.isArray(this.activePayment.target_year_levels))
        ? this.activePayment.target_year_levels.filter(Boolean)
        : [];
      const audiencePrograms = (this.activePayment && Array.isArray(this.activePayment.target_programs))
        ? this.activePayment.target_programs.filter(Boolean)
        : [];

      const filtered = this.contributions.filter(c => {
        // Audience gate (applied first so stats never count out-of-scope students)
        if (audienceLevels.length > 0 && !audienceLevels.includes(c.year_level)) return false;
        if (audiencePrograms.length > 0 && !audiencePrograms.includes(c.program)) return false;

        const cStatus = (c.payment_status || '').toString().toLowerCase();
        const matchesLevel = !fy || c.year_level === fy;
        const matchesProgram = !fp || (c.program || '').toString() === fp;
        const matchesCollege = !fc || (c.college || '').toUpperCase() === fc;

        let matchesStatus = true;
        if (fs) {
          if (fs === 'unpaid') {
            matchesStatus = !cStatus || cStatus !== 'paid';
          } else {
            matchesStatus = cStatus === fs;
          }
        }

        let matchesQuery = true;
        if (q) {
          const hay = [
            c.name,
            c.first_name,
            c.middle_name,
            c.last_name,
            c.full_name,
            c.student_id,
            c.id_number,
            c.rfid_code,
            c.email
          ].filter(Boolean).join(' ').toLowerCase();
          matchesQuery = hay.includes(q);
        }

        // Date filter: only paid records whose `paid_at` falls on the chosen
        // local calendar day pass. Unpaid records (no paid_at) are excluded
        // when a date filter is active — that's the point of the filter:
        // "show me who paid on this day".
        let matchesDate = true;
        if (fdate) {
          if (!c.paid_at) {
            matchesDate = false;
          } else {
            const d = new Date(c.paid_at);
            if (isNaN(d.getTime())) {
              matchesDate = false;
            } else {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const localDate = `${y}-${m}-${day}`;
              matchesDate = localDate === fdate;
            }
          }
        }

        return matchesLevel && matchesProgram && matchesStatus && matchesCollege && matchesQuery && matchesDate;
      });

      // Sort: paid first (so the most recent collections lead the list),
      // then within each group order by paid_at DESC so the newest payment
      // sits at the top — matches how an admin reviews "what just came in".
      // Unpaid rows fall to the bottom and keep their natural order.
      return filtered.sort((a, b) => {
        const aPaid = a.payment_status === 'paid' ? 0 : 1;
        const bPaid = b.payment_status === 'paid' ? 0 : 1;
        if (aPaid !== bPaid) return aPaid - bPaid;
        if (aPaid === 0) {
          const at = a.paid_at ? new Date(a.paid_at).getTime() : 0;
          const bt = b.paid_at ? new Date(b.paid_at).getTime() : 0;
          return bt - at;
        }
        return 0;
      });
    },
    filteredCount() {
      return this.filteredContributions.length;
    },
    downloadFiltersSummary() {
      return {
        status: this.filterStatus || 'All',
        year: this.filterYearLevel || 'All',
        program: this.filterProgram || 'All'
      }
    },
    paginatedContributions() {
      const start = (this.paymentsPage - 1) * this.paymentsPerPage;
      return this.filteredContributions.slice(start, start + this.paymentsPerPage);
    },
    paymentsTotalPages() {
      return Math.max(1, Math.ceil(this.filteredContributions.length / this.paymentsPerPage));
    },
    paymentsPaginationRange() {
      const total = this.paymentsTotalPages;
      const cur = this.paymentsPage;
      const pages = [];
      if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        let start = Math.max(2, cur - 1);
        let end = Math.min(total - 1, cur + 1);
        if (start > 2) pages.push('...');
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < total - 1) pages.push('...');
        if (!pages.includes(total)) pages.push(total);
      }
      return pages;
    },
    uniquePrograms() {
      const progs = new Set(this.contributions.map(c => c.program).filter(Boolean));
      return Array.from(progs).sort();
    },
    statsByYearLevel() {
      const order = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      const map = {};
      for (const c of this.filteredContributions) {
        const yl = c.year_level || 'Unknown';
        if (!map[yl]) map[yl] = { year_level: yl, total: 0, paid: 0, unpaid: 0 };
        map[yl].total++;
        if (c.payment_status === 'paid') map[yl].paid++;
        else map[yl].unpaid++;
      }
      return Object.values(map).sort((a, b) => {
        const ai = order.indexOf(a.year_level), bi = order.indexOf(b.year_level);
        if (ai === -1 && bi === -1) return a.year_level.localeCompare(b.year_level);
        if (ai === -1) return 1; if (bi === -1) return -1;
        return ai - bi;
      });
    },
    statsByProgram() {
      const map = {};
      for (const c of this.filteredContributions) {
        const prog = c.program || 'Unknown';
        if (!map[prog]) map[prog] = { program: prog, total: 0, paid: 0, unpaid: 0 };
        map[prog].total++;
        if (c.payment_status === 'paid') map[prog].paid++;
        else map[prog].unpaid++;
      }
      return Object.values(map).sort((a, b) => b.total - a.total);
    },
    statsOverall() {
      const total = this.filteredContributions.length;
      const paid = this.filteredContributions.filter(c => c.payment_status === 'paid').length;
      const totalCollected = this.filteredContributions
        .filter(c => c.payment_status === 'paid')
        .reduce((sum, c) => sum + Number(c.amount_paid || c.original_amount || 0), 0);
      const expected = this.filteredContributions
        .reduce((sum, c) => sum + Number(c.original_amount || (this.activePayment && this.activePayment.amount_due) || 0), 0);
      return {
        total,
        paid,
        unpaid: total - paid,
        pct: total ? Math.round((paid / total) * 100) : 0,
        totalCollected,
        expected,
      };
    },
    collectedByEvent() {
      const map = {};
      for (const ev of (this.paymentEvents || [])) {
        let total = 0;
        for (const r of (ev.payment_records || [])) {
          if (r.payment_status === 'paid' || r.is_paid) {
            total += Number(r.amount_paid || ev.amount_due || 0);
          }
        }
        map[ev._id] = total;
      }
      return map;
    },
    // True when any record on the current page actually has a discount.
    // Used to auto-hide the Discount column when no one has one (the column
    // was just an "—" wall otherwise, which made the table feel cramped).
    anyRowHasDiscount() {
      return (this.paginatedContributions || []).some(c => Number(c.discount_value || 0) > 0);
    },
    // Colspan for the "no records" empty-state row in the desktop table.
    // Mirrors the actual visible column count so the empty cell spans the
    // full width regardless of which optional columns are showing.
    desktopColspan() {
      // Always-visible: ID, Name, Program, Target, Status, Actions = 6
      let n = 6;
      if (this.isMaster) n += 1;            // College
      if (this.anyRowHasDiscount) n += 1;   // Discount
      // Year + Original + Paid Date are hidden by CSS but still render in
      // the DOM, so they count toward colspan; CSS just hides them visually.
      n += 3;
      return n;
    },
    // Today as YYYY-MM-DD in the admin's local timezone — used as the `max`
    // attribute on the date input so the browser disables tomorrow + beyond.
    todayDateString() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    // Total ₱ collected on the day the date filter is currently set to.
    // Used by the inline summary chip under the date picker.
    filterPaidDateCollected() {
      return this.filteredContributions
        .filter(c => c.payment_status === 'paid')
        .reduce((sum, c) => sum + Number(c.amount_paid || c.original_amount || 0), 0);
    },
    // Buckets of paid contributions by today / yesterday / this week / this
    // month, computed against ALL contributions (ignoring the active date
    // filter on purpose) so the totals chip strip is a stable dashboard:
    // it always shows real money-in for each window, regardless of what the
    // admin is currently filtering. Other filters (year/program/status/
    // college) still apply because they live in `contributions` after the
    // server returns them.
    dailyTotals() {
      const now = new Date();
      const todayKey = this.todayDateString;
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      // Week starts Monday in PH context — go back (now.getDay()+6)%7 days.
      const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const out = {
        today: { amount: 0, count: 0 },
        yesterday: { amount: 0, count: 0 },
        week: { amount: 0, count: 0 },
        month: { amount: 0, count: 0 },
      };

      for (const c of (this.contributions || [])) {
        if (c.payment_status !== 'paid' || !c.paid_at) continue;
        const d = new Date(c.paid_at);
        if (isNaN(d.getTime())) continue;
        const amt = Number(c.amount_paid || c.original_amount || 0);
        const localKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (localKey === todayKey) { out.today.amount += amt; out.today.count++; }
        if (localKey === yKey)     { out.yesterday.amount += amt; out.yesterday.count++; }
        if (d >= weekStart)        { out.week.amount += amt; out.week.count++; }
        if (d >= monthStart)       { out.month.amount += amt; out.month.count++; }
      }
      return out;
    },
  },
  watch: {
    filteredContributions() { this.paymentsPage = 1; },
    filterStatus() { this.loadAllContributions(); },
    filterProgram() { this.loadAllContributions(); },
    filterYearLevel() { this.loadAllContributions(); },
    filterCollege() { this.loadAllContributions(); },
    filterPaidDate(val) {
      // Keep preset chips in sync: if the picked date matches one of our
      // presets (today/yesterday), keep that chip highlighted; otherwise
      // drop the highlight so it's clear the admin chose a custom day.
      const presetVal = this._presetDateString(this.filterPaidDatePreset);
      if (val !== presetVal) this.filterPaidDatePreset = '';
    },
    searchQuery(val) {
      const v = (val || '').toString().trim();
      if (/^[A-Za-z0-9]{8,}$/.test(v) && !v.includes('-')) {
        if (this._rfidAutoTimer) clearTimeout(this._rfidAutoTimer);
        this._rfidAutoTimer = setTimeout(() => { this.searchStudent(); }, 150);
      }
    }
  },
  mounted() {
    this.loadAllPaymentEvents();
    this.loadAllContributions();
  },
  methods: {
    markPhotoFailed(key) {
      if (!key) return;
      this.photoFailed = { ...this.photoFailed, [key]: true };
    },
    async loadAllPaymentEvents() {
      this.isLoadingEvents = true;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildAPIUrl('/apis/payments'), {
          headers: { 'Authorization': `Bearer ${token}`, 'X-SSAAM-College': getCollege() }
        });
        if (response.ok) {
          const data = await response.json();
          const payments = (data.payments || data.data || []).filter(p => p.amount_due > 0);
          this.paymentEvents = payments;
          if (payments.length > 0 && !this.activePayment) {
            this.activePayment = payments[0];
            this.campaignFee = payments[0].amount_due;
          }
        }
      } catch (e) {
        console.error('Error loading payment events:', e);
      } finally {
        this.isLoadingEvents = false;
      }
    },
    selectEvent(event) {
      this.activePayment = event;
      this.campaignFee = event.amount_due || 0;
      this.selectedStudent = null;
      this.discountValue = 0;
      this.loadAllContributions();
    },
    confirmDeleteEvent(event) {
      this.eventToDelete = event;
      this.showDeleteEventConfirm = true;
      this.deleteConfirmCooldown = 5;
      clearInterval(this._deleteConfirmTimer);
      this._deleteConfirmTimer = setInterval(() => {
        if (this.deleteConfirmCooldown > 0) {
          this.deleteConfirmCooldown--;
        } else {
          clearInterval(this._deleteConfirmTimer);
        }
      }, 1000);
    },
    cancelDeleteEvent() {
      this.showDeleteEventConfirm = false;
      this.deleteConfirmCooldown = 0;
      clearInterval(this._deleteConfirmTimer);
    },
    async deleteEvent() {
      if (!this.eventToDelete) return;
      this.isDeletingEvent = true;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildAPIUrl(`/apis/payments/${this.eventToDelete._id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'X-SSAAM-College': getCollege() }
        });
        const data = await response.json();
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Event "${this.eventToDelete.title}" deleted.`, type: 'success' } }));
          if (this.activePayment?._id === this.eventToDelete._id) {
            this.activePayment = null;
            this.campaignFee = 0;
          }
          this.showDeleteEventConfirm = false;
          this.eventToDelete = null;
          this.deleteConfirmCooldown = 0;
          clearInterval(this._deleteConfirmTimer);
          await this.loadAllPaymentEvents();
          this.loadAllContributions();
        } else {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: data.message || 'Failed to delete event.', type: 'error' } }));
        }
      } catch (e) {
        console.error('Error deleting event:', e);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Network error while deleting.', type: 'error' } }));
      } finally {
        this.isDeletingEvent = false;
      }
    },
    // Triggers a refresh of the contributions list and pulses the small
    // indicator next to "Paid On" so the admin can tell the panel really
    // re-fetched. Used both by the manual Refresh button and by the
    // post-payment auto-refresh hook below.
    async refreshPaidOn() {
      if (this.isRefreshingPaidOn) return;
      this.isRefreshingPaidOn = true;
      try {
        await this.loadAllContributions();
        this.paidOnLastRefreshed = Date.now();
      } finally {
        // Keep the pulse visible briefly so it's actually noticeable even on
        // very fast networks where the request returns in <100ms.
        if (this._paidOnRefreshFlashTimer) clearTimeout(this._paidOnRefreshFlashTimer);
        this._paidOnRefreshFlashTimer = setTimeout(() => {
          this.isRefreshingPaidOn = false;
        }, 1200);
      }
    },
    formatRefreshedTime(ts) {
      if (!ts) return '';
      const diff = Math.max(0, Date.now() - ts);
      if (diff < 5000) return 'just now';
      if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
      try {
        return new Date(ts).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
      } catch {
        return '';
      }
    },
    async loadAllContributions() {
      this.isLoading = true;
      // Clear stale rows + any open search dropdown so the loading skeleton
      // is the only thing on screen — prevents the previous page's data
      // from "flashing" while the new fetch is in flight.
      this.contributions = [];
      this.searchResults = [];
      this.hasSearched = false;
      try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams();
        params.set('limit', '1000');
        if (this.activePayment?._id) params.set('payment_id', this.activePayment._id);
        if (this.filterStatus) params.set('status', this.filterStatus);
        if (this.filterYearLevel) params.set('year_level', this.filterYearLevel);
        if (this.filterProgram) params.set('program', this.filterProgram);
        if (this.searchQuery) params.set('query', this.searchQuery);

        const url = buildAPIUrl(`/apis/contributions/search?${params.toString()}`);
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const college = getCollege();
          this.contributions = (data.data || []).map(c => ({ ...c, college: c.college || college }));
          this.serverFilteredCount = data.pagination ? data.pagination.total : this.contributions.length;
        } else {
          this.loadSampleData();
        }
      } catch (error) {
        console.error('Error loading contributions:', error);
        this.loadSampleData();
      } finally {
        this.isLoading = false;
      }
    },
    loadSampleData() {
      this.contributions = [
        { _id: '1', student_id: '21-A-00001', student_name: 'John Doe', program: 'BSCS', year_level: '3rd Year', original_amount: 780, discount_value: 0, target_amount: 780, payment_status: 'paid', paid_at: new Date().toISOString() },
        { _id: '2', student_id: '21-A-00002', student_name: 'Maria Cruz', program: 'BSIT', year_level: '2nd Year', original_amount: 780, discount_value: 200, target_amount: 580, payment_status: 'paid', paid_at: new Date().toISOString() },
        { _id: '3', student_id: '21-A-00003', student_name: 'Robert Santos', program: 'BSIS', year_level: '1st Year', original_amount: 780, discount_value: 156, target_amount: 624, payment_status: 'unpaid', paid_at: null },
        { _id: '4', student_id: '21-A-00004', student_name: 'Angela Lopez', program: 'BSCS', year_level: '4th Year', original_amount: 780, discount_value: 0, target_amount: 780, payment_status: 'paid', paid_at: new Date().toISOString() },
        { _id: '5', student_id: '21-A-00005', student_name: 'Carlos Reyes', program: 'BSIT', year_level: '3rd Year', original_amount: 780, discount_value: 100, target_amount: 680, payment_status: 'paid', paid_at: new Date().toISOString() }
      ];
    },
    async searchStudent() {
      const q = (this.searchQuery || '').trim();
      if (!q) {
        this.searchResults = [];
        this.hasSearched = false;
        return;
      }
      this.isSearchingStudent = true;
      this.hasSearched = true;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildAPIUrl('/apis/students/search-multi'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-SSAAM-College': getCollege() },
          body: JSON.stringify({ search_query: q })
        });
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data.students) ? data.students : [];
          this.searchResults = list;
          if (list.length === 0) {
            window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'No matching students found', type: 'warning' } }));
          } else if (list.length === 1) {
            // Exactly one hit — skip the "click to select" step and promote
            // the only candidate straight into the active selection. This
            // makes the common case (RFID scan / unique student ID) a
            // single-action flow.
            this.selectStudentFromSearch(list[0]);
            window.dispatchEvent(new CustomEvent('app-notification', {
              detail: {
                message: `Selected ${list[0].full_name || ((list[0].first_name || '') + ' ' + (list[0].last_name || '')).trim() || list[0].student_id}`,
                type: 'success'
              }
            }));
          }
        } else {
          this.searchResults = [];
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Student search failed', type: 'warning' } }));
        }
      } catch (error) {
        console.error('Error searching student:', error);
        this.searchResults = [];
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Error searching student', type: 'error' } }));
      } finally {
        this.isSearchingStudent = false;
      }
    },
    selectStudentFromSearch(student) {
      // Click handler on a search result row — promotes a candidate into the
      // active selection used by the payment card and POS panel.
      this.selectedStudent = student;
      this.discountValue = 0;
      this.searchResults = [];
      this.hasSearched = false;
    },
    clearSearchResults() {
      this.searchResults = [];
      this.hasSearched = false;
    },
    // ── Date filter helpers ────────────────────────────────────────────
    // Internal: turn a preset key ('today' | 'yesterday') into the
    // corresponding YYYY-MM-DD string in the admin's local timezone.
    // 'tomorrow' was intentionally removed — collections can't happen in
    // the future, so the chip would always show empty results.
    _presetDateString(key) {
      if (!key) return '';
      const d = new Date();
      if (key === 'yesterday') d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    setDatePreset(key) {
      // Toggle off if the same chip is tapped again — gives the admin a
      // one-tap way to clear the active preset without hunting for the X.
      if (this.filterPaidDatePreset === key) {
        this.filterPaidDatePreset = '';
        this.filterPaidDate = '';
        return;
      }
      this.filterPaidDatePreset = key;
      this.filterPaidDate = this._presetDateString(key);
    },
    clearDateFilter() {
      this.filterPaidDate = '';
      this.filterPaidDatePreset = '';
    },
    // Pretty label for the active date filter, used in the summary chip.
    formatFilterDate(dateStr) {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    },
    closeCreateEventModal() {
      this.showCreateEventModal = false;
      this.createEventError = '';
      this.newEventForm = { title: '', description: '', amount_due: '', type: 'fee', deadline: '', target_year_levels: [], target_programs: [] };
    },
    openEditEvent(event) {
      this.editEventForm = {
        _id: event._id,
        title: event.title || '',
        description: event.description || '',
        amount_due: event.amount_due || '',
        type: event.type || 'fee',
        deadline: event.deadline ? event.deadline.slice(0, 10) : '',
        status: event.status || 'active',
        target_year_levels: Array.isArray(event.target_year_levels) ? [...event.target_year_levels] : [],
        target_programs: Array.isArray(event.target_programs) ? [...event.target_programs] : [],
      };
      this.editEventError = '';
      this.showEditEventModal = true;
    },
    closeEditEventModal() {
      this.showEditEventModal = false;
      this.editEventError = '';
      this.editEventForm = { _id: '', title: '', description: '', amount_due: '', type: 'fee', deadline: '', status: 'active', target_year_levels: [], target_programs: [] };
    },
    async saveEditEvent() {
      this.editEventError = '';
      if (!this.editEventForm.title.trim()) { this.editEventError = 'Event title is required.'; return; }
      if (!this.editEventForm.amount_due || Number(this.editEventForm.amount_due) <= 0) { this.editEventError = 'Please enter a valid amount greater than 0.'; return; }
      this.isEditingEvent = true;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildAPIUrl(`/apis/payments/${this.editEventForm._id}`), {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-SSAAM-College': getCollege() },
          body: JSON.stringify({
            title: this.editEventForm.title.trim(),
            description: this.editEventForm.description.trim(),
            type: this.editEventForm.type,
            amount_due: Number(this.editEventForm.amount_due),
            deadline: this.editEventForm.deadline || null,
            status: this.editEventForm.status,
            target_year_levels: this.editEventForm.target_year_levels,
            target_programs: this.editEventForm.target_programs,
          })
        });
        const data = await response.json();
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Event "${this.editEventForm.title.trim()}" updated successfully!`, type: 'success' } }));
          if (this.activePayment && this.activePayment._id === this.editEventForm._id) {
            this.activePayment = { ...this.activePayment, ...data.data };
          }
          this.closeEditEventModal();
          await this.loadAllPaymentEvents();
          this.loadAllContributions();
        } else {
          this.editEventError = data.message || 'Failed to update event.';
        }
      } catch (error) {
        this.editEventError = 'Network error. Please try again.';
      } finally {
        this.isEditingEvent = false;
      }
    },
    async createContributionEvent() {
      this.createEventError = '';
      if (!this.newEventForm.title.trim()) {
        this.createEventError = 'Event title is required.';
        return;
      }
      if (!this.newEventForm.amount_due || Number(this.newEventForm.amount_due) <= 0) {
        this.createEventError = 'Please enter a valid amount greater than 0.';
        return;
      }
      this.isCreatingEvent = true;
      try {
        const token = localStorage.getItem('authToken');
        const payload = {
          title: this.newEventForm.title.trim(),
          description: this.newEventForm.description.trim(),
          type: this.newEventForm.type,
          amount_due: Number(this.newEventForm.amount_due),
          deadline: this.newEventForm.deadline || null,
          target_year_levels: this.newEventForm.target_year_levels,
          target_programs: this.newEventForm.target_programs,
        };
        const response = await fetch(buildAPIUrl('/apis/payments'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-SSAAM-College': getCollege()
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Contribution event "${payload.title}" created successfully!`, type: 'success' } }));
          this.closeCreateEventModal();
          // Don't null activePayment here — that wipes the daily totals chip
          // strip until loadAllPaymentEvents() repopulates. Keep the current
          // selection; loadAllPaymentEvents will sync server-fresh data
          // (including any newly created event) into the dropdown.
          await this.loadAllPaymentEvents();
          // If a brand-new event was returned, switch to it so the admin can
          // immediately start collecting against the campaign they just made.
          if (data && data.data && data.data._id) {
            const fresh = (this.paymentEvents || []).find(p => p._id === data.data._id);
            if (fresh) {
              this.activePayment = fresh;
              this.campaignFee = fresh.amount_due;
            }
          }
          this.loadAllContributions();
        } else {
          this.createEventError = data.message || 'Failed to create event. Please try again.';
        }
      } catch (error) {
        console.error('Error creating contribution event:', error);
        this.createEventError = 'Network error. Please try again.';
      } finally {
        this.isCreatingEvent = false;
      }
    },
    applyDiscount(contribution) {
      // Promote the row's student into the active selection so the existing
      // Discount editor in the payment card opens for them. Pre-fills any
      // discount they already have so the admin can adjust instead of
      // starting from zero.
      if (!contribution) return;
      this.selectedStudent = {
        _id: contribution._id,
        student_id: contribution.student_id_number || contribution.student_id,
        full_name: contribution.student_name,
        first_name: contribution.first_name,
        last_name: contribution.last_name,
        program: contribution.program,
        year_level: contribution.year_level,
        college: contribution.college,
        photo: contribution.photo
      };
      const existing = Number(contribution.discount_value || 0);
      this.discountValue = existing > 0 ? existing : 0;
      this.discountType = 'amount';
      this.$nextTick(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
      });
    },
    async markAsPayment(contribution) {
      if (!this.selectedStudent && !contribution) return;

      if (!this.activePayment?._id) {
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'No active payment event found. Please create one first.', type: 'warning' } }));
        return;
      }

      const isRow = !!contribution;
      const processingId = isRow ? (contribution._id || contribution.student_id_number) : 'global';
      try {
        if (isRow) { this.processingPaymentId = processingId; }
        else { this.isProcessingPaymentGlobal = true; }

        const token = localStorage.getItem('authToken');
        const studentIdInput = isRow
          ? (contribution.student_id_number || contribution.student_id)
          : this.selectedStudent.student_id;

        const paymentId = this.activePayment._id;
        const amountPaid = isRow ? (this.activePayment.amount_due || 0) : this.targetPayment;

        const response = await fetch(buildAPIUrl(`/apis/payments/${paymentId}/mark-paid`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-SSAAM-College': getCollege()
          },
          body: JSON.stringify({
            student_id_input: studentIdInput,
            amount_paid: amountPaid,
            notes: 'Payment recorded via admin panel'
          })
        });

        const data = await response.json();
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Payment recorded successfully', type: 'success' } }));
          this.discountValue = 0;
          // Preserve scroll position so the page doesn't jump while the list refreshes.
          const _scrollY = (typeof window !== 'undefined') ? window.scrollY : 0;
          // Use the Paid-On refresh wrapper so the indicator pulses + the
          // "updated …" timestamp ticks forward right after the payment is
          // recorded — this is the auto-refresh-after-payment behaviour.
          await this.refreshPaidOn();
          if (typeof window !== 'undefined') {
            this.$nextTick(() => window.scrollTo({ top: _scrollY, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' }));
          }
        } else {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: data.message || 'Error recording payment', type: 'error' } }));
        }
      } catch (error) {
        console.error('Error recording payment:', error);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Error recording payment', type: 'error' } }));
      } finally {
        if (isRow) { this.processingPaymentId = null; }
        else { this.isProcessingPaymentGlobal = false; }
      }
    },
    async markAsUnpaid(contribution) {
      // Either a row from the table or — when no row is passed — the currently
      // selected student. Mirrors markAsPayment's signature.
      if (!this.selectedStudent && !contribution) return;

      if (!this.activePayment?._id) {
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'No active payment event found.', type: 'warning' } }));
        return;
      }

      const isRow = !!contribution;
      const processingId = isRow ? (contribution._id || contribution.student_id_number) : 'global';
      try {
        if (isRow) { this.processingPaymentId = processingId; }
        else { this.isProcessingPaymentGlobal = true; }

        const token = localStorage.getItem('authToken');
        const studentIdInput = isRow
          ? (contribution.student_id_number || contribution.student_id)
          : this.selectedStudent.student_id;
        const paymentId = this.activePayment._id;

        const response = await fetch(buildAPIUrl(`/apis/payments/${paymentId}/mark-unpaid`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-SSAAM-College': getCollege()
          },
          body: JSON.stringify({ student_id_input: studentIdInput })
        });

        const data = await response.json();
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Marked as unpaid', type: 'success' } }));
          if (!isRow) {
            this.discountValue = 0;
          }
          // Preserve scroll position so the page doesn't jump while the list refreshes.
          const _scrollY = (typeof window !== 'undefined') ? window.scrollY : 0;
          // Same auto-refresh pulse used by record-payment so the Paid-On
          // panel stays in sync after any payment status change.
          await this.refreshPaidOn();
          if (typeof window !== 'undefined') {
            this.$nextTick(() => window.scrollTo({ top: _scrollY, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' }));
          }
        } else {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: data.message || 'Error marking as unpaid', type: 'error' } }));
        }
      } catch (error) {
        console.error('Error marking as unpaid:', error);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Error marking as unpaid', type: 'error' } }));
      } finally {
        if (isRow) { this.processingPaymentId = null; }
        else { this.isProcessingPaymentGlobal = false; }
      }
    },
    async downloadPaymentExcel() {
      try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams();
        params.set('limit', String(this.downloadPreviewLimit));
        if (this.filterStatus) params.set('status', this.filterStatus);
        if (this.filterYearLevel) params.set('year_level', this.filterYearLevel);
        if (this.filterProgram) params.set('program', this.filterProgram);
        if (this.searchQuery) params.set('query', this.searchQuery);

        const response = await fetch(buildAPIUrl(`/apis/contributions/search?${params.toString()}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Failed to fetch export preview', type: 'error' } }));
          return;
        }
        const data = await response.json();
        this.downloadPreviewRecords = data.data || [];
        this.serverFilteredCount = data.pagination ? data.pagination.total : (data.data || []).length;
        if (!this.serverFilteredCount || this.serverFilteredCount === 0) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'No records match the selected filters', type: 'warning' } }));
          return;
        }
        this.showDownloadConfirm = true;
      } catch (err) {
        console.error('Error fetching download preview:', err);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Failed to fetch export preview', type: 'error' } }));
      }
    },
    async confirmAndExportFilteredExcel() {
      if (this.isDownloading) return;
      this.isDownloading = true;
      try {
        const params = new URLSearchParams();
        if (this.filterStatus) params.set('status', this.filterStatus);
        if (this.filterYearLevel) params.set('year_level', this.filterYearLevel);
        if (this.filterProgram) params.set('program', this.filterProgram);

        const filtersSafe = `${this.downloadFiltersSummary.status}_${this.downloadFiltersSummary.year}_${this.downloadFiltersSummary.program}`.replace(/\s+/g, '');
        const dateSuffix = new Date().toISOString().split('T')[0];
        const token = localStorage.getItem('authToken');
        const url = buildAPIUrl(`/apis/contributions/download/excel?${params.toString()}`);
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

        if (!response.ok) throw new Error('Server export failed');

        const contentType = response.headers.get('content-type') || '';
        if (this.downloadFormat === 'csv' || contentType.includes('text/csv')) {
          const blob = await response.blob();
          const a = document.createElement('a');
          const urlObj = URL.createObjectURL(blob);
          a.href = urlObj; a.download = `Payments_${filtersSafe}_${dateSuffix}.csv`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Exported ${this.serverFilteredCount || this.filteredCount} record(s) (CSV)`, type: 'success' } }));
        } else {
          const csvText = await response.text();
          const workbook = XLSX.read(csvText, { type: 'string' });
          XLSX.writeFile(workbook, `Payments_${filtersSafe}_${dateSuffix}.xlsx`);
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Exported ${this.serverFilteredCount || this.filteredCount} record(s)`, type: 'success' } }));
        }
        this.showDownloadConfirm = false;
      } catch (error) {
        console.error('Error exporting payments:', error);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Failed to export payment records', type: 'error' } }));
      } finally {
        this.isDownloading = false;
      }
    }
  }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
