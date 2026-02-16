<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
    <!-- Header -->
    <div class="max-w-6xl mx-auto mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-4xl font-bold text-white mb-2">Applications</h1>
          <p class="text-purple-200">Apply for opportunities and programs</p>
        </div>
        <router-link to="/dashboard" class="text-purple-300 hover:text-white transition">
          ← Back to Dashboard
        </router-link>
      </div>
    </div>

    <div class="max-w-6xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-orange-400"></div>
        </div>
        <p class="text-purple-200 mt-4">Loading applications...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/20 border border-red-500 rounded-lg p-6 text-red-200">
        <p class="font-semibold">{{ error }}</p>
        <button
          @click="fetchApplications"
          class="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
        >
          Try Again
        </button>
      </div>

      <!-- Tabs -->
      <div v-else class="space-y-6">
        <div class="flex gap-2 border-b border-purple-700">
          <button
            @click="activeTab = 'available'"
            :class="[
              'px-6 py-3 font-semibold transition',
              activeTab === 'available'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-purple-300 hover:text-white'
            ]"
          >
            Available ({{ availableCount }})
          </button>
          <button
            @click="activeTab = 'submitted'"
            :class="[
              'px-6 py-3 font-semibold transition',
              activeTab === 'submitted'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-purple-300 hover:text-white'
            ]"
          >
            My Applications ({{ submittedCount }})
          </button>
        </div>

        <!-- Available Applications -->
        <div v-if="activeTab === 'available'" class="space-y-4">
          <div v-if="availableApplications.length === 0" class="text-center py-8">
            <p class="text-purple-300">No applications available at this time</p>
          </div>

          <div
            v-for="app in availableApplications"
            :key="app._id"
            class="bg-gradient-to-r from-purple-900/50 to-transparent border border-purple-700 rounded-lg p-6 hover:border-orange-400/50 transition"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <h3 class="text-2xl font-bold text-white mb-2">{{ app.title }}</h3>
                <p class="text-purple-200">{{ app.description }}</p>
              </div>
              <div
                v-if="app.alreadyApplied"
                :class="[
                  'px-4 py-2 rounded-full font-semibold text-sm',
                  app.applicationStatus === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                    : app.applicationStatus === 'approved'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                    : 'bg-red-500/20 text-red-300 border border-red-500/50'
                ]"
              >
                {{ app.applicationStatus.charAt(0).toUpperCase() + app.applicationStatus.slice(1) }}
              </div>
            </div>

            <!-- Eligibility Info -->
            <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p class="text-purple-400">Eligible Programs:</p>
                <p class="text-white">
                  {{ app.eligible_programs.length > 0 ? app.eligible_programs.join(', ') : 'All Programs' }}
                </p>
              </div>
              <div>
                <p class="text-purple-400">Eligible Year Levels:</p>
                <p class="text-white">
                  {{ app.eligible_year_levels.length > 0 ? app.eligible_year_levels.join(', ') : 'All Year Levels' }}
                </p>
              </div>
            </div>

            <!-- Apply Button -->
            <button
              v-if="!app.alreadyApplied"
              @click="startApplication(app)"
              class="px-6 py-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-semibold rounded-lg transition"
            >
              Apply Now
            </button>
            <p v-else class="text-purple-300 text-sm">Already applied for this application</p>
          </div>
        </div>

        <!-- My Submitted Applications -->
        <div v-else-if="activeTab === 'submitted'" class="space-y-4">
          <div v-if="submittedApplications.length === 0" class="text-center py-8">
            <p class="text-purple-300">You haven't applied for any applications yet</p>
          </div>

          <div
            v-for="app in submittedApplications"
            :key="app._id"
            class="bg-gradient-to-r from-purple-900/50 to-transparent border border-purple-700 rounded-lg p-6"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <h3 class="text-2xl font-bold text-white mb-2">{{ app.form.title }}</h3>
                <p class="text-purple-200 text-sm">{{ app.form.description }}</p>
              </div>
              <div
                :class="[
                  'px-4 py-2 rounded-full font-semibold text-sm',
                  app.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                    : app.status === 'approved'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                    : 'bg-red-500/20 text-red-300 border border-red-500/50'
                ]"
              >
                {{ app.status.charAt(0).toUpperCase() + app.status.slice(1) }}
              </div>
            </div>

            <!-- Timeline -->
            <div class="space-y-2 text-sm text-purple-300">
              <p>📝 Applied: {{ formatDate(app.appliedAt) }}</p>
              <p v-if="app.reviewedAt">✓ Reviewed: {{ formatDate(app.reviewedAt) }}</p>
              <p v-if="app.reviewedByName">By: {{ app.reviewedByName }}</p>
              <p v-if="app.notes" class="mt-2 bg-purple-900/30 p-3 rounded border border-purple-700">
                <span class="text-purple-400">Note:</span> {{ app.notes }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Application Modal -->
    <ApplicationModal
      v-if="showApplicationModal"
      :form="selectedForm"
      @submit="submitApplication"
      @close="showApplicationModal = false"
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import ApplicationModal from '@/components/ApplicationModal.vue';

export default {
  name: 'Application',
  components: {
    ApplicationModal
  },
  setup() {
    const router = useRouter();
    const activeTab = ref('available');
    const loading = ref(true);
    const error = ref('');
    const availableApplications = ref([]);
    const submittedApplications = ref([]);
    const showApplicationModal = ref(false);
    const selectedForm = ref(null);

    const availableCount = computed(() => availableApplications.value.length);
    const submittedCount = computed(() => submittedApplications.value.length);

    const fetchApplications = async () => {
      try {
        loading.value = true;
        error.value = '';

        const token = localStorage.getItem('studentToken');
        if (!token) {
          error.value = 'Not authenticated. Please login.';
          return;
        }

        // Fetch available applications
        const availRes = await fetch('/apis/applications/available', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!availRes.ok) throw new Error('Failed to fetch available applications');
        const availData = await availRes.json();
        availableApplications.value = availData.data || [];

        // Fetch user's submitted applications
        const submittedRes = await fetch('/apis/applications/user/my', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!submittedRes.ok) throw new Error('Failed to fetch submitted applications');
        const submittedData = await submittedRes.json();
        submittedApplications.value = submittedData.data || [];
      } catch (err) {
        console.error('Fetch applications error:', err);
        error.value = err.message || 'Failed to load applications';
      } finally {
        loading.value = false;
      }
    };

    const startApplication = (app) => {
      selectedForm.value = app;
      showApplicationModal.value = true;
    };

    const submitApplication = async (formData) => {
      try {
        const token = localStorage.getItem('studentToken');
        if (!token) throw new Error('Not authenticated');

        const res = await fetch(`/apis/applications/${selectedForm.value._id}/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ applicationData: formData })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to submit application');
        }

        showApplicationModal.value = false;
        activeTab.value = 'submitted';
        await fetchApplications();
      } catch (err) {
        console.error('Submit application error:', err);
        throw err;
      }
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    fetchApplications();

    return {
      activeTab,
      loading,
      error,
      availableApplications,
      submittedApplications,
      availableCount,
      submittedCount,
      showApplicationModal,
      selectedForm,
      fetchApplications,
      startApplication,
      submitApplication,
      formatDate
    };
  }
};
</script>
