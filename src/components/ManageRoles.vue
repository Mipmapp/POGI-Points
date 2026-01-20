<template>
  <div class="bg-white rounded-lg shadow-lg p-4 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 class="text-2xl font-bold text-purple-900">Manage Roles</h2>
        <button 
          @click="refreshRoleData" 
          :disabled="isRefreshing"
          class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium flex items-center gap-2 disabled:opacity-70"
        >
          <svg v-if="isRefreshing" class="w-4 h-4 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <!-- Roles Grid -->
      <div class="flex flex-wrap gap-6 justify-center">
        <div 
          v-for="role in roles" 
          :key="role"
          class="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 max-w-sm w-full"
        >
          <!-- Role Header -->
          <div class="mb-4">
            <h3 class="text-xl font-bold text-purple-900 capitalize">{{ role }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ getRoleDescription(role) }}</p>
          </div>

          <!-- Members Count -->
          <div class="bg-white rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-700 font-medium">Members</span>
              <span class="text-2xl font-bold text-purple-600">{{ getRoleMemberCount(role) }}</span>
            </div>
          </div>

          <!-- View/Manage Members Button -->
          <button 
            @click="viewRoleMembers(role)"
            class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-200 font-medium text-sm"
          >
            Manage Members
          </button>
        </div>
      </div>
    </div>

    <!-- View Members Modal -->
    <div v-if="showMembersModal && selectedRole" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeMembersModal">
      <transition name="modal-bounce" appear>
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-purple-900 capitalize">{{ selectedRole }} Members</h3>
            <button @click="closeMembersModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>

          <!-- Add Member Section -->
          <div class="bg-purple-50 rounded-lg p-4 mb-6">
            <h4 class="font-semibold text-purple-900 mb-3">Add User to {{ selectedRole }} Role</h4>
            <div class="flex gap-2">
              <select 
                v-model="memberToAdd"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              >
                <option value="">Select a user...</option>
                <option v-for="user in availableUsers" :key="user.student_id || user._id || user.id" :value="user.student_id || user._id || user.id">
                  {{ (user.first_name || user.firstName) }} {{ (user.last_name || user.lastName) }} ({{ user.student_id || user.id }})
                </option>
              </select>
              <button 
                @click="addMemberToRole"
                :disabled="!memberToAdd || isAddingMember"
                class="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-70 font-medium whitespace-nowrap"
              >
                {{ isAddingMember ? 'Adding...' : 'Add' }}
              </button>
            </div>
          </div>

          <!-- Members List -->
          <div class="space-y-2">
            <h4 class="font-semibold text-gray-700 mb-3">Current Members ({{ roleMembers.length }})</h4>
            <div v-if="roleMembers.length === 0" class="text-center py-8 text-gray-600">
              <p>No members assigned to this role yet</p>
            </div>
            <div v-for="member in roleMembers" :key="member.student_id || member._id || member.id" class="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
              <!-- Profile Image and Info -->
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <!-- Profile Image -->
                <div class="w-12 h-12 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                  <img 
                    v-if="member.photo" 
                    :src="member.photo" 
                    :alt="`${member.first_name} ${member.last_name}`"
                    class="w-full h-full object-cover"
                    @error="$event.target.style.display='none'"
                  />
                  <span v-else>{{ getInitials(member) }}</span>
                </div>
                <!-- Member Info -->
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">{{ (member.first_name || member.firstName) }} {{ (member.last_name || member.lastName) }}</p>
                  <p class="text-sm text-gray-600 truncate">{{ member.student_id }} • {{ member.email }}</p>
                  <p v-if="member.program" class="text-xs text-gray-500">{{ member.program }} - {{ member.year_level }}</p>
                </div>
              </div>
              <!-- Remove Button -->
              <button 
                @click="showRemoveConfirmation(member)"
                class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0 ml-2"
                title="Remove Member"
              >
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Close Button -->
          <div class="mt-6 pt-4 border-t border-gray-200">
            <button 
              @click="closeMembersModal"
              class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Remove Member Confirmation Modal -->
    <transition name="fade">
      <div v-if="showRemoveConfirmModal && memberToRemove" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeRemoveConfirmation">
        <transition name="notification-pop" appear>
          <div class="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-11/12 md:w-96">
            <!-- Confirmation Icon -->
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 rounded-full flex items-center justify-center bg-yellow-100">
                <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>

            <!-- Confirmation Message -->
            <h3 class="text-lg font-bold text-center text-gray-900 mb-2">Remove Member?</h3>
            <p class="text-center text-gray-600 text-sm mb-6">
              Are you sure you want to remove <strong>{{ (memberToRemove.first_name || memberToRemove.firstName) }} {{ (memberToRemove.last_name || memberToRemove.lastName) }}</strong> from the <strong>{{ selectedRole }}</strong> role?
            </p>

            <!-- Confirmation Buttons -->
            <div class="flex gap-3">
              <button 
                @click="closeRemoveConfirmation"
                class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button 
                @click="confirmRemoveMember"
                class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-all duration-200 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Notification Modal -->
    <transition name="fade">
      <div v-if="notification.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeNotification">
        <transition name="notification-pop" appear>
          <div @click.stop class="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-11/12 md:w-96">
            <!-- Notification Icon -->
            <div class="flex justify-center mb-4">
              <div :class="[
                'w-16 h-16 rounded-full flex items-center justify-center',
                notification.type === 'success' ? 'bg-green-100' : notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
              ]">
                <svg v-if="notification.type === 'success'" class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <svg v-else-if="notification.type === 'error'" class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <svg v-else class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>

            <!-- Notification Message -->
            <h3 class="text-lg font-bold text-center text-gray-900 mb-2">{{ notification.title }}</h3>
            <p class="text-center text-gray-600 text-sm mb-6">{{ notification.message }}</p>

            <!-- Notification Button -->
            <button 
              @click="closeNotification"
              class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
            >
              OK
            </button>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { buildAPIUrl } from '../config/api.js'

export default {
  name: 'ManageRoles',
  data() {
    return {
      roles: ['Medpub', 'Treasurer'],
      roleMembers: [],
      allUsers: [],
      isLoading: false,
      isRefreshing: false,
      isAddingMember: false,
      showMembersModal: false,
      selectedRole: null,
      memberToAdd: '',
      notification: {
        show: false,
        type: 'success', // 'success', 'error', 'info'
        title: '',
        message: ''
      },
      showRemoveConfirmModal: false,
      memberToRemove: null
    }
  },
  computed: {
    availableUsers() {
      // Return users not already in the current role
      if (!this.selectedRole) return this.allUsers
      const roleUserIds = this.roleMembers.map(m => m._id || m.id)
      return this.allUsers.filter(user => !roleUserIds.includes(user._id || user.id))
    }
  },
  methods: {
    showNotification(type, title, message) {
      this.notification = {
        show: true,
        type,
        title,
        message
      }
      // Auto close after 5 seconds
      setTimeout(() => {
        this.closeNotification()
      }, 5000)
    },
    closeNotification() {
      this.notification.show = false
    },
    getRoleDescription(role) {
      const descriptions = {
        'Medpub': 'Media and Publication team member',
        'Treasurer': 'Manages organization finances'
      }
      return descriptions[role] || ''
    },
    getInitials(member) {
      const firstName = member.first_name || member.firstName || ''
      const lastName = member.last_name || member.lastName || ''
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
    },
    getRoleMemberCount(role) {
      // Get users with this role from allUsers, comparing lowercase
      const roleValue = role.toLowerCase()
      return this.allUsers.filter(user => (user.role || '').toLowerCase() === roleValue).length
    },
    async fetchAllUsers() {
      try {
        // Get the JWT token from localStorage (adminToken for admin users)
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        
        if (!token) {
          console.error('No authentication token found')
          this.showNotification('error', 'Authentication Error', 'Authentication required. Please login again.')
          return
        }

        const response = await fetch(buildAPIUrl('/apis/students/search?limit=1000'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          // Handle both array response and object with data property
          this.allUsers = Array.isArray(data) ? data : (data.data || [])
          console.log('Fetched users:', this.allUsers)
        } else {
          const errorData = await response.json()
          console.error('Failed to fetch users:', response.status, errorData)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    },
    async fetchRoleMembers(role) {
      try {
        // Get members with this role, comparing lowercase
        const roleValue = role.toLowerCase()
        this.roleMembers = this.allUsers.filter(user => (user.role || '').toLowerCase() === roleValue)
        console.log(`Fetched ${this.roleMembers.length} members for role ${role}:`, this.roleMembers)
      } catch (error) {
        console.error('Error fetching role members:', error)
      }
    },
    async viewRoleMembers(role) {
      this.selectedRole = role
      this.memberToAdd = ''
      this.fetchRoleMembers(role)
      this.showMembersModal = true
    },
    closeMembersModal() {
      this.showMembersModal = false
      this.selectedRole = null
      this.roleMembers = []
      this.memberToAdd = ''
    },
    async addMemberToRole() {
      if (!this.memberToAdd || !this.selectedRole) {
        return
      }

      this.isAddingMember = true
      try {
        // Get the JWT token
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        if (!token) {
          this.showNotification('error', 'Authentication Error', 'Authentication required. Please login again.')
          return
        }

        // Get the user object
        const user = this.allUsers.find(u => (u._id || u.id || u.student_id) === this.memberToAdd)
        if (!user) {
          this.showNotification('error', 'User Not Found', 'User not found')
          return
        }

        // Use student_id for the API endpoint
        const studentId = user.student_id || user._id || user.id
        const roleValue = this.selectedRole.toLowerCase()

        // Update user role via API
        const response = await fetch(buildAPIUrl(`/apis/students/${studentId}/role`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: roleValue })
        })

        if (response.ok) {
          // Update local data
          user.role = roleValue
          await this.fetchRoleMembers(this.selectedRole)
          this.memberToAdd = ''
          this.showNotification('success', 'Success', 'User added to role successfully')
        } else {
          const errorData = await response.json()
          this.showNotification('error', 'Failed', 'Failed to add user to role: ' + (errorData.message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Error adding member:', error)
        this.showNotification('error', 'Error', 'Error adding member to role')
      } finally {
        this.isAddingMember = false
      }
    },
    async removeMemberFromRole(userId) {
      try {
        // Get the JWT token
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        if (!token) {
          this.showNotification('error', 'Authentication Error', 'Authentication required. Please login again.')
          return
        }

        // Find the user in roleMembers array using proper comparison
        let user = this.roleMembers.find(u => {
          const memberId = u.student_id || u._id || u.id
          return String(memberId) === String(userId)
        })

        if (!user) {
          this.showNotification('error', 'User Not Found', 'Could not find the user to remove')
          return
        }

        const studentId = user.student_id || user._id || user.id
        
        // Update user role to 'student' (default role - everyone is a student)
        const response = await fetch(buildAPIUrl(`/apis/students/${studentId}/role`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: 'student' })
        })

        if (response.ok) {
          // Update local data
          if (user) {
            user.role = 'student'
          }
          await this.fetchRoleMembers(this.selectedRole)
          this.showNotification('success', 'Success', 'User removed from role successfully')
        } else {
          const errorData = await response.json()
          this.showNotification('error', 'Failed', 'Failed to remove user from role: ' + (errorData.message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Error removing member:', error)
        this.showNotification('error', 'Error', 'Error removing user from role')
      }
    },
    showRemoveConfirmation(member) {
      this.memberToRemove = member
      this.showRemoveConfirmModal = true
    },
    closeRemoveConfirmation() {
      this.showRemoveConfirmModal = false
      this.memberToRemove = null
    },
    confirmRemoveMember() {
      if (this.memberToRemove) {
        this.closeRemoveConfirmation()
        this.removeMemberFromRole(this.memberToRemove.student_id || this.memberToRemove._id || this.memberToRemove.id)
      }
    },
    async refreshRoleData() {
      this.isRefreshing = true
      try {
        await this.fetchAllUsers()
        if (this.selectedRole) {
          await this.fetchRoleMembers(this.selectedRole)
        }
      } finally {
        this.isRefreshing = false
      }
    }
  },
  mounted() {
    this.isLoading = true
    this.fetchAllUsers().finally(() => {
      this.isLoading = false
    })
  }
}
</script>

<style scoped>
.modal-bounce-enter-active {
  animation: modal-bounce 0.3s ease-out;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.notification-pop-enter-active {
  animation: notification-pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.notification-pop-leave-active {
  animation: notification-pop-leave 0.3s ease-out;
}

@keyframes modal-bounce {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes notification-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes notification-pop-leave {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0;
  }
}
</style>
