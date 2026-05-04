import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'
import { applyTheme, initThemeWatcher } from './utils/theme.js'

initThemeWatcher()
setTimeout(applyTheme, 120)

const app = createApp(App)
app.use(router)
app.mount('#app')
