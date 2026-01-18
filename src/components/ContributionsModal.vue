<template>
  <transition name="fade">
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">
          <!-- Header -->
          <div class="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4 flex justify-between items-center rounded-t-lg">
            <div>
              <h2 class="text-2xl font-bold text-white">Contribution Tracking</h2>
              <p class="text-purple-100 text-sm">{{ eventTitle }}</p>
            </div>
            <button @click="closeModal" class="text-white hover:text-purple-200 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Main Content -->
          <div class="flex-1 overflow-hidden flex flex-col">
            <!-- Stats Bar -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 grid grid-cols-4 gap-4">
              <div class="bg-white p-3 rounded-lg text-center">
                <p class="text-gray-600 text-sm">Total Students</p>
                <p class="text-2xl font-bold text-purple-600">{{ stats.total }}</p>
              </div>
              <div class="bg-white p-3 rounded-lg text-center">
                <p class="text-gray-600 text-sm">Paid</p>
                <p class="text-2xl font-bold text-green-600">{{ stats.paid }}</p>
              </div>
              <div class="bg-white p-3 rounded-lg text-center">
                <p class="text-gray-600 text-sm">Unpaid</p>
                <p class="text-2xl font-bold text-red-600">{{ stats.unpaid }}</p>
              </div>
              <div class="bg-white p-3 rounded-lg text-center">
                <p class="text-gray-600 text-sm">Completion Rate</p>
                <p class="text-2xl font-bold text-blue-600">{{ completionRate }}%</p>
              </div>
            </div>

            <!-- Search and Filter Bar -->
            <div class="bg-white px-6 py-4 border-b border-gray-200 flex gap-4 items-center flex-wrap">
              <div class="flex-1 min-w-60">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search by name or student ID..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                v-model="filterStatus"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <button
                @click="exportData"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Export
              </button>
              <button
                @click="initializeContributions"
                v-if="!initialized"
                class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Initialize Records
              </button>
            </div>

            <!-- Students Table -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
              <div v-if="loadingContributions" class="flex items-center justify-center h-64">
                <div class="text-center">
                  <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p class="text-gray-600">Loading contribution data...</p>
                </div>
              </div>
              <div v-else-if="filteredContributions.length === 0" class="flex items-center justify-center h-64">
                <p class="text-gray-600 text-center">No students found matching your filters</p>
              </div>
              <table v-else class="w-full">
                <thead class="sticky top-0 bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student ID</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Program</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Year Level</th>
                    <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                    <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(contribution, index) in filteredContributions"
                    :key="contribution._id"
                    :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                    class="border-b border-gray-200 hover:bg-purple-50 transition"
                  >
                    <td class="px-4 py-3 text-sm text-gray-900">{{ contribution.student_id_number }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">{{ contribution.student_name }}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">{{ contribution.program }}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">{{ contribution.year_level }}</td>
                    <td class="px-4 py-3 text-center">
                      <span
                        :class="contribution.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'"
                        class="px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ contribution.payment_status === 'paid' ? '✓ PAID' : '✗ UNPAID' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <div class="flex gap-2 justify-center">
                        <button
                          v-if="contribution.payment_status === 'unpaid'"
                          @click="markAsPaid(contribution)"
                          class="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                        >
                          Mark Paid
                        </button>
                        <button
                          v-else
                          @click="markAsUnpaid(contribution)"
                          class="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition"
                        >
                          Undo
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <p class="text-sm text-gray-600">
                Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalContributions) }}
                of {{ totalContributions }} records
              </p>
              <div class="flex gap-2">
                <button
                  @click="currentPage--"
                  :disabled="currentPage === 1"
                  class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span class="px-3 py-1 text-sm text-gray-700">Page {{ currentPage }} of {{ totalPages }}</span>
                <button
                  @click="currentPage++"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import API_BASE_URL from '../config/api'

export default {
  name: 'ContributionsModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    eventId: {
      type: String,
      required: true
    },
    eventTitle: {
      type: String,
      default: 'Event Contributions'
    }
  },
  data() {
    return {
      contributions: [],
      loadingContributions: false,
      searchQuery: '',
      filterStatus: '',
      currentPage: 1,
      itemsPerPage: 50,
      totalContributions: 0,
      totalPages: 1,
      initialized: false,
      stats: {
        total: 0,
        paid: 0,
        unpaid: 0
      }
    }
  },
  computed: {
    completionRate() {
      if (this.stats.total === 0) return 0
      return Math.round((this.stats.paid / this.stats.total) * 100)
    },
    filteredContributions() {
      return this.contributions.filter(c => {
        const matchesSearch = !this.searchQuery || 
          c.student_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          c.student_id_number.includes(this.searchQuery)
        
        const matchesStatus = !this.filterStatus || c.payment_status === this.filterStatus
        
        return matchesSearch && matchesStatus
      })
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadContributions()
      }
    },
    searchQuery() {
      this.currentPage = 1
    },
    filterStatus() {
      this.currentPage = 1
    },
    currentPage() {
      this.loadContributions()
    }
  },
  methods: {
    async loadContributions() {
      this.loadingContributions = true
      try {
        const token = localStorage.getItem('authToken')
        const query = new URLSearchParams({
          page: this.currentPage,
          limit: this.itemsPerPage,
          paymentStatus: this.filterStatus,
          search: this.searchQuery
        })

        const response = await fetch(
          `${API_BASE_URL}/apis/contributions/event/${this.eventId}?${query}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const data = await response.json()
        if (response.ok) {
          this.contributions = data.data
          this.stats = data.stats
          this.totalContributions = data.pagination.total
          this.totalPages = data.pagination.totalPages
          this.initialized = this.stats.total > 0
        } else {
          console.error('Failed to load contributions:', data.message)
        }
      } catch (err) {
        console.error('Error loading contributions:', err)
      } finally {
        this.loadingContributions = false
      }
    },
    async initializeContributions() {
      if (confirm('This will create contribution records for all registered students. Continue?')) {
        try {
          const token = localStorage.getItem('authToken')
          const response = await fetch(
            `${API_BASE_URL}/apis/contributions/initialize/${this.eventId}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          const data = await response.json()
          if (response.ok) {
            alert(`${data.count} contribution records initialized`)
            this.loadContributions()
          } else {
            alert('Error: ' + data.message)
          }
        } catch (err) {
          console.error('Error initializing contributions:', err)
          alert('Failed to initialize contributions')
        }
      }
    },
    async markAsPaid(contribution) {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(
          `${API_BASE_URL}/apis/contributions/event/${this.eventId}/mark-paid`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              student_id_number: contribution.student_id_number
            })
          }
        )

        const data = await response.json()
        if (response.ok) {
          this.loadContributions()
          this.$emit('payment-updated', { student: contribution, status: 'paid' })
        } else {
          alert('Error: ' + data.message)
        }
      } catch (err) {
        console.error('Error marking as paid:', err)
        alert('Failed to update payment status')
      }
    },
    async markAsUnpaid(contribution) {
      if (confirm(`Reset payment status for ${contribution.student_name}?`)) {
        try {
          const token = localStorage.getItem('authToken')
          const response = await fetch(
            `${API_BASE_URL}/apis/contributions/event/${this.eventId}/mark-unpaid`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                student_id_number: contribution.student_id_number
              })
            }
          )

          const data = await response.json()
          if (response.ok) {
            this.loadContributions()
            this.$emit('payment-updated', { student: contribution, status: 'unpaid' })
          } else {
            alert('Error: ' + data.message)
          }
        } catch (err) {
          console.error('Error marking as unpaid:', err)
          alert('Failed to update payment status')
        }
      }
    },
    async exportData() {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(
          `${API_BASE_URL}/apis/contributions/event/${this.eventId}/export?format=csv`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `contributions-${this.eventTitle}-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } else {
          alert('Failed to export data')
        }
      } catch (err) {
        console.error('Error exporting data:', err)
        alert('Failed to export data')
      }
    },
    closeModal() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.modal-bounce-enter-active {
  animation: modalBounce 0.3s ease;
}

@keyframes modalBounce {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
