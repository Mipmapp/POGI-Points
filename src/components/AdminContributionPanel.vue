<template>
  <div class="space-y-6">
    <!-- Banner Header -->
    <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="relative h-32 sm:h-36 bg-gradient-to-br from-ssaam-dark via-blue-700 to-ssaam-light overflow-hidden">
        <div class="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-400/20 blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div class="light-sweep"></div>
        <div class="absolute inset-0 flex items-center px-4 sm:px-6 md:px-8 gap-3 sm:gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div class="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-gray-100 space-y-3">
        <!-- Row 1: label + matched count -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="w-1 h-5 rounded-full bg-blue-600"></div>
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Filters &amp; Search</h3>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1 text-xs font-bold text-blue-700">
            {{ serverFilteredCount !== null ? serverFilteredCount : filteredCount }} matched
          </div>
        </div>

        <!-- Mobile: 4-column compact icon+label buttons -->
        <div class="grid grid-cols-4 gap-2 sm:hidden">
          <button
            @click="showCreateEventModal = true"
            class="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-gradient-to-b from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 active:scale-95 transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="text-[11px] font-bold leading-tight">Create Event</span>
          </button>
          <button
            @click="downloadPaymentExcel"
            :disabled="isDownloading"
            class="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-gradient-to-b from-green-600 to-green-700 text-white shadow-md shadow-green-200/70 active:scale-95 transition-all disabled:opacity-60"
          >
            <svg v-if="isDownloading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span class="text-[11px] font-bold leading-tight">{{ isDownloading ? 'Loading…' : 'Export Excel' }}</span>
          </button>
          <button
            @click="openReportConfig"
            :disabled="isGeneratingReport || paymentEvents.length === 0"
            class="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-gradient-to-b from-violet-600 to-purple-700 text-white shadow-md shadow-purple-200/70 active:scale-95 transition-all disabled:opacity-60"
          >
            <svg v-if="isGeneratingReport" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span class="text-[11px] font-bold leading-tight">{{ isGeneratingReport ? 'Loading…' : 'Gen. Report' }}</span>
          </button>
          <button
            @click="showExportHistory = true"
            class="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-gradient-to-b from-slate-600 to-slate-800 text-white shadow-md shadow-slate-200/70 active:scale-95 transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span class="text-[11px] font-bold leading-tight">History</span>
          </button>
        </div>

        <!-- Desktop: original flex row buttons -->
        <div class="hidden sm:flex items-center gap-2 flex-wrap">
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
          <button
            @click="openReportConfig"
            :disabled="isGeneratingReport || paymentEvents.length === 0"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl hover:from-violet-700 hover:to-purple-800 transition-all font-semibold text-sm disabled:opacity-60 shadow-md shadow-purple-200 active:scale-95"
          >
            <svg v-if="isGeneratingReport" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            {{ isGeneratingReport ? 'Generating...' : 'Generate Report' }}
          </button>
          <button
            @click="showExportHistory = true"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl hover:from-slate-700 hover:to-slate-900 transition-all font-semibold text-sm shadow-md shadow-slate-200 active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Export History
          </button>
        </div>
      </div>

      <!-- Event Selector — Carousel -->
      <div class="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-100">
        <!-- Header row -->
        <div class="flex items-center gap-2 mb-3 sm:mb-4">
          <div class="w-1 h-5 rounded-full bg-purple-500"></div>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Select Event</h3>
          <span v-if="activePayment" class="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full max-w-[140px] sm:max-w-none truncate">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse flex-shrink-0"></span>
            <span class="truncate">{{ activePayment.title }}</span>
          </span>
          <span v-else-if="!isLoadingEvents && paymentEvents.length > 0" class="ml-auto text-xs text-gray-400 font-medium">No event selected</span>
        </div>

        <!-- Search bar — shown when events exist -->
        <div v-if="!isLoadingEvents && paymentEvents.length > 0" class="mb-4">
          <div class="relative group">
            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
              :class="eventSearchQuery ? 'text-purple-500' : 'text-gray-400 group-focus-within:text-purple-500'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
            </div>
            <input
              v-model="eventSearchQuery"
              type="text"
              placeholder="Search events by name or type…"
              class="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
            />
            <button
              v-if="eventSearchQuery"
              @click="eventSearchQuery = ''; carouselIndex = 0"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-all duration-150 active:scale-90"
            >
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <!-- Search results badge -->
          <Transition name="carousel-slide">
            <div v-if="eventSearchQuery" class="mt-2 flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 text-[11px] text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
                {{ displayedEvents.length }} of {{ paymentEvents.length }} event{{ paymentEvents.length === 1 ? '' : 's' }} found
              </span>
            </div>
          </Transition>
        </div>

        <!-- Loading -->
        <div v-if="isLoadingEvents" class="flex flex-col items-center gap-3 py-4">
          <div class="w-full max-w-sm h-52 rounded-3xl bg-gray-100 animate-pulse"></div>
          <div class="flex gap-1.5">
            <div v-for="i in 3" :key="i" class="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse"></div>
          </div>
        </div>

        <!-- No Events -->
        <div v-else-if="paymentEvents.length === 0" class="flex items-center gap-3 bg-gray-50 border border-dashed border-gray-300 rounded-2xl px-4 py-3">
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <p class="text-sm text-gray-500">No events created yet. Click <strong>Create Event</strong> to get started.</p>
        </div>

        <!-- No Search Results -->
        <div v-else-if="displayedEvents.length === 0" class="flex flex-col items-center gap-3 py-8 text-center">
          <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
          </div>
          <div>
            <p class="text-sm font-bold text-gray-700 mb-1">No events found</p>
            <p class="text-xs text-gray-400">No match for "<span class="font-semibold text-gray-600">{{ eventSearchQuery }}</span>"</p>
          </div>
          <button @click="eventSearchQuery = ''; carouselIndex = 0" class="text-xs font-bold text-purple-600 hover:text-purple-800 underline underline-offset-2 transition">Clear search</button>
        </div>

        <!-- Carousel — 3 cards visible -->
        <div v-else class="flex flex-col items-center gap-3">

          <!-- Viewport: overflow-hidden clips side cards cleanly, no fades needed -->
          <div
            class="relative w-full overflow-hidden rounded-3xl"
            style="min-height: 310px;"
            @touchstart.passive="handleSwipeStart"
            @touchend.passive="handleSwipeEnd"
          >

            <!-- Left arrow — desktop only, floats over carousel sides -->
            <button
              @click="prevCarousel"
              :disabled="displayedEvents.length <= 1"
              class="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:shadow-purple-100 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>

            <!-- Right arrow — desktop only -->
            <button
              @click="nextCarousel"
              :disabled="displayedEvents.length <= 1"
              class="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:shadow-purple-100 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>

            <!-- All event cards — fixed-width, centered via left:50%, offset by pixels -->
            <div
              v-for="(event, idx) in displayedEvents"
              :key="event._id"
              class="transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              :style="getCarouselCardStyle(idx)"
              @click="() => { if (idx !== carouselIndex) carouselIndex = idx }"
            >
              <!-- Inner card -->
              <div
                :class="['rounded-3xl overflow-hidden border-2 shadow-xl transition-shadow duration-450',
                  activePayment && activePayment._id === event._id
                    ? 'border-purple-400 shadow-purple-200'
                    : 'border-gray-200 shadow-gray-100']"
              >
                <!-- Gradient header -->
                <div :class="['relative px-5 pt-5 pb-4 overflow-hidden',
                  event.type === 'fee'        ? 'bg-gradient-to-br from-blue-600 to-indigo-700'   :
                  event.type === 'membership' ? 'bg-gradient-to-br from-green-600 to-teal-700'    :
                  event.type === 'donation'   ? 'bg-gradient-to-br from-orange-500 to-amber-600'  :
                                                'bg-gradient-to-br from-purple-600 to-violet-700']">
                  <!-- Decorative blobs -->
                  <div class="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                  <div class="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                  <div class="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-black/10 blur-2xl pointer-events-none"></div>

                  <!-- Active badge -->
                  <div v-if="activePayment && activePayment._id === event._id"
                    class="absolute top-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur border border-white/30 rounded-full px-2.5 py-1 z-10">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    <span class="text-white text-[10px] font-bold tracking-widest uppercase">Active</span>
                  </div>

                  <!-- Top-left: Type badge always, then edit/delete only on center card -->
                  <div class="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <!-- Type badge — pill shape, distinct from icon buttons -->
                    <span :class="['inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-sm shadow-sm',
                      event.type === 'fee'        ? 'bg-blue-500/40 border-blue-300/60 text-white'       :
                      event.type === 'membership' ? 'bg-green-500/40 border-green-300/60 text-white'     :
                      event.type === 'donation'   ? 'bg-amber-500/40 border-amber-300/60 text-white'     :
                                                    'bg-violet-500/40 border-violet-300/60 text-white']">
                      {{ event.type || 'event' }}
                    </span>
                    <!-- Divider + edit/delete only on center card -->
                    <template v-if="idx === carouselIndex">
                      <div class="w-px h-4 bg-white/30 rounded-full"></div>
                      <button @click.stop="openEditEvent(event)"
                        class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all" title="Edit">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 15.414 9 16l.586-3z"/></svg>
                      </button>
                      <button @click.stop="confirmDeleteEvent(event)"
                        class="w-7 h-7 rounded-full bg-white/20 hover:bg-red-500/70 text-white flex items-center justify-center transition-all" title="Delete">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </template>
                  </div>

                  <!-- Amount only (type chip moved to top-left) -->
                  <div class="mt-6 flex items-center justify-end relative z-10">
                    <span class="text-xl font-extrabold text-white drop-shadow tracking-tight">₱{{ Number(event.amount_due || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <!-- Title -->
                  <h4 class="text-white font-extrabold text-[1.05rem] mt-1 leading-snug relative z-10 pr-2 line-clamp-2">{{ event.title }}</h4>
                </div>

                <!-- Card body -->
                <div class="bg-white px-4 py-3 space-y-2.5">
                  <p v-if="event.description" class="text-xs text-gray-500 leading-relaxed line-clamp-2">{{ event.description }}</p>

                  <!-- Collected + Deadline -->
                  <div class="flex items-center gap-2 flex-wrap">
                    <div class="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex-1 min-w-0">
                      <svg class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
                      <span class="text-xs font-bold text-emerald-700 truncate">₱{{ Number(collectedByEvent[event._id] || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} collected</span>
                    </div>
                    <div v-if="event.deadline" class="flex items-center gap-1 text-[10px] text-gray-400 font-medium flex-shrink-0">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      Due {{ new Date(event.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) }}
                    </div>
                  </div>

                  <!-- Target badges -->
                  <div class="flex flex-wrap gap-1 min-h-[18px]">
                    <template v-if="(event.target_year_levels && event.target_year_levels.length > 0) || (event.target_programs && event.target_programs.length > 0)">
                      <span v-for="yl in (event.target_year_levels || [])" :key="'yl-'+yl" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">{{ yl }}</span>
                      <span v-for="prog in (event.target_programs || [])" :key="'prog-'+prog" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">{{ prog }}</span>
                    </template>
                    <span v-else class="text-[11px] text-gray-400 italic">All students</span>
                  </div>

                  <!-- Add-ons badge -->
                  <div v-if="event.addons && event.addons.length > 0" class="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                    <svg class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                    <span class="text-[11px] font-bold text-amber-700">{{ event.addons.length }} add-on{{ event.addons.length === 1 ? '' : 's' }} available</span>
                  </div>

                  <!-- Select button — only on center card -->
                  <button
                    v-if="idx === carouselIndex"
                    @click.stop="selectEvent(event)"
                    :disabled="!!(activePayment && activePayment._id === event._id)"
                    :class="['w-full py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-[0.97]',
                      activePayment && activePayment._id === event._id
                        ? 'bg-purple-50 text-purple-600 border-2 border-purple-200 cursor-default'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-200']"
                  >
                    <span v-if="activePayment && activePayment._id === event._id" class="flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      Currently Selected
                    </span>
                    <span v-else>Select This Event</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile prev/next row — shown only on small screens, sits below the card -->
          <div class="flex sm:hidden items-center justify-between w-full px-2 -mt-1">
            <button
              @click="prevCarousel"
              :disabled="displayedEvents.length <= 1"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow text-gray-500 text-xs font-semibold hover:text-purple-600 hover:border-purple-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
              Prev
            </button>
            <span class="text-xs text-gray-400 font-medium">{{ carouselIndex + 1 }} / {{ displayedEvents.length }}</span>
            <button
              @click="nextCarousel"
              :disabled="displayedEvents.length <= 1"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow text-gray-500 text-xs font-semibold hover:text-purple-600 hover:border-purple-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              Next
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <!-- Dot indicators -->
          <div class="flex items-center gap-1.5 mt-1 flex-wrap justify-center max-w-xs mx-auto">
            <button
              v-for="(event, idx) in displayedEvents"
              :key="event._id"
              @click="carouselIndex = idx"
              :class="['rounded-full transition-all duration-300', idx === carouselIndex ? 'w-7 h-2.5 bg-purple-500' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-purple-300']"
            ></button>
          </div>
          <p class="text-xs text-gray-400 font-medium">{{ carouselIndex + 1 }} of {{ displayedEvents.length }} event{{ displayedEvents.length === 1 ? '' : 's' }}</p>
        </div>
      </div>

      <!-- ── No-event placeholder ──────────────────────────────────────────
           Shown when events exist but none is selected yet. Fades out the
           moment the admin clicks a card above.                            -->
      <Transition name="contrib-reveal">
        <div v-if="!activePayment && !isLoadingEvents && paymentEvents.length > 0"
          class="px-4 sm:px-6 md:px-8 py-14 sm:py-20 flex flex-col items-center justify-center text-center gap-6 border-t border-gray-100">
          <!-- Animated icon -->
          <div class="relative flex items-center justify-center">
            <div class="absolute w-32 h-32 rounded-full bg-purple-100/60 animate-ping" style="animation-duration:2.4s"></div>
            <div class="absolute w-24 h-24 rounded-full bg-indigo-100/70 animate-pulse" style="animation-duration:1.8s"></div>
            <div class="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-xl shadow-purple-200">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          </div>
          <!-- Message -->
          <div>
            <h3 class="text-xl sm:text-2xl font-extrabold text-gray-800 mb-2 tracking-tight">Select an Event to Get Started</h3>
            <p class="text-sm text-gray-500 max-w-xs sm:max-w-sm leading-relaxed mx-auto">
              Choose an event from the cards above to view its statistics, manage payments, and track contributions.
            </p>
          </div>
          <!-- Available count pill -->
          <div class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl shadow-sm">
            <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse flex-shrink-0"></span>
            <span class="text-sm font-bold text-purple-700">
              {{ paymentEvents.length }} event{{ paymentEvents.length === 1 ? '' : 's' }} available — tap one above
            </span>
          </div>
          <!-- Animated arrow pointing up toward the event cards -->
          <div class="flex flex-col items-center gap-1 text-gray-300 -mt-2 animate-bounce" style="animation-duration:1.6s">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
            </svg>
            <svg class="w-5 h-5 -mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
            </svg>
          </div>
        </div>
      </Transition>

      <!-- Statistics Panel -->
      <Transition name="contrib-reveal">
      <div v-if="activePayment" class="px-4 sm:px-6 md:px-8 py-4 border-b border-gray-100">
        <button @click="showStatsPanel = !showStatsPanel" class="w-full flex items-start gap-2 mb-3 group text-left">
          <div class="w-1 h-5 rounded-full bg-teal-500 flex-shrink-0 mt-0.5"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Statistics</h3>
              <svg :class="['ml-auto w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0', showStatsPanel ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap mt-1.5">
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
          </div>
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
      </Transition>

      <!-- Search & Filters -->
      <div v-if="activePayment" class="px-4 sm:px-6 md:px-8 py-5 space-y-4">
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
        <Transition name="paid-on-slide">
        <div v-if="!selectedStudent" class="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-white p-3 sm:p-4 shadow-sm">
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
          <div class="mt-3 -mx-1 px-1 flex items-stretch gap-2 overflow-x-auto pb-1 scrollbar-gray">
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
        </Transition>

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
    <Transition name="contrib-slide">
    <div v-if="activePayment && selectedStudent" class="bg-white rounded-3xl shadow-xl border border-blue-200 overflow-hidden">
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

        <!-- Add-ons Picker (shown only when the event has add-ons) -->
        <div v-if="activePayment && activePayment.addons && activePayment.addons.length > 0" class="p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <p class="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Add-ons
          </p>
          <div class="space-y-2">
            <div v-for="addon in activePayment.addons" :key="String(addon._id)" class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 truncate">{{ addon.name }}</p>
                <p class="text-[10px] text-gray-400 truncate">₱{{ Number(addon.price || 0).toFixed(2) }} / {{ addon.unit || 'piece' }}
                  <span v-if="addon.max_qty"> · max {{ addon.max_qty }}</span>
                </p>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <button
                  @click="setAddonQty(addon._id, (addonCart[String(addon._id)] || 0) - 1)"
                  class="w-7 h-7 rounded-lg bg-white border border-amber-300 text-amber-700 font-bold text-lg flex items-center justify-center hover:bg-amber-100 transition disabled:opacity-40"
                  :disabled="!(addonCart[String(addon._id)] > 0)"
                >–</button>
                <input
                  :value="addonCart[String(addon._id)] || 0"
                  @change="setAddonQty(addon._id, $event.target.value)"
                  type="number" min="0" :max="addon.max_qty || 9999"
                  class="w-12 text-center text-sm font-bold border border-amber-300 rounded-lg px-1 py-1 bg-white outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  @click="setAddonQty(addon._id, (addonCart[String(addon._id)] || 0) + 1)"
                  class="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-lg flex items-center justify-center hover:bg-amber-600 transition disabled:opacity-40"
                  :disabled="addon.max_qty && (addonCart[String(addon._id)] || 0) >= addon.max_qty"
                >+</button>
              </div>
              <span class="text-sm font-bold text-amber-700 w-20 text-right flex-shrink-0">
                <template v-if="(addonCart[String(addon._id)] || 0) > 0">₱{{ ((addonCart[String(addon._id)] || 0) * Number(addon.price || 0)).toFixed(2) }}</template>
                <template v-else class="text-gray-400">—</template>
              </span>
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
            <div v-if="addonCartTotal > 0" class="flex justify-between items-center text-amber-700">
              <span>Add-ons</span>
              <span class="font-bold">+₱{{ addonCartTotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-blue-200">
              <span class="font-bold text-blue-900">{{ addonCartTotal > 0 ? 'Grand Total' : 'Target Payment' }}</span>
              <span class="font-extrabold text-blue-700 text-lg">₱{{ grandTotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Loading skeleton while payment status is being fetched from server -->
        <div v-if="isLoadingPaymentStatus" class="space-y-3 animate-pulse">
          <div class="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
            <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-gray-200 rounded-full w-1/3"></div>
              <div class="h-2.5 bg-gray-200 rounded-full w-2/3"></div>
            </div>
            <svg class="w-5 h-5 animate-spin text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          </div>
          <div class="w-full py-3 px-4 bg-gray-200 rounded-2xl h-12"></div>
        </div>

        <!-- Already Paid State (Mark as Unpaid) -->
        <div v-else-if="selectedStudentAlreadyPaid" class="space-y-3">
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
            @click="confirmMarkUnpaid()"
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
    </Transition>

    <!-- Loyverse POS Panel (visible only when a student is selected) -->
    <LoyversePOSPanel
      v-if="activePayment && selectedStudent"
      :student="selectedStudent"
      :suggested-amount="targetPayment"
      :active-payment="activePayment"
      @printed="onReceiptPrinted"
    />

    <!-- Contributions List — hidden while a student is selected so the
         admin can focus on the payment card + POS panel without the table
         distracting underneath. -->
    <Transition name="contrib-slide">
    <div v-if="activePayment && !selectedStudent" class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="px-5 sm:px-6 md:px-8 py-4 border-b border-gray-100 space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-1 h-5 rounded-full bg-blue-600"></div>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Payment Records</h3>
          <span class="ml-auto text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">{{ filteredContributions.length }}</span>
        </div>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            v-model="paymentRecordsQuery"
            type="text"
            placeholder="Filter by name or student ID…"
            class="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
          />
          <button
            v-if="paymentRecordsQuery"
            @click="paymentRecordsQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition active:scale-90"
          >
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Top Pagination Controls -->
      <div v-if="!isLoading && filteredContributions.length > 0" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 md:px-8 py-3 border-b border-gray-100">
        <div class="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
          Showing {{ (paymentsPage - 1) * paymentsPerPage + 1 }}–{{ Math.min(paymentsPage * paymentsPerPage, filteredContributions.length) }} of {{ filteredContributions.length }} records
        </div>
        <div class="flex items-center justify-center gap-1.5">
          <button
            @click="paymentsPage = Math.max(1, paymentsPage - 1)"
            :disabled="paymentsPage === 1"
            class="h-9 px-2 sm:px-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            <span class="hidden sm:inline">Previous</span>
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
            class="h-9 px-2 sm:px-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span class="hidden sm:inline">Next</span>
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- Loading Skeleton (mobile cards only — desktop uses in-table skeleton rows below) -->
      <div v-if="isLoading" class="p-4 space-y-3 md:hidden">
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
              @click="confirmMarkUnpaid(c)"
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
            <!-- Desktop loading skeleton rows (thead/blue bar stays visible above these) -->
            <template v-if="isLoading">
              <tr v-for="i in 8" :key="'skel-' + i" class="animate-pulse">
                <td class="px-3 py-3"><div class="h-3 bg-gray-200 rounded-full w-24"></div></td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div class="h-3 bg-gray-200 rounded-full w-32"></div>
                  </div>
                </td>
                <td v-if="isMaster" class="px-3 py-3"><div class="h-3 bg-gray-200 rounded-full w-12"></div></td>
                <td class="px-3 py-3"><div class="h-3 bg-gray-200 rounded-full w-16"></div></td>
                <td class="hidden lg:table-cell px-3 py-3"><div class="h-3 bg-gray-200 rounded-full w-8"></div></td>
                <td class="hidden xl:table-cell px-3 py-3"><div class="h-3 bg-gray-200 rounded-full w-14 ml-auto"></div></td>
                <td class="px-3 py-3"><div class="h-3 bg-gray-200 rounded-full w-14 ml-auto"></div></td>
                <td class="px-3 py-3"><div class="h-5 bg-gray-100 rounded-full w-14 mx-auto"></div></td>
                <td class="hidden lg:table-cell px-3 py-3"><div class="h-3 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                <td class="px-3 py-3"><div class="h-6 bg-gray-100 rounded-lg w-20 mx-auto"></div></td>
              </tr>
            </template>
            <tr v-else-if="filteredContributions.length === 0">
              <td :colspan="desktopColspan" class="px-4 py-12 text-center text-gray-400 text-sm">
                No records match the current filters.
              </td>
            </tr>
            <tr v-else v-for="(c, idx) in paginatedContributions" :key="c._id"
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
                    @click="confirmMarkUnpaid(c)"
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
      <div v-if="!isLoading && filteredContributions.length > 0" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 md:px-8 py-3 border-t border-gray-100">
        <div class="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
          Showing {{ (paymentsPage - 1) * paymentsPerPage + 1 }}–{{ Math.min(paymentsPage * paymentsPerPage, filteredContributions.length) }} of {{ filteredContributions.length }} records
        </div>
        <div class="flex items-center justify-center gap-1.5">
          <button
            @click="paymentsPage = Math.max(1, paymentsPage - 1)"
            :disabled="paymentsPage === 1"
            class="h-9 px-2 sm:px-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            <span class="hidden sm:inline">Previous</span>
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
            class="h-9 px-2 sm:px-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span class="hidden sm:inline">Next</span>
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
    </Transition>

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
            <p class="text-sm font-bold text-gray-800 mb-3">{{ eventToDelete?.title }}</p>

            <!-- Record count summary -->
            <div class="mb-3 rounded-xl border overflow-hidden text-sm"
              :class="deleteEventRecordCount > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'">
              <div v-if="isLoadingDeleteCount" class="flex items-center justify-center gap-2 py-3 text-gray-400">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span class="text-xs">Checking linked records…</span>
              </div>
              <div v-else-if="deleteEventRecordCount !== null" class="px-4 py-3">
                <div v-if="deleteEventRecordCount === 0" class="text-gray-500 text-xs font-medium">No student payment records are linked to this event.</div>
                <div v-else>
                  <p class="font-bold text-red-700 text-xs uppercase tracking-wide mb-2">Linked student records that will be deleted:</p>
                  <div class="flex justify-around">
                    <div class="text-center">
                      <p class="text-2xl font-extrabold text-red-600">{{ deleteEventRecordCount }}</p>
                      <p class="text-xs text-gray-500 mt-0.5">Total records</p>
                    </div>
                    <div class="w-px bg-red-200"></div>
                    <div class="text-center">
                      <p class="text-2xl font-extrabold text-green-600">{{ deleteEventPaidCount }}</p>
                      <p class="text-xs text-gray-500 mt-0.5">Already paid</p>
                    </div>
                    <div class="w-px bg-red-200"></div>
                    <div class="text-center">
                      <p class="text-2xl font-extrabold text-orange-500">{{ deleteEventRecordCount - deleteEventPaidCount }}</p>
                      <p class="text-xs text-gray-500 mt-0.5">Unpaid</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-xs text-red-500 font-medium mb-2">This cannot be undone.</p>
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

    <!-- Mark as Unpaid Confirmation Modal -->
    <Teleport to="body">
    <transition name="fade">
      <div v-if="showUnpaidConfirm" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancelMarkUnpaid"></div>
        <div class="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div class="p-6 text-center">
            <div class="relative w-16 h-16 mx-auto mb-4">
              <svg class="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#fee2e2" stroke-width="4"/>
                <circle cx="28" cy="28" r="24" fill="none" stroke="#ef4444" stroke-width="4"
                  stroke-dasharray="150.8"
                  :stroke-dashoffset="unpaidConfirmCooldown > 0 ? (150.8 * unpaidConfirmCooldown / 3) : 0"
                  class="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <svg v-if="unpaidConfirmCooldown === 0" class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                <span v-else class="text-xl font-extrabold text-red-600">{{ unpaidConfirmCooldown }}</span>
              </div>
            </div>

            <h3 class="text-lg font-extrabold text-gray-900 mb-1">Reverse Payment?</h3>
            <p class="text-sm text-gray-500 mb-1">You are about to mark as <span class="font-bold text-red-600">UNPAID</span>:</p>
            <p class="text-sm font-bold text-gray-800 mb-1">
              {{ unpaidConfirmContribution ? (unpaidConfirmContribution.student_name || unpaidConfirmContribution.student_id) : (selectedStudent ? (selectedStudent.full_name || selectedStudent.first_name) : '') }}
            </p>
            <p class="text-xs text-gray-400 mb-4">{{ activePayment ? activePayment.title : '' }}</p>

            <p v-if="unpaidConfirmCooldown > 0" class="text-xs text-gray-400 mb-4 font-medium">Please wait {{ unpaidConfirmCooldown }}s before confirming...</p>
            <p v-else class="text-xs text-orange-600 font-semibold mb-4">You may now confirm this reversal.</p>

            <div class="flex gap-3">
              <button @click="cancelMarkUnpaid" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
                Cancel
              </button>
              <button
                @click="markAsUnpaid(unpaidConfirmContribution)"
                :disabled="unpaidConfirmCooldown > 0"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2',
                  unpaidConfirmCooldown > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                ]"
              >
                <span v-if="unpaidConfirmCooldown > 0">Wait ({{ unpaidConfirmCooldown }}s)</span>
                <span v-else>Confirm Unpaid</span>
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

            <!-- Add-ons Section -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Add-ons <span class="text-gray-400 font-normal">(optional)</span></label>
                <button type="button" @click="addAddonRow(newEventForm)"
                  class="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-700 text-[11px] font-bold transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  Add Item
                </button>
              </div>
              <div v-if="newEventForm.addons.length === 0" class="text-[11px] text-gray-400 italic px-1">No add-ons yet. Add tickets, T-shirts, meals, etc.</div>
              <div v-else class="space-y-2">
                <div v-for="(addon, idx) in newEventForm.addons" :key="idx" class="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div class="flex gap-2">
                    <input v-model="addon.name" type="text" placeholder="Item name *" class="flex-1 px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none" />
                    <div class="relative w-28">
                      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₱</span>
                      <input v-model.number="addon.price" type="number" min="0" step="0.01" placeholder="0.00" class="w-full pl-6 pr-2 py-2 border border-amber-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none" />
                    </div>
                    <button @click="removeAddonRow(newEventForm, idx)" class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div class="flex gap-2">
                    <input v-model="addon.description" type="text" placeholder="Description (optional)" class="flex-1 px-3 py-1.5 border border-amber-200 rounded-xl text-xs bg-white/80 focus:ring-1 focus:ring-amber-300 focus:border-amber-400 outline-none" />
                    <select v-model="addon.unit" class="w-24 px-2 py-1.5 border border-amber-200 rounded-xl text-xs bg-white/80 focus:ring-1 focus:ring-amber-300 focus:border-amber-400 outline-none">
                      <option value="piece">piece</option>
                      <option value="ticket">ticket</option>
                      <option value="shirt">shirt</option>
                      <option value="plate">plate</option>
                      <option value="set">set</option>
                      <option value="slot">slot</option>
                    </select>
                    <div class="relative w-20">
                      <input v-model.number="addon.max_qty" type="number" min="1" placeholder="Max" class="w-full px-2 py-1.5 border border-amber-200 rounded-xl text-xs bg-white/80 focus:ring-1 focus:ring-amber-300 focus:border-amber-400 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
              <p v-if="newEventForm.addons.length > 0" class="text-[10px] text-gray-400 mt-1 px-1">Max qty: blank = unlimited per student</p>
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

            <!-- Add-ons Section -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Add-ons <span class="text-gray-400 font-normal">(optional)</span></label>
                <button type="button" @click="addAddonRow(editEventForm)"
                  class="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-700 text-[11px] font-bold transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  Add Item
                </button>
              </div>
              <div v-if="editEventForm.addons.length === 0" class="text-[11px] text-gray-400 italic px-1">No add-ons yet. Add tickets, T-shirts, meals, etc.</div>
              <div v-else class="space-y-2">
                <div v-for="(addon, idx) in editEventForm.addons" :key="addon._id || idx" class="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div class="flex gap-2">
                    <input v-model="addon.name" type="text" placeholder="Item name *" class="flex-1 px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none" />
                    <div class="relative w-28">
                      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₱</span>
                      <input v-model.number="addon.price" type="number" min="0" step="0.01" placeholder="0.00" class="w-full pl-6 pr-2 py-2 border border-amber-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none" />
                    </div>
                    <button @click="removeAddonRow(editEventForm, idx)" class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div class="flex gap-2">
                    <input v-model="addon.description" type="text" placeholder="Description (optional)" class="flex-1 px-3 py-1.5 border border-amber-200 rounded-xl text-xs bg-white/80 focus:ring-1 focus:ring-amber-300 focus:border-amber-400 outline-none" />
                    <select v-model="addon.unit" class="w-24 px-2 py-1.5 border border-amber-200 rounded-xl text-xs bg-white/80 focus:ring-1 focus:ring-amber-300 focus:border-amber-400 outline-none">
                      <option value="piece">piece</option>
                      <option value="ticket">ticket</option>
                      <option value="shirt">shirt</option>
                      <option value="plate">plate</option>
                      <option value="set">set</option>
                      <option value="slot">slot</option>
                    </select>
                    <div class="relative w-20">
                      <input v-model.number="addon.max_qty" type="number" min="1" placeholder="Max" class="w-full px-2 py-1.5 border border-amber-200 rounded-xl text-xs bg-white/80 focus:ring-1 focus:ring-amber-300 focus:border-amber-400 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
              <p v-if="editEventForm.addons.length > 0" class="text-[10px] text-gray-400 mt-1 px-1">Max qty: blank = unlimited per student</p>
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

    <!-- Export History Modal -->
    <Teleport to="body">
    <transition name="fade">
      <div v-if="showExportHistory" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showExportHistory = false"></div>
        <div class="relative z-10 w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <!-- Header -->
          <div class="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-white">Export History</h3>
                <p class="text-white/60 text-xs mt-0.5">Who downloaded payment data and when</p>
              </div>
            </div>
            <button @click="showExportHistory = false" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <!-- Body -->
          <div class="overflow-y-auto flex-1">
            <!-- Loading skeleton -->
            <div v-if="isLoadingExportHistory" class="p-5 space-y-4">
              <div v-for="i in 4" :key="i" class="flex items-start gap-3 animate-pulse">
                <div class="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 mt-0.5"></div>
                <div class="flex-1 space-y-2 pt-1">
                  <div class="h-3 bg-gray-200 rounded-full w-1/3"></div>
                  <div class="h-2.5 bg-gray-200 rounded-full w-2/3"></div>
                  <div class="h-2.5 bg-gray-200 rounded-full w-1/2"></div>
                </div>
              </div>
            </div>
            <!-- Empty state -->
            <div v-else-if="exportHistory.length === 0" class="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p class="text-sm font-bold text-gray-400">No exports yet</p>
              <p class="text-xs text-gray-400 mt-1">History will appear here after the first download.</p>
            </div>
            <!-- Log entries -->
            <div v-else class="divide-y divide-gray-100">
              <div v-for="log in exportHistory" :key="log._id" class="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {{ (log.exported_by || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-bold text-gray-800 truncate">{{ log.exported_by || 'Admin' }}</p>
                    <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase', log.format === 'csv' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700']">
                      {{ log.format || 'xlsx' }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatRelativeTime(log.exported_at) }}</p>
                  <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span class="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      {{ log.record_count }} records
                    </span>
                    <span v-if="log.payment_title" class="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full truncate max-w-[120px]">{{ log.payment_title }}</span>
                    <span v-if="log.filters && log.filters.program" class="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ log.filters.program }}</span>
                    <span v-if="log.filters && log.filters.statuses && log.filters.statuses.length === 1"
                      :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full', log.filters.statuses[0] === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700']">
                      {{ log.filters.statuses[0] === 'paid' ? 'Paid only' : 'Unpaid only' }}
                    </span>
                    <span v-if="log.filters && log.filters.year_levels && log.filters.year_levels.length < 4 && log.filters.year_levels.length > 0"
                      class="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      {{ log.filters.year_levels.join(', ') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Footer -->
          <div class="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
            <p class="text-xs text-gray-400">Last {{ exportHistory.length }} export{{ exportHistory.length !== 1 ? 's' : '' }}</p>
            <button @click="showExportHistory = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-xs font-semibold text-gray-700 transition">Close</button>
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
        <div class="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          <!-- Export loading overlay — covers the modal while the file is being built -->
          <Transition name="fade">
            <div v-if="isDownloading" class="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 rounded-3xl">
              <div class="relative flex items-center justify-center">
                <svg class="w-16 h-16 animate-spin text-blue-200" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <div class="absolute w-8 h-8 rounded-full bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                </div>
              </div>
              <div class="text-center space-y-1.5 px-8">
                <p class="text-base font-extrabold text-gray-800">Preparing Export</p>
                <p class="text-sm text-gray-500 transition-all duration-500">{{ exportStepMessages[exportStep] }}</p>
              </div>
              <div class="flex gap-1.5">
                <span v-for="i in exportStepMessages.length" :key="i"
                  :class="['w-2 h-2 rounded-full transition-all duration-400', (i - 1) === exportStep ? 'bg-blue-600 scale-125' : 'bg-gray-200']">
                </span>
              </div>
            </div>
          </Transition>

          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 class="text-lg font-extrabold text-white">Export Payment Records</h3>
              <p class="text-white/70 text-sm mt-0.5">Choose what to include in the export</p>
            </div>
            <button @click="showDownloadConfirm = false" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="overflow-y-auto">
          <div class="p-5 sm:p-6 space-y-5">

            <!-- Year Level Checkboxes -->
            <div>
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Year Level</p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label v-for="yr in ['1st Year','2nd Year','3rd Year','4th Year']" :key="yr"
                  :class="[
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition select-none',
                    exportYears.includes(yr)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                  ]"
                >
                  <input type="checkbox" :value="yr" v-model="exportYears" class="accent-blue-600 w-4 h-4 shrink-0" />
                  <span class="text-sm font-semibold">{{ yr }}</span>
                </label>
              </div>
              <p v-if="exportYears.length === 0" class="text-xs text-red-500 mt-1.5 font-medium">Select at least one year level.</p>
            </div>

            <!-- Status Checkboxes -->
            <div>
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Payment Status</p>
              <div class="flex gap-3">
                <label :class="['flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition select-none flex-1', exportStatuses.includes('paid') ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300']">
                  <input type="checkbox" value="paid" v-model="exportStatuses" class="accent-green-600 w-4 h-4 shrink-0" />
                  <span class="text-sm font-semibold">Paid</span>
                  <span class="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">✓</span>
                </label>
                <label :class="['flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition select-none flex-1', exportStatuses.includes('unpaid') ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300']">
                  <input type="checkbox" value="unpaid" v-model="exportStatuses" class="accent-red-500 w-4 h-4 shrink-0" />
                  <span class="text-sm font-semibold">Unpaid</span>
                  <span class="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">✗</span>
                </label>
              </div>
              <p v-if="exportStatuses.length === 0" class="text-xs text-red-500 mt-1.5 font-medium">Select at least one status.</p>
            </div>

            <!-- Program + Format row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Program</p>
                <select v-model="exportProgram" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none transition">
                  <option value="">All Programs</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSIS">BSIS</option>
                </select>
              </div>
              <div>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">File Format</p>
                <div class="flex gap-3 mt-0.5">
                  <label :class="['inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition select-none', downloadFormat === 'xlsx' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300']">
                    <input type="radio" v-model="downloadFormat" value="xlsx" class="accent-blue-600" />
                    <span class="text-sm font-semibold text-gray-700">XLSX</span>
                    <span class="text-xs text-gray-400 hidden sm:inline">+Summary</span>
                  </label>
                  <label :class="['inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition select-none', downloadFormat === 'csv' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300']">
                    <input type="radio" v-model="downloadFormat" value="csv" class="accent-blue-600" />
                    <span class="text-sm font-semibold text-gray-700">CSV</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Preview Table -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Preview
                  <span v-if="!isLoadingExportPreview && serverFilteredCount !== null" class="ml-1 normal-case text-blue-600 font-semibold">({{ serverFilteredCount }} record{{ serverFilteredCount !== 1 ? 's' : '' }} total)</span>
                </p>
                <div v-if="isLoadingExportPreview" class="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  Refreshing...
                </div>
              </div>
              <div class="border border-gray-200 rounded-2xl overflow-hidden">
                <div class="overflow-x-auto max-h-40">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 sticky top-0">
                      <tr>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500">Name</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500">ID</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500 hidden sm:table-cell">Yr</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500">Status</th>
                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-500 hidden md:table-cell">Date Paid</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-if="isLoadingExportPreview && downloadPreviewRecords.length === 0">
                        <td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Loading preview...</td>
                      </tr>
                      <tr v-else-if="!isLoadingExportPreview && downloadPreviewRecords.length === 0">
                        <td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">No records match the selected filters.</td>
                      </tr>
                      <tr v-for="(c, idx) in downloadPreviewRecords" :key="c._id || idx" class="hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium text-xs">{{ c.student_name }}</td>
                        <td class="px-3 py-2 text-gray-500 text-xs">{{ c.student_id_number || c.student_id }}</td>
                        <td class="px-3 py-2 text-gray-500 text-xs hidden sm:table-cell">{{ c.year_level || '—' }}</td>
                        <td class="px-3 py-2">
                          <span :class="c.payment_status === 'paid' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'" class="px-2 py-0.5 rounded-full text-xs font-bold">
                            {{ (c.payment_status || 'UNPAID').toUpperCase() }}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-gray-500 text-xs hidden md:table-cell">{{ c.payment_status === 'paid' && c.paid_at ? new Date(c.paid_at).toLocaleDateString() : '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-1">
              <button @click="showDownloadConfirm = false" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
                Cancel
              </button>
              <button
                @click="confirmAndExportFilteredExcel"
                :disabled="isDownloading || exportYears.length === 0 || exportStatuses.length === 0 || (serverFilteredCount !== null && serverFilteredCount === 0)"
                class="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 disabled:opacity-60 shadow-md shadow-green-200"
              >
                <svg v-if="isDownloading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                {{ isDownloading ? 'Exporting...' : `Export${serverFilteredCount !== null ? ' ' + serverFilteredCount : ''} records` }}
              </button>
            </div>

          </div>
          </div>
        </div>
      </div>
    </transition>
    </Teleport>

    <!-- ====== REPORT CONFIG MODAL (event selector) ====== -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showReportConfig" class="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showReportConfig = false"></div>
          <div class="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <!-- Drag handle (mobile) -->
            <div class="sm:hidden flex justify-center pt-3 pb-1">
              <div class="w-10 h-1 rounded-full bg-gray-300"></div>
            </div>
            <!-- Header -->
            <div class="px-5 pt-4 pb-3 border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-base">Generate Report</h3>
                  <p class="text-xs text-gray-400">Select which events to include</p>
                </div>
                <button @click="showReportConfig = false" class="ml-auto w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <!-- Event Checkboxes -->
            <div class="px-5 py-3 max-h-64 overflow-y-auto">
              <div class="flex items-center justify-between mb-3">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Events</p>
                <div class="flex gap-2">
                  <button @click="selectedReportEventIds = paymentEvents.map(e => e._id)" class="text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition">Select All</button>
                  <span class="text-gray-300">·</span>
                  <button @click="selectedReportEventIds = []" class="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition">None</button>
                </div>
              </div>
              <div class="space-y-2">
                <label
                  v-for="event in paymentEvents"
                  :key="'cfg-' + event._id"
                  class="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/40 transition cursor-pointer"
                  :class="selectedReportEventIds.includes(event._id) ? 'border-violet-300 bg-violet-50' : ''"
                >
                  <input
                    type="checkbox"
                    :value="event._id"
                    v-model="selectedReportEventIds"
                    class="w-4 h-4 rounded accent-violet-600 cursor-pointer flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{{ event.title }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span :class="['inline-flex px-1.5 py-0 rounded-full text-[9px] font-bold capitalize', event.type === 'fee' ? 'bg-blue-100 text-blue-700' : event.type === 'membership' ? 'bg-green-100 text-green-700' : event.type === 'donation' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600']">{{ event.type || 'event' }}</span>
                      <span class="text-[10px] text-blue-700 font-semibold">₱{{ Number(event.amount_due || 0).toFixed(2) }}</span>
                      <span v-if="event.deadline" class="text-[10px] text-gray-400">Due: {{ new Date(event.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) }}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
              <p class="text-xs text-gray-400 flex-1">{{ selectedReportEventIds.length }} of {{ paymentEvents.length }} selected</p>
              <button @click="showReportConfig = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition">Cancel</button>
              <button
                @click="showReportConfig = false; openGenerateReport()"
                :disabled="selectedReportEventIds.length === 0"
                class="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 shadow-md shadow-purple-200 active:scale-95"
              >
                <svg class="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Generate
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ====== GENERATE REPORT MODAL ====== -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showReportModal" class="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <!-- Sticky top bar (screen-only) -->
          <div class="print:hidden sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm px-3 sm:px-6 py-2.5 flex items-center gap-2 sm:gap-3">
            <button
              @click="showReportModal = false"
              class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              title="Close"
            >
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-gray-900 text-sm leading-tight truncate">
                <span class="sm:hidden">Transactions Report</span>
                <span class="hidden sm:inline">Payment Transactions Report</span>
              </p>
              <p v-if="reportData" class="text-[10px] sm:text-[11px] text-gray-400 truncate">
                <span class="sm:hidden">{{ new Date(reportData.generatedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
                <span class="hidden sm:inline">Generated {{ new Date(reportData.generatedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
              </p>
            </div>
            <button
              v-if="reportData"
              @click="downloadReportExcel"
              class="flex-shrink-0 inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-md shadow-green-200 active:scale-95"
              title="Download as Excel"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span class="hidden sm:inline">Excel</span>
            </button>
            <button
              v-if="reportData"
              @click="printReport"
              class="flex-shrink-0 inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-md shadow-purple-200 active:scale-95"
              title="Print / Save PDF"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span class="hidden sm:inline">Print / PDF</span>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="!reportData" class="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div class="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
              <svg class="w-7 h-7 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            </div>
            <div class="text-center">
              <p class="font-bold text-gray-800">Generating Report…</p>
              <p class="text-sm text-gray-400 mt-1">Fetching all payment transactions</p>
            </div>
          </div>

          <!-- Report Content -->
          <div v-else class="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16 print:px-6 print:py-4 print:max-w-none">

            <!-- Print-only header -->
            <div class="hidden print:block mb-6 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold">Jose Rizal Memorial State University</p>
              <h1 class="text-2xl font-extrabold text-gray-900 mt-1">Payment Transactions Report</h1>
              <p class="text-sm text-gray-500 mt-1">Generated: {{ new Date(reportData.generatedAt).toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
              <div class="mt-4 border-t-2 border-gray-300"></div>
            </div>

            <!-- Screen-only section label -->
            <div class="print:hidden mb-5">
              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Overall Summary</p>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-4 text-center print:rounded-lg print:border print:border-blue-300">
                <p class="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">Events</p>
                <p class="text-2xl sm:text-3xl font-extrabold text-blue-800 mt-1">{{ reportData.overall.totalEvents }}</p>
                <p class="text-[10px] text-blue-500 mt-0.5">payment events</p>
              </div>
              <div class="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-2xl p-3 sm:p-4 text-center print:rounded-lg">
                <p class="text-[10px] sm:text-xs font-bold text-teal-600 uppercase tracking-wider">Paid</p>
                <p class="text-2xl sm:text-3xl font-extrabold text-teal-800 mt-1">{{ reportData.overall.totalPaid }}</p>
                <p class="text-[10px] text-teal-600 mt-0.5">across {{ reportData.overall.totalEvents }} event{{ reportData.overall.totalEvents !== 1 ? 's' : '' }}</p>
              </div>
              <div class="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-3 sm:p-4 text-center print:rounded-lg">
                <p class="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider">Unpaid</p>
                <p class="text-2xl sm:text-3xl font-extrabold text-red-800 mt-1">{{ reportData.overall.totalUnpaid }}</p>
                <p class="text-[10px] text-red-500 mt-0.5">{{ reportData.overall.pct }}% overall rate</p>
              </div>
              <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-3 sm:p-4 text-center print:rounded-lg">
                <p class="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider">Collected</p>
                <p class="text-base sm:text-lg font-extrabold text-emerald-800 mt-1 leading-tight">₱{{ reportData.overall.totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
                <p class="text-[10px] text-emerald-600 mt-0.5">of ₱{{ reportData.overall.expectedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
              </div>
            </div>

            <!-- Event Summary Table -->
            <div class="mb-8">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-1 h-5 rounded-full bg-purple-500 print:hidden"></div>
                <h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest">Event Summary</h2>
              </div>
              <div class="border border-gray-200 rounded-2xl overflow-hidden print:rounded-none print:border-gray-300">
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th class="px-3 sm:px-4 py-3 text-left text-xs font-bold text-gray-500 whitespace-nowrap">Event</th>
                        <th class="px-3 sm:px-4 py-3 text-left text-xs font-bold text-gray-500 whitespace-nowrap hidden sm:table-cell">Type</th>
                        <th class="px-3 sm:px-4 py-3 text-right text-xs font-bold text-gray-500 whitespace-nowrap">Amt Due</th>
                        <th class="px-3 sm:px-4 py-3 text-right text-xs font-bold text-gray-500 whitespace-nowrap">Paid</th>
                        <th class="px-3 sm:px-4 py-3 text-right text-xs font-bold text-gray-500 whitespace-nowrap">Unpaid</th>
                        <th class="px-3 sm:px-4 py-3 text-right text-xs font-bold text-gray-500 whitespace-nowrap hidden md:table-cell">Rate</th>
                        <th class="px-3 sm:px-4 py-3 text-right text-xs font-bold text-gray-500 whitespace-nowrap">Collected</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="evData in reportData.events" :key="'sum-' + evData.event._id" class="hover:bg-gray-50 transition">
                        <td class="px-3 sm:px-4 py-3">
                          <p class="font-semibold text-gray-900 text-sm leading-tight">{{ evData.event.title }}</p>
                          <p v-if="evData.event.deadline" class="text-[10px] text-gray-400 mt-0.5">Due: {{ new Date(evData.event.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }}</p>
                        </td>
                        <td class="px-3 sm:px-4 py-3 hidden sm:table-cell">
                          <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', evData.event.type === 'fee' ? 'bg-blue-100 text-blue-700' : evData.event.type === 'membership' ? 'bg-green-100 text-green-700' : evData.event.type === 'donation' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600']">{{ evData.event.type || 'event' }}</span>
                        </td>
                        <td class="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-blue-700 whitespace-nowrap">₱{{ Number(evData.event.amount_due || 0).toFixed(2) }}</td>
                        <td class="px-3 sm:px-4 py-3 text-right">
                          <span class="inline-flex items-center gap-1 text-teal-700 font-bold text-xs whitespace-nowrap">
                            <span class="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 print:hidden"></span>{{ evData.stats.paid }}
                          </span>
                        </td>
                        <td class="px-3 sm:px-4 py-3 text-right">
                          <span class="inline-flex items-center gap-1 text-red-600 font-bold text-xs whitespace-nowrap">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 print:hidden"></span>{{ evData.stats.unpaid }}
                          </span>
                        </td>
                        <td class="px-3 sm:px-4 py-3 text-right hidden md:table-cell">
                          <div class="flex items-center justify-end gap-2">
                            <div class="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden print:hidden">
                              <div class="h-full rounded-full bg-teal-500 transition-all" :style="{ width: evData.stats.pct + '%' }"></div>
                            </div>
                            <span class="text-xs font-semibold text-gray-700 w-8 text-right">{{ evData.stats.pct }}%</span>
                          </div>
                        </td>
                        <td class="px-3 sm:px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap text-xs">₱{{ evData.stats.totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                      </tr>
                    </tbody>
                    <tfoot class="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td class="px-3 sm:px-4 py-3 font-extrabold text-gray-800 text-xs">GRAND TOTAL</td>
                        <td class="px-3 sm:px-4 py-3 hidden sm:table-cell"></td>
                        <td class="px-3 sm:px-4 py-3 text-right text-xs font-extrabold text-blue-800 whitespace-nowrap">₱{{ reportData.overall.expectedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                        <td class="px-3 sm:px-4 py-3 text-right text-xs font-extrabold text-teal-800">{{ reportData.overall.totalPaid }}</td>
                        <td class="px-3 sm:px-4 py-3 text-right text-xs font-extrabold text-red-700">{{ reportData.overall.totalUnpaid }}</td>
                        <td class="px-3 sm:px-4 py-3 text-right text-xs font-extrabold text-gray-700 hidden md:table-cell">{{ reportData.overall.pct }}%</td>
                        <td class="px-3 sm:px-4 py-3 text-right text-xs font-extrabold text-emerald-800 whitespace-nowrap">₱{{ reportData.overall.totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <!-- Per-Event Transaction Details -->
            <div v-for="evData in reportData.events" :key="'detail-' + evData.event._id" class="mb-4 print:mb-8 print:break-inside-avoid-page">
              <!-- Clickable event header -->
              <button
                @click="expandedReportEvents.includes(evData.event._id) ? expandedReportEvents.splice(expandedReportEvents.indexOf(evData.event._id), 1) : expandedReportEvents.push(evData.event._id)"
                class="print:hidden w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-150 text-left group"
                :class="expandedReportEvents.includes(evData.event._id) ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-gray-50 border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'"
              >
                <div class="w-1 h-8 rounded-full flex-shrink-0 transition-colors" :class="expandedReportEvents.includes(evData.event._id) ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-300'"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 class="text-sm font-bold text-gray-800">{{ evData.event.title }}</h2>
                    <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', evData.event.type === 'fee' ? 'bg-blue-100 text-blue-700' : evData.event.type === 'membership' ? 'bg-green-100 text-green-700' : evData.event.type === 'donation' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600']">{{ evData.event.type || 'event' }}</span>
                    <span class="text-xs font-semibold text-blue-700">₱{{ Number(evData.event.amount_due || 0).toFixed(2) }}</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5 mt-1">
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">{{ evData.stats.paid }} paid</span>
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{{ evData.stats.unpaid }} unpaid</span>
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">₱{{ evData.stats.totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                </div>
                <div class="flex-shrink-0 flex items-center gap-2">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors" :class="expandedReportEvents.includes(evData.event._id) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'">
                    {{ expandedReportEvents.includes(evData.event._id) ? 'Hide' : 'View' }}
                  </span>
                  <svg :class="['w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0', expandedReportEvents.includes(evData.event._id) ? 'rotate-180 text-blue-500' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </button>

              <!-- Print-only static header (no button) -->
              <div class="hidden print:flex items-start gap-2 mb-3 flex-wrap">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 class="text-sm font-bold text-gray-800">{{ evData.event.title }}</h2>
                    <span class="text-xs font-semibold text-blue-700">₱{{ Number(evData.event.amount_due || 0).toFixed(2) }} each</span>
                  </div>
                  <div v-if="evData.event.deadline" class="text-[10px] text-gray-400 mt-0.5">Deadline: {{ new Date(evData.event.deadline).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) }}</div>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-bold text-teal-700">{{ evData.stats.paid }} paid</span>
                  <span class="text-[10px] font-bold text-red-600">{{ evData.stats.unpaid }} unpaid</span>
                </div>
              </div>

              <!-- Collapsible transaction table (screen) / always visible (print) -->
              <transition name="ssaam-stats">
                <div v-show="expandedReportEvents.includes(evData.event._id)" class="print:block mt-2">
              <div v-if="evData.contributions.length === 0" class="border border-dashed border-gray-200 rounded-2xl px-4 py-8 text-center text-sm text-gray-400">
                No transactions recorded for this event.
              </div>
              <div v-else class="border border-gray-200 rounded-2xl overflow-hidden print:rounded-none print:border-gray-300">
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th class="px-3 py-2.5 text-left text-xs font-bold text-gray-500 w-8">#</th>
                        <th class="px-3 py-2.5 text-left text-xs font-bold text-gray-500 whitespace-nowrap">Student ID</th>
                        <th class="px-3 py-2.5 text-left text-xs font-bold text-gray-500">Name</th>
                        <th class="px-3 py-2.5 text-left text-xs font-bold text-gray-500 hidden sm:table-cell">Program</th>
                        <th class="px-3 py-2.5 text-left text-xs font-bold text-gray-500 hidden md:table-cell whitespace-nowrap">Year Level</th>
                        <th class="px-3 py-2.5 text-right text-xs font-bold text-gray-500 whitespace-nowrap">Amount</th>
                        <th class="px-3 py-2.5 text-center text-xs font-bold text-gray-500">Status</th>
                        <th class="px-3 py-2.5 text-left text-xs font-bold text-gray-500 hidden sm:table-cell whitespace-nowrap">Paid Date</th>
                        <th class="px-3 py-2.5 text-left text-xs font-bold text-gray-500 hidden lg:table-cell whitespace-nowrap">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr
                        v-for="(c, idx) in evData.contributions"
                        :key="c._id || idx"
                        :class="['transition-colors', c.payment_status === 'paid' ? 'hover:bg-teal-50/40' : 'hover:bg-red-50/30']"
                      >
                        <td class="px-3 py-2.5 text-xs text-gray-400 tabular-nums">{{ idx + 1 }}</td>
                        <td class="px-3 py-2.5 text-xs font-mono text-gray-600 whitespace-nowrap">{{ c.student_id || c.id_number || '—' }}</td>
                        <td class="px-3 py-2.5 text-xs font-semibold text-gray-900 whitespace-nowrap">{{ c.student_name || c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || '—' }}</td>
                        <td class="px-3 py-2.5 text-xs text-gray-600 hidden sm:table-cell">{{ c.program || '—' }}</td>
                        <td class="px-3 py-2.5 text-xs text-gray-600 hidden md:table-cell whitespace-nowrap">{{ c.year_level || '—' }}</td>
                        <td class="px-3 py-2.5 text-right text-xs font-bold text-blue-700 whitespace-nowrap tabular-nums">₱{{ Number(c.target_amount || c.amount_paid || c.original_amount || 0).toFixed(2) }}</td>
                        <td class="px-3 py-2.5 text-center">
                          <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap', c.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600']">
                            {{ c.payment_status === 'paid' ? 'PAID' : 'UNPAID' }}
                          </span>
                        </td>
                        <td class="px-3 py-2.5 text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">
                          <span v-if="c.payment_status === 'paid' && c.paid_at">{{ new Date(c.paid_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
                          <span v-else class="text-gray-300">—</span>
                        </td>
                        <td class="px-3 py-2.5 text-xs text-gray-500 hidden lg:table-cell whitespace-nowrap">
                          <span v-if="c.payment_status === 'paid'" class="inline-flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span>
                            {{ formatPaidBy(c) }}
                          </span>
                          <span v-else class="text-gray-300">—</span>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot class="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colspan="5" class="px-3 py-2 text-xs font-extrabold text-gray-700 hidden md:table-cell">Subtotal</td>
                        <td colspan="3" class="px-3 py-2 text-xs font-extrabold text-gray-700 md:hidden">Subtotal</td>
                        <td class="px-3 py-2 text-right text-xs font-extrabold text-emerald-700 whitespace-nowrap tabular-nums">₱{{ evData.stats.totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                        <td class="px-3 py-2"></td>
                        <td class="px-3 py-2 hidden sm:table-cell"></td>
                        <td class="px-3 py-2 hidden lg:table-cell"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
                </div>
              </transition>
            </div>

            <!-- Report Footer -->
            <div class="mt-8 pt-5 border-t border-gray-100 text-center text-xs text-gray-400 space-y-0.5">
              <p class="font-semibold text-gray-500">SSAAM · Student School Activities Attendance Monitoring</p>
              <p>Jose Rizal Memorial State University</p>
              <p>Report generated on {{ new Date(reportData.generatedAt).toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
              <p class="italic print:block hidden">This report is computer-generated and does not require a signature.</p>
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
      paymentRecordsQuery: '',
      showUnpaidConfirm: false,
      unpaidConfirmContribution: null,
      unpaidConfirmCooldown: 0,
      _unpaidConfirmTimer: null,
      contributions: [],
      selectedStudent: null,
      isLoadingPaymentStatus: false,
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
      showExportHistory: false,
      exportHistory: [],
      isLoadingExportHistory: false,
      exportStep: 0,
      exportStepMessages: [
        'Fetching records from server…',
        'Building spreadsheet…',
        'Preparing your download…'
      ],
      _exportStepTimer: null,
      showDownloadConfirm: false,
      downloadPreviewLimit: 5,
      downloadFormat: 'xlsx',
      downloadPreviewRecords: [],
      serverFilteredCount: null,
      exportYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      exportStatuses: ['paid', 'unpaid'],
      exportProgram: '',
      isLoadingExportPreview: false,
      isProcessingPaymentGlobal: false,
      processingPaymentId: null,
      showCreateEventModal: false,
      isCreatingEvent: false,
      createEventError: '',
      paymentEvents: [],
      isLoadingEvents: false,
      carouselIndex: 0,
      eventSearchQuery: '',
      showDeleteEventConfirm: false,
      eventToDelete: null,
      isDeletingEvent: false,
      deleteConfirmCooldown: 0,
      _deleteConfirmTimer: null,
      deleteEventRecordCount: null,
      deleteEventPaidCount: null,
      isLoadingDeleteCount: false,
      showEditEventModal: false,
      isEditingEvent: false,
      editEventError: '',
      editEventForm: {
        _id: '', title: '', description: '', amount_due: '', type: 'fee',
        deadline: '', status: 'active', target_year_levels: [], target_programs: [], addons: []
      },
      showStatsPanel: false,
      newEventForm: {
        title: '',
        description: '',
        amount_due: '',
        type: 'fee',
        deadline: '',
        target_year_levels: [],
        target_programs: [],
        addons: []
      },
      // addonCart: { addonId -> quantity } for the currently-selected student
      addonCart: {},
      paymentsPage: 1,
      paymentsPerPage: 10,
      // Manual / auto refresh state for the "Paid On" panel. We pulse the
      // little dot next to "Paid On" each time the data is refreshed (either
      // by the admin clicking the refresh button or automatically right
      // after a payment is recorded) so the change is visible.
      isRefreshingPaidOn: false,
      paidOnLastRefreshed: null,
      _paidOnRefreshFlashTimer: null,
      showReportModal: false,
      isGeneratingReport: false,
      reportData: null,
      showReportConfig: false,
      selectedReportEventIds: [],
      expandedReportEvents: [],
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
    addonCartTotal() {
      if (!this.activePayment || !Array.isArray(this.activePayment.addons)) return 0;
      return this.activePayment.addons.reduce((sum, addon) => {
        const qty = Number(this.addonCart[String(addon._id)] || 0);
        return sum + (qty > 0 ? qty * Number(addon.price || 0) : 0);
      }, 0);
    },
    grandTotal() {
      return this.targetPayment + this.addonCartTotal;
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
      const q = (this.paymentRecordsQuery || '').toString().trim().toLowerCase();
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
            c.student_name,
            c.name,
            c.first_name,
            c.middle_name,
            c.last_name,
            c.full_name,
            c.student_id,
            c.student_id_number,
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
    carouselEvent() {
      return this.displayedEvents[this.carouselIndex] || null;
    },
    displayedEvents() {
      if (!this.eventSearchQuery) return this.paymentEvents;
      const q = this.eventSearchQuery.toLowerCase();
      return this.paymentEvents.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.type || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    },
    collectedByEvent() {
      const map = {};
      for (const ev of (this.paymentEvents || [])) {
        if (this.activePayment && ev._id === this.activePayment._id) {
          // Active event: sum from filteredContributions — SAME source and field priority
          // as statsOverall.totalCollected so both numbers always match exactly.
          map[ev._id] = this.filteredContributions
            .filter(c => c.payment_status === 'paid')
            .reduce((sum, c) => sum + Number(c.amount_paid || c.original_amount || 0), 0);
        } else {
          // Non-active events: use embedded payment_records from the events list endpoint
          // (detailed contributions are only loaded for the active event).
          let total = 0;
          for (const r of (ev.payment_records || [])) {
            if (r.payment_status === 'paid' || r.is_paid) {
              total += Number(r.amount_paid || ev.amount_due || 0);
            }
          }
          map[ev._id] = total;
        }
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
    displayedEvents(newVal) {
      if (this.carouselIndex >= newVal.length) {
        this.carouselIndex = Math.max(0, newVal.length - 1);
      }
    },
    filteredContributions() { this.paymentsPage = 1; },
    filterStatus() { this.loadAllContributions(); },
    filterProgram() { this.loadAllContributions(); },
    filterYearLevel() { this.loadAllContributions(); },
    filterCollege() { this.loadAllContributions(); },
    showDownloadConfirm(v) { if (v) this.refreshExportPreview(); },
    showExportHistory(v) { if (v) this.loadExportHistory(); },
    exportYears: { deep: true, handler() { this._scheduleExportPreview(); } },
    exportStatuses: { deep: true, handler() { this._scheduleExportPreview(); } },
    exportProgram() { this._scheduleExportPreview(); },
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
    document.addEventListener('keydown', this.handleCarouselKeydown);
  },
  unmounted() {
    document.removeEventListener('keydown', this.handleCarouselKeydown);
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
      this.addonCart = {};
      this.loadAllContributions();
    },
    async confirmDeleteEvent(event) {
      this.eventToDelete = event;
      this.showDeleteEventConfirm = true;
      this.deleteConfirmCooldown = 5;
      this.deleteEventRecordCount = null;
      this.deleteEventPaidCount = null;
      this.isLoadingDeleteCount = true;
      clearInterval(this._deleteConfirmTimer);
      this._deleteConfirmTimer = setInterval(() => {
        if (this.deleteConfirmCooldown > 0) {
          this.deleteConfirmCooldown--;
        } else {
          clearInterval(this._deleteConfirmTimer);
        }
      }, 1000);
      // Fetch how many student records are linked to this event
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(buildAPIUrl(`/apis/payments/${event._id}`), {
          headers: { 'Authorization': `Bearer ${token}`, 'X-SSAAM-College': getCollege() }
        });
        if (res.ok) {
          const data = await res.json();
          this.deleteEventRecordCount = data.data?.stats?.total_students ?? 0;
          this.deleteEventPaidCount = data.data?.stats?.paid_count ?? 0;
        }
      } catch (e) {
        console.error('Error fetching event record count:', e);
      } finally {
        this.isLoadingDeleteCount = false;
      }
    },
    getCarouselCardStyle(idx) {
      const offset = idx - this.carouselIndex;
      const abs = Math.abs(offset);
      // Cards have fixed width, positioned with left:50% so transform centers them.
      // Adjacent cards shift by a fixed pixel offset so they always sit right beside
      // the center card regardless of container width.
      const base = {
        position: 'absolute',
        top: '0',
        left: '50%',
        width: 'min(390px, 88vw)',
      };
      if (abs === 0) {
        return {
          ...base,
          transform: 'translateX(-50%) scale(1)',
          opacity: '1',
          zIndex: 10,
          pointerEvents: 'auto',
        };
      }
      if (abs === 1) {
        const dir = offset > 0 ? 1 : -1;
        return {
          ...base,
          transform: `translateX(calc(-50% + ${dir * 370}px)) scale(0.88)`,
          opacity: '0.82',
          zIndex: 5,
          pointerEvents: 'auto',
          cursor: 'pointer',
        };
      }
      return {
        ...base,
        transform: `translateX(calc(-50% + ${(offset > 0 ? 1 : -1) * 780}px))`,
        opacity: '0',
        zIndex: 1,
        pointerEvents: 'none',
      };
    },
    prevCarousel() {
      if (this.displayedEvents.length <= 1) return;
      this.carouselIndex = (this.carouselIndex - 1 + this.displayedEvents.length) % this.displayedEvents.length;
    },
    nextCarousel() {
      if (this.displayedEvents.length <= 1) return;
      this.carouselIndex = (this.carouselIndex + 1) % this.displayedEvents.length;
    },
    handleCarouselKeydown(e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.prevCarousel(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.nextCarousel(); }
      else if (e.key === 'Enter' && this.displayedEvents.length > 0) {
        e.preventDefault();
        const event = this.displayedEvents[this.carouselIndex];
        if (event) this.selectEvent(event);
      }
    },
    handleSwipeStart(e) {
      this._swipeStartX = e.touches[0].clientX;
    },
    handleSwipeEnd(e) {
      if (this._swipeStartX === null) return;
      const diff = this._swipeStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? this.nextCarousel() : this.prevCarousel();
      }
      this._swipeStartX = null;
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
        // Clear the table filter too when search is cleared
        this.paymentRecordsQuery = '';
        this.loadAllContributions();
        return;
      }
      this.isSearchingStudent = true;
      this.hasSearched = true;

      // Always sync the table filter with what the user typed so the
      // payment records table narrows down to matching rows regardless of
      // whether the dropdown auto-selects a student or not.
      this.paymentRecordsQuery = q;

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildAPIUrl('/apis/students/search-multi'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-SSAAM-College': getCollege() },
          body: JSON.stringify({
            search_query: q,
            ...(this.filterYearLevel && { year_level: this.filterYearLevel }),
            ...(this.filterProgram && { program: this.filterProgram })
          })
        });
        if (response.ok) {
          const data = await response.json();
          let list = Array.isArray(data.students) ? data.students : [];
          if (this.filterYearLevel) list = list.filter(s => s.year_level === this.filterYearLevel);
          if (this.filterProgram) list = list.filter(s => s.program === this.filterProgram);
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
    async selectStudentFromSearch(student) {
      // Click handler on a search result row — promotes a candidate into the
      // active selection used by the payment card and POS panel.
      this.selectedStudent = student;
      this.discountValue = 0;
      this.searchResults = [];
      this.hasSearched = false;
      // Show the loading skeleton while we fetch the latest paid/unpaid status
      // from the server, so the button never "pops" from one state to another.
      this.isLoadingPaymentStatus = true;
      try {
        await this.loadAllContributions();
      } finally {
        this.isLoadingPaymentStatus = false;
      }
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
      this.newEventForm = { title: '', description: '', amount_due: '', type: 'fee', deadline: '', target_year_levels: [], target_programs: [], addons: [] };
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
        addons: Array.isArray(event.addons) ? event.addons.map(a => ({
          _id: a._id,
          name: a.name || '',
          description: a.description || '',
          price: a.price ?? 0,
          unit: a.unit || 'piece',
          max_qty: a.max_qty ?? null,
        })) : [],
      };
      this.editEventError = '';
      this.showEditEventModal = true;
    },
    closeEditEventModal() {
      this.showEditEventModal = false;
      this.editEventError = '';
      this.editEventForm = { _id: '', title: '', description: '', amount_due: '', type: 'fee', deadline: '', status: 'active', target_year_levels: [], target_programs: [], addons: [] };
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
            addons: this.editEventForm.addons.filter(a => a.name && a.name.trim()),
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
          addons: this.newEventForm.addons.filter(a => a.name && a.name.trim()),
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
          // Refresh contributions only if the admin already had an event selected
          if (this.activePayment) this.loadAllContributions();
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
    onReceiptPrinted({ customer } = {}) {
      const name = customer || (this.selectedStudent && (this.selectedStudent.full_name || this.selectedStudent.first_name)) || 'student';
      if (this.selectedStudentAlreadyPaid) {
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: { message: `Receipt printed for ${name} — already recorded as paid`, type: 'info' }
        }));
        return;
      }
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: `Receipt printed — recording payment for ${name}…`, type: 'info' }
      }));
      this.markAsPayment();
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

        // Build addon purchase list (only for the payment card, not row quick-pay)
        const addon_purchases = [];
        if (!isRow && Array.isArray(this.activePayment.addons)) {
          for (const addon of this.activePayment.addons) {
            const qty = Number(this.addonCart[String(addon._id)] || 0);
            if (qty > 0) {
              addon_purchases.push({
                addon_id:   addon._id,
                addon_name: addon.name,
                quantity:   qty,
                price_each: Number(addon.price || 0),
                subtotal:   qty * Number(addon.price || 0),
              });
            }
          }
        }

        const amountPaid = isRow ? (this.activePayment.amount_due || 0) : this.grandTotal;

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
            notes: 'Payment recorded via admin panel',
            addon_purchases,
          })
        });

        const data = await response.json();
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Payment recorded successfully', type: 'success' } }));
          this.discountValue = 0;
          this.addonCart = {};
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
    addAddonRow(form) {
      form.addons.push({ name: '', description: '', price: 0, unit: 'piece', max_qty: null });
    },
    removeAddonRow(form, idx) {
      form.addons.splice(idx, 1);
    },
    setAddonQty(addonId, qty) {
      const n = Math.max(0, parseInt(qty) || 0);
      if (n === 0) {
        const cart = { ...this.addonCart };
        delete cart[String(addonId)];
        this.addonCart = cart;
      } else {
        this.addonCart = { ...this.addonCart, [String(addonId)]: n };
      }
    },
    confirmMarkUnpaid(contribution) {
      this.unpaidConfirmContribution = contribution || null;
      this.showUnpaidConfirm = true;
      this.unpaidConfirmCooldown = 3;
      clearInterval(this._unpaidConfirmTimer);
      this._unpaidConfirmTimer = setInterval(() => {
        if (this.unpaidConfirmCooldown > 0) {
          this.unpaidConfirmCooldown--;
        } else {
          clearInterval(this._unpaidConfirmTimer);
        }
      }, 1000);
    },
    cancelMarkUnpaid() {
      this.showUnpaidConfirm = false;
      this.unpaidConfirmContribution = null;
      this.unpaidConfirmCooldown = 0;
      clearInterval(this._unpaidConfirmTimer);
    },
    async markAsUnpaid(contribution) {
      // Called by the confirmation modal after the admin confirms.
      // Either a row from the table (passed as `contribution`) or — when no
      // row is passed — the currently selected student.
      const contrib = contribution !== undefined ? contribution : this.unpaidConfirmContribution;
      this.showUnpaidConfirm = false;
      this.unpaidConfirmContribution = null;
      clearInterval(this._unpaidConfirmTimer);

      if (!this.selectedStudent && !contrib) return;

      if (!this.activePayment?._id) {
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'No active payment event found.', type: 'warning' } }));
        return;
      }

      const isRow = !!contrib;
      const processingId = isRow ? (contrib._id || contrib.student_id_number) : 'global';
      try {
        if (isRow) { this.processingPaymentId = processingId; }
        else { this.isProcessingPaymentGlobal = true; }

        const token = localStorage.getItem('authToken');
        const studentIdInput = isRow
          ? (contrib.student_id_number || contrib.student_id)
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
    downloadPaymentExcel() {
      this.exportYears = this.filterYearLevel
        ? [this.filterYearLevel]
        : ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      this.exportStatuses = this.filterStatus
        ? (this.filterStatus === 'unpaid' || this.filterStatus === 'pending' ? ['unpaid'] : ['paid'])
        : ['paid', 'unpaid'];
      this.exportProgram = this.filterProgram || '';
      this.downloadPreviewRecords = [];
      this.serverFilteredCount = null;
      this.showDownloadConfirm = true;
    },
    async refreshExportPreview() {
      if (this.exportYears.length === 0 || this.exportStatuses.length === 0) {
        this.downloadPreviewRecords = [];
        this.serverFilteredCount = 0;
        return;
      }
      this.isLoadingExportPreview = true;
      try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams();
        params.set('limit', String(this.downloadPreviewLimit));
        if (this.exportYears.length < 4) params.set('year_levels', this.exportYears.join(','));
        if (this.exportStatuses.length === 1) params.set('statuses', this.exportStatuses[0]);
        if (this.exportProgram) params.set('program', this.exportProgram);
        if (this.activePayment?._id) params.set('payment_id', this.activePayment._id);
        const response = await fetch(buildAPIUrl(`/apis/contributions/search?${params.toString()}`), {
          headers: { 'Authorization': `Bearer ${token}`, 'X-SSAAM-College': getCollege() }
        });
        if (!response.ok) return;
        const data = await response.json();
        this.downloadPreviewRecords = data.data || [];
        this.serverFilteredCount = data.pagination ? data.pagination.total : (data.data || []).length;
      } catch (err) {
        console.error('Error fetching export preview:', err);
      } finally {
        this.isLoadingExportPreview = false;
      }
    },
    _scheduleExportPreview() {
      if (this._exportPreviewTimer) clearTimeout(this._exportPreviewTimer);
      this._exportPreviewTimer = setTimeout(() => this.refreshExportPreview(), 300);
    },
    openReportConfig() {
      this.selectedReportEventIds = [];
      this.showReportConfig = true;
    },
    formatPaidBy(c) {
      if (c.payment_status !== 'paid') return '—';
      if (!c.paid_by_treasurer) return 'Admin';
      if (typeof c.paid_by_treasurer === 'string') return c.paid_by_treasurer || 'Admin';
      const fn = (c.paid_by_treasurer.first_name || '').trim();
      const ln = (c.paid_by_treasurer.last_name || '').trim();
      return [fn, ln].filter(Boolean).join(' ') || 'Admin';
    },
    downloadReportExcel() {
      if (!this.reportData) return;
      const wb = XLSX.utils.book_new();
      for (const evData of this.reportData.events) {
        const rows = evData.contributions.map((c, idx) => ({
          '#': idx + 1,
          'Student ID': c.student_id || c.id_number || '',
          'Name': c.student_name || c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || '',
          'Program': c.program || '',
          'Year Level': c.year_level || '',
          'Amount (₱)': Number(c.target_amount || c.amount_paid || c.original_amount || 0).toFixed(2),
          'Status': c.payment_status === 'paid' ? 'PAID' : 'UNPAID',
          'Paid Date': (c.payment_status === 'paid' && c.paid_at) ? new Date(c.paid_at).toLocaleString('en-PH') : '',
          'Recorded By': this.formatPaidBy(c)
        }));
        const sheetName = (evData.event.title || 'Event').replace(/[:\\/?*[\]]/g, '').substring(0, 31);
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [{ wch: 4 }, { wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
      const summaryRows = this.reportData.events.map(ed => ({
        'Event': ed.event.title,
        'Type': ed.event.type || '',
        'Amount Due (₱)': Number(ed.event.amount_due || 0).toFixed(2),
        'Total Students': ed.stats.total,
        'Paid': ed.stats.paid,
        'Unpaid': ed.stats.unpaid,
        'Rate (%)': ed.stats.pct,
        'Collected (₱)': ed.stats.totalCollected.toFixed(2)
      }));
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      const dateSuffix = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Payment_Report_${dateSuffix}.xlsx`);
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Excel report downloaded successfully', type: 'success' } }));
    },
    async openGenerateReport() {
      if (this.isGeneratingReport) return;
      this.isGeneratingReport = true;
      this.reportData = null;
      this.expandedReportEvents = [];
      this.showReportModal = true;
      try {
        const token = localStorage.getItem('authToken');
        const eventResults = [];
        let totalStudents = 0, totalPaid = 0, totalUnpaid = 0, totalCollected = 0, expectedTotal = 0;
        const eventsToReport = this.paymentEvents.filter(e => this.selectedReportEventIds.includes(e._id));

        for (const event of eventsToReport) {
          const params = new URLSearchParams();
          params.set('limit', '5000');
          params.set('payment_id', event._id);
          let contribs = [];
          try {
            const res = await fetch(buildAPIUrl(`/apis/contributions/search?${params.toString()}`), {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const d = await res.json();
              contribs = d.data || [];
            }
          } catch (fetchErr) {
            console.warn('Could not fetch contributions for event', event._id, fetchErr);
          }

          const paid = contribs.filter(c => c.payment_status === 'paid').length;
          const unpaid = contribs.length - paid;
          const tc = contribs
            .filter(c => c.payment_status === 'paid')
            .reduce((s, c) => s + Number(c.amount_paid || c.target_amount || c.original_amount || event.amount_due || 0), 0);
          const exp = contribs.reduce((s, c) => s + Number(c.original_amount || event.amount_due || 0), 0);

          totalStudents += contribs.length;
          totalPaid += paid;
          totalUnpaid += unpaid;
          totalCollected += tc;
          expectedTotal += exp;

          const sorted = [...contribs].sort((a, b) => {
            const ap = a.payment_status === 'paid' ? 0 : 1;
            const bp = b.payment_status === 'paid' ? 0 : 1;
            if (ap !== bp) return ap - bp;
            if (ap === 0) {
              return (b.paid_at ? new Date(b.paid_at).getTime() : 0) - (a.paid_at ? new Date(a.paid_at).getTime() : 0);
            }
            return (a.student_name || a.full_name || '').localeCompare(b.student_name || b.full_name || '');
          });

          eventResults.push({
            event,
            contributions: sorted,
            stats: { total: contribs.length, paid, unpaid, pct: contribs.length ? Math.round((paid / contribs.length) * 100) : 0, totalCollected: tc, expected: exp }
          });
        }

        this.reportData = {
          generatedAt: new Date().toISOString(),
          events: eventResults,
          overall: {
            totalEvents: eventsToReport.length,
            totalStudents,
            totalPaid,
            totalUnpaid,
            totalCollected,
            expectedTotal,
            pct: totalStudents ? Math.round((totalPaid / totalStudents) * 100) : 0
          }
        };
      } catch (e) {
        console.error('Error generating report:', e);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Failed to generate report', type: 'error' } }));
        this.showReportModal = false;
      } finally {
        this.isGeneratingReport = false;
      }
    },
    printReport() {
      window.print();
    },

    formatRelativeTime(date) {
      if (!date) return '';
      const d = new Date(date);
      const now = new Date();
      const diff = now - d;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    async logExport(count, format, paymentTitle, filters) {
      try {
        const token = localStorage.getItem('authToken');
        await fetch(buildAPIUrl('/apis/export-logs'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-SSAAM-College': getCollege()
          },
          body: JSON.stringify({ record_count: count, format, payment_title: paymentTitle, filters })
        });
      } catch (e) {
        // Silent — export already succeeded, skip the log entry
      }
    },

    async loadExportHistory() {
      this.isLoadingExportHistory = true;
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(buildAPIUrl('/apis/export-logs'), {
          headers: { 'Authorization': `Bearer ${token}`, 'X-SSAAM-College': getCollege() }
        });
        if (res.ok) {
          const data = await res.json();
          this.exportHistory = data.logs || [];
        }
      } catch (e) {
        // silent
      } finally {
        this.isLoadingExportHistory = false;
      }
    },

    async confirmAndExportFilteredExcel() {
      if (this.isDownloading) return;
      this.isDownloading = true;
      this.exportStep = 0;
      // Cycle through step messages so the overlay feels alive
      this._exportStepTimer = setInterval(() => {
        this.exportStep = Math.min(this.exportStep + 1, this.exportStepMessages.length - 1);
      }, 900);
      try {
        const params = new URLSearchParams();
        if (this.exportYears.length < 4) params.set('year_levels', this.exportYears.join(','));
        if (this.exportStatuses.length === 1) params.set('statuses', this.exportStatuses[0]);
        if (this.exportProgram) params.set('program', this.exportProgram);
        if (this.activePayment?._id) params.set('payment_id', this.activePayment._id);

        const yearLabel = this.exportYears.length === 4 ? 'AllYears' : this.exportYears.map(y => y.replace(' Year', 'Y')).join('-');
        const statusLabel = this.exportStatuses.length === 2 ? 'All' : this.exportStatuses[0];
        const progLabel = this.exportProgram || 'AllPrograms';
        const filtersSafe = `${yearLabel}_${statusLabel}_${progLabel}`.replace(/\s+/g, '');
        const dateSuffix = new Date().toISOString().split('T')[0];
        const token = localStorage.getItem('authToken');
        const url = buildAPIUrl(`/apis/contributions/download/excel?${params.toString()}`);
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'X-SSAAM-College': getCollege() } });

        if (!response.ok) throw new Error('Server export failed');

        const csvText = await response.text();

        if (this.downloadFormat === 'csv') {
          const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
          const a = document.createElement('a');
          const urlObj = URL.createObjectURL(blob);
          a.href = urlObj; a.download = `Payments_${filtersSafe}_${dateSuffix}.csv`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(urlObj);
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Exported ${this.serverFilteredCount ?? 0} record(s) (CSV)`, type: 'success' } }));
          this.logExport(this.serverFilteredCount ?? 0, 'csv', this.activePayment?.title || '', { year_levels: this.exportYears, statuses: this.exportStatuses, program: this.exportProgram });
        } else {
          const wbRaw = XLSX.read(csvText, { type: 'string' });
          const wsRaw = wbRaw.Sheets[wbRaw.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(wsRaw);

          const wb = XLSX.utils.book_new();

          const wsMain = XLSX.utils.json_to_sheet(rows);
          wsMain['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 13 }, { wch: 13 }, { wch: 9 }, { wch: 14 }, { wch: 20 }];
          XLSX.utils.book_append_sheet(wb, wsMain, 'Records');

          const buildSummary = (groupFn) => {
            const map = {};
            for (const r of rows) {
              const key = groupFn(r) || 'Unknown';
              if (!map[key]) map[key] = { total: 0, paid: 0, unpaid: 0, collected: 0 };
              map[key].total++;
              if ((r['Status'] || '').toUpperCase() === 'PAID') {
                map[key].paid++;
                map[key].collected += parseFloat(r['Amount Paid'] || 0) || 0;
              } else { map[key].unpaid++; }
            }
            return map;
          };

          const progMap = buildSummary(r => r['Program']);
          const progRows = Object.entries(progMap).sort((a, b) => a[0].localeCompare(b[0])).map(([k, s]) => ({
            'Program': k, 'Total Students': s.total, 'Paid': s.paid, 'Unpaid': s.unpaid,
            'Collection Rate': s.total ? `${Math.round((s.paid / s.total) * 100)}%` : '0%',
            'Amount Collected (₱)': s.collected.toFixed(2)
          }));
          const wsProg = XLSX.utils.json_to_sheet(progRows);
          wsProg['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 16 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(wb, wsProg, 'By Program');

          const yearMap = buildSummary(r => r['Year Level']);
          const yearOrder = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
          const yearRows = [...yearOrder, ...Object.keys(yearMap).filter(k => !yearOrder.includes(k))]
            .filter(k => yearMap[k])
            .map(yl => ({
              'Year Level': yl, 'Total Students': yearMap[yl].total, 'Paid': yearMap[yl].paid, 'Unpaid': yearMap[yl].unpaid,
              'Collection Rate': yearMap[yl].total ? `${Math.round((yearMap[yl].paid / yearMap[yl].total) * 100)}%` : '0%',
              'Amount Collected (₱)': yearMap[yl].collected.toFixed(2)
            }));
          const wsYear = XLSX.utils.json_to_sheet(yearRows);
          wsYear['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 16 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(wb, wsYear, 'By Year Level');

          XLSX.writeFile(wb, `Payments_${filtersSafe}_${dateSuffix}.xlsx`);
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Exported ${rows.length} record(s) with summary sheets`, type: 'success' } }));
          this.logExport(rows.length, 'xlsx', this.activePayment?.title || '', { year_levels: this.exportYears, statuses: this.exportStatuses, program: this.exportProgram });
        }
        this.showDownloadConfirm = false;
      } catch (error) {
        console.error('Error exporting payments:', error);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Failed to export payment records', type: 'error' } }));
      } finally {
        clearInterval(this._exportStepTimer);
        this._exportStepTimer = null;
        this.exportStep = 0;
        this.isDownloading = false;
      }
    }
  }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.paid-on-slide-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease, max-height 0.35s ease;
  overflow: hidden;
}
.paid-on-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease, max-height 0.3s ease;
  overflow: hidden;
}
.paid-on-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.paid-on-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
  max-height: 600px;
}
.paid-on-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 600px;
}
.paid-on-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
/* ── carousel-slide: card swap animation ── */
.carousel-slide-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.carousel-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.carousel-slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.carousel-slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

/* ── contrib-reveal: empty-state ↔ stats+filters inside the white card ── */
.contrib-reveal-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.contrib-reveal-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.contrib-reveal-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.contrib-reveal-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── contrib-slide: outer cards (student card + contributions list) ────── */
.contrib-slide-enter-active {
  transition: opacity 0.38s ease, transform 0.38s ease;
}
.contrib-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.contrib-slide-enter-from {
  opacity: 0;
  transform: translateY(18px);
}
.contrib-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-gray::-webkit-scrollbar { height: 4px; }
.scrollbar-gray::-webkit-scrollbar-track { background: transparent; border-radius: 2px; }
.scrollbar-gray::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.scrollbar-gray::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
.scrollbar-gray { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }

@media print {
  body * { visibility: hidden !important; }
  .fixed.inset-0.z-\\[60\\], .fixed.inset-0.z-\\[60\\] * { visibility: visible !important; }
  .fixed.inset-0.z-\\[60\\] { position: absolute !important; inset: 0 !important; overflow: visible !important; }
  .print\\:hidden { display: none !important; }
  .hidden.print\\:block { display: block !important; }
  .hidden.print\\:inline { display: inline !important; }
  table { border-collapse: collapse !important; width: 100% !important; }
  th, td { padding: 6px 10px !important; font-size: 11px !important; }
  thead { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print\\:break-inside-avoid-page { break-inside: avoid-page; }
}
</style>
