const SSAAM_KEY = "SSAAM2025CCS";

// Offset (ms) between server time and local clock: serverTime = Date.now() + serverOffsetMs
// Updated opportunistically from any API response's Date header (see updateServerOffsetFromHeaders below).
let serverOffsetMs = 0;
let lastSyncAt = 0;

try {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('ssaam_server_offset') : null;
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed.offset === 'number' && Number.isFinite(parsed.offset)) {
      serverOffsetMs = parsed.offset;
      lastSyncAt = parsed.at || 0;
    }
  }
} catch (e) { /* ignore */ }

function persistOffset() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('ssaam_server_offset', JSON.stringify({ offset: serverOffsetMs, at: lastSyncAt }));
  } catch (e) { /* ignore */ }
}

// Call after any fetch() to keep our clock in sync with the server.
// Pass either a Response object or a Headers object or a Date header string.
export function updateServerOffsetFromHeaders(input) {
  try {
    let dateStr = null;
    if (!input) return;
    if (typeof input === 'string') {
      dateStr = input;
    } else if (typeof input.headers?.get === 'function') {
      dateStr = input.headers.get('date') || input.headers.get('Date');
    } else if (typeof input.get === 'function') {
      dateStr = input.get('date') || input.get('Date');
    }
    if (!dateStr) return;
    const serverNow = new Date(dateStr).getTime();
    if (!Number.isFinite(serverNow)) return;
    const offset = serverNow - Date.now();
    if (Math.abs(offset) > 250) {
      serverOffsetMs = offset;
      lastSyncAt = Date.now();
      persistOffset();
    } else if (lastSyncAt === 0) {
      lastSyncAt = Date.now();
      persistOffset();
    }
  } catch (e) { /* ignore */ }
}

// Trigger an explicit sync against the server. Safe to call multiple times.
let inFlightSync = null;
export function syncServerTime(apiBase = '') {
  if (inFlightSync) return inFlightSync;
  const url = `${apiBase}/apis/health`;
  inFlightSync = fetch(url, { method: 'GET', cache: 'no-store' })
    .then(resp => { updateServerOffsetFromHeaders(resp); return serverOffsetMs; })
    .catch(() => serverOffsetMs)
    .finally(() => { inFlightSync = null; });
  return inFlightSync;
}

export function getServerOffsetMs() { return serverOffsetMs; }

export function encodeTimestamp() {
  // Use server-aligned time so the token is always valid against the backend's
  // isValidTimestamp window, even if the user's PC clock is wrong.
  const now = new Date(Date.now() + serverOffsetMs);
  const timestamp = now.toISOString();

  let encoded = '';
  for (let i = 0; i < timestamp.length; i++) {
    const charCode = timestamp.charCodeAt(i) ^ SSAAM_KEY.charCodeAt(i % SSAAM_KEY.length);
    encoded += String.fromCharCode(charCode);
  }

  return btoa(encoded);
}

export function decodeTimestamp(encodedString) {
  try {
    const decoded = atob(encodedString);
    let timestamp = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ SSAAM_KEY.charCodeAt(i % SSAAM_KEY.length);
      timestamp += String.fromCharCode(charCode);
    }
    return timestamp;
  } catch (e) {
    return null;
  }
}

export function isValidTimestamp(encodedString, maxAgeMinutes = 1) {
  const timestamp = decodeTimestamp(encodedString);
  if (!timestamp) return false;

  try {
    const requestTime = new Date(timestamp);
    const now = new Date(Date.now() + serverOffsetMs);
    const diffMinutes = (now - requestTime) / (1000 * 60);

    return diffMinutes >= -0.5 && diffMinutes <= maxAgeMinutes;
  } catch (e) {
    return false;
  }
}
