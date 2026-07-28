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
    // When a modal is open the body already has overflow:hidden — background
    // can't scroll anyway, so let the modal's inner scroll area handle the
    // touch freely. Calling preventDefault here would kill modal scrolling.
    if (document.body.classList.contains('modal-scroll-lock')) return

    const dy = e.touches[0].clientY - startY
    // Only block when the document itself is at the very top AND user swipes downward
    if (dy > 0 && window.scrollY === 0) {
      // Make sure the touch target (or any ancestor) is not itself a scrollable element
      const target = e.target
      const isInsideScroller = target.closest(
        '.modal-inner-scroll, .overflow-y-auto, .overflow-auto, .overflow-scroll, [data-scroll]'
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

// ── Service Worker registration with auto-update ──────────────────────────
// The SW uses network-first for HTML, so every online visit fetches the
// latest shell from Vercel. When a new SW version installs (skipWaiting is
// called inside sw.js), we detect the controller change and reload once so
// the fresh assets are served immediately.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      // When a new SW has installed and is waiting to activate
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          // New SW is installed and the page is already controlled
          // (not first load) → reload to apply the update immediately
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // sw.js calls skipWaiting(), so activation is immediate.
            // We reload once the controller actually changes.
          }
        });
      });

      // Reload the page as soon as the new SW takes control
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
          reloading = true;
          window.location.reload();
        }
      });

      // Periodically check for SW updates while the tab is open
      setInterval(() => registration.update(), 60 * 60 * 1000); // every hour
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  });
}
