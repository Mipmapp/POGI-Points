/**
 * Converts a git commit count to a semver-style version string.
 *
 * Formula: pad to ≥3 digits, then split as:
 *   major = all digits except the last two
 *   minor = second-to-last digit
 *   patch = last digit
 *
 * Examples:
 *   5     → v0.0.5
 *   100   → v1.0.0
 *   244   → v2.4.4
 *   12450 → v124.5.0
 */
export function commitCountToVersion(count) {
  const s = String(count).padStart(3, '0')
  const patch = s.slice(-1)
  const minor = s.slice(-2, -1)
  const major = parseInt(s.slice(0, -2), 10) || 0
  return `v${major}.${minor}.${patch}`
}

// Injected at build time by vite.config.js
export const APP_VERSION = commitCountToVersion(
  typeof __COMMIT_COUNT__ !== 'undefined' ? __COMMIT_COUNT__ : 0
)
