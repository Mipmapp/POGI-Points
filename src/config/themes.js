import { getCollege } from './api.js'

// List of all colleges
export const COLLEGES = ['CCS', 'COE', 'SOM', 'CNAHS']

export const checkDepartment = (deptCode) => {
  const currentCollege = getCollege()
  return currentCollege === deptCode
}
