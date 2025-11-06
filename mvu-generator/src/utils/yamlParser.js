import { parse } from 'yaml'

/**
 * Enhanced YAML parser for MVU variable data
 */
export function parseYamlToState(yaml) {
  if (!yaml || !yaml.trim()) {
    return { 
      parsed: {}, 
      error: null,
      line: null,
      column: null 
    }
  }

  try {
    const parsed = parse(yaml, { 
      prettyErrors: true,
      merge: true 
    })
    
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { 
        parsed, 
        error: null,
        line: null,
        column: null 
      }
    }

    return {
      parsed: {},
      error: new Error('变量内容需为 YAML 对象结构'),
      line: null,
      column: null
    }
  } catch (error) {
    // Extract line and column information from YAML error
    const lineMatch = error.message?.match(/at line (\d+)(?:, column (\d+))?/)
    const line = lineMatch ? parseInt(lineMatch[1], 10) : null
    const column = lineMatch?.[2] ? parseInt(lineMatch[2], 10) : null

    return {
      parsed: null,
      error: new Error(`YAML 解析错误${line ? ` (第 ${line} 行${column ? `, 第 ${column} 列` : ''})` : ''}: ${error.message}`),
      line,
      column
    }
  }
}

/**
 * Format JavaScript object as YAML string
 */
export function formatYaml(state) {
  if (!state || typeof state !== 'object') {
    return ''
  }

  try {
    // Fallback to JSON for now (yaml.stringify requires async import)
    return JSON.stringify(state, null, 2)
  } catch (error) {
    console.warn('[yamlParser] Failed to format YAML:', error)
    return JSON.stringify(state, null, 2)
  }
}

/**
 * Validate MVU stat_data structure
 */
export function validateMvuStatData(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['解析结果不是有效对象'] }
  }

  const errors = []
  
  // Check for required stat_data field
  if (!parsed.stat_data) {
    errors.push('缺少必需的 stat_data 字段')
  } else if (typeof parsed.stat_data !== 'object' || Array.isArray(parsed.stat_data)) {
    errors.push('stat_data 必须是对象')
  }

  // Check for metadata field (recommended)
  if (!parsed.metadata) {
    errors.push('建议包含 metadata 字段')
  }

  // Validate world_book structure if present
  if (parsed.world_book) {
    if (typeof parsed.world_book !== 'object' || Array.isArray(parsed.world_book)) {
      errors.push('world_book 必须是对象')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: errors.filter(e => e.includes('建议'))
  }
}

/**
 * Clean and parse Tavern initvar format
 */
export function cleanInitvarFormat(content) {
  if (!content || typeof content !== 'string') {
    return ''
  }

  // Remove common initvar prefixes and formatting
  let cleaned = content
    .replace(/^\s*(?:initvar|init_vars?)\s*[:=]\s*/i, '')
    .replace(/^\s*[`'"]\s*/, '')
    .replace(/\s*[`'"]\s*$/, '')
    .trim()

  // Try to extract YAML from mixed content
  const yamlMatch = cleaned.match(/```(?:ya?ml)?\s*\n?([\s\S]*?)\n?```\s*$/)
  if (yamlMatch) {
    cleaned = yamlMatch[1].trim()
  }

  return cleaned
}

/**
 * Generate example stat_data
 */
export function generateExampleVariables() {
  return `metadata:
  title: 示例状态栏
  version: 0.3.0
  locale: zh-CN
stat_data:
  hp: 85
  hp_max: 100
  stamina: 72
  mood: 活跃
  focus: 91
  status_label: 示例场景·测试状态
  last_updated: ${new Date().toISOString()}
  summary: >
    这是一个示例变量配置，展示了 MVU 状态栏的基本结构。
  shards:
    - label: 当前任务
      detail: 正在测试变量编辑器的功能
    - label: 系统状态
      detail: 所有组件运行正常
world_book:
  active_nodes:
    - id: EXAMPLE-STATUS
      label: 示例状态栏
      anchors:
        - <status_block>
      instruction: |
        这是一个示例状态栏配置，用于测试和演示。
generator:
  options:
    accentColor: '#60a5fa'
    layout: compact
    showTimestamp: true
    statusTag: status_block
  triggers:
    - 状态栏
    - status
`
}

export default {
  parseYamlToState,
  formatYaml,
  validateMvuStatData,
  cleanInitvarFormat,
  generateExampleVariables
}