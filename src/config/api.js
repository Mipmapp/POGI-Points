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

// Helper function to get the appropriate API URL based on user's college
export const getAPIBaseURL = () => {
  try {
    // Allow an explicit pre-login selection to override API choice
    const chosenDept = localStorage.getItem('loginChosenDepartment')
    const chosenProg = localStorage.getItem('loginChosenProgram')
    if (chosenDept === 'COE') return 'https://ssaam-coe.vercel.app'
    if (chosenProg) {
      const college = getCollegeFromProgram(chosenProg)
      if (college === 'COE') return 'https://ssaam-coe.vercel.app'
    }

    // Fallback to stored user (post-login)
    const userJson = localStorage.getItem('currentUser') || localStorage.getItem('user')
    const user = userJson ? JSON.parse(userJson) : {}
    const userProgram = user.program
    const college = getCollegeFromProgram(userProgram)
    if (college === 'COE') return 'https://ssaam-coe.vercel.app'

    // Default to CCS/standard API endpoint
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

export default getAPIBaseURL
