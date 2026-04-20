<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="relative h-32 sm:h-36 bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-700 overflow-hidden">
        <div class="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-400/20 blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl"></div>
        <div class="absolute inset-0 flex items-center px-6 md:px-8 gap-4">
          <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">My Raffle Results</h2>
            <p class="text-white/70 text-sm mt-0.5">View your raffle ticket entries and category standing</p>
          </div>
          <div v-if="!loading && entries.length > 0" class="flex-shrink-0 hidden sm:flex items-center gap-2">
            <div class="text-center bg-red-500/20 rounded-2xl px-3 py-2 border border-red-300/30">
              <p class="text-white/70 text-[10px] uppercase tracking-wider">Rural</p>
              <p class="text-white font-extrabold text-xl">{{ totalRural }}</p>
            </div>
            <div class="text-center bg-green-500/20 rounded-2xl px-3 py-2 border border-green-300/30">
              <p class="text-white/70 text-[10px] uppercase tracking-wider">Evergood</p>
              <p class="text-white font-extrabold text-xl">{{ totalEvergood }}</p>
            </div>
            <div class="text-center bg-white/15 rounded-2xl px-3 py-2 border border-white/20">
              <p class="text-white/70 text-[10px] uppercase tracking-wider">Total</p>
              <p class="text-white font-extrabold text-xl">{{ totalTickets }}</p>
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
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <svg class="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p class="text-gray-500 font-medium">Loading your raffle entries...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <svg class="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-red-700 font-semibold">Failed to load raffle entries</p>
      <p class="text-red-500 text-sm mt-1">{{ error }}</p>
      <button @click="fetchEntries" class="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-semibold transition-colors">
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="entries.length === 0" class="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
      <div class="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-5">
        <svg class="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
        </svg>
      </div>
      <h3 class="text-lg font-bold text-gray-700 mb-2">No Raffle Entries Yet</h3>
      <p class="text-gray-400 text-sm max-w-xs mx-auto">Your raffle ticket entries will appear here once an admin has recorded them for you.</p>
    </div>

    <!-- Entries -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">Your Entries</p>
        <button @click="fetchEntries" :disabled="loading" class="flex items-center gap-1.5 text-xs text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-xl font-medium transition-colors">
          <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      <div v-for="entry in entries" :key="entry._id" class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <!-- Ticket Type Banner -->
        <div :class="['relative h-3', entry.ticket_type === 'red' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-green-500 to-emerald-600']"></div>

        <div class="p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <!-- Ticket Type Info -->
            <div class="flex items-center gap-4">
              <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg', entry.ticket_type === 'red' ? 'bg-gradient-to-br from-red-100 to-rose-200' : 'bg-gradient-to-br from-green-100 to-emerald-200']">
                <svg class="w-7 h-7" :class="entry.ticket_type === 'red' ? 'text-red-600' : 'text-green-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-lg font-extrabold text-gray-800">
                    {{ entry.ticket_type === 'red' ? 'Rural (Red) Ticket' : 'Evergood (Green) Ticket' }}
                  </h3>
                  <span :class="['px-2.5 py-0.5 rounded-full text-xs font-bold border', entry.ticket_type === 'red' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200']">
                    {{ entry.ticket_type === 'red' ? '🔴 Rural' : '🟢 Evergood' }}
                  </span>
                </div>
                <p class="text-sm text-gray-400 mt-0.5">Submitted {{ formatDate(entry.submitted_at) }}</p>
              </div>
            </div>

            <!-- Category Badge -->
            <div class="flex flex-col items-start sm:items-end gap-2">
              <span v-if="entry.category && entry.category !== 'none'" :class="['inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-extrabold border shadow-sm', getCategoryClasses(entry.category)]">
                {{ getCategoryIcon(entry.category) }} {{ capitalize(entry.category) }}
              </span>
              <span v-else class="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold border bg-gray-50 text-gray-400 border-gray-200">
                — No Category Yet
              </span>
            </div>
          </div>

          <!-- Stats Row -->
          <div class="mt-5 space-y-3">
            <!-- Ticket Breakdown -->
            <div class="rounded-2xl border border-gray-100 overflow-hidden">
              <div class="grid grid-cols-3 divide-x divide-gray-100">
                <div class="bg-red-50 p-4 text-center">
                  <p class="text-2xl font-extrabold text-red-600">{{ entry.rural_count || 0 }}</p>
                  <p class="text-[11px] text-red-400 mt-0.5 font-bold uppercase tracking-wide">🔴 Rural</p>
                </div>
                <div class="bg-green-50 p-4 text-center">
                  <p class="text-2xl font-extrabold text-green-600">{{ entry.evergood_count || 0 }}</p>
                  <p class="text-[11px] text-green-400 mt-0.5 font-bold uppercase tracking-wide">🟢 Evergood</p>
                </div>
                <div class="bg-purple-50 p-4 text-center">
                  <p class="text-2xl font-extrabold text-purple-700">{{ entry.ticket_count }}</p>
                  <p class="text-[11px] text-purple-400 mt-0.5 font-bold uppercase tracking-wide">Total</p>
                </div>
              </div>
            </div>
            <!-- Category & Recorded By -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
                <p class="text-lg font-extrabold" :class="entry.category !== 'none' ? 'text-purple-700' : 'text-gray-400'">
                  {{ entry.category !== 'none' ? capitalize(entry.category) : 'None' }}
                </p>
                <p class="text-xs text-gray-400 mt-0.5 font-medium">Raffle Category</p>
              </div>
              <div class="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                <p class="text-sm font-bold text-gray-700 truncate">{{ entry.submitted_by || '—' }}</p>
                <p class="text-xs text-gray-400 mt-0.5 font-medium">Recorded By</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildAPIUrl } from '../config/api.js'

export default {
  name: 'StudentRaffleResultsView',
  data() {
    return {
      entries: [],
      loading: false,
      error: null,
      categories: [
        { key: 'bronze',   label: 'Bronze',   range: '20–25',   icon: '🥉', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
        { key: 'silver',   label: 'Silver',   range: '26–50',   icon: '🥈', classes: 'bg-slate-50 text-slate-600 border-slate-200' },
        { key: 'gold',     label: 'Gold',     range: '51–80',   icon: '🥇', classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        { key: 'platinum', label: 'Platinum', range: '81–110',  icon: '💎', classes: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
        { key: 'diamond',  label: 'Diamond',  range: '150+', icon: '✨', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
      ]
    }
  },
  computed: {
    totalRural() {
      return this.entries.reduce((sum, e) => sum + (e.rural_count || 0), 0)
    },
    totalEvergood() {
      return this.entries.reduce((sum, e) => sum + (e.evergood_count || 0), 0)
    },
    totalTickets() {
      return this.entries.reduce((sum, e) => sum + (e.ticket_count || 0), 0)
    }
  },
  mounted() {
    this.fetchEntries()
  },
  methods: {
    async fetchEntries() {
      this.loading = true
      this.error = null
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(buildAPIUrl('/apis/student/raffle-ticket'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        const data = await res.json()
        if (res.ok && data.success) {
          this.entries = data.data || []
        } else {
          this.error = data.message || 'Could not load raffle entries.'
        }
      } catch (err) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },
    getCategoryClasses(category) {
      const map = {
        bronze:   'bg-amber-50 text-amber-700 border-amber-200',
        silver:   'bg-slate-50 text-slate-600 border-slate-200',
        gold:     'bg-yellow-50 text-yellow-700 border-yellow-200',
        platinum: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        diamond:  'bg-purple-50 text-purple-700 border-purple-200',
      }
      return map[category] || 'bg-gray-50 text-gray-400 border-gray-200'
    },
    getCategoryIcon(category) {
      const map = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '✨' }
      return map[category] || ''
    },
    capitalize(str) {
      if (!str) return ''
      return str.charAt(0).toUpperCase() + str.slice(1)
    },
    formatDate(date) {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      })
    }
  }
}
</script>
