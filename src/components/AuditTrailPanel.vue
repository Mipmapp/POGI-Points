<template>
  <div class="space-y-4">

    <!-- Header card -->
    <div :class="['rounded-3xl shadow-xl border overflow-hidden', isCOE ? 'border-orange-100' : isSOM ? 'border-green-100' : isCNAHS ? 'border-green-100' : 'border-blue-100']">
      <div :class="['px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3', isCOE ? 'bg-gradient-to-r from-orange-700 to-red-600' : isSOM ? 'bg-gradient-to-r from-green-700 to-yellow-600' : isCNAHS ? 'bg-gradient-to-r from-green-800 to-green-600' : 'bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400']">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h2 class="text-white font-bold text-base leading-tight">
              {{ isTreasurer ? 'My Audit Trail' : 'College Audit Trail' }}
            </h2>
            <p class="text-white/70 text-xs mt-0.5">
              {{ isTreasurer ? 'Your recorded actions in the system' : 'All admin actions for ' + collegeName }}
            </p>
          </div>
        </div>
        <button @click="fetchLogs" :disabled="loading"
          class="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-4 py-2 rounded-full transition-all duration-200 border border-white/20 flex-shrink-0">
          <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Stats strip -->
      <div class="bg-white grid grid-cols-3 divide-x divide-gray-100">
        <div class="px-4 py-3 text-center">
          <p class="text-lg font-bold" :class="themeText">{{ totalLogs }}</p>
          <p class="text-xs text-gray-500">Total Actions</p>
        </div>
        <div class="px-4 py-3 text-center">
          <p class="text-lg font-bold" :class="themeText">{{ todayLogs }}</p>
          <p class="text-xs text-gray-500">Today</p>
        </div>
        <div class="px-4 py-3 text-center">
          <p class="text-lg font-bold" :class="themeText">{{ uniqueAdmins }}</p>
          <p class="text-xs text-gray-500">{{ isTreasurer ? 'Actions This Week' : 'Admins Active' }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="searchQuery" type="text" placeholder="Search by action or target…"
          class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-green-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition" />
      </div>
      <select v-model="filterAction"
        class="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-green-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition min-w-0 sm:min-w-[160px]">
        <option value="">All Actions</option>
        <optgroup label="Payments">
          <option value="PAYMENT_MARKED_PAID">Marked Paid</option>
          <option value="PAYMENT_MARKED_UNPAID">Marked Unpaid</option>
          <option value="PAYMENT_CREATED">Payment Created</option>
          <option value="PAYMENT_DELETED">Payment Deleted</option>
          <option value="PAYMENT_STATUS_UPDATED">Status Updated</option>
          <option value="PAYMENT_UPDATED">Payment Updated</option>
          <option value="PAYMENT_STUDENT_REMOVED">Student Removed from Payment</option>
        </optgroup>
        <optgroup label="Student Management">
          <option value="STUDENT_APPROVED">Student Approved</option>
          <option value="STUDENT_REJECTED">Student Rejected</option>
          <option value="STUDENT_UPDATED">Student Profile Updated</option>
          <option value="STUDENT_DELETED">Student Deleted</option>
          <option value="STUDENT_RFID_UPDATED">RFID Assigned</option>
          <option value="STUDENT_ROLE_UPDATED">Role Changed</option>
        </optgroup>
        <optgroup label="Attendance">
          <option value="EVENT_CREATED">Event Created</option>
          <option value="EVENT_UPDATED">Event Updated</option>
          <option value="EVENT_DELETED">Event Deleted</option>
          <option value="SESSION_CREATED">Session Added</option>
          <option value="SESSION_UPDATED">Session Updated</option>
          <option value="SESSION_DELETED">Session Deleted</option>
        </optgroup>
      </select>
      <select v-model="filterDate"
        class="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-green-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition min-w-0 sm:min-w-[130px]">
        <option value="">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center gap-3">
      <svg class="w-8 h-8 animate-spin" :class="themeText" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p class="text-sm text-gray-500">Loading audit trail…</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <svg class="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-sm text-red-700 font-medium">{{ error }}</p>
      <button @click="fetchLogs" class="mt-3 text-xs text-red-600 underline hover:no-underline">Try again</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && filteredLogs.length === 0" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center gap-3">
      <div :class="['w-16 h-16 rounded-full flex items-center justify-center', isCOE ? 'bg-orange-50' : isSOM ? 'bg-green-50' : isCNAHS ? 'bg-green-50' : 'bg-blue-50']">
        <svg class="w-8 h-8" :class="themeText" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-sm font-semibold text-gray-700">No audit logs found</p>
      <p class="text-xs text-gray-400 text-center max-w-xs">
        {{ searchQuery || filterAction || filterDate ? 'Try clearing your filters.' : 'Logs will appear here as actions are taken in the system.' }}
      </p>
    </div>

    <!-- Log list -->
    <div v-else class="space-y-2">
      <!-- Result count -->
      <p class="text-xs text-gray-400 px-1">Showing {{ filteredLogs.length }} of {{ totalLogs }} entries</p>

      <!-- Timeline entries -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="divide-y divide-gray-50">
          <div v-for="(log, index) in paginatedLogs" :key="log._id || index"
            class="px-4 py-3.5 hover:bg-gray-50/60 transition-colors duration-150 flex items-start gap-3">

            <!-- Action icon badge -->
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', actionStyle(log.action).bg]">
              <svg class="w-4 h-4" :class="actionStyle(log.action).icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="actionStyle(log.action).path" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">

              <!-- Top row: action label + timestamp -->
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-semibold text-gray-800 leading-tight">{{ actionLabel(log.action) }}</p>
                <div class="flex-shrink-0 text-right">
                  <p class="text-xs text-gray-400 whitespace-nowrap">{{ formatRelative(log.timestamp) }}</p>
                  <p class="text-xs text-gray-300 whitespace-nowrap">{{ formatFull(log.timestamp) }}</p>
                </div>
              </div>

              <!-- Campaign / target -->
              <p v-if="log.target_label || log.target_id" class="text-xs font-medium text-gray-600 truncate mt-0.5">
                {{ log.target_label || log.target_id }}
                <span v-if="log.details?.amount_paid" class="font-semibold text-gray-700"> · ₱{{ formatAmount(log.details.amount_paid) }}</span>
              </p>

              <!-- Student info row (name + ID) for payment actions -->
              <div v-if="log.details?.student_name || log.details?.student_id" class="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="text-xs font-semibold text-gray-700">{{ log.details.student_name || log.details.student_id }}</span>
                <span v-if="log.details.student_id && log.details.student_name && log.details.student_id !== log.details.student_name"
                  class="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                  {{ log.details.student_id }}
                </span>
              </div>

              <!-- Tags row: payment method + notes (skip generic note) -->
              <div class="mt-1 flex flex-wrap gap-1">
                <span v-if="log.details?.payment_method"
                  class="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
                  {{ log.details.payment_method }}
                </span>
                <span v-if="log.details?.notes && log.details.notes !== 'Payment recorded via admin panel'"
                  class="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 max-w-[200px] truncate">
                  "{{ log.details.notes }}"
                </span>
              </div>

              <!-- Admin who performed the action (shown for all roles) -->
              <div v-if="log.admin_name || log.admin_full_name" class="mt-1.5 flex items-center gap-2">
                <img
                  v-if="log.admin_photo"
                  :src="log.admin_photo"
                  :alt="log.admin_full_name || log.admin_name"
                  class="w-6 h-6 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  @error="e => e.target.style.display='none'"
                />
                <div v-else :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0', isCOE ? 'bg-orange-500' : isSOM ? 'bg-green-600' : isCNAHS ? 'bg-green-700' : 'bg-blue-500']">
                  {{ initials(log.admin_full_name || log.admin_name) }}
                </div>
                <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span class="text-[11px] font-semibold text-gray-700 truncate">{{ log.admin_full_name || log.admin_name }}</span>
                  <span v-if="log.admin_student_id" class="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{{ log.admin_student_id }}</span>
                  <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0', roleBadge(log.admin_role).bg, roleBadge(log.admin_role).text]">
                    {{ roleBadge(log.admin_role).label }}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-1 px-1">
        <button @click="page = Math.max(1, page - 1)" :disabled="page === 1"
          class="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          ← Prev
        </button>
        <p class="text-xs text-gray-400">Page {{ page }} of {{ totalPages }}</p>
        <button @click="page = Math.min(totalPages, page + 1)" :disabled="page === totalPages"
          class="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Next →
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCollege } from '../composables/useCollege.js'
import { buildAPIUrl, getDefaultHeaders } from '../config/api.js'

const { isCOE, isSOM, isCNAHS } = useCollege()

const props = defineProps({
  currentUser: { type: Object, default: () => ({}) }
})

const logs = ref([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const filterAction = ref('')
const filterDate = ref('')
const page = ref(1)
const PAGE_SIZE = 20

const isTreasurer = computed(() => props.currentUser?.role === 'treasurer')

const collegeName = computed(() => {
  if (isCOE.value) return 'COE'
  if (isSOM.value) return 'SOM'
  if (isCNAHS.value) return 'CNAHS'
  return 'CCS'
})

const themeText = computed(() => {
  if (isCOE.value) return 'text-orange-600'
  if (isSOM.value) return 'text-green-700'
  if (isCNAHS.value) return 'text-green-700'
  return 'text-blue-600'
})

async function fetchLogs() {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    const headers = { ...getDefaultHeaders(), 'Authorization': `Bearer ${token}` }
    const res = await fetch(buildAPIUrl('/apis/audit-trail'), { headers })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Error ${res.status}`)
    }
    const data = await res.json()
    logs.value = data.data || []
  } catch (e) {
    error.value = e.message || 'Failed to load audit trail'
  } finally {
    loading.value = false
  }
}

const filteredLogs = computed(() => {
  let result = logs.value
  if (filterAction.value) {
    result = result.filter(l => l.action === filterAction.value)
  }
  if (filterDate.value) {
    const now = new Date()
    result = result.filter(l => {
      const ts = new Date(l.timestamp)
      if (filterDate.value === 'today') {
        return ts.toDateString() === now.toDateString()
      }
      if (filterDate.value === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
        return ts >= weekAgo
      }
      if (filterDate.value === 'month') {
        const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1)
        return ts >= monthAgo
      }
      return true
    })
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(l =>
      actionLabel(l.action).toLowerCase().includes(q) ||
      (l.target_label || '').toLowerCase().includes(q) ||
      (l.admin_name || '').toLowerCase().includes(q) ||
      (l.admin_full_name || '').toLowerCase().includes(q) ||
      (l.details?.student_name || '').toLowerCase().includes(q) ||
      (l.details?.student_id || '').toLowerCase().includes(q)
    )
  }
  return result
})

const totalLogs = computed(() => logs.value.length)

const todayLogs = computed(() => {
  const today = new Date().toDateString()
  return logs.value.filter(l => new Date(l.timestamp).toDateString() === today).length
})

const uniqueAdmins = computed(() => {
  if (isTreasurer.value) {
    const now = new Date()
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
    return logs.value.filter(l => new Date(l.timestamp) >= weekAgo).length
  }
  return new Set(logs.value.map(l => l.admin_id)).size
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / PAGE_SIZE)))

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredLogs.value.slice(start, start + PAGE_SIZE)
})

watch([searchQuery, filterAction, filterDate], () => { page.value = 1 })

function actionLabel(action) {
  const labels = {
    PAYMENT_MARKED_PAID: 'Marked as Paid',
    PAYMENT_MARKED_UNPAID: 'Marked as Unpaid',
    PAYMENT_CREATED: 'Payment Campaign Created',
    PAYMENT_DELETED: 'Payment Campaign Deleted',
    PAYMENT_STATUS_UPDATED: 'Campaign Status Updated',
    PAYMENT_UPDATED: 'Payment Campaign Updated',
    PAYMENT_STUDENT_REMOVED: 'Student Removed from Payment',
    STUDENT_APPROVED: 'Student Approved',
    STUDENT_REJECTED: 'Student Rejected',
    STUDENT_UPDATED: 'Student Profile Updated',
    STUDENT_DELETED: 'Student Deleted',
    STUDENT_RFID_UPDATED: 'RFID Assigned',
    STUDENT_ROLE_UPDATED: 'Student Role Changed',
    EVENT_CREATED: 'Attendance Event Created',
    EVENT_UPDATED: 'Attendance Event Updated',
    EVENT_DELETED: 'Attendance Event Deleted',
    SESSION_CREATED: 'Session Added',
    SESSION_UPDATED: 'Session Updated',
    SESSION_DELETED: 'Session Deleted',
  }
  return labels[action] || action
}

function actionStyle(action) {
  const styles = {
    PAYMENT_MARKED_PAID: {
      bg: 'bg-green-100', icon: 'text-green-600',
      path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    PAYMENT_MARKED_UNPAID: {
      bg: 'bg-red-100', icon: 'text-red-500',
      path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    PAYMENT_CREATED: {
      bg: 'bg-blue-100', icon: 'text-blue-600',
      path: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    PAYMENT_DELETED: {
      bg: 'bg-orange-100', icon: 'text-orange-600',
      path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    },
    PAYMENT_STATUS_UPDATED: {
      bg: 'bg-purple-100', icon: 'text-purple-600',
      path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    },
    PAYMENT_UPDATED: {
      bg: 'bg-yellow-100', icon: 'text-yellow-600',
      path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    },
    PAYMENT_STUDENT_REMOVED: {
      bg: 'bg-gray-100', icon: 'text-gray-500',
      path: 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6'
    },
    STUDENT_APPROVED: {
      bg: 'bg-green-100', icon: 'text-green-600',
      path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    STUDENT_REJECTED: {
      bg: 'bg-red-100', icon: 'text-red-500',
      path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    STUDENT_UPDATED: {
      bg: 'bg-yellow-100', icon: 'text-yellow-600',
      path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    },
    STUDENT_DELETED: {
      bg: 'bg-red-100', icon: 'text-red-600',
      path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    },
    STUDENT_RFID_UPDATED: {
      bg: 'bg-indigo-100', icon: 'text-indigo-600',
      path: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
    },
    STUDENT_ROLE_UPDATED: {
      bg: 'bg-purple-100', icon: 'text-purple-600',
      path: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
    },
    EVENT_CREATED: {
      bg: 'bg-blue-100', icon: 'text-blue-600',
      path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    EVENT_UPDATED: {
      bg: 'bg-cyan-100', icon: 'text-cyan-600',
      path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    EVENT_DELETED: {
      bg: 'bg-orange-100', icon: 'text-orange-600',
      path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    },
    SESSION_CREATED: {
      bg: 'bg-teal-100', icon: 'text-teal-600',
      path: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    SESSION_UPDATED: {
      bg: 'bg-teal-50', icon: 'text-teal-500',
      path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    },
    SESSION_DELETED: {
      bg: 'bg-orange-50', icon: 'text-orange-500',
      path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    },
  }
  return styles[action] || { bg: 'bg-gray-100', icon: 'text-gray-500', path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
}

function roleBadge(role) {
  if (role === 'treasurer') return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Treasurer' }
  if (role === 'co-admin') return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Co-Admin' }
  if (role === 'admin' || role === 'administrator') return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' }
  if (role === 'info') return { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Info' }
  return { bg: 'bg-gray-100', text: 'text-gray-600', label: role || 'Admin' }
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatAmount(val) {
  return Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatRelative(ts) {
  if (!ts) return '—'
  const now = new Date()
  const d = new Date(ts)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatFull(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(fetchLogs)
</script>
