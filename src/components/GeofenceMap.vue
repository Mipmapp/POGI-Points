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
      <!-- Map container with floating overlays -->
      <div class="relative rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md">
        <div
          ref="mapEl"
          class="w-full h-80 sm:h-96 bg-gray-100"
        ></div>

        <!-- Loading overlay -->
        <div v-if="mapLoading" class="absolute inset-0 flex items-center justify-center bg-white/70 pointer-events-none">
          <div class="flex items-center gap-2 text-gray-600 text-sm">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Loading map...
          </div>
        </div>

        <!-- Error overlay -->
        <div v-if="mapError" class="absolute inset-0 flex items-center justify-center bg-white/90 p-4">
          <div class="text-center">
            <p class="text-sm text-red-600 font-medium mb-1">Couldn't load the map</p>
            <p class="text-xs text-gray-500">You can still type coordinates manually below.</p>
          </div>
        </div>

        <!-- Top-left tile layer switcher -->
        <div v-if="!mapLoading && !mapError" class="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur rounded-xl shadow-md border border-gray-200 overflow-hidden flex text-xs font-semibold">
          <button
            type="button"
            @click="setTileLayer('street')"
            :class="['px-3 py-1.5 transition', tileMode === 'street' ? (isCOE ? 'bg-orange-600 text-white' : isSOM ? 'bg-green-600 text-white' : 'bg-blue-600 text-white') : 'text-gray-700 hover:bg-gray-100']"
          >
            Street
          </button>
          <button
            type="button"
            @click="setTileLayer('satellite')"
            :class="['px-3 py-1.5 transition border-l border-gray-200', tileMode === 'satellite' ? (isCOE ? 'bg-orange-600 text-white' : isSOM ? 'bg-green-600 text-white' : 'bg-blue-600 text-white') : 'text-gray-700 hover:bg-gray-100']"
          >
            Satellite
          </button>
        </div>

        <!-- Top-right live tracking indicator -->
        <div v-if="!mapLoading && !mapError && liveTracking" class="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur rounded-xl shadow-md border border-gray-200 px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-gray-700">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          Live · ±{{ Math.round(myAccuracy || 0) }}m
        </div>

        <!-- Bottom info bar (current location → pin distance) -->
        <div v-if="!mapLoading && !mapError && hasMyLocation && hasCoords" class="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur rounded-xl shadow-md border border-gray-200 px-3 py-2 flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>
            <span class="font-semibold text-gray-700 truncate">You're <span :class="distanceFromPin <= radius ? 'text-emerald-600' : 'text-amber-600'">{{ formatDistance(distanceFromPin) }}</span> from the pin</span>
          </div>
          <span :class="['px-2 py-0.5 rounded-full font-bold flex-shrink-0', distanceFromPin <= radius ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700']">
            {{ distanceFromPin <= radius ? 'Inside zone' : 'Outside zone' }}
          </span>
        </div>
      </div>

      <!-- Quick-action buttons -->
      <div class="flex flex-wrap gap-2">
        <!-- Live tracking toggle -->
        <button
          type="button"
          @click="toggleLiveTracking"
          :disabled="locating && !liveTracking"
          :class="['inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed border-2',
            liveTracking
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : (isCOE ? 'bg-white text-orange-700 border-orange-300 hover:bg-orange-50' : isSOM ? 'bg-white text-green-700 border-green-300 hover:bg-green-50' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50')]"
          :title="liveTracking ? 'Stop live tracking' : 'Show my location live on the map'"
        >
          <span v-if="liveTracking" class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v2m0 16v2M2 12h2m16 0h2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414" />
            <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-width="2" />
          </svg>
          {{ liveTracking ? 'Live tracking ON' : 'Show me live' }}
        </button>

        <!-- Drop pin at my location -->
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
          {{ locating ? 'Getting location…' : 'Drop pin here' }}
        </button>

        <!-- Recenter on pin -->
        <button
          v-if="hasCoords"
          type="button"
          @click="recenterMap"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition border-2 border-gray-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Recenter on pin
        </button>

        <!-- Recenter on me -->
        <button
          v-if="hasMyLocation"
          type="button"
          @click="recenterOnMe"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border-2 border-emerald-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" stroke-width="2" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
          Recenter on me
        </button>
      </div>

      <p class="text-xs text-gray-500 italic">
        Tap anywhere on the map to drop the pin, or drag the pin to fine-tune. The blue dot is your live location; the shaded circle is the allowed check-in area.
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
        No pin set yet. Use "Drop pin here" or tap the map to choose the event spot.
      </div>
      <div v-else class="text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
        Pin set at <span class="font-mono">{{ formatCoord(latitude) }}, {{ formatCoord(longitude) }}</span> — students within <span class="font-semibold">{{ radius }}m</span> can check in.
      </div>

      <!-- Live "you are here" details -->
      <div v-if="hasMyLocation" class="text-xs px-3 py-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-between gap-2 flex-wrap">
        <span>
          You're at <span class="font-mono">{{ formatCoord(myLat) }}, {{ formatCoord(myLng) }}</span>
          <span class="text-blue-700">(±{{ Math.round(myAccuracy || 0) }}m)</span>
        </span>
        <span v-if="hasCoords" :class="['font-semibold', distanceFromPin <= radius ? 'text-emerald-700' : 'text-amber-700']">
          {{ formatDistance(distanceFromPin) }} from pin
        </span>
      </div>

      <!-- Geolocation error -->
      <div v-if="locationError" class="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-800 border border-red-200">
        {{ locationError }}
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
const tileMode = ref('street') // 'street' | 'satellite'

// Live "you are here" state
const liveTracking = ref(false)
const myLat = ref(null)
const myLng = ref(null)
const myAccuracy = ref(null)
const locationError = ref('')
let watchId = null

let map = null
let marker = null
let circle = null
let leaflet = null
let suppressMoveEvent = false

// Tile layer references so we can swap them
let streetLayer = null
let satelliteLayer = null

// Live "me" marker + accuracy circle
let meMarker = null
let meAccuracyCircle = null

const hasCoords = computed(() => Number.isFinite(props.latitude) && Number.isFinite(props.longitude))
const hasMyLocation = computed(() => Number.isFinite(myLat.value) && Number.isFinite(myLng.value))

// Default fallback: JRMSU Katipunan-area coordinates, just so the map has
// somewhere reasonable to open before the admin sets a pin.
const DEFAULT_LAT = 8.5023
const DEFAULT_LNG = 123.3464

const formatCoord = (v) => Number.isFinite(v) ? v.toFixed(6) : '—'

// Haversine distance in meters between two lat/lng pairs
function haversineMeters(aLat, aLng, bLat, bLng) {
  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return null
  const R = 6371000
  const toRad = (d) => d * Math.PI / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const a = sinDLat * sinDLat + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

const distanceFromPin = computed(() => {
  if (!hasCoords.value || !hasMyLocation.value) return null
  return haversineMeters(myLat.value, myLng.value, props.latitude, props.longitude)
})

const formatDistance = (m) => {
  if (m == null || !Number.isFinite(m)) return '—'
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(2)}km`
}

// ---------- Leaflet loader (CDN, cached across components) ----------
function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.L) return Promise.resolve(window.L)
  if (window.__leafletLoaderPromise) return window.__leafletLoaderPromise

  window.__leafletLoaderPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      link.setAttribute('data-leaflet-css', '1')
      document.head.appendChild(link)
    }
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

// ---------- Custom themed marker icon (HTML/CSS based, no external assets) ----------
function buildPinIcon() {
  if (!leaflet) return null
  const accentHex = props.isCOE ? '#ea580c' : props.isSOM ? '#16a34a' : '#2563eb'
  const html = `
    <div style="position:relative;width:36px;height:46px;transform:translate(-50%,-100%);">
      <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:36px;height:36px;border-radius:50% 50% 50% 0;background:${accentHex};box-shadow:0 4px 10px rgba(0,0,0,.35);transform:translateX(-50%) rotate(-45deg);border:3px solid white;"></div>
      <div style="position:absolute;left:50%;top:8px;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;background:white;"></div>
    </div>
  `
  return leaflet.divIcon({
    html,
    className: '',
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -46]
  })
}

function buildMeIcon() {
  if (!leaflet) return null
  const html = `
    <div style="position:relative;width:22px;height:22px;transform:translate(-50%,-50%);">
      <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 2px rgba(59,130,246,.35),0 4px 10px rgba(0,0,0,.25);"></div>
      <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(59,130,246,.35);animation:gfm-ping 1.6s cubic-bezier(0,0,.2,1) infinite;"></div>
    </div>
  `
  return leaflet.divIcon({
    html,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  })
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

    // Build both tile layers but only add the active one
    streetLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    })
    satelliteLayer = leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    })
    streetLayer.addTo(map)

    map.on('click', (e) => {
      setPin(e.latlng.lat, e.latlng.lng, { recenter: false })
    })

    if (hasCoords.value) {
      drawMarker(props.latitude, props.longitude)
    }

    // Re-draw any existing live location marker
    if (hasMyLocation.value) drawMeMarker(myLat.value, myLng.value, myAccuracy.value)

    setTimeout(() => { try { map && map.invalidateSize() } catch (_) {} }, 200)
  } catch (err) {
    console.error('[GeofenceMap] map load error:', err)
    mapError.value = true
  } finally {
    mapLoading.value = false
  }
}

function setTileLayer(mode) {
  if (!map || !leaflet) return
  if (mode === tileMode.value) return
  tileMode.value = mode
  if (mode === 'satellite') {
    if (streetLayer && map.hasLayer(streetLayer)) map.removeLayer(streetLayer)
    if (satelliteLayer && !map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map)
  } else {
    if (satelliteLayer && map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer)
    if (streetLayer && !map.hasLayer(streetLayer)) streetLayer.addTo(map)
  }
}

function drawMarker(lat, lng) {
  if (!leaflet || !map) return
  if (!marker) {
    const icon = buildPinIcon()
    marker = leaflet.marker([lat, lng], { draggable: true, icon: icon || undefined }).addTo(map)
    marker.on('dragend', () => {
      const ll = marker.getLatLng()
      setPin(ll.lat, ll.lng, { recenter: false, fromMarker: true })
    })
  } else {
    suppressMoveEvent = true
    marker.setLatLng([lat, lng])
    suppressMoveEvent = false
  }

  const accentHex = props.isCOE ? '#ea580c' : props.isSOM ? '#16a34a' : '#2563eb'
  const accentFill = props.isCOE ? '#fb923c' : props.isSOM ? '#22c55e' : '#3b82f6'
  if (!circle) {
    circle = leaflet.circle([lat, lng], {
      radius: props.radius || 80,
      color: accentHex,
      fillColor: accentFill,
      fillOpacity: 0.15,
      weight: 2
    }).addTo(map)
  } else {
    circle.setLatLng([lat, lng])
    circle.setRadius(props.radius || 80)
  }
}

function drawMeMarker(lat, lng, accuracy) {
  if (!leaflet || !map) return
  if (!meMarker) {
    const icon = buildMeIcon()
    meMarker = leaflet.marker([lat, lng], { icon: icon || undefined, interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map)
  } else {
    meMarker.setLatLng([lat, lng])
  }
  if (Number.isFinite(accuracy) && accuracy > 0) {
    if (!meAccuracyCircle) {
      meAccuracyCircle = leaflet.circle([lat, lng], {
        radius: accuracy,
        color: '#3b82f6',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        interactive: false
      }).addTo(map)
    } else {
      meAccuracyCircle.setLatLng([lat, lng])
      meAccuracyCircle.setRadius(accuracy)
    }
  }
}

function clearMeMarker() {
  if (meMarker) { try { map.removeLayer(meMarker) } catch (_) {} meMarker = null }
  if (meAccuracyCircle) { try { map.removeLayer(meAccuracyCircle) } catch (_) {} meAccuracyCircle = null }
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

function recenterOnMe() {
  if (!map || !hasMyLocation.value) return
  map.setView([myLat.value, myLng.value], Math.max(map.getZoom(), 17))
}

function destroyMap() {
  stopLiveTracking()
  try {
    if (map) {
      map.off()
      map.remove()
    }
  } catch (_) { /* noop */ }
  map = null
  marker = null
  circle = null
  meMarker = null
  meAccuracyCircle = null
  streetLayer = null
  satelliteLayer = null
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
    locationError.value = 'Your device does not support geolocation.'
    return
  }
  locating.value = true
  locationError.value = ''
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      })
    })
    // Update live "me" state too so the user sees themselves on the map
    myLat.value = pos.coords.latitude
    myLng.value = pos.coords.longitude
    myAccuracy.value = pos.coords.accuracy
    drawMeMarker(myLat.value, myLng.value, myAccuracy.value)
    setPin(pos.coords.latitude, pos.coords.longitude, { recenter: true })
  } catch (err) {
    console.warn('[GeofenceMap] geolocation error:', err)
    locationError.value = err && err.code === 1
      ? 'Location permission denied. Please allow location access in your browser.'
      : 'Could not get your location. Try again or enter coordinates manually.'
  } finally {
    locating.value = false
  }
}

function startLiveTracking() {
  if (!('geolocation' in navigator)) {
    locationError.value = 'Your device does not support geolocation.'
    return
  }
  if (watchId != null) return
  locationError.value = ''
  liveTracking.value = true
  // Optimistically request a one-shot fix so we don't have to wait for the first watch tick
  navigator.geolocation.getCurrentPosition(
    (pos) => onLivePosition(pos),
    (err) => onLiveError(err),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  )
  watchId = navigator.geolocation.watchPosition(
    onLivePosition,
    onLiveError,
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
  )
}

function stopLiveTracking() {
  if (watchId != null && navigator.geolocation) {
    try { navigator.geolocation.clearWatch(watchId) } catch (_) {}
  }
  watchId = null
  liveTracking.value = false
  clearMeMarker()
  myLat.value = null
  myLng.value = null
  myAccuracy.value = null
}

function toggleLiveTracking() {
  if (liveTracking.value) stopLiveTracking()
  else startLiveTracking()
}

function onLivePosition(pos) {
  myLat.value = pos.coords.latitude
  myLng.value = pos.coords.longitude
  myAccuracy.value = pos.coords.accuracy
  drawMeMarker(myLat.value, myLng.value, myAccuracy.value)
}

function onLiveError(err) {
  console.warn('[GeofenceMap] live tracking error:', err)
  locationError.value = err && err.code === 1
    ? 'Location permission denied. Live tracking turned off.'
    : 'Could not track your location. Live tracking turned off.'
  stopLiveTracking()
}

// ---------- Reactivity glue ----------
watch(() => props.enabled, async (val) => {
  if (val) {
    await nextTick()
    ensureMap()
  } else {
    destroyMap()
  }
})

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

<style>
@keyframes gfm-ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
