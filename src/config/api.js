// API Configuration
// Use environment variable or default to Vercel backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ssaam-api.vercel.app'

// Helper function to build full API URLs
export const buildAPIUrl = (endpoint) => {
  // If it's already a full URL, return it as-is
  if (endpoint.startsWith('http')) {
    return endpoint
  }
  // Remove leading slash if present and append to base URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${cleanEndpoint}`
}

export default API_BASE_URL
