<template>
  <div>
    <transition name="fade">
      <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeModal">
        <transition name="modal-bounce" appear>
          <div class="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">
            <div class="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4 flex justify-between items-center">
              <h2 class="text-2xl font-bold text-white">Contribution Tracking</h2>
              <button @click="closeModal" class="text-white hover:text-purple-200">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="flex-1 overflow-hidden flex flex-col bg-white">
              <div class="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
                <div class="bg-white p-3 rounded text-center">
                  <p class="text-sm text-gray-600">Total</p>
                  <p class="text-2xl font-bold text-purple-600">{{ stats.total }}</p>
                </div>
                <div class="bg-white p-3 rounded text-center">
                  <p class="text-sm text-gray-600">Paid</p>
                  <p class="text-2xl font-bold text-green-600">{{ stats.paid }}</p>
                </div>
                <div class="bg-white p-3 rounded text-center">
                  <p class="text-sm text-gray-600">Unpaid</p>
                  <p class="text-2xl font-bold text-red-600">{{ stats.unpaid }}</p>
                </div>
                <div class="bg-white p-3 rounded text-center">
                  <p class="text-sm text-gray-600">Rate</p>
                  <p class="text-2xl font-bold text-blue-600">{{ completionRate }}%</p>
                </div>
              </div>
              <div class="overflow-y-auto">
                <table class="w-full">
                  <thead class="bg-gray-100 sticky top-0">
                    <tr>
                      <th class="px-4 py-2 text-left text-sm">ID</th>
                      <th class="px-4 py-2 text-left text-sm">Name</th>
                      <th class="px-4 py-2 text-left text-sm">Program</th>
                      <th class="px-4 py-2 text-left text-sm">Year</th>
                      <th class="px-4 py-2 text-center text-sm">Receipt</th>
                      <th class="px-4 py-2 text-center text-sm">Status</th>
                      <th class="px-4 py-2 text-center text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in filteredContributions" :key="c._id" class="border-b hover:bg-gray-50">
                      <td class="px-4 py-2 text-sm">{{ c.student_id_number }}</td>
                      <td class="px-4 py-2 text-sm">{{ c.student_name }}</td>
                      <td class="px-4 py-2 text-sm">{{ c.program }}</td>
                      <td class="px-4 py-2 text-sm">{{ c.year_level }}</td>
                      <td class="px-4 py-2 text-center">
                        <button v-if="c.receipt_url || c.proof_of_payment" @click="viewReceipt(c)" class="text-blue-600 hover:underline text-sm">View</button>
                        <span v-else class="text-gray-400 text-sm">N/A</span>
                      </td>
                      <td class="px-4 py-2 text-center">
                        <span :class="[c.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800', 'px-2 py-1 rounded text-xs']">
                          {{ c.payment_status === 'paid' ? 'PAID' : 'UNPAID' }}
                        </span>
                      </td>
                      <td class="px-4 py-2 text-center space-x-1">
                        <button v-if="c.payment_status !== 'paid'" @click="markAsPaid(c)" class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Paid</button>
                        <button v-else @click="markAsUnpaid(c)" class="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Reset</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showReceiptModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showReceiptModal = false">
        <transition name="modal-bounce" appear>
          <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4 flex justify-between items-center">
              <h2 class="text-2xl font-bold text-white">Receipt</h2>
              <button @click="showReceiptModal = false" class="text-white hover:text-purple-200">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="p-6">
              <div v-if="selectedReceipt && (selectedReceipt.receipt_url || selectedReceipt.proof_of_payment)" class="space-y-4">
                <div class="space-y-2 text-sm">
                  <p><strong>Student:</strong> {{ selectedReceipt.student_name }}</p>
                  <p><strong>ID:</strong> {{ selectedReceipt.student_id_number }}</p>
                  <p><strong>Status:</strong> {{ selectedReceipt.payment_status }}</p>
                </div>
                <img :src="selectedReceipt.receipt_url || selectedReceipt.proof_of_payment" class="max-w-full rounded border" @error="receiptLoadError = true" />
                <div v-if="receiptLoadError" class="text-center text-gray-500 py-8">Could not load image</div>
                <button @click="downloadReceipt" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Download</button>
              </div>
              <div v-else class="text-center py-12 text-gray-500">No receipt available</div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import API_BASE_URL from '../config/api'

export default {
  name: 'ContributionsModal',
  props: {
    visible: { type: Boolean, default: false },
    eventId: { type: String, required: true },
    eventTitle: { type: String, default: 'Event Contributions' }
  },
  data() {
    return {
      contributions: [],
      searchQuery: '',
      filterStatus: '',
      currentPage: 1,
      itemsPerPage: 50,
      totalContributions: 0,
      totalPages: 1,
      initialized: false,
      showReceiptModal: false,
      selectedReceipt: null,
      receiptLoadError: false,
      stats: { total: 0, paid: 0, unpaid: 0 },
      isLoading: false
    }
  },
  computed: {
    completionRate() {
      return this.stats.total === 0 ? 0 : Math.round((this.stats.paid / this.stats.total) * 100)
    },
    filteredContributions() {
      return this.contributions.filter(c => {
        const matchesSearch = !this.searchQuery || c.student_name.toLowerCase().includes(this.searchQuery.toLowerCase()) || c.student_id_number.includes(this.searchQuery)
        const matchesStatus = !this.filterStatus || c.payment_status === this.filterStatus
        return matchesSearch && matchesStatus
      })
    }
  },
  watch: {
    visible(newVal) { if (newVal) this.loadContributions() }
  },
  methods: {
    async loadContributions() {
      // Prevent multiple simultaneous loads
      if (this.isLoading) return
      
      this.isLoading = true
      try {
        const token = localStorage.getItem('authToken')
        const query = new URLSearchParams({ page: this.currentPage, limit: this.itemsPerPage, paymentStatus: this.filterStatus, search: this.searchQuery })
        const response = await fetch(`${API_BASE_URL}/apis/contributions/event/${this.eventId}?${query}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        const data = await response.json()
        if (response.ok) {
          this.contributions = data.data || []
          this.stats = data.stats || { total: 0, paid: 0, unpaid: 0 }
          this.totalContributions = data.pagination?.total || 0
          this.totalPages = data.pagination?.totalPages || 1
          this.initialized = this.stats.total > 0
        } else {
          console.error('Error loading contributions:', data)
          this.contributions = []
        }
      } catch (err) {
        console.error('Error loading contributions:', err)
        this.contributions = []
      } finally {
        this.isLoading = false
      }
    },
    async markAsPaid(contribution) {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${API_BASE_URL}/apis/contributions/event/${this.eventId}/mark-paid`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id_number: contribution.student_id_number })
        })
        if (response.ok) {
          this.loadContributions()
        }
      } catch (err) {
        console.error('Error marking as paid:', err)
      }
    },
    async markAsUnpaid(contribution) {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${API_BASE_URL}/apis/contributions/event/${this.eventId}/mark-unpaid`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id_number: contribution.student_id_number })
        })
        if (response.ok) {
          this.loadContributions()
        }
      } catch (err) {
        console.error('Error marking as unpaid:', err)
      }
    },
    closeModal() {
      this.$emit('close')
    },
    viewReceipt(contribution) {
      this.selectedReceipt = contribution
      this.receiptLoadError = false
      this.showReceiptModal = true
    },
    downloadReceipt() {
      if (this.selectedReceipt && (this.selectedReceipt.receipt_url || this.selectedReceipt.proof_of_payment)) {
        const url = this.selectedReceipt.receipt_url || this.selectedReceipt.proof_of_payment
        const link = document.createElement('a')
        link.href = url
        link.download = `receipt-${this.selectedReceipt.student_id_number}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-bounce-enter-active { animation: modalBounce 0.3s ease; }

@keyframes modalBounce {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
