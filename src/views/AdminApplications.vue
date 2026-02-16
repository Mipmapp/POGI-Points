<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-4xl font-bold text-white mb-2">Application Management</h1>
          <p class="text-purple-200">Create and manage student applications</p>
        </div>
        <router-link to="/manage" class="text-purple-300 hover:text-white transition">
          ← Back to Admin
        </router-link>
      </div>
    </div>

    <div class="max-w-7xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-orange-400"></div>
        </div>
        <p class="text-purple-200 mt-4">Loading applications...</p>
      </div>

      <!-- Tabs -->
      <div v-else class="space-y-6">
        <div class="flex gap-2 border-b border-purple-700">
          <button
            @click="activeTab = 'forms'"
            :class="[
              'px-6 py-3 font-semibold transition',
              activeTab === 'forms'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-purple-300 hover:text-white'
            ]"
          >
            Application Forms ({{ formsList.length }})
          </button>
          <button
            @click="activeTab = 'create'"
            :class="[
              'px-6 py-3 font-semibold transition',
              activeTab === 'create'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-purple-300 hover:text-white'
            ]"
          >
            Create New
          </button>
        </div>

        <!-- Forms List Tab -->
        <div v-if="activeTab === 'forms'" class="space-y-4">
          <div v-if="formsList.length === 0" class="text-center py-8">
            <p class="text-purple-300">No application forms yet</p>
          </div>

          <div
            v-for="form in formsList"
            :key="form._id"
            class="bg-gradient-to-r from-purple-900/50 to-transparent border border-purple-700 rounded-lg p-6 hover:border-orange-400/50 transition cursor-pointer"
            @click="expandedForm = expandedForm === form._id ? null : form._id"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <h3 class="text-2xl font-bold text-white mb-2">{{ form.title }}</h3>
                <p class="text-purple-200 text-sm">{{ form.description }}</p>
              </div>
              <div class="text-right space-y-2">
                <div
                  :class="[
                    'px-3 py-1 rounded-full font-semibold text-xs',
                    form.status === 'active'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                      : 'bg-red-500/20 text-red-300 border border-red-500/50'
                  ]"
                >
                  {{ form.status.toUpperCase() }}
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div class="bg-purple-900/30 p-3 rounded">
                <p class="text-purple-400">Total</p>
                <p class="text-white font-bold text-lg">{{ form.stats.total }}</p>
              </div>
              <div class="bg-yellow-500/10 p-3 rounded">
                <p class="text-yellow-400">Pending</p>
                <p class="text-white font-bold text-lg">{{ form.stats.pending }}</p>
              </div>
              <div class="bg-green-500/10 p-3 rounded">
                <p class="text-green-400">Approved</p>
                <p class="text-white font-bold text-lg">{{ form.stats.approved }}</p>
              </div>
              <div class="bg-red-500/10 p-3 rounded">
                <p class="text-red-400">Rejected</p>
                <p class="text-white font-bold text-lg">{{ form.stats.rejected }}</p>
              </div>
            </div>

            <!-- Eligibility Info -->
            <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div class="text-purple-300">
                <span class="text-purple-400">Eligible Programs:</span>
                {{ form.eligible_programs.length > 0 ? form.eligible_programs.join(', ') : 'All' }}
              </div>
              <div class="text-purple-300">
                <span class="text-purple-400">Year Levels:</span>
                {{ form.eligible_year_levels.length > 0 ? form.eligible_year_levels.join(', ') : 'All' }}
              </div>
            </div>

            <!-- Expanded View -->
            <div v-if="expandedForm === form._id" class="border-t border-purple-700 pt-4 mt-4 space-y-4">
              <!-- Applications List -->
              <div v-if="selectedFormApplications[form._id]" class="space-y-3">
                <h4 class="font-bold text-white mb-3">Applications ({{ selectedFormApplications[form._id].length }})</h4>

                <div
                  v-for="app in selectedFormApplications[form._id]"
                  :key="app._id"
                  class="bg-purple-900/20 border border-purple-700 rounded p-3"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <p class="font-semibold text-white">{{ app.student_name }}</p>
                      <p class="text-sm text-purple-300">{{ app.student_id_number }}</p>
                      <p class="text-sm text-purple-400">{{ app.program }} • {{ app.year_level }}</p>
                    </div>
                    <div
                      :class="[
                        'px-3 py-1 rounded text-xs font-semibold',
                        app.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : app.status === 'approved'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      ]"
                    >
                      {{ app.status.toUpperCase() }}
                    </div>
                  </div>

                  <!-- Review Buttons -->
                  <div v-if="app.status === 'pending'" class="flex gap-2 mt-3">
                    <button
                      @click="reviewApplication(form._id, app._id, 'approved')"
                      class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition"
                    >
                      ✓ Approve
                    </button>
                    <button
                      @click="reviewApplication(form._id, app._id, 'rejected')"
                      class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2 border-t border-purple-700 pt-4">
                <button
                  @click="editForm(form)"
                  class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
                >
                  Edit
                </button>
                <button
                  @click="deleteForm(form._id)"
                  class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Expand Arrow -->
            <div class="text-right text-purple-400 text-sm">
              {{ expandedForm === form._id ? '▼ Hide Details' : '▶ Show Details' }}
            </div>
          </div>
        </div>

        <!-- Create Form Tab -->
        <div v-if="activeTab === 'create'" class="bg-gradient-to-r from-purple-900/50 to-transparent border border-purple-700 rounded-lg p-6">
          <form @submit.prevent="submitForm" class="space-y-6">
            <!-- Title -->
            <div>
              <label class="block text-white font-semibold mb-2">Application Title *</label>
              <input
                v-model="formData.title"
                type="text"
                placeholder="e.g., Leadership Program 2026"
                class="w-full px-4 py-2 bg-purple-900/30 border border-purple-700 rounded-lg text-white placeholder-purple-500 focus:border-orange-400 focus:outline-none"
                required
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-white font-semibold mb-2">Description</label>
              <textarea
                v-model="formData.description"
                placeholder="Describe the application purpose and requirements..."
                rows="4"
                class="w-full px-4 py-2 bg-purple-900/30 border border-purple-700 rounded-lg text-white placeholder-purple-500 focus:border-orange-400 focus:outline-none"
              ></textarea>
            </div>

            <!-- Eligibility -->
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-white font-semibold mb-2">Eligible Programs (leave empty for all)</label>
                <div class="space-y-2">
                  <label v-for="prog in ['BSCS', 'BSIT', 'BSIS']" :key="prog" class="flex items-center">
                    <input
                      type="checkbox"
                      :value="prog"
                      v-model="formData.eligible_programs"
                      class="w-4 h-4 accent-orange-400"
                    />
                    <span class="ml-2 text-purple-200">{{ prog }}</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-white font-semibold mb-2">Eligible Year Levels (leave empty for all)</label>
                <div class="space-y-2">
                  <label v-for="year in ['1st Year', '2nd Year', '3rd Year', '4th Year']" :key="year" class="flex items-center">
                    <input
                      type="checkbox"
                      :value="year"
                      v-model="formData.eligible_year_levels"
                      class="w-4 h-4 accent-orange-400"
                    />
                    <span class="ml-2 text-purple-200">{{ year }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Max Applicants -->
            <div>
              <label class="block text-white font-semibold mb-2">Max Applicants (leave empty for unlimited)</label>
              <input
                v-model.number="formData.max_applicants"
                type="number"
                placeholder="e.g., 50"
                min="1"
                class="w-full px-4 py-2 bg-purple-900/30 border border-purple-700 rounded-lg text-white placeholder-purple-500 focus:border-orange-400 focus:outline-none"
              />
            </div>

            <!-- One Per Student -->
            <label class="flex items-center">
              <input
                v-model="formData.allow_one_per_student"
                type="checkbox"
                class="w-4 h-4 accent-orange-400"
              />
              <span class="ml-2 text-purple-200">Allow only one application per student</span>
            </label>

            <!-- Error -->
            <div v-if="formError" class="bg-red-500/20 border border-red-500 rounded p-4 text-red-200 text-sm">
              {{ formError }}
            </div>

            <!-- Submit -->
            <div class="flex gap-3">
              <button
                type="button"
                @click="resetForm"
                class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
              >
                Clear
              </button>
              <button
                type="submit"
                :disabled="formSubmitting"
                class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {{ formSubmitting ? 'Creating...' : 'Create Application' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'AdminApplications',
  setup() {
    const activeTab = ref('forms');
    const loading = ref(true);
    const formsList = ref([]);
    const selectedFormApplications = ref({});
    const expandedForm = ref(null);

    const formData = ref({
      title: '',
      description: '',
      eligible_programs: [],
      eligible_year_levels: [],
      max_applicants: null,
      allow_one_per_student: true
    });

    const formError = ref('');
    const formSubmitting = ref(false);

    const fetchApplications = async () => {
      try {
        loading.value = true;
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

        const res = await fetch('/apis/admin/applications', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch applications');
        const data = await res.json();
        formsList.value = data.data || [];
      } catch (err) {
        console.error('Fetch applications error:', err);
      } finally {
        loading.value = false;
      }
    };

    const loadFormApplications = async (formId) => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

        const res = await fetch(`/apis/admin/applications/${formId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch form applications');
        const data = await res.json();
        selectedFormApplications.value[formId] = data.data.applications;
      } catch (err) {
        console.error('Load form applications error:', err);
      }
    };

    const submitForm = async () => {
      try {
        formError.value = '';
        formSubmitting.value = true;

        if (!formData.value.title.trim()) {
          throw new Error('Application title is required');
        }

        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

        const res = await fetch('/apis/admin/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData.value,
            max_applicants: formData.value.max_applicants || null
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to create application');
        }

        activeTab.value = 'forms';
        resetForm();
        await fetchApplications();
      } catch (err) {
        formError.value = err.message;
      } finally {
        formSubmitting.value = false;
      }
    };

    const reviewApplication = async (formId, appId, status) => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

        const res = await fetch(`/apis/admin/applications/${formId}/review/${appId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            applicationId: appId,
            status,
            notes: ''
          })
        });

        if (!res.ok) throw new Error('Failed to review application');

        await loadFormApplications(formId);
      } catch (err) {
        console.error('Review application error:', err);
        alert(err.message);
      }
    };

    const deleteForm = async (formId) => {
      if (!confirm('Delete this application form and all its applications?')) return;

      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

        const res = await fetch(`/apis/admin/applications/${formId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to delete form');

        await fetchApplications();
      } catch (err) {
        console.error('Delete form error:', err);
        alert(err.message);
      }
    };

    const editForm = (form) => {
      // TODO: Implement edit functionality
      alert('Edit functionality coming soon');
    };

    const resetForm = () => {
      formData.value = {
        title: '',
        description: '',
        eligible_programs: [],
        eligible_year_levels: [],
        max_applicants: null,
        allow_one_per_student: true
      };
    };

    onMounted(() => {
      fetchApplications();
    });

    // Load applications when expanding a form
    const onClick = (formId) => {
      if (expandedForm.value === formId) {
        expandedForm.value = null;
      } else {
        expandedForm.value = formId;
        if (!selectedFormApplications.value[formId]) {
          loadFormApplications(formId);
        }
      }
    };

    return {
      activeTab,
      loading,
      formsList,
      selectedFormApplications,
      expandedForm,
      formData,
      formError,
      formSubmitting,
      fetchApplications,
      submitForm,
      reviewApplication,
      deleteForm,
      editForm,
      resetForm
    };
  },
  watch: {
    expandedForm(newVal) {
      if (newVal && !this.selectedFormApplications[newVal]) {
        this.loadFormApplications(newVal);
      }
    }
  }
};
</script>
