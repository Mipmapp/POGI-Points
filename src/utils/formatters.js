/**
 * Shared formatting utilities for SSAAM
 * Use these helpers across views and components to avoid duplication.
 */

/**
 * Format a date string or Date object into a human-readable form.
 * @param {string|Date|null} value
 * @param {object} [opts] - Intl.DateTimeFormat options override
 * @returns {string}
 */
export function formatDate(value, opts = {}) {
  if (!value) return '—'
  try {
    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) return String(value)
    const defaults = { year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('en-PH', { ...defaults, ...opts })
  } catch {
    return String(value)
  }
}

/**
 * Format a date-time string into a short readable form (date + time).
 * @param {string|Date|null} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—'
  try {
    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return String(value)
  }
}

/**
 * Format a date relative to now (e.g. "2 hours ago", "just now").
 * Falls back to formatDate for older dates.
 * @param {string|Date|null} value
 * @returns {string}
 */
export function formatRelativeDate(value) {
  if (!value) return '—'
  try {
    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) return String(value)
    const diffMs = Date.now() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
    return formatDate(date)
  } catch {
    return String(value)
  }
}

/**
 * Extract initials from a full name string (up to 2 characters).
 * @param {string|null} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Truncate a string to a max length, appending an ellipsis if needed.
 * @param {string} str
 * @param {number} [maxLength=60]
 * @returns {string}
 */
export function truncate(str, maxLength = 60) {
  if (!str || str.length <= maxLength) return str ?? ''
  return str.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Format a number as Philippine Peso currency.
 * @param {number|string|null} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount)
  if (isNaN(num)) return '₱0.00'
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
