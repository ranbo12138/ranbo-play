import yaml from 'js-yaml'

const ensureRecord = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  return null
}

const createValidationError = (message, source) => {
  const error = new Error(message)
  error.name = 'YamlValidationError'
  error.source = source
  error.isYamlValidationError = true
  return error
}

const collectVariableKeys = (node, path = [], acc = []) => {
  if (Array.isArray(node)) {
    if (node.length === 0) {
      acc.push([...path, '[]'].join('.'))
      return acc
    }

    node.forEach((item, index) => {
      collectVariableKeys(item, [...path, `[${index}]`], acc)
    })

    return acc
  }

  if (node && typeof node === 'object') {
    const entries = Object.entries(node)
    if (entries.length === 0 && path.length) {
      acc.push(path.join('.'))
      return acc
    }

    entries.forEach(([key, value]) => {
      collectVariableKeys(value, [...path, key], acc)
    })

    return acc
  }

  if (path.length > 0) {
    acc.push(path.join('.'))
  }

  return acc
}

const buildSummary = (statData) => {
  const topLevelKeys = Array.isArray(statData)
    ? statData.map((_, index) => `[${index}]`)
    : Object.keys(statData)

  const variableKeys = collectVariableKeys(statData)

  return {
    topLevelKeys,
    variableKeys,
    totalVariables: variableKeys.length,
  }
}

const wrapYamlError = (error, source) => {
  if (error?.isNormalizedYamlError) {
    return error
  }

  const normalized = normalizeYamlError(error, source)
  const wrappedError = new Error(normalized.message)
  wrappedError.name = error?.name ?? 'YamlError'
  wrappedError.reason = normalized.reason
  wrappedError.line = normalized.line
  wrappedError.column = normalized.column
  wrappedError.snippet = normalized.snippet
  wrappedError.source = normalized.source
  wrappedError.type = normalized.type
  wrappedError.isNormalizedYamlError = true
  wrappedError.originalError = error
  wrappedError.details = normalized
  return wrappedError
}

export const parseYamlToState = (source) => {
  const yamlText = typeof source === 'string' ? source : ''
  const trimmed = yamlText.trim()

  if (!trimmed) {
    const statData = {}
    return {
      source: yamlText,
      document: {},
      metadata: {},
      templates: {},
      statData,
      summary: buildSummary(statData),
    }
  }

  try {
    const documentNode = yaml.load(yamlText) ?? {}
    const document = ensureRecord(documentNode)

    if (!document) {
      throw createValidationError('YAML 根节点必须是一个键值对对象结构', yamlText)
    }

    const metadata = ensureRecord(document.metadata) ?? {}
    const templates = ensureRecord(document.templates) ?? {}

    const statCandidate =
      ensureRecord(document.stat_data) ??
      ensureRecord(document.statData) ??
      ensureRecord(document.variables) ??
      ensureRecord(document.stats)

    const statData = statCandidate ?? document

    if (!ensureRecord(statData)) {
      throw createValidationError('stat_data 必须是一个对象结构', yamlText)
    }

    return {
      source: yamlText,
      document,
      metadata,
      templates,
      statData,
      summary: buildSummary(statData),
    }
  } catch (error) {
    throw wrapYamlError(error, yamlText)
  }
}

export const formatYaml = (state) => {
  const value = state ?? {}
  return yaml.dump(value, {
    indent: 2,
    noRefs: true,
    lineWidth: 120,
    styles: {
      '!!null': 'null',
    },
  })
}

export const normalizeYamlError = (error, source = '') => {
  if (!error) {
    return null
  }

  const mark = error.mark ?? error.originalError?.mark

  const line = typeof mark?.line === 'number' ? mark.line + 1 : null
  const column = typeof mark?.column === 'number' ? mark.column + 1 : null

  const rawMessage = (error.reason || error.message || 'YAML 解析失败').replace(/\s+\(.+\)$/, '').trim()

  let snippet = null
  if (line != null && source) {
    const lines = source.split(/\r?\n/)
    snippet = lines[line - 1] ?? null
  }

  return {
    name: error.name ?? 'YamlError',
    message: rawMessage,
    reason: error.reason ?? rawMessage,
    line,
    column,
    snippet,
    source,
    type: error.isYamlValidationError ? 'validation' : 'syntax',
    isNormalizedYamlError: true,
  }
}

export default {
  parseYamlToState,
  formatYaml,
  normalizeYamlError,
}
