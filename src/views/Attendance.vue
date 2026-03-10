<template>
  <div :class="['rounded-lg shadow-lg p-3 md:p-8 min-h-screen', isCOE ? 'bg-gradient-to-br from-orange-50 to-orange-100' : isSOM ? 'bg-gradient-to-br from-green-50 to-green-100' : isCNAHS ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-purple-50 to-purple-100']">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div :class="['animate-spin rounded-full h-12 w-12 border-b-2', isCOE ? 'border-orange-600' : isSOM ? 'border-green-600' : isCNAHS ? 'border-emerald-600' : 'border-purple-600']"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 :class="['text-2xl md:text-3xl font-bold', isCOE ? 'text-orange-900' : isSOM ? 'text-green-900' : isCNAHS ? 'text-emerald-900' : 'text-purple-900']">Attendance Management</h2>
          <p :class="['mt-1', isCOE ? 'text-orange-700' : isSOM ? 'text-green-700' : isCNAHS ? 'text-emerald-700' : 'text-purple-700']">Manage and track attendance events</p>
        </div>
      </div>

      <!-- Search & Info Bar Mobile Responsive -->
      <div :class="['rounded-xl shadow-md p-4 md:p-6 backdrop-blur-sm transition-all duration-200', isCOE ? 'bg-white bg-opacity-95 border-2 border-orange-200 hover:shadow-lg hover:border-orange-300' : isSOM ? 'bg-white bg-opacity-95 border-2 border-green-200 hover:shadow-lg hover:border-green-300' : isCNAHS ? 'bg-white bg-opacity-95 border-2 border-emerald-200 hover:shadow-lg hover:border-emerald-300' : 'bg-white bg-opacity-95 border-2 border-purple-200 hover:shadow-lg hover:border-purple-300']">
        <div class="flex flex-col gap-4">
          <!-- Search Input with Icon -->
          <div class="relative group">
            <div :class="['absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200', isCOE ? 'text-orange-400 group-focus-within:text-orange-600' : isSOM ? 'text-green-400 group-focus-within:text-green-600' : isCNAHS ? 'text-emerald-400 group-focus-within:text-emerald-600' : 'text-purple-400 group-focus-within:text-purple-600']">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search events by title..."
              :class="['w-full pl-11 md:pl-12 pr-12 md:pr-12 py-3 md:py-4 rounded-xl border-2 transition-all outline-none text-sm md:text-base font-medium', searchQuery.length > 0 ? (isCOE ? 'border-orange-400 bg-orange-50 focus:ring-2 focus:ring-orange-300' : isSOM ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-300' : isCNAHS ? 'border-emerald-400 bg-emerald-50 focus:ring-2 focus:ring-emerald-300' : 'border-purple-400 bg-purple-50 focus:ring-2 focus:ring-purple-300') : (isCOE ? 'border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200' : isSOM ? 'border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200' : isCNAHS ? 'border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200' : 'border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200')]"
            />
            <!-- Clear button -->
            <button
              v-if="searchQuery.length > 0"
              @click="searchQuery = ''"
              :class="['absolute inset-y-0 right-0 pr-4 flex items-center transition-opacity hover:opacity-100 active:scale-90', isCOE ? 'text-orange-500 hover:text-orange-700' : isSOM ? 'text-green-500 hover:text-green-700' : isCNAHS ? 'text-emerald-500 hover:text-emerald-700' : 'text-purple-500 hover:text-purple-700']"
              title="Clear search"
            >
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- Results Info and Pagination Controls -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div :class="['text-xs md:text-sm font-semibold px-3 py-1.5 rounded-lg', isCOE ? 'bg-orange-100 text-orange-800' : isSOM ? 'bg-green-100 text-green-800' : isCNAHS ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800']">
              <span class="font-bold">{{ paginatedEvents.length }}</span> of <span class="font-bold">{{ searchedEvents.length }}</span> events
            </div>
            <div :class="['text-xs md:text-sm font-medium', isCOE ? 'text-orange-700' : isSOM ? 'text-green-700' : isCNAHS ? 'text-emerald-700' : 'text-purple-700']">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
          </div>
        </div>
      </div>

      <!-- Top Pagination -->
      <div class="flex items-center justify-between">
        <div :class="['text-sm font-medium', isCOE ? 'text-orange-700' : isSOM ? 'text-green-700' : isCNAHS ? 'text-emerald-700' : 'text-purple-700']">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <div class="flex gap-2">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            :class="['px-4 py-2 rounded-lg font-medium transition-all text-sm', currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' : isCOE ? 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95' : isSOM ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' : isCNAHS ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95']"
          >
            ← Previous
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            :class="['px-4 py-2 rounded-lg font-medium transition-all text-sm', currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' : isCOE ? 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95' : isSOM ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' : isCNAHS ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95']"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="paginatedEvents.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p class="text-gray-600 text-lg">{{ searchQuery ? 'No events match your search' : 'No events available' }}</p>
        <p class="text-gray-500 text-sm mt-2">{{ searchQuery ? 'Try a different search term' : 'Create events to manage attendance' }}</p>
      </div>

      <!-- Events Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        <div 
          v-for="event in paginatedEvents" 
          :key="event._id"
<div :class="['bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 border-l-4 overflow-hidden', event.is_custom ? (isCOE ? 'border-l-orange-600' : isSOM ? 'border-l-green-600' : isCNAHS ? 'border-l-emerald-600' : 'border-l-purple-600') : isCOE ? 'border-l-orange-400' : isSOM ? 'border-l-green-400' : isCNAHS ? 'border-l-emerald-400' : 'border-l-purple-400']">
        >
          <!-- Event Header -->
          <div :class="['p-5 border-b', isCOE ? 'border-orange-100' : 'border-purple-100']">
            <div class="flex justify-between items-start gap-3 mb-3">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 line-clamp-2">{{ event.title }}</h3>
                <p :class="['text-sm mt-1', isCOE ? 'text-orange-600' : isSOM ? 'text-green-600' : isCNAHS ? 'text-emerald-600' : 'text-purple-600']">{{ formatEventDate(event.event_date) }}</p>
              </div>
              <span :class="['px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap', event.is_custom ? (isCOE ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800') : (isCOE ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-purple-50 text-purple-700 border border-purple-200')]">
                {{ event.is_custom ? '✓ Custom' : 'Regular' }}
              </span>
            </div>
            <p v-if="event.description" class="text-sm text-gray-600 line-clamp-2">{{ event.description }}</p>
          </div>

          <!-- Event Stats -->
          <div :class="['p-5 space-y-3', isCOE ? 'bg-orange-50' : 'bg-purple-50']">
            <div class="flex items-center justify-between">
              <span :class="['text-sm font-medium', isCOE ? 'text-orange-700' : 'text-purple-700']">Total Attendees:</span>
              <span class="font-bold text-gray-900 text-lg">{{ event.total_attendees || 0 }}</span>
            </div>
            <div class="flex gap-4 pt-2 border-t" :class="isCOE ? 'border-orange-200' : 'border-purple-200'">
              <div class="flex-1">
                <p class="text-xs text-green-600 font-semibold mb-1">Present</p>
                <p class="font-bold text-green-700 text-lg">{{ event.present_count || 0 }}</p>
              </div>
              <div class="flex-1">
                <p class="text-xs text-red-600 font-semibold mb-1">Absent</p>
                <p class="font-bold text-red-700 text-lg">{{ event.absent_count || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="p-5 pt-4">
            <button 
              @click="viewEventDetails(event)"
              :class="['w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-white text-sm', isCOE ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95' : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 active:scale-95']"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Pagination -->
      <div class="flex items-center justify-between pt-6 border-t" :class="isCOE ? 'border-orange-200' : isSOM ? 'border-green-200' : isCNAHS ? 'border-emerald-200' : 'border-purple-200'">
        <div :class="['text-sm font-medium', isCOE ? 'text-orange-700' : isSOM ? 'text-green-700' : isCNAHS ? 'text-emerald-700' : 'text-purple-700']">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <div class="flex gap-2">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            :class="['px-4 py-2 rounded-lg font-medium transition-all text-sm', currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' : isCOE ? 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95' : isSOM ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' : isCNAHS ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95']"
          >
            ← Previous
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            :class="['px-4 py-2 rounded-lg font-medium transition-all text-sm', currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' : isCOE ? 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95' : isSOM ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' : isCNAHS ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95']"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildAPIUrl } from '../config/api.js'
import departments from '../config/departments.js'
import { checkDepartment } from '../config/themes.js'

export default {
  name: 'Attendance',
  data() {
    return {
      isLoading: false,
      events: [],
      allUsers: [],
      searchQuery: '',
      currentPage: 1,
      itemsPerPage: 5
    };
  },
  computed: {
    isCOE() {
      return checkDepartment('COE', departments)
    },
    isSOM() {
      return checkDepartment('SOM', departments)
    },
    isCNAHS() {
      return checkDepartment('CNAHS', departments)
    },
    // Filter events by search query and sort by date (newest first)
    searchedEvents() {
      let filtered = this.events;
      if (this.searchQuery.trim()) {
        filtered = this.events.filter(event =>
          event.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      // Sort by date - newest first
      return filtered.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    },
    // Get paginated events
    paginatedEvents() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.searchedEvents.slice(start, end);
    },
    // Total pages
    totalPages() {
      return Math.ceil(this.searchedEvents.length / this.itemsPerPage) || 1;
    }
  },
  watch: {
    // Reset to page 1 when search changes
    searchQuery() {
      this.currentPage = 1;
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
        const response = await fetch(buildAPIUrl('/apis/attendance/events'), {
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
        const response = await fetch(buildAPIUrl('/apis/students?limit=1000'), {
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
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.scrollToTop();
      }
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.scrollToTop();
      }
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

/* Smooth line clamping for text truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Smooth transitions for interactive elements */
button {
  transition: all 0.2s ease-in-out;
}

button:active:not(:disabled) {
  transform: scale(0.98);
}

input::placeholder {
  color: rgba(107, 114, 128, 0.6);
}

/* Smooth gradient backgrounds */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

/* Responsive adjustments */
@media (max-width: 640px) {
  :deep(.max-h-72) {
    max-height: 250px;
  }
}
</style>