/**
 * apiService — centralized fetch wrapper for SSAAM API calls.
 *
 * All API requests should go through these helpers so that:
 *  - The API base URL is resolved from one place (config/api.js).
 *  - The college header (X-SSAAM-College) is always attached.
 *  - Auth tokens from localStorage are automatically included.
 *  - Error handling is consistent across the app.
 *
 * Usage:
 *   import { apiGet, apiPost, apiPut, apiDelete } from '@/services/apiService'
 *   const data = await apiGet('/apis/students')
 *   const result = await apiPost('/apis/attendance', { studentId: '...' })
 */
import { buildAPIUrl, getDefaultHeaders } from '../config/api.js'

// ── Payload decryption (mirrors server-side encryptPayload) ──────────────────
const _EK = 'SSAAM_JRMSU_2026_CCS_KEY_v2_32!!'

function _hexToBytes(hex) {
  const b = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) b[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return b
}

async function _decrypt(payload) {
  if (!payload || payload._ssaam !== 1) return payload
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(_EK),
    { name: 'AES-CBC' }, false, ['decrypt']
  )
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: _hexToBytes(payload.iv) },
    key, _hexToBytes(payload.d)
  )
  return JSON.parse(new TextDecoder().decode(plain))
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build request headers, merging defaults with any caller overrides.
 * Automatically attaches the Authorization token from localStorage if present.
 * @param {object} [extra={}]
 * @returns {object}
 */
function buildHeaders(extra = {}) {
  const base = getDefaultHeaders()
  const token = localStorage.getItem('authToken') || localStorage.getItem('token')
  if (token) base['Authorization'] = `Bearer ${token}`
  return { ...base, ...extra }
}

/**
 * Generic fetch wrapper — shared error handling for all methods.
 * @param {string} endpoint
 * @param {RequestInit} options
 * @returns {Promise<any>} Parsed JSON response body
 * @throws {Error} with a descriptive message on HTTP or network failure
 */
async function request(endpoint, options = {}) {
  const url = buildAPIUrl(endpoint)
  let response
  try {
    response = await fetch(url, options)
  } catch (networkErr) {
    throw new Error(`Network error — could not reach ${url}: ${networkErr.message}`)
  }

  if (!response.ok) {
    let errorMsg = `API error ${response.status} on ${options.method ?? 'GET'} ${url}`
    try {
      const errBody = await response.json()
      if (errBody?.message) errorMsg = errBody.message
      else if (errBody?.error) errorMsg = errBody.error
    } catch { /* ignore parse error on error body */ }
    throw new Error(errorMsg)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const json = await response.json()
    return _decrypt(json)
  }
  return response.text()
}

/**
 * HTTP GET
 * @param {string} endpoint
 * @param {object} [headerOverrides={}]
 * @returns {Promise<any>}
 */
export async function apiGet(endpoint, headerOverrides = {}) {
  return request(endpoint, {
    method: 'GET',
    headers: buildHeaders(headerOverrides)
  })
}

/**
 * HTTP POST with a JSON body
 * @param {string} endpoint
 * @param {object} [body={}]
 * @param {object} [headerOverrides={}]
 * @returns {Promise<any>}
 */
export async function apiPost(endpoint, body = {}, headerOverrides = {}) {
  return request(endpoint, {
    method: 'POST',
    headers: buildHeaders(headerOverrides),
    body: JSON.stringify(body)
  })
}

/**
 * HTTP PUT with a JSON body
 * @param {string} endpoint
 * @param {object} [body={}]
 * @param {object} [headerOverrides={}]
 * @returns {Promise<any>}
 */
export async function apiPut(endpoint, body = {}, headerOverrides = {}) {
  return request(endpoint, {
    method: 'PUT',
    headers: buildHeaders(headerOverrides),
    body: JSON.stringify(body)
  })
}

/**
 * HTTP PATCH with a JSON body
 * @param {string} endpoint
 * @param {object} [body={}]
 * @param {object} [headerOverrides={}]
 * @returns {Promise<any>}
 */
export async function apiPatch(endpoint, body = {}, headerOverrides = {}) {
  return request(endpoint, {
    method: 'PATCH',
    headers: buildHeaders(headerOverrides),
    body: JSON.stringify(body)
  })
}

/**
 * HTTP DELETE
 * @param {string} endpoint
 * @param {object} [headerOverrides={}]
 * @returns {Promise<any>}
 */
export async function apiDelete(endpoint, headerOverrides = {}) {
  return request(endpoint, {
    method: 'DELETE',
    headers: buildHeaders(headerOverrides)
  })
}

/**
 * Upload a file using multipart/form-data.
 * The Content-Type header must NOT be set manually — the browser sets it
 * with the correct boundary when given a FormData body.
 * @param {string} endpoint
 * @param {FormData} formData
 * @param {object} [headerOverrides={}]
 * @returns {Promise<any>}
 */
export async function apiUpload(endpoint, formData, headerOverrides = {}) {
  const headers = buildHeaders(headerOverrides)
  delete headers['Content-Type']
  return request(endpoint, {
    method: 'POST',
    headers,
    body: formData
  })
}
