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
      { shortName: 'BSCE', fullName: 'Bachelor of Science in Civil Engineering' },
      { shortName: 'BSEE', fullName: 'Bachelor of Science in Electrical Engineering' },
      { shortName: 'BSECE', fullName: 'Bachelor of Science in Electronics Engineering' },
      { shortName: 'BSCPE', fullName: 'Bachelor of Science in Computer Engineering' }
    ]
  }
]

const som = {
  id: 3,
  name: 'School of Midwifery',
  label: 'SOM',
  logo: '/icons/som.svg',
  programs: [
    { shortName: 'BSM', fullName: 'Bachelor oF Science in Midwifery' }
  ]
}

departments.push(som)

export default departments
