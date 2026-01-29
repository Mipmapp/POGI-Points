<template>
  <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-lg p-3 md:p-8 min-h-screen">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl md:text-3xl font-bold text-purple-900">Attendance Management</h2>
          <p class="text-gray-600 mt-1">Create and manage attendance events</p>
        </div>

      </div>

      <!-- Tab Navigation -->
      <div class="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button 
          @click="activeTab = 'all'"
          :class="['px-4 py-2 font-medium whitespace-nowrap border-b-2 transition', activeTab === 'all' ? 'text-purple-600 border-purple-600' : 'text-gray-600 border-transparent hover:text-purple-600']"
        >
          All Events ({{ events.length }})
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="filteredEvents.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p class="text-gray-600 text-lg">No events available</p>
        <p class="text-gray-500 text-sm mt-2">Create events to manage attendance</p>
      </div>

      <!-- Events Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="event in filteredEvents" 
          :key="event._id"
          class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4"
          :class="event.is_custom ? 'border-l-purple-600' : 'border-l-blue-600'"
        >
          <!-- Event Header -->
          <div class="p-5 border-b border-gray-200">
            <div class="flex justify-between items-start gap-3 mb-3">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900">{{ event.title }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ formatEventDate(event.event_date) }}</p>
              </div>
              <span :class="['px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap', event.is_custom ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800']">
                {{ event.is_custom ? '✓ Custom' : 'Regular' }}
              </span>
            </div>
            <p v-if="event.description" class="text-sm text-gray-600">{{ event.description }}</p>
          </div>

          <!-- Event Stats -->
          <div class="p-5 bg-gray-50 space-y-2">
            <p class="text-sm text-gray-600">
              <span class="font-semibold">Total Attendees:</span>
              <span class="font-bold text-gray-900">{{ event.total_attendees || 0 }}</span>
            </p>
            <div class="flex gap-4">
              <p class="text-sm text-green-600">
                <span class="font-semibold">Present:</span>
                <span class="font-bold">{{ event.present_count || 0 }}</span>
              </p>
              <p class="text-sm text-red-600">
                <span class="font-semibold">Absent:</span>
                <span class="font-bold">{{ event.absent_count || 0 }}</span>
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="p-5 flex flex-col sm:flex-row gap-2">
            <button 
              @click="viewEventDetails(event)"
              class="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ssaam-api.vercel.app';

export default {
  name: 'Attendance',
  data() {
    return {
      isLoading: false,
      events: [],
      allUsers: [],
      activeTab: 'all'
    };
  },
  computed: {
    filteredEvents() {
      return this.events;
    }
  },
  mounted() {
    this.loadEvents();
    this.loadAllUsers();
  },
  methods: {
    async loadEvents() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/apis/attendance/events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          this.events = data.data || [];
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async loadAllUsers() {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/apis/students?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          this.allUsers = data.students || data.data || [];
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    },
    viewEventDetails(event) {
      this.$router.push({ name: 'EventDetails', params: { id: event._id } });
    },
    formatEventDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      });
    }
  }
};
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  :deep(.max-h-72) {
    max-height: 250px;
  }
}
</style>