import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'
import { applyTheme, initThemeWatcher } from './utils/theme.js'

initThemeWatcher()
setTimeout(applyTheme, 120)

// JS fallback: block pull-to-refresh only when the user swipes down at the very top.
// This covers browsers/WebViews that ignore overscroll-behavior-y (e.g. older Android).
// Does NOT block normal upward scrolling or scrolling inside inner containers.
;(() => {
  let startY = 0
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY
  }, { passive: true })

  document.addEventListener('touchmove', (e) => {
    const dy = e.touches[0].clientY - startY
    // Only block when the document itself is at the very top AND user swipes downward
    if (dy > 0 && window.scrollY === 0) {
      // Make sure the touch target (or any ancestor) is not itself a scrollable element
      const target = e.target
      const isInsideScroller = target.closest(
        '.overflow-y-auto, .overflow-auto, .overflow-scroll, [data-scroll]'
      )
      if (!isInsideScroller) {
        e.preventDefault()
      }
    }
  }, { passive: false })
})()

const app = createApp(App)
app.use(router)
app.mount('#app')
