import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'

// Theme toggler: switch blue gradients to SOM green-yellow when SOM selected
function isSomSelected() {
        try {
                const chosen = localStorage.getItem('loginChosenDepartment') || null
                if (chosen) return String(chosen).toUpperCase() === 'SOM'
                const currentUser = localStorage.getItem('currentUser')
                if (currentUser) {
                        const u = JSON.parse(currentUser)
                        const dept = u.selectedDepartment || u.selectedDepartment?.label || u.college || u.college_label
                        return String(dept || '').toUpperCase() === 'SOM'
                }
        } catch (e) {}
        return false
}

const classMapToSom = [
        [/^from-blue-\d{3}$/, 'from-som-green'],
        [/^via-blue-\d{3}$/, 'via-som-green'],
        [/^to-blue-\d{3}$/, 'to-som-yellow'],
        [/^from-blue$/, 'from-som-green'],
        [/^to-blue$/, 'to-som-yellow'],
        [/^from-cyan-\d{3}$/, 'from-som-green'],
        [/^to-cyan-\d{3}$/, 'to-som-yellow']
]

const classMapFromSom = [
        [/^from-som-green$/, 'from-blue-700'],
        [/^via-som-green$/, 'via-blue-600'],
        [/^to-som-yellow$/, 'to-blue-500']
]

function replaceClassesForElement(el, toSom = true) {
        if (!el || !el.classList) return
        const maps = toSom ? classMapToSom : classMapFromSom
        const classes = Array.from(el.classList)
        for (const c of classes) {
                for (const [rx, repl] of maps) {
                        if (rx.test(c)) {
                                el.classList.remove(c)
                                el.classList.add(repl)
                                break
                        }
                }
        }
}

function scanAndReplace(root = document.body, toSom = true) {
        if (!root) return
        // Replace on the root node if it has classes
        replaceClassesForElement(root, toSom)
        // Query elements that likely contain blue gradients
        const selector = '[class*="from-blue-"], [class*="to-blue-"], [class*="via-blue-"], [class*="from-cyan-"], [class*="to-cyan-"]'
        const nodes = root.querySelectorAll(selector)
        nodes.forEach(n => replaceClassesForElement(n, toSom))
}

function applyTheme() {
        const som = isSomSelected()
        if (som) document.documentElement.classList.add('theme-som')
        else document.documentElement.classList.remove('theme-som')
        // perform class swaps
        scanAndReplace(document.body, som)
}

// Observe storage changes (other tabs) and DOM mutations for dynamic updates
window.addEventListener('storage', () => setTimeout(applyTheme, 50))
const observer = new MutationObserver((mutations) => {
        // apply to newly added nodes
        for (const m of mutations) {
                if (m.addedNodes && m.addedNodes.length) {
                        m.addedNodes.forEach(n => {
                                if (n.nodeType === 1) replaceClassesForElement(n, isSomSelected())
                        })
                }
        }
})
observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

// initial apply
setTimeout(applyTheme, 120)

// [AI WARNING] Dead code — initializeAdmin() was used in an old localStorage-based auth system before MongoDB/JWT was introduced. The entire block is safe to delete.
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