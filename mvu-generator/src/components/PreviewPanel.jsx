import { useMemo } from 'react'
import { useAppState } from '../context/AppStateContext.jsx'
import { collectStatMacros } from '../services/codeGenerator.js'

const stripScripts = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, '')

const serialiseValue = (value) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return `${value}`
  try {
    return JSON.stringify(value)
  } catch {
    return `${value}`
  }
}

const resolveStatValue = (statData, segments = []) => {
  if (!segments || segments.length === 0) {
    return ''
  }

  const tokens = segments[0] === 'stat_data' ? segments.slice(1) : segments
  return tokens.reduce((acc, token) => {
    if (acc === undefined || acc === null) {
      return ''
    }

    if (typeof token === 'number') {
      return Array.isArray(acc) ? acc[token] : ''
    }

    if (typeof acc === 'object') {
      return acc[token]
    }

    return ''
  }, statData)
}

const PreviewPanel = () => {
  const {
    state: { generatedArtifacts = {}, statData },
  } = useAppState()

  const htmlSource = generatedArtifacts.html ?? ''

  const macroBindings = useMemo(() => {
    const entries = collectStatMacros(statData, 6)
    return entries.map((item) => ({
      ...item,
      sample: serialiseValue(resolveStatValue(statData, item.segments)),
    }))
  }, [statData])

  const previewMarkup = useMemo(() => {
    if (!htmlSource) {
      return ''
    }

    const base = stripScripts(htmlSource)
    return macroBindings.reduce((acc, binding) => {
      if (!binding.sample) {
        return acc
      }
      return acc.replaceAll(binding.macro, binding.sample)
    }, base)
  }, [htmlSource, macroBindings])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">实时预览</h2>
        <span className="tag">Preview</span>
      </div>
      <p className="text-sm text-muted">
        基于当前 stat_data 变量快速预览状态栏呈现。宏会被示例值替换，但内联脚本不会在此运行。
      </p>
      <div className="rounded-xl border border-border bg-background/40 p-3 shadow-inner">
        {previewMarkup ? (
          <div
            className="rounded-lg border border-border/40 bg-surface px-4 py-5 text-sm text-foreground shadow"
            dangerouslySetInnerHTML={{ __html: previewMarkup }}
          />
        ) : (
          <div className="placeholder min-h-[200px] text-xs">生成 HTML 后可在此预览状态栏。</div>
        )}
      </div>
      <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">示例宏替换</div>
        {macroBindings.length > 0 ? (
          <ul className="mt-2 space-y-2 text-xs text-muted">
            {macroBindings.map((binding) => (
              <li key={binding.path} className="flex flex-col gap-1 rounded-lg border border-border/40 bg-surface/70 px-3 py-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{binding.label}</span>
                <code className="text-sm text-foreground">{binding.macro}</code>
                <span className="text-[11px] text-muted">示例值：{binding.sample || '（空）'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="placeholder mt-2 min-h-[80px] text-xs">暂无可展示的宏。</div>
        )}
      </div>
    </div>
  )
}

export default PreviewPanel
