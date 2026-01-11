import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'

// const initializeAdmin = () => {
//   const users = JSON.parse(localStorage.getItem('users') || '[]')
//   const adminExists = users.some(u => u.role === 'admin')
  
//   if (!adminExists) {
//     const adminUser = {
//       firstName: 'Admin',
//       middleName: '',
//       lastName: 'User',
//       suffix: '',
//       email: 'admin@ssaam.edu',
//       studentId: 'admin',
//       rfidCode: 'admin0000',
//       yearLevel: '',
//       program: '',
//       semester: '',
//       schoolYear: '',
//       role: 'admin',
//       image: ''
//     }
//     users.push(adminUser)  // No need to wrap in array
//     localStorage.setItem('users', JSON.stringify(users))
//   }
// }

// initializeAdmin()

const app = createApp(App)
app.use(router)  // Ensure router is correctly set up in the `router.js` file
app.mount('#app')