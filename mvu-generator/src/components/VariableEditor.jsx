import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import CodeEditor from './CodeEditor.jsx'
import { useAppState } from '../context/AppStateContext.jsx'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'

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
    actions: { updateVariableSource, loadExampleVariables, pasteInitvarContent, resetVariables },
  } = useAppState()

  const [localValue, setLocalValue] = useState(variableSource)
  const [showPasteDialog, setShowPasteDialog] = useState(false)
  const [pasteContent, setPasteContent] = useState('')
  const fileInputRef = useRef(null)

  // Debounce the editor value to reduce parsing overhead
  const debouncedValue = useDebouncedValue(localValue, 400)

  // Update local state when external source changes
  const syncLocalValue = useCallback((newValue) => {
    setLocalValue(newValue)
  }, [])

  // Update context when debounced value changes
  const handleChange = useCallback(
    (nextValue) => {
      setLocalValue(nextValue ?? '')
    },
    [],
  )

  // Update context when debounced value changes
  const updateContext = useCallback(() => {
    if (debouncedValue !== variableSource) {
      updateVariableSource(debouncedValue)
    }
  }, [debouncedValue, variableSource, updateVariableSource])

  const editorOptions = useMemo(
    () => ({
      lineNumbers: 'on',
      folding: true,
      rulers: [80],
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
    }),
    [],
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

  const handleLoadExample = useCallback(() => {
    loadExampleVariables()
  }, [loadExampleVariables])

  const handlePasteInitvar = useCallback(() => {
    setShowPasteDialog(true)
    setPasteContent('')
  }, [])

  const handlePasteConfirm = useCallback(() => {
    if (pasteContent.trim()) {
      pasteInitvarContent(pasteContent)
      setShowPasteDialog(false)
      setPasteContent('')
    }
  }, [pasteContent, pasteInitvarContent])

  const handleReset = useCallback(() => {
    resetVariables()
    setLocalValue('')
  }, [resetVariables])

  const handleFileImport = useCallback((event) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (content) {
          setLocalValue(content)
        }
      }
      reader.readAsText(file)
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Update context when debounced value changes
  useEffect(() => {
    updateContext()
  }, [updateContext])

  // Sync local value when variableSource changes externally
  useEffect(() => {
    if (localValue !== variableSource) {
      syncLocalValue(variableSource)
    }
  }, [variableSource, localValue, syncLocalValue])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">变量编辑器</h2>
        <span className="tag">变量</span>
      </div>
      
      <p className="text-sm text-muted">
        整理 MVU 所需的变量、状态与映射。支持 YAML 格式，自动保存到本地存储。
      </p>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleLoadExample}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          加载示例变量
        </button>
        
        <button
          type="button"
          onClick={handlePasteInitvar}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          粘贴 initvar 内容
        </button>

        <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          导入文件
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.yaml,.yml"
            onChange={handleFileImport}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-red-500 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          重置
        </button>
      </div>

      {/* Status and Error Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className={variableParseError ? 'text-red-500 font-medium' : 'text-muted'}>
            {parseStatus}
          </span>
          {statHighlights.length > 0 ? (
            <span className="text-muted">stat_data 键：{statHighlights.join('、')}</span>
          ) : (
            <span className="text-muted">等待有效的 stat_data 结构</span>
          )}
        </div>

        {variableParseError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">YAML 解析错误</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{variableParseError}</p>
              </div>
            </div>
          </div>
        )}

        {lastParsedAt && !variableParseError && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-800 dark:text-green-200">
                解析成功！已识别 {statHighlights.length} 个变量键
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="flex-1 min-h-0">
        <CodeEditor 
          language="yaml" 
          value={localValue} 
          onChange={handleChange} 
          options={editorOptions} 
        />
      </div>

      {/* Paste Dialog */}
      {showPasteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">粘贴 initvar 内容</h3>
            <p className="text-sm text-muted mb-4">
              请粘贴从 TavernAI 复制的 initvar 内容，系统将自动清理格式并解析。
            </p>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className="w-full h-32 p-3 border border-border rounded-md bg-surface text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/60"
              placeholder="在此粘贴 initvar 内容..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowPasteDialog(false)}
                className="px-3 py-1.5 text-sm border border-border rounded-md hover:border-accent hover:text-accent transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handlePasteConfirm}
                disabled={!pasteContent.trim()}
                className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认粘贴
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VariableEditor
