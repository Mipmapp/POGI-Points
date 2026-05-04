/**
 * theme.js — SSAAM theme management utilities
 *
 * Handles dynamic class swapping when the active college changes.
 * Extracted from main.js so it can be imported and tested independently.
 *
 * Supported themes:
 *  - CCS (default): blue gradients
 *  - SOM: green → yellow gradients
 *  - COE / CNAHS: handled via CSS variables / Tailwind custom colours
 */

/** @returns {boolean} */
export function isSomSelected() {
  try {
    const chosen = localStorage.getItem('loginChosenDepartment') || null
    if (chosen) return String(chosen).toUpperCase() === 'SOM'
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      const u = JSON.parse(currentUser)
      const dept =
        u.selectedDepartment?.label ||
        u.selectedDepartment ||
        u.college ||
        u.college_label
      return String(dept || '').toUpperCase() === 'SOM'
    }
  } catch { /* ignore parse errors */ }
  return false
}

const CLASS_MAP_TO_SOM = [
  [/^from-blue-\d{3}$/, 'from-som-green'],
  [/^via-blue-\d{3}$/,  'via-som-green'],
  [/^to-blue-\d{3}$/,   'to-som-yellow'],
  [/^from-blue$/,        'from-som-green'],
  [/^to-blue$/,          'to-som-yellow'],
  [/^from-cyan-\d{3}$/, 'from-som-green'],
  [/^to-cyan-\d{3}$/,   'to-som-yellow']
]

const CLASS_MAP_FROM_SOM = [
  [/^from-som-green$/, 'from-blue-700'],
  [/^via-som-green$/,  'via-blue-600'],
  [/^to-som-yellow$/,  'to-blue-500']
]

/**
 * Swap gradient classes on a single element.
 * @param {Element} el
 * @param {boolean} toSom
 */
export function replaceClassesForElement(el, toSom = true) {
  if (!el || !el.classList) return
  const maps = toSom ? CLASS_MAP_TO_SOM : CLASS_MAP_FROM_SOM
  const classes = Array.from(el.classList)
  for (const cls of classes) {
    for (const [rx, replacement] of maps) {
      if (rx.test(cls)) {
        el.classList.remove(cls)
        el.classList.add(replacement)
        break
      }
    }
  }
}

/**
 * Walk the DOM from `root` and swap all blue ↔ SOM gradient classes.
 * @param {Element} [root=document.body]
 * @param {boolean} [toSom=true]
 */
export function scanAndReplace(root = document.body, toSom = true) {
  if (!root) return
  replaceClassesForElement(root, toSom)
  const selector = [
    '[class*="from-blue-"]',
    '[class*="to-blue-"]',
    '[class*="via-blue-"]',
    '[class*="from-cyan-"]',
    '[class*="to-cyan-"]'
  ].join(', ')
  root.querySelectorAll(selector).forEach(n => replaceClassesForElement(n, toSom))
}

/**
 * Apply the correct theme based on current localStorage state.
 * Should be called on app mount and whenever storage changes.
 */
export function applyTheme() {
  const som = isSomSelected()
  if (som) document.documentElement.classList.add('theme-som')
  else document.documentElement.classList.remove('theme-som')
  scanAndReplace(document.body, som)
}

/**
 * Set up storage-change listener and MutationObserver so theme updates
 * propagate automatically when the college selection changes.
 * Returns a cleanup function — call it on unmount or before re-initialising.
 * @returns {() => void} cleanup
 */
export function initThemeWatcher() {
  const onStorage = () => setTimeout(applyTheme, 50)
  window.addEventListener('storage', onStorage)

  const observer = new MutationObserver((mutations) => {
    const som = isSomSelected()
    for (const m of mutations) {
      if (m.addedNodes?.length) {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1) replaceClassesForElement(n, som)
        })
      }
    }
  })
  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  })

  return function cleanup() {
    window.removeEventListener('storage', onStorage)
    observer.disconnect()
  }
}
