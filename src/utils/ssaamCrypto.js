const SSAAM_KEY = "SSAAM2025CCS";

export function encodeTimestamp() {
  const now = new Date();
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
    const now = new Date();
    const diffMinutes = (now - requestTime) / (1000 * 60);
    
    return diffMinutes >= -0.5 && diffMinutes <= maxAgeMinutes;
  } catch (e) {
    return false;
  }
}
