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
        <div class="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4">
          <h3 class="text-lg font-bold text-white">{{ event.eventTitle }}</h3>
          <p class="text-purple-100 text-sm">{{ formatDate(event.eventDate) }}</p>
        </div>

        <!-- Payment Status -->
        <div class="px-6 py-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-gray-700 font-semibold">Payment Status:</span>
            <span
              :class="event.paymentStatus === 'paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'"
              class="px-4 py-2 rounded-full font-bold text-sm"
            >
              {{ event.paymentStatus === 'paid' ? '✓ PAID' : '✗ UNPAID' }}
            </span>
          </div>

          <div v-if="event.paidAt" class="text-sm text-gray-600 mb-4">
            <p>Paid on: <span class="font-semibold">{{ formatDateTime(event.paidAt) }}</span></p>
            <p v-if="event.paidByTreasurer">By: <span class="font-semibold">{{ event.paidByTreasurer }}</span></p>
          </div>

          <div v-if="event.notes" class="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
            <p class="font-semibold text-blue-900 mb-1">Notes:</p>
            <p>{{ event.notes }}</p>
          </div>

          <!-- Action Button -->
          <div v-if="event.paymentStatus === 'unpaid'" class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600 text-center">
              Please approach the treasurer to record your payment.
            </p>
          </div>
          <div v-else class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-green-600 text-center font-semibold">
              ✓ Your payment has been recorded
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import API_BASE_URL from '../config/api'

export default {
  name: 'StudentContributionsView',
  data() {
    return {
      events: [],
      loadingEvents: false
    }
  },
  async mounted() {
    await this.loadEvents()
  },
  methods: {
    async loadEvents() {
      this.loadingEvents = true
      try {
        const token = localStorage.getItem('authToken')
        // First get all active events
        const eventsResponse = await fetch(
          `${API_BASE_URL}/apis/attendance/events/active`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const eventsData = await eventsResponse.json()
        
        if (eventsResponse.ok && eventsData.length > 0) {
          // For each event, get the student's contribution status
          this.events = await Promise.all(eventsData.map(async (event) => {
            try {
              const contribResponse = await fetch(
                `${API_BASE_URL}/apis/contributions/student/${event._id}`,
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
                return {
                  _id: event._id,
                  eventTitle: event.title,
                  eventDate: event.event_date,
                  paymentStatus: contribData.data.payment_status,
                  paidAt: contribData.data.paid_at,
                  paidByTreasurer: contribData.data.paid_by_treasurer,
                  notes: contribData.data.notes
                }
              }
            } catch (err) {
              console.error(`Error loading contribution for event ${event._id}:`, err)
            }
            return null
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
