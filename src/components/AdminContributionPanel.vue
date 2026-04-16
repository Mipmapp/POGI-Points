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

      <!-- Search & Filters -->
      <div class="px-4 sm:px-6 md:px-8 py-5 space-y-4">
        <!-- Search Row -->
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Enter Student ID or RFID..."
              @keydown.enter="searchStudent"
              class="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none text-sm bg-gray-50 focus:bg-white transition"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button
            @click="searchStudent"
            class="px-5 py-2.5 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-200 whitespace-nowrap"
          >
            Search
          </button>
        </div>

        <!-- Filter Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        </div>
      </div>
    </div>

    <!-- Selected Student Payment Card -->
    <div v-if="selectedStudent" class="bg-white rounded-3xl shadow-xl border border-blue-200 overflow-hidden">
      <div class="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {{ (selectedStudent.full_name || selectedStudent.first_name || '?').charAt(0).toUpperCase() }}
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

        <!-- Record Payment Button -->
        <button
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

    <!-- Contributions List -->
    <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="px-5 sm:px-6 md:px-8 py-4 border-b border-gray-100 flex items-center gap-2">
        <div class="w-1 h-5 rounded-full bg-blue-600"></div>
        <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Payment Records</h3>
        <span class="ml-auto text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">{{ filteredContributions.length }}</span>
      </div>

      <!-- Empty State -->
      <div v-if="filteredContributions.length === 0" class="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div class="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
        <p class="text-gray-500 font-semibold text-sm">No payment records found</p>
        <p class="text-gray-400 text-xs mt-1">Create a payment campaign first or adjust your filters</p>
      </div>

      <!-- Mobile Card View -->
      <div v-else class="block md:hidden divide-y divide-gray-100">
        <div v-for="c in filteredContributions" :key="c._id" class="p-4 hover:bg-gray-50 transition">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-ssaam-dark to-ssaam-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {{ (c.student_name || '?').charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-bold text-gray-900 text-sm truncate">{{ c.student_name }}</p>
                <p class="text-gray-400 text-xs truncate">{{ c.student_id }}</p>
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
          <div v-if="c.payment_status !== 'paid'" class="flex gap-2">
            <button
              @click="markAsPayment(c)"
              :disabled="processingPaymentId === (c._id || c.student_id)"
              class="flex-1 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-xs font-bold transition hover:from-green-600 hover:to-green-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <svg v-if="processingPaymentId === (c._id || c.student_id)" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {{ processingPaymentId === (c._id || c.student_id) ? 'Processing...' : 'Mark as Paid' }}
            </button>
            <button @click="applyDiscount(c)" class="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition hover:bg-blue-100">
              Discount
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gradient-to-r from-ssaam-dark to-ssaam-light">
              <th class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Student ID</th>
              <th class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
              <th class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Program</th>
              <th class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Year</th>
              <th class="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Original</th>
              <th class="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Discount</th>
              <th class="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Target</th>
              <th class="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="filteredContributions.length === 0">
              <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">
                No records match the current filters.
              </td>
            </tr>
            <tr v-for="c in filteredContributions" :key="c._id" class="hover:bg-blue-50/40 transition-colors">
              <td class="px-4 py-3 text-sm font-semibold text-gray-700">{{ c.student_id }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 font-medium">{{ c.student_name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ c.program || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ c.year_level || '—' }}</td>
              <td class="px-4 py-3 text-sm text-right text-gray-700">₱{{ c.original_amount?.toFixed(2) || '0.00' }}</td>
              <td class="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                {{ c.discount_value > 0 ? `–₱${c.discount_value.toFixed(2)}` : '—' }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-extrabold text-blue-700">₱{{ c.target_amount?.toFixed(2) || '0.00' }}</td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-bold', c.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600']">
                  {{ c.payment_status === 'paid' ? 'PAID' : 'UNPAID' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    v-if="c.payment_status !== 'paid'"
                    @click="markAsPayment(c)"
                    :disabled="processingPaymentId === (c._id || c.student_id)"
                    class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-60 flex items-center gap-1"
                  >
                    <svg v-if="processingPaymentId === (c._id || c.student_id)" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    <span>{{ processingPaymentId === (c._id || c.student_id) ? '...' : 'Mark Paid' }}</span>
                  </button>
                  <span v-else class="text-green-600 text-xs font-bold">✓ Paid</span>
                  <button @click="applyDiscount(c)" class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition">
                    Discount
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Contribution Event Modal -->
    <transition name="fade">
      <div v-if="showCreateEventModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
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

            <!-- Info Banner -->
            <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-sm text-blue-700">This will create a payment campaign and automatically assign it to <strong>all approved students</strong>. You can then track and mark individual payments.</p>
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

    <!-- Download Confirmation Modal -->
    <transition name="fade">
      <div v-if="showDownloadConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
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
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
import { buildAPIUrl, getCollege } from '../config/api.js'

export default {
  name: 'AdminContributionPanel',
  data() {
    return {
      searchQuery: '',
      contributions: [],
      selectedStudent: null,
      activePayment: null,
      campaignFee: 0,
      discountType: 'amount',
      discountValue: 0,
      filterYearLevel: '',
      filterProgram: '',
      filterStatus: '',
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
      newEventForm: {
        title: '',
        description: '',
        amount_due: '',
        type: 'fee',
        deadline: ''
      }
    };
  },
  computed: {
    calculatedDiscount() {
      if (this.discountType === 'percentage') {
        return (this.campaignFee * this.discountValue) / 100;
      }
      return Math.min(this.discountValue, this.campaignFee);
    },
    targetPayment() {
      return Math.max(0, this.campaignFee - this.calculatedDiscount);
    },
    filteredContributions() {
      const fs = (this.filterStatus || '').toString().toLowerCase();
      const fy = this.filterYearLevel;
      const fp = this.filterProgram;

      return this.contributions.filter(c => {
        const cStatus = (c.payment_status || '').toString().toLowerCase();
        const matchesLevel = !fy || c.year_level === fy;
        const matchesProgram = !fp || (c.program || '').toString() === fp;

        let matchesStatus = true;
        if (fs) {
          if (fs === 'unpaid') {
            matchesStatus = !cStatus || cStatus !== 'paid';
          } else {
            matchesStatus = cStatus === fs;
          }
        }

        return matchesLevel && matchesProgram && matchesStatus;
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
    }
  },
  watch: {
    filterStatus() { this.loadAllContributions(); },
    filterProgram() { this.loadAllContributions(); },
    filterYearLevel() { this.loadAllContributions(); }
  },
  mounted() {
    this.loadActivePayment();
    this.loadAllContributions();
  },
  methods: {
    async loadActivePayment() {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildAPIUrl('/apis/payments'), {
          headers: { 'Authorization': `Bearer ${token}`, 'X-SSAAM-College': getCollege() }
        });
        if (response.ok) {
          const data = await response.json();
          const payments = (data.payments || data.data || []).filter(p => p.amount_due > 0);
          if (payments.length > 0) {
            this.activePayment = payments[0];
            this.campaignFee = payments[0].amount_due;
          }
        }
      } catch (e) {
        console.error('Error loading active payment:', e);
      }
    },
    async loadAllContributions() {
      try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams();
        params.set('limit', '1000');
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
          this.contributions = data.data || [];
          this.serverFilteredCount = data.pagination ? data.pagination.total : this.contributions.length;
        } else {
          this.loadSampleData();
        }
      } catch (error) {
        console.error('Error loading contributions:', error);
        this.loadSampleData();
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
      if (!this.searchQuery.trim()) return;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildAPIUrl('/apis/students/search'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ search_query: this.searchQuery })
        });
        if (response.ok) {
          const data = await response.json();
          this.selectedStudent = data.student;
          this.discountValue = 0;
        } else {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Student not found', type: 'warning' } }));
          this.selectedStudent = null;
        }
      } catch (error) {
        console.error('Error searching student:', error);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Error searching student', type: 'error' } }));
      }
    },
    closeCreateEventModal() {
      this.showCreateEventModal = false;
      this.createEventError = '';
      this.newEventForm = { title: '', description: '', amount_due: '', type: 'fee', deadline: '' };
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
          deadline: this.newEventForm.deadline || null
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
          this.loadActivePayment();
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
      console.log('Applying discount to:', contribution._id);
    },
    async markAsPayment(contribution) {
      if (!this.selectedStudent && !contribution) return;
      const isRow = !!contribution;
      const processingId = isRow ? (contribution._id || contribution.student_id) : 'global';
      try {
        if (isRow) { this.processingPaymentId = processingId; }
        else { this.isProcessingPaymentGlobal = true; }

        const token = localStorage.getItem('authToken');
        const studentId = this.selectedStudent?.student_id || contribution.student_id;
        const response = await fetch(buildAPIUrl('/apis/payments/mark-paid'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            amount_paid: this.targetPayment,
            discount_value: this.calculatedDiscount,
            discount_type: this.discountType,
            notes: 'Payment recorded via admin panel'
          })
        });
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Payment recorded successfully', type: 'success' } }));
          this.discountValue = 0;
          this.selectedStudent = null;
          await this.loadAllContributions();
        } else {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Error recording payment', type: 'error' } }));
        }
      } catch (error) {
        console.error('Error recording payment:', error);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Error recording payment', type: 'error' } }));
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
</style>
