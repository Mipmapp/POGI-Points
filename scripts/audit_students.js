#!/usr/bin/env node
import fs from 'fs'

const API_BASE = process.env.API_BASE_URL || 'https://ssaam-api.vercel.app'
const sessionId = process.argv[2]
const authToken = process.env.AUTH_TOKEN || ''

async function main() {
  try {
    console.log('Fetching students from', API_BASE)
    const studentsRes = await fetch(`${API_BASE}/apis/students?limit=10000`, {
      headers: { 'Authorization': 'Bearer SSAAMStudents' }
    })
    if (!studentsRes.ok) {
      console.error('Failed to fetch students', studentsRes.status)
      process.exit(1)
    }
    const studentsJson = await studentsRes.json()
    const students = studentsJson.students || studentsJson.data || []

    let attendedSet = new Set()
    let absent = []
    if (sessionId) {
      console.log('Fetching session logs for', sessionId)
      const logsRes = await fetch(`${API_BASE}/apis/attendance/sessions/${sessionId}/logs?limit=10000`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (logsRes.ok) {
        const logsJson = await logsRes.json()
        const logs = logsJson.data || []
        for (const l of logs) {
          const sid = l.student_id_number || l.student?.student_id || l.student_id || l.student?.student_id_number
          if (sid) attendedSet.add(sid)
        }
      } else {
        console.error('Failed to fetch session logs', logsRes.status)
      }
      absent = students.filter(s => !attendedSet.has(s.student_id))
    }

    const targetList = sessionId ? absent : students
    const missingPhotos = targetList.filter(s => !(s.photo || s.student?.photo || s.student_image))

    fs.mkdirSync('reports', { recursive: true })
    fs.writeFileSync('reports/students_audit.json', JSON.stringify({ totalStudents: students.length, sessionId: sessionId || null, absentCount: absent.length, missingPhotosCount: missingPhotos.length, missingPhotos }, null, 2))

    const csvLines = ['Student ID,Name,PhotoURL']
    for (const s of missingPhotos) {
      const id = s.student_id || s.student?.student_id || ''
      const name = (s.full_name || s.student?.full_name || '').replace(/"/g, '""')
      const photo = s.photo || s.student?.photo || s.student_image || ''
      csvLines.push(`${id},"${name}","${photo}"`)
    }
    fs.writeFileSync('reports/missing_photos.csv', csvLines.join('\n'))

    console.log(`Done. Students: ${students.length}, missing photos: ${missingPhotos.length}. Reports saved to reports/`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()