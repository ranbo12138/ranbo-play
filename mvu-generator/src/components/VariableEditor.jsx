import { useCallback, useEffect, useMemo } from 'react'
import CodeEditor from './CodeEditor.jsx'
import { useAppState } from '../context/AppStateContext.jsx'

const DEBOUNCE_DELAY = 400
const PREVIEW_LIMIT = 8

const sanitizeInitVarContent = (input) => {
  if (typeof input !== 'string') {
    return ''
  }

  let value = input.replace(/\uFEFF/g, '')
  value = value.replace(/\r\n/g, '\n')
  value = value.replace(/```(?:yaml|yml)?/gi, '')
  value = value.replace(/```/g, '')
  value = value.replace(/^\s*\[initvar[^\]]*\]\s*$/gim, '')
  value = value.replace(/^---\s*$/gm, '')
  value = value.replace(/^:::.*$/gm, '')
  value = value.replace(/^\s*\/\/.*$/gm, '')
  value = value.trim()
  value = value.replace(/\n{3,}/g, '\n\n')

  return value
}

const VariableEditor = () => {
  const {
    state: { yamlText, parsed, parseError, templates, isDirty },
    actions: { setYamlText, validateYaml, replaceYaml, applyTemplate },
  } = useAppState()

  useEffect(() => {
    const timer = setTimeout(() => {
      validateYaml(yamlText)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [yamlText, validateYaml])

  const editorOptions = useMemo(
    () => ({
      lineNumbers: 'on',
      folding: true,
      rulers: [80],
    }),
    [],
  )

  const handleChange = useCallback(
    (nextValue) => {
      setYamlText(nextValue ?? '')
    },
    [setYamlText],
  )

  const handlePasteInitVar = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    const placeholder = templates?.initVar ?? templates?.starter ?? ''
    const userInput = window.prompt('请粘贴完整的 [initvar] 世界书条目内容：', placeholder)

    if (!userInput) {
      return
    }

    const sanitized = sanitizeInitVarContent(userInput)
    const finalValue = sanitized || placeholder || userInput.trim()

    replaceYaml(finalValue, { forceValidate: true })
  }, [replaceYaml, templates])

  const handleLoadSample = useCallback(() => {
    const applied = applyTemplate('sampleStatData')
    if (!applied && templates?.sampleStatData) {
      replaceYaml(templates.sampleStatData, { forceValidate: true })
    }
  }, [applyTemplate, replaceYaml, templates])

  const summary = parsed?.summary ?? { variableKeys: [], topLevelKeys: [], totalVariables: 0 }
  const topLevelKeys = Array.isArray(summary.topLevelKeys) ? summary.topLevelKeys : []
  const variableKeys = Array.isArray(summary.variableKeys) ? summary.variableKeys : []
  const previewKeys = variableKeys.slice(0, PREVIEW_LIMIT)
  const remainingCount = Math.max(0, variableKeys.length - previewKeys.length)
  const usesFallbackData = parsed?.source && parsed.source !== yamlText

  const validationStatus = useMemo(() => {
    if (parseError) {
      const prefix = parseError.type === 'validation' ? '校验问题' : '语法错误'
      const location =
        parseError.line != null
          ? `（行 ${parseError.line}${parseError.column != null ? `，列 ${parseError.column}` : ''}）`
          : ''
      return {
        tone: 'error',
        label: `${prefix}${location}`,
      }
    }

    if (isDirty) {
      return {
        tone: 'pending',
        label: '等待校验…',
      }
    }

    return {
      tone: 'success',
      label: '已通过校验',
    }
  }, [parseError, isDirty])

  const statusClassName = useMemo(() => {
    switch (validationStatus.tone) {
      case 'error':
        return 'border border-red-500/30 bg-red-500/10 text-red-500'
      case 'pending':
        return 'border border-amber-500/30 bg-amber-500/10 text-amber-600'
      default:
        return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
    }
  }, [validationStatus.tone])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="panel-title">变量编辑器</h2>
          <span className="tag">Variables</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName}`}>
            {validationStatus.label}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePasteInitVar}
              className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              粘贴 [initvar] 内容
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              加载示例 stat_data
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted">
        编排 MVU 所需的 <code className="font-mono text-foreground/80">stat_data</code> 变量结构。编辑内容会自动保存，并在成功解析后供其他面板使用。
      </p>

      {parseError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          <p className="font-medium">无法解析 YAML：{parseError.message}</p>
          {parseError.line != null && (
            <p className="mt-1 text-xs">
              位置：第 {parseError.line} 行{parseError.column != null ? `，第 ${parseError.column} 列` : ''}
            </p>
          )}
          {parseError.snippet && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-red-500/15 px-3 py-2 font-mono text-xs text-red-200">
              {parseError.snippet}
            </pre>
          )}
          {usesFallbackData && (
            <p className="mt-2 text-xs text-red-200">已保留上一次成功解析的变量数据，修复后会自动更新。</p>
          )}
        </div>
      )}

      <CodeEditor
        language="yaml"
        value={yamlText}
        onChange={handleChange}
        options={editorOptions}
        className={parseError ? 'ring-1 ring-red-400/70' : ''}
      />

      <div className="rounded-xl border border-border/70 bg-background/60 p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">变量概要</span>
          <span className="text-xs text-muted">共 {summary.totalVariables ?? variableKeys.length} 项变量</span>
        </div>

        {topLevelKeys.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {topLevelKeys.map((key) => (
              <span
                key={`top-${key}`}
                className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted shadow-inner shadow-border/10"
              >
                {key}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted">尚未检测到顶层变量节点。</p>
        )}

        {previewKeys.length > 0 && (
          <div className="mt-3 space-y-1.5 text-xs text-muted">
            {previewKeys.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                <span className="font-mono text-foreground/80">{key}</span>
              </div>
            ))}
            {remainingCount > 0 && <p className="pt-1 text-xs text-muted">… 还有 {remainingCount} 条变量路径</p>}
          </div>
        )}

        {variableKeys.length === 0 && (
          <p className="mt-3 text-xs text-muted">
            请输入有效的 YAML 内容，例如从示例中加载 <code className="font-mono">stat_data</code> 模板。
          </p>
        )}
      </div>
    </div>
  )
}

export default VariableEditor
