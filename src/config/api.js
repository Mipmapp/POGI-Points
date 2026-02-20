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

// Helper function to get college (CCS or COE)
export const getCollege = () => {
  try {
    const chosenDept = localStorage.getItem('loginChosenDepartment')
    if (chosenDept === 'COE') return 'COE'
    
    const chosenProg = localStorage.getItem('loginChosenProgram')
    if (chosenProg) {
      const college = getCollegeFromProgram(chosenProg)
      if (college === 'COE') return 'COE'
    }

    const userJson = localStorage.getItem('currentUser') || localStorage.getItem('user')
    const user = userJson ? JSON.parse(userJson) : {}
    const userProgram = user.program
    const college = getCollegeFromProgram(userProgram)
    if (college === 'COE') return 'COE'

    return 'CCS'
  } catch (e) {
    return 'CCS'
  }
}

// Helper function to get college prefix for collection naming
export const getCollegePrefix = () => {
  return getCollege() === 'COE' ? 'coe_' : 'ccs_'
}

// Helper function to get the appropriate API URL based on user's college
export const getAPIBaseURL = () => {
  try {
    // All colleges use the same backend endpoint
    return import.meta.env.VITE_API_URL || 'https://ssaam-api.vercel.app'
  } catch (e) {
    return import.meta.env.VITE_API_URL || 'https://ssaam-api.vercel.app'
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
