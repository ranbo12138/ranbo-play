const STORAGE_NAMESPACE = 'mvuChat';
const API_SETTINGS_KEY = `${STORAGE_NAMESPACE}:apiSettings`;
const CHAT_HISTORY_KEY = `${STORAGE_NAMESPACE}:chatHistory`;
const VARIABLE_SUMMARY_KEY = `${STORAGE_NAMESPACE}:variableSummary`;

const DEFAULT_SETTINGS = {
  providerType: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-3.5-turbo',
  headers: {},
  apiKey: '',
};

const isBrowser = typeof window !== 'undefined';

function getLocalStorage() {
  if (!isBrowser) {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('[storage] Failed to access localStorage', error);
    return null;
  }
}

function toBinaryString(value) {
  const stringValue = `${value}`;

  if (typeof TextEncoder === 'function') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(stringValue);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    return binary;
  }

  return encodeURIComponent(stringValue).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function fromBinaryString(binary) {
  if (typeof TextDecoder === 'function') {
    const decoder = new TextDecoder();
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return decoder.decode(bytes);
  }

  try {
    const encoded = Array.from(binary)
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('');
    return decodeURIComponent(encoded);
  } catch (error) {
    console.warn('[storage] Failed to decode binary string', error);
    return binary;
  }
}

function encodeSecret(value) {
  if (value === undefined || value === null || value === '') return '';

  try {
    if (typeof btoa === 'function') {
      return btoa(toBinaryString(value));
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(`${value}`, 'utf-8').toString('base64');
    }

    return `${value}`;
  } catch (error) {
    console.warn('[storage] Failed to encode secret', error);
    return `${value}`;
  }
}

function decodeSecret(value) {
  if (!value) return '';

  try {
    if (typeof atob === 'function') {
      const binary = atob(value);
      return fromBinaryString(binary);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(value, 'base64').toString('utf-8');
    }

    return value;
  } catch (error) {
    console.warn('[storage] Failed to decode secret', error);
    return '';
  }
}

function readJSON(key, fallback) {
  const storage = getLocalStorage();
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;

    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] Failed to parse JSON for ${key}`, error);
    return fallback;
  }
}

function writeJSON(key, value) {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    if (value === undefined || value === null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, JSON.stringify(value));
    }

    return true;
  } catch (error) {
    console.warn(`[storage] Failed to write JSON for ${key}`, error);
    return false;
  }
}

export function getApiSettings() {
  const stored = readJSON(API_SETTINGS_KEY, null);

  if (!stored) {
    return { ...DEFAULT_SETTINGS };
  }

  const { encodedKey, apiKey, ...rest } = stored;
  const decodedKey = decodeSecret(encodedKey || apiKey);

  return {
    ...DEFAULT_SETTINGS,
    ...rest,
    apiKey: decodedKey,
  };
}

export function saveApiSettings(settings = {}) {
  if (typeof settings !== 'object' || settings === null) {
    throw new Error('saveApiSettings 需要传入对象参数');
  }

  const { apiKey, encodedKey, ...rest } = settings;

  return writeJSON(API_SETTINGS_KEY, {
    ...DEFAULT_SETTINGS,
    ...rest,
    encodedKey: encodeSecret(apiKey || decodeSecret(encodedKey)),
  });
}

export function updateApiSettings(patch = {}) {
  const current = getApiSettings();
  return saveApiSettings({
    ...current,
    ...patch,
  });
}

export function clearApiSettings() {
  return writeJSON(API_SETTINGS_KEY, null);
}

export function hasApiKey() {
  const settings = getApiSettings();
  return Boolean(settings.apiKey);
}

function normaliseHistoryMessage(message) {
  if (!message || typeof message !== 'object') return null;
  if (!message.role || !message.content) return null;

  return {
    role: message.role,
    content: message.content,
    timestamp: message.timestamp || new Date().toISOString(),
    id: message.id || `${message.role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

export function getChatHistory() {
  const history = readJSON(CHAT_HISTORY_KEY, []);
  if (!Array.isArray(history)) return [];

  return history
    .map(normaliseHistoryMessage)
    .filter(Boolean);
}

export function saveChatHistory(messages = []) {
  if (!Array.isArray(messages)) {
    throw new Error('saveChatHistory 需要传入消息数组');
  }

  const sanitised = messages.map(normaliseHistoryMessage).filter(Boolean);
  return writeJSON(CHAT_HISTORY_KEY, sanitised);
}

export function clearChatHistory() {
  return writeJSON(CHAT_HISTORY_KEY, []);
}

export function getVariableSummary() {
  return readJSON(VARIABLE_SUMMARY_KEY, {
    raw: '',
    parsed: {},
    updatedAt: null,
  });
}

export function saveVariableSummary({ raw = '', parsed = {}, updatedAt } = {}) {
  return writeJSON(VARIABLE_SUMMARY_KEY, {
    raw,
    parsed,
    updatedAt: updatedAt || new Date().toISOString(),
  });
}

export function clearVariableSummary() {
  return writeJSON(VARIABLE_SUMMARY_KEY, {
    raw: '',
    parsed: {},
    updatedAt: null,
  });
}
