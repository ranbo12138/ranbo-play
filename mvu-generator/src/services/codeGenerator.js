const DEFAULT_ARTIFACTS = Object.freeze({
  html: '<!-- MVU code generator: awaiting valid stat_data payload -->',
  yaml: '# MVU code generator: awaiting valid stat_data payload\n',
  script: '# MVU code generator: awaiting valid stat_data payload\n',
  regex: '# MVU code generator: awaiting valid stat_data payload\n',
})

export const DEFAULT_GENERATOR_OPTIONS = Object.freeze({
  componentName: 'AuroraStatusBar',
  accentColor: '#38bdf8',
  layout: 'compact',
  showTimestamp: true,
  regexDepth: 6,
  statusTag: 'status_block',
  triggers: ['状态栏', 'status bar'],
})

const PREFERRED_STAT_ORDER = ['hp', 'hp_max', 'mp', 'stamina', 'energy', 'mood', 'focus', 'summary']

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function normaliseAiNotes(input) {
  if (!input) return ''

  if (typeof input === 'string') {
    return input.trim()
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => normaliseAiNotes(item))
      .filter(Boolean)
      .join('\n')
  }

  if (typeof input === 'object') {
    return Object.values(input)
      .map((value) => normaliseAiNotes(value))
      .filter(Boolean)
      .join('\n')
  }

  return `${input}`.trim()
}

function segmentsToPath(segments = []) {
  return segments
    .map((segment, index) => {
      if (typeof segment === 'number') {
        return `[${segment}]`
      }
      return index === 0 ? segment : `.${segment}`
    })
    .join('')
}

function toHumanLabel(segment) {
  if (typeof segment !== 'string') {
    return `索引${segment}`
  }
  const cleaned = segment.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    return segment
  }
  return cleaned
    .split(' ')
    .map((token) => (token ? `${token[0].toUpperCase()}${token.slice(1)}` : token))
    .join(' ')
}

function segmentsToLabel(segments = []) {
  const last = segments.length > 0 ? segments[segments.length - 1] : 'Stat'
  return toHumanLabel(last)
}

function flattenStatTree(node, segments = ['stat_data'], results = []) {
  if (Array.isArray(node)) {
    node.forEach((value, index) => {
      flattenStatTree(value, [...segments, index], results)
    })
    return results
  }

  if (isObject(node)) {
    Object.entries(node).forEach(([key, value]) => {
      flattenStatTree(value, [...segments, key], results)
    })
    return results
  }

  results.push({
    path: segmentsToPath(segments),
    label: segmentsToLabel(segments),
    macro: `{{get_message_variable::${segmentsToPath(segments)}}}`,
    segments: [...segments],
  })

  return results
}

function selectPrimaryStats(flattened = [], limit = 4) {
  if (!flattened.length) return []
  const weighted = flattened.map((item, index) => {
    const key = item.path.split('.').pop()
    const preferredIndex = PREFERRED_STAT_ORDER.indexOf(key ?? '')
    const score = preferredIndex === -1 ? index + PREFERRED_STAT_ORDER.length : preferredIndex
    return { item, score }
  })

  return weighted
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ item }) => item)
}

function deriveStatData(candidate = {}) {
  if (!candidate || typeof candidate !== 'object') {
    return {}
  }

  if (candidate.stat_data && isObject(candidate.stat_data)) {
    return candidate.stat_data
  }

  if (candidate.statData && isObject(candidate.statData)) {
    return candidate.statData
  }

  if (candidate.variables && isObject(candidate.variables)) {
    if (candidate.variables.stat_data) {
      return candidate.variables.stat_data
    }
    return candidate.variables
  }

  return candidate
}

function deriveMetadata(candidate = {}) {
  if (!candidate || typeof candidate !== 'object') {
    return {}
  }

  if (candidate.metadata && isObject(candidate.metadata)) {
    return candidate.metadata
  }

  if (candidate.meta && isObject(candidate.meta)) {
    return candidate.meta
  }

  return {}
}

function deriveTriggers(candidate = {}) {
  if (!candidate || typeof candidate !== 'object') {
    return []
  }

  const base =
    candidate.generator?.triggers ||
    candidate.generator?.regex ||
    candidate.triggers ||
    candidate.trigger ||
    candidate.regex
  if (!base) return []
  return toArray(base).map((entry) => `${entry}`.trim()).filter(Boolean)
}

function indentBlock(text = '', indent = '      ') {
  if (!text) return `${indent}...`
  return text
    .split('\n')
    .map((line) => `${indent}${line}`.replace(/\s+$/, ''))
    .join('\n')
}

function escapeYamlValue(value) {
  if (value === undefined || value === null) {
    return "''"
  }
  const string = `${value}`.trim()
  if (!string) {
    return "''"
  }
  return `'${string.replace(/'/g, "''")}'`
}

function buildStatusBarHtml(statData, options, aiNotes, metadata = {}) {
  if (!isObject(statData) || Object.keys(statData).length === 0) {
    return DEFAULT_ARTIFACTS.html
  }

  const flattened = flattenStatTree(statData)
  const primaryStats = selectPrimaryStats(flattened, 6)
  const { componentName, accentColor, layout, showTimestamp } = {
    ...DEFAULT_GENERATOR_OPTIONS,
    ...options,
  }

  const gut = layout === 'stacked' ? 'column' : 'row'
  const itemMarkup = primaryStats
    .map(
      (item) => `        <li class="mvu-stat-item">
          <span class="mvu-stat-label">${item.label}</span>
          <span class="mvu-stat-value" data-mvu-path="${item.path}" data-fallback="${item.label}">${item.macro}</span>
        </li>`
    )
    .join('\n')

  const descriptiveName = metadata?.title || metadata?.name || 'MVU Status Bar'
  const aiComment = aiNotes ? `\n<!-- AI Guidance:\n${aiNotes.split('\n').map((line) => `  ${line}`).join('\n')}\n-->` : ''

  return `<!-- ${descriptiveName}: generated with MVU code generator -->
<div class="mvu-status-bar" data-component="${componentName}" data-layout="${layout}">
  <header class="mvu-status-bar__header">
    <span class="mvu-status-bar__title" data-fallback="${descriptiveName}">{{get_message_variable::stat_data.status_label}}</span>
    ${
      showTimestamp
        ? '<span class="mvu-status-bar__timestamp" data-fallback="{{get_message_variable::clock.local_time}}">{{get_message_variable::stat_data.last_updated}}</span>'
        : ''
    }
  </header>
  <ul class="mvu-stat-list" role="list">
${itemMarkup || '    <li class="mvu-empty">{{get_message_variable::stat_data.summary}}</li>'}
  </ul>
</div>
<style>
  /* MVU doc guideline: 优先复用宏，通过样式约束表现而非创建新变量 */
  .mvu-status-bar {
    --accent: ${accentColor};
    display: flex;
    flex-direction: ${gut};
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 9999px;
    background: rgba(15, 23, 42, 0.72);
    color: #f8fafc;
    backdrop-filter: blur(16px);
    border: 1px solid rgba(148, 163, 184, 0.35);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.22);
    align-items: center;
  }

  .mvu-status-bar__header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .mvu-status-bar__title {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(226, 232, 240, 0.92);
  }

  .mvu-status-bar__timestamp {
    font-size: 0.7rem;
    color: rgba(226, 232, 240, 0.72);
  }

  .mvu-stat-list {
    display: flex;
    flex: 1;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
    flex-wrap: wrap;
  }

  .mvu-stat-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: rgba(15, 23, 42, 0.55);
    border-radius: 0.75rem;
    border: 1px solid rgba(96, 165, 250, 0.25);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    min-height: 2.25rem;
  }

  .mvu-stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(226, 232, 240, 0.85);
  }

  .mvu-stat-value {
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .mvu-status-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      border-radius: 1rem;
    }

    .mvu-stat-list {
      width: 100%;
      flex-direction: column;
    }

    .mvu-stat-item {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
<script type="module">
  // D1 Flow: 通过 MVU 宏读取状态，避免直接拼接本地常量
  export function renderStatusFallback(target = document.querySelector('[data-component="${componentName}"]')) {
    if (!target) return
    target.querySelectorAll('[data-fallback]').forEach((node) => {
      const rendered = (node.textContent || '').trim()
      if (!rendered) {
        node.textContent = node.dataset.fallback || ''
      }
    })
  }

  renderStatusFallback()
${aiNotes ? `  // AI guidance: ${aiNotes.replace(/\n/g, ' ').slice(0, 220)}\n` : ''}
</script>${aiComment}`
}

function buildWorldBookYaml(statData, options, aiNotes, metadata = {}, triggers = []) {
  if (!isObject(statData) || Object.keys(statData).length === 0) {
    return DEFAULT_ARTIFACTS.yaml
  }

  const flattened = flattenStatTree(statData)
  const primaryStats = selectPrimaryStats(flattened, 4)
  const timestamp = new Date().toISOString()
  const mergedOptions = {
    ...DEFAULT_GENERATOR_OPTIONS,
    ...options,
  }

  const noteLines = [
    '遵循 MVU 变量命名规范，优先复用 stat_data.* 宏读取状态。',
    `本条目指导酒馆助手输出 <${mergedOptions.statusTag}> 包裹的状态栏，用于 UI 渲染。`,
    '当变量缺失时提示用户刷新或回落到 {{get_message_variable::stat_data.summary}}。',
  ]

  if (aiNotes) {
    noteLines.push('AI 建议：', ...aiNotes.split('\n').map((line) => `- ${line}`))
  }

  const d0Lines = [
    '[D0::STATUS_BASELINE]',
    '- 始终以前台 Narrator 视角陈述状态栏，语气保持专业且温和。',
    '- 不得创造未注册的变量键，变量解释统一来源于 Metadata。',
    `- 关键变量入口：${primaryStats.map((item) => item.macro).join('、') || '{{get_message_variable::stat_data}}'}.`,
  ]

  const d1Lines = [
    '[D1::STATUS_ACTIVATION]',
    '- 收到玩家请求或内部刷新事件时执行 status_bar.render。',
    '- 先用 {{get_message_variable::stat_data.summary}} 总结，再逐项读取宏填充状态栏槽位。',
    '- 变量发生显著变化时附带变更原因，避免无限递归调用。',
    '- 如需新增槽位，先在变量定义中补充，再更新 UI 模板。',
    '',
    '主要槽位示例：',
    ...primaryStats.map((item) => `- ${item.label}: ${item.macro}`),
  ]

  const d4Lines = [
    '[D4::SAFETY_AND_ESCALATION]',
    '- 如果核心变量缺失或为 null，立即提示并停止渲染，避免输出错误信息。',
    '- 违反世界观或检测到越权变量调用时，使用 {{get_message_variable::support.escalation_channel}} 报告。',
    `- 输出必须保持 <${mergedOptions.statusTag}> 包裹，防止其他模块难以识别。`,
  ]

  const referenceSource = flattened.slice(0, 12).map((item) => item.macro)
  const referenceBlock = referenceSource.length
    ? referenceSource.map((macro) => `      - ${escapeYamlValue(macro)}`).join('\n')
    : `      - ${escapeYamlValue('{{get_message_variable::stat_data}}')}`

  const triggerSource = triggers.length ? triggers : DEFAULT_GENERATOR_OPTIONS.triggers
  const triggerBlock = triggerSource
    .map((pattern) => `      - pattern: ${escapeYamlValue(pattern)}`)
    .join('\n')

  const yamlLines = [
    '# Tavern world book entry generated via MVU code generator',
    'metadata:',
    `  title: ${escapeYamlValue(metadata.title || 'MVU 状态栏世界书')}`,
    `  version: ${escapeYamlValue(metadata.version || '0.1.0')}`,
    `  locale: ${escapeYamlValue(metadata.locale || 'zh-CN')}`,
    `  generatedAt: ${escapeYamlValue(timestamp)}`,
    'entries:',
    '  - id: status_bar.mvu',
    `    label: ${escapeYamlValue(metadata.label || '状态栏渲染准则')}`,
    '    category: status-bar',
    '    priority: 2',
    '    notes: |-',
    indentBlock(noteLines.join('\n')),
    '    d0: |-',
    indentBlock(d0Lines.join('\n')),
    '    d1: |-',
    indentBlock(d1Lines.join('\n')),
    '    d4: |-',
    indentBlock(d4Lines.join('\n')),
    '    references:',
    referenceBlock,
    '    triggers:',
    triggerBlock || `      - pattern: ${escapeYamlValue('status')}`,
  ]

  return yamlLines.join('\n')
}

function buildAssistantScript(statData, options, aiNotes) {
  if (!isObject(statData) || Object.keys(statData).length === 0) {
    return DEFAULT_ARTIFACTS.script
  }

  const flattened = flattenStatTree(statData)
  const primaryStats = selectPrimaryStats(flattened, 5)
  const mergedOptions = {
    ...DEFAULT_GENERATOR_OPTIONS,
    ...options,
  }

  const blockLines = [
    `<${mergedOptions.statusTag}>`,
    ...primaryStats.map((item) => `  • ${item.label}: ${item.macro}`),
    `  • 摘要: {{get_message_variable::stat_data.summary}}`,
    `</${mergedOptions.statusTag}>`,
  ]

  const comment = aiNotes
    ? aiNotes
        .split('\n')
        .map((line) => `# AI Guidance: ${line}`)
        .join('\n')
    : ''

  return [
    '# Tavern assistant 局部脚本模板，遵循 MVU 激活流程',
    "import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js'",
    '',
    '# D1: 及时刷新状态栏但避免递归触发',
    'macro status_bar.render {',
    "  const status = getvar('stat_data') ?? {}",
    "  const payload = [",
    ...blockLines.map((line) => `    '${line.replace(/'/g, "''")}',`),
    "  ].join('\\n')",
    '  emit(payload)',
    '}',
    '',
    '# 当玩家输入/剧情推进时刷新状态栏',
    'hook message::after_assistant_reply {',
    '  status_bar.render()',
    '}',
    '',
    '# 提供命令手动刷新，方便调试',
    'command /status.refresh {',
    '  status_bar.render()',
    "  return '状态栏已刷新'",
    '}',
    '',
    comment,
  ]
    .filter(Boolean)
    .join('\n')
}

function buildRegexSnippet(options, aiNotes) {
  const mergedOptions = {
    ...DEFAULT_GENERATOR_OPTIONS,
    ...options,
  }

  const statusTag = mergedOptions.statusTag
  const patterns = mergedOptions.triggers && mergedOptions.triggers.length > 0 ? mergedOptions.triggers : DEFAULT_GENERATOR_OPTIONS.triggers
  const escapedTag = statusTag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const blockPattern = `<${escapedTag}>[\\s\\S]*?<\\/${escapedTag}>`
  const noteLines = [
    '# Regex sieve: 拦截状态栏片段供 UI 或日志处理',
    `pattern = "${blockPattern}"`,
    `min_depth = ${Number.isFinite(mergedOptions.regexDepth) ? mergedOptions.regexDepth : DEFAULT_GENERATOR_OPTIONS.regexDepth}`,
    'max_consumption = 2048',
    'allow_overflow = false',
  ]

  const triggerLines = patterns.map((pattern) => `trigger = "${pattern.replace(/"/g, '\\"')}"`)
  const aiLine = aiNotes ? aiNotes.split('\n').map((line) => `# AI Guidance: ${line}`).join('\n') : ''

  return [
    '# MVU 状态栏触发配置',
    '[[regex.status_bar]]',
    ...noteLines,
    ...triggerLines,
    aiLine,
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * 将用户提供的变量对象整理为生成器所需的上下文。
 * @param {Record<string, any>} parsedVariables
 * @returns {{ statData: Record<string, any>, metadata: Record<string, any>, triggers: string[] }}
 */
export function normaliseVariablePayload(parsedVariables = {}) {
  if (!isObject(parsedVariables)) {
    return {
      statData: {},
      metadata: {},
      triggers: [],
    }
  }

  const statData = deriveStatData(parsedVariables)
  const metadata = deriveMetadata(parsedVariables)
  const triggers = deriveTriggers(parsedVariables)

  return {
    statData: isObject(statData) ? statData : {},
    metadata,
    triggers,
  }
}

/**
 * 生成包含 HTML、YAML、脚本与正则片段的代码产物。
 * @param {Object} params
 * @param {Record<string, any>} params.parsedVariables - 解析后的 MVU 变量对象。
 * @param {Record<string, any>} [params.userOptions] - 用户自定义选项，例如配色与布局。
 * @param {*} [params.aiAssistantGuidance] - 来自 AI 助手的建议文本，将作为注释保留。
 * @returns {{ html: string, yaml: string, script: string, regex: string, meta: { usedOptions: Record<string, any>, generatedAt: string } }}
 */
export function generateCodeArtifacts({ parsedVariables = {}, userOptions = {}, aiAssistantGuidance } = {}) {
  const notes = normaliseAiNotes(aiAssistantGuidance)
  const { statData, metadata, triggers } = normaliseVariablePayload(parsedVariables)

  if (!isObject(statData) || Object.keys(statData).length === 0) {
    return {
      ...DEFAULT_ARTIFACTS,
      meta: {
        generatedAt: new Date().toISOString(),
        usedOptions: { ...DEFAULT_GENERATOR_OPTIONS, ...userOptions },
      },
    }
  }

  const mergedOptions = {
    ...DEFAULT_GENERATOR_OPTIONS,
    ...userOptions,
  }

  const html = buildStatusBarHtml(statData, mergedOptions, notes, metadata)
  const yaml = buildWorldBookYaml(statData, mergedOptions, notes, metadata, triggers)
  const script = buildAssistantScript(statData, mergedOptions, notes)
  const regex = buildRegexSnippet(mergedOptions, notes)

  return {
    html,
    yaml,
    script,
    regex,
    meta: {
      generatedAt: new Date().toISOString(),
      usedOptions: mergedOptions,
    },
  }
}

/**
 * 收集 stat_data 下可用的宏路径，便于在 UI 中展示。
 * @param {Record<string, any>} statData
 * @param {number} [limit]
 * @returns {{ path: string, label: string, macro: string }[]}
 */
export function collectStatMacros(statData = {}, limit) {
  if (!isObject(statData) || Object.keys(statData).length === 0) {
    return []
  }

  const flattened = flattenStatTree(statData)
  if (!Number.isFinite(limit) || limit <= 0) {
    return flattened
  }

  return flattened.slice(0, limit)
}

export default {
  DEFAULT_GENERATOR_OPTIONS,
  generateCodeArtifacts,
  normaliseVariablePayload,
  collectStatMacros,
}
