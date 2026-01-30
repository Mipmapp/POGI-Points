<template>
  <div class="bg-white rounded-lg shadow-lg p-6 space-y-6">
    <!-- Header with Filters -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-purple-900">Contribution Management</h2>
        <p class="text-gray-600 text-sm mt-1">Track and manage student contributions</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="downloadPaymentExcel"
          :disabled="isDownloading"
          class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-70"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19v-7m0 0V5m0 7H5m7 0h7"></path>
          </svg>
          {{ isDownloading ? 'Downloading...' : 'Download Excel' }}
        </button>
        <div class="text-sm text-gray-700 px-2 py-1 bg-white rounded border">{{ filteredCount }} matched</div>
      </div>
    </div>

    <!-- Search and Filters Section -->
    <div class="bg-gray-50 rounded-lg p-4 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Search Student</label>
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Enter Student ID or RFID..."
              @keydown.enter="searchStudent"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
            />
            <svg class="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <button 
            @click="searchStudent"
            class="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
          >
            Search
          </button>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Level</label>
          <select 
            v-model="filterYearLevel"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
          >
            <option value="">All Levels</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Program</label>
          <select 
            v-model="filterProgram"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
          >
            <option value="">All Programs</option>
            <option value="BSCS">BSCS</option>
            <option value="BSIT">BSIT</option>
            <option value="BSIS">BSIS</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Status</label>
          <select 
            v-model="filterStatus"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Student Found Section with Discount -->
    <div v-if="selectedStudent" class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-purple-900">{{ selectedStudent.full_name }}</h3>
          <p class="text-gray-600">ID: {{ selectedStudent.student_id }} | {{ selectedStudent.program }} - {{ selectedStudent.year_level }}</p>
        </div>
        <button 
          @click="selectedStudent = null"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      <!-- Discount Section -->
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-lg p-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Campaign Fee</label>
            <div class="text-2xl font-bold text-purple-600">
              ₱{{ campaignFee.toFixed(2) }}
            </div>
          </div>
          <div class="bg-white rounded-lg p-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Discount</label>
            <div class="flex gap-2 mb-2">
              <button 
                @click="discountType = 'amount'"
                :class="['flex-1 px-3 py-1 rounded text-sm font-medium transition', discountType === 'amount' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']"
              >
                Amount
              </button>
              <button 
                @click="discountType = 'percentage'"
                :class="['flex-1 px-3 py-1 rounded text-sm font-medium transition', discountType === 'percentage' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']"
              >
                Percentage
              </button>
            </div>
            <div class="flex gap-2">
              <input 
                v-model.number="discountValue"
                type="number"
                :placeholder="discountType === 'amount' ? 'Enter amount' : 'Enter %'"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
              <span class="px-3 py-2 bg-gray-200 rounded-lg font-semibold text-gray-700">
                {{ discountType === 'amount' ? '₱' : '%' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="bg-white rounded-lg p-4 border-2 border-green-200">
          <h4 class="font-bold text-gray-900 mb-3">Payment Summary</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-700">Original Amount:</span>
              <span class="font-semibold">₱{{ campaignFee.toFixed(2) }}</span>
            </div>
            <div v-if="discountValue > 0" class="flex justify-between text-orange-600">
              <span>Discount {{ discountType === 'percentage' ? `(${discountValue}%)` : '' }}:</span>
              <span class="font-semibold">-₱{{ calculatedDiscount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between border-t pt-2">
              <span class="font-bold text-purple-900">Target Payment:</span>
              <span class="font-bold text-purple-600 text-lg">₱{{ targetPayment.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Action -->
        <button 
          @click="markAsPayment"
          :disabled="!selectedStudent || isProcessingPaymentGlobal"
          class="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition font-bold disabled:opacity-50 text-center flex items-center justify-center gap-2"
        >
          <svg v-if="isProcessingPaymentGlobal" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.581M20 20v-5h-.581M4 20h16M4 4h16"></path></svg>
          <span v-if="!isProcessingPaymentGlobal">Record Payment</span>
          <span v-else>Processing...</span>
        </button>
      </div>
    </div>

    <!-- Contributions Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gradient-to-r from-purple-600 to-pink-600 text-white sticky top-0">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-bold">Student ID</th>
            <th class="px-4 py-3 text-left text-sm font-bold">Name</th>
            <th class="px-4 py-3 text-left text-sm font-bold">Program</th>
            <th class="px-4 py-3 text-left text-sm font-bold">Level</th>
            <th class="px-4 py-3 text-center text-sm font-bold">Original</th>
            <th class="px-4 py-3 text-center text-sm font-bold">Discount</th>
            <th class="px-4 py-3 text-center text-sm font-bold">Target</th>
            <th class="px-4 py-3 text-center text-sm font-bold">Status</th>
            <th class="px-4 py-3 text-center text-sm font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contribution in filteredContributions" :key="contribution._id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-sm font-medium">{{ contribution.student_id }}</td>
            <td class="px-4 py-3 text-sm">{{ contribution.student_name }}</td>
            <td class="px-4 py-3 text-sm">{{ contribution.program }}</td>
            <td class="px-4 py-3 text-sm">{{ contribution.year_level }}</td>
            <td class="px-4 py-3 text-sm text-right">₱{{ contribution.original_amount?.toFixed(2) || '0.00' }}</td>
            <td class="px-4 py-3 text-sm text-right text-orange-600 font-semibold">
              {{ contribution.discount_value > 0 ? `-₱${contribution.discount_value.toFixed(2)}` : '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-right font-bold text-purple-600">₱{{ contribution.target_amount?.toFixed(2) || '0.00' }}</td>
            <td class="px-4 py-3 text-sm text-center">
              <span :class="['px-3 py-1 rounded-full text-xs font-bold', contribution.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                {{ contribution.payment_status === 'paid' ? 'PAID' : 'UNPAID' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-center space-x-1">
              <button 
                @click="markAsPayment(contribution)"
                v-if="contribution.payment_status !== 'paid'"
                :disabled="processingPaymentId === (contribution._id || contribution.student_id)"
                class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <svg v-if="processingPaymentId === (contribution._id || contribution.student_id)" class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.581M20 20v-5h-.581M4 20h16M4 4h16"></path></svg>
                <span v-if="processingPaymentId !== (contribution._id || contribution.student_id)">Mark Paid</span>
                <span v-else>Processing</span>
              </button>
              <button 
                @click="applyDiscount(contribution)"
                class="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
              >
                Discount
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="contributions.length === 0" class="text-center py-12 text-gray-500">
      <p>No payment records found. Create a payment first or search for a student.</p>
    </div>

    <!-- Download Confirmation Modal -->
    <transition name="fade">
      <div v-if="showDownloadConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div class="absolute inset-0 bg-black bg-opacity-40" @click="showDownloadConfirm = false"></div>
        <div class="relative z-60 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div class="p-5 sm:p-6 lg:p-8">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-lg sm:text-xl font-bold text-gray-900">Confirm Export</h3>
                <p class="text-sm text-gray-600 mt-1">You are exporting the payment records that match the currently applied filters. Review the summary below and confirm to download.</p>
              </div>
              <button @click="showDownloadConfirm = false" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <div class="bg-gray-50 rounded-lg p-3 text-sm">
                <div class="text-xs text-gray-500">Status</div>
                <div class="font-semibold text-gray-900">{{ downloadFiltersSummary.status }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-sm">
                <div class="text-xs text-gray-500">Year</div>
                <div class="font-semibold text-gray-900">{{ downloadFiltersSummary.year }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-sm">
                <div class="text-xs text-gray-500">Program</div>
                <div class="font-semibold text-gray-900">{{ downloadFiltersSummary.program }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-sm flex flex-col">
                <div class="text-xs text-gray-500">Format</div>
                <div class="mt-1 flex items-center gap-3">
                  <label class="inline-flex items-center text-sm">
                    <input type="radio" v-model="downloadFormat" value="xlsx" class="mr-2" /> XLSX
                  </label>
                  <label class="inline-flex items-center text-sm">
                    <input type="radio" v-model="downloadFormat" value="csv" class="mr-2" /> CSV
                  </label>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <div class="text-sm text-gray-500">Preview (first {{ downloadPreviewLimit }} records)</div>
              <div class="mt-2 bg-white border rounded-lg overflow-auto max-h-48">
                <table class="w-full text-sm">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-3 py-2 text-left">Student</th>
                      <th class="px-3 py-2 text-left">ID</th>
                      <th class="px-3 py-2 text-left">Program</th>
                      <th class="px-3 py-2 text-left">Year</th>
                      <th class="px-3 py-2 text-left">Amount</th>
                      <th class="px-3 py-2 text-left">Paid By</th>
                      <th class="px-3 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(c, idx) in filteredContributions.slice(0, downloadPreviewLimit)" :key="c._id || idx" class="border-t">
                      <td class="px-3 py-2">{{ c.student_name }}</td>
                      <td class="px-3 py-2">{{ c.student_id }}</td>
                      <td class="px-3 py-2">{{ c.program || 'N/A' }}</td>
                      <td class="px-3 py-2">{{ c.year_level || 'N/A' }}</td>
                      <td class="px-3 py-2">{{ c.amount_paid ? `₱${c.amount_paid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : (c.original_amount ? `₱${c.original_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '-') }}</td>
                      <td class="px-3 py-2">{{ c.paid_by_treasurer ? (typeof c.paid_by_treasurer === 'string' ? c.paid_by_treasurer : (c.paid_by_treasurer?.first_name || '') + ' ' + (c.paid_by_treasurer?.last_name || '')) : 'Treasurer' }}</td>
                      <td class="px-3 py-2">{{ c.payment_status === 'paid' && c.paid_at ? new Date(c.paid_at).toLocaleString() : 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="mt-5 flex items-center gap-3 justify-end">
              <button @click="showDownloadConfirm = false" class="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
              <button @click="confirmAndExportFilteredExcel" :disabled="isDownloading" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
                <svg v-if="isDownloading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <span>{{ isDownloading ? 'Exporting...' : `Export ${filteredCount} records` }}</span>
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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ssaam-api.vercel.app';

export default {
  name: 'AdminContributionPanel',
  data() {
    return {
      searchQuery: '',
      contributions: [],
      selectedStudent: null,
      campaignFee: 780,
      discountType: 'amount',
      discountValue: 0,
      filterYearLevel: '',
      filterProgram: '',
      filterStatus: '',
      isDownloading: false,
      // Download confirmation modal
      showDownloadConfirm: false,
      downloadPreviewLimit: 5,
      downloadFormat: 'xlsx',
      // Payment processing states
      isProcessingPaymentGlobal: false,
      processingPaymentId: null
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
      return this.contributions.filter(c => {
        const matchesLevel = !this.filterYearLevel || c.year_level === this.filterYearLevel;
        const matchesProgram = !this.filterProgram || c.program === this.filterProgram;
        const matchesStatus = !this.filterStatus || c.payment_status === this.filterStatus;
        return matchesLevel && matchesProgram && matchesStatus;
      });
    },
    // Number of filtered records
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
  mounted() {
    this.loadAllContributions();
  },
  methods: {
    async loadAllContributions() {
      try {
        const token = localStorage.getItem('authToken');
        // Try to fetch contribution records from events
        const response = await fetch(`${API_BASE_URL}/apis/contributions/search?limit=1000&status=paid`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          this.contributions = data.data || [];
        } else {
          // If endpoint doesn't exist, load sample data for demonstration
          this.loadSampleData();
        }
      } catch (error) {
        console.error('Error loading contributions:', error);
        // Load sample data as fallback
        this.loadSampleData();
      }
    },
    loadSampleData() {
      // Sample data to demonstrate the features
      this.contributions = [
        {
          _id: '1',
          student_id: '21-A-00001',
          student_name: 'John Doe',
          program: 'BSCS',
          year_level: '3rd Year',
          original_amount: 780,
          discount_value: 0,
          target_amount: 780,
          payment_status: 'paid',
          paid_at: new Date().toISOString()
        },
        {
          _id: '2',
          student_id: '21-A-00002',
          student_name: 'Maria Cruz',
          program: 'BSIT',
          year_level: '2nd Year',
          original_amount: 780,
          discount_value: 200,
          target_amount: 580,
          payment_status: 'paid',
          paid_at: new Date().toISOString()
        },
        {
          _id: '3',
          student_id: '21-A-00003',
          student_name: 'Robert Santos',
          program: 'BSIS',
          year_level: '1st Year',
          original_amount: 780,
          discount_value: 156,
          target_amount: 624,
          payment_status: 'unpaid',
          paid_at: null
        },
        {
          _id: '4',
          student_id: '21-A-00004',
          student_name: 'Angela Lopez',
          program: 'BSCS',
          year_level: '4th Year',
          original_amount: 780,
          discount_value: 0,
          target_amount: 780,
          payment_status: 'paid',
          paid_at: new Date().toISOString()
        },
        {
          _id: '5',
          student_id: '21-A-00005',
          student_name: 'Carlos Reyes',
          program: 'BSIT',
          year_level: '3rd Year',
          original_amount: 780,
          discount_value: 100,
          target_amount: 680,
          payment_status: 'paid',
          paid_at: new Date().toISOString()
        }
      ];
    },
    async searchStudent() {
      if (!this.searchQuery.trim()) return;

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/apis/students/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
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
    applyDiscount(contribution) {
      // Open discount modal for specific contribution
      console.log('Applying discount to:', contribution._id);
      // Implementation for specific discount management
    },
    async markAsPayment(contribution) {
      if (!this.selectedStudent && !contribution) return;

      // Determine id for row-processing or global processing
      const isRow = !!contribution;
      const processingId = isRow ? (contribution._id || contribution.student_id) : 'global';

      try {
        if (isRow) {
          this.processingPaymentId = processingId;
        } else {
          this.isProcessingPaymentGlobal = true;
        }

        const token = localStorage.getItem('authToken');
        const studentId = this.selectedStudent?.student_id || contribution.student_id;
        
        const response = await fetch(`${API_BASE_URL}/apis/payments/mark-paid`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
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
          // Refresh list
          await this.loadAllContributions();
        } else {
          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Error recording payment', type: 'error' } }));
        }
      } catch (error) {
        console.error('Error recording payment:', error);
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Error recording payment', type: 'error' } }));
      } finally {
        if (isRow) {
          this.processingPaymentId = null;
        } else {
          this.isProcessingPaymentGlobal = false;
        }
      }
    },
    async downloadPaymentExcel() {
      // Open confirmation modal showing filters and count
      if (this.filteredCount === 0) {
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'No records match the selected filters', type: 'warning' } }));
        return;
      }
      this.showDownloadConfirm = true;
    },

    async confirmAndExportFilteredExcel() {
      if (this.isDownloading) return;
      this.isDownloading = true;
      try {
        const records = this.filteredContributions.map(c => ({
          'Student Name': c.student_name,
          'Student ID': c.student_id,
          'Program': c.program || 'N/A',
          'Year Level': c.year_level || 'N/A',
          'Amount': c.amount_paid ? c.amount_paid : (c.original_amount || this.campaignFee),
          'Status': c.payment_status === 'paid' ? 'Paid' : 'Unpaid'
        }));

        const filtersSafe = `${this.downloadFiltersSummary.status}_${this.downloadFiltersSummary.year}_${this.downloadFiltersSummary.program}`.replace(/\s+/g, '')
        const dateSuffix = new Date().toISOString().split('T')[0]

        if (this.downloadFormat === 'csv') {
          const headers = Object.keys(records[0] || {})
          const csvRows = [headers.join(',')]
          records.forEach(r => {
            csvRows.push(headers.map(h => `"${String(r[h] || '')}"`).join(','))
          })
          const csvContent = csvRows.join('\n')
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const a = document.createElement('a')
          const url = URL.createObjectURL(blob)
          a.href = url
          a.download = `Payments_${filtersSafe}_${dateSuffix}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)

          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Exported ${this.filteredCount} payment record(s) (CSV)`, type: 'success' } }));
          this.showDownloadConfirm = false;
        } else {
          // Build workbook (single sheet)
          const workbook = XLSX.utils.book_new();
          const headerRow = [
            { 'Report': 'Payment Records Export' },
            { 'Report': `Filters - Status: ${this.downloadFiltersSummary.status} | Year: ${this.downloadFiltersSummary.year} | Program: ${this.downloadFiltersSummary.program}` },
            { 'Report': `Total Records: ${this.filteredCount}` },
            { 'Report': `Exported: ${new Date().toLocaleString('en-PH')}` },
            { 'Report': '' }
          ];

          const wsHeader = XLSX.utils.json_to_sheet(headerRow, { header: ['Report'] });
          const dataStartRow = headerRow.length + 1;
          XLSX.utils.sheet_add_json(wsHeader, records, { origin: `A${dataStartRow}` });

          // Explicit column widths to reduce empty space
          wsHeader['!cols'] = [
            { wch: 25 }, // Student Name
            { wch: 9 },  // Student ID
            { wch: 7 },  // Program
            { wch: 8 },  // Year Level
            { wch: 7 },  // Amount
            { wch: 6 }   // Status
          ];

          XLSX.utils.book_append_sheet(workbook, wsHeader, 'Payments');

          const filename = `Payments_${filtersSafe}_${dateSuffix}.xlsx`;
          XLSX.writeFile(workbook, filename);

          window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: `Exported ${this.filteredCount} payment record(s)`, type: 'success' } }));
          this.showDownloadConfirm = false;
        }
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
table {
  border-collapse: collapse;
}

th, td {
  border: 1px solid #e5e7eb;
}
.modal-slide-enter-active, .modal-slide-leave-active { transition: all 0.22s ease; }
.modal-slide-enter-from { opacity: 0; transform: translateY(6px) scale(0.98); }
.modal-slide-enter-to { opacity: 1; transform: translateY(0) scale(1); }
.modal-slide-leave-from { opacity: 1; transform: translateY(0) scale(1); }
.modal-slide-leave-to { opacity: 0; transform: translateY(6px) scale(0.98); }

@media (max-width: 640px) {
  .max-w-2xl { max-width: 92% !important; }
}
</style>
