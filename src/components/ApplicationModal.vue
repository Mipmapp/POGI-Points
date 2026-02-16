<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-gradient-to-r from-purple-900 to-slate-900 border-b border-purple-700 p-6 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-white">Apply for {{ form.title }}</h2>
        <button
          @click="$emit('close')"
          class="text-purple-300 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Description -->
        <div>
          <p class="text-purple-200 text-sm">{{ form.description }}</p>
        </div>

        <!-- Application Message -->
        <div class="bg-purple-900/30 border border-purple-700 rounded p-4">
          <p class="text-purple-300 text-sm">
            ℹ️ Your application will be reviewed by the admin team. You'll receive updates on your application status.
          </p>
        </div>

        <!-- Submit Button -->
        <div class="flex gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {{ submitting ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-red-500/20 border border-red-500 rounded p-4 text-red-200 text-sm">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'ApplicationModal',
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  emits: ['submit', 'close'],
  setup(props, { emit }) {
    const submitting = ref(false);
    const error = ref('');

    const handleSubmit = async () => {
      try {
        submitting.value = true;
        error.value = '';

        // Emit submission - parent will handle API call
        emit('submit', {});
      } catch (err) {
        error.value = err.message || 'Failed to submit application';
      } finally {
        submitting.value = false;
      }
    };

    return {
      submitting,
      error,
      handleSubmit
    };
  }
};
</script>
