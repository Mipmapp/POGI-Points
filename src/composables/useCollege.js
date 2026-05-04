/**
 * useCollege — Vue composable that provides reactive college/department state.
 *
 * Replaces the repeated `isCOE`, `isSOM`, `isCNAHS` computed properties
 * that were duplicated across Dashboard, Login, Register, and components.
 *
 * Usage:
 *   import { useCollege } from '@/composables/useCollege'
 *   const { college, isCCS, isCOE, isSOM, isCNAHS } = useCollege()
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getCollege } from '../config/api.js'

export function useCollege() {
  const _tick = ref(0)

  function refresh() {
    _tick.value++
  }

  function onStorage() {
    refresh()
  }

  onMounted(() => {
    window.addEventListener('storage', onStorage)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', onStorage)
  })

  const college = computed(() => {
    void _tick.value
    return getCollege()
  })

  const isCCS   = computed(() => college.value === 'CCS')
  const isCOE   = computed(() => college.value === 'COE')
  const isSOM   = computed(() => college.value === 'SOM')
  const isCNAHS = computed(() => college.value === 'CNAHS')

  /**
   * Returns the active Tailwind gradient class set for the current college.
   * Useful for sidebar/button gradient bindings.
   */
  const collegGradientClasses = computed(() => {
    if (isCOE.value)   return 'from-orange-600 to-red-500'
    if (isSOM.value)   return 'from-green-600 to-yellow-500'
    if (isCNAHS.value) return 'from-green-700 to-green-600'
    return 'from-ssaam-dark to-ssaam-light'
  })

  /**
   * Returns a hex accent color for the current college (for inline styles).
   */
  const collegeAccentColor = computed(() => {
    if (isCOE.value)   return '#ea580c'
    if (isSOM.value)   return '#16a34a'
    if (isCNAHS.value) return '#15803d'
    return '#1e3bdb'
  })

  return {
    college,
    isCCS,
    isCOE,
    isSOM,
    isCNAHS,
    collegGradientClasses,
    collegeAccentColor,
    refreshCollege: refresh
  }
}
