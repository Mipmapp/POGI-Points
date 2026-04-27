<template>
  <div class="space-y-3">
    <!-- Enable toggle -->
    <label
      :class="['flex items-start gap-3 border-2 rounded-xl p-4 cursor-pointer transition', enabled ? (isCOE ? 'bg-orange-50 border-orange-300' : isSOM ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300') : 'bg-gray-50 border-gray-200 hover:bg-gray-100']"
    >
      <input
        type="checkbox"
        :checked="enabled"
        @change="onToggle($event.target.checked)"
        :class="['w-5 h-5 rounded mt-0.5 cursor-pointer', isCOE ? 'text-orange-600' : isSOM ? 'text-green-600' : 'text-blue-600']"
      />
      <div class="flex-1">
        <p :class="['font-semibold text-sm', isCOE ? 'text-orange-900' : isSOM ? 'text-green-900' : 'text-blue-900']">Restrict check-in by GPS location</p>
        <p class="text-xs text-gray-600 mt-0.5">
          Only devices physically within the chosen radius of the pin will be allowed to record attendance for this event.
        </p>
      </div>
    </label>

    <!-- Editor (only when enabled) -->
    <div v-if="enabled" class="space-y-3">
      <!-- Map container -->
      <div class="relative">
        <div
          ref="mapEl"
          class="w-full h-64 sm:h-72 rounded-xl border-2 border-gray-300 overflow-hidden bg-gray-100"
        ></div>
        <div v-if="mapLoading" class="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl pointer-events-none">
          <div class="flex items-center gap-2 text-gray-600 text-sm">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Loading map...
          </div>
        </div>
        <div v-if="mapError" class="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl p-4">
          <div class="text-center">
            <p class="text-sm text-red-600 font-medium mb-1">Couldn't load the map</p>
            <p class="text-xs text-gray-500">You can still type coordinates manually below.</p>
          </div>
        </div>
      </div>

      <!-- Quick-action buttons -->
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          @click="useMyLocation"
          :disabled="locating"
          :class="['inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed', isCOE ? 'bg-orange-600 text-white hover:bg-orange-700' : isSOM ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700']"
        >
          <svg v-if="!locating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ locating ? 'Getting location…' : 'Use my current location' }}
        </button>
        <button
          v-if="hasCoords"
          type="button"
          @click="recenterMap"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Recenter on pin
        </button>
      </div>

      <p class="text-xs text-gray-500 italic">
        Tap anywhere on the map to drop the pin, or drag the pin to fine-tune. The shaded circle shows the allowed check-in area.
      </p>

      <!-- Manual lat/lng/radius controls -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            :value="latitude ?? ''"
            @input="onLatInput($event.target.value)"
            placeholder="e.g. 8.1493"
            :class="['w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm font-mono', isCOE ? 'border-orange-300 focus:ring-orange-600' : isSOM ? 'border-green-300 focus:ring-green-600' : 'border-blue-300 focus:ring-blue-600']"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            :value="longitude ?? ''"
            @input="onLngInput($event.target.value)"
            placeholder="e.g. 123.0588"
            :class="['w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm font-mono', isCOE ? 'border-orange-300 focus:ring-orange-600' : isSOM ? 'border-green-300 focus:ring-green-600' : 'border-blue-300 focus:ring-blue-600']"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Radius (meters)</label>
          <input
            type="number"
            min="10"
            max="5000"
            step="5"
            :value="radius"
            @input="onRadiusInput($event.target.value)"
            :class="['w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm font-mono', isCOE ? 'border-orange-300 focus:ring-orange-600' : isSOM ? 'border-green-300 focus:ring-green-600' : 'border-blue-300 focus:ring-blue-600']"
          />
        </div>
      </div>

      <!-- Status / hint -->
      <div v-if="!hasCoords" class="text-xs px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
        No pin set yet. Use "Use my current location" or tap the map to choose the event spot.
      </div>
      <div v-else class="text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
        Pin set at <span class="font-mono">{{ formatCoord(latitude) }}, {{ formatCoord(longitude) }}</span> — students within <span class="font-semibold">{{ radius }}m</span> can check in.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  enabled: { type: Boolean, default: false },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  radius: { type: Number, default: 80 },
  // Theme flags so the component matches the calling page's college accent.
  isCOE: { type: Boolean, default: false },
  isSOM: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:enabled',
  'update:latitude',
  'update:longitude',
  'update:radius'
])

const mapEl = ref(null)
const mapLoading = ref(false)
const mapError = ref(false)
const locating = ref(false)

let map = null
let marker = null
let circle = null
let leaflet = null
let suppressMoveEvent = false

const hasCoords = computed(() => Number.isFinite(props.latitude) && Number.isFinite(props.longitude))

// Default fallback: JRMSU Katipunan-area coordinates, just so the map has
// somewhere reasonable to open before the admin sets a pin.
const DEFAULT_LAT = 8.5023
const DEFAULT_LNG = 123.3464

const formatCoord = (v) => Number.isFinite(v) ? v.toFixed(6) : '—'

// ---------- Leaflet loader (CDN, cached across components) ----------
// We load Leaflet on demand so we don't pay the cost on every page.
function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.L) return Promise.resolve(window.L)
  if (window.__leafletLoaderPromise) return window.__leafletLoaderPromise

  window.__leafletLoaderPromise = new Promise((resolve, reject) => {
    // CSS
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      link.setAttribute('data-leaflet-css', '1')
      document.head.appendChild(link)
    }
    // JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    script.crossOrigin = ''
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Failed to load Leaflet'))
    document.head.appendChild(script)
  })
  return window.__leafletLoaderPromise
}

// ---------- Map lifecycle ----------
async function ensureMap() {
  if (map || !mapEl.value) return
  mapLoading.value = true
  mapError.value = false
  try {
    leaflet = await loadLeaflet()
    await nextTick()
    if (!mapEl.value) return

    const startLat = hasCoords.value ? props.latitude : DEFAULT_LAT
    const startLng = hasCoords.value ? props.longitude : DEFAULT_LNG
    const startZoom = hasCoords.value ? 17 : 13

    map = leaflet.map(mapEl.value, {
      center: [startLat, startLng],
      zoom: startZoom,
      zoomControl: true,
      attributionControl: true
    })

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    map.on('click', (e) => {
      setPin(e.latlng.lat, e.latlng.lng, { recenter: false })
    })

    if (hasCoords.value) {
      drawMarker(props.latitude, props.longitude)
    }

    // Leaflet sometimes mis-sizes when mounted inside an animated/transitioning
    // modal. Force a recompute on the next frame.
    setTimeout(() => { try { map && map.invalidateSize() } catch (_) {} }, 200)
  } catch (err) {
    console.error('[GeofenceMap] map load error:', err)
    mapError.value = true
  } finally {
    mapLoading.value = false
  }
}

function drawMarker(lat, lng) {
  if (!leaflet || !map) return
  if (!marker) {
    marker = leaflet.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const ll = marker.getLatLng()
      setPin(ll.lat, ll.lng, { recenter: false, fromMarker: true })
    })
  } else {
    suppressMoveEvent = true
    marker.setLatLng([lat, lng])
    suppressMoveEvent = false
  }

  if (!circle) {
    circle = leaflet.circle([lat, lng], {
      radius: props.radius || 80,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 2
    }).addTo(map)
  } else {
    circle.setLatLng([lat, lng])
    circle.setRadius(props.radius || 80)
  }
}

function setPin(lat, lng, { recenter = true, fromMarker = false } = {}) {
  emit('update:latitude', Number(lat))
  emit('update:longitude', Number(lng))
  if (map && leaflet) {
    drawMarker(lat, lng)
    if (recenter && !fromMarker) {
      map.setView([lat, lng], Math.max(map.getZoom(), 17))
    }
  }
}

function recenterMap() {
  if (!map || !hasCoords.value) return
  map.setView([props.latitude, props.longitude], Math.max(map.getZoom(), 17))
}

function destroyMap() {
  try {
    if (map) {
      map.off()
      map.remove()
    }
  } catch (_) { /* noop */ }
  map = null
  marker = null
  circle = null
}

// ---------- Input handlers ----------
function onToggle(checked) {
  emit('update:enabled', checked)
}

function onLatInput(v) {
  if (v === '' || v === null) {
    emit('update:latitude', null)
    return
  }
  const n = Number(v)
  if (Number.isFinite(n)) {
    emit('update:latitude', n)
    if (Number.isFinite(props.longitude)) {
      // Defer drawing until both coords are valid.
      drawMarker(n, props.longitude)
    }
  }
}

function onLngInput(v) {
  if (v === '' || v === null) {
    emit('update:longitude', null)
    return
  }
  const n = Number(v)
  if (Number.isFinite(n)) {
    emit('update:longitude', n)
    if (Number.isFinite(props.latitude)) {
      drawMarker(props.latitude, n)
    }
  }
}

function onRadiusInput(v) {
  let n = Number(v)
  if (!Number.isFinite(n)) return
  if (n < 10) n = 10
  if (n > 5000) n = 5000
  emit('update:radius', n)
  if (circle) circle.setRadius(n)
}

async function useMyLocation() {
  if (!('geolocation' in navigator)) {
    alert('Your device does not support geolocation.')
    return
  }
  locating.value = true
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      })
    })
    setPin(pos.coords.latitude, pos.coords.longitude, { recenter: true })
  } catch (err) {
    console.warn('[GeofenceMap] geolocation error:', err)
    const msg = err && err.code === 1
      ? 'Location permission denied. Please allow location access in your browser.'
      : 'Could not get your location. Try again or enter coordinates manually.'
    alert(msg)
  } finally {
    locating.value = false
  }
}

// ---------- Reactivity glue ----------
// When the toggle flips on, mount the map next tick (after v-if reveals it).
watch(() => props.enabled, async (val) => {
  if (val) {
    await nextTick()
    ensureMap()
  } else {
    destroyMap()
  }
})

// External lat/lng changes (e.g. parent reset) → keep map in sync.
watch(() => [props.latitude, props.longitude], ([lat, lng]) => {
  if (suppressMoveEvent) return
  if (map && leaflet && Number.isFinite(lat) && Number.isFinite(lng)) {
    drawMarker(lat, lng)
  }
})

watch(() => props.radius, (r) => {
  if (circle) circle.setRadius(Number(r) || 80)
})

onMounted(() => {
  if (props.enabled) ensureMap()
})

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<style scoped>
:deep(.leaflet-container) {
  font-family: inherit;
}
</style>
