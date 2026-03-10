import { getCollege } from './api.js'

// List of all colleges
export const COLLEGES = ['CCS', 'COE', 'SOM', 'CNAHS']

// Check if the current user's department matches the given department code
export const checkDepartment = (deptCode, departments) => {
  const currentCollege = getCollege()
  return currentCollege === deptCode
}
