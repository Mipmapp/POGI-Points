import departments from './departments.js'

// Helper function to determine if user is from COE based on their program
const getCollegeFromProgram = (program) => {
  if (!program || !departments) return null
  for (const dept of departments) {
    if (dept.programs.some(p => p.shortName === program)) {
      return dept.label
    }
  }
  return null
}

// Helper function to get college (CCS, COE, SOM, or CNAHS)
export const getCollege = () => {
  try {
    // 1) Pre-login explicit choice
    const chosenDept = localStorage.getItem('loginChosenDepartment')
    if (['COE', 'SOM', 'CNAHS'].includes(chosenDept)) return chosenDept

    // 2) If a program was saved pre-login, use it
    const chosenProg = localStorage.getItem('loginChosenProgram')
    if (chosenProg) {
      const college = getCollegeFromProgram(chosenProg)
      if (college && ['COE', 'SOM', 'CNAHS'].includes(college)) return college
    }

    // 3) Check currentUser; prefer an explicit selectedDepartment (used for admins/masters)
    const userJson = localStorage.getItem('currentUser') || localStorage.getItem('user')
    const user = userJson ? JSON.parse(userJson) : {}
    // If the login flow stored a selectedDepartment object, respect it
    if (user && user.selectedDepartment && typeof user.selectedDepartment.label === 'string') {
      if (['COE', 'SOM', 'CNAHS'].includes(user.selectedDepartment.label)) {
        return user.selectedDepartment.label
      }
    }

    // 4) Fallback to program-based detection (students)
    const userProgram = user.program
    const college = getCollegeFromProgram(userProgram)
    if (college && ['COE', 'SOM', 'CNAHS'].includes(college)) return college

    return 'CCS'
  } catch (e) {
    return 'CCS'
  }
}

// [AI WARNING] Possibly unused export — no references found outside this file. Safe to delete if collection-prefix logic stays on the backend.
export const getCollegePrefix = () => {
  const college = getCollege()
  switch (college) {
    case 'COE': return 'coe_'
    case 'SOM': return 'som_'
    case 'CNAHS': return 'cnahs_'
    default: return 'ccs_'
  }
}

// Helper function to get the appropriate API URL based on user's college
export const getAPIBaseURL = () => {
  try {
    // If VITE_API_URL is set, use it; otherwise use relative URL (proxied by Vite in dev)
    const configured = import.meta.env.VITE_API_URL
    if (configured && configured.trim() !== '') return configured.trim()
    return ''
  } catch (e) {
    return ''
  }
}

// Helper function to build full API URLs (evaluates base at call time)
export const buildAPIUrl = (endpoint) => {
  // If it's already a full URL, return it as-is
  if (typeof endpoint === 'string' && endpoint.startsWith('http')) return endpoint
  const base = getAPIBaseURL()
  const cleanEndpoint = typeof endpoint === 'string' && endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${cleanEndpoint}`
}

// Helper to get default request headers with college information
export const getDefaultHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-SSAAM-College': getCollege() // Send college to backend
  }
}

export default getAPIBaseURL
