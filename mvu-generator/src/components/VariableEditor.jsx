import { useCallback, useMemo } from 'react'
import CodeEditor from './CodeEditor.jsx'
import { useAppState } from '../context/AppStateContext.jsx'

const formatTimestamp = (value) => {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const VariableEditor = () => {
  const {
    state: { variableSource, variableParseError, statData, lastParsedAt },
    actions: { updateVariableSource },
  } = useAppState()

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
      updateVariableSource(nextValue ?? '')
    },
    [updateVariableSource],
  )

  const statHighlights = useMemo(() => {
    if (!statData || typeof statData !== 'object') {
      return []
    }
    return Object.keys(statData).slice(0, 6)
  }, [statData])

  const parseStatus = variableParseError
    ? `解析错误：${variableParseError}`
    : lastParsedAt
    ? `上次解析：${formatTimestamp(lastParsedAt)}`
    : '尚未解析有效变量'

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">变量编辑器</h2>
        <span className="tag">变量</span>
      </div>
      <p className="text-sm text-muted">
        整理 MVU 所需的变量、状态与映射。未来将在此支持 YAML、TOML 及 JSON5 的互转与校验。
      </p>
      <div className="flex items-center justify-between text-xs text-muted">
        <span className={variableParseError ? 'text-red-500' : undefined}>{parseStatus}</span>
        {statHighlights.length > 0 ? (
          <span>stat_data 键：{statHighlights.join('、')}</span>
        ) : (
          <span>等待有效的 stat_data 结构</span>
        )}
      </div>
      <CodeEditor language="yaml" value={variableSource} onChange={handleChange} options={editorOptions} />
    </div>
  )
}

export default VariableEditor
