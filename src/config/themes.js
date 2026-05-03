import { getCollege } from './api.js'

// List of all colleges
export const COLLEGES = ['CCS', 'COE', 'SOM', 'CNAHS']

// [AI WARNING] The `departments` parameter is accepted but never used inside this function — it only calls getCollege() internally. The parameter can be removed from all call sites.
export const checkDepartment = (deptCode, departments) => {
  const currentCollege = getCollege()
  return currentCollege === deptCode
}
