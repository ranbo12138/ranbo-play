import { normaliseArtifacts } from './workspace.js';

const STORAGE_NAMESPACE = 'mvuChat';
const API_SETTINGS_KEY = `${STORAGE_NAMESPACE}:apiSettings`;
const CHAT_HISTORY_KEY = `${STORAGE_NAMESPACE}:chatHistory`;
const VARIABLE_SUMMARY_KEY = `${STORAGE_NAMESPACE}:variableSummary`;
const CODE_TEMPLATES_KEY = `${STORAGE_NAMESPACE}:codeTemplates`;

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

function cloneArtifacts(artifacts = {}) {
  return { ...(artifacts || {}) };
}

function sanitiseTemplateEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const name = `${entry.name || ''}`.trim();
  if (!name) {
    return null;
  }

  const artifacts = cloneArtifacts(entry.artifacts);

  let createdAt = typeof entry.createdAt === 'string' && entry.createdAt ? entry.createdAt : null;
  let updatedAt = typeof entry.updatedAt === 'string' && entry.updatedAt ? entry.updatedAt : null;

  if (!createdAt && updatedAt) {
    createdAt = updatedAt;
  } else if (!updatedAt && createdAt) {
    updatedAt = createdAt;
  } else if (!createdAt && !updatedAt) {
    const timestamp = new Date().toISOString();
    createdAt = timestamp;
    updatedAt = timestamp;
  }

  const template = {
    name,
    artifacts,
    createdAt,
    updatedAt,
  };

  if (typeof entry.description === 'string' && entry.description.trim()) {
    template.description = entry.description.trim();
  }

  return template;
}

function readCodeTemplates() {
  const stored = readJSON(CODE_TEMPLATES_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored.map(sanitiseTemplateEntry).filter(Boolean);
}

function writeCodeTemplates(templates = []) {
  const payload = templates.map((template) => {
    const base = {
      name: template.name,
      artifacts: cloneArtifacts(template.artifacts),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    if (template.description) {
      base.description = template.description;
    }

    return base;
  });

  return writeJSON(CODE_TEMPLATES_KEY, payload);
}

function sortTemplates(templates = []) {
  return [...templates].sort((a, b) => {
    const timeA = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const timeB = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

function formatTemplatesForReturn(templates = []) {
  return templates.map((template) => ({
    ...template,
    artifacts: cloneArtifacts(template.artifacts),
  }));
}

export function getCodeTemplates() {
  const templates = sortTemplates(readCodeTemplates());
  return formatTemplatesForReturn(templates);
}

export function getCodeTemplate(name) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    return null;
  }

  const templates = readCodeTemplates();
  const match = templates.find((template) => template.name === trimmedName);
  return match ? { ...match, artifacts: cloneArtifacts(match.artifacts) } : null;
}

export function saveCodeTemplate(name, artifacts = {}, metadata = {}) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    throw new Error('Template name is required');
  }

  const templates = readCodeTemplates();
  const timestamp = new Date().toISOString();
  const description =
    typeof metadata.description === 'string' && metadata.description.trim()
      ? metadata.description.trim()
      : undefined;
  const normalisedArtifacts = cloneArtifacts(artifacts);

  const existingIndex = templates.findIndex((template) => template.name === trimmedName);
  let target;

  if (existingIndex >= 0) {
    const existing = templates[existingIndex];
    target = {
      ...existing,
      name: trimmedName,
      artifacts: normalisedArtifacts,
      updatedAt: timestamp,
    };

    if (!target.createdAt) {
      target.createdAt = existing.createdAt || timestamp;
    }

    if (description !== undefined) {
      target.description = description;
    }

    templates[existingIndex] = target;
  } else {
    target = {
      name: trimmedName,
      artifacts: normalisedArtifacts,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (description !== undefined) {
      target.description = description;
    }

    templates.push(target);
  }

  const sorted = sortTemplates(templates);
  writeCodeTemplates(sorted);

  return {
    template: { ...target, artifacts: cloneArtifacts(target.artifacts) },
    templates: formatTemplatesForReturn(sorted),
  };
}

export function deleteCodeTemplate(name) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    return {
      removed: null,
      templates: formatTemplatesForReturn(sortTemplates(readCodeTemplates())),
    };
  }

  const templates = readCodeTemplates();
  const index = templates.findIndex((template) => template.name === trimmedName);

  if (index === -1) {
    return {
      removed: null,
      templates: formatTemplatesForReturn(sortTemplates(templates)),
    };
  }

  const [removed] = templates.splice(index, 1);
  const sorted = sortTemplates(templates);
  writeCodeTemplates(sorted);

  return {
    removed: removed ? { ...removed, artifacts: cloneArtifacts(removed.artifacts) } : null,
    templates: formatTemplatesForReturn(sorted),
  };
}

export function renameCodeTemplate(oldName, newName) {
  const from = typeof oldName === 'string' ? oldName.trim() : '';
  const to = typeof newName === 'string' ? newName.trim() : '';

  if (!from || !to) {
    throw new Error('Both template names are required');
  }

  const templates = readCodeTemplates();
  const index = templates.findIndex((template) => template.name === from);

  if (index === -1) {
    throw new Error(`Template "${from}" not found`);
  }

  const timestamp = new Date().toISOString();
  const current = templates[index];

  const updatedTemplate = {
    ...current,
    name: to,
    artifacts: cloneArtifacts(current.artifacts),
    updatedAt: timestamp,
  };

  if (!updatedTemplate.createdAt) {
    updatedTemplate.createdAt = current.createdAt || timestamp;
  }

  const withoutConflicts = templates.filter(
    (template, idx) => idx !== index && template.name !== to
  );
  withoutConflicts.push(updatedTemplate);

  const sorted = sortTemplates(withoutConflicts);
  writeCodeTemplates(sorted);

  return {
    template: { ...updatedTemplate, artifacts: cloneArtifacts(updatedTemplate.artifacts) },
    templates: formatTemplatesForReturn(sorted),
  };
}

// Preview code storage functions for CodeWorkspace
const PREVIEW_CODE_KEY = 'mvu-generator:preview:code';

export function getPreviewCode() {
  return readJSON(PREVIEW_CODE_KEY, '');
}

export function savePreviewCode(code = '') {
  return writeJSON(PREVIEW_CODE_KEY, code);
}

// Variable source storage functions
const VARIABLE_SOURCE_KEY = 'mvu-generator:variables:source';

export function getVariableSource() {
  return readJSON(VARIABLE_SOURCE_KEY, '');
}

export function saveVariableSource(source = '') {
  return writeJSON(VARIABLE_SOURCE_KEY, source);
}