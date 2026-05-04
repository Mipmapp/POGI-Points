/**
 * departments.js — canonical list of JRMSU colleges and their degree programs.
 *
 * Each entry has:
 *  - id     {number}   Unique numeric identifier
 *  - name   {string}   Full official college name
 *  - label  {string}   Short code used throughout the system (CCS, COE, SOM, CNAHS)
 *  - logo   {string}   Path to the college SVG icon in /public/icons/
 *  - programs {Array}  Degree programs offered by this college
 *    - shortName {string}  Program abbreviation (e.g. "BSIT")
 *    - fullName  {string}  Complete program title
 */
const departments = [
  {
    id: 1,
    name: 'College of Computing Studies',
    label: 'CCS',
    logo: '/icons/ccs.svg',
    programs: [
      { shortName: 'BSIT', fullName: 'Bachelor of Science in Information Technology' },
      { shortName: 'BSCS', fullName: 'Bachelor of Science in Computer Science' },
      { shortName: 'BSIS', fullName: 'Bachelor of Science in Information Systems' }
    ]
  },
  {
    id: 2,
    name: 'College of Engineering',
    label: 'COE',
    logo: '/icons/coe.svg',
    programs: [
      { shortName: 'BSCE',  fullName: 'Bachelor of Science in Civil Engineering' },
      { shortName: 'BSEE',  fullName: 'Bachelor of Science in Electrical Engineering' },
      { shortName: 'BSECE', fullName: 'Bachelor of Science in Electronics Engineering' },
      { shortName: 'BSCPE', fullName: 'Bachelor of Science in Computer Engineering' }
    ]
  },
  {
    id: 3,
    name: 'School of Midwifery',
    label: 'SOM',
    logo: '/icons/som.svg',
    programs: [
      { shortName: 'BSM', fullName: 'Bachelor of Science in Midwifery' }
    ]
  },
  {
    id: 4,
    name: 'College of Nursing and Allied Health Sciences',
    label: 'CNAHS',
    logo: '/icons/cnahs.svg',
    programs: [
      { shortName: 'BSN', fullName: 'Bachelor of Science in Nursing' }
    ]
  }
]

export default departments
