<template>
  <div class="space-y-4">
    <!-- ============ Premium Enable Toggle ============ -->
    <div
      v-if="!readonly"
      :class="['gfm-card relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer',
        enabled
          ? (isCOE ? 'border-orange-300 shadow-lg shadow-orange-100' : isSOM ? 'border-green-300 shadow-lg shadow-green-100' : 'border-blue-300 shadow-lg shadow-blue-100')
          : 'border-gray-200 hover:border-gray-300']"
      @click="onToggle(!enabled)"
    >
      <!-- Animated gradient background when enabled -->
      <div
        :class="['absolute inset-0 transition-opacity duration-300',
          enabled
            ? (isCOE ? 'bg-gradient-to-br from-orange-50 via-orange-100/40 to-amber-50' : isSOM ? 'bg-gradient-to-br from-green-50 via-emerald-100/40 to-green-50' : 'bg-gradient-to-br from-blue-50 via-indigo-100/40 to-blue-50')
            : 'bg-gradient-to-br from-gray-50 to-white opacity-100']"
      ></div>

      <div class="relative flex items-center gap-4 p-4">
        <!-- Icon badge -->
        <div :class="['gfm-icon-badge flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md',
          enabled
            ? (isCOE ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : isSOM ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white')
            : 'bg-gray-200 text-gray-400']">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>

        <div class="flex-1 min-w-0">
          <p :class="['font-bold text-sm sm:text-base flex items-center gap-2', enabled ? (isCOE ? 'text-orange-900' : isSOM ? 'text-green-900' : 'text-blue-900') : 'text-gray-800']">
            GPS Geofence Restriction
            <span v-if="enabled" :class="['px-2 py-0.5 text-[10px] rounded-full font-bold tracking-wide', isCOE ? 'bg-orange-200 text-orange-800' : isSOM ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800']">ACTIVE</span>
            <span v-else class="px-2 py-0.5 text-[10px] rounded-full font-bold tracking-wide bg-gray-200 text-gray-600">OFF</span>
          </p>
          <p class="text-xs sm:text-[13px] text-gray-600 mt-0.5 leading-relaxed">
            Only devices physically within the chosen radius can record attendance for this event.
          </p>
        </div>

        <!-- Modern pill switch -->
        <button
          type="button"
          @click.stop="onToggle(!enabled)"
          :class="['relative inline-flex h-7 w-12 sm:h-8 sm:w-14 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
            enabled
              ? (isCOE ? 'bg-orange-500 focus:ring-orange-400' : isSOM ? 'bg-green-500 focus:ring-green-400' : 'bg-blue-600 focus:ring-blue-400')
              : 'bg-gray-300 focus:ring-gray-400']"
          :aria-pressed="enabled"
        >
          <span :class="['inline-block h-6 w-6 sm:h-7 sm:w-7 transform rounded-full bg-white shadow-lg transition-transform duration-300 mt-0.5', enabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5']"></span>
        </button>
      </div>
    </div>

    <!-- ============ Editor (only when enabled OR in readonly preview mode) ============ -->
    <transition name="gfm-fade">
      <div v-if="enabled || readonly" class="space-y-4">
        <!-- ============ Map Frame with Premium Border ============ -->
        <div :class="['relative rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5',
          isCOE ? 'gfm-frame-coe' : isSOM ? 'gfm-frame-som' : 'gfm-frame-blue']">
          <!-- Inner frame -->
          <div class="relative rounded-3xl overflow-hidden bg-white m-[3px]">
            <div ref="mapEl" :class="['w-full bg-gray-100', compact ? 'h-44 sm:h-52 lg:h-56' : 'h-64 sm:h-80 lg:h-[22rem]']"></div>

            <!-- Loading overlay -->
            <div v-if="mapLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none z-[500]">
              <div class="flex flex-col items-center gap-2 text-gray-700">
                <svg class="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path :class="['opacity-75', isCOE ? 'text-orange-600' : isSOM ? 'text-green-600' : 'text-blue-600']" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <p class="text-sm font-semibold">Loading map…</p>
              </div>
            </div>

            <!-- Error overlay -->
            <div v-if="mapError" class="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm p-4 z-[500]">
              <div class="text-center max-w-xs">
                <div class="w-12 h-12 mx-auto rounded-2xl bg-red-100 flex items-center justify-center mb-2">
                  <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <p class="text-sm text-red-700 font-bold mb-1">Couldn't load the map</p>
                <p class="text-xs text-gray-500">You can still type coordinates manually below.</p>
              </div>
            </div>

            <!-- Top-left: Modern segmented tile switcher (admin/editor only —
                 students see street-only on their attendance map for a
                 simpler, single-purpose UI). -->
            <div v-if="!mapLoading && !mapError && !readonly" class="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 p-1 flex text-xs font-bold">
              <button
                type="button"
                @click="setTileLayer('street')"
                :class="['gfm-seg-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200',
                  tileMode === 'street'
                    ? (isCOE ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md' : isSOM ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md')
                    : 'text-gray-700 hover:bg-gray-100']"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                Street
              </button>
              <button
                type="button"
                @click="setTileLayer('satellite')"
                :class="['gfm-seg-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200',
                  tileMode === 'satellite'
                    ? (isCOE ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md' : isSOM ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md')
                    : 'text-gray-700 hover:bg-gray-100']"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 1018 0 9 9 0 00-18 0zm9-9v18m-9-9h18"/></svg>
                Satellite
              </button>
            </div>

            <!-- Right side, just under the zoom buttons: Live tracking pill -->
            <div v-if="!mapLoading && !mapError && liveTracking" class="absolute top-[5.75rem] right-3 z-[400] bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-emerald-200 px-2.5 py-1 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-800">
              <span class="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
              </span>
              LIVE · ±{{ Math.round(myAccuracy || 0) }}m
            </div>

            <!-- Bottom: Premium distance bar (stacks vertically on very small
                 screens so neither the label nor the badge gets truncated). -->
            <div v-if="!mapLoading && !mapError && hasMyLocation && hasCoords" class="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <div class="flex items-center gap-2 min-w-0">
                <div :class="['flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center', distanceFromPin <= radius ? 'bg-emerald-100' : 'bg-amber-100']">
                  <svg :class="['w-3.5 h-3.5 sm:w-4 sm:h-4', distanceFromPin <= radius ? 'text-emerald-600' : 'text-amber-600']" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>
                </div>
                <span v-if="readonly" class="font-bold text-gray-800 truncate">You're <span :class="distanceFromPin <= radius ? 'text-emerald-600' : 'text-amber-600'">{{ formatDistance(distanceFromPin) }}</span> from the area where attendance is eligible</span>
                <span v-else class="font-bold text-gray-800 truncate">You're <span :class="distanceFromPin <= radius ? 'text-emerald-600' : 'text-amber-600'">{{ formatDistance(distanceFromPin) }}</span> from the pin</span>
              </div>
              <span :class="['px-2.5 py-1 rounded-full font-extrabold self-start sm:self-auto flex-shrink-0 text-[10px] tracking-wide', distanceFromPin <= radius ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700']">
                {{ distanceFromPin <= radius ? 'INSIDE ZONE' : 'OUTSIDE ZONE' }}
              </span>
            </div>
          </div>

          <!-- Tiny attribution footer (replaces the in-map "Leaflet | © OSM"
               watermark with something subtler that still credits OSM/Esri). -->
          <div v-if="!mapError" class="px-3 py-1 bg-white/60 backdrop-blur-sm text-[9px] sm:text-[10px] text-gray-500 text-right select-none">
            Map data © {{ tileMode === 'satellite' ? 'Esri' : 'OpenStreetMap' }} contributors
          </div>
        </div>

        <!-- ============ Quick Action Toolbar ============ -->
        <div v-if="!readonly" :class="['rounded-2xl p-3 border-2 shadow-sm',
          isCOE ? 'bg-gradient-to-br from-orange-50/60 to-white border-orange-100' : isSOM ? 'bg-gradient-to-br from-green-50/60 to-white border-green-100' : 'bg-gradient-to-br from-blue-50/60 to-white border-blue-100']">
          <div class="flex items-center gap-2 mb-2">
            <svg :class="['w-4 h-4', isCOE ? 'text-orange-600' : isSOM ? 'text-green-600' : 'text-blue-600']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <p :class="['text-xs font-bold uppercase tracking-wider', isCOE ? 'text-orange-700' : isSOM ? 'text-green-700' : 'text-blue-700']">Quick Actions</p>
          </div>
          <!-- On large screens force all 4 buttons onto one line; on small
               screens still wrap so the toolbar never overflows. -->
          <div class="flex flex-wrap lg:flex-nowrap gap-2">
            <!-- Live tracking toggle -->
            <button
              type="button"
              @click="toggleLiveTracking"
              :disabled="locating && !liveTracking"
              :class="['gfm-action-btn group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
                liveTracking
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-2 border-emerald-600'
                  : (isCOE ? 'bg-white text-orange-700 border-2 border-orange-300 hover:bg-orange-50 hover:border-orange-400' : isSOM ? 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50 hover:border-green-400' : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400')]"
              :title="liveTracking ? 'Stop live tracking' : 'Show my location live on the map'"
            >
              <span v-if="liveTracking" class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <svg v-else class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v2m0 16v2M2 12h2m16 0h2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414"/>
                <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-width="2"/>
              </svg>
              {{ liveTracking ? 'Live tracking ON' : 'Show me live' }}
            </button>

            <!-- Drop pin at my location -->
            <button
              type="button"
              @click="useMyLocation"
              :disabled="locating"
              :class="['gfm-action-btn group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 border-2',
                isCOE ? 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-600' : isSOM ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-green-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-blue-700']"
            >
              <svg v-if="!locating" class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
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
              class="gfm-action-btn group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Recenter on pin
            </button>

            <!-- Recenter on me -->
            <button
              v-if="hasMyLocation"
              type="button"
              @click="recenterOnMe"
              class="gfm-action-btn group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all duration-200 border-2 border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" stroke-width="2"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
              </svg>
              Recenter on me
            </button>
          </div>

          <p class="text-[11px] text-gray-500 italic mt-3 px-1 flex items-start gap-1.5">
            <svg class="w-3.5 h-3.5 flex-shrink-0 mt-px text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Tap anywhere on the map to drop the pin, or drag the pin to fine-tune. The blue dot is your live location; the shaded circle is the allowed check-in area.
          </p>
        </div>

        <!-- ============ Manual Coordinate Inputs ============ -->
        <div v-if="!readonly" :class="['rounded-2xl border-2 p-4',
          isCOE ? 'border-orange-100 bg-white' : isSOM ? 'border-green-100 bg-white' : 'border-blue-100 bg-white']">
          <div class="flex items-center gap-2 mb-3">
            <svg :class="['w-4 h-4', isCOE ? 'text-orange-600' : isSOM ? 'text-green-600' : 'text-blue-600']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <p :class="['text-xs font-bold uppercase tracking-wider', isCOE ? 'text-orange-700' : isSOM ? 'text-green-700' : 'text-blue-700']">Manual Coordinates</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                <span :class="['w-1.5 h-1.5 rounded-full', isCOE ? 'bg-orange-500' : isSOM ? 'bg-green-500' : 'bg-blue-500']"></span>
                Latitude
              </label>
              <input
                type="number"
                step="any"
                :value="latitude ?? ''"
                @input="onLatInput($event.target.value)"
                placeholder="e.g. 8.1493"
                :class="['w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 outline-none text-sm font-mono transition bg-gray-50 focus:bg-white', isCOE ? 'border-orange-200 focus:border-orange-500 focus:ring-orange-200' : isSOM ? 'border-green-200 focus:border-green-500 focus:ring-green-200' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-200']"
              />
            </div>
            <div>
              <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                <span :class="['w-1.5 h-1.5 rounded-full', isCOE ? 'bg-orange-500' : isSOM ? 'bg-green-500' : 'bg-blue-500']"></span>
                Longitude
              </label>
              <input
                type="number"
                step="any"
                :value="longitude ?? ''"
                @input="onLngInput($event.target.value)"
                placeholder="e.g. 123.0588"
                :class="['w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 outline-none text-sm font-mono transition bg-gray-50 focus:bg-white', isCOE ? 'border-orange-200 focus:border-orange-500 focus:ring-orange-200' : isSOM ? 'border-green-200 focus:border-green-500 focus:ring-green-200' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-200']"
              />
            </div>
            <div>
              <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                <span :class="['w-1.5 h-1.5 rounded-full', isCOE ? 'bg-orange-500' : isSOM ? 'bg-green-500' : 'bg-blue-500']"></span>
                Radius (m)
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                step="5"
                :value="radius"
                @input="onRadiusInput($event.target.value)"
                :class="['w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 outline-none text-sm font-mono transition bg-gray-50 focus:bg-white', isCOE ? 'border-orange-200 focus:border-orange-500 focus:ring-orange-200' : isSOM ? 'border-green-200 focus:border-green-500 focus:ring-green-200' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-200']"
              />
            </div>
          </div>
        </div>

        <!-- ============ Status Cards ============ -->
        <div v-if="!hasCoords && !readonly" class="flex items-start gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-900 border-2 border-amber-200 shadow-sm">
          <div class="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <div class="flex-1 text-xs sm:text-sm">
            <p class="font-bold">No pin set yet</p>
            <p class="text-amber-800 mt-0.5">Use "Drop pin here" or tap the map to choose the event spot.</p>
          </div>
        </div>
        <div v-else class="flex items-start gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-900 border-2 border-emerald-200 shadow-sm">
          <div class="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div class="flex-1 text-xs sm:text-sm">
            <p class="font-bold">Pin set</p>
            <p class="text-emerald-800 mt-0.5">
              <span class="font-mono bg-white/70 px-1.5 py-0.5 rounded">{{ formatCoord(latitude) }}, {{ formatCoord(longitude) }}</span>
              — students within <span class="font-bold">{{ radius }}m</span> can check in.
            </p>
          </div>
        </div>

        <!-- Live "you are here" details -->
        <div v-if="hasMyLocation" class="flex items-start gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-900 border-2 border-blue-200 shadow-sm">
          <div class="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div class="flex-1 text-xs sm:text-sm flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p class="font-bold">Your live location</p>
              <p class="text-blue-800 mt-0.5">
                <span class="font-mono bg-white/70 px-1.5 py-0.5 rounded">{{ formatCoord(myLat) }}, {{ formatCoord(myLng) }}</span>
                <span class="text-blue-700 ml-1">(±{{ Math.round(myAccuracy || 0) }}m)</span>
              </p>
            </div>
            <span v-if="hasCoords" :class="['px-3 py-1 rounded-full font-extrabold text-xs', distanceFromPin <= radius ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700']">
              {{ formatDistance(distanceFromPin) }} {{ readonly ? 'from eligible area' : 'from pin' }}
            </span>
          </div>
        </div>

        <!-- Geolocation error -->
        <div v-if="locationError" class="flex items-start gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 text-red-900 border-2 border-red-200 shadow-sm">
          <div class="flex-shrink-0 w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <div class="flex-1 text-xs sm:text-sm">
            <p class="font-bold">Location error</p>
            <p class="text-red-800 mt-0.5">{{ locationError }}</p>
          </div>
        </div>
      </div>
    </transition>
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
  isSOM: { type: Boolean, default: false },
  // When true, the component renders as a compact "live status" panel:
  //   - the toggle / quick-actions / manual-coords editors are hidden
  //   - the pin is non-draggable and the map is not click-to-place
  //   - live tracking auto-starts so the user sees their position vs. the fence
  //   - the parent receives `update:insideZone` + `update:distanceMeters`
  //     and can gate UI (e.g. disable the RFID scanner) accordingly.
  readonly: { type: Boolean, default: false },
  // Compact mode: shrinks the map frame so it sits as a small reference
  // panel rather than a near-fullscreen viewer (used inside the RFID
  // scanner area where the scanner itself should remain the focus).
  compact: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:enabled',
  'update:latitude',
  'update:longitude',
  'update:radius',
  'update:insideZone',
  'update:distanceMeters'
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

// Default fallback: JRMSU Main Campus, Dapitan City — the map opens here
// when there is no pin and the admin has not yet shared their location.
const DEFAULT_LAT = 8.6585
const DEFAULT_LNG = 123.4250

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
// We use a centered "bullseye" design — a round dot that sits exactly on the
// lat/lng — so the marker visually lines up with the geofence circle's center
// (which is also at that lat/lng). The previous teardrop shape anchored on
// its tip looked off-center even though it was geometrically correct.
function buildPinIcon() {
  if (!leaflet) return null
  const accentHex = props.isCOE ? '#ea580c' : props.isSOM ? '#16a34a' : '#2563eb'
  const accentSoft = props.isCOE ? 'rgba(234,88,12,.35)' : props.isSOM ? 'rgba(22,163,74,.35)' : 'rgba(37,99,235,.35)'
  const html = `
    <div style="position:relative;width:30px;height:30px;">
      <div style="position:absolute;inset:-10px;border-radius:50%;background:${accentSoft};animation:gfm-pin-pulse 2.2s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:${accentHex};border:4px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.08);"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:#fff;"></div>
    </div>
  `
  return leaflet.divIcon({
    html,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
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
      // We render our own custom-positioned zoom control on the right so it
      // never overlaps the Street/Satellite switcher in the top-left corner.
      zoomControl: false,
      // The "Leaflet" watermark is hidden per design — we still credit the
      // tile providers via a tiny in-app footer below the map (see template).
      attributionControl: false
    })

    // Custom positioned zoom control: top-right keeps it well clear of the
    // segmented Street/Satellite pill (top-left) and the bottom distance bar.
    leaflet.control.zoom({ position: 'topright', zoomInTitle: 'Zoom in', zoomOutTitle: 'Zoom out' }).addTo(map)

    // Build both tile layers but only add the active one. Attribution strings
    // are kept on the layers so any future re-enablement of attributionControl
    // continues to credit OSM/Esri correctly.
    streetLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    })
    satelliteLayer = leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    })
    streetLayer.addTo(map)

    if (!props.readonly) {
      map.on('click', (e) => {
        setPin(e.latlng.lat, e.latlng.lng, { recenter: false })
      })
    }

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
    const draggable = !props.readonly
    marker = leaflet.marker([lat, lng], { draggable, icon: icon || undefined, interactive: draggable }).addTo(map)
    if (draggable) {
      marker.on('dragend', () => {
        const ll = marker.getLatLng()
        setPin(ll.lat, ll.lng, { recenter: false, fromMarker: true })
      })
    }
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

// Take several GPS samples and pick the one with the best accuracy.
// The first fix from the browser is often a coarse network/IP estimate; the
// second/third reading after the chip warms up is usually much tighter.
function getBestFix({ samples = 4, perSampleTimeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation unsupported'))
      return
    }
    let best = null
    let remaining = samples
    let lastErr = null
    const tick = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!best || (pos.coords.accuracy || Infinity) < (best.coords.accuracy || Infinity)) {
            best = pos
          }
          remaining -= 1
          if (remaining <= 0 || (best.coords.accuracy && best.coords.accuracy <= 10)) {
            resolve(best)
          } else {
            tick()
          }
        },
        (err) => {
          lastErr = err
          remaining -= 1
          if (remaining <= 0) {
            if (best) resolve(best)
            else reject(lastErr || err)
          } else {
            tick()
          }
        },
        { enableHighAccuracy: true, timeout: perSampleTimeoutMs, maximumAge: 0 }
      )
    }
    tick()
  })
}

async function useMyLocation() {
  if (!('geolocation' in navigator)) {
    locationError.value = 'Your device does not support geolocation.'
    return
  }
  locating.value = true
  locationError.value = ''
  try {
    // Sample a few readings and keep the most accurate one.
    const pos = await getBestFix({ samples: 4, perSampleTimeoutMs: 8000 })
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

// In readonly mode the parent wants to know how far the user is from the
// venue and whether they're inside the geofence so it can gate UI (e.g.
// disable the RFID scanner). Emit those whenever the calculation changes.
watch(distanceFromPin, (d) => {
  if (!props.readonly) return
  emit('update:distanceMeters', Number.isFinite(d) ? d : null)
  if (Number.isFinite(d)) {
    emit('update:insideZone', d <= (props.radius || 80))
  } else {
    emit('update:insideZone', null)
  }
}, { immediate: true })

onMounted(() => {
  if (props.enabled || props.readonly) ensureMap()
  // Auto-start live tracking in readonly mode so the admin instantly sees
  // where they are relative to the venue without having to tap a button.
  if (props.readonly) startLiveTracking()
})

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<style scoped>
:deep(.leaflet-container) {
  font-family: inherit;
}

/* ============ Premium gradient frames around the map ============ */
.gfm-frame-blue {
  background: linear-gradient(135deg, #1e3bdb 0%, #4f62ff 50%, #6366f1 100%);
}
.gfm-frame-coe {
  background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%);
}
.gfm-frame-som {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%);
}

/* ============ Modern entry animation for the editor section ============ */
.gfm-fade-enter-active,
.gfm-fade-leave-active {
  transition: opacity .3s ease, transform .3s ease;
}
.gfm-fade-enter-from,
.gfm-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ============ Lift on hover for action buttons ============ */
.gfm-action-btn {
  will-change: transform;
}

/* ============ Restyle Leaflet's native zoom buttons to match ============ */
:deep(.leaflet-control-zoom) {
  border: none !important;
  border-radius: 1rem !important;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  margin-top: 12px !important;
  margin-right: 12px !important;
}
:deep(.leaflet-control-zoom a) {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(8px);
  border: none !important;
  color: #374151 !important;
  font-weight: 700;
  width: 34px !important;
  height: 34px !important;
  line-height: 34px !important;
  font-size: 18px !important;
  transition: background .2s ease, color .2s ease;
}
:deep(.leaflet-control-zoom a:first-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
  border-radius: 1rem 1rem 0 0 !important;
}
:deep(.leaflet-control-zoom a:last-child) {
  border-radius: 0 0 1rem 1rem !important;
}
:deep(.leaflet-control-zoom a:hover) {
  background: rgba(255, 255, 255, 1) !important;
  color: #1e3bdb !important;
}

/* ============ Hide any stray Leaflet attribution badge ============ */
/* Belt-and-suspenders: even though we pass attributionControl:false, keep
   the rule so any future re-enable doesn't bring the watermark back. */
:deep(.leaflet-control-attribution) {
  display: none !important;
}

/* ============ Lift our zoom buttons above other floating UI ============ */
:deep(.leaflet-top.leaflet-right) {
  z-index: 410;
}
</style>

<style>
@keyframes gfm-ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Soft pulsing halo behind the centered pin marker so it's easy to spot
   without making the pin itself look lopsided against its geofence circle. */
@keyframes gfm-pin-pulse {
  0%, 100% { transform: scale(1);   opacity: 0.55; }
  50%      { transform: scale(1.4); opacity: 0.0;  }
}
</style>
