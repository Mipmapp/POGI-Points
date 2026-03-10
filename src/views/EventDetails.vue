<template>
  <div class="p-6 min-h-screen">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 :class="['text-2xl font-bold', isCOE ? 'text-orange-900' : isSOM ? 'text-green-900' : 'text-purple-900']">{{ event.title || 'Event Details' }}</h1>
        <p class="text-sm text-gray-600">{{ formatDate(event.event_date) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="$router.back()" class="px-3 py-2 border rounded" :class="isCOE ? 'border-orange-300' : isSOM ? 'border-green-300' : 'border-purple-300'">Back</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-10 w-10" :class="isCOE ? 'border-b-2 border-orange-600' : isSOM ? 'border-b-2 border-green-600' : 'border-b-2 border-purple-600'"></div>
    </div>

    <div v-else>
      <div v-if="sessions.length === 0" class="bg-white p-6 rounded shadow text-center">No sessions found for this event</div>

      <div class="grid gap-4">
        <div v-for="s in sessions" :key="s._id" class="bg-white rounded shadow p-4 flex items-start justify-between">
          <div>
            <h3 class="font-semibold">{{ s.label }}</h3>
            <p class="text-sm text-gray-500">{{ formatTime(s.start_time) }} — {{ formatTime(s.end_time) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="showAbsent(s)" class="px-3 py-1.5 rounded" :class="isCOE ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : isSOM ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'">Show Absent</button>
            <button @click="exportAbsentCSV(s)" class="px-3 py-1.5 rounded border" :class="isCOE ? 'border-orange-300 text-orange-700' : isSOM ? 'border-green-300 text-green-700' : 'border-purple-300 text-purple-700'">Export Absent</button>
          </div>
        </div>
      </div>

      <div v-if="absentList.length > 0" class="mt-6">
        <h4 class="font-semibold mb-3">Absent Students ({{ absentList.length }})</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="stu in absentList" :key="stu.student_id || stu._id" class="bg-white rounded shadow overflow-hidden">
            <div class="relative h-28 bg-gray-100">
              <div class="absolute -top-8 left-4 w-16 h-16 rounded-full overflow-hidden border-2 bg-white" :class="isCOE ? 'border-orange-200' : isSOM ? 'border-green-200' : 'border-purple-200'">
                <img v-if="stu.photo || stu.student?.photo" :src="stu.photo || stu.student?.photo" class="w-full h-full object-cover rounded-full" />
                <div v-else class="w-full h-full flex items-center justify-center" :class="isCOE ? 'bg-gradient-to-br from-orange-300 to-red-400 text-white' : isSOM ? 'bg-gradient-to-br from-green-300 to-teal-400 text-white' : 'bg-gradient-to-br from-pink-400 to-purple-600 text-white'">
                  <span class="font-bold">{{ initials(stu) }}</span>
                </div>
              </div>
              <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
            </div>
            <div class="p-4 pt-6">
              <div class="font-medium">{{ stu.full_name || stu.student?.full_name || stu.student_name || stu.first_name + ' ' + stu.last_name }}</div>
              <div class="text-sm text-gray-500">{{ stu.student_id || stu.student?.student_id || stu.student_id_number || '' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import departments from '../config/departments'
import * as XLSX from 'xlsx'
import { buildAPIUrl } from '../config/api.js'

export default {
  name: 'EventDetails',
  props: ['id'],
  data() {
    return {
      event: {},
      sessions: [],
      loading: true,
      absentList: []
    }
  },
  computed: {
    isCOE() {
      try {
        const userJson = localStorage.getItem('currentUser') || localStorage.getItem('user')
        const user = userJson ? JSON.parse(userJson) : {}
        const userProgram = user.program
        if (userProgram) {
          for (const dept of departments) {
            if (dept.programs.some(p => p.shortName === userProgram)) return dept.label === 'COE'
          }
        }
      } catch (e) {}
      return false
    },
    isSOM() {
      try {
        const userJson = localStorage.getItem('currentUser') || localStorage.getItem('user')
        const user = userJson ? JSON.parse(userJson) : {}
        const userProgram = user.program
        if (userProgram) {
          for (const dept of departments) {
            if (dept.programs.some(p => p.shortName === userProgram)) return dept.label === 'SOM'
          }
        }
      } catch (e) {}
      return false
    }
  },
  mounted() {
    this.loadEvent()
    this.loadSessions()
  },
  methods: {
    initials(stu) {
      const name = stu.full_name || (stu.student && stu.student.full_name) || (stu.first_name && stu.last_name && `${stu.first_name[0]}${stu.last_name[0]}`) || ''
      return name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
    },
    formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) },
    formatTime(t) { if (!t) return ''; return t },
    async loadEvent() {
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(buildAPIUrl(`/apis/attendance/events/${this.id}`), { headers: { 'Authorization': `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          this.event = data.event || data.data || {}
        }
      } catch (err) {
        console.error(err)
      }
    },
    async loadSessions() {
      this.loading = true
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(buildAPIUrl(`/apis/attendance/events/${this.id}/sessions`), { headers: { 'Authorization': `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          this.sessions = data.data || []
        }
      } catch (err) {
        console.error('Failed to load sessions', err)
      } finally {
        this.loading = false
      }
    },
    async showAbsent(session) {
      this.absentList = []
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken')
        // fetch logs for session
        const logsRes = await fetch(buildAPIUrl(`/apis/attendance/sessions/${session._id}/logs?limit=10000`), { headers: { 'Authorization': `Bearer ${token}` } })
        if (!logsRes.ok) {
          console.error('Failed to fetch session logs')
          return
        }
        const logsData = await logsRes.json()
        const logs = logsData.data || []

        // Fetch all students to determine absentees
        const studentsRes = await fetch(buildAPIUrl('/apis/students?limit=10000'), { headers: { 'Authorization': 'Bearer SSAAMStudents' } })
        const studentsData = studentsRes.ok ? await studentsRes.json() : {}
        const allStudents = studentsData.students || studentsData.data || []

        const attendedIds = new Set(logs.map(l => (l.student_id_number || l.student?.student_id || l.student_id)))

        const absent = allStudents.filter(s => !attendedIds.has(s.student_id)).map(s => ({ ...s }))
        this.absentList = absent
      } catch (err) {
        console.error('Error computing absent list', err)
      }
    },
    exportAbsentCSV(session) {
      if (!this.absentList || this.absentList.length === 0) return
      const rows = this.absentList.map(s => ({ 'Student ID': s.student_id || s.student?.student_id, 'Name': s.full_name || s.student?.full_name }))
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Absent')
      const safeTitle = (this.event && this.event.title) ? this.event.title.replace(/[^a-z0-9]/gi, '_') : this.id
      const filename = `Absent_${safeTitle}_${session.label || session._id}.xlsx`
      XLSX.writeFile(workbook, filename)
    }
  }
}
</script>

<style scoped>
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
</style>
