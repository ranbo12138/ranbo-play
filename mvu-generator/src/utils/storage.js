const STORAGE_NAMESPACE = 'mvu-generator'
const PREVIEW_CODE_KEY = `${STORAGE_NAMESPACE}:preview:code`
const VARIABLE_SOURCE_KEY = `${STORAGE_NAMESPACE}:variables:source`

const isBrowser = typeof window !== 'undefined'

function getLocalStorage() {
  if (!isBrowser) {
    return null
  }

  try {
    return window.localStorage
  } catch (error) {
    console.warn('[storage] Failed to access localStorage', error)
    return null
  }
}

function _readJSON(key, fallback) {
  const storage = getLocalStorage()
  if (!storage) return fallback

  try {
    const raw = storage.getItem(key)
    if (!raw) return fallback

    return JSON.parse(raw)
  } catch (error) {
    console.warn(`[storage] Failed to parse JSON for ${key}`, error)
    return fallback
  }
}

function _writeJSON(key, value) {
  const storage = getLocalStorage()
  if (!storage) return false

  try {
    if (value === undefined || value === null) {
      storage.removeItem(key)
    } else {
      storage.setItem(key, JSON.stringify(value))
    }

    return true
  } catch (error) {
    console.warn(`[storage] Failed to write JSON for ${key}`, error)
    return false
  }
}

function readString(key, fallback = '') {
  const storage = getLocalStorage()
  if (!storage) return fallback

  try {
    const raw = storage.getItem(key)
    return raw !== null ? raw : fallback
  } catch (error) {
    console.warn(`[storage] Failed to read string for ${key}`, error)
    return fallback
  }
}

function writeString(key, value) {
  const storage = getLocalStorage()
  if (!storage) return false

  try {
    if (value === undefined || value === null) {
      storage.removeItem(key)
    } else {
      storage.setItem(key, String(value))
    }

    return true
  } catch (error) {
    console.warn(`[storage] Failed to write string for ${key}`, error)
    return false
  }
}

export function getPreviewCode() {
  return readString(PREVIEW_CODE_KEY, '')
}

export function savePreviewCode(code) {
  return writeString(PREVIEW_CODE_KEY, code)
}

export function clearPreviewCode() {
  return writeString(PREVIEW_CODE_KEY, null)
}

export function getVariableSource() {
  return readString(VARIABLE_SOURCE_KEY, '')
}

export function saveVariableSource(source) {
  return writeString(VARIABLE_SOURCE_KEY, source)
}

export function clearVariableSource() {
  return writeString(VARIABLE_SOURCE_KEY, null)
}

export default {
  getPreviewCode,
  savePreviewCode,
  clearPreviewCode,
  getVariableSource,
  saveVariableSource,
  clearVariableSource,
}
