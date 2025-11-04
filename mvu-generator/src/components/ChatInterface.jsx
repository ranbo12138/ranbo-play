import { useCallback, useMemo } from 'react'
import { useAppState } from '../context/AppStateContext.jsx'
import { collectStatMacros } from '../services/codeGenerator.js'

const formatTimestamp = (value) => {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const layoutOptions = [
  { value: 'compact', label: '紧凑排列' },
  { value: 'stacked', label: '垂直堆叠' },
]

const inputClass =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-inner transition focus:outline-none focus:ring-2 focus:ring-accent/40'
const selectClass =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-inner transition focus:outline-none focus:ring-2 focus:ring-accent/40'
const textareaClass =
  'min-h-[140px] rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-inner transition focus:outline-none focus:ring-2 focus:ring-accent/40'
const checkboxClass = 'h-4 w-4 rounded border border-border text-accent focus:ring-accent/40'

const ChatInterface = () => {
  const {
    state: { aiAssistantResponse, userOptions, statData, lastGeneratedAt, generationMeta, variableParseError },
    actions: { setAiAssistantResponse, updateUserOptions, generateCode },
  } = useAppState()

  const macroPreview = useMemo(() => collectStatMacros(statData, 8), [statData])
  const formattedGeneratedAt = lastGeneratedAt ? formatTimestamp(lastGeneratedAt) : '尚未生成'
  const statusMessage = variableParseError
    ? '⚠️ 当前 YAML 存在解析错误，将使用最近一次可用的变量快照生成代码。'
    : '变量解析正常，可直接生成状态栏代码。'

  const handleGuidanceChange = useCallback(
    (event) => {
      setAiAssistantResponse(event.target.value)
    },
    [setAiAssistantResponse],
  )

  const handleOptionChange = useCallback(
    (key, value) => {
      updateUserOptions({ [key]: value })
    },
    [updateUserOptions],
  )

  const handleRegexDepthChange = useCallback(
    (event) => {
      const next = Number.parseInt(event.target.value, 10)
      if (Number.isFinite(next)) {
        handleOptionChange('regexDepth', next)
      }
    },
    [handleOptionChange],
  )

  const handleGenerate = useCallback(() => {
    generateCode({})
  }, [generateCode])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">对话调试</h2>
        <span className="tag">Chat Ops</span>
      </div>
      <p className="text-sm text-muted">
        粘贴 AI 输出或自定义提示，引导代码生成器产出状态栏模板、世界书条目与 Tavern 脚本。
      </p>

      <div
        className={`rounded-lg border px-3 py-2 text-xs ${
          variableParseError
            ? 'border-red-300 bg-red-50/80 text-red-600'
            : 'border-accent/40 bg-accent/5 text-muted'
        }`}
      >
        {statusMessage}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          组件名称
          <input
            type="text"
            value={userOptions.componentName}
            onChange={(event) => handleOptionChange('componentName', event.target.value)}
            className={inputClass}
            placeholder="AuroraStatusBar"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          状态块标签
          <input
            type="text"
            value={userOptions.statusTag}
            onChange={(event) => handleOptionChange('statusTag', event.target.value)}
            className={inputClass}
            placeholder="status_block"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          主题色
          <input
            type="text"
            value={userOptions.accentColor}
            onChange={(event) => handleOptionChange('accentColor', event.target.value)}
            className={inputClass}
            placeholder="#38bdf8"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          布局方式
          <select
            value={userOptions.layout}
            onChange={(event) => handleOptionChange('layout', event.target.value)}
            className={selectClass}
          >
            {layoutOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-muted sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(userOptions.showTimestamp)}
            onChange={(event) => handleOptionChange('showTimestamp', event.target.checked)}
            className={checkboxClass}
          />
          <span>
            显示最近更新时间（缺省时回退至 {'{{get_message_variable::clock.local_time}}'} 宏）
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted sm:col-span-2">
          正则最小深度
          <input
            type="number"
            min="1"
            max="12"
            value={userOptions.regexDepth ?? 6}
            onChange={handleRegexDepthChange}
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1 text-xs font-medium text-muted">
        AI 建议（可选）
        <textarea
          value={aiAssistantResponse}
          onChange={handleGuidanceChange}
          placeholder="粘贴模型输出的分析或调优建议，生成代码时将以注释形式保留。"
          className={textareaClass}
        />
      </div>

      <div className="flex flex-col gap-2 text-xs text-muted">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>最近生成：{formattedGeneratedAt}</span>
          {isPlainObject(generationMeta?.usedOptions) && (
            <span>
              布局：{generationMeta.usedOptions.layout} · 主题色：{generationMeta.usedOptions.accentColor}
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            生成输出
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
          <span>宏预览</span>
          <span>{macroPreview.length} 项</span>
        </div>
        {macroPreview.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {macroPreview.map((item) => (
              <li key={item.path} className="rounded-lg border border-border/50 bg-surface/80 px-3 py-2 shadow-inner">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{item.label}</div>
                <code className="block text-sm text-foreground">{item.macro}</code>
              </li>
            ))}
          </ul>
        ) : (
          <div className="placeholder mt-2 min-h-[96px] text-xs">尚未检测到可用的 stat_data 宏</div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface
