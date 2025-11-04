const STORAGE_NAMESPACE = 'mvuGenerator'

const getNamespacedKey = (key) => {
  if (typeof key !== 'string') {
    throw new TypeError('storage key must be a string')
  }

  return key.startsWith(`${STORAGE_NAMESPACE}.`) ? key : `${STORAGE_NAMESPACE}.${key}`
}

const isBrowserEnvironment = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const safeParse = (value) => {
  if (value == null) {
    return value
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    console.warn('Failed to parse stored value, falling back to raw string.', error)
    return value
  }
}

const safeSerialize = (value) => {
  try {
    return JSON.stringify(value)
  } catch (error) {
    console.warn('Failed to serialize value for storage, skipping persist.', error)
    return undefined
  }
}

export const storageKeys = Object.freeze({
  variables: getNamespacedKey('variables'),
  theme: getNamespacedKey('theme'),
  lastValidYaml: getNamespacedKey('lastValidYaml'),
})

export const storage = {
  get(key, defaultValue = null) {
    if (!isBrowserEnvironment()) {
      return defaultValue
    }

    const storageKey = getNamespacedKey(key)
    const value = window.localStorage.getItem(storageKey)

    if (value === null) {
      return defaultValue
    }

    const parsed = safeParse(value)
    return parsed === undefined ? defaultValue : parsed
  },

  set(key, value) {
    if (!isBrowserEnvironment()) {
      return
    }

    const storageKey = getNamespacedKey(key)

    if (value === undefined || value === null) {
      window.localStorage.removeItem(storageKey)
      return
    }

    const serialized = safeSerialize(value)
    if (serialized !== undefined) {
      window.localStorage.setItem(storageKey, serialized)
    }
  },

  remove(key) {
    if (!isBrowserEnvironment()) {
      return
    }

    const storageKey = getNamespacedKey(key)
    window.localStorage.removeItem(storageKey)
  },

  makeKey: getNamespacedKey,
}

export default storage
