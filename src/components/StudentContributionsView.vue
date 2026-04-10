<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-purple-900 mb-6">My Contribution Status</h1>
    
    <div v-if="loadingEvents" class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p class="text-gray-600">Loading events...</p>
      </div>
    </div>

    <div v-else-if="events.length === 0" class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
      <p class="text-blue-800">
        No events with contribution tracking yet. Check back later for upcoming events.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="event in events"
        :key="event._id"
        class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
      >
        <!-- Event Header -->
        <div class="bg-gradient-to-r from-ssaam-dark to-ssaam-light px-6 py-4">
          <h3 class="text-lg font-bold text-white">{{ event.eventTitle }}</h3>
          <p class="text-purple-100 text-sm">{{ formatDate(event.eventDate) }}</p>
        </div>

        <!-- Payment Status -->
        <div class="px-6 py-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-gray-700 font-semibold">Payment Status:</span>
            <span
              :class="event.isPaid
                ? 'bg-green-100 text-green-800'
                : event.isOverdue
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'"
              class="px-4 py-2 rounded-full font-bold text-sm"
            >
              <span v-if="event.isPaid">PAID</span>
              <span v-else-if="event.isOverdue">OVERDUE</span>
              <span v-else>PENDING</span>
            </span>
          </div>

          <div v-if="event.isPaid && event.paidAt" class="text-sm text-gray-600 mb-4">
            <p>Paid on: <span class="font-semibold">{{ formatDateTime(event.paidAt) }}</span></p>
            <p v-if="event.paidByTreasurer">By: <span class="font-semibold">{{ event.paidByTreasurer }}</span></p>
          </div>

          <div v-if="event.notes" class="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
            <p class="font-semibold text-blue-900 mb-1">Notes:</p>
            <p>{{ event.notes }}</p>
          </div>

          <!-- Action Button -->
          <div v-if="event.isPaid" class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-green-600 text-center font-semibold mb-3">
              ✓ Your payment has been recorded
            </p>
            <ContributionReceipt
              :student-name="currentUserName"
              :student-id="currentUserId"
              :event-title="event.eventTitle"
              :event-date="formatDate(event.eventDate)"
              :paid-at="formatDateTime(event.paidAt)"
              :paid-by-treasurer="event.paidByTreasurer"
              :notes="event.notes"
              :year-level="currentUserYearLevel"
              :program="currentUserProgram"
            />
          </div>
          <div v-else-if="event.isOverdue" class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-red-600 text-center font-bold">
              ⚠ Collection period has closed. Please contact the treasurer if you need to pay.
            </p>
          </div>
          <div v-else class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-orange-600 text-center font-medium">
              Please approach the treasurer to record your payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildAPIUrl } from '../config/api.js'
import ContributionReceipt from './ContributionReceipt.vue'

export default {
  name: 'StudentContributionsView',
  components: {
    ContributionReceipt
  },
  data() {
    return {
      events: [],
      loadingEvents: false,
      currentUserName: '',
      currentUserId: '',
      currentUserYearLevel: '',
      currentUserProgram: ''
    }
  },
  async mounted() {
    this.loadUserData()
    await this.loadEvents()
  },
  methods: {
    loadUserData() {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')
        this.currentUserName = userData.full_name || userData.name || 'Student'
        this.currentUserId = userData.student_id || userData._id || 'N/A'
        this.currentUserYearLevel = userData.year_level || userData.yearLevel || ''
        this.currentUserProgram = userData.program || userData.course || ''
      } catch (err) {
        console.error('Error loading user data:', err)
      }
    },
    async loadEvents() {
      this.loadingEvents = true
      try {
        const token = localStorage.getItem('authToken')
        // First get all active events
        const eventsResponse = await fetch(
          buildAPIUrl('/apis/attendance/events/active'),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const eventsData = await eventsResponse.json()
        
        if (eventsResponse.ok && eventsData && eventsData.length > 0) {
          // For each event, get the student's contribution status
          this.events = await Promise.all(eventsData.map(async (event) => {
            try {
              const contribResponse = await fetch(
                buildAPIUrl(`/apis/contributions/student/${event._id}`),
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              )

              if (contribResponse.ok) {
                const contribData = await contribResponse.json()
                const data = contribData.data || {}
                const isPaid = data.payment_status === 'paid'
                const isClosed = event.status === 'closed' || event.status === 'archived'
                
                return {
                  _id: event._id,
                  eventTitle: event.title || data.event_title,
                  eventDate: event.event_date || data.event_date,
                  eventStatus: event.status,
                  paymentStatus: data.payment_status || 'unpaid',
                  paidAt: data.paid_at,
                  paidByTreasurer: data.paid_by_treasurer,
                  notes: data.notes,
                  isPaid: isPaid,
                  isOverdue: isClosed && !isPaid
                }
              } else {
                console.warn(`Contribution not found for event ${event._id}`)
                return null
              }
            } catch (err) {
              console.error(`Error loading contribution for event ${event._id}:`, err)
              return null
            }
          }))

          // Filter out any null entries
          this.events = this.events.filter(e => e !== null)
        }
      } catch (err) {
        console.error('Error loading events:', err)
      } finally {
        this.loadingEvents = false
      }
    },
    formatDate(date) {
      if (!date) return 'TBA'
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    formatDateTime(date) {
      if (!date) return 'Not set'
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
</style>
